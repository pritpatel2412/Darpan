import { Router } from "express";
import { db } from "@workspace/db";
import { rtisTable } from "@workspace/db";
import { ListRtisQueryParams } from "@workspace/api-zod";
import { eq, desc, and, SQL } from "drizzle-orm";

const router = Router();

router.get("/rtis", async (req, res) => {
  try {
    const query = ListRtisQueryParams.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (query.status) {
      conditions.push(eq(rtisTable.status, query.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rtis = await db
      .select()
      .from(rtisTable)
      .where(where)
      .orderBy(desc(rtisTable.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(rtisTable).where(where);

    res.json({
      rtis: rtis.map(formatRti),
      total: countResult.length,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing RTIs");
    res.status(500).json({ error: "Internal server error" });
  }
});

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

export default router;
