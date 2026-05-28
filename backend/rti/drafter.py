from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from models.tender import Tender
from models.fraud_score import FraudScore
from models.rti_application import RTIApplication

QUESTION_TEMPLATES = {
    "s01_price": [
        "Provide the detailed comparative statement of all bids received for Tender No. {tender_id}, including unit pricing from each bidder.",
        "Provide a copy of the official price justification note, market survey, or internal benchmark rate prepared by the department prior to contract award.",
        "Provide any circular or guideline showing the approved standard procurement rates for these items."
    ],
    "s02_spec": [
        "Provide the names, designations, and committee minutes of all officials who drafted and approved the technical specifications for Tender No. {tender_id}.",
        "Provide copies of all pre-bid queries received from prospective bidders and the corresponding official clarifications issued by the department.",
        "Provide any documentation demonstrating how vendor neutrality was verified for these technical parameters."
    ],
    "s03_concentration": [
        "Provide a list of all tenders awarded by {department} for this category of work in the last 24 months, including contractor name and contract value.",
        "Provide copies of the empanelment criteria or registration guidelines applied for selecting eligible contractors in this division."
    ],
    "s04_single_bid": [
        "State the total number of bids received for Tender No. {tender_id} and provide the official justification note for proceeding with a single active bidder.",
        "Provide copies of the Tender Evaluation Committee minutes where the single bid was accepted and deemed financially viable."
    ],
    "s06_entity": [
        "Provide copies of the technical qualification and experience certificates submitted by {contractor_name} to qualify for Tender No. {tender_id}.",
        "Confirm if the tender terms required a minimum number of years of experience and state how this was met by the winning contractor."
    ]
}

UNIVERSAL_QUESTIONS = [
    "Provide a copy of the final executed contract agreement signed between {department} and the winning contractor for Tender No. {tender_id}.",
    "Provide the dates, names, and designations of all members of the Tender Evaluation Committee who approved this award."
]

async def resolve_pio(department: str, ministry: str, state: str) -> Dict[str, str]:
    """
    Simulates a directory lookup to identify the correct Public Information Officer.
    """
    state_slug = state.lower() if state else "central"
    
    # Target seeded Delhi Jal Board PIO
    if "jal board" in department.lower() or "djb" in department.lower():
        return {
            "pio_name": "Satish Chandra Vashishth",
            "pio_designation": "Superintending Engineer & PIO (STP)",
            "pio_department": "Delhi Jal Board, Government of NCT Delhi",
            "pio_address": "Varunalaya Phase-II, Jhandewalan, New Delhi, 110005",
            "pio_email": "pio.stp.djb@delhi.gov.in",
            "ministry_code": "MIN_DELHI_JAL",
            "dept_code": "DEPT_DJB"
        }
        
    # Default fallback Central/State PIO details
    return {
        "pio_name": "Shri Rajesh Kumar",
        "pio_designation": "Deputy Secretary & Central Public Information Officer",
        "pio_department": f"{department}, Ministry of {ministry or 'Urban Development'}",
        "pio_address": "Shastri Bhawan, New Delhi, 110001",
        "pio_email": "cpio.procure@gov.in",
        "ministry_code": "MIN_UD",
        "dept_code": "DEPT_PROC"
    }

def format_application_text(app: RTIApplication) -> str:
    """
    Renders questions into standard statutory format.
    """
    questions_block = "\n".join(f"{i+1}. {q}" for i, q in enumerate(app.questions or []))
    
    return f"""APPLICATION FOR ACQUIRING INFORMATION UNDER SECTION 6(1) OF RTI ACT 2005

To,
The Public Information Officer,
{app.pio_name} ({app.pio_designation})
{app.pio_department}
Address: {app.pio_address}

Subject: Request for Information under the Right to Information Act 2005 regarding Tender No. {app.to}

Dear Sir/Madam,

I request you to kindly provide the following information/documents under the statutory provisions of Section 6(1) of the Right to Information Act 2005:

{questions_block}

I state that the requested information belongs to public procurement and expenditure, which is mandated to be proactively disclosed under Section 4(1)(b) of the RTI Act 2005. I confirm that I am a citizen of India. 

The statutory fee of Rs. 10/- has been paid via the designated payment portal. I request you to deliver the response in digital format via email.

Yours faithfully,
Darpan Vigilance Foundation
12, Sansad Marg, New Delhi, 110001
"""

async def draft_rti(tender: Tender, fraud_score: FraudScore, language: str = "en") -> RTIApplication:
    """
    Tailor-makes specific legal queries matching triggered audit signals.
    """
    triggered_signals = []
    
    # Identify which signals are elevated (> 0.5)
    for sig_name in QUESTION_TEMPLATES:
        score_val = getattr(fraud_score, sig_name, 0.0)
        if score_val and float(score_val) > 0.5:
            triggered_signals.append(sig_name)
            
    questions = []
    
    # Generate custom signal-based questions
    for signal in triggered_signals:
        templates = QUESTION_TEMPLATES[signal]
        for t in templates[:2]: # Max 2 questions per signal to prevent clutter
            questions.append(
                t.format(
                    tender_id=tender.tender_id,
                    department=tender.department,
                    contractor_name=tender.raw_json.get("awarded_contractor_name") or "Winning Contractor"
                )
            )
            
    # Add universal procedural questions
    for u in UNIVERSAL_QUESTIONS:
        questions.append(
            u.format(
                tender_id=tender.tender_id,
                department=tender.department
            )
        )
        
    # Cap total questions at 12
    questions = questions[:12]
    
    # Resolve PIO
    pio = await resolve_pio(tender.department, tender.ministry or "Urban Development", tender.state or "Delhi")
    
    # Assemble application ORM
    app = RTIApplication(
        tender_id=tender.id,
        fraud_score_id=fraud_score.id,
        pio_name=pio["pio_name"],
        pio_designation=pio["pio_designation"],
        pio_department=pio["pio_department"],
        pio_address=pio["pio_address"],
        pio_email=pio["pio_email"],
        ministry_code=pio["ministry_code"],
        dept_code=pio["dept_code"],
        questions_count=len(questions),
        legal_provisions=["RTI Act 2005 Section 6(1)", "RTI Act 2005 Section 7(1)"],
        filed_via="draft_only",
        status="draft",
        created_at=datetime.now(timezone.utc)
    )
    
    # Attach questions to object dynamically for serialization
    app.questions = questions
    # Format raw to and application text
    app.to = tender.tender_id
    app.application_text = format_application_text(app)
    
    return app
