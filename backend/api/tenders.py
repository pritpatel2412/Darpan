from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from db.session import get_db
from models.tender import Tender
from models.contractor import TenderBid, Contractor
from models.fraud_score import FraudScore
from models.rti_application import RTIApplication

router = APIRouter(prefix="/tenders", tags=["Tenders"])

@router.get("")
async def list_tenders(
    state: Optional[str] = None,
    portal: Optional[str] = None,
    category: Optional[str] = None,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all tenders with pagination and optional metadata filtering.
    """
    offset = (page - 1) * limit
    query = select(Tender)
    count_query = select(func.count()).select_from(Tender)
    
    filters = []
    if state:
        filters.append(Tender.state == state)
    if portal:
        filters.append(Tender.source_portal == portal)
    if category:
        filters.append(Tender.category == category)
    if min_value:
        filters.append(Tender.estimated_value >= min_value)
    if max_value:
        filters.append(Tender.estimated_value <= max_value)
        
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
        
    query = query.order_by(Tender.published_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    tenders = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    pages = (total + limit - 1) // limit
    
    return {
        "tenders": tenders,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/flagged")
async def list_flagged_tenders(
    state: Optional[str] = None,
    min_score: float = Query(40.0, ge=0.0, le=100.0),
    tier: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all tenders flagged with fraud scores above a threshold.
    """
    offset = (page - 1) * limit
    
    # Select tenders joined with their fraud scores
    query = select(Tender, FraudScore).join(FraudScore, Tender.id == FraudScore.tender_id)
    count_query = select(func.count()).select_from(Tender).join(FraudScore, Tender.id == FraudScore.tender_id)
    
    filters = [FraudScore.confidence >= min_score]
    if state:
        filters.append(Tender.state == state)
    if tier:
        filters.append(FraudScore.tier == tier)
        
    query = query.where(and_(*filters)).order_by(FraudScore.confidence.desc()).offset(offset).limit(limit)
    count_query = count_query.where(and_(*filters))
    
    result = await db.execute(query)
    rows = result.all()
    
    tenders_with_scores = []
    for tender, score in rows:
        t_dict = {column.name: getattr(tender, column.name) for column in tender.__table__.columns if column.name != "spec_embedding"}
        t_dict["fraud_score"] = {
            "confidence": float(score.confidence),
            "tier": score.tier,
            "groq_narrative": score.groq_narrative,
            "groq_likelihood": score.groq_likelihood,
            "groq_strongest": score.groq_strongest,
            "price_ratio": float(score.price_ratio) if score.price_ratio else None
        }
        tenders_with_scores.append(t_dict)
        
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    return {
        "tenders": tenders_with_scores,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/search")
async def search_tenders(
    q: str = Query(..., min_length=2),
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Fuzzy text search across tender titles and departments using pg_trgm.
    """
    # Simple ILIKE search with state filter
    query = select(Tender).where(
        or_(
            Tender.title.ilike(f"%{q}%"),
            Tender.department.ilike(f"%{q}%"),
            Tender.tender_id.ilike(f"%{q}%")
        )
    )
    if state:
        query = query.where(Tender.state == state)
        
    query = query.order_by(Tender.published_at.desc()).limit(50)
    result = await db.execute(query)
    tenders = result.scalars().all()
    
    return tenders

@router.get("/{tender_uuid}")
async def get_tender_detail(tender_uuid: str, db: AsyncSession = Depends(get_db)):
    """
    Get full tender details including active bids, fraud scores, and RTI actions.
    """
    try:
        tender_id_val = uuid_val = None
        # Support both native UUID lookup and raw tender_id lookup
        import uuid
        try:
            uuid_val = uuid.UUID(tender_uuid)
            query = select(Tender).where(Tender.id == uuid_val)
        except ValueError:
            query = select(Tender).where(Tender.tender_id == tender_uuid)
            
        result = await db.execute(query)
        tender = result.scalar_one_or_none()
        
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found")
            
        # Get associated fraud score
        score_query = select(FraudScore).where(FraudScore.tender_id == tender.id)
        score_res = await db.execute(score_query)
        score = score_res.scalar_one_or_none()
        
        # Get bids
        bids_query = select(TenderBid, Contractor).outerjoin(Contractor, TenderBid.contractor_id == Contractor.id).where(TenderBid.tender_id == tender.id)
        bids_res = await db.execute(bids_query)
        bid_rows = bids_res.all()
        
        bids_list = []
        for bid, contractor in bid_rows:
            bids_list.append({
                "id": str(bid.id),
                "bid_amount": float(bid.bid_amount) if bid.bid_amount else None,
                "is_winner": bid.is_winner,
                "submitted_at": bid.submitted_at,
                "disqualified": bid.disqualified,
                "disq_reason": bid.disq_reason,
                "contractor": {
                    "id": str(contractor.id),
                    "cin": contractor.cin,
                    "name": contractor.name
                } if contractor else None
            })
            
        # Get active RTIs
        rti_query = select(RTIApplication).where(RTIApplication.tender_id == tender.id)
        rti_res = await db.execute(rti_query)
        rti_list = rti_res.scalars().all()
        
        # Build payload (exclude large spec_embedding vector from direct JSON serialization)
        t_dict = {column.name: getattr(tender, column.name) for column in tender.__table__.columns if column.name != "spec_embedding"}
        
        return {
            "tender": t_dict,
            "fraud_score": score,
            "bids": bids_list,
            "rtis": rti_list
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error retrieving tender: {e}")

@router.get("/{tender_uuid}/evidence")
async def get_tender_evidence(tender_uuid: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve the raw structured evidence package compiled for a flagged tender.
    """
    import uuid
    try:
        uuid_val = uuid.UUID(tender_uuid)
        query = select(FraudScore).where(FraudScore.tender_id == uuid_val)
    except ValueError:
        # Fallback to tender_id join lookup
        query = select(FraudScore).join(Tender, FraudScore.tender_id == Tender.id).where(Tender.tender_id == tender_uuid)
        
    result = await db.execute(query)
    score = result.scalar_one_or_none()
    
    if not score or not score.evidence_package:
        raise HTTPException(status_code=404, detail="Evidence package not found or not yet generated")
        
    return score.evidence_package

@router.get("/{tender_uuid}/score")
async def get_tender_score_breakdown(tender_uuid: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve all 10 signal scores and evidence strings for auditing purposes.
    """
    import uuid
    try:
        uuid_val = uuid.UUID(tender_uuid)
        query = select(FraudScore).where(FraudScore.tender_id == uuid_val)
    except ValueError:
        query = select(FraudScore).join(Tender, FraudScore.tender_id == Tender.id).where(Tender.tender_id == tender_uuid)
        
    result = await db.execute(query)
    score = result.scalar_one_or_none()
    
    if not score:
        raise HTTPException(status_code=404, detail="Score breakdown not found")
        
    return score
