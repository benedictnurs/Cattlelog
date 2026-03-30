"""
UC Davis Course Data Pipeline DAG

This DAG orchestrates the collection of UC Davis course and professor data.
It runs all data collection scripts in the correct order with proper dependencies.

"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

# Default arguments for all tasks
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'ucdavis_data_pipeline',
    default_args=default_args,
    description='Collect UC Davis course and professor data from multiple sources',
    schedule_interval=None,
    start_date=datetime(2025, 11, 17),
    catchup=False,
    tags=['ucdavis', 'data-collection', 'etl'],
)

# Task 1: Get Professor IDs from RateMyProfessors
get_professor_ids = BashOperator(
    task_id='get_professor_ids',
    bash_command='cd /opt/airflow/dags/extraction && python get_professor_id.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Task 2: Fetch Professor Reviews (depends on professor IDs)
get_reviews = BashOperator(
    task_id='get_professor_reviews',
    bash_command='cd /opt/airflow/dags/extraction && python get_reviews_api.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Task 3: Process Grade Data (independent, can run in parallel)
process_grades = BashOperator(
    task_id='process_grade_data',
    bash_command='cd /opt/airflow/dags/extraction && python get_grade_json.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Task 4: Fetch Current Schedule (independent, can run in parallel)
get_schedule = BashOperator(
    task_id='get_course_schedule',
    bash_command='cd /opt/airflow/dags/extraction && python get_schedule_builder.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Task 5: Scrape Course Catalog (independent, can run in parallel)
get_catalog = BashOperator(
    task_id='get_course_catalog',
    bash_command='cd /opt/airflow/dags/extraction && python get_catalog.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Task 6: Data Validation (runs after all data is collected)
validate_data = BashOperator(
    task_id='validate_data',
    bash_command='cd /opt/airflow/dags/extraction && python data_validation.py',
    env={'DATA_DIR': '/opt/airflow/data'},
    dag=dag,
)

# Define task dependencies
# Professor IDs must be fetched before reviews
get_professor_ids >> get_reviews

# After reviews are fetched, run validation
# Grade processing, schedule, and catalog can run in parallel
[get_reviews, process_grades, get_schedule, get_catalog] >> validate_data

"""
Task Flow Diagram:

                    ┌──────────────────┐
                    │ Get Professor IDs│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Get Reviews API │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ Process Grades │  │  Get Schedule   │  │  Get Catalog   │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Validate Data   │
                    └──────────────────┘
"""

