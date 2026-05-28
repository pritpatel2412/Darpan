from typing import Dict, Any
from integrations.groq_client import GroqClient

async def orchestrate_fraud_signals(tender, signals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestration entry point that aggregates fraud signal triggers and 
    invokes the Groq Llama-3.1-70B model to write journalist-grade audit summaries.
    """
    client = GroqClient()
    return await client.orchestrate_fraud_signals(tender, signals)
