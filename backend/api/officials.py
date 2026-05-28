from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
import uuid
from db.session import get_db
from models.official import Official, TenderOfficialLink
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/officials", tags=["Officials Watchlist"])

@router.get("")
async def list_officials(
    fingerprint_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all government officials, with optional filtering for those with official fingerprint flags.
    """
    offset = (page - 1) * limit
    query = select(Official)
    count_query = select(func.count()).select_from(Official)
    
    if fingerprint_only:
        query = query.where(Official.fingerprint_flag == True)
        count_query = count_query.where(Official.fingerprint_flag == True)
        
    query = query.order_by(Official.flagged_count.desc(), Official.total_flagged_value.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    officials = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    # Format and strip embeddings from results
    formatted_officials = []
    for official in officials:
        o_dict = {column.name: getattr(official, column.name) for column in official.__table__.columns if column.name != "name_embedding"}
        formatted_officials.append(o_dict)
        
    return {
        "officials": formatted_officials,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{official_uuid}")
async def get_official_detail(official_uuid: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve details of a specific official including their historical tender approval timeline.
    """
    try:
        import uuid
        uuid_val = uuid.UUID(official_uuid)
        
        query = select(Official).where(Official.id == uuid_val)
        result = await db.execute(query)
        official = result.scalar_one_or_none()
        
        if not official:
            raise HTTPException(status_code=404, detail="Official not found")
            
        # Retrieve all tenders approved/signed by this official
        links_query = select(TenderOfficialLink, Tender, FraudScore).join(
            Tender, TenderOfficialLink.tender_id == Tender.id
        ).outerjoin(
            FraudScore, Tender.id == FraudScore.tender_id
        ).where(TenderOfficialLink.official_id == official.id)
        
        links_res = await db.execute(links_query)
        rows = links_res.all()
        
        approval_history = []
        for link, tender, score in rows:
            approval_history.append({
                "tender_id": str(tender.id),
                "tender_number": tender.tender_id,
                "title": tender.title,
                "department": tender.department,
                "awarded_value": float(tender.awarded_value) if tender.awarded_value else 0.0,
                "awarded_at": tender.awarded_at,
                "official_role": link.role,
                "tender_fraud_score": float(score.confidence) if score else 0.0,
                "tender_fraud_tier": score.tier if score else "clear"
            })
            
        # Format official dict
        o_dict = {column.name: getattr(official, column.name) for column in official.__table__.columns if column.name != "name_embedding"}
        o_dict["approval_history"] = approval_history
        
        return o_dict
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Official profile lookup failed: {e}")
