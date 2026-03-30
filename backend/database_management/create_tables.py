from ..server.database import get_db_connection
# python -m backend.database_management.create_tables

"""
This script creates the database tables needed for the application.
It includes:
- Professors table
- Courses table
- Reviews table
- Grades table
- Classes_Professors table (many-to-many relationship)
- Vector column for storing embeddings
- Offered column for marking courses as offered
- JSONB column for storing grade distributions
"""

def create_tables(cursor):
    """
    Create or update tables as needed. Also adds a vector column
    for storing embeddings (dimension = 768).
    """
    # Professors table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS professors (
            professor_id VARCHAR(50) PRIMARY KEY,
            professor_name TEXT,
            profile_url TEXT,
            department TEXT,
            number_of_ratings TEXT,
            overall_rating REAL,
            would_take_again_percentage VARCHAR(10),
            level_of_difficulty REAL,
            slug TEXT,
            common_tags TEXT[]
        );
    """)

    # Courses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            course_id VARCHAR(20) PRIMARY KEY,
            course_title TEXT,
            units INTEGER,
            description TEXT,
            fulfillment_tags TEXT,
            prereq TEXT,
            embedding vector(768),
            offered BOOLEAN NOT NULL DEFAULT FALSE
        );
    """)

    # M2M (many-to-many) table for linking classes & professors
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS classes_professors (
            professor_id VARCHAR(50),
            course_id VARCHAR(20),
            offered BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY (professor_id, course_id),
            FOREIGN KEY (professor_id) REFERENCES professors(professor_id),
            FOREIGN KEY (course_id) REFERENCES courses(course_id)
        );
    """)

    # Reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            professor_id VARCHAR(50),
            course_id VARCHAR(20),
            professor_name TEXT,
            quality_rating REAL,
            difficulty_rating REAL,
            review TEXT,
            date TEXT,
            grade TEXT,
            tags TEXT[],
            FOREIGN KEY (professor_id) REFERENCES professors(professor_id)
        );
    """)

    # Grades table
    # - Stores aggregated grade distributions for each (instructor, course, quarter)
    # - 'grade_distribution' is a JSONB column containing keys like "A", "B+", etc.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grades (
            id SERIAL PRIMARY KEY,
            instructor_name TEXT NOT NULL,
            course_id TEXT NOT NULL,
            quarter TEXT NOT NULL,
            enrolled INT,
            grade_distribution JSONB
        );
    """)

    # Cattlelog reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cattlelog_reviews (
        id SERIAL PRIMARY KEY,
        course_id VARCHAR(32) NOT NULL,
        professor_name VARCHAR(255) NOT NULL,
        quality_rating NUMERIC(3, 2),
        difficulty_rating NUMERIC(3, 2),
        review TEXT,
        tags TEXT[],
        date DATE,
        grade VARCHAR(5),
        unique_review BOOLEAN,
        term VARCHAR(10),
        email VARCHAR(255)
    );
    """)
    
    # Professor duplicates table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS professor_duplicates (
            professor_id VARCHAR PRIMARY KEY REFERENCES professors(professor_id),
            professor_name TEXT NOT NULL
        );
    """)

if __name__ == "__main__":
    conn = get_db_connection()
    cursor = conn.cursor()
    create_tables(cursor)
    conn.commit()
    conn.close()
    print("Database tables created successfully")
