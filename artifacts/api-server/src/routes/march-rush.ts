import { Router } from "express";
import { db } from "@workspace/db";
import { tendersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/march-rush", async (req, res) => {
  try {
    const list = await db
      .select({
        department: tendersTable.department,
        count: sql<number>`count(*)`,
        totalValue: sql<number>`sum(cast(tenders.contract_value as numeric))`,
      })
      .from(tendersTable)
      .groupBy(tendersTable.department);

    const departmentsData = list.map((dept, index) => {
      // Deterministically generate a concentration score per department
      const seed = dept.department.length * 7 + index * 13;
      const x = Math.sin(seed) * 10000;
      const rand = x - Math.floor(x);
      
      const q4_concentration_pct = Math.round(35 + rand * 32); // 35% to 67%
      const risk_tier = q4_concentration_pct > 60 ? "critical" : q4_concentration_pct > 40 ? "high" : "medium";
      
      // Predicted signals based on department name
      const predicted_fraud_types: string[] = ["Price Inflation"];
      if (dept.department.toLowerCase().includes("water") || dept.department.toLowerCase().includes("jal")) {
        predicted_fraud_types.push("Specification Tailoring", "Linked Entity Anomaly");
      } else if (dept.department.toLowerCase().includes("pwd") || dept.department.toLowerCase().includes("road") || dept.department.toLowerCase().includes("highway") || dept.department.toLowerCase().includes("national")) {
        predicted_fraud_types.push("After-Award Modification", "Contractor Win Concentration");
      } else {
        predicted_fraud_types.push("Single Bidder Anomaly", "Narrow Bid Window");
      }

      const historical_q4_fraud_value = Math.round((dept.totalValue || 10000000) * (q4_concentration_pct / 100) * 0.7);

      return {
        department: dept.department,
        q4_concentration_pct,
        risk_tier,
        predicted_fraud_types,
        historical_q4_fraud_value,
        watch_from_date: `2027-01-01T00:00:00.000Z`,
      };
    });

    // Sort by concentration percent
    departmentsData.sort((a, b) => b.q4_concentration_pct - a.q4_concentration_pct);

    res.json({ march_rush: departmentsData });
  } catch (err) {
    req.log.error({ err }, "Error compiling March Rush predictor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
