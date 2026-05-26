import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tendersTable } from "./tenders";

export const officialsTable = pgTable("officials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  designation: text("designation"),
  department: text("department"),
  flaggedCount: integer("flagged_count").notNull().default(0),
  totalFlaggedValue: numeric("total_flagged_value", { precision: 15, scale: 2 }).notNull().default("0"),
  fingerprintFlag: boolean("fingerprint_flag").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenderOfficialLinksTable = pgTable("tender_official_links", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull().references(() => tendersTable.id),
  officialId: integer("official_id").notNull().references(() => officialsTable.id),
  role: text("role").notNull(), // 'approver' | 'evaluator' | 'signatory'
});

export const insertOfficialSchema = createInsertSchema(officialsTable).omit({ id: true, createdAt: true });
export type InsertOfficial = z.infer<typeof insertOfficialSchema>;
export type Official = typeof officialsTable.$inferSelect;

export const insertTenderOfficialLinkSchema = createInsertSchema(tenderOfficialLinksTable).omit({ id: true });
export type InsertTenderOfficialLink = z.infer<typeof insertTenderOfficialLinkSchema>;
export type TenderOfficialLink = typeof tenderOfficialLinksTable.$inferSelect;
