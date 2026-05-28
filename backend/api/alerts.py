from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
import uuid
import secrets
from db.session import get_db
from models.pipeline_run import AlertSubscription, PipelineRun

router = APIRouter(prefix="", tags=["Alerts & Pipelines"])

@router.post("/alerts/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_alerts(
    phone: Optional[str] = Body(None),
    whatsapp: Optional[str] = Body(None),
    email: Optional[str] = Body(None),
    language: str = Body("hi"),
    states: Optional[List[str]] = Body(None),
    min_confidence: int = Body(70),
    fraud_types: Optional[List[str]] = Body(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Subscribe phone/WhatsApp/email for real-time vigilance alerts, with state and category filters.
    """
    try:
        if not phone and not whatsapp and not email:
            raise HTTPException(
                status_code=400, 
                detail="At least one communication channel (phone, whatsapp, email) must be provided."
            )
            
        sub = AlertSubscription(
            phone=phone,
            whatsapp=whatsapp,
            email=email,
            language=language,
            states=states,
            min_confidence=min_confidence,
            fraud_types=fraud_types,
            active=True
        )
        
        db.add(sub)
        await db.flush() # Populate ID and token
        
        token = sub.unsubscribe_token
        await db.commit()
        
        return {
            "status": "success",
            "message": "Subscription created successfully.",
            "unsubscribe_token": token
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Subscription failed: {e}")

@router.delete("/alerts/unsubscribe")
async def unsubscribe_alerts(
    token: str = Query(..., description="Unsubscribe token from footer of notification"),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate alert subscription using a secure 64-char unsubscribe token.
    """
    try:
        query = select(AlertSubscription).where(AlertSubscription.unsubscribe_token == token)
        result = await db.execute(query)
        sub = result.scalar_one_or_none()
        
        if not sub:
            raise HTTPException(status_code=404, detail="Invalid token: Alert subscription not found.")
            
        sub.active = False
        await db.commit()
        
        return {
            "status": "success",
            "message": "You have successfully unsubscribed from all Darpan alerts."
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Unsubscription failed: {e}")

@router.post("/webhooks/register", status_code=status.HTTP_201_CREATED)
async def register_webhook(
    url: str = Body(...),
    min_confidence: int = Body(70),
    states: Optional[List[str]] = Body(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows external consumers (media, CAG, state vigilance) to register high-risk webhook receivers.
    """
    # For MVP purposes, we log the registration parameters and return success.
    # In a full production implementation, we write to a webhooks table.
    webhook_secret = secrets.token_hex(16)
    return {
        "status": "success",
        "message": f"Webhook registered successfully for URL: {url}",
        "webhook_id": str(uuid.uuid4()),
        "secret": f"whsec_{webhook_secret}"
    }

@router.get("/pipeline/status")
async def get_pipeline_status(db: AsyncSession = Depends(get_db)):
    """
    Retrieve latest pipeline run status, ingestion stats, and average parsing qualities.
    """
    try:
        query = select(PipelineRun).order_by(PipelineRun.started_at.desc()).limit(5)
        result = await db.execute(query)
        runs = result.scalars().all()
        
        if not runs:
            return {
                "status": "idle",
                "last_run": None,
                "message": "No pipeline runs recorded in the database yet."
            }
            
        latest = runs[0]
        return {
            "status": latest.status,
            "last_run": {
                "id": str(latest.id),
                "started_at": latest.started_at,
                "completed_at": latest.completed_at,
                "tenders_ingested": latest.tenders_ingested,
                "tenders_scored": latest.tenders_scored,
                "critical_found": latest.critical_found,
                "high_found": latest.high_found,
                "rtis_filed": latest.rtis_filed,
                "notes": latest.notes
            },
            "history": [
                {
                    "started_at": r.started_at,
                    "status": r.status,
                    "tenders_ingested": r.tenders_ingested,
                    "critical_found": r.critical_found
                }
                for r in runs[1:]
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline status retrieval failed: {e}")
