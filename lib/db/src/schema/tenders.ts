import { pgTable, serial, text, numeric, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tendersTable = pgTable("tenders", {
  id: serial("id").primaryKey(),
  tenderId: text("tender_id").notNull().unique(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  state: text("state").notNull(),
  source: text("source").notNull().default("GeM"),
  contractValue: numeric("contract_value", { precision: 15, scale: 2 }).notNull(),
  awardedValue: numeric("awarded_value", { precision: 15, scale: 2 }),
  fraudScore: real("fraud_score").notNull().default(0),
  fraudTier: text("fraud_tier").notNull().default("low"),
  fraudSignals: jsonb("fraud_signals").$type<string[]>().notNull().default([]),
  primarySignal: text("primary_signal"),
  awardedTo: text("awarded_to").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  bidWindowDays: integer("bid_window_days").notNull().default(0),
  numberOfBidders: integer("number_of_bidders").notNull().default(1),
  allBidders: jsonb("all_bidders").$type<string[]>().notNull().default([]),
  priceRatio: real("price_ratio"),
  eligibilityCriteria: text("eligibility_criteria"),
  technicalSpecs: text("technical_specs"),
  evidencePackage: jsonb("evidence_package"),
  rtiStatus: text("rti_status"),
  isPreAward: boolean("is_pre_award").default(false).notNull(),
  closingAt: timestamp("closing_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenderSchema = createInsertSchema(tendersTable).omit({ id: true, createdAt: true });
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type Tender = typeof tendersTable.$inferSelect;
