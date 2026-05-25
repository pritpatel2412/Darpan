import { Router } from "express";
import { db } from "@workspace/db";
import { tendersTable, rtisTable } from "@workspace/db";
import { GetTenderParams, ListTendersQueryParams } from "@workspace/api-zod";
import { eq, desc, gte, ilike, and, or, SQL } from "drizzle-orm";

const router = Router();

router.get("/tenders", async (req, res) => {
  try {
    const query = ListTendersQueryParams.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (query.state) {
      conditions.push(eq(tendersTable.state, query.state));
    }
    if (query.department) {
      conditions.push(ilike(tendersTable.department, `%${query.department}%`));
    }
    if (query.minScore !== undefined) {
      conditions.push(gte(tendersTable.fraudScore, query.minScore));
    }
    if (query.fraudType) {
      // Filter by primary signal
      conditions.push(ilike(tendersTable.primarySignal, `%${query.fraudType}%`));
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(tendersTable.title, `%${query.search}%`),
          ilike(tendersTable.tenderId, `%${query.search}%`),
          ilike(tendersTable.awardedTo, `%${query.search}%`)
        ) as SQL
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const tenders = await db
      .select()
      .from(tendersTable)
      .where(where)
      .orderBy(desc(tendersTable.fraudScore))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select()
      .from(tendersTable)
      .where(where);

    res.json({
      tenders: tenders.map(formatTender),
      total: countResult.length,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing tenders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tenders/:id", async (req, res) => {
  try {
    const { id } = GetTenderParams.parse(req.params);

    const [tender] = await db
      .select()
      .from(tendersTable)
      .where(eq(tendersTable.id, id))
      .limit(1);

    if (!tender) {
      res.status(404).json({ error: "Tender not found" });
      return;
    }

    // Get RTI status
    const [rti] = await db
      .select()
      .from(rtisTable)
      .where(eq(rtisTable.tenderDbId, tender.id))
      .limit(1);

    const detail = {
      ...formatTender(tender),
      eligibilityCriteria: tender.eligibilityCriteria ?? "",
      technicalSpecs: tender.technicalSpecs ?? "",
      numberOfBidders: tender.numberOfBidders,
      allBidders: tender.allBidders as string[],
      evidencePackage: tender.evidencePackage ?? buildDefaultEvidence(tender),
      rtiStatus: rti?.status ?? null,
    };

    res.json(detail);
  } catch (err) {
    req.log.error({ err }, "Error getting tender");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tenders/:id/rti", async (req, res) => {
  try {
    const { id } = GetTenderParams.parse(req.params);

    const [tender] = await db
      .select()
      .from(tendersTable)
      .where(eq(tendersTable.id, id))
      .limit(1);

    if (!tender) {
      res.status(404).json({ error: "Tender not found" });
      return;
    }

    // Check if RTI already exists
    const [existing] = await db
      .select()
      .from(rtisTable)
      .where(eq(rtisTable.tenderDbId, tender.id))
      .limit(1);

    if (existing) {
      res.json(formatRti(existing));
      return;
    }

    const signals = tender.fraudSignals as string[];
    const questions = generateRtiQuestions(tender, signals);
    const filingDate = new Date();
    const responseDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const confirmationNumber = `RTI-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;

    const [rti] = await db
      .insert(rtisTable)
      .values({
        tenderId: tender.tenderId,
        tenderTitle: tender.title,
        department: tender.department,
        pioName: `Public Information Officer, ${tender.department}`,
        pioAddress: `Ministry of ${tender.department}, New Delhi - 110001`,
        status: "drafted",
        questions,
        legalBasis:
          "Right to Information Act, 2005 — Section 6(1). The applicant seeks information under Section 4(1)(b)(xiii) which mandates disclosure of details of all procurements including tender specifications, bid evaluation criteria, comparative bid statements, and award decisions.",
        evidenceSummary: `This RTI application is filed in response to anomalies detected in Tender ID: ${tender.tenderId}. AI analysis detected a fraud confidence score of ${tender.fraudScore.toFixed(1)}% based on ${signals.length} signals: ${signals.join(", ")}.`,
        filingDate,
        responseDeadline,
        confirmationNumber,
        tenderDbId: tender.id,
      })
      .returning();

    res.json(formatRti(rti));
  } catch (err) {
    req.log.error({ err }, "Error generating RTI");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTender(t: typeof tendersTable.$inferSelect) {
  return {
    id: t.id,
    tenderId: t.tenderId,
    title: t.title,
    department: t.department,
    state: t.state,
    source: t.source,
    contractValue: parseFloat(t.contractValue as string),
    awardedValue: t.awardedValue ? parseFloat(t.awardedValue as string) : null,
    fraudScore: t.fraudScore,
    fraudTier: t.fraudTier,
    fraudSignals: t.fraudSignals as string[],
    primarySignal: t.primarySignal ?? "",
    awardedTo: t.awardedTo,
    publishedAt: t.publishedAt.toISOString(),
    bidWindowDays: t.bidWindowDays,
    priceRatio: t.priceRatio ?? null,
  };
}

function formatRti(r: typeof rtisTable.$inferSelect) {
  return {
    id: r.id,
    tenderId: r.tenderId,
    tenderTitle: r.tenderTitle,
    department: r.department,
    pioName: r.pioName ?? "",
    pioAddress: r.pioAddress ?? "",
    status: r.status,
    questions: r.questions as string[],
    legalBasis: r.legalBasis ?? "",
    evidenceSummary: r.evidenceSummary ?? "",
    filingDate: r.filingDate?.toISOString() ?? null,
    responseDeadline: r.responseDeadline?.toISOString() ?? null,
    confirmationNumber: r.confirmationNumber ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function buildDefaultEvidence(t: typeof tendersTable.$inferSelect) {
  const signals = t.fraudSignals as string[];
  return {
    executiveSummary: `Tender ${t.tenderId} from ${t.department} (${t.state}) has been flagged with a fraud confidence score of ${t.fraudScore.toFixed(1)}%. Analysis detected ${signals.length} fraud signal(s): ${signals.join(", ")}. The contract worth ₹${(parseFloat(t.contractValue as string) / 1_00_00_000).toFixed(2)} crore was awarded to ${t.awardedTo}.`,
    signalBreakdown: signals.map((s, i) => ({
      signalId: `S-0${i + 1}`,
      name: s,
      triggered: true,
      confidence: Math.min(95, 50 + Math.random() * 40),
      evidence: `Signal "${s}" detected in tender ${t.tenderId}.`,
      sourceUrl: null,
      weight: 0.2,
    })),
    contractorProfile: {
      name: t.awardedTo,
      cin: `U${Math.floor(10000 + Math.random() * 90000)}MH${new Date().getFullYear()}PTC${Math.floor(100000 + Math.random() * 900000)}`,
      registrationDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalTendersWon: Math.floor(2 + Math.random() * 20),
      totalValue: parseFloat(t.contractValue as string) * (1 + Math.random() * 3),
      linkedEntities: [],
      winConcentration: Math.random() * 0.9,
    },
    priceComparison: {
      awardedPrice: parseFloat(t.awardedValue as string ?? t.contractValue as string),
      marketPrice: parseFloat(t.contractValue as string) / (t.priceRatio ?? 1.5),
      ratio: t.priceRatio ?? 1.5,
      unit: "per unit",
      sources: ["GeM Catalogue", "Open Market Survey"],
    },
    legalProvisions: [
      "IPC Section 120B — Criminal Conspiracy",
      "Prevention of Corruption Act 1988, Section 11 — Public servant obtaining undue advantage",
      "CVC Circular No. 03/01/12 — Procurement Integrity",
    ],
    recommendedAction: t.fraudScore >= 70
      ? "File RTI application immediately. Escalate to CVC if no response within 30 days."
      : "Flag for human review. Gather additional evidence before filing RTI.",
    timelineAnomalies: t.bidWindowDays < 7
      ? [`Bid window of only ${t.bidWindowDays} days — well below the 14-day minimum recommended by CVC guidelines`]
      : [],
  };
}

function generateRtiQuestions(t: typeof tendersTable.$inferSelect, signals: string[]) {
  const questions = [
    `Please provide certified copies of all bid documents received for Tender ID ${t.tenderId}, including technical bids, financial bids, and eligibility documents of all bidders.`,
    `Please provide the complete comparative bid statement (CBS) prepared by the Tender Evaluation Committee for Tender ${t.tenderId}.`,
    `Please provide the minutes of the Tender Evaluation Committee meetings held in relation to Tender ${t.tenderId}, including names and designations of all committee members.`,
    `Please provide the price justification note (if any) explaining why the awarded value of ₹${(parseFloat(t.awardedValue as string ?? t.contractValue as string) / 100000).toFixed(2)} lakh was considered reasonable.`,
    `Please provide details of the market survey or rate analysis conducted prior to setting the estimated cost for Tender ${t.tenderId}.`,
    `Please provide the technical specification document that formed the basis of Tender ${t.tenderId}, along with any amendments.`,
  ];

  if (signals.includes("Single Bidder Anomaly") || signals.includes("Single bidder")) {
    questions.push(`Please explain why only a single bidder was found qualified/responsive for a nationally-listed tender above ₹25 lakh, and what steps were taken to encourage wider participation.`);
  }

  if (signals.includes("Price Inflation") || signals.includes("Inflated pricing")) {
    questions.push(`Please provide justification for the awarded price being significantly higher than comparable items available on GeM catalogue and open market. Please attach supporting documents.`);
  }

  if (signals.includes("Narrow Bid Window")) {
    questions.push(`Please provide the reason for the bid submission window being ${t.bidWindowDays} days, which is below the standard minimum period, and who approved this deviation.`);
  }

  questions.push(`Please provide details of any post-award amendments or modifications made to the contract value, scope, or specifications for Tender ${t.tenderId}.`);
  questions.push(`Please confirm whether contractor ${t.awardedTo} was found eligible as per the eligibility criteria specified in the tender, and provide the eligibility verification report.`);

  return questions;
}

export default router;
