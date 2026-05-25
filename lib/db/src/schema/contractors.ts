import { pgTable, serial, text, numeric, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractorsTable = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cin: text("cin").notNull().unique(),
  state: text("state").notNull(),
  registrationDate: timestamp("registration_date"),
  flaggedTenders: integer("flagged_tenders").notNull().default(0),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).notNull().default("0"),
  riskScore: real("risk_score").notNull().default(0),
  primarySignals: jsonb("primary_signals").$type<string[]>().notNull().default([]),
  linkedEntities: jsonb("linked_entities").$type<string[]>().notNull().default([]),
  directors: jsonb("directors").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractorSchema = createInsertSchema(contractorsTable).omit({ id: true, createdAt: true });
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type Contractor = typeof contractorsTable.$inferSelect;
