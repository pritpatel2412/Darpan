from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Any
from datetime import datetime
from db.session import get_db
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/dashboard", tags=["Vigilance Dashboard Stats"])

@router.get("/march-rush")
async def get_march_rush_predictions(db: AsyncSession = Depends(get_db)):
    """
    Evaluates Central and State departments for Q4 budget dumping ('March Rush').
    Flags any department with >40% concentration of annual contracts awarded in Jan-Mar (Q4).
    """
    try:
        # Retrieve all central and central-state departments with historical awards
        query = select(
            Tender.department,
            Tender.state,
            func.sum(Tender.awarded_value).label("total_annual_value"),
            func.count(Tender.id).label("annual_tender_count")
        ).where(Tender.awarded_at.isnot(None)).group_by(Tender.department, Tender.state)
        
        res = await db.execute(query)
        dept_rows = res.all()
        
        march_rush_watch = []
        
        for dept, state, total_val, total_count in dept_rows:
            if not total_val or total_val <= 0:
                continue
                
            # Query Q4 awards for this department (Jan, Feb, Mar)
            # In SQL, EXTRACT(MONTH FROM awarded_at) IN (1, 2, 3)
            q4_query = select(
                func.sum(Tender.awarded_value).label("q4_value"),
                func.count(Tender.id).label("q4_count")
            ).where(
                and_(
                    Tender.department == dept,
                    Tender.state == state,
                    func.extract("month", Tender.awarded_at).in_([1, 2, 3])
                )
            )
            
            q4_res = await db.execute(q4_query)
            q4_val, q4_count = q4_res.first() or (0.0, 0)
            
            q4_val = float(q4_val) if q4_val else 0.0
            total_val = float(total_val)
            
            # Calculate concentration percentage
            q4_concentration = (q4_val / total_val) * 100.0 if total_val > 0 else 0.0
            
            # Flag if >40%
            is_flagged = q4_concentration > 40.0 and total_count >= 3
            
            march_rush_watch.append({
                "department": dept,
                "state": state,
                "total_annual_value_inr": total_val,
                "annual_tender_count": total_count,
                "q4_value_inr": q4_val,
                "q4_tender_count": q4_count or 0,
                "q4_concentration_pct": round(q4_concentration, 2),
                "is_flagged": is_flagged,
                "risk_tier": "critical" if q4_concentration > 60 else "high" if is_flagged else "medium" if q4_concentration > 25 else "low"
            })
            
        # Sort by Q4 concentration desc
        march_rush_watch.sort(key=lambda x: x["q4_concentration_pct"], reverse=True)
        
        # Countdown helper for next Q4 budget rush
        now = datetime.now()
        next_q4_start = datetime(now.year if now.month < 1 else now.year + 1, 1, 1)
        days_remaining = (next_q4_start - now).days
        
        return {
            "countdown_days_to_q4": max(0, days_remaining),
            "watchlist": march_rush_watch[:20]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed compiling March Rush data: {e}")
