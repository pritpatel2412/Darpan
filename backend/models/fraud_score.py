import uuid
from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from db.session import Base

class FraudScore(Base):
    __tablename__ = "fraud_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    confidence = Column(Numeric(5, 2), nullable=False) # 0.00 to 100.00
    tier = Column(String(20), nullable=False, index=True) # 'critical' | 'high' | 'medium' | 'low'

    # Signal strengths (0.000 to 1.000)
    s01_price = Column(Numeric(4, 3), default=0.0)
    s02_spec = Column(Numeric(4, 3), default=0.0)
    s03_concentration = Column(Numeric(4, 3), default=0.0)
    s04_single_bid = Column(Numeric(4, 3), default=0.0)
    s05_window = Column(Numeric(4, 3), default=0.0)
    s06_entity = Column(Numeric(4, 3), default=0.0)
    s07_clustering = Column(Numeric(4, 3), default=0.0)
    s08_linked = Column(Numeric(4, 3), default=0.0) # Shared director/address networks
    s09_spec_copy = Column(Numeric(4, 3), default=0.0) # Duplication pgvector checks
    s10_amendment = Column(Numeric(4, 3), default=0.0) # Post-award amendment costs
    
    bonus_multiplier = Column(Numeric(4, 3), default=1.000)

    # Evidence JSON per signal
    s01_evidence = Column(JSONB, nullable=True)
    s02_evidence = Column(JSONB, nullable=True)
    s03_evidence = Column(JSONB, nullable=True)
    s04_evidence = Column(JSONB, nullable=True)
    s05_evidence = Column(JSONB, nullable=True)
    s06_evidence = Column(JSONB, nullable=True)
    s07_evidence = Column(JSONB, nullable=True)
    s08_evidence = Column(JSONB, nullable=True)
    s09_evidence = Column(JSONB, nullable=True)
    s10_evidence = Column(JSONB, nullable=True)

    # Market pricing data
    market_price = Column(Numeric(18, 2), nullable=True)
    market_sources = Column(JSONB, nullable=True) # List: [{url, price, unit, confidence}]
    price_ratio = Column(Numeric(6, 3), nullable=True)

    # Groq narrative
    groq_narrative = Column(Text, nullable=True)
    groq_likelihood = Column(String(10), nullable=True)
    groq_strongest = Column(String(20), nullable=True)

    # Evidence package (Codex-assembled)
    evidence_package = Column(JSONB, nullable=True)

    # Review fields
    false_positive = Column(Boolean, nullable=True)
    reviewed_by = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    dispute_text = Column(Text, nullable=True)

    scored_at = Column(DateTime(timezone=True), default=func.now(), index=True)

    tender = relationship("Tender")
