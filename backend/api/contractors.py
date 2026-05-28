from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
import uuid
from db.session import get_db
from models.contractor import Contractor, TenderBid
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/contractors", tags=["Contractors Watchlist"])

@router.get("")
async def list_contractors(
    watchlist_only: bool = Query(False),
    state: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all contractors, with optional filters for watchlist status and registration state.
    """
    offset = (page - 1) * limit
    query = select(Contractor)
    count_query = select(func.count()).select_from(Contractor)
    
    filters = []
    if watchlist_only:
        filters.append(Contractor.watchlist == True)
    if state:
        filters.append(Contractor.registered_state == state)
        
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
        
    query = query.order_by(Contractor.total_value_won.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    contractors = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    return {
        "contractors": contractors,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{contractor_uuid}")
async def get_contractor_detail(contractor_uuid: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve deep contractor registry profiles (CIN, directors, historical awards).
    """
    try:
        import uuid
        try:
            uuid_val = uuid.UUID(contractor_uuid)
            query = select(Contractor).where(Contractor.id == uuid_val)
        except ValueError:
            query = select(Contractor).where(Contractor.cin == contractor_uuid)
            
        result = await db.execute(query)
        contractor = result.scalar_one_or_none()
        
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
            
        # Get all bids won by this contractor
        bids_query = select(TenderBid, Tender).join(Tender, TenderBid.tender_id == Tender.id).where(
            and_(TenderBid.contractor_id == contractor.id, TenderBid.is_winner == True)
        )
        bids_res = await db.execute(bids_query)
        rows = bids_res.all()
        
        won_tenders = []
        for bid, tender in rows:
            won_tenders.append({
                "id": str(tender.id),
                "tender_id": tender.tender_id,
                "title": tender.title,
                "awarded_value": float(tender.awarded_value) if tender.awarded_value else 0.0,
                "awarded_at": tender.awarded_at
            })
            
        # Exclude name_embedding from raw JSON output
        c_dict = {column.name: getattr(contractor, column.name) for column in contractor.__table__.columns if column.name != "name_embedding"}
        c_dict["won_tenders"] = won_tenders
        
        return c_dict
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Contractor profile lookup failed: {e}")

@router.get("/{contractor_uuid}/tenders")
async def get_contractor_tenders(
    contractor_uuid: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all central and state contracts awarded to a specific contractor.
    """
    try:
        import uuid
        uuid_val = uuid.UUID(contractor_uuid)
        
        query = select(Tender).join(TenderBid, Tender.id == TenderBid.tender_id).where(
            and_(TenderBid.contractor_id == uuid_val, TenderBid.is_winner == True)
        ).order_by(Tender.awarded_at.desc())
        
        result = await db.execute(query)
        tenders = result.scalars().all()
        
        return tenders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving contractor tenders: {e}")

@router.get("/{contractor_uuid}/network")
async def get_contractor_collusion_network(
    contractor_uuid: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Exposes node/link relationships for D3 force-directed mapping of directorships and registered addresses.
    """
    try:
        import uuid
        uuid_val = uuid.UUID(contractor_uuid)
        
        c_query = select(Contractor).where(Contractor.id == uuid_val)
        c_res = await db.execute(c_query)
        contractor = c_res.scalar_one_or_none()
        
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
            
        # Build network graph:
        # 1. Fetch other contractors sharing same address_hash or director DINs
        din_list = [d["din"] for d in contractor.directors or [] if d.get("din")]
        
        shared_address_query = select(Contractor).where(
            and_(Contractor.address_hash == contractor.address_hash, Contractor.id != contractor.id)
        )
        address_res = await db.execute(shared_address_query)
        shared_address_contractors = address_res.scalars().all()
        
        # Format graph nodes and links
        nodes = [
            {"id": str(contractor.id), "name": contractor.name, "type": "contractor", "cin": contractor.cin, "val": 15}
        ]
        links = []
        
        # Add shared address nodes
        for peer in shared_address_contractors:
            nodes.append({"id": str(peer.id), "name": peer.name, "type": "contractor", "cin": peer.cin, "val": 10})
            links.append({
                "source": str(contractor.id),
                "target": str(peer.id),
                "type": "shared_address",
                "label": "Shared Office Address"
            })
            
        # Add directors as separate visual nodes
        for director in contractor.directors or []:
            if not director.get("name"):
                continue
            dir_node_id = f"dir-{director.get('din', uuid.uuid4().hex)}"
            nodes.append({
                "id": dir_node_id,
                "name": director["name"],
                "type": "director",
                "din": director.get("din"),
                "val": 8
            })
            links.append({
                "source": str(contractor.id),
                "target": dir_node_id,
                "type": "director_link",
                "label": "Company Director"
            })
            
        return {
            "nodes": nodes,
            "links": links
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed compiling network graph: {e}")
