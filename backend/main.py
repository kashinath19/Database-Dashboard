import os
import sys
import logging
import json
import csv
import io
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from functools import lru_cache
import asyncio

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy import create_engine, text, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from cachetools import TTLCache

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

# First Database (Resumes)
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Second Database (Prescreening)
DB_HOST2 = os.getenv("DB_HOST2")
DB_PORT2 = os.getenv("DB_PORT2")
DB_USER2 = os.getenv("DB_USER2")
DB_PASS2 = os.getenv("DB_PASS2")
DB_NAME2 = os.getenv("DB_NAME2")

# Third Database (Conversations)
DB_HOST3 = os.getenv("DB_HOST3")
DB_PORT3 = os.getenv("DB_PORT3")
DB_USER3 = os.getenv("DB_USER3")
DB_PASS3 = os.getenv("DB_PASS3")
DB_NAME3 = os.getenv("DB_NAME3")

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))

# Validate required environment variables
required_vars = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

logger.info("Application starting...")
logger.info(f"Database 1: {DB_NAME} at {DB_HOST}:{DB_PORT}")
logger.info(f"Database 2: {DB_NAME2} at {DB_HOST2}:{DB_PORT2}")
logger.info(f"Database 3: {DB_NAME3} at {DB_HOST3}:{DB_PORT3}")
logger.info(f"Server: {APP_HOST}:{APP_PORT}")

# =============================================
# CACHING SETUP
# =============================================

# Cache for stats endpoint (60 seconds TTL)
stats_cache = TTLCache(maxsize=100, ttl=60)

# Cache for column metadata (5 minutes TTL)
column_cache = TTLCache(maxsize=500, ttl=300)

# =============================================
# DATABASE SETUP WITH OPTIMIZED POOLING
# =============================================

# First Database (Resumes)
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# Second Database (Prescreening)
DB_URL2 = f"mysql+pymysql://{DB_USER2}:{DB_PASS2}@{DB_HOST2}:{DB_PORT2}/{DB_NAME2}?charset=utf8mb4"

# Third Database (Conversations)
DB_URL3 = f"mysql+pymysql://{DB_USER3}:{DB_PASS3}@{DB_HOST3}:{DB_PORT3}/{DB_NAME3}?charset=utf8mb4"

try:
    # OPTIMIZED CONNECTION POOLING
    pool_config = {
        "pool_size": 20,  # Increased from default 5
        "max_overflow": 40,  # Increased from default 10
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "echo": False,
        "pool_timeout": 30,
        "connect_args": {
            "connect_timeout": 10,
            "read_timeout": 30,
            "write_timeout": 30
        }
    }
    
    # First database engine
    engine = create_engine(DB_URL, **pool_config)
    
    # Second database engine
    engine2 = create_engine(DB_URL2, **pool_config)
    
    # Third database engine
    engine3 = create_engine(DB_URL3, **pool_config)
    
    # Test connections
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database 1 connection successful")
    
    with engine2.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database 2 connection successful")
    
    with engine3.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database 3 connection successful")
    
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    raise

# =============================================
# FASTAPI APPLICATION
# =============================================

app = FastAPI(
    title="Resumes & Prescreening & Conversations API",
    description="Read-only API for users, contacts, resumes, prescreening and conversations data",
    version="3.0.0"
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

@lru_cache(maxsize=1000)
def column_exists(table_name: str, column_name: str, db_name: str = "engine") -> bool:
    """Check if a column exists in a table - CACHED"""
    cache_key = f"{db_name}_{table_name}_{column_name}"
    
    if cache_key in column_cache:
        return column_cache[cache_key]
    
    try:
        db_engine = engine if db_name == "engine" else (engine2 if db_name == "engine2" else engine3)
        with db_engine.connect() as conn:
            result = conn.execute(
                text(f"""
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = :table_name 
                    AND column_name = :column_name
                """),
                {"table_name": table_name, "column_name": column_name}
            )
            exists = result.scalar() > 0
            column_cache[cache_key] = exists
            return exists
    except SQLAlchemyError:
        return False

def parse_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """Parse user data and compute auth_method"""
    if user.get('oauth_provider'):
        user['auth_method'] = user['oauth_provider']
    elif user.get('password_hash'):
        user['auth_method'] = 'email'
    else:
        user['auth_method'] = 'unknown'
    
    return user

def parse_conversations_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """Parse conversations user data and compute auth_method"""
    if user.get('oauth_provider'):
        user['auth_method'] = user['oauth_provider']
    elif user.get('password_hash'):
        user['auth_method'] = 'email'
    else:
        user['auth_method'] = 'unknown'
    
    # Compute is_oauth_user if not present
    if 'is_oauth_user' not in user:
        user['is_oauth_user'] = bool(user.get('oauth_provider'))
    
    return user

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
    
    if experience_from_json is not None:
        resume['experience'] = experience_from_json
    elif 'experience' in resume:
        pass
    
    return resume

def build_where_conditions(table_name: str, filters: Dict[str, Any]) -> tuple:
    """Build WHERE conditions and parameters for SQL query"""
    conditions = []
    params = {}
    
    for key, value in filters.items():
        if value is None:
            continue
            
        if key == 'search' and value:
            # Search across multiple columns based on table
            search_conditions = []
            if table_name == 'users':
                search_conditions.extend(["name LIKE :search", "email LIKE :search"])
            elif table_name == 'contacts':
                search_conditions.extend(["name LIKE :search", "email LIKE :search", "phone LIKE :search"])
            elif table_name == 'generated_resumes':
                search_conditions.append("resume_data LIKE :search")
            elif table_name in ['candidate', 'student_contact']:
                search_conditions.extend(["name LIKE :search", "email LIKE :search"])
            elif table_name == 'evaluation':
                search_conditions.extend(["evaluator_name LIKE :search", "candidate_name LIKE :search"])
            elif table_name == 'podcast_question':
                search_conditions.append("question_text LIKE :search")
            elif table_name == 'program_comment':
                search_conditions.append("comment_text LIKE :search")
            elif table_name == 'review_feedback':
                search_conditions.extend(["reviewer_name LIKE :search", "feedback_text LIKE :search"])
            elif table_name == 'conversations_users':
                search_conditions.extend(["username LIKE :search", "email LIKE :search", "name LIKE :search"])
            else:
                # Default search for unknown tables
                search_conditions.append("1=0")  # No results if we don't know the table
            
            if search_conditions:
                conditions.append(f"({' OR '.join(search_conditions)})")
                params['search'] = f"%{value}%"
        
        elif key == 'auth_method' and value:
            if value == 'email':
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
                
        elif key == 'subject' and value:
            conditions.append("subject LIKE :subject")
            params['subject'] = f"%{value}%"
            
        elif key == 'user_id' and value:
            conditions.append("user_id = :user_id")
            params['user_id'] = value
            
        elif key == 'candidate_id' and value:
            conditions.append("candidate_id = :candidate_id")
            params['candidate_id'] = value
            
        elif key == 'status' and value:
            conditions.append("status = :status")
            params['status'] = value
            
        elif key == 'program_id' and value:
            conditions.append("program_id = :program_id")
            params['program_id'] = value
            
        elif key == 'date_from' and value:
            conditions.append("created_at >= :date_from")
            params['date_from'] = value
            
        elif key == 'date_to' and value:
            conditions.append("created_at <= :date_to")
            params['date_to'] = value

        elif key == 'username' and value:
            conditions.append("username LIKE :username")
            params['username'] = f"%{value}%"

        elif key == 'email' and value:
            conditions.append("email LIKE :email")
            params['email'] = f"%{value}%"

        elif key == 'is_oauth_user' and value is not None:
            if value:
                conditions.append("is_oauth_user = TRUE")
            else:
                conditions.append("is_oauth_user = FALSE")
            
        # Handle dynamic column filters - UPDATED: Added exact match support
        elif key.startswith('filter_') and value:
            column_name = key.replace('filter_', '')
            # Skip column existence check for performance - let DB handle invalid columns
            if column_name.endswith('_id') or column_name == 'id':
                # Exact match for ID fields
                try:
                    # Try to convert to integer for ID fields
                    numeric_value = int(value)
                    conditions.append(f"`{column_name}` = :{key}")
                    params[key] = numeric_value
                except (ValueError, TypeError):
                    # If it's not a valid number, fall back to string comparison
                    conditions.append(f"`{column_name}` = :{key}")
                    params[key] = value
            else:
                # LIKE matching for text fields
                conditions.append(f"`{column_name}` LIKE :{key}")
                params[key] = f"%{value}%"
    
    return conditions, params

def execute_count_query(table_name: str, conditions: List[str], params: Dict[str, Any], db_engine=engine) -> int:
    """Execute count query for pagination"""
    try:
        with db_engine.connect() as conn:
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            count_query = text(f"SELECT COUNT(*) as total FROM `{table_name}` WHERE {where_clause}")
            result = conn.execute(count_query, params)
            return result.scalar()
    except SQLAlchemyError as e:
        logger.error(f"Count query failed for {table_name}: {str(e)}")
        return 0

def execute_data_query(table_name: str, conditions: List[str], params: Dict[str, Any], 
                      sort_by: str, sort_order: str, limit: int, offset: int, db_engine=engine) -> List[Dict[str, Any]]:
    """Execute data query with pagination and sorting"""
    try:
        with db_engine.connect() as conn:
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            # Default safe columns for sorting
            safe_columns = ['id', 'created_at', 'updated_at', 'name', 'email', 'phone', 'subject', 'status', 'score', 'username', 'last_login', 'timestamp']
            if sort_by not in safe_columns:
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
            
            if table_name == 'generated_resumes':
                rows = [parse_resume_data(row) for row in rows]
            elif table_name == 'users':
                rows = [parse_user_data(row) for row in rows]
            elif table_name == 'conversations_users':
                rows = [parse_conversations_user_data(row) for row in rows]
                
            return rows
    except SQLAlchemyError as e:
        logger.error(f"Data query failed for {table_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_db_engine_and_table(database: str, table: str):
    """Get the appropriate database engine and actual table name"""
    if database == 'resumes':
        db_engine = engine
        table_mapping = {
            'users': 'users',
            'contacts': 'contacts',
            'generated_resumes': 'generated_resumes'
        }
        actual_table_name = table_mapping.get(table, table)
    elif database == 'prescreening':
        db_engine = engine2
        table_mapping = {
            'candidates': 'candidate',
            'evaluations': 'evaluation',
            'podcast_questions': 'podcast_question',
            'program_comments': 'program_comment',
            'program_stats': 'program_stats',
            'review_feedbacks': 'review_feedback',
            'student_contacts': 'student_contact'
        }
        actual_table_name = table_mapping.get(table, table)
    elif database == 'conversations':
        db_engine = engine3
        table_mapping = {
            'users': 'users',
            'conversations': 'conversations',
            'messages': 'messages',
            'conversation_participants': 'conversation_participants'
        }
        actual_table_name = table_mapping.get(table, table)
    else:
        raise HTTPException(status_code=404, detail="Database not found")
    
    return db_engine, actual_table_name

# =============================================
# CSV EXPORT FUNCTION
# =============================================

def export_table_to_csv(database: str, table: str, filters: Dict[str, Any], sort_by: str, sort_order: str):
    """Export table data to CSV"""
    try:
        db_engine, actual_table_name = get_db_engine_and_table(database, table)
        
        # Build conditions for the query
        conditions, params = build_where_conditions(actual_table_name, filters)
        
        with db_engine.connect() as conn:
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            # Default safe columns for sorting
            safe_columns = ['id', 'created_at', 'updated_at', 'name', 'email', 'phone', 'subject', 'status', 'score', 'username', 'last_login']
            if sort_by not in safe_columns:
                sort_by = 'id'
            
            order_clause = f"`{sort_by}` {sort_order.upper()}" if sort_by else "id DESC"
            
            # Get all data (no pagination for export)
            query = text(f"""
                SELECT * FROM `{actual_table_name}` 
                WHERE {where_clause}
                ORDER BY {order_clause}
            """)
            
            result = conn.execute(query, params)
            rows = [dict(row._mapping) for row in result]
            
            # Apply data parsing
            if actual_table_name == 'generated_resumes':
                rows = [parse_resume_data(row) for row in rows]
            elif actual_table_name == 'users':
                rows = [parse_user_data(row) for row in rows]
            elif actual_table_name == 'conversations_users':
                rows = [parse_conversations_user_data(row) for row in rows]
            
            # Create CSV in memory
            output = io.StringIO()
            writer = csv.writer(output)
            
            if rows:
                # Write headers
                headers = rows[0].keys()
                writer.writerow(headers)
                
                # Write data rows
                for row in rows:
                    # Convert all values to strings and handle None values
                    writer.writerow([str(row.get(header, '')) if row.get(header) is not None else '' for header in headers])
            
            output.seek(0)
            
            # Return CSV content
            return output.getvalue()
            
    except SQLAlchemyError as e:
        logger.error(f"Export query failed for {database}.{table}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Export failed for {database}.{table}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

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
# CSV EXPORT ENDPOINT
# =============================================

@app.get("/api/export/{database}/{table}")
async def export_table_csv(
    database: str,
    table: str,
    request: Request,
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    auth_method: Optional[str] = Query(None),
    has_phone: Optional[bool] = Query(None),
    last_login: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    candidate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    program_id: Optional[int] = Query(None),
    username: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    is_oauth_user: Optional[bool] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Export table data to CSV with filtering"""
    try:
        # Build filters from query parameters
        filters = {
            'search': search,
            'auth_method': auth_method,
            'has_phone': has_phone,
            'last_login': last_login,
            'subject': subject,
            'user_id': user_id,
            'candidate_id': candidate_id,
            'status': status,
            'program_id': program_id,
            'username': username,
            'email': email,
            'is_oauth_user': is_oauth_user,
            'date_from': date_from,
            'date_to': date_to
        }
        
        # Add dynamic column filters
        for key, value in dict(request.query_params).items():
            if key.startswith('filter_') and value:
                filters[key] = value
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Generate CSV
        csv_content = export_table_to_csv(database, table, filters, sort_by, sort_order)
        
        # Return as downloadable CSV
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={database}_{table}_export.csv",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# =============================================
# DYNAMIC COLUMN FILTERING ENDPOINTS
# =============================================

@app.get("/database/{database}/{table}/columns")
def get_table_columns(database: str, table: str):
    """Get all columns for a specific table - CACHED"""
    cache_key = f"columns_{database}_{table}"
    
    if cache_key in column_cache:
        return column_cache[cache_key]
    
    try:
        db_engine, actual_table_name = get_db_engine_and_table(database, table)
        
        with db_engine.connect() as conn:
            # Get column information from information_schema
            query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = :table_name 
                ORDER BY ordinal_position
            """)
            result = conn.execute(query, {"table_name": actual_table_name})
            columns = [row[0] for row in result]
            
            column_cache[cache_key] = columns
            return columns
            
    except SQLAlchemyError as e:
        logger.error(f"Error fetching table columns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/database/{database}/{table}/columns/{column}/values")
def get_column_values(database: str, table: str, column: str, limit: int = Query(100, ge=1, le=1000)):
    """Get distinct values for a specific column - CACHED"""
    cache_key = f"values_{database}_{table}_{column}_{limit}"
    
    if cache_key in column_cache:
        return column_cache[cache_key]
    
    try:
        db_engine, actual_table_name = get_db_engine_and_table(database, table)
        
        with db_engine.connect() as conn:
            # Get distinct values for the column
            query = text(f"""
                SELECT DISTINCT `{column}` 
                FROM `{actual_table_name}` 
                WHERE `{column}` IS NOT NULL 
                AND `{column}` != ''
                ORDER BY `{column}`
                LIMIT :limit
            """)
            result = conn.execute(query, {"limit": limit})
            values = [row[0] for row in result]
            
            column_cache[cache_key] = values
            return values
            
    except SQLAlchemyError as e:
        logger.error(f"Error fetching column values: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# =============================================
# DATABASE 1 ENDPOINTS (RESUMES)
# =============================================

@app.get("/users")
def get_users(
    request: Request,
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
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
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
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    subject: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated contacts with filtering and sorting"""
    filters = {
        'search': search,
        'subject': subject,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
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
    request: Request,
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
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
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
# DATABASE 2 ENDPOINTS (PRESCREENING)
# =============================================

@app.get("/candidates")
def get_candidates(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated candidates with filtering and sorting"""
    filters = {
        'search': search,
        'status': status,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('candidate', filters)
    total_records = execute_count_query('candidate', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('candidate', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/evaluations")
def get_evaluations(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    candidate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated evaluations with filtering and sorting"""
    filters = {
        'search': search,
        'candidate_id': candidate_id,
        'status': status,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('evaluation', filters)
    total_records = execute_count_query('evaluation', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('evaluation', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/podcast_questions")
def get_podcast_questions(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated podcast questions with filtering and sorting"""
    filters = {
        'search': search,
        'status': status,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('podcast_question', filters)
    total_records = execute_count_query('podcast_question', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('podcast_question', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/program_comments")
def get_program_comments(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    program_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated program comments with filtering and sorting"""
    filters = {
        'search': search,
        'program_id': program_id,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('program_comment', filters)
    total_records = execute_count_query('program_comment', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('program_comment', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/program_stats")
def get_program_stats(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    program_id: Optional[int] = Query(None)
):
    """Get paginated program stats with filtering and sorting"""
    filters = {
        'program_id': program_id
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('program_stats', filters)
    total_records = execute_count_query('program_stats', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('program_stats', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/review_feedbacks")
def get_review_feedbacks(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    candidate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated review feedbacks with filtering and sorting"""
    filters = {
        'search': search,
        'candidate_id': candidate_id,
        'status': status,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('review_feedback', filters)
    total_records = execute_count_query('review_feedback', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('review_feedback', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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

@app.get("/student_contacts")
def get_student_contacts(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated student contacts with filtering and sorting"""
    filters = {
        'search': search,
        'status': status,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('student_contact', filters)
    total_records = execute_count_query('student_contact', conditions, params, engine2)
    
    offset = (page - 1) * limit
    data = execute_data_query('student_contact', conditions, params, sort_by, sort_order, limit, offset, engine2)
    
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
# DATABASE 3 ENDPOINTS (CONVERSATIONS)
# =============================================

@app.get("/conversations/users")
def get_conversations_users(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    username: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    auth_method: Optional[str] = Query(None),
    is_oauth_user: Optional[bool] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get paginated conversations users with filtering and sorting"""
    filters = {
        'search': search,
        'username': username,
        'email': email,
        'auth_method': auth_method,
        'is_oauth_user': is_oauth_user,
        'date_from': date_from,
        'date_to': date_to
    }
    
    # Add dynamic column filters
    for key, value in dict(request.query_params).items():
        if key.startswith('filter_') and value:
            filters[key] = value
    
    conditions, params = build_where_conditions('conversations_users', filters)
    total_records = execute_count_query('users', conditions, params, engine3)
    
    offset = (page - 1) * limit
    data = execute_data_query('users', conditions, params, sort_by, sort_order, limit, offset, engine3)
    
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
# SINGLE RECORD ENDPOINTS - DATABASE 1
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
# SINGLE RECORD ENDPOINTS - DATABASE 2
# =============================================

@app.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: int):
    """Get a single candidate by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM candidate WHERE id = :candidate_id"),
                {"candidate_id": candidate_id}
            )
            candidate = result.first()
            
            if not candidate:
                raise HTTPException(status_code=404, detail="Candidate not found")
            
            return dict(candidate._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: int):
    """Get a single evaluation by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM evaluation WHERE id = :evaluation_id"),
                {"evaluation_id": evaluation_id}
            )
            evaluation = result.first()
            
            if not evaluation:
                raise HTTPException(status_code=404, detail="Evaluation not found")
            
            return dict(evaluation._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/podcast_questions/{question_id}")
def get_podcast_question(question_id: int):
    """Get a single podcast question by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM podcast_question WHERE id = :question_id"),
                {"question_id": question_id}
            )
            question = result.first()
            
            if not question:
                raise HTTPException(status_code=404, detail="Podcast question not found")
            
            return dict(question._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/program_comments/{comment_id}")
def get_program_comment(comment_id: int):
    """Get a single program comment by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM program_comment WHERE id = :comment_id"),
                {"comment_id": comment_id}
            )
            comment = result.first()
            
            if not comment:
                raise HTTPException(status_code=404, detail="Program comment not found")
            
            return dict(comment._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/program_stats/{stat_id}")
def get_program_stat(stat_id: int):
    """Get a single program stat by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM program_stats WHERE id = :stat_id"),
                {"stat_id": stat_id}
            )
            stat = result.first()
            
            if not stat:
                raise HTTPException(status_code=404, detail="Program stat not found")
            
            return dict(stat._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/review_feedbacks/{feedback_id}")
def get_review_feedback(feedback_id: int):
    """Get a single review feedback by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM review_feedback WHERE id = :feedback_id"),
                {"feedback_id": feedback_id}
            )
            feedback = result.first()
            
            if not feedback:
                raise HTTPException(status_code=404, detail="Review feedback not found")
            
            return dict(feedback._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/student_contacts/{contact_id}")
def get_student_contact(contact_id: int):
    """Get a single student contact by ID"""
    try:
        with engine2.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM student_contact WHERE id = :contact_id"),
                {"contact_id": contact_id}
            )
            contact = result.first()
            
            if not contact:
                raise HTTPException(status_code=404, detail="Student contact not found")
            
            return dict(contact._mapping)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# SINGLE RECORD ENDPOINTS - DATABASE 3
# =============================================

@app.get("/conversations/users/{user_id}")
def get_conversations_user(user_id: int):
    """Get a single conversations user by ID"""
    try:
        with engine3.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            )
            user = result.first()
            
            if not user:
                raise HTTPException(status_code=404, detail="Conversations user not found")
            
            user_dict = dict(user._mapping)
            user_dict = parse_conversations_user_data(user_dict)
            
            return user_dict
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# RELATIONSHIP ENDPOINTS
# =============================================

@app.get("/users/{user_id}/resumes")
def get_user_resumes(user_id: int):
    """Get all resumes for a specific user"""
    try:
        with engine.connect() as conn:
            user_result = conn.execute(text("SELECT id FROM users WHERE id = :user_id"), {"user_id": user_id})
            if not user_result.first():
                raise HTTPException(status_code=404, detail="User not found")
            
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

@app.get("/candidates/{candidate_id}/evaluations")
def get_candidate_evaluations(candidate_id: int):
    """Get all evaluations for a specific candidate"""
    try:
        with engine2.connect() as conn:
            candidate_result = conn.execute(text("SELECT id FROM candidate WHERE id = :candidate_id"), {"candidate_id": candidate_id})
            if not candidate_result.first():
                raise HTTPException(status_code=404, detail="Candidate not found")
            
            evaluations_result = conn.execute(
                text("SELECT * FROM evaluation WHERE candidate_id = :candidate_id ORDER BY created_at DESC"),
                {"candidate_id": candidate_id}
            )
            evaluations = [dict(row._mapping) for row in evaluations_result]
            
            return {
                "candidate_id": candidate_id,
                "evaluations": evaluations,
                "count": len(evaluations)
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# STATISTICS ENDPOINT - OPTIMIZED WITH CACHING
# =============================================

@app.get("/database/stats")
def get_database_stats():
    """Get overall database statistics - CACHED for 60 seconds"""
    cache_key = "database_stats"
    
    # Check cache first
    if cache_key in stats_cache:
        return stats_cache[cache_key]
    
    try:
        stats = {
            "databases": {
                "resumes": {},
                "prescreening": {},
                "conversations": {}
            },
            "grand_total": 0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Database 1 stats
        with engine.connect() as conn:
            users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            contacts_count = conn.execute(text("SELECT COUNT(*) FROM contacts")).scalar()
            resumes_count = conn.execute(text("SELECT COUNT(*) FROM generated_resumes")).scalar()
            
            stats["databases"]["resumes"] = {
                "users": users_count,
                "contacts": contacts_count,
                "generated_resumes": resumes_count,
                "total": users_count + contacts_count + resumes_count
            }
            
        # Database 2 stats
        with engine2.connect() as conn:
            candidates_count = conn.execute(text("SELECT COUNT(*) FROM candidate")).scalar()
            evaluations_count = conn.execute(text("SELECT COUNT(*) FROM evaluation")).scalar()
            podcast_questions_count = conn.execute(text("SELECT COUNT(*) FROM podcast_question")).scalar()
            program_comments_count = conn.execute(text("SELECT COUNT(*) FROM program_comment")).scalar()
            program_stats_count = conn.execute(text("SELECT COUNT(*) FROM program_stats")).scalar()
            review_feedbacks_count = conn.execute(text("SELECT COUNT(*) FROM review_feedback")).scalar()
            student_contacts_count = conn.execute(text("SELECT COUNT(*) FROM student_contact")).scalar()
            
            stats["databases"]["prescreening"] = {
                "candidates": candidates_count,
                "evaluations": evaluations_count,
                "podcast_questions": podcast_questions_count,
                "program_comments": program_comments_count,
                "program_stats": program_stats_count,
                "review_feedbacks": review_feedbacks_count,
                "student_contacts": student_contacts_count,
                "total": (candidates_count + evaluations_count + podcast_questions_count + 
                         program_comments_count + program_stats_count + review_feedbacks_count + 
                         student_contacts_count)
            }
            
        # Database 3 stats
        with engine3.connect() as conn:
            conversations_users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            
            stats["databases"]["conversations"] = {
                "users": conversations_users_count,
                "total": conversations_users_count
            }
        
        # Calculate grand total
        stats["grand_total"] = (
            stats["databases"]["resumes"]["total"] +
            stats["databases"]["prescreening"]["total"] +
            stats["databases"]["conversations"]["total"]
        )
        
        # Cache the result
        stats_cache[cache_key] = stats
        
        return stats
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================
# SEARCH ENDPOINTS
# =============================================

@app.get("/search")
def search_all(
    q: str = Query(..., min_length=1),
    tables: str = Query("users,contacts,generated_resumes,candidates,evaluations,conversations_users")
):
    """Search across multiple tables"""
    try:
        table_list = [table.strip() for table in tables.split(',')]
        results = {}
        
        # Search in first database
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
                    text("SELECT * FROM contacts WHERE name LIKE :search OR email LIKE :search OR phone LIKE :search LIMIT 20"),
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
        
        # Search in second database
        with engine2.connect() as conn:
            if 'candidates' in table_list:
                candidates_result = conn.execute(
                    text("SELECT * FROM candidate WHERE name LIKE :search OR email LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                results['candidates'] = [dict(row._mapping) for row in candidates_result]
            
            if 'evaluations' in table_list:
                evaluations_result = conn.execute(
                    text("SELECT * FROM evaluation WHERE evaluator_name LIKE :search OR candidate_name LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                results['evaluations'] = [dict(row._mapping) for row in evaluations_result]
            
            if 'podcast_questions' in table_list:
                podcast_questions_result = conn.execute(
                    text("SELECT * FROM podcast_question WHERE question_text LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                results['podcast_questions'] = [dict(row._mapping) for row in podcast_questions_result]
        
        # Search in third database
        with engine3.connect() as conn:
            if 'conversations_users' in table_list:
                conversations_users_result = conn.execute(
                    text("SELECT * FROM users WHERE username LIKE :search OR email LIKE :search OR name LIKE :search LIMIT 20"),
                    {"search": f"%{q}%"}
                )
                conversations_users = [dict(row._mapping) for row in conversations_users_result]
                results['conversations_users'] = [parse_conversations_user_data(user) for user in conversations_users]
        
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
# HEALTH AND INFO ENDPOINTS
# =============================================

@app.get("/")
async def root():
    """API information"""
    return {
        "name": "Resumes & Prescreening & Conversations API",
        "version": "3.0.0",
        "description": "Optimized API with caching and connection pooling",
        "databases": {
            "database_1": "Resumes",
            "database_2": "prescreening_test",
            "database_3": "conversations"
        },
        "endpoints": {
            "database_1": {
                "users": "/users",
                "contacts": "/contacts", 
                "generated_resumes": "/generated_resumes"
            },
            "database_2": {
                "candidates": "/candidates",
                "evaluations": "/evaluations",
                "podcast_questions": "/podcast_questions",
                "program_comments": "/program_comments",
                "program_stats": "/program_stats",
                "review_feedbacks": "/review_feedbacks",
                "student_contacts": "/student_contacts"
            },
            "database_3": {
                "users": "/conversations/users"
            },
            "common": {
                "health": "/health",
                "stats": "/database/stats",
                "search": "/search",
                "export": "/api/export/{database}/{table}"
            }
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db1_status = "connected"
    except Exception as e:
        db1_status = f"error: {str(e)}"
    
    try:
        with engine2.connect() as conn:
            conn.execute(text("SELECT 1"))
        db2_status = "connected"
    except Exception as e:
        db2_status = f"error: {str(e)}"
    
    try:
        with engine3.connect() as conn:
            conn.execute(text("SELECT 1"))
        db3_status = "connected"
    except Exception as e:
        db3_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db1_status == "connected" and db2_status == "connected" and db3_status == "connected" else "degraded",
        "database_1": db1_status,
        "database_2": db2_status,
        "database_3": db3_status,
        "timestamp": datetime.now().isoformat()
    }

# =============================================
# DATABASE CHECK ENDPOINTS
# =============================================

@app.get("/check-db")
def check_db():
    """Check tables in both databases"""
    result = {}
    
    # Check first database
    with engine.connect() as conn:
        query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE();")
        db_result = conn.execute(query)
        result['database_1'] = [r[0] for r in db_result]
    
    # Check second database
    with engine2.connect() as conn:
        query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE();")
        db_result = conn.execute(query)
        result['database_2'] = [r[0] for r in db_result]
    
    # Check third database
    with engine3.connect() as conn:
        query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE();")
        db_result = conn.execute(query)
        result['database_3'] = [r[0] for r in db_result]
    
    return result

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
# FILTER OPTIONS ENDPOINT
# =============================================

@app.get("/filters/options")
def get_filter_options():
    """Get available filter options for frontend"""
    try:
        # Get auth methods from users
        with engine.connect() as conn:
            # Auth methods
            auth_result = conn.execute(text("""
                SELECT DISTINCT oauth_provider 
                FROM users 
                WHERE oauth_provider IS NOT NULL AND oauth_provider != ''
            """))
            auth_methods = [row[0] for row in auth_result]
            
            # Add 'email' as an auth method for users with password_hash
            email_count = conn.execute(text("SELECT COUNT(*) FROM users WHERE password_hash IS NOT NULL")).scalar()
            if email_count > 0 and 'email' not in auth_methods:
                auth_methods.append('email')
            
            # Chosen fields from contacts
            fields_result = conn.execute(text("""
                SELECT DISTINCT subject 
                FROM contacts 
                WHERE subject IS NOT NULL AND subject != ''
            """))
            chosen_fields = [row[0] for row in fields_result]
            
            # Experience range from resumes
            exp_result = conn.execute(text("""
                SELECT 
                    MIN(CAST(JSON_EXTRACT(resume_data, '$.experience') AS DECIMAL)) as min_exp,
                    MAX(CAST(JSON_EXTRACT(resume_data, '$.experience') AS DECIMAL)) as max_exp
                FROM generated_resumes 
                WHERE resume_data IS NOT NULL 
                AND JSON_EXTRACT(resume_data, '$.experience') IS NOT NULL
            """))
            exp_range = exp_result.first()
            
            experience_range = {
                "min": float(exp_range[0]) if exp_range[0] is not None else 0,
                "max": float(exp_range[1]) if exp_range[1] is not None else 10
            }
            
        return {
            "authMethods": auth_methods,
            "chosenFields": chosen_fields,
            "experienceRange": experience_range
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Filter options error: {str(e)}")
        return {
            "authMethods": [],
            "chosenFields": [],
            "experienceRange": {"min": 0, "max": 10}
        }

# =============================================
# STARTUP/SHUTDOWN EVENTS
# =============================================

@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("OPTIMIZED API Server Started")
    logger.info(f"Docs available at: http://{APP_HOST}:{APP_PORT}/docs")
    logger.info("Features: Connection Pooling, Caching, Optimized Queries")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown():
    logger.info("API Server Shutting Down")
    # Cleanup
    stats_cache.clear()
    column_cache.clear()

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
        log_config=None,
        workers=4  # Enable multiple workers for production
    )