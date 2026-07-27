from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from database import get_db
from models import Company
from schemas import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter(prefix="/companies", tags=["companies"])

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    """
    Creates a new client company account profile.
    """
    company = Company(
        name=payload.name,
        domain=payload.domain,
        industry=payload.industry
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.get("", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """
    Retrieves all companies.
    """
    return db.query(Company).all()

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: UUID, payload: CompanyUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing company profile attributes.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if payload.name is not None:
        company.name = payload.name
    if payload.domain is not None:
        company.domain = payload.domain
    if payload.industry is not None:
        company.industry = payload.industry
        
    db.commit()
    db.refresh(company)
    return company

@router.delete("/{company_id}")
def delete_company(company_id: UUID, db: Session = Depends(get_db)):
    """
    Removes a company profile and cascades check constraints.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    return {"message": "Company successfully deleted"}
