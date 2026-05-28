import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from db.session import Base

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(String(150), unique=True, nullable=False, index=True)
    source_portal = Column(String(50), nullable=False, index=True)
    # central/state: 'gem','cppp','gujarat','maharashtra','rajasthan','delhi','tn'
    title = Column(Text, nullable=False)
    department = Column(Text, nullable=False, index=True)
    ministry = Column(Text, nullable=True)
    state = Column(String(80), nullable=True, index=True)
    category = Column(String(50), nullable=True) # 'goods','works','services','consultancy'
    
    estimated_value = Column(Numeric(18, 2), nullable=True)
    awarded_value = Column(Numeric(18, 2), nullable=True)
    currency = Column(String(10), default="INR")
    
    published_at = Column(DateTime(timezone=True), nullable=True)
    bid_open_at = Column(DateTime(timezone=True), nullable=True)
    bid_close_at = Column(DateTime(timezone=True), nullable=True)
    awarded_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    bid_window_hours = Column(Integer, nullable=True)
    # Computed: (bid_close_at - published_at) in hours
    bid_count = Column(Integer, default=0)
    
    raw_spec_text = Column(Text, nullable=True)
    # 1024-dimension pgvector embedding generated via NV-Embed-QA
    spec_embedding = Column(Vector(1024), nullable=True)
    spec_doc_hash = Column(String(64), nullable=True, index=True) # SHA-256 of raw_spec_text for exact duplication
    
    project_location = Column(Text, nullable=True)
    project_lat = Column(Numeric(10, 7), nullable=True)
    project_lng = Column(Numeric(10, 7), nullable=True)
    
    source_url = Column(Text, nullable=True)
    raw_json = Column(JSONB, nullable=True)
    parse_quality = Column(Numeric(5, 2), default=0.0) # 0-100% of required fields extracted
    
    is_pre_award = Column(Boolean, default=False, index=True)
    
    ingested_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
