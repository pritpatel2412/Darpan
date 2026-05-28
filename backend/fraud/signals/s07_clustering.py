from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fraud.scorer import SignalResult
from models.contractor import TenderBid

async def check_bid_clustering(tender, db: AsyncSession) -> SignalResult:
    """
    Flags potential cartels/bid collusion. Triggers if bid amounts 
    from 3+ bidders are within an extremely narrow spread (<0.5%).
    """
    try:
        # Retrieve all bids for this tender
        bids_q = select(TenderBid.bid_amount).where(TenderBid.tender_id == tender.id).order_by(TenderBid.bid_amount.asc())
        bids_res = await db.execute(bids_q)
        bid_amounts = [float(b) for b in bids_res.scalars().all() if b]
        
        if len(bid_amounts) < 3:
            return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Fewer than 3 bids available for clustering analysis."})
            
        min_bid = bid_amounts[0]
        max_bid = bid_amounts[-1]
        
        # Calculate spread relative to maximum bid
        spread_pct = (max_bid - min_bid) / max_bid if max_bid > 0 else 0.0
        
        strength = 0.0
        is_triggered = False
        
        if spread_pct < 0.005: # < 0.5%
            strength = 1.0
            is_triggered = True
        elif spread_pct < 0.015: # < 1.5%
            strength = 0.65
            is_triggered = True
        elif spread_pct < 0.03: # < 3.0%
            strength = 0.25
            
        interpretation = (
            f"Bids from {len(bid_amounts)} competitors clustered within an extremely "
            f"narrow {spread_pct*100:.2f}% spread. This indicates collusive cover bidding "
            f"to simulate competition."
        ) if is_triggered else f"Standard competitive spread recorded ({spread_pct*100:.2f}%)."

        evidence = {
            "bid_amounts": bid_amounts,
            "bid_count": len(bid_amounts),
            "spread_pct": round(spread_pct * 100, 3),
            "interpretation": interpretation
        }
        
        return SignalResult(
            triggered=is_triggered,
            strength=strength,
            evidence=evidence
        )
    except Exception as e:
        print(f"Error checking bid clustering signal: {e}")
        return SignalResult(triggered=False, strength=0.0, evidence={"error": str(e)})
