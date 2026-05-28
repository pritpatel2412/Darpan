from typing import Dict, Any, List
from datetime import datetime, timezone

def assemble_evidence_package(tender, score, contractor, bids: List[Dict[str, Any]], signals_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Assembles a comprehensive, journalist-grade fraud evidence portfolio.
    Formats pricing, timelines, legal provisions, and department networks into structured JSON.
    """
    # 1. Tender details metadata
    tender_meta = {
        "tender_id": tender.tender_id,
        "title": tender.title,
        "department": tender.department,
        "ministry": tender.ministry,
        "state": tender.state,
        "awarded_value_inr": float(tender.awarded_value) if tender.awarded_value else 0.0,
        "estimated_value_inr": float(tender.estimated_value) if tender.estimated_value else 0.0,
        "published_at": tender.published_at.isoformat() if tender.published_at else None,
        "bid_close_at": tender.bid_close_at.isoformat() if tender.bid_close_at else None,
        "awarded_at": tender.awarded_at.isoformat() if tender.awarded_at else None,
        "source_url": tender.source_url
    }

    # 2. Contractor details metadata
    contractor_meta = {
        "cin": contractor.cin if contractor else None,
        "name": contractor.name if contractor else "Unknown Vendor",
        "registration_date": contractor.registration_date.isoformat() if (contractor and contractor.registration_date) else None,
        "registered_address": contractor.registered_address if contractor else None,
        "directors": contractor.directors if contractor else [],
        "ed_case_found": contractor.ed_case_found if contractor else False,
        "ed_case_details": contractor.ed_case_details if contractor else None
    }

    # 3. Compile signal triggers
    signals_list = []
    for sig_name, sig_res in signals_results.items():
        signals_list.append({
            "signal_id": sig_name,
            "triggered": getattr(sig_res, "triggered", False),
            "strength": round(float(getattr(sig_res, "strength", 0.0)), 2),
            "evidence": getattr(sig_res, "evidence", {})
        })

    # 4. Formulate pricing ratios and references
    price_analysis = {
        "awarded_value_inr": float(tender.awarded_value) if tender.awarded_value else 0.0,
        "price_ratio": float(score.price_ratio) if score.price_ratio else 1.0,
        "market_median_price_unit": float(score.market_price) if score.market_price else 0.0,
        "sources": score.market_sources if score.market_sources else []
    }

    # 5. Extract applicable legal provisions
    legal_provisions = [
        "Section 6(1) of the Right to Information (RTI) Act 2005 - Right to request procurement records.",
        "Section 7(1) of the Right to Information (RTI) Act 2005 - Mandated 30-day statutory response deadline.",
        "Section 13(1)(d) of the Prevention of Corruption Act (PCA) 1988 - Abuse of official position to obtain pecuniary advantage."
    ]
    if score.s08_linked > 0.5:
        legal_provisions.append("Section 3 of the Competition Act 2002 - Anti-competitive bid rigging cartels.")

    # 6. Actionable recommendations
    recommended_action = (
        "AUTONOMOUS RTI ACTION REQUIRED: Score exceeds statutory threshold (70%). "
        "File automated information request to PIO. Alert CVC and regional audit bureaus."
    ) if float(score.confidence) >= 70.0 else (
        "dashboard queue: High-risk indicators recorded. Mount on public feed. Queue for manual dispute reviews."
    )

    return {
        "compiled_at": datetime.now(timezone.utc).isoformat(),
        "executive_summary": score.groq_narrative,
        "risk_confidence": float(score.confidence),
        "risk_tier": score.tier,
        "strongest_indicator": score.groq_strongest,
        "tender_metadata": tender_meta,
        "contractor_metadata": contractor_meta,
        "signals_breakdown": signals_list,
        "pricing_table": price_analysis,
        "legal_basis": legal_provisions,
        "recommended_action": recommended_action
    }
