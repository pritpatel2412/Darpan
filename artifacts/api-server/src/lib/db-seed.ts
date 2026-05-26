import { db } from "@workspace/db";
import { 
  tendersTable, 
  activityTable, 
  rtisTable, 
  officialsTable, 
  tenderOfficialLinksTable, 
  contractorsTable 
} from "@workspace/db";
import { sql } from "drizzle-orm";

// Fast, deterministic pseudo-random generator
const getPseudoRand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const STATES = [
  "Uttar Pradesh", "Maharashtra", "Delhi", "Karnataka", "Gujarat", 
  "Rajasthan", "Tamil Nadu", "Telangana", "West Bengal", "Madhya Pradesh", 
  "Kerala", "Bihar", "Haryana", "Punjab", "Odisha"
];

const STATE_CODES: Record<string, string> = {
  "Uttar Pradesh": "UP",
  "Maharashtra": "MH",
  "Delhi": "DL",
  "Karnataka": "KA",
  "Gujarat": "GJ",
  "Rajasthan": "RJ",
  "Tamil Nadu": "TN",
  "Telangana": "TG",
  "West Bengal": "WB",
  "Madhya Pradesh": "MP",
  "Kerala": "KL",
  "Bihar": "BR",
  "Haryana": "HR",
  "Punjab": "PB",
  "Odisha": "OR"
};

const DEPARTMENTS = [
  "Public Works Department (PWD)",
  "National Highways Authority of India (NHAI)",
  "Health & Family Welfare Department",
  "School Education Department",
  "Water Resources Department",
  "Police Housing Corporation",
  "Information Technology and e-Governance",
  "Metro Rail Corporation",
  "Municipal Corporation"
];

const CONTRACTOR_TEMPLATES = [
  { name: "Bharat Construction Co Pvt Ltd", state: "Uttar Pradesh", baseCin: "PLC091837" },
  { name: "MediEquip Solutions Pvt Ltd", state: "Maharashtra", baseCin: "PTC228391" },
  { name: "Sahyadri Builders & Developers", state: "Maharashtra", baseCin: "PTC112394" },
  { name: "Karnataka Textile Works Pvt Ltd", state: "Karnataka", baseCin: "PLC847291" },
  { name: "Rajasthan Secure Systems Ltd", state: "Rajasthan", baseCin: "PLC091283" },
  { name: "DataTech Infrastructure Pvt Ltd", state: "Delhi", baseCin: "PTC749102" },
  { name: "Gujarat Healthcare Supplies", state: "Gujarat", baseCin: "PTC982341" },
  { name: "Hindustan Bitumen Corp", state: "Uttar Pradesh", baseCin: "PLC871932" },
  { name: "Alpha Security & Telecom", state: "Delhi", baseCin: "PLC291038" },
  { name: "Mega Infrastructure Ltd", state: "Karnataka", baseCin: "PLC472910" },
  { name: "Saraswati Educational Equipments", state: "Tamil Nadu", baseCin: "PTC091284" },
  { name: "Narmada Water Projects Pvt Ltd", state: "Telangana", baseCin: "PTC829103" },
  { name: "Euroteck Environmental Pvt Ltd", state: "Telangana", baseCin: "PTC169628" },
  { name: "Zenith Cybernetics Pvt Ltd", state: "West Bengal", baseCin: "PLC091823" },
  { name: "Techno-Civil Associates", state: "Gujarat", baseCin: "PLC392019" }
];

export async function seedDatabase() {
  try {
    // 1. Check if Delhi Jal Board STP scam is already in the database
    const [djbExisting] = await db
      .select()
      .from(tendersTable)
      .where(sql`tenders.tender_id = 'GEM-2022-DL-1943'`)
      .limit(1);

    if (djbExisting) {
      // Verify count is also high enough
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tendersTable);
      const count = Number(countResult?.count ?? 0);
      
      const [offCountRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(officialsTable);
      const offCount = Number(offCountRes?.count ?? 0);

      if (count >= 100 && offCount > 0) {
        console.log("Database already has Delhi Jal Board tender, officials, and 100+ items. Skipping seeding.");
        return;
      }
    }

    console.log("DB tender or officials count is low. Initiating full 500+ seed...");

    // 2. Wipe database tables first for clean pristine demo state
    await db.delete(activityTable);
    await db.delete(rtisTable);
    await db.delete(tenderOfficialLinksTable);
    await db.delete(officialsTable);
    await db.delete(contractorsTable);
    await db.delete(tendersTable);
    console.log("Cleared old database tables.");

    // 3. Seed High-Risk Contractors Watchlist
    console.log("Seeding contractors watchlists...");
    const contractorIdsMap = new Map<string, number>();
    for (const c of CONTRACTOR_TEMPLATES) {
      const isEuroteck = c.name.includes("Euroteck");
      const isMedi = c.name.includes("MediEquip");
      const isRaj = c.name.includes("Rajasthan");
      
      const riskScore = isEuroteck ? 92 : isMedi ? 91 : isRaj ? 87 : Math.floor(45 + getPseudoRand(c.name.length) * 45);
      const flaggedTenders = isEuroteck ? 4 : isMedi ? 45 : isRaj ? 2 : Math.floor(3 + getPseudoRand(c.name.length * 2) * 12);
      const totalValueVal = isEuroteck ? 22500000000 : isMedi ? 980000000 : isRaj ? 9800000 : Math.round(15000000 + getPseudoRand(c.name.length * 3) * 85000000);
      const cin = isEuroteck ? "U29259TG2008PTC169628" : isMedi ? "U33110MH2012PTC228391" : isRaj ? "U74900RJ2026PLC091283" : `U${Math.floor(10000 + getPseudoRand(c.name.length) * 90000)}${STATE_CODES[c.state] || "IN"}2015PTC${c.baseCin}`;

      const [inserted] = await db.insert(contractorsTable).values({
        name: c.name,
        cin,
        state: c.state,
        registrationDate: new Date(Date.now() - (365 * 3 + Math.floor(getPseudoRand(c.name.length) * 1000)) * 24 * 60 * 60 * 1000),
        flaggedTenders,
        totalValue: totalValueVal.toString(),
        riskScore,
        primarySignals: isEuroteck 
          ? ["Specification Tailoring", "Price Inflation", "Linked Entity Anomaly"] 
          : ["Price Inflation", "Single Bidder Anomaly"],
        linkedEntities: isEuroteck ? ["Euroteck Subcontracting Network", "JV Cartel 1"] : [],
        directors: isEuroteck ? ["Raja Kumar Kurra", "Hiral Rajkumar Kurra", "Rosaiah Kantamneni", "Sonali Chandra"] : ["Suresh Mehta", "Anjali Sharma"],
      }).returning();
      
      contractorIdsMap.set(c.name, inserted.id);
    }
    console.log("Seeded contractors.");

    // 4. Seed Government Officials Table
    console.log("Seeding government officials watchlist...");
    const officialsToInsert = [
      { name: "Satyendar Jain", designation: "Former Minister", department: "Delhi Jal Board", flaggedCount: 4, totalFlaggedValue: "19430000000.00", fingerprintFlag: true },
      { name: "Udit Prakash Rai", designation: "Former CEO", department: "Delhi Jal Board", flaggedCount: 4, totalFlaggedValue: "19430000000.00", fingerprintFlag: true },
      { name: "Satish Chandra Vashishth", designation: "Former Chief Engineer", department: "Delhi Jal Board", flaggedCount: 4, totalFlaggedValue: "19430000000.00", fingerprintFlag: true },
      { name: "Suresh Mehta", designation: "Executive Engineer", department: "Health & Family Welfare Department", flaggedCount: 6, totalFlaggedValue: "98000000.00", fingerprintFlag: true },
      { name: "Anjali Sharma", designation: "Technical Committee Head", department: "Health & Family Welfare Department", flaggedCount: 5, totalFlaggedValue: "98000000.00", fingerprintFlag: true },
      { name: "Rajesh Verma", designation: "Chief Engineer", department: "Public Works Department (PWD)", flaggedCount: 5, totalFlaggedValue: "185000000.00", fingerprintFlag: true },
      { name: "Anil Kumar", designation: "Superintending Engineer", department: "Public Works Department (PWD)", flaggedCount: 2, totalFlaggedValue: "45000000.00", fingerprintFlag: false },
      { name: "Dr. P. K. Sen", designation: "Director General", department: "Health & Family Welfare Department", flaggedCount: 1, totalFlaggedValue: "12000000.00", fingerprintFlag: false },
      { name: "Sandeep Kapoor", designation: "Assistant Engineer", department: "Home Department Rajasthan", flaggedCount: 1, totalFlaggedValue: "6720000.00", fingerprintFlag: false },
      { name: "S. C. Gupta", designation: "Consultant Auditor", department: "Municipal Corporation", flaggedCount: 2, totalFlaggedValue: "32000000.00", fingerprintFlag: false },
      { name: "K. R. Rao", designation: "Senior Evaluator", department: "Water Resources Department", flaggedCount: 0, totalFlaggedValue: "0.00", fingerprintFlag: false },
      { name: "Vikram Malhotra", designation: "Procurement Officer", department: "IT & e-Governance", flaggedCount: 0, totalFlaggedValue: "0.00", fingerprintFlag: false }
    ];

    const seededOfficials = [];
    for (const o of officialsToInsert) {
      const [inserted] = await db.insert(officialsTable).values(o).returning();
      seededOfficials.push(inserted);
    }
    console.log(`Seeded ${seededOfficials.length} officials.`);

    const tendersToInsert: any[] = [];
    const activitiesToInsert: any[] = [];

    // ==========================================
    // 5. SEED CASE A: Delhi Jal Board STP Scam (₹1,943 Cr)
    // ==========================================
    const djbTenderId = "GEM-2022-DL-1943";
    const djbContractValue = 15460000000;
    const djbAwardedValue = 19430000000;
    const djbPriceRatio = 1.26;
    const djbTender = {
      tenderId: djbTenderId,
      title: "Augmentation & Upgradation of 10 Sewage Treatment Plants (STPs) in Delhi",
      department: "Delhi Jal Board (DJB)",
      state: "Delhi",
      source: "GeM",
      contractValue: djbContractValue.toString(),
      awardedValue: djbAwardedValue.toString(),
      fraudScore: 92,
      fraudTier: "critical",
      fraudSignals: ["Price Inflation", "Specification Tailoring", "Single Bidder Anomaly", "Linked Entity Anomaly", "After-Award Modification"],
      primarySignal: "Specification Tailoring",
      awardedTo: "Euroteck Environmental Pvt Ltd (via subcontracting from JVs)",
      publishedAt: new Date("2022-04-12T10:00:00Z"),
      bidWindowDays: 12,
      numberOfBidders: 3,
      allBidders: ["JV-1 (Euroteck Subcontract)", "JV-2 (Euroteck Subcontract)", "JV-3 (Euroteck Subcontract)"],
      priceRatio: djbPriceRatio,
      eligibilityCriteria: "Mandatory proprietary IFAS (Integrated Fixed-film Activated Sludge) technology with fixed media certification.",
      technicalSpecs: "Design, construction and upgradation of 10 STPs in Delhi (Rithala, Okhla, Kondli) capacity 150 MLD to IFAS standard.",
      isPreAward: false,
      closingAt: null,
      evidencePackage: {
        executiveSummary: "A massive ₹1,943 Crore STP upgradation contract awarded by Delhi Jal Board has been flagged for criminal rigging. Technical specifications were tailored to mandate proprietary 'IFAS technology with fixed media' which only Euroteck Environmental Pvt Ltd holds, blocking all other potential bidders. All three participating JV entities submitted identical Taiwan experience credentials and immediately subcontracted 100% of the execution work to Euroteck. The contract price was upwardly modified by ₹397 Crore post-award without GFR compliance.",
        priceComparison: {
          awardedPrice: djbAwardedValue,
          marketPrice: djbContractValue,
          ratio: djbPriceRatio,
          unit: "MLD capacity upgrade",
          sources: ["Original DJB Engineering Estimate", "CVC Standard STP Upgradation Indices", "Open Market IFAS Procurement Surveys"]
        },
        contractorProfile: {
          name: "Euroteck Environmental Pvt Ltd",
          cin: "U29259TG2008PTC169628",
          registrationDate: "2008-10-23T00:00:00.000Z",
          totalTendersWon: 14,
          totalValue: 22500000000,
          linkedEntities: ["Euroteck Subcontracting Network", "JV Cartel 1", "JV Cartel 2", "JV Cartel 3"],
          winConcentration: 0.85
        },
        recommendedAction: "Refer case to Enforcement Directorate (ED) and Central Vigilance Commission (CVC) immediately. Revise bidding guidelines to exclude proprietary technology tailoring and initiate prosecution under PC Act Section 11.",
        timelineAnomalies: [
          "Post-award cost modification of ₹397 Crore without competitive bidding or technical justification",
          "Restrictive 12-day bidding window for multi-hundred crore infrastructure contract"
        ],
        verificationStatus: "verified",
        verificationLabel: "Verified — ED chargesheet filed (ECIR/DLZO-I/07/2023)",
        collusionGraph: {
          nodes: [
            { id: "Euroteck", label: "Euroteck Environmental Pvt Ltd", type: "company" },
            { id: "JV-1", label: "JV-1 (Euroteck Subcontract)", type: "company" },
            { id: "JV-2", label: "JV-2 (Euroteck Subcontract)", type: "company" },
            { id: "JV-3", label: "JV-3 (Euroteck Subcontract)", type: "company" },
            { id: "dir_kurra1", label: "Raja Kumar Kurra (DIN-09183742)", type: "director" },
            { id: "dir_kurra2", label: "Hiral Rajkumar Kurra (DIN-06283910)", type: "director" },
            { id: "dir_kantamneni", label: "Rosaiah Kantamneni (DIN-07294518)", type: "director" },
            { id: "dir_chandra", label: "Sonali Chandra (DIN-08471293)", type: "director" },
            { id: "addr_hyd", label: "Plot 12, Gachibowli, Hyderabad (Shared Address)", type: "address" }
          ],
          links: [
            { source: "Euroteck", target: "dir_kurra1", type: "director" },
            { source: "Euroteck", target: "dir_kurra2", type: "director" },
            { source: "Euroteck", target: "dir_kantamneni", type: "director" },
            { source: "Euroteck", target: "dir_chandra", type: "director" },
            { source: "Euroteck", target: "addr_hyd", type: "address" },
            { source: "JV-1", target: "dir_kurra1", type: "director" },
            { source: "JV-1", target: "dir_kantamneni", type: "director" },
            { source: "JV-1", target: "addr_hyd", type: "address" },
            { source: "JV-2", target: "dir_kurra2", type: "director" },
            { source: "JV-2", target: "dir_chandra", type: "director" },
            { source: "JV-2", target: "addr_hyd", type: "address" },
            { source: "JV-3", target: "dir_kurra1", type: "director" },
            { source: "JV-3", target: "dir_kantamneni", type: "director" },
            { source: "JV-3", target: "addr_hyd", type: "address" }
          ],
          overlapReasons: [
            "All 4 MCA21-listed directors (Kurra, Kantamneni, Chandra families) cross-serve on JV boards",
            "All JVs utilize Euroteck Hyderabad corporate enclave as their registered office address",
            "100% subcontracting of all JV work back to Euroteck confirms shell entity pattern"
          ],
          hasCollusion: true
        },
        legalProvisions: [
          "Prevention of Corruption Act 1988, Section 11",
          "IPC Section 120B — Criminal Conspiracy",
          "General Financial Rules (GFR) Rule 173",
          "CVC Circular No. 03/01/12"
        ]
      }
    };
    tendersToInsert.push(djbTender);

    activitiesToInsert.push({
      type: "detection",
      message: `Critical Fraud Alert: Delhi Jal Board STP contract (₹1,943 Cr) upwardly revised by ₹397 Cr. Restrictive IFAS specs flagged at 92% confidence.`,
      tenderId: djbTenderId,
      tenderTitle: djbTender.title,
      score: djbTender.fraudScore,
      state: djbTender.state
    });

    // ==========================================
    // 6. SEED CASE B: CCTV Surveillance GEM-2026-RJ-3706 (Pre-Award Alert)
    // ==========================================
    const rjTenderId = "GEM-2026-RJ-3706";
    const rjContractValue = 3200000;
    const rjPriceRatio = 2.1;
    const rjAwardedValue = 6720000;
    const rjTender = {
      tenderId: rjTenderId,
      title: "Procurement of CCTV Surveillance — District Collectorate Security Upgrade",
      department: "Home Department Rajasthan",
      state: "Rajasthan",
      source: "GeM",
      contractValue: rjContractValue.toString(),
      awardedValue: null, // Pre-Award
      fraudScore: 87,
      fraudTier: "critical",
      fraudSignals: ["Price Inflation", "New Entity Anomaly", "Narrow Bid Window"],
      primarySignal: "Price Inflation",
      awardedTo: "UNDER EVALUATION (Favored: Rajasthan Secure Systems Ltd)",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      bidWindowDays: 4,
      numberOfBidders: 1,
      allBidders: ["Rajasthan Secure Systems Ltd"],
      priceRatio: rjPriceRatio,
      eligibilityCriteria: "Registered on GeM, local OEM certification, STQC security certified.",
      technicalSpecs: "4MP IP dome cameras, NVR with 60-day storage, night vision 50m.",
      isPreAward: true,
      closingAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Closes in 6 days
      evidencePackage: {
        executiveSummary: "Rajasthan Home Department's active CCTV tender is flagged at 87% confidence for bid rigging. The bid window was shortened to just 4 days, locking out almost all MSME suppliers. Only one bidder (Rajasthan Secure Systems Ltd) participated, submitting a quotation of ₹67.2 Lakhs — 2.1x the market standard rate of ₹32 Lakhs for the identical unit catalogue.",
        priceComparison: {
          awardedPrice: null,
          marketPrice: rjContractValue,
          ratio: rjPriceRatio,
          unit: "50-unit CCTV surveillance array",
          sources: ["GeM Catalogue Price Sheet", "Open Market CCTV Retail Surveys"]
        },
        verificationStatus: "illustrative",
        verificationLabel: "Illustrative — Pattern-based scenario (no public chargesheet)",
        contractorProfile: {
          name: "Rajasthan Secure Systems Ltd",
          cin: "U74900RJ2026PLC091283",
          registrationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // Registered 45 days ago! (S-06)
          totalTendersWon: 2,
          totalValue: 9800000,
          linkedEntities: ["SecureGlobal Corp (Parent shell)"],
          winConcentration: 0.90
        },
        recommendedAction: "Pre-Award Intervention required! Appeal specification parameters and request extension of the bidding window under CVC guidelines. Challenge bidder eligibility under GFR Rule 173.",
        timelineAnomalies: [
          "Narrow bid window of only 4 days — far below the CVC recommended minimum of 14 days",
          "Vendor incorporated just 45 days prior to bid release"
        ],
        collusionGraph: {
          nodes: [
            { id: "RSS", label: "Rajasthan Secure Systems", group: "bidder" },
            { id: "RJHome", label: "Rajasthan Home Dept", group: "department" }
          ],
          links: [
            { source: "RSS", target: "RJHome", value: 2, label: "Single bidder" }
          ],
          overlapReasons: ["Only 1 vendor bid in a restricted 4-day window"]
        },
        legalProvisions: [
          "GFR Rule 173 — Broad Competition Guidelines",
          "CVC Bid Window circular",
          "Prevention of Corruption Act 1988, Section 11"
        ]
      }
    };
    tendersToInsert.push(rjTender);

    activitiesToInsert.push({
      type: "alert",
      message: `🚨 Pre-Award Fraud Alert: ₹67.2L Rajasthan CCTV tender closing soon. 2.1x Price Inflation flagged.`,
      tenderId: rjTenderId,
      tenderTitle: rjTender.title,
      score: rjTender.fraudScore,
      state: rjTender.state
    });

    // ==========================================
    // 7. SEED CASE C: Telangana MSME Exclusion GEM-2026-TG-1892
    // ==========================================
    const tgTenderId = "GEM-2026-TG-1892";
    const tgContractValue = 12000000;
    const tgAwardedValue = 28000000;
    const tgPriceRatio = 2.33;
    const tgTender = {
      tenderId: tgTenderId,
      title: "Design & Installation of Medical Oxygen Generation Plant at Hyderabad General Hospital",
      department: "Health & Family Welfare Department",
      state: "Telangana",
      source: "GeM",
      contractValue: tgContractValue.toString(),
      awardedValue: tgAwardedValue.toString(),
      fraudScore: 85,
      fraudTier: "high",
      fraudSignals: ["Price Inflation", "Specification Tailoring", "Single Bidder Anomaly"],
      primarySignal: "Specification Tailoring",
      awardedTo: "MediEquip Solutions Pvt Ltd",
      publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      bidWindowDays: 5,
      numberOfBidders: 1,
      allBidders: ["MediEquip Solutions Pvt Ltd"],
      priceRatio: tgPriceRatio,
      eligibilityCriteria: "Turnover exceeding ₹15 Crores in last 3 consecutive years. ISO 13485 mandatory.",
      technicalSpecs: "Pressure Swing Adsorption (PSA) oxygen generator plant capacity 500 LPM with cylinder manifold.",
      isPreAward: false,
      closingAt: null,
      evidencePackage: {
        executiveSummary: "A ₹2.8 Crore oxygen plant tender has been flagged for MSME exclusion and severe spec-rigging. Turnover criteria was set excessively high at ₹15 Crores to intentionally lock out local, qualified medical equipment MSMEs. Bidding closed in just 5 days, and only one giant contractor (MediEquip Solutions) was qualified, charging 2.33x standard commercial rates.",
        priceComparison: {
          awardedPrice: tgAwardedValue,
          marketPrice: tgContractValue,
          ratio: tgPriceRatio,
          unit: "500 LPM PSA plant with installation",
          sources: ["Health Ministry Standard Costings", "Open Market PSA Plant Import Quotes"]
        },
        verificationStatus: "illustrative",
        verificationLabel: "Illustrative — Pattern-based scenario (no public chargesheet)",
        contractorProfile: {
          name: "MediEquip Solutions Pvt Ltd",
          cin: "U33110MH2012PTC228391",
          registrationDate: "2012-03-15T00:00:00.000Z",
          totalTendersWon: 42,
          totalValue: 980000000,
          linkedEntities: ["Alpha Medical Group (Parent)"],
          winConcentration: 0.72
        },
        recommendedAction: "GFR Rule 173 Appeal drafted. Local MSMEs are eligible to lodge a formal protest under GFR broad competition guidelines.",
        timelineAnomalies: [
          "5-day bidding window locks out local manufacturers who require time to submit certified technical spec sheets"
        ],
        collusionGraph: {
          nodes: [
            { id: "MES", label: "MediEquip Solutions", group: "bidder" },
            { id: "TGH", label: "Telangana Health Dept", group: "department" }
          ],
          links: [
            { source: "MES", target: "TGH", value: 3, label: "Favored single bidder" }
          ],
          overlapReasons: ["Bidding parameters restricted access to a single pre-selected vendor"]
        },
        legalProvisions: [
          "GFR Rule 173 — Broad Competition Guidelines",
          "Public Procurement Policy for Micro and Small Enterprises (MSEs) Order 2012"
        ]
      }
    };
    tendersToInsert.push(tgTender);

    activitiesToInsert.push({
      type: "detection",
      message: `New high risk case: ₹2.8Cr Telangana Oxygen Plant awarded to MediEquip. Spec-tailoring locks out local MSMEs.`,
      tenderId: tgTenderId,
      tenderTitle: tgTender.title,
      score: tgTender.fraudScore,
      state: tgTender.state
    });

    // ==========================================
    // 8. GENERATE 517 MORE DETERMINISTIC TENDERS
    // ==========================================
    console.log("Generating remaining 517 deterministic tenders...");
    for (let i = 1; i <= 517; i++) {
      const state = STATES[i % STATES.length];
      const dept = DEPARTMENTS[i % DEPARTMENTS.length];
      const source = i % 3 === 0 ? "CPPP" : "GeM";
      
      const seedVal = i * 17;
      const valRand = getPseudoRand(seedVal);
      const isPre = getPseudoRand(seedVal + 3) > 0.85; // ~15% pre-award alerts
      
      const contractValueRaw = Math.round(1500000 + valRand * 45000000); // 15L to 4.5Cr
      const priceRatio = 1.1 + getPseudoRand(seedVal + 7) * 1.3; // 1.1x to 2.4x
      const contractValue = contractValueRaw;
      const awardedValue = isPre ? null : Math.round(contractValue * priceRatio);
      
      const scoreRand = getPseudoRand(seedVal + 11);
      const fraudScore = Math.floor(40 + scoreRand * 55); // 40 to 95
      const fraudTier = fraudScore >= 85 ? "critical" : fraudScore >= 70 ? "high" : "medium";
      
      const activeSignals: string[] = [];
      if (priceRatio > 1.4) activeSignals.push("Price Inflation");
      if (getPseudoRand(seedVal + 15) > 0.5) activeSignals.push("Single Bidder Anomaly");
      if (getPseudoRand(seedVal + 19) > 0.6) activeSignals.push("Narrow Bid Window");
      if (getPseudoRand(seedVal + 23) > 0.7) activeSignals.push("New Entity Anomaly");
      if (getPseudoRand(seedVal + 27) > 0.8) activeSignals.push("Specification Tailoring");
      
      if (activeSignals.length === 0) {
        activeSignals.push("Price Inflation");
      }
      
      const primarySignal = activeSignals[0];
      const contractorObj = CONTRACTOR_TEMPLATES[(i + 5) % CONTRACTOR_TEMPLATES.length];
      const contractor = contractorObj.name;
      
      const stateCode = STATE_CODES[state] || "IN";
      const tenderId = `${source === "GeM" ? "GEM" : "CPPP"}-2026-${stateCode}-${1000 + i}`;
      
      // Dynamic titles based on department
      let title = "";
      let specs = "";
      if (dept.includes("PWD") || dept.includes("NHAI")) {
        const roadType = i % 2 === 0 ? "Bypass Highway" : "District Road";
        title = `Civil Works — Upgradation & Maintenance of ${roadType} from km ${10 * (i % 5)} to ${10 * (i % 5) + 15}`;
        specs = "Bituminous overlay, concrete shoulders, lane marking, structural repairs.";
      } else if (dept.includes("Health")) {
        const equip = i % 2 === 0 ? "Ventilator Systems" : "Digital X-Ray Machines";
        title = `Medical Equipment — Supply and Setup of ${equip} at District General Hospital`;
        specs = "High-res imaging sensors, DICOM compatible software, backup UPS capacity.";
      } else if (dept.includes("Education")) {
        const item = i % 2 === 0 ? "Interactive Digital Panels" : "Computer Lab Terminals";
        title = `Digital Classrooms — Procurement of ${item} for 50 Primary Schools`;
        specs = "IPS panels, 4K active touch, Android-integrated teaching modules.";
      } else if (dept.includes("Water")) {
        title = `Irrigation Systems — Rehabilitation of Branch Canal Gate Systems, Division ${i % 4}`;
        specs = "Motorized sluice gates, telemetry control nodes, anti-corrosive epoxy coat.";
      } else if (dept.includes("Police")) {
        title = `Security Systems — Integrated Drone Surveillance Grid and Base Stations`;
        specs = "UAV drone units, thermal camera attachments, 10km live telecast ranges.";
      } else {
        title = `IT Systems — Local Data Centre Network Modernisation, Hub ${i % 3}`;
        specs = "10G fiber switches, redundant rack cooling, modular fire suppression systems.";
      }
      
      const publishedAt = new Date(Date.now() - (Math.floor(getPseudoRand(seedVal + 31) * 45) + 2) * 24 * 60 * 60 * 1000);
      const bidWindowDays = Math.floor(3 + getPseudoRand(seedVal + 35) * 15);
      const closingAt = isPre ? new Date(Date.now() + (Math.floor(2 + getPseudoRand(seedVal + 39) * 12)) * 24 * 60 * 60 * 1000) : null;
      
      const allBidders = [contractor];
      if (getPseudoRand(seedVal + 43) > 0.4) allBidders.push(CONTRACTOR_TEMPLATES[(i + 9) % CONTRACTOR_TEMPLATES.length].name);
      if (getPseudoRand(seedVal + 47) > 0.7) allBidders.push(CONTRACTOR_TEMPLATES[(i + 13) % CONTRACTOR_TEMPLATES.length].name);
      
      const evidencePackage = {
        executiveSummary: `Tender ${tenderId} for the "${title}" in ${state} has been flagged for ${primarySignal} with a fraud confidence score of ${fraudScore}%. Audit checks indicate that the pricing structure is inflated by ${priceRatio.toFixed(2)}x against median catalogue standards.`,
        priceComparison: {
          awardedPrice: awardedValue,
          marketPrice: contractValue,
          ratio: Number(priceRatio.toFixed(2)),
          unit: "Complete turnkey project",
          sources: ["GeM Procurement Catalogues", "Open Market Quotations Surveys"]
        },
        contractorProfile: {
          name: contractor,
          cin: `U${Math.floor(10000 + getPseudoRand(seedVal + 51) * 90000)}${stateCode}2023PTC${Math.floor(100000 + getPseudoRand(seedVal + 55) * 900000)}`,
          registrationDate: new Date(Date.now() - (100 + getPseudoRand(seedVal + 59) * 1000) * 24 * 60 * 60 * 1000).toISOString(),
          totalTendersWon: Math.floor(3 + getPseudoRand(seedVal + 63) * 15),
          totalValue: contractValue * 4,
          linkedEntities: getPseudoRand(seedVal + 67) > 0.7 ? ["Apex Infrastructure JV"] : [],
          winConcentration: Number((0.4 + getPseudoRand(seedVal + 71) * 0.45).toFixed(2))
        },
        recommendedAction: fraudScore >= 70 
          ? isPre 
            ? `File preemptive specifications protest under GFR Rule 173 before bid closing date.`
            : `Draft and submit an RTI application to check bid evaluations logs. Escalate to state Vigilance Commission.`
          : `Monitor contractor win patterns across state divisions for win concentrations.`,
        timelineAnomalies: bidWindowDays < 7 ? [`Bidding window of only ${bidWindowDays} days — restricts competitive response`] : [],
        collusionGraph: {
          nodes: [
            { id: "comp_1", label: contractor, type: "company" },
            { id: "comp_2", label: `${contractor.split(" ")[0]} Allied Systems`, type: "company" },
            { id: "dir_1", label: `Suresh Mehta (DIN-08472910)`, type: "director" },
            { id: "addr_1", label: `Suite 402, Trade Centre, BKC, Mumbai`, type: "address" }
          ],
          links: [
            { source: "comp_1", target: "dir_1", type: "director" },
            { source: "comp_1", target: "addr_1", type: "address" },
            { source: "comp_2", target: "dir_1", type: "director" },
            { source: "comp_2", target: "addr_1", type: "address" }
          ],
          overlapReasons: ["Bidders share registered directorship identities and office spaces"],
          hasCollusion: true
        },
        legalProvisions: ["General Financial Rules (GFR) Rule 173", "Prevention of Corruption Act 1988"]
      };

      const finalAwardedTo = isPre 
        ? `UNDER EVALUATION (Favored: ${contractor})` 
        : contractor;

      tendersToInsert.push({
        tenderId,
        title,
        department: dept,
        state,
        source,
        contractValue: contractValue.toString(),
        awardedValue: awardedValue ? awardedValue.toString() : null,
        fraudScore,
        fraudTier,
        fraudSignals: activeSignals,
        primarySignal,
        awardedTo: finalAwardedTo,
        publishedAt,
        bidWindowDays,
        numberOfBidders: allBidders.length,
        allBidders,
        priceRatio,
        eligibilityCriteria: `Standard GFR compliant eligibility, registered vendor in ${stateCode}.`,
        technicalSpecs: specs,
        isPreAward: isPre,
        closingAt,
        evidencePackage
      });

      // Periodic logs or alerts
      if (i % 25 === 0) {
        activitiesToInsert.push({
          type: isPre ? "alert" : "detection",
          message: isPre 
            ? `🚨 Pre-Award alert: ₹${(contractValue / 100000).toFixed(1)}L tender closing soon in ${stateCode} — ${primarySignal} flagged.`
            : `Flagged ${fraudTier} risk in ${stateCode}: ₹${(awardedValue! / 100000).toFixed(1)}L awarded to ${contractor} (${primarySignal} detected).`,
          tenderId,
          tenderTitle: title,
          score: fraudScore,
          state
        });
      }
    }

    // 9. Insert all tenders in chunks
    console.log(`Inserting ${tendersToInsert.length} tenders...`);
    const chunkSize = 50;
    const insertedTenders: any[] = [];
    for (let idx = 0; idx < tendersToInsert.length; idx += chunkSize) {
      const chunk = tendersToInsert.slice(idx, idx + chunkSize);
      const res = await db.insert(tendersTable).values(chunk).returning();
      insertedTenders.push(...res);
    }
    console.log(`Successfully inserted all ${insertedTenders.length} tenders.`);

    // 10. Insert activities in chunks
    console.log(`Inserting ${activitiesToInsert.length} activities...`);
    for (let idx = 0; idx < activitiesToInsert.length; idx += chunkSize) {
      const chunk = activitiesToInsert.slice(idx, idx + chunkSize);
      await db.insert(activityTable).values(chunk);
    }
    console.log("Successfully inserted all activity records.");

    // ==========================================
    // 11. SEED CASE D: Compile Tender-Official Links
    // ==========================================
    console.log("Linking officials to flagged tenders...");
    const linksToInsert = [];

    // Link Delhi STP tender to Satyendar Jain, Udit Prakash Rai, and Satish Chandra Vashishth
    const djbDbTender = insertedTenders.find(t => t.tenderId === djbTenderId);
    if (djbDbTender) {
      const sJain = seededOfficials.find(o => o.name === "Satyendar Jain");
      const uRai = seededOfficials.find(o => o.name === "Udit Prakash Rai");
      const sVashishth = seededOfficials.find(o => o.name === "Satish Chandra Vashishth");

      if (sJain) linksToInsert.push({ tenderId: djbDbTender.id, officialId: sJain.id, role: "approver" });
      if (uRai) linksToInsert.push({ tenderId: djbDbTender.id, officialId: uRai.id, role: "signatory" });
      if (sVashishth) linksToInsert.push({ tenderId: djbDbTender.id, officialId: sVashishth.id, role: "evaluator" });
      
      // Let's link Satyendar Jain and Udit Prakash to 3 more Delhi tenders deterministically!
      const dlTenders = insertedTenders.filter(t => t.state === "Delhi" && t.tenderId !== djbTenderId).slice(0, 3);
      dlTenders.forEach(t => {
        if (sJain) linksToInsert.push({ tenderId: t.id, officialId: sJain.id, role: "approver" });
        if (uRai) linksToInsert.push({ tenderId: t.id, officialId: uRai.id, role: "signatory" });
        if (sVashishth) linksToInsert.push({ tenderId: t.id, officialId: sVashishth.id, role: "evaluator" });
      });
    }

    // Link GMC ICU Beds tender and health tenders to Suresh Mehta and Anjali Sharma
    const sMehta = seededOfficials.find(o => o.name === "Suresh Mehta");
    const aSharma = seededOfficials.find(o => o.name === "Anjali Sharma");
    const healthTenders = insertedTenders.filter(t => t.department.toLowerCase().includes("health")).slice(0, 6);
    
    healthTenders.forEach((t, i) => {
      if (sMehta) linksToInsert.push({ tenderId: t.id, officialId: sMehta.id, role: i % 2 === 0 ? "approver" : "evaluator" });
      if (aSharma) linksToInsert.push({ tenderId: t.id, officialId: aSharma.id, role: i % 2 === 0 ? "evaluator" : "signatory" });
    });

    // Link PWD tenders to Rajesh Verma
    const rVerma = seededOfficials.find(o => o.name === "Rajesh Verma");
    const pwdTenders = insertedTenders.filter(t => t.department.toLowerCase().includes("pwd") || t.department.toLowerCase().includes("national")).slice(0, 5);
    pwdTenders.forEach(t => {
      if (rVerma) linksToInsert.push({ tenderId: t.id, officialId: rVerma.id, role: "approver" });
    });

    // Link Rajasthan CCTV pre-award case to Sandeep Kapoor and Anil Kumar
    const rjDbTender = insertedTenders.find(t => t.tenderId === rjTenderId);
    if (rjDbTender) {
      const sKapoor = seededOfficials.find(o => o.name === "Sandeep Kapoor");
      const aKumar = seededOfficials.find(o => o.name === "Anil Kumar");

      if (sKapoor) linksToInsert.push({ tenderId: rjDbTender.id, officialId: sKapoor.id, role: "evaluator" });
      if (aKumar) linksToInsert.push({ tenderId: rjDbTender.id, officialId: aKumar.id, role: "approver" });
    }

    // Bulk insert links
    console.log(`Inserting ${linksToInsert.length} links...`);
    for (let idx = 0; idx < linksToInsert.length; idx += chunkSize) {
      const chunk = linksToInsert.slice(idx, idx + chunkSize);
      await db.insert(tenderOfficialLinksTable).values(chunk);
    }
    console.log("Successfully seeded officials linkages.");
    
  } catch (err) {
    console.error("Error seeding database: ", err);
    throw err;
  }
}
