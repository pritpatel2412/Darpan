from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fraud.scorer import SignalResult
from models.tender import Tender
from fraud.signals.s02_spec import cosine_similarity

async def check_spec_copy(tender, db: AsyncSession) -> SignalResult:
    """
    Bonus Signal: Detects copy-pasted specifications by calculating 
    pgvector cosine similarity against other tenders in the database.
    """
    try:
        tender_vector = tender.spec_embedding
        
        if not tender_vector:
            return SignalResult(triggered=False, strength=0.0, evidence={"reason": "Specification vector embedding is unavailable."})

        # Fetch other tenders that have spec embeddings
        # In a high-scale production database, we would use pgvector's <-> cosine operator in SQL
        # E.g. select(Tender).order_by(Tender.spec_embedding.cosine_distance(tender_vector)).limit(2)
        # Here we perform a standard query and compute similarity
        query = select(Tender).where(
            and_(Tender.id != tender.id, Tender.spec_embedding.isnot(None))
        ).limit(30)
        
        result = await db.execute(query)
        other_tenders = result.scalars().all()
        
        highest_similarity = 0.0
        matched_tender = None
        
        for other in other_tenders:
            similarity = cosine_similarity(tender_vector, other.spec_embedding)
            if similarity > highest_similarity:
                highest_similarity = similarity
                matched_tender = other
                
        is_triggered = highest_similarity >= 0.90
        
        interpretation = (
            f"The specification document is a {highest_similarity*100:.1f}% literal duplicate "
            f"of a prior tender '{matched_tender.title}' (Tender No. {matched_tender.tender_id}) "
            f"issued by '{matched_tender.department}'."
        ) if is_triggered else f"No duplicate specification matches found (highest similarity: {highest_similarity*100:.1f}%)."

        evidence = {
            "highest_similarity": round(highest_similarity, 3),
            "matched_tender_id": str(matched_tender.id) if matched_tender else None,
            "matched_tender_number": matched_tender.tender_id if matched_tender else None,
            "matched_department": matched_tender.department if matched_tender else None,
            "interpretation": interpretation
        }
        
        return SignalResult(
            triggered=is_triggered,
            strength=1.0 if is_triggered else 0.0,
            evidence=evidence
        )
    except Exception as e:
        print(f"Error checking spec copy signal: {e}")
        return SignalResult(triggered=False, strength=0.0, evidence={"error": str(e)})
