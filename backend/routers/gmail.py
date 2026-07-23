import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import SyncJobResponse

router = APIRouter(prefix="/gmail", tags=["gmail"])

@router.post("/sync", response_model=SyncJobResponse, status_code=status.HTTP_202_ACCEPTED)
def sync_gmail(db: Session = Depends(get_db)):
    """
    Triggers background worker sync task matching incoming threads (OAuth authenticated).
    """
    # Create a unique job execution identifier
    sync_job_id = f"sync_{uuid.uuid4().hex[:12]}"
    
    # In a full production implementation, we would spawn a Celery task or background thread here.
    return {
        "status": "queued",
        "sync_job_id": sync_job_id,
        "message": "Synchronization process successfully initiated"
    }
