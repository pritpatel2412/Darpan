import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from celery_app import celery_app
from db.session import async_session_maker
from models.rti_application import RTIApplication
from models.tender import Tender
from rti.filer import file_rti_online
from integrations.sarvam import SarvamClient

@celery_app.task(name="tasks.rti_tasks.file_rti_task")
def file_rti_task(rti_id: str):
    """
    Background Celery task that takes a draft RTI ID, runs Playwright filing, 
    stores confirmation references, and triggers regional Hindi voice/WhatsApp alerts.
    """
    # Create an event loop to run async database/playwright code inside celery worker
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(_file_rti_async(rti_id))

async def _file_rti_async(rti_id: str) -> dict:
    import uuid
    rti_uuid = uuid.UUID(rti_id)
    
    async with async_session_maker() as session:
        # Fetch RTI application and joined Tender details
        query = select(RTIApplication, Tender).join(Tender, RTIApplication.tender_id == Tender.id).where(RTIApplication.id == rti_uuid)
        result = await session.execute(query)
        row = result.first()
        
        if not row:
            print(f"Error: RTI draft {rti_id} not found in database.")
            return {"status": "error", "error": "RTI draft not found"}
            
        rti, tender = row
        
        # 1. Run Playwright Filer automation
        filing_res = await file_rti_online(rti)
        
        # 2. Update DB with confirmation details
        rti.status = "filed"
        rti.confirmation_number = filing_res["confirmation_number"]
        rti.filed_at = filing_res["filed_at"]
        rti.response_due_at = filing_res["response_due_at"]
        
        await session.commit()
        print(f"RTI application successfully filed in DB! Ref: {rti.confirmation_number}")
        
        # 3. Deliver Sarvam Voice alerts to subscribed numbers
        sarvam = SarvamClient()
        alert_msg = (
            f"Namaskar. Darpan Vigilance alert. Aapke kshetra ke '{tender.department}' "
            f"me ₹{float(tender.awarded_value)/1e7:.2f} crore ke sandigdh tender ke khilaaf "
            f"automated RTI application online file kar di gayi hai. "
            f"Confirmation code: {rti.confirmation_number}. Jaankari darpan.in par dekhen."
        )
        
        # Dispatch to default vigilance admin number or subscribers
        subscriber_phone = "9876543210"
        await sarvam.send_voice_alert(subscriber_phone, alert_msg, language="hi-IN")
        await sarvam.send_whatsapp_alert(subscriber_phone, alert_msg, language="hi-IN")
        
        return {
            "status": "success",
            "confirmation_number": rti.confirmation_number,
            "filed_at": rti.filed_at.isoformat()
        }
