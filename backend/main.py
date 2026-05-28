from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config
from db.init_db import init_db

# Async context manager to handle startup/shutdown lifecycles
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print(f"Starting Darpan API Backend in [{config.ENVIRONMENT}] environment.")
    
    # Auto-initialize database extensions and tables on startup
    try:
        await init_db()
        print("Database initialized successfully during lifespan startup.")
    except Exception as e:
        print(f"Error initializing database on startup: {e}")
        
    yield
    
    # Shutdown actions
    print("Shutting down Darpan API Backend.")

# Initialize FastAPI application
app = FastAPI(
    title="DARPAN — Procurement Fraud Detection Platform",
    description="Production-grade AI-powered corruption detection and civic accountability platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint returning server health
@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "Darpan Backend API",
        "version": "1.0.0",
        "environment": config.ENVIRONMENT
    }

# Include REST Routers
try:
    from api.tenders import router as tenders_router
    from api.fraud import router as fraud_router
    from api.rti import router as rti_router
    from api.contractors import router as contractors_router
    from api.officials import router as officials_router
    from api.alerts import router as alerts_router
    from api.network import router as network_router
    from api.dashboard import router as dashboard_router
    from api.scanner import router as scanner_router
    
    app.include_router(tenders_router, prefix="/v1")
    app.include_router(fraud_router, prefix="/v1")
    app.include_router(rti_router, prefix="/v1")
    app.include_router(contractors_router, prefix="/v1")
    app.include_router(officials_router, prefix="/v1")
    app.include_router(alerts_router, prefix="/v1")
    app.include_router(network_router, prefix="/v1")
    app.include_router(dashboard_router, prefix="/v1")
    app.include_router(scanner_router, prefix="/v1")
    print("All REST API routers mounted successfully.")
except ImportError as e:
    print(f"Warning: could not mount some API routers yet: {e}")
