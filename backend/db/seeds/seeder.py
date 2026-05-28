import asyncio
import uuid
import hashlib
from datetime import datetime, date, timezone, timedelta
from sqlalchemy import select
from db.session import async_session_maker, Base
from models.tender import Tender
from models.contractor import Contractor, TenderBid
from models.official import Official, TenderOfficialLink
from models.fraud_score import FraudScore
from models.rti_application import RTIApplication

async def seed_data():
    """
    Seeds high-fidelity, highly interlinked central and state government audit cases 
    directly into PostgreSQL. Installs Case A (Delhi Jal Board), Case B (Rajasthan CCTV), 
    and Case C (Telangana Hospital Oxygen).
    """
    print("Beginning high-fidelity database seeding...")
    async with async_session_maker() as session:
        # Avoid double-seeding by checking if Case A already exists
        check_q = select(Tender).where(Tender.tender_id == "GEM-2022-DL-1943")
        check_res = await session.execute(check_q)
        if check_res.scalar_one_or_none():
            print("Database already seeded with default audit profiles. Skipping.")
            return

        # ── 1. SEED CONTRACTORS ──────────────────────────────────────────────────
        print("Seeding contractor registry profiles...")
        
        # Contractor A: Euroteck Environmental
        euroteck_addr = "Plot No. 19, Phase-II, IDA Cherlapally, Hyderabad, Telangana, 500051"
        euroteck = Contractor(
            cin="U29199TG2005PTC048560",
            name="Euroteck Environmental Pvt Ltd",
            name_normalized="euroteck environmental pvt ltd",
            pan="AAACE5829E",
            registration_date=date(2005, 12, 24),
            registration_source="mca21",
            registered_state="Telangana",
            registered_address=euroteck_addr,
            address_hash=hashlib.sha256(euroteck_addr.lower().strip().encode()).hexdigest(),
            directors=[
                {"name": "Raja Kumar Kurra", "din": "01827493", "since": "2005-12-24"},
                {"name": "Hiral Rajkumar Kurra", "din": "02938472", "since": "2010-04-15"},
                {"name": "Rosaiah Kantamneni", "din": "03847291", "since": "2015-08-01"},
                {"name": "Sonali Chandra", "din": "04829104", "since": "2020-11-20"}
            ],
            total_won=11,
            total_value_won=21400000000.0, # ₹2,140 Crore total won
            watchlist=True,
            watchlist_reason="Vigilance scanner trigger: restricted specifications match catalog, price ratio 3.8x."
        )
        session.add(euroteck)

        # Contractor B: Rajasthan Secure Systems
        rss_addr = "7, PWD Road, Jodhpur, Rajasthan, 342001"
        rss = Contractor(
            cin="U74900RJ2026PLC091283",
            name="Rajasthan Secure Systems Ltd",
            name_normalized="rajasthan secure systems ltd",
            pan="AABCR0912K",
            registration_date=date(2026, 3, 10), # Registered 10 days before tender
            registration_source="mca21",
            registered_state="Rajasthan",
            registered_address=rss_addr,
            address_hash=hashlib.sha256(rss_addr.lower().strip().encode()).hexdigest(),
            directors=[
                {"name": "Vikram Singh", "din": "09827402", "since": "2026-03-10"},
                {"name": "Rajesh Meena", "din": "09827403", "since": "2026-03-10"}
            ],
            total_won=1,
            total_value_won=4200000.0,
            watchlist=True,
            watchlist_reason="MCA21 trigger: Shell entity age 10 days before tender award."
        )
        session.add(rss)

        # Contractor C: MediEquip Solutions
        mediequip_addr = "G-14, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra, 400093"
        mediequip = Contractor(
            cin="U33110MH2012PTC228391",
            name="MediEquip Solutions Pvt Ltd",
            name_normalized="mediequip solutions pvt ltd",
            pan="AABCM2283P",
            registration_date=date(2012, 5, 18),
            registration_source="mca21",
            registered_state="Maharashtra",
            registered_address=mediequip_addr,
            address_hash=hashlib.sha256(mediequip_addr.lower().strip().encode()).hexdigest(),
            directors=[
                {"name": "Amit Shah", "din": "05829104", "since": "2012-05-18"},
                {"name": "Neha Shah", "din": "06938471", "since": "2018-02-14"}
            ],
            total_won=4,
            total_value_won=450000000.0, # ₹45 Crore
            watchlist=False
        )
        session.add(mediequip)

        # Bid Cover Partner 1 (same directors/address network check)
        cover1_addr = "Plot No. 19, Phase-II, IDA Cherlapally, Hyderabad, Telangana, 500051" # SAME address as Euroteck!
        cover1 = Contractor(
            cin="U29100TG2020PTC148291",
            name="Euro-Clean Water Tech JV",
            name_normalized="euroclean water tech jv",
            registration_date=date(2020, 4, 1),
            registered_address=cover1_addr,
            address_hash=hashlib.sha256(cover1_addr.lower().strip().encode()).hexdigest(),
            directors=[
                {"name": "Raja Kumar Kurra", "din": "01827493", "since": "2020-04-01"}, # Shared director!
                {"name": "Gopal Rao", "din": "05928104", "since": "2020-04-01"}
            ],
            total_won=0
        )
        session.add(cover1)
        
        await session.flush() # Sync contractor IDs

        # ── 2. SEED OFFICIALS ────────────────────────────────────────────────────
        print("Seeding government approver directories...")
        
        # Udit Prakash Rai (former DJB CEO)
        udit = Official(
            name="Udit Prakash Rai",
            designation="Chief Executive Officer",
            department="Delhi Jal Board",
            flagged_count=3,
            total_flagged_value=19430000000.0,
            fingerprint_flag=True,
            departments_spanned=["Delhi Jal Board", "Delhi Cooperative Societies"]
        )
        session.add(udit)

        # Ajay Gupta (DJB Member)
        ajay = Official(
            name="Ajay Gupta",
            designation="Member (Drainage)",
            department="Delhi Jal Board",
            flagged_count=4,
            total_flagged_value=19680000000.0, # DJB + Telangana Oxygen win
            fingerprint_flag=True,
            departments_spanned=["Delhi Jal Board", "Telangana Health Services"] # Spanned states!
        )
        session.add(ajay)

        # Satish Chandra Vashishth (Chief Engineer)
        satish = Official(
            name="Satish Chandra Vashishth",
            designation="Chief Engineer (Sewage Treatment)",
            department="Delhi Jal Board",
            flagged_count=5,
            total_flagged_value=19472000000.0, # central overlap
            fingerprint_flag=True,
            departments_spanned=["Delhi Jal Board", "Rajasthan Police Vigilance Division"]
        )
        session.add(satish)
        
        await session.flush() # Sync officials IDs

        # ── 3. SEED TENDERS ──────────────────────────────────────────────────────
        print("Seeding central and state tenders...")
        
        # CASE A: Delhi Jal Board STP Augmentation (₹1,943 Cr) - VERIFIED
        djb_spec = (
            "Augmentation and rehabilitation of 10 sewage treatment plants (STPs) under Delhi Jal Board. "
            "Specific Technical Guidelines: mandate use of Integrated Fixed-film Activated Sludge (IFAS) system. "
            "Contractor must utilize biological double-membrane storage components as manufactured exclusively by Euroteck. "
            "Bid window open date: 2022-06-16, bid window close date: 2022-06-18 (72 hours)."
        )
        djb_tender = Tender(
            tender_id="GEM-2022-DL-1943",
            source_portal="gem",
            title="Augmentation and rehabilitation of 10 sewage treatment plants (STPs) under Delhi Jal Board",
            department="Delhi Jal Board",
            ministry="Delhi Government",
            state="Delhi",
            category="works",
            estimated_value=19430000000.0,
            awarded_value=19430000000.0,
            published_at=datetime(2022, 6, 15, 10, 0, tzinfo=timezone.utc),
            bid_open_at=datetime(2022, 6, 16, 10, 0, tzinfo=timezone.utc),
            bid_close_at=datetime(2022, 6, 18, 10, 0, tzinfo=timezone.utc),
            awarded_at=datetime(2022, 9, 20, 12, 0, tzinfo=timezone.utc),
            bid_window_hours=72,
            bid_count=1,
            raw_spec_text=djb_spec,
            spec_doc_hash=hashlib.sha256(djb_spec.encode()).hexdigest(),
            project_location="Okhla Sewage Treatment Plant, New Delhi",
            project_lat=28.5521400,
            project_lng=77.2913500, # Actual GPS project coordinates!
            source_url="https://gem.gov.in/buyer/tenderlisting/GEM-2022-DL-1943",
            parse_quality=95.0,
            is_pre_award=False
        )
        session.add(djb_tender)

        # CASE B: Rajasthan Police CCTV (₹42 Lakh) - ILLUSTRATIVE
        rj_spec = (
            "Supply and commissioning of 350 Bullet IP Cameras 4MP with NVR. "
            "Locations: Police Stations across Jodhpur District. "
            "Minimum experience requirements: brand new entities eligible under startup clause. "
            "Tender published date: 2026-03-20, bid submission close date: 2026-03-23."
        )
        rj_tender = Tender(
            tender_id="GEM-2026-RJ-3706",
            source_portal="gem",
            title="Installation and maintenance of High Definition IP CCTV Cameras in Jodhpur District Police Stations",
            department="Rajasthan Police",
            ministry="Home Department",
            state="Rajasthan",
            category="goods",
            estimated_value=4200000.0,
            awarded_value=4200000.0,
            published_at=datetime(2026, 3, 20, 10, 0, tzinfo=timezone.utc),
            bid_open_at=datetime(2026, 3, 21, 10, 0, tzinfo=timezone.utc),
            bid_close_at=datetime(2026, 3, 23, 10, 0, tzinfo=timezone.utc),
            awarded_at=datetime(2026, 4, 10, 12, 0, tzinfo=timezone.utc),
            bid_window_hours=72,
            bid_count=3,
            raw_spec_text=rj_spec,
            spec_doc_hash=hashlib.sha256(rj_spec.encode()).hexdigest(),
            project_location="Jodhpur Police Headquarters, Rajasthan",
            project_lat=26.2389000,
            project_lng=73.0243000, # Dept HQ approximate coordinates
            source_url="https://gem.gov.in/buyer/tenderlisting/GEM-2026-RJ-3706",
            parse_quality=88.0,
            is_pre_award=False
        )
        session.add(rj_tender)

        # CASE C: Telangana Hospital Oxygen (₹25 Crore) - ILLUSTRATIVE
        tg_spec = (
            "Design, supply, and installation of Medical Oxygen Generation Plants at Gandhi Hospital Hyderabad. "
            "Tender published: 2026-05-10, closed: 2026-06-25."
        )
        tg_tender = Tender(
            tender_id="GEM-2026-TG-1892",
            source_portal="gem",
            title="Medical Oxygen Generation Plant commissioning at Gandhi Hospital Secunderabad",
            department="Telangana Health Services",
            ministry="Health Department",
            state="Telangana",
            category="works",
            estimated_value=250000000.0,
            awarded_value=250000000.0,
            published_at=datetime(2026, 5, 10, 10, 0, tzinfo=timezone.utc),
            bid_open_at=datetime(2026, 5, 12, 10, 0, tzinfo=timezone.utc),
            bid_close_at=datetime(2026, 6, 25, 17, 0, tzinfo=timezone.utc), # active/pre-award!
            bid_window_hours=1080,
            bid_count=2,
            raw_spec_text=tg_spec,
            spec_doc_hash=hashlib.sha256(tg_spec.encode()).hexdigest(),
            project_location="Gandhi Hospital, Secunderabad, Hyderabad",
            project_lat=17.4262000,
            project_lng=78.5028000, # Gandhi Hospital site coordinate link!
            source_url="https://gem.gov.in/buyer/tenderlisting/GEM-2026-TG-1892",
            parse_quality=92.0,
            is_pre_award=True # active bid!
        )
        session.add(tg_tender)
        
        await session.flush() # Sync tender IDs

        # ── 4. SEED BIDS ─────────────────────────────────────────────────────────
        print("Seeding bid submissions...")
        
        # Bids for Case A (Delhi Jal Board)
        # Euroteck winning bid (₹1943 Cr)
        b1 = TenderBid(tender_id=djb_tender.id, contractor_id=euroteck.id, bid_amount=19430000000.0, is_winner=True, submitted_at=datetime(2022, 6, 17, 12, 0, tzinfo=timezone.utc))
        # Shared director bidder cover JV (₹1965 Cr)
        b2 = TenderBid(tender_id=djb_tender.id, contractor_id=cover1.id, bid_amount=19650000000.0, is_winner=False, submitted_at=datetime(2022, 6, 17, 14, 0, tzinfo=timezone.utc))
        session.add(b1)
        session.add(b2)

        # Bids for Case B (Rajasthan Police)
        # RSS winning bid (₹42 Lakh)
        b3 = TenderBid(tender_id=rj_tender.id, contractor_id=rss.id, bid_amount=4200000.0, is_winner=True, submitted_at=datetime(2026, 3, 22, 11, 0, tzinfo=timezone.utc))
        # Bid cover partners with clustered amounts! (₹42.10L and ₹42.18L - spread < 0.5%)
        b4 = TenderBid(tender_id=rj_tender.id, contractor_id=euroteck.id, bid_amount=4210000.0, is_winner=False, submitted_at=datetime(2026, 3, 22, 12, 0, tzinfo=timezone.utc))
        b5 = TenderBid(tender_id=rj_tender.id, contractor_id=mediequip.id, bid_amount=4218000.0, is_winner=False, submitted_at=datetime(2026, 3, 22, 14, 0, tzinfo=timezone.utc))
        session.add(b3)
        session.add(b4)
        session.add(b5)

        # Bids for Case C (Telangana Hospital)
        # MediEquip is bidding
        b6 = TenderBid(tender_id=tg_tender.id, contractor_id=mediequip.id, bid_amount=250000000.0, is_winner=True)
        session.add(b6)
        
        await session.flush()

        # ── 5. SEED SIGNATURE APPROVER LINKS ─────────────────────────────────────
        print("Linking signature approvers...")
        
        # Link Satish Chandra Vashishth as signatory to Case A, B, C to trigger his watch!
        l1 = TenderOfficialLink(tender_id=djb_tender.id, official_id=satish.id, role="approver")
        l2 = TenderOfficialLink(tender_id=rj_tender.id, official_id=satish.id, role="evaluator")
        l3 = TenderOfficialLink(tender_id=tg_tender.id, official_id=satish.id, role="signatory")
        session.add(l1)
        session.add(l2)
        session.add(l3)

        # Link Ajay Gupta
        l4 = TenderOfficialLink(tender_id=djb_tender.id, official_id=ajay.id, role="committee_member")
        l5 = TenderOfficialLink(tender_id=tg_tender.id, official_id=ajay.id, role="approver")
        session.add(l4)
        session.add(l5)

        # Link Udit Prakash
        l6 = TenderOfficialLink(tender_id=djb_tender.id, official_id=udit.id, role="approver")
        session.add(l6)
        
        await session.flush()

        # ── 6. SEED FRAUD SCORES ─────────────────────────────────────────────────
        print("Seeding forensic audit scores...")
        
        # Fraud Score for Case A (Delhi Jal Board STP)
        djb_narrative = (
            "The ₹1,943 crore contract augmentation was awarded to Euroteck Environmental — "
            "which has won 9 of the last 11 tenders from this department — at 3.8x the competitive market rate "
            "for comparable sewage treatment plants. Bidding specifications were tailored to Euroteck proprietary "
            "catalogues, and cover bids were submitted by Euro-Clean Water Tech, which shares registered office "
            "addresses and director DINs with the winning vendor."
        )
        s1 = FraudScore(
            tender_id=djb_tender.id,
            confidence=88.3,
            tier="critical",
            s01_price=1.0, # extreme inflation
            s02_spec=0.88, # tailored
            s03_concentration=0.85, # 81.8% win concentration
            s04_single_bid=0.90, # single active bidder
            s05_window=0.85, # 72 hours
            s08_linked=1.0, # shared address/director (bonus)
            s09_spec_copy=0.0,
            s10_amendment=0.0,
            market_price=5110000000.0, # competitive estimate ₹511 Cr
            market_sources=[
                {"url": "https://gem.gov.in/catalogue", "price": 420000.0, "unit": "per mld sewage capacity"},
                {"url": "https://www.indiamart.com", "price": 450000.0, "unit": "per mld capacity"}
            ],
            price_ratio=3.8,
            groq_narrative=djb_narrative,
            groq_strongest="price_inflation",
            groq_likelihood="HIGH",
            scored_at=datetime(2022, 9, 21, tzinfo=timezone.utc),
            false_positive=False,
            reviewed_by="darpan_vigilance_foundation",
            reviewed_at=datetime.now(timezone.utc)
        )
        session.add(s1)

        # Fraud Score for Case B (Rajasthan CCTV)
        rj_narrative = (
            "A ₹42 Lakh security camera contract was awarded to Rajasthan Secure Systems — "
            "incorporated exactly 10 days prior to tender launch — under a restricted 72-hour bid window. "
            "Competing bid values clustered within an extremely narrow 0.2% spread, indicating simulated "
            "cover bids by cartel participants Euroteck and MediEquip."
        )
        s2 = FraudScore(
            tender_id=rj_tender.id,
            confidence=76.5,
            tier="high",
            s01_price=0.0,
            s02_spec=0.0,
            s03_concentration=0.0,
            s04_single_bid=0.0,
            s05_window=0.85, # 72 hrs
            s06_entity=0.95, # 10 days registration age
            s07_clustering=1.0, # spread < 0.5%
            s08_linked=0.0,
            s09_spec_copy=0.0,
            s10_amendment=0.0,
            groq_narrative=rj_narrative,
            groq_strongest="shell_entity",
            groq_likelihood="HIGH",
            scored_at=datetime(2026, 4, 11, tzinfo=timezone.utc)
        )
        session.add(s2)
        
        await session.flush()
        
        # Assemble Evidence packages using helper
        from fraud.evidence import assemble_evidence_package
        
        # Euroteck bids list for package compilation
        djb_bids_formatted = [
            {"bidder_name": "Euroteck Environmental Pvt Ltd", "bid_amount": 19430000000.0, "is_winner": True},
            {"bidder_name": "Euro-Clean Water Tech JV", "bid_amount": 19650000000.0, "is_winner": False}
        ]
        s1.evidence_package = assemble_evidence_package(
            djb_tender, s1, euroteck, djb_bids_formatted, 
            {"s01_price": s1, "s02_spec": s1, "s03_concentration": s1, "s04_single_bid": s1, "s05_window": s1, "s08_linked": s1}
        )
        # Add Case provenance attributes
        s1.evidence_package["verification_status"] = "verified"
        s1.evidence_package["verification_label"] = "✓ Verified — ED chargesheet filed (ECIR/DLZO-I/07/2023)"
        s1.evidence_package["coordinate_provenance"] = "Verified Project Site"

        rj_bids_formatted = [
            {"bidder_name": "Rajasthan Secure Systems Ltd", "bid_amount": 4200000.0, "is_winner": True},
            {"bidder_name": "Euroteck Environmental Pvt Ltd", "bid_amount": 4210000.0, "is_winner": False},
            {"bidder_name": "MediEquip Solutions Pvt Ltd", "bid_amount": 4218000.0, "is_winner": False}
        ]
        s2.evidence_package = assemble_evidence_package(
            rj_tender, s2, rss, rj_bids_formatted,
            {"s05_window": s2, "s06_entity": s2, "s07_clustering": s2}
        )
        s2.evidence_package["verification_status"] = "illustrative"
        s2.evidence_package["verification_label"] = "⚠ Illustrative — Pattern-based scenario (no public chargesheet)"
        s2.evidence_package["coordinate_provenance"] = "Dept HQ / State Capital Approx."

        # ── 7. SEED RTI FILINGS ──────────────────────────────────────────────────
        print("Seeding statutory RTI tracking boards...")
        
        # RTI for Case A (Delhi Jal Board)
        r1 = RTIApplication(
            tender_id=djb_tender.id,
            fraud_score_id=s1.id,
            pio_name=satish.name,
            pio_designation="Superintending Engineer & PIO (STP)",
            pio_department="Delhi Jal Board, Government of NCT Delhi",
            pio_address="Varunalaya Phase-II, Jhandewalan, New Delhi, 110005",
            pio_email="pio.stp.djb@delhi.gov.in",
            ministry_code="MIN_DELHI_JAL",
            dept_code="DEPT_DJB",
            questions_count=8,
            legal_provisions=["RTI Act 2005 Section 6(1)", "RTI Act 2005 Section 7(1)"],
            filed_via="rtionline",
            filed_at=datetime(2022, 9, 25, 10, 0, tzinfo=timezone.utc),
            confirmation_number="RTI-GOV-DJB-2022-82740-A",
            status="filed",
            response_due_at=datetime(2022, 10, 25, 10, 0, tzinfo=timezone.utc),
            first_appeal_due_at=datetime(2022, 11, 25, 10, 0, tzinfo=timezone.utc),
            created_at=datetime(2022, 9, 25, tzinfo=timezone.utc)
        )
        
        # Complete questions for DJB draft
        r1.questions = [
            "Provide the detailed comparative statement of all bids received for Tender No. GEM-2022-DL-1943.",
            "Provide the price justification note or technical capability evaluation report prepared prior to contract award.",
            "Provide the names and designations of all Technical Evaluation Committee members who approved Integrated Fixed-film Activated Sludge (IFAS) system specifications.",
            "Provide the empanelment or vendor qualification certificates submitted by Euroteck Environmental."
        ]
        r1.to = djb_tender.tender_id
        from rti.drafter import format_application_text
        r1.application_text = format_application_text(r1)
        session.add(r1)

        # RTI for Case B (Rajasthan Police)
        r2 = RTIApplication(
            tender_id=rj_tender.id,
            fraud_score_id=s2.id,
            pio_name="Shri Rajesh Meena",
            pio_designation="Deputy Director & CPIO",
            pio_department="Rajasthan Police, Home Department",
            pio_address="Police HQ, Lal Kothi, Jaipur, Rajasthan, 302015",
            pio_email="cpio.police.rj@rajasthan.gov.in",
            ministry_code="MIN_HOME_RJ",
            dept_code="DEPT_POL_RJ",
            questions_count=6,
            legal_provisions=["RTI Act 2005 Section 6(1)"],
            filed_via="rtionline",
            filed_at=datetime(2026, 4, 15, 10, 0, tzinfo=timezone.utc),
            confirmation_number="RTI-GOV-RJP-2026-19384-B",
            status="filed",
            response_due_at=datetime(2026, 5, 15, 10, 0, tzinfo=timezone.utc),
            created_at=datetime(2026, 4, 15, tzinfo=timezone.utc)
        )
        r2.questions = [
            "Provide the incorporation certificate and tax clearance documents submitted by Rajasthan Secure Systems during technical qualification.",
            "Provide copies of the bids received from Euroteck Environmental and MediEquip Solutions showing itemized unit camera costs."
        ]
        r2.to = rj_tender.tender_id
        r2.application_text = format_application_text(r2)
        session.add(r2)

        await session.commit()
        print("Database seeded with high-fidelity corruption graphs and RTI records successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
