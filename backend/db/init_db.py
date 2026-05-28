import asyncio
from sqlalchemy import text
from db.session import engine, Base

async def init_db():
    """
    Initialize database:
    1. Activate pgvector and pg_trgm extensions
    2. Create all SQLAlchemy models that inherit from Base
    """
    print("Initializing database extensions and schemas...")
    async with engine.begin() as conn:
        # Enable pgvector extension for AI embeddings
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Enable pg_trgm extension for fuzzy contractor name/address indexing
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        print("Database extensions enabled successfully.")
        
        # Import all models here so that they are registered on Base
        try:
            import models.tender
            import models.contractor
            import models.official
            import models.fraud_score
            import models.rti_application
            from models.pipeline_run import PipelineRun, AlertSubscription, WhistleblowerTip
            print("Models imported and registered on metadata.")
        except ImportError as e:
            print(f"Warning: could not import some models yet: {e}")
        
        # Drop all tables first for a clean slate to prevent type mismatches
        print("Dropping existing tables to prevent schema type mismatches...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Existing tables dropped successfully.")
        
        # Create all tables in the database
        await conn.run_sync(Base.metadata.create_all)
        print("All database tables created successfully.")

if __name__ == "__main__":
    # Allow running this script directly
    asyncio.run(init_db())
