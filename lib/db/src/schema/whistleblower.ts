import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whistleblowerTipsTable = pgTable("whistleblower_tips", {
  id: serial("id").primaryKey(),
  passphrase: text("passphrase").notNull().unique(),
  content: text("content").notNull(),
  voiceUrl: text("voice_url"),
  relevanceScore: integer("relevance_score").notNull().default(0),
  crossRefTenderId: text("cross_ref_tender_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWhistleblowerTipSchema = createInsertSchema(whistleblowerTipsTable).omit({ id: true, createdAt: true });
export type InsertWhistleblowerTip = z.infer<typeof insertWhistleblowerTipSchema>;
export type WhistleblowerTip = typeof whistleblowerTipsTable.$inferSelect;
