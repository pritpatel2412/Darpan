from sqlalchemy.ext.asyncio import AsyncSession
from fraud.scorer import SignalResult

async def check_single_bidder(tender, db: AsyncSession) -> SignalResult:
    """
    Evaluates if a high-value central or state tender only received a single bid,
    indicating non-competitive sole-sourcing or restrictive pre-qualification collusion.
    """
    bid_count = tender.bid_count or 0
    est_value = float(tender.estimated_value) if tender.estimated_value else 0.0
    
    # Trigger if only 1 bid received for tenders > ₹25 Lakh
    is_triggered = bid_count == 1 and est_value > 2500000.0
    
    strength = 0.0
    if is_triggered:
        if est_value > 100000000.0: # > ₹10 Crore
            strength = 1.0
        elif est_value > 50000000.0: # > ₹5 Crore
            strength = 0.95
        else:
            strength = 0.90
            
    interpretation = (
        f"The tender received exactly {bid_count} bid. High-value contracts "
        f"(₹{est_value:,.2f}) require broad competitive bidding under standard guidelines."
    ) if is_triggered else "Competitive multi-bid response recorded."

    evidence = {
        "bid_count": bid_count,
        "estimated_value": est_value,
        "portal": tender.source_portal,
        "interpretation": interpretation
    }
    
    return SignalResult(
        triggered=is_triggered,
        strength=strength,
        evidence=evidence
    )
