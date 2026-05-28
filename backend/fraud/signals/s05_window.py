from sqlalchemy.ext.asyncio import AsyncSession
from fraud.scorer import SignalResult

async def check_narrow_bid_window(tender, db: AsyncSession) -> SignalResult:
    """
    Evaluates if the time allowed for bid submission was artificially shortened 
    to lock out outside competitors and favor a pre-selected vendor.
    """
    bid_window_hours = tender.bid_window_hours
    
    if not bid_window_hours:
        if tender.published_at and tender.bid_close_at:
            delta = tender.bid_close_at - tender.published_at
            bid_window_hours = int(delta.total_seconds() / 3600.0)
            
    if not bid_window_hours or bid_window_hours <= 0:
        return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Dates missing or invalid."})

    est_value = float(tender.estimated_value) if tender.estimated_value else 0.0
    
    # Only applies to tenders > ₹5 Lakh
    if est_value <= 500000.0:
        return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Contract value too low for window flag."})

    # CVC guidelines recommend minimum 15 to 30 days for competitive Central/State tenders
    strength = 0.0
    if bid_window_hours < 48:
        strength = 1.0
    elif bid_window_hours < 72:
        strength = 0.85
    elif bid_window_hours < 120:
        strength = 0.50
    elif bid_window_hours < 168: # 7 days
        strength = 0.30
        
    is_triggered = bid_window_hours < 120 # flagged if less than 5 days
    
    interpretation = (
        f"The bid submission window was closed in {bid_window_hours} hours. "
        f"This restricts outside contractors from studying specs and compiling bids."
    ) if is_triggered else f"Adequate bid window provided ({bid_window_hours} hours)."

    evidence = {
        "bid_window_hours": bid_window_hours,
        "estimated_value": est_value,
        "minimum_recommended_days": 15,
        "interpretation": interpretation
    }
    
    return SignalResult(
        triggered=is_triggered,
        strength=strength,
        evidence=evidence
    )
