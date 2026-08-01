FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (compiler, pg client dev libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# For local Docker builds, run from the repo root:
#   docker build -f backend/Dockerfile .
# This ensures the ai/ package (at repo root) is included in the build context.
# On Render (runtime: python, rootDir: backend), the ai/ package is installed
# separately via the buildCommand or pip.

EXPOSE 8000

# Start Uvicorn app server using the new async app entry point
# (app.main uses async engine from app/database/connection.py)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
