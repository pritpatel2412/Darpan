import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rtisTable = pgTable("rtis", {
  id: serial("id").primaryKey(),
  tenderId: text("tender_id").notNull(),
  tenderTitle: text("tender_title").notNull(),
  department: text("department").notNull(),
  pioName: text("pio_name"),
  pioAddress: text("pio_address"),
  status: text("status").notNull().default("drafted"),
  questions: jsonb("questions").$type<string[]>().notNull().default([]),
  legalBasis: text("legal_basis"),
  evidenceSummary: text("evidence_summary"),
  filingDate: timestamp("filing_date"),
  responseDeadline: timestamp("response_deadline"),
  confirmationNumber: text("confirmation_number"),
  tenderDbId: integer("tender_db_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRtiSchema = createInsertSchema(rtisTable).omit({ id: true, createdAt: true });
export type InsertRti = z.infer<typeof insertRtiSchema>;
export type Rti = typeof rtisTable.$inferSelect;
