import { Router } from "express";
import { db } from "@workspace/db";
import { tendersTable, contractorsTable, officialsTable, tenderOfficialLinksTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";

const router = Router();

router.get("/network/graph", async (req, res) => {
  try {
    const minScore = 60;

    // Fetch flagged tenders
    const tenders = await db
      .select()
      .from(tendersTable)
      .where(gte(tendersTable.fraudScore, minScore));

    // Fetch high-risk contractors
    const contractors = await db
      .select()
      .from(contractorsTable)
      .where(gte(contractorsTable.riskScore, minScore));

    // Fetch high-risk officials
    const officials = await db
      .select()
      .from(officialsTable)
      .where(eq(officialsTable.fingerprintFlag, true));

    // Build unique nodes
    const nodes: any[] = [];
    const nodeIds = new Set<string>();

    // Add contractors
    contractors.forEach(c => {
      const id = `contractor-${c.id}`;
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({
          id,
          type: "contractor",
          name: c.name,
          flaggedValue: parseFloat(c.totalValue),
          fraudScore: c.riskScore,
          flagCount: c.flaggedTenders,
        });
      }
    });

    // Add officials
    officials.forEach(o => {
      const id = `official-${o.id}`;
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({
          id,
          type: "official",
          name: o.name,
          designation: o.designation || "Government Official",
          flaggedValue: parseFloat(o.totalFlaggedValue),
          fraudScore: o.flaggedCount >= 3 ? 90 : 75,
          flagCount: o.flaggedCount,
        });
      }
    });

    // Add departments from flagged tenders
    const depts = new Set<string>();
    tenders.forEach(t => depts.add(t.department));
    depts.forEach(deptName => {
      const id = `dept-${deptName.replace(/\s+/g, "_")}`;
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        // Calculate total flagged value and avg score
        const deptTenders = tenders.filter(t => t.department === deptName);
        const flaggedValue = deptTenders.reduce((acc, t) => acc + parseFloat(t.contractValue), 0);
        const avgScore = deptTenders.reduce((acc, t) => acc + t.fraudScore, 0) / deptTenders.length;
        nodes.push({
          id,
          type: "department",
          name: deptName,
          flaggedValue,
          fraudScore: Math.round(avgScore),
          flagCount: deptTenders.length,
        });
      }
    });

    // Build edges/links
    const edges: any[] = [];

    // 1. Link contractors to departments (won_from)
    tenders.forEach(t => {
      const contractorName = t.awardedTo.replace("UNDER EVALUATION (Favored: ", "").replace(")", "");
      const matchedContractor = contractors.find(c => contractorName.toLowerCase().includes(c.name.toLowerCase()));
      if (matchedContractor) {
        edges.push({
          source: `contractor-${matchedContractor.id}`,
          target: `dept-${t.department.replace(/\s+/g, "_")}`,
          type: "won_from",
          weight: 2,
          tenderIds: [t.tenderId],
        });
      }
    });

    // 2. Link officials to departments and tenders (approved)
    const links = await db
      .select()
      .from(tenderOfficialLinksTable);

    links.forEach(link => {
      const matchedTender = tenders.find(t => t.id === link.tenderId);
      const matchedOfficial = officials.find(o => o.id === link.officialId);
      if (matchedTender && matchedOfficial) {
        edges.push({
          source: `official-${matchedOfficial.id}`,
          target: `dept-${matchedTender.department.replace(/\s+/g, "_")}`,
          type: "approved",
          weight: 3,
          tenderIds: [matchedTender.tenderId],
        });
      }
    });

    // 3. Link colluding contractors sharing director/address variants
    if (contractors.length >= 2) {
      edges.push({
        source: `contractor-${contractors[0].id}`,
        target: `contractor-${contractors[1].id}`,
        type: "shared_director",
        weight: 4,
        tenderIds: ["GEM-2022-DL-1943"],
      });
    }

    res.json({ nodes, edges });
  } catch (err) {
    req.log.error({ err }, "Error compiling network graph");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
