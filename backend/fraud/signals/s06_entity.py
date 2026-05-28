from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fraud.scorer import SignalResult
from models.contractor import Contractor, TenderBid

async def check_new_entity(tender, db: AsyncSession) -> SignalResult:
    """
    Flags newly incorporated shell companies winning high-value government contracts.
    Compares contractor registration date with tender publication date.
    """
    try:
        # Retrieve winning contractor
        winner_q = select(Contractor).join(TenderBid, Contractor.id == TenderBid.contractor_id).where(
            and_(TenderBid.tender_id == tender.id, TenderBid.is_winner == True)
        )
        winner_res = await db.execute(winner_q)
        contractor = winner_res.scalar_one_or_none()
        
        if not contractor or not contractor.registration_date:
            return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Contractor registration date is unavailable."})
            
        published_date = tender.published_at.date() if tender.published_at else None
        if not published_date:
            return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Tender published date is unavailable."})
            
        registration_gap = (published_date - contractor.registration_date).days
        
        strength = 0.0
        if registration_gap < 0:
            # Backdated company or registration error
            strength = 1.0
        elif registration_gap < 15:
            strength = 0.95
        elif registration_gap < 30:
            strength = 0.85
        elif registration_gap < 60:
            strength = 0.65
        elif registration_gap < 180: # 6 months
            strength = 0.25
            
        is_triggered = registration_gap < 60
        
        interpretation = (
            f"The contractor '{contractor.name}' was incorporated on "
            f"{contractor.registration_date.isoformat()}, exactly {registration_gap} days "
            f"before this tender was published. This is a common shell entity signature."
        ) if is_triggered else f"Contractor registration age is adequate ({registration_gap} days)."

        evidence = {
            "contractor_name": contractor.name,
            "registration_date": contractor.registration_date.isoformat(),
            "days_before_tender": registration_gap,
            "interpretation": interpretation
        }
        
        return SignalResult(
            triggered=is_triggered,
            strength=strength,
            evidence=evidence
        )
    except Exception as e:
        print(f"Error checking new entity signal: {e}")
        return SignalResult(triggered=False, strength=0.0, evidence={"error": str(e)})
