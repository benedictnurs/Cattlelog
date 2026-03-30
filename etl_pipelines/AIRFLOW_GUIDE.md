# Airflow Data Pipeline Guide

## 🌊 What is Airflow?

Apache Airflow is a platform to **schedule, monitor, and orchestrate** your data workflows. Instead of manually running scripts, Airflow:

- ✅ **Automatically runs** your data pipelines on a schedule
- ✅ **Manages dependencies** between tasks (e.g., fetch IDs before reviews)
- ✅ **Retries failures** automatically
- ✅ **Tracks history** of all pipeline runs
- ✅ **Provides a UI** to monitor everything

## 🚀 Getting Started

### 1. Build and Start Airflow

```bash
# Navigate to project root
cd Projects/course-recommender

# Build the custom Airflow image (first time only)
docker-compose -f docker-compose.airflow.yml build

# Start all Airflow services
docker-compose -f docker-compose.airflow.yml up -d

# Check status
docker-compose -f docker-compose.airflow.yml ps
```

### 2. Access the Airflow UI

Open your browser to: **http://localhost:8080**

**Login credentials:**
- Username: `admin`
- Password: `admin`

### 3. Enable the DAG

1. In the Airflow UI, find the DAG named **`ucdavis_data_pipeline`**
2. Toggle the switch to enable it

### 4. Manually Trigger a Run (Optional)

1. Click on the DAG name
2. Click the **▶ Play** button in the top right
3. Select "Trigger DAG"
4. Watch the tasks execute in real-time!

## 📊 Understanding the Pipeline

### Task Flow

```
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
```

### Task Descriptions

| Task | Script | Purpose | Dependencies |
|------|--------|---------|--------------|
| **get_professor_ids** | `get_professor_id.py` | Fetch RMP IDs | None |
| **get_professor_reviews** | `get_reviews_api.py` | Fetch professor reviews | Needs IDs first |
| **process_grade_data** | `get_grade_json.py` | Process Excel grade files | None (runs parallel) |
| **get_course_schedule** | `get_schedule_builder.py` | Fetch current schedule | None (runs parallel) |
| **get_course_catalog** | `get_catalog.py` | Scrape course catalog | None (runs parallel) |
| **validate_data** | `data_validation.py` | Validate all collected data | Runs after all |

### Schedule

- **Can be changed** in `ucdavis_data_pipeline_dag.py` (line 32)

## 🔧 Common Operations

### View Logs

```bash
# View logs for a specific service
docker logs airflow-webserver
docker logs airflow-scheduler

# Follow logs in real-time
docker logs -f airflow-scheduler
```

### Stop Airflow

```bash
docker-compose -f docker-compose.airflow.yml down
```

### Restart After Code Changes

```bash
# Stop services
docker-compose -f docker-compose.airflow.yml down

# Rebuild image (only if you changed Dockerfile or requirements.txt)
docker-compose -f docker-compose.airflow.yml build

# Start again
docker-compose -f docker-compose.airflow.yml up -d
```

### Clean Everything (Reset)

```bash
# Stop and remove everything including volumes
docker-compose -f docker-compose.airflow.yml down -v

# Start fresh
docker-compose -f docker-compose.airflow.yml up -d
```

### Can't access UI?

```bash
# Check if webserver is running
docker ps | grep airflow-webserver

# Check logs
docker logs airflow-webserver

# Restart if needed
docker restart airflow-webserver
```

### Import errors (module not found)?

Add the missing package to `requirements.txt` and rebuild:

```bash
docker-compose -f docker-compose.airflow.yml down
docker-compose -f docker-compose.airflow.yml build
docker-compose -f docker-compose.airflow.yml up -d
```