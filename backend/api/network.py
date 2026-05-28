from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Any
from db.session import get_db
from models.contractor import Contractor, TenderBid
from models.official import Official, TenderOfficialLink
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/network", tags=["Corruption Network Graph"])

@router.get("/graph")
async def get_global_corruption_graph(db: AsyncSession = Depends(get_db)):
    """
    Exposes full network graph (D3 nodes/links) of all high-risk connections 
    between Contractors, Approving Officials, and Government Departments.
    """
    try:
        # 1. Fetch all high-risk tenders (confidence >= 70%)
        tenders_query = select(Tender).join(FraudScore, Tender.id == FraudScore.tender_id).where(FraudScore.confidence >= 70.0)
        tenders_res = await db.execute(tenders_query)
        high_risk_tenders = tenders_res.scalars().all()
        
        nodes = []
        links = []
        
        # Track inserted nodes to avoid duplicates
        inserted_node_ids = set()
        
        # We limit the graph density for performance
        for tender in high_risk_tenders[:25]:
            # Hexagon: Department Node
            dept_node_id = f"dept-{tender.department}"
            if dept_node_id not in inserted_node_ids:
                nodes.append({
                    "id": dept_node_id,
                    "name": tender.department,
                    "type": "department",
                    "state": tender.state,
                    "val": 15
                })
                inserted_node_ids.add(dept_node_id)
                
            # Fetch bids and winning contractor
            bids_query = select(TenderBid, Contractor).outerjoin(Contractor, TenderBid.contractor_id == Contractor.id).where(TenderBid.tender_id == tender.id)
            bids_res = await db.execute(bids_query)
            bids_rows = bids_res.all()
            
            for bid, contractor in bids_rows:
                if not contractor:
                    continue
                # Circle: Contractor Node
                c_node_id = str(contractor.id)
                if c_node_id not in inserted_node_ids:
                    nodes.append({
                        "id": c_node_id,
                        "name": contractor.name,
                        "type": "contractor",
                        "cin": contractor.cin,
                        "val": 10
                    })
                    inserted_node_ids.add(c_node_id)
                    
                # Link: Contractor -> Department (won/bid link)
                links.append({
                    "source": c_node_id,
                    "target": dept_node_id,
                    "type": "won_contract" if bid.is_winner else "bidder",
                    "weight": 2 if bid.is_winner else 1,
                    "label": f"Won ₹{float(tender.awarded_value)/1e7:.2f} Cr" if bid.is_winner else "Submitted Bid"
                })
                
                # Link shared directors for this contractor
                for director in contractor.directors or []:
                    if not director.get("name"):
                        continue
                    dir_node_id = f"dir-{director.get('din', director.get('name'))}"
                    if dir_node_id not in inserted_node_ids:
                        nodes.append({
                            "id": dir_node_id,
                            "name": director["name"],
                            "type": "director",
                            "din": director.get("din"),
                            "val": 6
                        })
                        inserted_node_ids.add(dir_node_id)
                        
                    links.append({
                        "source": c_node_id,
                        "target": dir_node_id,
                        "type": "director_link",
                        "weight": 1,
                        "label": "Directorship"
                    })
            
            # Fetch approving officials
            officials_query = select(TenderOfficialLink, Official).join(Official, TenderOfficialLink.official_id == Official.id).where(TenderOfficialLink.tender_id == tender.id)
            officials_res = await db.execute(officials_query)
            officials_rows = officials_res.all()
            
            for link, official in officials_rows:
                # Square: Official Node
                o_node_id = str(official.id)
                if o_node_id not in inserted_node_ids:
                    nodes.append({
                        "id": o_node_id,
                        "name": official.name,
                        "type": "official",
                        "designation": official.designation,
                        "val": 12
                    })
                    inserted_node_ids.add(o_node_id)
                    
                # Link: Official -> Department (belongs to)
                links.append({
                    "source": o_node_id,
                    "target": dept_node_id,
                    "type": "works_in",
                    "weight": 1,
                    "label": "Approving Official"
                })
                
                # Link: Official -> Winner Contractor (approved link)
                # Find winner for this tender
                winner_bid = next((b for b, c in bids_rows if b.is_winner and c), None)
                if winner_bid and winner_bid.contractor_id:
                    links.append({
                        "source": o_node_id,
                        "target": str(winner_bid.contractor_id),
                        "type": "approved_contract",
                        "weight": 3,
                        "label": f"Approved Rigged Tender ({link.role})"
                    })
                    
        return {
            "nodes": nodes,
            "links": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed building global collusion map: {e}")
