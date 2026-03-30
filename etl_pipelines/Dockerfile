# Dockerfile for Airflow with Data Pipelines
FROM apache/airflow:2.9.1-python3.12

# Switch to root to install system dependencies
USER root

# Install any system dependencies if needed
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Switch back to airflow user
USER airflow

# Copy requirements and install Python dependencies
COPY requirements.txt /opt/airflow/requirements.txt
RUN pip install --no-cache-dir -r /opt/airflow/requirements.txt

# Copy the data pipeline scripts
COPY . /opt/airflow/dags/

# Set working directory
WORKDIR /opt/airflow

