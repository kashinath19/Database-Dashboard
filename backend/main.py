import os
import sys
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# =============================================
# LOGGING CONFIGURATION
# =============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

logger = logging.getLogger(__name__)

# =============================================
# LOAD ENVIRONMENT VARIABLES
# =============================================

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))

# Validate required environment variables
required_vars = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

logger.info("Application starting...")
logger.info(f"Database: {DB_NAME} at {DB_HOST}:{DB_PORT}")
logger.info(f"Server: {APP_HOST}:{APP_PORT}")

# =============================================
# DATABASE SETUP
# =============================================

DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

try:
    engine = create_engine(
        DB_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful")
    
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    raise

# =============================================
# FASTAPI APPLICATION
# =============================================

app = FastAPI(
    title="Resumes API",
    description="Read-only API for users, contacts and resumes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# =============================================
# HELPER FUNCTIONS
# =============================================

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text(f"""
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = :table_name 
                    AND column_name = :column_name
                """),
                {"table_name": table_name, "column_name": column_name}
            )
            return result.scalar() > 0
    except SQLAlchemyError:
        return False

def parse_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """Parse user data and compute auth_method"""
    # Compute auth_method based on oauth_provider and password_hash
    if user.get('oauth_provider'):
        user['auth_method'] = user['oauth_provider']
    elif user.get('password_hash'):
        user['auth_method'] = 'email'
    else:
        user['auth_method'] = 'unknown'
    
    return user

def build_where_conditions(table_name: str, filters: Dict[str, Any]) -> tuple:
    """Build WHERE conditions and parameters for SQL query"""
    conditions = []
    params = {}
    
    for key, value in filters.items():
        if value is None:
            continue
            
        if key == 'search' and value:
            if table_name == 'users':
                conditions.append("(name LIKE :search OR email LIKE :search)")
                params['search'] = f"%{value}%"
            elif table_name == 'contacts':
                conditions.append("(full_name LIKE :search OR email LIKE :search OR phone LIKE :search)")
                params['search'] = f"%{value}%"
            elif table_name == 'generated_resumes':
                conditions.append("resume_data LIKE :search")
                params['search'] = f"%{value}%"
        
        elif key == 'auth_method' and value:
            # FIXED: Use oauth_provider instead of auth_method
            if value == 'email':
                # Email auth users have oauth_provider IS NULL and password_hash IS NOT NULL
                conditions.append("(oauth_provider IS NULL AND password_hash IS NOT NULL)")
            else:
                conditions.append("oauth_provider = :auth_method")
                params['auth_method'] = value
            
        elif key == 'has_phone' and value is not None:
            if value:
                conditions.append("phone IS NOT NULL AND phone != ''")
            else:
                conditions.append("(phone IS NULL OR phone = '')")
                
        elif key == 'last_login' and value:
            if value == 'never':
                conditions.append("last_login IS NULL")
            elif value == 'recent':
                conditions.append("last_login >= :recent_date")
                params['recent_date'] = datetime.now() - timedelta(days=30)
                
        elif key == 'chosen_field' and value:
            # FIXED: Support partial matching for chosen_field
            conditions.append("chosen_field LIKE :chosen_field")
            params['chosen_field'] = f"%{value}%"
            
        elif key == 'user_id' and value:
            conditions.append("user_id = :user_id")
            params['user_id'] = value
            
        elif key == 'date_from' and value:
            conditions.append("created_at >= :date_from")
            params['date_from'] = value
            
        elif key == 'date_to' and value:
            conditions.append("created_at <= :date_to")
            params['date_to'] = value
    
    return conditions, params

def parse_resume_data(resume: Dict[str, Any]) -> Dict[str, Any]:
    """Parse JSON resume_data field and use experience from actual resume data"""
    experience_from_json = None
    
    if resume.get('resume_data'):
        try:
            parsed_data = json.loads(resume['resume_data'])
            resume['resume_data'] = parsed_data
            experience_from_json = parsed_data.get('experience')
        except (json.JSONDecodeError, TypeError):
            resume['resume_data'] = {}
    else:
        resume['resume_data'] = {}
    
    # Use experience from JSON data instead of top-level database column
    if experience_from_json is not None:
        resume['experience'] = experience_from_json
    elif 'experience' in resume:
        # If no experience in JSON but top-level exists, keep it as is
        pass
    
    return resume

def execute_count_query(table_name: str, conditions: List[str], params: Dict[str, Any]) -> int:
    """Execute count query for pagination"""
    try:
        with engine.connect() as conn:
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            count_query = text(f"SELECT COUNT(*) as total FROM `{table_name}` WHERE {where_clause}")
            result = conn.execute(count_query, params)
            return result.scalar()
    except SQLAlchemyError as e:
        logger.error(f"Count query failed: {str(e)}")
        return 0

def execute_data_query(table_name: str, conditions: List[str], params: Dict[str, Any], 
                      sort_by: str, sort_order: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    """Execute data query with pagination and sorting"""
    try:
        with engine.connect() as conn:
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            # Validate sort_by column exists
            valid_sort_columns = ['id', 'created_at', 'updated_at', 'name', 'email', 'full_name', 'chosen_field']
            if sort_by not in valid_sort_columns and not column_exists(table_name, sort_by):
                sort_by = 'id'
            
            order_clause = f"`{sort_by}` {sort_order.upper()}" if sort_by else "id DESC"
            
            query = text(f"""
                SELECT * FROM `{table_name}` 
                WHERE {where_clause}
                ORDER BY {order_clause}
                LIMIT :limit OFFSET :offset
            """)
            
            params.update({'limit': limit, 'offset': offset})
            result = conn.execute(query, params)
            rows = [dict(row._mapping) for row in result]
            
            # Parse data for specific tables
            if table_name == 'generated_resumes':
                rows = [parse_resume_data(row) for row in rows]
            elif table_name == 'users':
                rows = [parse_user_data(row) for row in rows]
                
            return rows
    except SQLAlchemyError as e:
        logger.error(f"Data query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# REQUEST LOGGING MIDDLEWARE
# =============================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now()
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        duration = (datetime.now() - start).total_seconds() * 1000
        logger.info(f"Response: {response.status_code} ({duration:.2f}ms)")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise

# =============================================
# PAGINATED ENDPOINTS
# =============================================

@app.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    auth_method: Optional[str] = Query(None),
    has_phone: Optional[bool] = Query(None),
    last_login: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated users with filtering and sorting"""
    filters = {
        'search': search,
        'auth_method': auth_method,
        'has_phone': has_phone,
        'last_login': last_login,
        'date_from': date_from,
        'date_to': date_to
    }
    
    conditions, params = build_where_conditions('users', filters)
    total_records = execute_count_query('users', conditions, params)
    
    offset = (page - 1) * limit
    data = execute_data_query('users', conditions, params, sort_by, sort_order, limit, offset)
    
    total_pages = (total_records + limit - 1) // limit if total_records > 0 else 1
    
    return {
        "data": data,
        "pagination": {
            "current_page": page,
            "per_page": limit,
            "total_records": total_records,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@app.get("/contacts")
def get_contacts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    chosen_field: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated contacts with filtering and sorting"""
    filters = {
        'search': search,
        'chosen_field': chosen_field,
        'date_from': date_from,
        'date_to': date_to
    }
    
    conditions, params = build_where_conditions('contacts', filters)
    total_records = execute_count_query('contacts', conditions, params)
    
    offset = (page - 1) * limit
    data = execute_data_query('contacts', conditions, params, sort_by, sort_order, limit, offset)
    
    total_pages = (total_records + limit - 1) // limit if total_records > 0 else 1
    
    return {
        "data": data,
        "pagination": {
            "current_page": page,
            "per_page": limit,
            "total_records": total_records,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@app.get("/generated_resumes")
def get_generated_resumes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    user_id: Optional[int] = Query(None)
):
    """Get paginated resumes with filtering and sorting"""
    filters = {
        'search': search,
        'user_id': user_id
    }
    
    conditions, params = build_where_conditions('generated_resumes', filters)
    total_records = execute_count_query('generated_resumes', conditions, params)
    
    offset = (page - 1) * limit
    data = execute_data_query('generated_resumes', conditions, params, sort_by, sort_order, limit, offset)
    
    total_pages = (total_records + limit - 1) // limit if total_records > 0 else 1
    
    return {
        "data": data,
        "pagination": {
            "current_page": page,
            "per_page": limit,
            "total_records": total_records,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

# =============================================
# RELATIONSHIP ENDPOINTS
# =============================================

@app.get("/users/{user_id}/resumes")
def get_user_resumes(user_id: int):
    """Get all resumes for a specific user"""
    try:
        with engine.connect() as conn:
            # Verify user exists
            user_result = conn.execute(text("SELECT id FROM users WHERE id = :user_id"), {"user_id": user_id})
            if not user_result.first():
                raise HTTPException(status_code=404, detail="User not found")
            
            # Get resumes
            resumes_result = conn.execute(
                text("SELECT * FROM generated_resumes WHERE user_id = :user_id ORDER BY created_at DESC"),
                {"user_id": user_id}
            )
            resumes = [dict(row._mapping) for row in resumes_result]
            resumes = [parse_resume_data(resume) for resume in resumes]
            
            return {
                "user_id": user_id,
                "resumes": resumes,
                "count": len(resumes)
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/generated_resumes/{resume_id}/user")
def get_resume_user(resume_id: int):
    """Get user information for a specific resume"""
    try:
        with engine.connect() as conn:
            # Get resume and user_id
            resume_result = conn.execute(
                text("SELECT * FROM generated_resumes WHERE id = :resume_id"),
                {"resume_id": resume_id}
            )
            resume = resume_result.first()
            
            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            
            resume_dict = dict(resume._mapping)
            resume_dict = parse_resume_data(resume_dict)
            
            # Get user
            user_result = conn.execute(
                text("SELECT * FROM users WHERE id = :user_id"),
                {"user_id": resume_dict['user_id']}
            )
            user = user_result.first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found for this resume")
            
            user_dict = dict(user._mapping)
            user_dict = parse_user_data(user_dict)
            
            return {
                "resume": resume_dict,
                "user": user_dict
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/users/{user_id}/stats")
def get_user_stats(user_id: int):
    """Get statistics for a specific user"""
    try:
        with engine.connect() as conn:
            # Verify user exists
            user_result = conn.execute(text("SELECT * FROM users WHERE id = :user_id"), {"user_id": user_id})
            user = user_result.first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_dict = dict(user._mapping)
            user_dict = parse_user_data(user_dict)
            
            # Get resume count
            resume_count_result = conn.execute(
                text("SELECT COUNT(*) as count FROM generated_resumes WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            resume_count = resume_count_result.scalar()
            
            # Get latest resume date
            latest_resume_result = conn.execute(
                text("SELECT MAX(created_at) as latest FROM generated_resumes WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            latest_resume = latest_resume_result.scalar()
            
            return {
                "user_id": user_id,
                "resume_count": resume_count,
                "latest_resume_date": latest_resume.isoformat() if latest_resume else None,
                "has_phone": bool(user_dict.get('phone')),
                "last_login": user_dict.get('last_login'),
                "auth_method": user_dict.get('auth_method', 'unknown')
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# STATISTICS ENDPOINTS
# =============================================

@app.get("/database/stats")
def get_database_stats():
    """Get overall database statistics"""
    try:
        with engine.connect() as conn:
            # Table counts
            users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            contacts_count = conn.execute(text("SELECT COUNT(*) FROM contacts")).scalar()
            resumes_count = conn.execute(text("SELECT COUNT(*) FROM generated_resumes")).scalar()
            
            # Database info
            db_info_result = conn.execute(text("SELECT DATABASE() as db_name"))
            db_name = db_info_result.scalar()
            
            return {
                "database_name": db_name,
                "table_stats": {
                    "users": users_count,
                    "contacts": contacts_count,
                    "generated_resumes": resumes_count
                },
                "total_records": users_count + contacts_count + resumes_count,
                "timestamp": datetime.now().isoformat()
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/database/relationships")
def get_database_relationships():
    """Get foreign key relationships information"""
    try:
        with engine.connect() as conn:
            relationships = {
                "generated_resumes": {
                    "user_id": {
                        "references": "users.id",
                        "description": "Resumes belong to users"
                    }
                }
            }
            
            return {
                "relationships": relationships,
                "notes": "Foreign key: generated_resumes.user_id → users.id"
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/stats/global")
def get_global_stats():
    """Get global statistics"""
    try:
        with engine.connect() as conn:
            # Total counts
            users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            contacts_count = conn.execute(text("SELECT COUNT(*) FROM contacts")).scalar()
            resumes_count = conn.execute(text("SELECT COUNT(*) FROM generated_resumes")).scalar()
            
            # Users with resumes
            users_with_resumes = conn.execute(
                text("SELECT COUNT(DISTINCT user_id) FROM generated_resumes")
            ).scalar()
            
            return {
                "total_users": users_count,
                "total_contacts": contacts_count,
                "total_resumes": resumes_count,
                "users_with_resumes": users_with_resumes,
                "resumes_per_user": round(resumes_count / max(users_with_resumes, 1), 1)
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/stats/users")
def get_users_stats():
    """Get users statistics"""
    try:
        with engine.connect() as conn:
            # FIXED: Auth method distribution using oauth_provider and password_hash
            auth_stats_result = conn.execute(
                text("""
                    SELECT 
                        CASE 
                            WHEN oauth_provider IS NOT NULL THEN oauth_provider
                            WHEN password_hash IS NOT NULL THEN 'email'
                            ELSE 'unknown'
                        END as auth_method,
                        COUNT(*) as count 
                    FROM users 
                    GROUP BY 
                        CASE 
                            WHEN oauth_provider IS NOT NULL THEN oauth_provider
                            WHEN password_hash IS NOT NULL THEN 'email'
                            ELSE 'unknown'
                        END
                """)
            )
            auth_distribution = {row.auth_method: row.count for row in auth_stats_result}
            
            # Active users (logged in last 30 days) - check if last_login column exists
            active_users = 0
            if column_exists('users', 'last_login'):
                active_users = conn.execute(
                    text("SELECT COUNT(*) FROM users WHERE last_login >= :recent_date"),
                    {"recent_date": datetime.now() - timedelta(days=30)}
                ).scalar()
            
            # Users with phone
            users_with_phone = conn.execute(
                text("SELECT COUNT(*) FROM users WHERE phone IS NOT NULL AND phone != ''")
            ).scalar()
            
            total_users = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            
            return {
                "total_users": total_users,
                "auth_method_distribution": auth_distribution,
                "active_users": active_users,
                "inactive_users": total_users - active_users,
                "users_with_phone": users_with_phone,
                "users_without_phone": total_users - users_with_phone
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/stats/contacts")
def get_contacts_stats():
    """Get contacts statistics"""
    try:
        with engine.connect() as conn:
            # Field distribution
            field_stats_result = conn.execute(
                text("SELECT chosen_field, COUNT(*) as count FROM contacts GROUP BY chosen_field")
            )
            field_distribution = {row.chosen_field: row.count for row in field_stats_result}
            
            # Date range
            date_range_result = conn.execute(
                text("SELECT MIN(created_at) as min_date, MAX(created_at) as max_date FROM contacts")
            )
            date_range = date_range_result.first()
            
            total_contacts = conn.execute(text("SELECT COUNT(*) FROM contacts")).scalar()
            
            return {
                "total_contacts": total_contacts,
                "field_distribution": field_distribution,
                "date_range": {
                    "oldest": date_range.min_date.isoformat() if date_range.min_date else None,
                    "newest": date_range.max_date.isoformat() if date_range.max_date else None
                }
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/stats/resumes")
def get_resumes_stats():
    """Get resumes statistics"""
    try:
        with engine.connect() as conn:
            # Users with resumes
            users_with_resumes = conn.execute(
                text("SELECT COUNT(DISTINCT user_id) FROM generated_resumes")
            ).scalar()
            
            total_resumes = conn.execute(text("SELECT COUNT(*) FROM generated_resumes")).scalar()
            
            return {
                "total_resumes": total_resumes,
                "users_with_resumes": users_with_resumes,
                "resumes_per_user": round(total_resumes / max(users_with_resumes, 1), 1)
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# SEARCH ENDPOINT
# =============================================

@app.get("/search")
def search_all(
    q: str = Query(..., min_length=1),
    tables: str = Query("users,contacts,resumes")
):
    """Search across multiple tables"""
    try:
        table_list = [table.strip() for table in tables.split(',')]
        results = {}
        
        with engine.connect() as conn:
            if 'users' in table_list:
                users_result = conn.execute(
                    text("SELECT * FROM users WHERE name LIKE :search OR email LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                users = [dict(row._mapping) for row in users_result]
                results['users'] = [parse_user_data(user) for user in users]
            
            if 'contacts' in table_list:
                contacts_result = conn.execute(
                    text("SELECT * FROM contacts WHERE full_name LIKE :search OR email LIKE :search OR phone LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                results['contacts'] = [dict(row._mapping) for row in contacts_result]
            
            if 'resumes' in table_list:
                resumes_result = conn.execute(
                    text("SELECT * FROM generated_resumes WHERE resume_data LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                resumes = [dict(row._mapping) for row in resumes_result]
                results['resumes'] = [parse_resume_data(resume) for resume in resumes]
        
        # Count total results
        total_results = sum(len(results[table]) for table in results)
        
        return {
            "query": q,
            "tables_searched": table_list,
            "total_results": total_results,
            "results": results
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

# =============================================
# SINGLE RECORD ENDPOINTS
# =============================================

@app.get("/users/{user_id}")
def get_user(user_id: int):
    """Get a single user by ID"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            )
            user = result.first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_dict = dict(user._mapping)
            user_dict = parse_user_data(user_dict)
            
            return user_dict
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/contacts/{contact_id}")
def get_contact(contact_id: int):
    """Get a single contact by ID"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM contacts WHERE id = :contact_id"),
                {"contact_id": contact_id}
            )
            contact = result.first()
            
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found")
            
            return dict(contact._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/generated_resumes/{resume_id}")
def get_resume(resume_id: int):
    """Get a single resume by ID"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM generated_resumes WHERE id = :resume_id"),
                {"resume_id": resume_id}
            )
            resume = result.first()
            
            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            
            resume_dict = dict(resume._mapping)
            resume_dict = parse_resume_data(resume_dict)
            
            return resume_dict
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# EXISTING ENDPOINTS
# =============================================

@app.get("/")
async def root():
    """API information"""
    return {
        "name": "Resumes API",
        "version": "1.0.0",
        "endpoints": {
            "users": "/users",
            "contacts": "/contacts", 
            "generated_resumes": "/generated_resumes",
            "health": "/health",
            "stats": "/stats/global",
            "search": "/search",
            "relationships": {
                "user_resumes": "/users/{id}/resumes",
                "resume_user": "/generated_resumes/{id}/user",
                "user_stats": "/users/{id}/stats"
            }
        }
    }


# Add this to main.py after the existing endpoints

@app.get("/filters/options")
def get_filter_options():
    """Get available filter options for all tables"""
    try:
        with engine.connect() as conn:
            # Get auth methods from users
            auth_methods_result = conn.execute(
                text("""
                    SELECT DISTINCT 
                        CASE 
                            WHEN oauth_provider IS NOT NULL THEN oauth_provider
                            WHEN password_hash IS NOT NULL THEN 'email'
                            ELSE 'unknown'
                        END as auth_method
                    FROM users 
                    WHERE oauth_provider IS NOT NULL OR password_hash IS NOT NULL
                """)
            )
            auth_methods = [row.auth_method for row in auth_methods_result if row.auth_method]
            
            # Get chosen fields from contacts
            chosen_fields_result = conn.execute(
                text("SELECT DISTINCT chosen_field FROM contacts WHERE chosen_field IS NOT NULL AND chosen_field != ''")
            )
            chosen_fields = [row.chosen_field for row in chosen_fields_result if row.chosen_field]
            
            # Get experience range from resumes
            experience_range_result = conn.execute(
                text("""
                    SELECT 
                        MIN(CAST(JSON_EXTRACT(resume_data, '$.experience') AS DECIMAL)) as min_exp,
                        MAX(CAST(JSON_EXTRACT(resume_data, '$.experience') AS DECIMAL)) as max_exp
                    FROM generated_resumes 
                    WHERE resume_data IS NOT NULL 
                    AND JSON_EXTRACT(resume_data, '$.experience') IS NOT NULL
                """)
            )
            exp_range = experience_range_result.first()
            
            return {
                "auth_methods": auth_methods,
                "chosen_fields": chosen_fields,
                "experience_range": {
                    "min": float(exp_range.min_exp) if exp_range.min_exp else 0,
                    "max": float(exp_range.max_exp) if exp_range.max_exp else 50
                }
            }
    except SQLAlchemyError as e:
        logger.error(f"Filter options error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Filter options error: {str(e)}")
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# =============================================
# EXCEPTION HANDLER
# =============================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {type(exc).__name__} - {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# =============================================
# STARTUP/SHUTDOWN EVENTS
# =============================================

@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("API Server Started")
    logger.info(f"Docs available at: http://{APP_HOST}:{APP_PORT}/docs")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown():
    logger.info("API Server Shutting Down")

# =============================================
# RUN APPLICATION
# =============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=True,
        log_config=None
    )
