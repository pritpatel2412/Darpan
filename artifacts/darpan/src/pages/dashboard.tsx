import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetStateHeatmap, useGetDepartmentLeaderboard, useGetRecentActivity, useListTenders, useTriggerScan } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, FileText, IndianRupee, ShieldAlert, Activity, ChevronRight, Clock, Scan, Loader2, CheckCircle2, Check, Shield } from "lucide-react";
import { format } from "date-fns";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function StatCard({ title, value, icon: Icon, loading, accent }: {
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
      {loading
        ? <Skeleton className="h-8 w-24" />
        : <div className="text-[28px] font-bold text-[#222222] tracking-tight leading-none">{value}</div>
      }
    </div>
  );
}

function ScanResultBanner({ result, onDismiss }: { result: any; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#222222]">
              Scan complete — {result.scannedCount.toLocaleString()} tenders scanned in {(result.scanDurationMs / 1000).toFixed(1)}s
            </p>
            <p className="text-[13px] text-[#6a6a6a] mt-1">
              <span className="font-semibold text-[#ff385c]">{result.flaggedCount} new flagged</span>
              {result.criticalFound > 0 && (
                <span className="ml-2 font-semibold text-[#ff385c]">· {result.criticalFound} critical</span>
              )}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-[12px] text-[#aaaaaa] hover:text-[#ff385c] font-medium">Dismiss</button>
      </div>
      {result.newTenders?.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.newTenders.slice(0, 3).map((t: any) => (
            <div key={t.tenderId} className="flex items-center gap-3 px-3 py-2 bg-[#f7f7f7] rounded-[8px]">
              <FraudTierBadge tier={t.fraudTier} />
              <span className="text-[13px] font-medium text-[#222222] flex-1 truncate">{t.title}</span>
              <span className="text-[13px] font-bold text-[#ff385c]">{t.fraudScore}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function getCountdownText(closingAtStr?: string) {
  if (!closingAtStr) return "";
  const diff = new Date(closingAtStr).getTime() - Date.now();
  if (diff <= 0) return "Bidding Closed";
  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return `Closes in ${days}d ${hours}h`;
  return `Closes in ${hours}h`;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<any>(null);
  const triggerScan = useTriggerScan();

  const [instantId, setInstantId] = useState("");
  const [instantPortal, setInstantPortal] = useState("GeM");
  const [isInstantScanning, setIsInstantScanning] = useState(false);
  const [instantStep, setInstantStep] = useState(0);
  const [instantResult, setInstantResult] = useState<any>(null);

  const scanSteps = [
    "Establishing CVC Integrity secure tunnel...",
    "Crawling public procurement portals for tender data...",
    "Extracting technical specifications & bidding terms...",
    "Auditing unit prices against live open-market catalogs...",
    "Performing MCA21 relational checks for shell overrides...",
    "Generating audit narrative & recommended vigilance actions..."
  ];

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
        fetch("/api/scan/instant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenderId: instantId, portal: instantPortal }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `HTTP error ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.error) {
              throw new Error(data.error);
            }
            setInstantResult(data.tender);
            setIsInstantScanning(false);
            queryClient.invalidateQueries();
            toast({
              title: "Scan Successful",
              description: `Tender ${data.tender.tenderId} audited successfully!`,
            });
          })
          .catch((err) => {
            console.error("Instant scan failed:", err);
            setIsInstantScanning(false);
            toast({
              title: "Scan Failed",
              description: err.message || "Tender could not be verified on public portal registries.",
              variant: "destructive",
            });
          });
      }
    }, 600);
  };

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: heatmap, isLoading: heatmapLoading } = useGetStateHeatmap();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetDepartmentLeaderboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: tendersData, isLoading: tendersLoading } = useListTenders({ limit: 12 });

  const handleScan = () => {
    triggerScan.mutate({ count: 3 } as any, {
      onSuccess: (data) => {
        setScanResult(data);
        queryClient.invalidateQueries();
      },
    });
  };

  const preAwardInterventions = Array.isArray(tendersData?.tenders)
    ? (tendersData.tenders as any[]).filter((t: any) => t.isPreAward).slice(0, 3)
    : [];
  const normalFraudFeed = Array.isArray(tendersData?.tenders)
    ? (tendersData.tenders as any[]).filter((t: any) => !t.isPreAward).slice(0, 6)
    : [];

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
              <span className="text-[10px] font-black text-[#ff385c] uppercase tracking-widest">Live Scanner Array Active</span>
            </div>

            <h1 className="text-[22px] lg:text-[28px] font-black leading-tight tracking-tight text-white">
              Darpan scans <span className="text-[#ff385c]">3,000+ government tenders</span> every night and flags procurement fraud using AI.
            </h1>

            <p className="text-[13px] text-[#a1a1aa] font-medium leading-relaxed">
              Everything is public data. Everything is verifiable. Fully powered by open-market price survey checks, MCA21 corporate overlays, and interactive compliance verification tunnels.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto relative z-10">
            <button
              onClick={handleScan}
              disabled={triggerScan.isPending}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ff385c] hover:bg-[#e0022a] disabled:opacity-60 text-white rounded-[10px] text-[14px] font-bold transition-all shadow-md h-12 w-full md:w-[220px] cursor-pointer"
            >
              {triggerScan.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Audits…
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 animate-pulse" />
                  Trigger Scanner Array
                </>
              )}
            </button>
            <div className="text-center md:text-left text-[10px] text-[#71717a] font-mono pl-1">
              Ref: GeM Portal & CPPP Feeds
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {scanResult && (
            <ScanResultBanner result={scanResult} onDismiss={() => setScanResult(null)} />
          )}
        </AnimatePresence>

        {/* Instant Audit Scanner Section */}
        <div className="bg-white rounded-[14px] border border-[#ebebeb] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff385c]">
              <Scan className="w-4 h-4 text-[#ff385c]" />
            </div>
            <div>
              <h2 className="text-[14px] font-extrabold text-[#222222] uppercase tracking-wider animate-pulse">
                On-Demand Public Tender Instant Scanner
              </h2>
              <p className="text-[11.5px] text-[#6a6a6a] font-medium leading-none mt-1">Verify any tender ID against standard CVC rules and price reference indexes instantly.</p>
            </div>
          </div>

          <form onSubmit={handleInstantScan} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                required
                value={instantId}
                onChange={(e) => setInstantId(e.target.value)}
                placeholder="Enter Tender ID (e.g. GEM-2026-UP-8703, CPPP-2026-DL-4122)..."
                className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2.5 text-[13px] text-[#222222] placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ff385c] focus:bg-white transition-all font-mono uppercase font-bold"
              />
            </div>
            <select
              value={instantPortal}
              onChange={(e) => setInstantPortal(e.target.value)}
              className="bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2.5 text-[13px] text-[#222222] focus:outline-none focus:border-[#ff385c] cursor-pointer font-bold"
            >
              <option value="GeM">GeM Portal</option>
              <option value="CPPP">CPPP Portal</option>
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
                <span className="font-mono text-[#ff385c]">{Math.round((instantStep / scanSteps.length) * 100)}% Complete</span>
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
                        isDone ? "text-emerald-400 font-semibold" : isActive ? "text-[#ff385c] font-black animate-pulse" : "text-[#71717a]"
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
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-[#ff385c]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-[5px] uppercase tracking-wider animate-pulse">
                        Audit Flagged ({instantResult.fraudTier} risk)
                      </span>
                      <span className="font-mono text-[#aaaaaa] text-[11px]">{instantResult.tenderId}</span>
                    </div>
                    <h3 className="text-[14px] font-extrabold text-[#222222] leading-snug">
                      {instantResult.title}
                    </h3>
                    <p className="text-[12px] text-[#6a6a6a] font-medium leading-relaxed mt-0.5">
                      {instantResult.evidencePackage?.executiveSummary}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <FraudScoreBadge score={instantResult.fraudScore} />
                  <Link href={`/tenders/${instantResult.id}`}>
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
                  <p className="font-bold text-[#222222] truncate">{instantResult.department}</p>
                </div>
                <div className="p-3 bg-[#f7f7f7] rounded-[8px] border border-[#ebebeb]/50 text-[11.5px] space-y-1">
                  <p className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-wide">Awarded Contractor</p>
                  <p className="font-bold text-[#222222] truncate">{instantResult.awardedTo}</p>
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
                  <p className="text-[11.5px] text-[#6a6a6a] font-medium">Intercept specification rigging, single-bidder cartels, and price manipulation before bid closes!</p>
                </div>
              </div>
              <span className="self-start sm:self-center text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100/70 px-3 py-1 rounded-full uppercase tracking-wider">
                Live Intercept Phase
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {preAwardInterventions.map((tender: any) => (
                <Link key={tender.id} href={`/tenders/${tender.id}`}>
                  <div className="bg-white/80 backdrop-blur-sm rounded-[14px] border border-rose-100/60 hover:border-[#ff385c]/40 hover:shadow-md hover:bg-white transition-all p-5 flex flex-col justify-between h-full cursor-pointer relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-lg pointer-events-none" />
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-2.5 py-0.5 rounded-[6px] font-mono animate-pulse">
                          ⏱️ {getCountdownText(tender.closingAt)}
                        </span>
                        <FraudScoreBadge score={tender.fraudScore} />
                      </div>
                      
                      <h3 className="text-[13px] font-extrabold text-[#222222] line-clamp-2 leading-snug group-hover:text-[#ff385c] transition-colors">
                        {tender.title}
                      </h3>
                      
                      <div className="space-y-1">
                        <p className="text-[11px] text-[#8a8a8a] font-medium truncate">{tender.department}</p>
                        <p className="text-[11px] font-mono font-bold text-[#ff385c]">
                          Primary: {tender.primarySignal}
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
          <StatCard loading={statsLoading} title="Tenders Scanned" value={stats?.tendersScannedToday ?? 0} icon={FileText} />
          <StatCard loading={statsLoading} title="Flagged Today" value={stats?.flaggedToday ?? 0} icon={ShieldAlert} accent="bg-[#f97316]" />
          <StatCard loading={statsLoading} title="Fraud Detected" value={stats ? formatIndianCurrency(stats.fraudValueDetected) : "—"} icon={IndianRupee} accent="bg-[#ff385c]" />
          <StatCard loading={statsLoading} title="Critical Cases" value={stats?.criticalCases ?? 0} icon={AlertCircle} accent="bg-[#ff385c]" />
          <StatCard loading={statsLoading} title="RTIs Filed" value={stats?.rtisFiled ?? 0} icon={Activity} />
        </div>



        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#222222]">Live Fraud Feed</h2>
              <Link href="/tenders" className="text-[13px] font-semibold text-[#ff385c] hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              {tendersLoading
                ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 border-b border-[#f7f7f7]"><Skeleton className="h-14 w-full" /></div>)
                : normalFraudFeed.length > 0 ? (
                  normalFraudFeed.map((tender, i) => (
                    <Link key={tender.id} href={`/tenders/${tender.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-4 px-5 py-4 border-b border-[#f7f7f7] last:border-0 hover:bg-[#fafafa] transition-colors cursor-pointer group"
                      >
                        <FraudScoreBadge score={tender.fraudScore} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <FraudTierBadge tier={tender.fraudTier} />
                            <span className="text-[11px] text-[#aaaaaa] font-mono">{tender.tenderId}</span>
                          </div>
                          <p className="text-[14px] font-semibold text-[#222222] truncate group-hover:text-[#ff385c] transition-colors">
                            {tender.title}
                          </p>
                          <p className="text-[12px] text-[#6a6a6a] mt-0.5">
                            {tender.department} · <span className="font-medium text-[#3f3f3f]">{formatIndianCurrency(tender.contractValue)}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#dddddd] flex-shrink-0 mt-1 group-hover:text-[#ff385c] transition-colors" />
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <div className="py-16 text-center text-[#aaaaaa] text-[13px] font-medium">
                    No flagged tenders detected yet. Click <strong className="text-[#ff385c]">Run New Scan</strong> above to trigger autonomous scanning!
                  </div>
                )
              }
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#222222]">Recent Activity</h2>
                <Clock className="w-4 h-4 text-[#aaaaaa]" />
              </div>
              <div className="px-5 py-3 flex flex-col gap-0">
                {activityLoading
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
                  : Array.isArray(activity) && activity.length > 0 ? (
                    activity.slice(0, 6).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex gap-3 items-start py-3 border-b border-[#f7f7f7] last:border-0"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${item.type === "detection" ? "bg-[#ff385c]" : "bg-[#f59e0b]"}`} />
                        <div>
                          <p className="text-[13px] text-[#222222] leading-snug line-clamp-2">{item.message}</p>
                          <p className="text-[11px] text-[#aaaaaa] mt-0.5">{format(new Date(item.timestamp), "MMM d, HH:mm")}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[#aaaaaa] text-[12px] italic">No recent activity logged.</div>
                  )
                }
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f7f7f7]">
                <h2 className="text-[15px] font-bold text-[#222222]">Department Risk</h2>
              </div>
              <div className="px-5 py-3 flex flex-col gap-0">
                {leaderboardLoading
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 mb-2 w-full" />)
                  : Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                    leaderboard.slice(0, 5).map((dept, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-[#f7f7f7] last:border-0">
                        <div>
                          <p className="text-[13px] font-semibold text-[#222222] truncate max-w-[130px]">{dept.department}</p>
                          <p className="text-[11px] text-[#aaaaaa]">{dept.flaggedCount} flagged</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-[#222222]">{formatIndianCurrency(dept.fraudValue)}</p>
                          <p className="text-[11px] font-medium text-[#ff385c]">Avg {dept.avgScore}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[#aaaaaa] text-[12px] italic">No department risk data available.</div>
                  )
                }
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[16px] font-bold text-[#222222] mb-4">State Risk Heatmap</h2>
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 h-[280px]">
            {heatmapLoading
              ? <Skeleton className="w-full h-full" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Array.isArray(heatmap) ? heatmap : []} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "#f7f7f7", radius: 6 }}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 13 }}
                    />
                    <Bar dataKey="flaggedCount" radius={[5, 5, 0, 0]} name="Flagged">
                      {Array.isArray(heatmap) && heatmap.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.avgScore > 75 ? "#ff385c" : entry.avgScore > 50 ? "#f97316" : "#dddddd"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
