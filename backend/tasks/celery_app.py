from celery import Celery
from config import config

# Initialize Celery app bound to Redis broker
celery_app = Celery(
    "darpan_tasks",
    broker=config.REDIS_URL,
    backend=config.REDIS_URL
)

# Optional configuration settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True
)

# Auto-discover tasks in tasks package
celery_app.autodiscover_tasks(["tasks"])
