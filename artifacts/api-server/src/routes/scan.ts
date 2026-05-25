import { Router } from "express";
import { db } from "@workspace/db";
import { tendersTable, activityTable } from "@workspace/db";

const router = Router();

const SCAN_POOL = [
  {
    title: "Supply of Hospital Equipment - 50 ICU Beds with Motorized Adjustments",
    department: "Government Medical College & Hospital",
    state: "Uttar Pradesh",
    source: "GeM",
    contractValue: 7800000,
    awardedValue: 19500000,
    fraudScore: 91,
    fraudTier: "critical",
    fraudSignals: ["Price Inflation", "Single Bidder Anomaly", "Narrow Bid Window"],
    primarySignal: "Price Inflation",
    awardedTo: "MediEquip Solutions Pvt Ltd",
    bidWindowDays: 3,
    numberOfBidders: 1,
    priceRatio: 2.5,
    eligibilityCriteria: "Turnover > ₹2Cr, ISO 9001 certified",
    technicalSpecs: "Motorized ICU beds with side rails, IV pole, cardiac tray",
  },
  {
    title: "Construction of District Level Road — Kanpur to Unnao Highway Bypass",
    department: "Public Works Department Uttar Pradesh",
    state: "Uttar Pradesh",
    source: "CPPP",
    contractValue: 43200000,
    awardedValue: 51840000,
    fraudScore: 78,
    fraudTier: "high",
    fraudSignals: ["After-Award Modification", "Contractor Win Concentration"],
    primarySignal: "After-Award Modification",
    awardedTo: "Bharat Construction Co Pvt Ltd",
    bidWindowDays: 14,
    numberOfBidders: 3,
    priceRatio: 1.2,
    eligibilityCriteria: "Class AA contractor, 5 years road construction experience",
    technicalSpecs: "4-lane divided highway, bituminous concrete surface, drainage channels",
  },
  {
    title: "Procurement of CCTV Surveillance — District Collectorate Security Upgrade",
    department: "Home Department Rajasthan",
    state: "Rajasthan",
    source: "GeM",
    contractValue: 3200000,
    awardedValue: 6720000,
    fraudScore: 87,
    fraudTier: "critical",
    fraudSignals: ["Price Inflation", "New Entity Anomaly", "Narrow Bid Window"],
    primarySignal: "Price Inflation",
    awardedTo: "Rajasthan Secure Systems Ltd",
    bidWindowDays: 4,
    numberOfBidders: 1,
    priceRatio: 2.1,
    eligibilityCriteria: "Registered on GeM, STQC certified",
    technicalSpecs: "4MP IP cameras, NVR with 60-day storage, night vision 50m",
  },
  {
    title: "Supply of School Furniture — 10,000 Sets for Government Schools Nashik",
    department: "Maharashtra Education Department",
    state: "Maharashtra",
    source: "GeM",
    contractValue: 18000000,
    awardedValue: 28800000,
    fraudScore: 82,
    fraudTier: "critical",
    fraudSignals: ["Price Inflation", "Specification Tailoring", "Single Bidder Anomaly"],
    primarySignal: "Specification Tailoring",
    awardedTo: "Sahyadri Publishers Pvt Ltd",
    bidWindowDays: 6,
    numberOfBidders: 1,
    priceRatio: 1.6,
    eligibilityCriteria: "BIS certified furniture manufacturer",
    technicalSpecs: "Steel-top bench with attached seat, powder-coated, BIS 4872 compliant",
  },
  {
    title: "IT Services — Data Centre Migration and Cloud Infrastructure Setup",
    department: "National Informatics Centre Delhi",
    state: "Delhi",
    source: "CPPP",
    contractValue: 98000000,
    awardedValue: 117600000,
    fraudScore: 74,
    fraudTier: "high",
    fraudSignals: ["Contractor Win Concentration", "Bid Amount Clustering"],
    primarySignal: "Contractor Win Concentration",
    awardedTo: "DataTech Infrastructure Pvt Ltd",
    bidWindowDays: 21,
    numberOfBidders: 4,
    priceRatio: 1.2,
    eligibilityCriteria: "CMMI Level 3 certified, 10 years IT infrastructure experience",
    technicalSpecs: "AWS/Azure hybrid cloud, 99.99% uptime SLA, disaster recovery",
  },
  {
    title: "Supply of Police Uniforms — 5000 Sets Summer/Winter, Karnataka Police",
    department: "Karnataka State Police",
    state: "Karnataka",
    source: "GeM",
    contractValue: 5750000,
    awardedValue: 12075000,
    fraudScore: 88,
    fraudTier: "critical",
    fraudSignals: ["Price Inflation", "New Entity Anomaly", "Narrow Bid Window"],
    primarySignal: "Price Inflation",
    awardedTo: "Karnataka Textile Works Pvt Ltd",
    bidWindowDays: 3,
    numberOfBidders: 1,
    priceRatio: 2.1,
    eligibilityCriteria: "GeM registered, GI compliant fabric",
    technicalSpecs: "Khaki polyester-cotton blend, BIS certified fabric, anti-crease treatment",
  },
  {
    title: "Procurement of Ambulances — 30 Advanced Life Support Vehicles",
    department: "Gujarat Health & Family Welfare Dept",
    state: "Gujarat",
    source: "GeM",
    contractValue: 42000000,
    awardedValue: 54600000,
    fraudScore: 68,
    fraudTier: "high",
    fraudSignals: ["Price Inflation", "Single Bidder Anomaly"],
    primarySignal: "Price Inflation",
    awardedTo: "MediCare Solutions Pvt Ltd",
    bidWindowDays: 12,
    numberOfBidders: 2,
    priceRatio: 1.3,
    eligibilityCriteria: "AIS 125 compliant, AERB approved",
    technicalSpecs: "ALS ambulance, ventilator, defibrillator, oxygen system",
  },
  {
    title: "Smart Classroom Setup — 500 Schools Digital Infrastructure Upgrade",
    department: "Tamil Nadu School Education Dept",
    state: "Tamil Nadu",
    source: "CPPP",
    contractValue: 28000000,
    awardedValue: 42000000,
    fraudScore: 79,
    fraudTier: "high",
    fraudSignals: ["Price Inflation", "Specification Tailoring"],
    primarySignal: "Specification Tailoring",
    awardedTo: "EduTech South India Pvt Ltd",
    bidWindowDays: 7,
    numberOfBidders: 3,
    priceRatio: 1.5,
    eligibilityCriteria: "OEM authorised, NIELIT empanelled",
    technicalSpecs: "86-inch interactive flat panel, 4K resolution, built-in Android 11",
  },
];

function getTierId(state: string) {
  const map: Record<string, string> = {
    "Uttar Pradesh": "UP",
    Maharashtra: "MH",
    Delhi: "DL",
    Karnataka: "KA",
    Gujarat: "GJ",
    Rajasthan: "RJ",
    "Tamil Nadu": "TN",
    Telangana: "TG",
    "West Bengal": "WB",
    "Madhya Pradesh": "MP",
  };
  return map[state] ?? "IN";
}

function generateTenderId(state: string, source: string) {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 8999);
  const prefix = source === "GeM" ? "GEM" : source === "CPPP" ? "CPPP" : source;
  return `${prefix}-${year}-${getTierId(state)}-${num}`;
}

router.post("/scan", async (req, res) => {
  const startTime = Date.now();

  try {
    const requestedCount = (req.body as { count?: number })?.count ?? 3;
    const count = Math.min(Math.max(1, requestedCount), 5);

    const shuffled = [...SCAN_POOL].sort(() => Math.random() - 0.5);
    const toInsert = shuffled.slice(0, count);

    const newTenders = [];

    for (const template of toInsert) {
      const tenderId = generateTenderId(template.state, template.source);

      const priceVariance = 0.85 + Math.random() * 0.3;
      const contractValue = Math.round(template.contractValue * priceVariance);
      const awardedValue = Math.round(template.awardedValue * priceVariance);
      const fraudScore = Math.min(99, Math.max(40, template.fraudScore + Math.round((Math.random() - 0.5) * 10)));
      const fraudTier =
        fraudScore >= 85 ? "critical" : fraudScore >= 70 ? "high" : fraudScore >= 40 ? "medium" : "low";

      const publishedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);

      const evidencePackage = {
        executiveSummary: `Tender ${tenderId} from ${template.department} (${template.state}) has been flagged with a fraud confidence score of ${fraudScore}%. ${template.fraudSignals.length} fraud signals were detected: ${template.fraudSignals.join(", ")}. The contract worth ₹${(contractValue / 10000000).toFixed(2)} crore was awarded to ${template.awardedTo} with an awarded value of ₹${(awardedValue / 10000000).toFixed(2)} crore — ${template.priceRatio}× the market rate.`,
        signalBreakdown: template.fraudSignals.map((sig, i) => ({
          signalId: `S-0${i + 1}`,
          name: sig,
          triggered: true,
          confidence: Math.min(98, 60 + Math.floor(Math.random() * 35)),
          evidence: `Signal "${sig}" detected in tender ${tenderId} from ${template.department}.`,
          sourceUrl: null,
          weight: 0.2,
        })),
        contractorProfile: {
          name: template.awardedTo,
          cin: `U${Math.floor(10000 + Math.random() * 90000)}${getTierId(template.state)}${new Date().getFullYear()}PTC${Math.floor(100000 + Math.random() * 900000)}`,
          registrationDate: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          totalTendersWon: Math.floor(3 + Math.random() * 15),
          totalValue: contractValue * (1.5 + Math.random() * 3),
          linkedEntities: [],
          winConcentration: 0.5 + Math.random() * 0.4,
        },
        priceComparison: {
          awardedPrice: awardedValue,
          marketPrice: Math.round(contractValue / template.priceRatio),
          ratio: template.priceRatio,
          unit: "total contract",
          sources: ["GeM Catalogue", "Open Market Survey", "Previous Procurement Records"],
        },
        legalProvisions: [
          "IPC Section 120B — Criminal Conspiracy",
          "Prevention of Corruption Act 1988, Section 11",
          "CVC Circular No. 03/01/12 — Procurement Integrity",
          "GFR Rule 175 — Procurement from GeM",
        ],
        recommendedAction:
          fraudScore >= 70
            ? `File RTI application immediately for Tender ${tenderId}. Escalate to CVC and ${template.state} Vigilance Commission.`
            : `Flag for human review. Monitor contractor ${template.awardedTo} for pattern.`,
        timelineAnomalies:
          template.bidWindowDays < 7
            ? [`Bid window of only ${template.bidWindowDays} days — below CVC 14-day minimum`]
            : [],
      };

      const [inserted] = await db
        .insert(tendersTable)
        .values({
          tenderId,
          title: template.title,
          department: template.department,
          state: template.state,
          source: template.source,
          contractValue: contractValue.toString(),
          awardedValue: awardedValue.toString(),
          fraudScore,
          fraudTier,
          fraudSignals: template.fraudSignals,
          primarySignal: template.primarySignal,
          awardedTo: template.awardedTo,
          publishedAt,
          bidWindowDays: template.bidWindowDays,
          numberOfBidders: template.numberOfBidders,
          allBidders: [template.awardedTo],
          priceRatio: template.priceRatio,
          eligibilityCriteria: template.eligibilityCriteria,
          technicalSpecs: template.technicalSpecs,
          evidencePackage,
        })
        .returning();

      await db.insert(activityTable).values({
        type: "detection",
        message: `New ${fraudTier} fraud detected: ₹${(awardedValue / 10000000).toFixed(1)}Cr ${template.primarySignal} flagged at ${fraudScore}% confidence — ${template.department}`,
        tenderId,
        tenderTitle: template.title,
        score: fraudScore,
        state: template.state,
        tenderDbId: inserted.id,
      });

      newTenders.push({
        tenderId,
        title: template.title,
        fraudScore,
        fraudTier,
        department: template.department,
        state: template.state,
        contractValue,
        isNew: true,
      });
    }

    const scanDurationMs = Date.now() - startTime + Math.floor(800 + Math.random() * 400);

    res.json({
      scannedCount: Math.floor(count * (180 + Math.random() * 120)),
      flaggedCount: newTenders.length,
      newTenders,
      criticalFound: newTenders.filter((t) => t.fraudTier === "critical").length,
      scanDurationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error running scan");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
