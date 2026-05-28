import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, Boolean, Numeric, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from db.session import Base

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cin = Column(String(21), unique=True, nullable=True, index=True) # Corporate Identification Number
    name = Column(Text, nullable=False)
    name_normalized = Column(Text, nullable=True, index=True) # Normalized name for deduplication
    
    # 1024-dimension pgvector embedding for fuzzy name matching (E5 model)
    name_embedding = Column(Vector(1024), nullable=True)
    
    pan = Column(String(10), nullable=True)
    registration_date = Column(Date, nullable=True)
    registration_source = Column(String(50), default="mca21")
    registered_state = Column(String(80), nullable=True)
    registered_address = Column(Text, nullable=True)
    address_hash = Column(String(64), nullable=True, index=True) # SHA-256(normalized_address)
    
    directors = Column(JSONB, nullable=True) # List: [{name: str, din: str, since: date}]
    
    total_won = Column(Integer, default=0)
    total_value_won = Column(Numeric(18, 2), default=0.0)
    
    watchlist = Column(Boolean, default=False, index=True)
    watchlist_reason = Column(Text, nullable=True)
    
    ed_case_found = Column(Boolean, default=False)
    ed_case_details = Column(Text, nullable=True) # TinyFish news search results about ED/ACB cases
    
    first_seen_at = Column(DateTime(timezone=True), default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True) # When MCA21 was last verified

    bids = relationship("TenderBid", back_populates="contractor")


class TenderBid(Base):
    __tablename__ = "tender_bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("contractors.id"), nullable=True, index=True)
    
    bid_amount = Column(Numeric(18, 2), nullable=True)
    is_winner = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    disqualified = Column(Boolean, default=False)
    disq_reason = Column(Text, nullable=True)

    contractor = relationship("Contractor", back_populates="bids")
    tender = relationship("Tender")
