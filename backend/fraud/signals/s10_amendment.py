from sqlalchemy.ext.asyncio import AsyncSession
from fraud.scorer import SignalResult

async def check_post_award_amendment(tender, db: AsyncSession) -> SignalResult:
    """
    Bonus Signal: Flags post-award cost inflation where the final contract value 
    exceeds the original estimated value by more than 15%.
    """
    est_value = float(tender.estimated_value) if tender.estimated_value else 0.0
    awarded_value = float(tender.awarded_value) if tender.awarded_value else 0.0
    
    if est_value <= 0.0 or awarded_value <= 0.0:
        return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Tender estimated or awarded values are unavailable."})
        
    increase_pct = (awarded_value - est_value) / est_value
    
    is_triggered = increase_pct > 0.15 # Flag if cost inflated by more than 15%
    
    strength = 0.0
    if is_triggered:
        if increase_pct > 0.50:
            strength = 1.0
        elif increase_pct > 0.30:
            strength = 0.85
        else:
            strength = 0.65
            
    interpretation = (
        f"The contract value was inflated by {increase_pct*100:.1f}% post-award "
        f"(from ₹{est_value:,.2f} to ₹{awarded_value:,.2f}). Cost amendments of this scale "
        f"indicate initial under-bidding manipulation or collusive adjustments."
    ) if is_triggered else f"Contract value remained within baseline (+{increase_pct*100:.1f}%)."

    evidence = {
        "estimated_value": est_value,
        "awarded_value": awarded_value,
        "increase_pct": round(increase_pct * 100, 2),
        "interpretation": interpretation
    }
    
    return SignalResult(
        triggered=is_triggered,
        strength=strength,
        evidence=evidence
    )
