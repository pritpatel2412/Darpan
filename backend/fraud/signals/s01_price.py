from sqlalchemy.ext.asyncio import AsyncSession
from fraud.scorer import SignalResult
from integrations.smart_fetcher import SmartFetcher
from integrations.groq_client import GroqClient

async def check_price_inflation(tender, db: AsyncSession) -> SignalResult:
    """
    Compares the awarded contract value against median market prices.
    Uses SmartFetcher cascade: Redis -> GeM catalog reference -> TinyFish search + NIMs.
    """
    if not tender.awarded_value or tender.awarded_value <= 0:
        return SignalResult(
            triggered=False,
            strength=0.0,
            evidence={"reason": "Tender awarded value is missing or zero"}
        )
        
    if tender.category == "works" or tender.category == "consultancy":
        # Services/Works are harder to price, price inflation is muted or skipped
        return SignalResult(
            triggered=False,
            strength=0.0,
            evidence={"reason": "Works/consultancy categories are excluded from standardized price matching."}
        )

    # 1. Extract item details from spec text using Groq
    groq = GroqClient()
    spec_sample = tender.raw_spec_text[:3000] if tender.raw_spec_text else tender.title
    item_desc = await groq.extract_item(spec_sample)
    
    if not item_desc or not item_desc.get("item_name"):
        return SignalResult(
            triggered=False,
            strength=0.0,
            evidence={"reason": "Could not identify standard commodity in specifications."}
        )
        
    item_name = item_desc["item_name"]
    quantity = item_desc.get("quantity") or 1
    
    # 2. Retrieve market price references using Smart Fetcher
    fetcher = SmartFetcher()
    price_res = await fetcher.fetch_market_price(item_desc)
    
    if not price_res.data or not price_res.data.get("price"):
        return SignalResult(
            triggered=False,
            strength=0.0,
            evidence={
                "reason": "Insufficient comparative market pricing found.",
                "item_analyzed": item_name
            }
        )
        
    market_price_unit = float(price_res.data["price"])
    awarded_price_unit = float(tender.awarded_value) / quantity
    
    # 3. Calculate inflation ratio
    ratio = awarded_price_unit / market_price_unit
    overpayment = max(0.0, float(tender.awarded_value) - (market_price_unit * quantity))
    
    # 4. Graduated strength threshold mapping
    if ratio < 1.5:
        strength = 0.0
    elif ratio < 1.8:
        strength = 0.25 # mildly elevated
    elif ratio < 2.5:
        strength = 0.60 # significantly elevated
    elif ratio < 4.0:
        strength = 0.85 # severely inflated
    else:
        strength = 1.0  # extreme markup
        
    interpretation = (
        f"Awarded unit cost of ₹{awarded_price_unit:,.2f} is {ratio:.2f}x "
        f"the market rate of ₹{market_price_unit:,.2f}. "
        f"Estimated overpayment on {quantity} units: ₹{overpayment:,.2f}."
    )
    
    evidence = {
        "item_name": item_name,
        "quantity": quantity,
        "market_price_per_unit": market_price_unit,
        "awarded_price_per_unit": awarded_price_unit,
        "ratio": round(ratio, 2),
        "overpayment_estimate": round(overpayment, 2),
        "market_sources": price_res.data.get("sources", []),
        "interpretation": interpretation
    }
    
    return SignalResult(
        triggered=ratio >= 1.8,
        strength=strength,
        evidence=evidence
    )
