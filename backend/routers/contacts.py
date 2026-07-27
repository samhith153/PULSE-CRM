from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from database import get_db
from models import Contact, Company
from schemas import ContactCreate, ContactResponse

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db)):
    """
    Creates a contact and maps them to a parent company.
    """
    # Check if company exists
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Parent company does not exist")

    # Check if email is already taken
    existing_contact = db.query(Contact).filter(Contact.email == payload.email).first()
    if existing_contact:
        raise HTTPException(status_code=400, detail="Contact with this email already exists")

    contact = Contact(
        company_id=payload.company_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        job_title=payload.job_title
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("", response_model=List[ContactResponse])
def get_contacts(company_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    """
    Retrieves a list of contacts, optionally matching company query parameters.
    """
    query = db.query(Contact)
    if company_id:
        query = query.filter(Contact.company_id == company_id)
    return query.all()
