import { cn, getFraudScoreColor, getFraudTierColor } from "@/lib/utils";

export function FraudScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border font-bold text-[12px]", getFraudScoreColor(score), className)}>
      {score}
    </div>
  );
}

export function FraudTierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] font-semibold text-[11px] uppercase tracking-wider", getFraudTierColor(tier), className)}>
      {tier}
    </div>
  );
}
