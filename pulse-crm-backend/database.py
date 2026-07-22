from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

# Check if using SQLite
is_sqlite = DATABASE_URL.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False

engine_args = {
    "connect_args": connect_args,
    "pool_pre_ping": True
}

if not is_sqlite:
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

# Create database engine
engine = create_engine(DATABASE_URL, **engine_args)

# Enable foreign keys for SQLite
if is_sqlite:
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative ORM models
Base = declarative_base()

# FastAPI db dependency injector
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
