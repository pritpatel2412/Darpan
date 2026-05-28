from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from db.session import get_db
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/fraud", tags=["Fraud & Audits"])

@router.get("/stats")
async def get_fraud_stats(db: AsyncSession = Depends(get_db)):
    """
    Retrieve aggregated dashboard stats: total scanned, flags by tier, total overpayment estimate.
    """
    try:
        # Total scanned tenders
        total_scanned_res = await db.execute(select(func.count(Tender.id)))
        total_scanned = total_scanned_res.scalar() or 0
        
        # Fraud scores by tier
        tier_query = select(FraudScore.tier, func.count(FraudScore.id)).group_by(FraudScore.tier)
        tier_res = await db.execute(tier_query)
        tier_counts = {row[0]: row[1] for row in tier_res.all()}
        
        # Total estimated overpayment
        # Sum over s01_evidence->'overpayment_estimate'
        # To avoid complex JSONB sums in SQL, we can sum calculated estimated values where price ratio is inflated, 
        # or do a simple SQL sum over an estimated column
        total_flags_query = select(func.count(FraudScore.id)).where(FraudScore.confidence >= 40.0)
        total_flags_res = await db.execute(total_flags_query)
        total_flags = total_flags_res.scalar() or 0
        
        # In this simple model, let's sum estimated_value * (1 - 1/price_ratio) as an overpayment estimate, 
        # or sum s01_evidence->>'overpayment_estimate' using postgres json cast
        overpayment_query = select(func.sum(Tender.awarded_value)).join(FraudScore, Tender.id == FraudScore.tender_id).where(FraudScore.s01_price > 0.5)
        overpayment_res = await db.execute(overpayment_query)
        total_inflated_value = overpayment_res.scalar() or 0
        
        # Estimated direct overpayment is roughly 25% of total inflated contracts as a conservative placeholder
        est_overpayment = float(total_inflated_value) * 0.28
        
        # Active RTIs filed
        from models.rti_application import RTIApplication
        rti_count_res = await db.execute(select(func.count(RTIApplication.id)).where(RTIApplication.status != "draft"))
        rtis_filed = rti_count_res.scalar() or 0

        return {
            "total_tenders_scanned": total_scanned,
            "total_flagged_cases": total_flags,
            "tier_distribution": {
                "critical": tier_counts.get("critical", 0),
                "high": tier_counts.get("high", 0),
                "medium": tier_counts.get("medium", 0),
                "low": tier_counts.get("low", 0)
            },
            "estimated_taxpayer_loss_inr": est_overpayment,
            "total_rtis_filed": rtis_filed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compiling stats: {e}")

@router.get("/heatmap")
async def get_fraud_heatmap(db: AsyncSession = Depends(get_db)):
    """
    Get per-state aggregated audit results for choropleth mapping.
    """
    try:
        # Sum of awarded values and count of flagged cases grouped by state
        query = select(
            Tender.state,
            func.count(Tender.id).label("flagged_count"),
            func.sum(Tender.awarded_value).label("flagged_value"),
            func.avg(FraudScore.confidence).label("avg_confidence")
        ).join(FraudScore, Tender.id == FraudScore.tender_id).where(FraudScore.confidence >= 40.0).group_by(Tender.state)
        
        result = await db.execute(query)
        rows = result.all()
        
        heatmap_data = []
        for state, count, val, conf in rows:
            if not state:
                continue
            heatmap_data.append({
                "state": state,
                "flagged_count": count,
                "flagged_value": float(val) if val else 0.0,
                "avg_confidence": float(conf) if conf else 0.0
            })
            
        return heatmap_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compiling heatmap: {e}")

@router.get("/departments")
async def get_department_leaderboard(db: AsyncSession = Depends(get_db)):
    """
    Rank departments by flagged tender count and contract values.
    """
    try:
        query = select(
            Tender.department,
            Tender.state,
            func.count(Tender.id).label("flagged_count"),
            func.sum(Tender.awarded_value).label("flagged_value"),
            func.avg(FraudScore.confidence).label("avg_confidence")
        ).join(FraudScore, Tender.id == FraudScore.tender_id).where(FraudScore.confidence >= 40.0).group_by(Tender.department, Tender.state).order_by(func.count(Tender.id).desc()).limit(15)
        
        result = await db.execute(query)
        rows = result.all()
        
        depts = []
        for dept, state, count, val, conf in rows:
            depts.append({
                "department": dept,
                "state": state,
                "flagged_count": count,
                "flagged_value": float(val) if val else 0.0,
                "avg_confidence": float(conf) if conf else 0.0
            })
            
        return depts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compiling department rankings: {e}")

@router.post("/dispute")
async def submit_fraud_dispute(
    tender_id: str = Body(..., embed=True),
    evidence_text: str = Body(..., embed=True),
    contact_email: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows a winning contractor or department official to submit dispute/justification evidence.
    Queues the case for manual review by an admin.
    """
    try:
        import uuid
        try:
            uuid_val = uuid.UUID(tender_id)
            query = select(FraudScore).where(FraudScore.tender_id == uuid_val)
        except ValueError:
            query = select(FraudScore).join(Tender, FraudScore.tender_id == Tender.id).where(Tender.tender_id == tender_id)
            
        result = await db.execute(query)
        score = result.scalar_one_or_none()
        
        if not score:
            raise HTTPException(status_code=404, detail="Flagged tender score record not found")
            
        # Update dispute fields in DB
        score.dispute_text = f"Dispute Email: {contact_email}\nEvidence Submitted:\n{evidence_text}"
        await db.commit()
        
        return {
            "status": "success",
            "message": "Dispute filed and queued for human audit review."
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Dispute submission failed: {e}")

@router.get("/feed")
async def get_rss_feed(db: AsyncSession = Depends(get_db)):
    """
    Returns RSS-compliant JSON feed of the latest high-confidence flags.
    """
    try:
        query = select(Tender, FraudScore).join(FraudScore, Tender.id == FraudScore.tender_id).where(FraudScore.confidence >= 70.0).order_by(FraudScore.scored_at.desc()).limit(20)
        
        result = await db.execute(query)
        rows = result.all()
        
        items = []
        for tender, score in rows:
            items.append({
                "title": f"[{score.tier.upper()} RISK DETECTED] {tender.title}",
                "description": score.groq_narrative or "High-confidence procurement fraud patterns identified.",
                "link": f"{config.FRONTEND_URL}/tender/{tender.id}",
                "pubDate": score.scored_at.isoformat(),
                "metadata": {
                    "tender_id": tender.tender_id,
                    "department": tender.department,
                    "awarded_value_inr": float(tender.awarded_value) if tender.awarded_value else 0.0,
                    "confidence_score": float(score.confidence)
                }
            })
            
        return {
            "title": "DARPAN Live Vigilance Feed",
            "description": "Real-time AI alerts on high-risk public procurement contracts in India.",
            "link": config.FRONTEND_URL,
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feed generation failed: {e}")
