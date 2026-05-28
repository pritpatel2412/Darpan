import uuid
import secrets
from sqlalchemy import Column, String, Text, Integer, Numeric, Boolean, DateTime, ForeignKey, ARRAY, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from db.session import Base

def generate_secure_token():
    return secrets.token_hex(32)

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=True) # 'running' | 'success' | 'partial' | 'failed'
    
    portals_crawled = Column(ARRAY(Text), nullable=True)
    tenders_ingested = Column(Integer, default=0)
    tenders_scored = Column(Integer, default=0)
    critical_found = Column(Integer, default=0)
    high_found = Column(Integer, default=0)
    rtis_filed = Column(Integer, default=0)
    alerts_sent = Column(Integer, default=0)
    
    errors = Column(JSONB, nullable=True)
    total_cost_inr = Column(Numeric(8, 2), nullable=True)
    codex_heals = Column(Integer, default=0)
    notes = Column(Text, nullable=True)


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    email = Column(Text, nullable=True)
    language = Column(String(10), default="hi") # 'hi', 'en', 'gu', 'ta', etc.
    
    states = Column(ARRAY(Text), nullable=True)
    min_confidence = Column(Integer, default=70)
    fraud_types = Column(ARRAY(Text), nullable=True)
    
    is_pre_award = Column(Boolean, default=False)
    is_vendor = Column(Boolean, default=False)
    vendor_category = Column(Text, nullable=True)
    vendor_state = Column(String(80), nullable=True)
    
    active = Column(Boolean, default=True)
    unsubscribe_token = Column(String(64), unique=True, default=generate_secure_token)
    
    created_at = Column(DateTime(timezone=True), default=func.now())


class WhistleblowerTip(Base):
    __tablename__ = "whistleblower_tips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    passphrase = Column(String(64), unique=True, nullable=False) # 8-word random passphrase for tracking
    
    tip_text = Column(Text, nullable=True)
    tip_audio_path = Column(Text, nullable=True) # Path to uploaded voice memo
    tip_doc_path = Column(Text, nullable=True) # Path to uploaded document photos/attachments
    
    language = Column(String(10), default="en")
    sarvam_transcript = Column(Text, nullable=True) # Sarvam transcription of voice tips
    
    tender_match_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=True)
    relevance_score = Column(Numeric(5, 2), nullable=True) # Groq relevance scoring 0-100
    
    status = Column(String(20), default="received") # 'received' | 'triaged' | 'matched' | 'acted' | 'closed'
    
    created_at = Column(DateTime(timezone=True), default=func.now())

    tender = relationship("Tender")
