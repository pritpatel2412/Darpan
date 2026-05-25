import { Router } from "express";
import { db } from "@workspace/db";
import { contractorsTable, tendersTable } from "@workspace/db";
import { GetContractorParams, ListContractorsQueryParams } from "@workspace/api-zod";
import { eq, desc, ilike, or, SQL, and } from "drizzle-orm";

const router = Router();

router.get("/contractors", async (req, res) => {
  try {
    const query = ListContractorsQueryParams.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (query.search) {
      conditions.push(
        or(
          ilike(contractorsTable.name, `%${query.search}%`),
          ilike(contractorsTable.cin, `%${query.search}%`)
        ) as SQL
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const contractors = await db
      .select()
      .from(contractorsTable)
      .where(where)
      .orderBy(desc(contractorsTable.riskScore))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(contractorsTable).where(where);

    res.json({
      contractors: contractors.map(formatContractor),
      total: countResult.length,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing contractors");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/contractors/:id", async (req, res) => {
  try {
    const { id } = GetContractorParams.parse(req.params);

    const [contractor] = await db
      .select()
      .from(contractorsTable)
      .where(eq(contractorsTable.id, id))
      .limit(1);

    if (!contractor) {
      res.status(404).json({ error: "Contractor not found" });
      return;
    }

    const tenders = await db
      .select()
      .from(tendersTable)
      .where(ilike(tendersTable.awardedTo, `%${contractor.name}%`))
      .orderBy(desc(tendersTable.fraudScore))
      .limit(20);

    res.json({
      ...formatContractor(contractor),
      linkedEntities: contractor.linkedEntities as string[],
      directors: contractor.directors as string[],
      tenders: tenders.map(formatTenderSummary),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting contractor");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatContractor(c: typeof contractorsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    cin: c.cin,
    state: c.state,
    registrationDate: c.registrationDate?.toISOString() ?? new Date().toISOString(),
    flaggedTenders: c.flaggedTenders,
    totalValue: parseFloat(c.totalValue as string),
    riskScore: c.riskScore,
    primarySignals: c.primarySignals as string[],
  };
}

function formatTenderSummary(t: typeof tendersTable.$inferSelect) {
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

export default router;
