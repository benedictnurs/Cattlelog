# Backend README

## Overview
This backend is part of the Davis Cattlelog project, which allows users to plan their schedules and research professors. The backend is built using FastAPI and serves as the API for the frontend application.

## Setup

### Prerequisites
- Python 3.7 or higher
- `pip` for package management

### Installation
1. Create a virtual environment:
   ```sh
   python3 -m venv venv
   ```
   or for windows:
   ```sh
   python -m venv venv
   ```

2. Activate the virtual environment:
   
   Mac & Linux:
   ```
   source venv/bin/activate
   ```
   Windows:
   ```
   venv\Scripts\activate
   ```

3. Install the required packages:
   ```sh
   pip install -r requirements.txt
   ```

## Running the Application
To start the backend server, run the following command:
```sh
uvicorn main:app --reload
```
This will start the server in development mode, allowing for hot reloading.

## API Documentation
The API documentation can be accessed at:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
