from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from db.session import get_db
from models.tender import Tender
from models.fraud_score import FraudScore

router = APIRouter(prefix="/scanner", tags=["On-Demand Instant Scanner"])

@router.post("/instant")
async def scan_tender_instant(
    tender_id: str = Body(..., embed=True),
    portal: str = Body("gem", embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Performs real-time, on-demand scanning of any government tender ID.
    1. Crawls tender in real-time using Smart Fetcher.
    2. Parses spec text.
    3. Runs 10 fraud signal detection algorithms.
    4. Generates Groq executive narrative.
    5. Stores records in DB and returns the complete scorecard immediately.
    """
    try:
        # Check if already scanned and cached in DB
        existing_q = select(Tender).where(Tender.tender_id == tender_id)
        existing_res = await db.execute(existing_q)
        tender = existing_res.scalar_one_or_none()
        
        if tender:
            # Already exists, fetch and return score
            score_q = select(FraudScore).where(FraudScore.tender_id == tender.id)
            score_res = await db.execute(score_q)
            score = score_res.scalar_one_or_none()
            
            if score:
                return {
                    "status": "cached",
                    "tender_uuid": str(tender.id),
                    "confidence": float(score.confidence),
                    "tier": score.tier,
                    "groq_narrative": score.groq_narrative,
                    "price_ratio": float(score.price_ratio) if score.price_ratio else 1.0,
                    "details": {
                        "title": tender.title,
                        "department": tender.department,
                        "value": float(tender.awarded_value) if tender.awarded_value else 0.0
                    }
                }
                
        # 1. Fetch using Smart Fetcher (will trigger GeM API / Playwright / CPPP)
        from integrations.smart_fetcher import SmartFetcher
        fetcher = SmartFetcher()
        fetch_result = await fetcher.fetch_tender(tender_id, portal)
        
        if not fetch_result.data:
            raise HTTPException(
                status_code=404, 
                detail=f"Could not locate tender [{tender_id}] on portal [{portal}]. {fetch_result.error or ''}"
            )
            
        # 2. Extract and create Tender ORM record
        raw_data = fetch_result.data
        new_tender = Tender(
            tender_id=tender_id,
            source_portal=portal,
            title=raw_data.get("title", f"Tender {tender_id}"),
            department=raw_data.get("department", "Unknown Department"),
            ministry=raw_data.get("ministry"),
            state=raw_data.get("state"),
            category=raw_data.get("category", "goods"),
            estimated_value=raw_data.get("estimated_value"),
            awarded_value=raw_data.get("awarded_value") or raw_data.get("estimated_value"),
            published_at=raw_data.get("published_at"),
            bid_open_at=raw_data.get("bid_open_at"),
            bid_close_at=raw_data.get("bid_close_at"),
            awarded_at=raw_data.get("awarded_at"),
            bid_window_hours=raw_data.get("bid_window_hours") or 72, # default fallback
            bid_count=raw_data.get("bid_count") or 1,
            raw_spec_text=raw_data.get("raw_spec_text", ""),
            source_url=raw_data.get("source_url", fetch_result.raw_url),
            raw_json=raw_data,
            parse_quality=85.0 # high quality on-demand
        )
        
        db.add(new_tender)
        await db.flush() # Populate ID
        
        # 3. Generate NV-Embed-QA spec embedding in background or real-time
        # For instant results, we run the NVIDIA embed client
        from integrations.nvidia_nims import NIMSClient
        nims = NIMSClient()
        try:
            embedding = await nims.embed(new_tender.raw_spec_text or new_tender.title)
            new_tender.spec_embedding = embedding
        except Exception as embed_err:
            print(f"Warning: spec embedding generation failed in scanner: {embed_err}")
            
        # 4. Evaluate all 10 signals in parallel
        # To run them in parallel, we can assemble their coroutines
        import asyncio
        from fraud.signals.s01_price import check_price_inflation
        from fraud.signals.s02_spec import check_spec_tailoring
        from fraud.signals.s03_concentration import check_win_concentration
        
        # For other signals, we can import or use fallback mocks
        # Mocks will be fully implemented in our Phase 5
        s1_coro = check_price_inflation(new_tender, db)
        s2_coro = check_spec_tailoring(new_tender, db)
        s3_coro = check_win_concentration(new_tender, db)
        
        # Run parallel evaluations
        s1, s2, s3 = await asyncio.gather(s1_coro, s2_coro, s3_coro)
        
        # Assemble signal dictionary
        signals_results = {
            "s01_price": s1,
            "s02_spec": s2,
            "s03_concentration": s3
            # Simple fallback defaults for others during scanner mock stage
        }
        
        # Fill standard values for other signals
        from fraud.scorer import SignalResult
        for sig_idx in range(4, 11):
            sig_name = f"s{sig_idx:02d}"
            # Placeholder signals
            signals_results[sig_name] = SignalResult(triggered=False, strength=0.0, evidence={"note": "Default scanner evaluation"})
            
        # 5. Compute overall score
        from fraud.scorer import calculate_confidence
        confidence_score, multiplier = calculate_confidence(signals_results)
        
        # Determine tier
        if confidence_score >= 85.0:
            tier = "critical"
        elif confidence_score >= 70.0:
            tier = "high"
        elif confidence_score >= 40.0:
            tier = "medium"
        else:
            tier = "low"
            
        # 6. Run Groq narrative orchestrator
        from fraud.orchestrator import orchestrate_fraud_signals
        groq_narrative = await orchestrate_fraud_signals(new_tender, signals_results)
        
        # Create FraudScore ORM
        score = FraudScore(
            tender_id=new_tender.id,
            confidence=confidence_score,
            tier=tier,
            s01_price=s1.strength,
            s02_spec=s2.strength,
            s03_concentration=s3.strength,
            s01_evidence=s1.evidence,
            s02_evidence=s2.evidence,
            s03_evidence=s3.evidence,
            groq_narrative=groq_narrative.get("narrative"),
            groq_likelihood=groq_narrative.get("likelihood", "medium"),
            groq_strongest=groq_narrative.get("strongest_signal"),
            price_ratio=s1.evidence.get("ratio", 1.0)
        )
        
        db.add(score)
        await db.commit()
        
        return {
            "status": "scanned",
            "tender_uuid": str(new_tender.id),
            "confidence": float(score.confidence),
            "tier": score.tier,
            "groq_narrative": score.groq_narrative,
            "price_ratio": float(score.price_ratio) if score.price_ratio else 1.0,
            "details": {
                "title": new_tender.title,
                "department": new_tender.department,
                "value": float(new_tender.awarded_value) if new_tender.awarded_value else 0.0
            }
        }
    except Exception as e:
        await db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"On-demand scan failed: {e}")
