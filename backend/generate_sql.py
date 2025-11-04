# This is the full and complete code to generate the requested data file.

import faker
import random
import datetime

# Initialize Faker to create realistic fake data
fake = faker.Faker()

# --- Configuration ---
NUM_RECORDS = 400
START_ID = 7  # Start after your last example ID (which was 4)
FILENAME = "seed_users.sql"
# ---------------------

sql_content = "INSERT INTO `users` (`id`, `email`, `name`, `password_hash`, `oauth_provider`, `oauth_id`, `profile_image`, `created_at`, `last_login`, `phone`)\nVALUES\n"

records = []

print(f"Generating {NUM_RECORDS} records...")

# Loop to create each record
for i in range(NUM_RECORDS):
    current_id = START_ID + i
    
    # Escape single quotes in names (e.g., "O'Brien" -> "O''Brien")
    name = fake.name().replace("'", "''") 
    email = fake.email()

    # --- Logic for different user types ---
    # Adjust weights as needed (e.g., 60% password, 20% google, 20% facebook)
    user_type = random.choice(['password', 'password', 'password', 'google', 'facebook'])
    
    password_hash = 'NULL'
    oauth_provider = 'NULL'
    oauth_id = 'NULL'

    if user_type == 'password':
        # Generate a plausible-looking (but fake) bcrypt hash
        password_hash = f"'$2b$12${fake.password(length=53, special_chars=False, digits=True, upper_case=True, lower_case=True)}'"
    elif user_type == 'google':
        oauth_provider = "'google'"
        oauth_id = f"'google-{fake.random_number(digits=21)}'"
    elif user_type == 'facebook':
        oauth_provider = "'facebook'"
        oauth_id = f"'fb-{fake.random_number(digits=16)}'"

    # --- Profile Image (70% chance of having one) ---
    profile_image = f"'{fake.image_url()}'" if random.random() < 0.7 else 'NULL'
    
    # --- Timestamps ---
    created_at = fake.date_time_between(start_date='-3y', end_date='now')
    created_at_str = f"'{created_at.strftime('%Y-%m-%d %H:%M:%S')}'"
    
    # --- Last Login (80% chance of login, must be after created_at) ---
    if random.random() < 0.8:
        last_login = fake.date_time_between(start_date=created_at, end_date='now')
        last_login_str = f"'{last_login.strftime('%Y-%m-%d %H:%M:%S')}'"
    else:
        last_login_str = 'NULL'
        
    # --- Phone Number (50% chance) ---
    if random.random() < 0.5:
        # Generates a sample international-style number
        phone_num = f"+{random.randint(1, 99)}{fake.random_number(digits=9, fix_len=True)}"
        phone = f"'{phone_num}'"
    else:
        phone = 'NULL'

    # --- Assemble the SQL VALUES tuple ---
    record_tuple = (
        str(current_id),
        f"'{email}'",
        f"'{name}'",
        password_hash,
        oauth_provider,
        oauth_id,
        profile_image,
        created_at_str,
        last_login_str,
        phone
    )
    # Add the formatted tuple string to our list
    records.append(f"  ({', '.join(record_tuple)})")

# Join all record strings with a comma and newline
sql_content += ',\n'.join(records) + ';\n'

# --- Write the final content to the .sql file ---
try:
    with open(FILENAME, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"\n✅ Success! \n'{FILENAME}' (400 records) has been generated.")
except IOError as e:
    print(f"\n❌ Error: Could not write to file '{FILENAME}'. \n{e}")