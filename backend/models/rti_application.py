import uuid
from sqlalchemy import Column, String, Text, Integer, ARRAY, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base

class RTIApplication(Base):
    __tablename__ = "rti_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=True, index=True)
    fraud_score_id = Column(UUID(as_uuid=True), ForeignKey("fraud_scores.id"), nullable=True)
    
    # PIO Details
    pio_name = Column(Text, nullable=True)
    pio_designation = Column(Text, nullable=True)
    pio_department = Column(Text, nullable=True)
    pio_address = Column(Text, nullable=True)
    pio_email = Column(Text, nullable=True)
    
    # Central Portal dropdown selectors
    ministry_code = Column(String(50), nullable=True)
    dept_code = Column(String(50), nullable=True)
    
    application_text = Column(Text, nullable=False)
    questions_count = Column(Integer, nullable=True)
    legal_provisions = Column(ARRAY(Text), nullable=True)
    annexure_pdf_path = Column(Text, nullable=True)
    
    filed_via = Column(String(30), default="draft_only") # 'rtionline' | 'email' | 'post' | 'draft_only'
    filed_at = Column(DateTime(timezone=True), nullable=True)
    confirmation_number = Column(String(150), nullable=True)
    
    status = Column(String(30), default="draft", index=True) 
    # 'draft' | 'queued' | 'filed' | 'responded' | 'first_appeal' | 'cic' | 'closed'
    
    response_due_at = Column(DateTime(timezone=True), nullable=True, index=True)
    first_appeal_due_at = Column(DateTime(timezone=True), nullable=True)
    response_received_at = Column(DateTime(timezone=True), nullable=True)
    response_text = Column(Text, nullable=True)
    
    first_appeal_filed_at = Column(DateTime(timezone=True), nullable=True)
    first_appeal_confirmation = Column(String(150), nullable=True)
    
    cic_filed_at = Column(DateTime(timezone=True), nullable=True)
    cic_confirmation = Column(String(150), nullable=True)
    
    outcome = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=func.now())

    tender = relationship("Tender")
    fraud_score = relationship("FraudScore")
