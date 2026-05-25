import { Router } from "express";
import { db } from "@workspace/db";
import { tendersTable, contractorsTable } from "@workspace/db";
import { ilike, or, desc } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const typeParam = typeof req.query.type === "string" ? req.query.type : "all";
    const type = ["all", "tenders", "contractors"].includes(typeParam) ? typeParam : "all";

    if (!q) {
      res.json({ results: [], total: 0, query: "" });
      return;
    }
    const results: Array<{
      type: "tender" | "contractor";
      id: number;
      title: string;
      subtitle: string;
      score: number;
      fraudTier?: string;
      href: string;
    }> = [];

    if (type === "all" || type === "tenders") {
      const tenders = await db
        .select({
          id: tendersTable.id,
          title: tendersTable.title,
          department: tendersTable.department,
          state: tendersTable.state,
          fraudScore: tendersTable.fraudScore,
          fraudTier: tendersTable.fraudTier,
          tenderId: tendersTable.tenderId,
          contractValue: tendersTable.contractValue,
        })
        .from(tendersTable)
        .where(
          or(
            ilike(tendersTable.title, `%${q}%`),
            ilike(tendersTable.tenderId, `%${q}%`),
            ilike(tendersTable.department, `%${q}%`),
            ilike(tendersTable.awardedTo, `%${q}%`)
          )
        )
        .orderBy(desc(tendersTable.fraudScore))
        .limit(8);

      for (const t of tenders) {
        results.push({
          type: "tender",
          id: t.id,
          title: t.title,
          subtitle: `${t.department} · ${t.state} · ${t.tenderId}`,
          score: t.fraudScore,
          fraudTier: t.fraudTier,
          href: `/tenders/${t.id}`,
        });
      }
    }

    if (type === "all" || type === "contractors") {
      const contractors = await db
        .select({
          id: contractorsTable.id,
          name: contractorsTable.name,
          cin: contractorsTable.cin,
          state: contractorsTable.state,
          riskScore: contractorsTable.riskScore,
          flaggedTenders: contractorsTable.flaggedTenders,
        })
        .from(contractorsTable)
        .where(
          or(
            ilike(contractorsTable.name, `%${q}%`),
            ilike(contractorsTable.cin, `%${q}%`)
          )
        )
        .orderBy(desc(contractorsTable.riskScore))
        .limit(5);

      for (const c of contractors) {
        results.push({
          type: "contractor",
          id: c.id,
          title: c.name,
          subtitle: `${c.cin} · ${c.state} · ${c.flaggedTenders} flagged tenders`,
          score: c.riskScore,
          href: `/contractors/${c.id}`,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    res.json({
      results,
      total: results.length,
      query: q,
    });
  } catch (err) {
    req.log.error({ err }, "Error performing global search");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
