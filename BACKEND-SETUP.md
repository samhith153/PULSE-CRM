# How to Run PULSE CRM Backend

## Prerequisites
- Python 3.9+ installed
- PostgreSQL database (or use Docker)

## Step-by-Step Instructions

### 1️⃣ Navigate to Backend Directory
```bash
cd backend
```

### 2️⃣ Create Virtual Environment
```bash
python -m venv .venv
```

### 3️⃣ Activate Virtual Environment
**Windows (CMD):**
```bash
.venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
source .venv/bin/activate
```

### 4️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 5️⃣ Setup Environment Variables
```bash
# Copy the example file
copy .env.example .env

# Then edit .env file and set:
# - DATABASE_URL (your PostgreSQL connection string)
# - SECRET_KEY (generate a random secret)
```

**Example .env:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/pulse_crm
SECRET_KEY=your-super-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 6️⃣ Start PostgreSQL Database

**Option A - Using Docker (Recommended):**
```bash
cd ..\docker
docker-compose up db -d
cd ..\backend
```

**Option B - Local PostgreSQL:**
Make sure PostgreSQL is running and create a database named `pulse_crm`

### 7️⃣ Run Database Migrations
```bash
alembic upgrade head
```

### 8️⃣ Seed the Database (Optional but Recommended)
```bash
python -m scripts.seed
```

This creates:
- Admin user: admin@kalnet-pulse.com / Admin@123456
- Manager user: sarah.johnson@kalnet-demo.com / Demo@123456
- Sales Rep: mike.chen@kalnet-demo.com / Demo@123456

### 9️⃣ Start the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

### ✅ Verify It's Running
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/health

---

## Quick Commands (After Initial Setup)

```bash
# Activate environment
.venv\Scripts\activate

# Start server
uvicorn app.main:app --reload --port 8000
```

---

## Troubleshooting

### Issue: "alembic: command not found"
```bash
pip install alembic
```

### Issue: "Cannot connect to database"
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database credentials

### Issue: "Module not found"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Port 8000 already in use
```bash
# Use a different port
uvicorn app.main:app --reload --port 8001
```

---

## Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```
