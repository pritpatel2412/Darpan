import uuid
from sqlalchemy import Column, String, Text, Integer, Numeric, Boolean, DateTime, ForeignKey, ARRAY, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from db.session import Base

class Official(Base):
    __tablename__ = "officials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    designation = Column(Text, nullable=True)
    department = Column(Text, nullable=True)
    
    # 1024-dimension name embedding for fuzzy search (E5 model)
    name_embedding = Column(Vector(1024), nullable=True)
    
    flagged_count = Column(Integer, default=0)
    total_flagged_value = Column(Numeric(18, 2), default=0.0)
    
    fingerprint_flag = Column(Boolean, default=False, index=True) # TRUE when appears in 3+ flagged tenders within 24 months
    
    departments_spanned = Column(ARRAY(Text), nullable=True) # Array of unique departments this official appeared in
    
    created_at = Column(DateTime(timezone=True), default=func.now())

    tenders = relationship("TenderOfficialLink", back_populates="official")


class TenderOfficialLink(Base):
    __tablename__ = "tender_official_links"

    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id", ondelete="CASCADE"), primary_key=True)
    official_id = Column(UUID(as_uuid=True), ForeignKey("officials.id"), primary_key=True)
    role = Column(String(30), primary_key=True) # 'approver' | 'evaluator' | 'signatory' | 'committee_member'

    official = relationship("Official", back_populates="tenders")
    tender = relationship("Tender")
