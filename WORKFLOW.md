# Davis Cattlelog Engineering Workflow

Welcome to Davis Cattlelog. This guide covers everything you need to know to contribute to the codebase. It's written for new engineers joining AggieWorks or board members trying to understand what we've built. The following is a ~15 min read. If intrested in only a certain part, feel free to use the table of contents to skip directly to it.

## Table of Contents

1. [What We're Building](#what-were-building)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Frontend Guide](#frontend-guide)
5. [Backend Guide](#backend-guide)
6. [Data Pipelines](#data-pipelines)
7. [Git Workflow](#git-workflow)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Analytics](#analytics)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)

## What We're Building

Davis Cattlelog (https://daviscattlelog.com) is the all-in-one course discovery tool for UC Davis students. Our mission is to streamline the course selection process so students only need Cattlelog and Schedule Builder, nothing else.

**What we offer:**
- Course search with semantic matching across 10k+ courses
- Professor reviews from Rate My Professor plus exclusive Cattlelog reviews
- Grade distributions from Fall 2022 to present
- Schedule planning with calendar export (incoming)
- Chrome extension that integrates with Schedule Builder (incoming)

**Current metrics (as of Fall 2025):**
- 15,000+ users
- 25% of active users make "informed course decisions" (using both grade distributions and professor reviews)
- 89.2 NPS score ("How likely are you to recommend cattlelog to a friend?")
- Only source of UC Davis grade distributions from 2022-2025


## System Architecture

Our stack is built for performance and reliability. Here's what we're running:

**Frontend:**
- React 19 + TypeScript + Vite
- Hosted on Vercel (Jake deploys it)
- TailwindCSS for styling
- React Query for data fetching and caching
- React Virtual for handling large lists
- PostHog for analytics and A/B testing

**Backend:**
- FastAPI (Python) on Render
- PostgreSQL with pgvector extension for semantic search
- Redis for caching (6 hour TTL for courses/professors, 24 hour for grades)
- Cloudflare R2 for CDN (6.37x faster than backend for JSON delivery)
- Google Generative AI for course embeddings and professor summaries
- Kronicler for performance monitoring
- Neptune (Rust): 8x speed improvements for API endpoints

**Chrome Extensions:**
- Extension: Schedule export (in development)

**Data Sources:**
- Rate My Professor (scraped quarterly)
- UC Davis Course Catalog (scraped quarterly)
- Schedule Builder API (for current quarter data)
- Grade distributions (updated quarterly)

**Database Schema:**
- `professors`: RMP data with unique slugs for URLs
- `courses`: Catalog data with 768-dimensional embeddings for semantic search
- `reviews`: RMP reviews linked to professors and courses
- `cattlelog_reviews`: User-submitted reviews
- `grades`: Historical grade distributions stored as JSONB
- `classes_professors`: Many-to-many relationship with offered flag for current quarter


## Getting Started

### Prerequisites

You'll need:
- Node.js 18 or higher
- Python 3.10 or higher
- Git with SSH keys set up
- Database viewer (ex. DBeaver, DataGrip, pgAdmin)
- A text editor (we recommend VS Code)

### Repository Setup

We use a fork-based workflow. Follow the [Circular Development guide](https://jr0.org/posts/updated-helpful-git-commands/) for details.

```bash
# Fork the repo on GitHub, then clone your fork
git clone git@github.com:YOUR_USERNAME/course-recommender.git
cd course-recommender

# Add upstream remote
git remote add upstream git@github.com:AggieWorks/course-recommender.git

# Verify remotes
git remote -v
```

### Frontend Setup

```bash
cd frontend
npm install

# Create local environment file from example
cp .env.example .env.development.local

# Edit .env.development.local with your API keys:
# - VITE_POSTHOG_KEY: Get from PostHog dashboard
# - Other variables are pre-configured for local development

# Start dev server (runs on localhost:5173)
npm run dev
```

### Backend Setup

```bash
cd backend

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Create local environment file from example
cp .env.example .env

# Edit .env with your credentials:
# - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD: Ask team for dev database credentials
# - GOOGLE_API_KEY: Get from team
# - POSTHOG_API_KEY: Get from team
# - REDIS_URL: Use redis://localhost:6379 or your Redis instance

# Start dev server (runs on localhost:8000)
uvicorn main:app --reload

# API docs available at http://localhost:8000/docs
```

### Database Setup
Standard workflow is to use the dev database, but if that is down or you're unable to connect to it then you may create a local database by following the setup steps below.

```bash
# Create tables
python -m backend.database_management.create_tables

# Load initial data (optional for development)
python -m backend.database_management.load_to_db
```

## Frontend Guide

**Location:** `/frontend`

**Project Structure:**
```
src/
├── App.tsx                   # Main app connector (routing, providers)
├── main.tsx                  # App entry point (React Query, PostHog setup)
├── components/
│   ├── home/                 # Course search and listing
│   │   ├── CourseList.tsx    # Virtualized course list
│   │   ├── SelectedCourse.tsx # Course detail panel (reviews, grades, professors)
│   │   ├── Filter.tsx        # Filter interface
│   │   ├── filter_components/
│   │   │   ├── DesktopFilter.tsx
│   │   │   └── MobileFilter.tsx
│   │   ├── lib/
│   │   │   └── courseFilters.ts # Core filter/sort logic
│   │   ├── ui/               # Reusable UI components (modals, buttons, etc.)
│   │   └── utils/            # Home page utilities
│   ├── grade_distribution/   # Grade charts and visualizations
│   │   ├── ChartSection.tsx
│   │   ├── CustomTooltip.tsx
│   │   ├── Sparkline.tsx
│   │   ├── course_grade_distribution/  # Course-specific charts
│   │   └── landing_grade_distribution/ # Landing page charts
│   ├── professor_page/       # Professor detail views
│   │   ├── ProfessorView.tsx
│   │   ├── CourseDropdown.tsx
│   │   └── CoryInsights/     # AI-generated professor summaries
│   ├── types/                # TypeScript interfaces
│   │   └── Course.tsx        # Course type definition
│   ├── header/               # Navigation header
│   ├── landing_page/         # Landing page components
│   ├── favorites_page/       # Favorites functionality
│   ├── cooked_class/         # "Cooked class" feature
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Loading.tsx
│   └── ShareCory.tsx
├── pages/                    # Route components (page-level views)
│   ├── Home.tsx              # Main course search page
│   ├── ProfessorPage.tsx     # Professor detail page
│   ├── GradeDistPage.tsx     # Grade distribution page
│   ├── LandingPage.tsx       # Marketing landing page
│   ├── FavoritesPage.tsx
│   ├── WriteReview.tsx       # Review submission page
│   ├── About.tsx
│   └── [other pages...]
├── api/                      # Backend API calls
│   ├── base.ts               # Base URL config
│   ├── GetAllCourses.ts      # Fetch all courses (gzip decompression)
│   ├── GetSearch.ts          # Semantic search API
│   ├── GetCourseInfo.ts      # Single course details
│   ├── GetCourseGrades.ts    # Grade distribution data
│   ├── GetProfessor.ts       # Professor details
│   ├── GetProfessorSummary.ts # AI professor summary
│   ├── GetIsTeaching.ts      # Current quarter teaching status
│   └── WriteReview.ts        # Submit user review
├── utils/                    # Helper functions
│   ├── rating.ts             # Rating color/display logic
│   └── isAlphabetic.ts       # Regex validation
└── stack/                    # Stack Auth client
    └── client.ts             # Authentication provider
```

**Common Commands:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run format       # Formatting
npm run prod         # Uses production backend endpoints
```

**Key Frontend Features to Understand:** (These may not be obvious just by looking at the file structure)
- Course search uses fuzzy matching with semantic fallback
- React Query caches API responses for 30 minutes
- Large course lists use React Virtual to render only visible items
- PostHog tracks user behavior and powers A/B tests

## Backend Guide

**Location:** `/backend`

**Key Technologies:**
- FastAPI for REST API
- SQLAlchemy for ORM
- PostgreSQL with pgvector for semantic search
- Redis for caching
- Google Generative AI for embeddings and summaries

**Project Structure:**
```
backend/
├── server/
│   ├── endpoints/          # API route handlers
│   ├── assembly_logic/     # Data transformation
│   ├── models.py           # Database models
│   ├── database.py         # DB connection
│   ├── routes.py           # Main router
│   ├── redis/              # Cache utilities
│   └── schemas/            # Pydantic schemas
├── data_pipelines/         # Data collection scripts
├── database_management/    # Schema and loading
└── tests/                  # Pytest tests
```

**Core API Endpoints:**
- `GET /api/courses`: All courses with professor data (6 hour cache)  (currently has it's **own** deployment right now (utalizing Neptune))
- `GET /api/professors`: All professors with reviews (6 hour cache)
- `GET /api/courses/{id}`: Specific course with reviews
- `GET /api/courses/{id}/grades`: Grade distribution data (24 hour cache)
- `GET /api/professors/{id}`: Professor details with AI summary
- `GET /api/search/courses`: Search with semantic fallback
- `POST /api/reviews/cattlelog`: Submit user review

**Caching Strategy:**
- Redis stores gzip-compressed JSON
- All courses: 6 hours TTL
- All professors: 6 hours TTL
- Grade distributions: 24 hours TTL
- Professor details: 1 hour TTL

**Assembly Logic:**
The `assembly_logic/` folder transforms database rows into API responses:
- `all_course_logic.py`: Assembles course list with professor info
- `single_course_logic.py`: Assembles detailed course view
- `all_professor_logic.py`: Assembles professor list
- `single_professor_logic.py`: Assembles professor detail with AI summary

**Important Files:**
- `main.py`: FastAPI app with CORS and middleware
- `server/routes.py`: All API route definitions
- `server/models.py`: SQLAlchemy ORM models
- `server/endpoints/search.py`: Semantic search implementation
- `server/endpoints/course.py`: Grade distribution logic


**Neptune** (`/neptune`): Rust API server that showed 8x speed improvements. For performance optimization.

## Data Pipelines

**Location:** `/backend/data_pipelines`

Data pipelines run roughly once per quarter to update course, professor, and grade data. They take several hours to complete, so run them carefully.

**Data Sources:**
1. UC Davis Course Catalog (official course listings)
2. Rate My Professor (professor ratings and reviews)
3. Grade Distributions (historical grade data)
4. Schedule Builder API (current quarter offerings)

**Pipeline Scripts:**

| Script | Purpose | Output |
|--------|---------|----------|
| `get_catalog.py` | Scrape UC Davis catalog | `data/catalog.json` |
| `get_professor_id.py` | Get RMP professor IDs | Professor ID mappings |
| `get_reviews.py` | Scrape RMP reviews | `data/ucdavis_professors_reviews.json` |
| `get_classes.py` | Get current quarter classes | `data/class_data/ucd_classes_[QUARTER].json` |
| Grade conversion | Convert CSV to JSON | `data/grades.json` |

**Running Pipelines:**

```bash
cd backend/data_pipelines

# 1. Get course catalog
python get_catalog.py

# 2. Get professor IDs, then scrape reviews
python get_professor_id.py
python get_reviews.py  # Takes about 2 hours

# 3. Get current quarter class schedule
# Update the quarter tag in get_classes.py first
python get_classes.py

# 4. Process grade data
cd data_conversion
python csv_convert.py
python json_convert.py
```

**Loading Data into Database:**

```bash
cd backend/database_management

# Full data refresh (recommended)
python -m backend.database_management.load_to_db

# Or load specific data types using Python:
from backend.database_management.load_to_db import load_data

# Load only courses with embeddings
load_data(update_courses=True, update_professors=False)

# Full refresh
load_data(
    update_courses=True,
    update_quarter=True, 
    update_professors=True,
    update_reviews=True,
    update_grades=True
)
```

**Important Notes:**
- Professor data uses Playwright for scraping, so it requires a browser
- Course embeddings are generated using Google's text-embedding-004 model (768 dimensions)
- The `offered` flag gets updated when loading current quarter data
- Backup JSON files are stored in `data/` for recovery

## Git Workflow

We use a fork-based workflow with specific conventions. Read Jake's [Circular Development guide](https://jr0.org/posts/updated-helpful-git-commands/) for the full details.

**Starting Work:**
```bash
# Always start from the latest main
git switch main
git pull upstream main

# Create a feature branch (use kebab-case)
git switch -c add-course-filtering

# Make changes and commit
git add -u
git commit

# Push to your fork
git push origin add-course-filtering
```

**Branch Naming:**

Good: `remove-class-post-route`, `document-tags-file`, `add-grade-distribution-chart`

Bad: `new`, `dev`, `Something`, `fix`

**Pull Requests:**
1. Create PR from `origin:your-branch` to `upstream:main`
2. Follow STPRQ guidelines: [STPRQ is "Subjective Test for Pull Request Quality" and can be found here](https://jr0.org/cdn/Subjective-Test-for-Pull-Request-Quality.pdf)
   - Code compiles/runs without errors
   - Tests pass
   - No commented-out or dead code
   - Identifiers have clear, purposeful names
   - Lint and format checks pass
   - Sufficient comments explaining "why" (not just "what")
   - One task per pull request
   - Professional naming and language in PRs and commits
   - Aim for 19-20/20 points on the STPRQ rubric
3. Request reviews
4. Address feedback
5. Merge after approval


**Naming Conventions:**
- Variables: Descriptive names proportional to scope (`i`, `filtered_courses`, `COURSE_SEARCH_THRESHOLD`)
- Functions: Shorter names for wider scope (`fetch_classes` vs `update_button_on_submit`)
- Comments: Start with capital, explain WHAT or WHY, come before the code they describe

**Feature Flags:**

We use feature flags for gradual rollouts and A/B testing:

```typescript
const FEATURES = {
  referral_code: false,
  new_grade_visualization: true,
  professor_ai_summary: true,
};
```

This lets us ship code without immediately enabling features, which is useful for testing and phased rollouts.

## Testing

**Current Status:** Test coverage is spotty and needs improvement. We're working on expanding it to reach 25% code coverage this quarter.

**Backend Testing (Pytest):**

```bash
cd backend
source venv/bin/activate

pytest                          # Run all tests
pytest tests/test_utils.py      # Run specific file
pytest --cov=server             # Run with coverage
```

Test files:
- `test_utils.py`: Utility functions like `parse_course_id`
- `test_single_course_logic.py`: Course detail assembly
- `test_professor_logic.py`: Professor data assembly
- `test_grade_dist.py`: Grade distribution logic
- `test_all_course_logic.py`: Course listing assembly

**API Testing:**

FastAPI provides auto-generated API docs:
- Production: https://course-recommender-backend.onrender.com/docs
- Local: http://localhost:8000/docs

You can test endpoints directly from the docs interface.

## Deployment

**Frontend (Manual):**
- Hosted on Vercel
    - Vercel automatically tracks pushes to redeploy
- Jake handles deployment manually (waiting for new CI/CD tool from board)
- URL: https://daviscattlelog.com

**Backend (Manual):**
- Hosted on Render
- Eugene handles deployments manually
- We're waiting for board to set up CI/CD automation
- Process: Pull from `upstream/main`, push to production branch, Render builds and deploys
- Verify at https://course-recommender-backend.onrender.com/docs

**Neptune (Rust API - Manual):**
- Handles `/api/courses` endpoint separately for 8x performance improvement
- Hosted on Render (separate deployment from main backend)
- Deployment handled manually
- Process: Build Rust binary, deploy to Render
- See [8x speed increase blog post](https://jr0.org/posts/optimizing-course-api/) for technical details

**Database (PostgreSQL):**
- Hosted on Render (managed PostgreSQL service)
- Includes pgvector extension for semantic search
- Backup strategy: Automated daily backups via Render
- Access: Connect using `DATABASE_URL` environment variable
- Migrations: Run via `database_management/create_tables.py`

**Environment Variables (Render):**
- `DATABASE_URL`: PostgreSQL connection
- `GOOGLE_API_KEY`: For embeddings and AI summaries
- `POSTHOG_API_KEY`: Analytics tracking
- `GIT_COMMIT`: Deployment tracking

## Analytics

**PostHog:**

We use PostHog for user behavior tracking and A/B testing.

Tracked metrics:
- Page views and sessions
- Search queries and clicks
- Grade distribution usage
- Professor page visits
- UTM source attribution

Recent A/B test wins:
- Search placeholder change: +20% searches
- Grade distribution button styling: +48% usage

UTM tracking: Add `?utm_source=campaign-name` to any URL for attribution.

**Performance Monitoring (Kronicler):**

Dashboard: https://usekronicler.com

Tracks:
- Backend response times
- Database query performance
- Cache hit rates
- Error tracking

Logs endpoint: https://course-recommender-backend.onrender.com/api/logs

**Internal Tools:**

QR Code Generator (https://daviscattlelog.com/qr):
- Create trackable QR codes for marketing
- Auto-adds UTM source
- Download as PNG

Scripts in `/scripts`:
- `upload_data.py`: Upload JSON to R2 (6.37x faster than backend)
- `make_sitemap.py`: Generate SEO sitemap
- `get_giveaway_emails.py`: Extract email signups
- `data_speed_test.py`: Compare backend vs R2 performance

## Troubleshooting

**Frontend Issues:**

Environment variables not loading:
```bash
ls -la | grep env  # Check for .env.development.local
cat .env.development.local  # Verify VITE_ prefix
```

API calls failing:
```bash
curl http://localhost:8000/api/health  # Check if backend is running
```

**Backend Issues:**

Database connection errors:
```bash
pg_isready -h localhost -p 5432  # Check PostgreSQL
echo $DATABASE_URL  # Verify format: postgresql://user:pass@host:port/db
```

Import errors in pipelines:
```bash
# Run scripts as modules
python -m backend.data_pipelines.get_catalog
```

**Performance Issues:**

Slow API responses:
1. Check Redis cache status
2. Review Kronicler dashboard
3. Consider R2 CDN for large datasets

Slow database queries:
1. Use `EXPLAIN ANALYZE` to profile
2. Check pgvector index usage
3. Monitor connection pool

**Data Pipeline Issues:** 
- Scraping failures:
    1. Check rate limiting delays
    2. Verify user agent rotation
    3. Monitor for anti-bot measures
- Database loading errors:
    1. Check foreign key constraints
    2. Verify data format consistency
    3. Use transactions

## Additional Resources

**Documentation:**
- Component-specific README files in each directory
- API docs: https://course-recommender-backend.onrender.com/docs
- Git workflow: [Helpful Git Commands](https://jr0.org/posts/updated-helpful-git-commands/)

**Getting Help:**
1. Check README files in relevant directories
2. Search GitHub issues for similar problems
3. Ask team members
4. Create a detailed GitHub issue


## Engineering Principles
- Higher code quality standards
- Better peer reviews
- More comprehensive documentation
- Open communication within engineering team
- Align with system design discussions before implementation

## Contributing

Welcome to Cattlelog. This product impacts thousands of UC Davis students every quarter. Your work here makes course planning easier and helps students make better academic decisions.

1. Fork the repo and set up your environment
2. Follow the coding standards and naming conventions
3. Write tests for new features (we're focused on improving coverage)
4. Submit clear PRs with good descriptions
5. Participate in code reviews

For questions about this guide, ask the TPM or another engineer.
