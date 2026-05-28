import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIndianCurrency(value: number | string | null) {
  if (value === null || value === undefined) return "₹0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0.00";
  
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export function getFraudScoreColor(score: number) {
  if (score >= 85) return "text-[#ff385c] border-[#ff385c] bg-[#ff385c]/10";
  if (score >= 70) return "text-[#f97316] border-[#f97316] bg-[#f97316]/10";
  if (score >= 40) return "text-[#f59e0b] border-[#f59e0b] bg-[#f59e0b]/10";
  return "text-[#6a6a6a] border-[#dddddd] bg-[#f7f7f7]";
}

export function getFraudTierColor(tier: string) {
  const t = tier.toLowerCase();
  if (t === 'critical') return "bg-[#ff385c] text-white";
  if (t === 'high') return "bg-[#f97316] text-white";
  if (t === 'medium') return "bg-[#f59e0b] text-white";
  return "bg-[#6a6a6a] text-white";
}
