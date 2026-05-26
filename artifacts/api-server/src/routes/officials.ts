import { Router } from "express";
import { db } from "@workspace/db";
import { officialsTable, tenderOfficialLinksTable, tendersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/officials", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(officialsTable)
      .orderBy(desc(officialsTable.flaggedCount));
    res.json({ officials: list });
  } catch (err) {
    req.log.error({ err }, "Error fetching officials");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/officials/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [official] = await db
      .select()
      .from(officialsTable)
      .where(eq(officialsTable.id, id))
      .limit(1);

    if (!official) {
      res.status(404).json({ error: "Official not found" });
      return;
    }

    // Get linked tenders
    const links = await db
      .select({
        role: tenderOfficialLinksTable.role,
        tender: tendersTable,
      })
      .from(tenderOfficialLinksTable)
      .innerJoin(tendersTable, eq(tenderOfficialLinksTable.tenderId, tendersTable.id))
      .where(eq(tenderOfficialLinksTable.officialId, id));

    res.json({
      official,
      tenders: links.map(l => ({
        id: l.tender.id,
        tenderId: l.tender.tenderId,
        title: l.tender.title,
        department: l.tender.department,
        state: l.tender.state,
        fraudScore: l.tender.fraudScore,
        fraudTier: l.tender.fraudTier,
        contractValue: parseFloat(l.tender.contractValue),
        awardedTo: l.tender.awardedTo,
        rtiStatus: l.tender.rtiStatus,
        role: l.role,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching official detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
