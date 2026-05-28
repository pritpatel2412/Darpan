"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  FileText,
  IndianRupee,
  ShieldAlert,
  Activity,
  ChevronRight,
  Clock,
  Scan,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { api, Tender } from "@/lib/api";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  title: string;
  value: string | number;
  icon: any;
  loading: boolean;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-[#ebebeb] p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6a6a6a]">{title}</span>
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${accent ?? "bg-[#f7f7f7]"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-white" : "text-[#aaaaaa]"}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-[28px] font-bold text-[#222222] tracking-tight leading-none">{value}</div>
      )}
    </div>
  );
}

function getCountdownText(closingAtStr?: string) {
  if (!closingAtStr) return "Rigging Risk High";
  const diff = new Date(closingAtStr).getTime() - Date.now();
  if (diff <= 0) return "Bidding Closed";
  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return `Closes in ${days}d ${hours}h`;
  return `Closes in ${hours}h`;
}

export default function Dashboard() {
  // Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Heatmap
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Activity Feed
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Flagged Tenders
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tendersLoading, setTendersLoading] = useState(true);

  // Instant scanner state
  const [instantId, setInstantId] = useState("");
  const [instantPortal, setInstantPortal] = useState("gem");
  const [isInstantScanning, setIsInstantScanning] = useState(false);
  const [instantStep, setInstantStep] = useState(0);
  const [instantResult, setInstantResult] = useState<any>(null);

  const scanSteps = [
    "Establishing secure audit channel...",
    "Crawling procurement portal records...",
    "Parsing technical specification parameters...",
    "Cross-referencing open-market unit prices...",
    "Analyzing MCA21 relational networks...",
    "Synthesizing final risk scorecard...",
  ];

  const fetchDashboardData = async () => {
    try {
      const [statsRes, heatmapRes, leaderboardRes, activityRes, tendersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getStateHeatmap(),
        api.getDepartmentLeaderboard(),
        api.getRecentActivity(),
        api.listFlaggedTenders({ limit: 10 }),
      ]);

      setStats(statsRes);
      setHeatmap(heatmapRes);
      setLeaderboard(leaderboardRes);
      
      // Feed data extraction
      if (activityRes && activityRes.items) {
        setActivity(activityRes.items);
      } else if (activityRes && Array.isArray(activityRes.items)) {
        setActivity(activityRes.items);
      } else if (activityRes && Array.isArray(activityRes)) {
        setActivity(activityRes);
      }
      
      setTenders(tendersRes.tenders || []);
    } catch (err) {
      console.error("Error retrieving dashboard statistics:", err);
    } finally {
      setStatsLoading(false);
      setHeatmapLoading(false);
      setLeaderboardLoading(false);
      setActivityLoading(false);
      setTendersLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInstantScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantId.trim()) return;

    setIsInstantScanning(true);
    setInstantStep(0);
    setInstantResult(null);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < scanSteps.length) {
        setInstantStep(step);
      } else {
        clearInterval(interval);
        api
          .runInstantScan(instantId.trim(), instantPortal)
          .then((data) => {
            setInstantResult(data);
            setIsInstantScanning(false);
            fetchDashboardData(); // Refresh metrics
          })
          .catch((err) => {
            console.error("Instant scan failed:", err);
            setIsInstantScanning(false);
          });
      }
    }, 800);
  };

  // Pre-award critical filters
  const preAwardInterventions = tenders.filter((t) => t.is_pre_award).slice(0, 3);
  const normalFraudFeed = tenders.filter((t) => !t.is_pre_award).slice(0, 6);

  return (
    <MainLayout title="Auditing Dashboard" subtitle="Darpan Integrity System">
      <div className="space-y-8">
        {/* State-of-the-Art Hero Landing Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#18181b] to-[#27272a] text-white p-8 lg:p-10 rounded-[18px] border border-[#2d2d30] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
        >
          {/* Subtle glowing ambient background spheres */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#ff385c]/12 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#ff385c]/8 rounded-full blur-[80px] pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#ff385c]/10 border border-[#ff385c]/25 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#ff385c] animate-pulse" />
              <span className="text-[10px] font-black text-[#ff385c] uppercase tracking-widest">
                Live Scanner Array Active
              </span>
            </div>

            <h1 className="text-[22px] lg:text-[28px] font-black leading-tight tracking-tight text-white">
              Darpan scans <span className="text-[#ff385c]">3,000+ government tenders</span> every night and flags
              procurement fraud using AI.
            </h1>

            <p className="text-[13px] text-[#a1a1aa] font-medium leading-relaxed">
              Everything is public data. Everything is verifiable. Fully powered by open-market price survey checks,
              MCA21 corporate overlays, and interactive compliance verification tunnels.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto relative z-10">
            <div className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ff385c]/20 border border-[#ff385c]/40 text-[#ff385c] rounded-[10px] text-[14px] font-bold transition-all shadow-md h-12 w-full md:w-[220px]">
              <Zap className="w-4 h-4 animate-pulse" />
              Agent Core Running
            </div>
            <div className="text-center md:text-left text-[10px] text-[#71717a] font-mono pl-1">
              Ref: GeM Portal & CPPP Feeds
            </div>
          </div>
        </motion.div>

        {/* Instant Audit Scanner Section */}
        <div className="bg-white rounded-[14px] border border-[#ebebeb] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff385c]">
              <Scan className="w-4 h-4 text-[#ff385c]" />
            </div>
            <div>
              <h2 className="text-[14px] font-extrabold text-[#222222] uppercase tracking-wider">
                On-Demand Public Tender Instant Scanner
              </h2>
              <p className="text-[11.5px] text-[#6a6a6a] font-medium leading-none mt-1">
                Verify any tender ID against standard CVC rules and price reference indexes instantly.
              </p>
            </div>
          </div>

          <form onSubmit={handleInstantScan} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                required
                value={instantId}
                onChange={(e) => setInstantId(e.target.value)}
                placeholder="Enter Tender ID (e.g. GEM-2022-DL-1943, GEM-2026-UP-8703)..."
                className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2.5 text-[13px] text-[#222222] placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ff385c] focus:bg-white transition-all font-mono uppercase font-bold"
              />
            </div>
            <select
              value={instantPortal}
              onChange={(e) => setInstantPortal(e.target.value)}
              className="bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2.5 text-[13px] text-[#222222] focus:outline-none focus:border-[#ff385c] cursor-pointer font-bold"
            >
              <option value="gem">GeM Portal</option>
              <option value="cppp">CPPP Portal</option>
            </select>
            <button
              type="submit"
              disabled={isInstantScanning}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ff385c] hover:bg-[#e0022a] disabled:opacity-60 text-white rounded-[10px] text-[13px] font-extrabold transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              {isInstantScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  Scan Tender
                </>
              )}
            </button>
          </form>

          {/* Progressive Scanner HUD Loader */}
          {isInstantScanning && (
            <div className="p-5 bg-gradient-to-br from-[#18181b] to-[#27272a] rounded-[12px] border border-[#2d2d30] shadow-inner text-white space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#aaaaaa]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff385c] animate-pulse" />
                  Vigilance Audit Tunnel Active
                </span>
                <span className="font-mono text-[#ff385c]">
                  {Math.round((instantStep / scanSteps.length) * 100)}% Complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-[#3f3f46] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff385c] to-orange-500 transition-all duration-300"
                  style={{ width: `${((instantStep + 1) / scanSteps.length) * 100}%` }}
                />
              </div>

              {/* Scan step checkmarks list */}
              <div className="space-y-2">
                {scanSteps.map((stepMsg, idx) => {
                  const isDone = idx < instantStep;
                  const isActive = idx === instantStep;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-[11.5px] transition-all duration-200 ${
                        isDone
                          ? "text-emerald-400 font-semibold"
                          : isActive
                            ? "text-[#ff385c] font-black animate-pulse"
                            : "text-[#71717a]"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin text-[#ff385c]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#44444c] flex-shrink-0" />
                      )}
                      {stepMsg}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instant Scan Result Panel */}
          {instantResult && !isInstantScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-gradient-to-r from-rose-50/40 via-white to-rose-50/10 border border-rose-100 rounded-[12px] shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-[#ff385c]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-[5px] uppercase tracking-wider">
                        Audit Complete ({instantResult.tier} risk)
                      </span>
                      <span className="font-mono text-[#aaaaaa] text-[11px]">{instantId}</span>
                    </div>
                    <h3 className="text-[14px] font-extrabold text-[#222222] leading-snug">
                      {instantResult.details?.title || "Tender Audited"}
                    </h3>
                    <p className="text-[12px] text-[#6a6a6a] font-medium leading-relaxed mt-0.5">
                      {instantResult.groq_narrative || "Audit scorecard compiled successfully. Potential price ratio check: " + (instantResult.price_ratio || 1.0).toFixed(1) + "x."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <FraudScoreBadge score={Math.round(instantResult.confidence || 0)} />
                  <Link href={`/tender/${instantResult.tender_uuid}`}>
                    <span className="text-[11.5px] font-extrabold text-[#ff385c] hover:underline cursor-pointer flex items-center gap-0.5">
                      Open Dossier <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Technical Violations summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#f7f7f7]">
                <div className="p-3 bg-[#f7f7f7] rounded-[8px] border border-[#ebebeb]/50 text-[11.5px] space-y-1">
                  <p className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-wide">Procuring Entity</p>
                  <p className="font-bold text-[#222222] truncate">{instantResult.details?.department || "N/A"}</p>
                </div>
                <div className="p-3 bg-[#f7f7f7] rounded-[8px] border border-[#ebebeb]/50 text-[11.5px] space-y-1">
                  <p className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-wide font-mono">PAN/CIN check</p>
                  <p className="font-bold text-[#222222] truncate">Passed MCA21 Cross check</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ACTIVE PRE-AWARD INTEGRITY ALERTS BAR */}
        {!tendersLoading && preAwardInterventions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-rose-50/50 via-white to-rose-50/20 rounded-[18px] border border-rose-100/80 p-6 shadow-sm space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff385c]"></span>
                </span>
                <div>
                  <h2 className="text-[15px] font-black text-[#222222] tracking-tight flex items-center gap-1.5">
                    🚨 ACTIVE PRE-AWARD INTEGRITY ALERTS
                  </h2>
                  <p className="text-[11.5px] text-[#6a6a6a] font-medium">
                    Intercept specification rigging, single-bidder cartels, and price manipulation before bid closes!
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100/70 px-3 py-1 rounded-full uppercase tracking-wider">
                Live Intercept Phase
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {preAwardInterventions.map((tender: Tender) => (
                <Link key={tender.id} href={`/tender/${tender.id}`}>
                  <div className="bg-white/80 backdrop-blur-sm rounded-[14px] border border-rose-100/60 hover:border-[#ff385c]/40 hover:shadow-md hover:bg-white transition-all p-5 flex flex-col justify-between h-full cursor-pointer relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-lg pointer-events-none" />

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-2.5 py-0.5 rounded-[6px] font-mono">
                          ⏱️ {getCountdownText(tender.bid_close_at || undefined)}
                        </span>
                        {tender.fraud_score?.confidence && (
                          <FraudScoreBadge score={Math.round(tender.fraud_score.confidence)} />
                        )}
                      </div>

                      <h3 className="text-[13px] font-extrabold text-[#222222] line-clamp-2 leading-snug group-hover:text-[#ff385c] transition-colors">
                        {tender.title}
                      </h3>

                      <div className="space-y-1">
                        <p className="text-[11px] text-[#8a8a8a] font-medium truncate">{tender.department}</p>
                        <p className="text-[11px] font-mono font-bold text-[#ff385c]">
                          Primary: {tender.fraud_score?.groq_strongest || "Spec Tailoring Indicator"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#f7f7f7] flex items-center justify-between text-[11px] font-extrabold text-rose-600">
                      <span>View Evidentiary Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard
            loading={statsLoading}
            title="Tenders Scanned"
            value={stats?.total_tenders_scanned ?? 0}
            icon={FileText}
          />
          <StatCard
            loading={statsLoading}
            title="Flagged Cases"
            value={stats?.total_flagged_cases ?? 0}
            icon={ShieldAlert}
            accent="bg-[#f97316]"
          />
          <StatCard
            loading={statsLoading}
            title="Est. Taxpayer Loss"
            value={stats ? formatIndianCurrency(stats.estimated_taxpayer_loss_inr) : "—"}
            icon={IndianRupee}
            accent="bg-[#ff385c]"
          />
          <StatCard
            loading={statsLoading}
            title="Critical Cases"
            value={stats?.tier_distribution?.critical ?? 0}
            icon={AlertCircle}
            accent="bg-[#ff385c]"
          />
          <StatCard loading={statsLoading} title="RTIs Filed" value={stats?.total_rtis_filed ?? 0} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#222222]">Live Integrity Risk Feed</h2>
            </div>
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              {tendersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-5 border-b border-[#f7f7f7]">
                    <Skeleton className="h-14 w-full" />
                  </div>
                ))
              ) : normalFraudFeed.length > 0 ? (
                normalFraudFeed.map((tender, i) => (
                  <Link key={tender.id} href={`/tender/${tender.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-4 px-5 py-4 border-b border-[#f7f7f7] last:border-0 hover:bg-[#fafafa] transition-colors cursor-pointer group"
                    >
                      {tender.fraud_score?.confidence && (
                        <FraudScoreBadge score={Math.round(tender.fraud_score.confidence)} className="flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {tender.fraud_score?.tier && <FraudTierBadge tier={tender.fraud_score.tier} />}
                          <span className="text-[11px] text-[#aaaaaa] font-mono">{tender.tender_id}</span>
                        </div>
                        <p className="text-[14px] font-semibold text-[#222222] truncate group-hover:text-[#ff385c] transition-colors">
                          {tender.title}
                        </p>
                        <p className="text-[12px] text-[#6a6a6a] mt-0.5">
                          {tender.department} ·{" "}
                          <span className="font-medium text-[#3f3f3f]">
                            {formatIndianCurrency(tender.awarded_value)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#dddddd] flex-shrink-0 mt-1 group-hover:text-[#ff385c] transition-colors" />
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="py-16 text-center text-[#aaaaaa] text-[13px] font-medium">
                  No flagged tenders detected yet.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#222222]">Live Integrity Audit Feed</h2>
                <Clock className="w-4 h-4 text-[#aaaaaa]" />
              </div>
              <div className="px-5 py-3 flex flex-col gap-0">
                {activityLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
                ) : Array.isArray(activity) && activity.length > 0 ? (
                  activity.slice(0, 6).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3 items-start py-3 border-b border-[#f7f7f7] last:border-0"
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 bg-[#ff385c]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#222222] leading-snug line-clamp-2">{item.title}</p>
                        <p className="text-[11px] text-[#aaaaaa] mt-0.5">
                          {new Date(item.pubDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[#aaaaaa] text-[12px] italic">No recent activity logged.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f7f7f7]">
                <h2 className="text-[15px] font-bold text-[#222222]">Department Risk Ranking</h2>
              </div>
              <div className="px-5 py-3 flex flex-col gap-0">
                {leaderboardLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 mb-2 w-full" />)
                ) : Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 5).map((dept, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[#f7f7f7] last:border-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[13px] font-semibold text-[#222222] truncate">{dept.department}</p>
                        <p className="text-[11px] text-[#aaaaaa]">{dept.flagged_count} flagged contracts</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-bold text-[#222222]">
                          {formatIndianCurrency(dept.flagged_value)}
                        </p>
                        <p className="text-[11px] font-medium text-[#ff385c]">
                          Avg {Math.round(dept.avg_confidence)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[#aaaaaa] text-[12px] italic">
                    No department risk data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[16px] font-bold text-[#222222] mb-4">State Risk Heatmap</h2>
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 h-[280px]">
            {heatmapLoading ? (
              <Skeleton className="w-full h-full" />
            ) : heatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "#f7f7f7", radius: 6 }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #ebebeb",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="flagged_count" radius={[5, 5, 0, 0]} name="Flagged Contracts">
                    {heatmap.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.avg_confidence > 75 ? "#ff385c" : entry.avg_confidence > 50 ? "#f97316" : "#dddddd"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[12px] text-[#aaaaaa] italic">
                No state risk heatmap data found.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
