import { useListTenders, getListTendersQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronRight, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function exportToCSV(tenders: any[]) {
  const headers = ["Tender ID", "Title", "Department", "State", "Contract Value", "Fraud Score", "Fraud Tier", "Primary Signal", "Published At", "Bid Window (days)", "Awarded To"];
  const rows = tenders.map((t) => [
    t.tenderId,
    `"${(t.title ?? "").replace(/"/g, '""')}"`,
    `"${(t.department ?? "").replace(/"/g, '""')}"`,
    t.state ?? "",
    t.contractValue ?? 0,
    t.fraudScore ?? 0,
    t.fraudTier ?? "",
    `"${(t.primarySignal ?? "").replace(/"/g, '""')}"`,
    t.publishedAt ? format(new Date(t.publishedAt), "dd/MM/yyyy") : "",
    t.bidWindowDays ?? "",
    `"${(t.awardedTo ?? "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `darpan_tenders_${format(new Date(), "yyyyMMdd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

export default function Tenders() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");
  const [statusFilter, setStatusFilter] = useState<"all" | "pre-award" | "awarded">("all");
  const [activeTab, setActiveTab] = useState<"all" | "recycled">("all");
  const [recycledData, setRecycledData] = useState<any[]>([]);
  const [isRecycledLoading, setIsRecycledLoading] = useState(false);
  const { toast } = useToast();

  const queryParams = {
    search: search || undefined,
    state: stateFilter !== "all" ? stateFilter : undefined,
    minScore: minScore ? Number(minScore) : undefined,
  };

  const { data, isLoading } = useListTenders(queryParams, { query: { queryKey: getListTendersQueryKey(queryParams) } });

  const filteredTenders: any[] = (data?.tenders as any[])?.filter((tender: any) => {
    if (statusFilter === "pre-award") return tender.isPreAward;
    if (statusFilter === "awarded") return !tender.isPreAward;
    return true;
  }) ?? [];

  const handleExport = () => {
    if (!filteredTenders.length) return;
    exportToCSV(filteredTenders);
    toast({ title: "Exported", description: `${filteredTenders.length} tenders exported to CSV.` });
  };

  const fetchRecycled = async () => {
    setIsRecycledLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/tenders/copy-detector");
      const resData = await res.json();
      setRecycledData(resData.matches || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to fetch recycled specifications list.", variant: "destructive" });
    } finally {
      setIsRecycledLoading(false);
    }
  };

  return (
    <MainLayout title="Tenders Feed" subtitle="Live feed of scanned government procurement contracts">
      <div className="flex flex-col gap-6">

        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-[#ebebeb] pb-1">
          <button 
            onClick={() => setActiveTab("all")} 
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-all ${activeTab === "all" ? "border-[#ff385c] text-[#ff385c]" : "border-transparent text-[#6a6a6a] hover:text-[#222222]"}`}
          >
            All Scanned Tenders
          </button>
          <button 
            onClick={() => { setActiveTab("recycled"); fetchRecycled(); }} 
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "recycled" ? "border-[#ff385c] text-[#ff385c]" : "border-transparent text-[#6a6a6a] hover:text-[#222222]"}`}
          >
            Recycled Specs Index
            <span className="bg-[#ff385c]/10 text-[#ff385c] text-[10px] px-1.5 py-0.5 rounded-full font-bold">New</span>
          </button>
        </div>

        {activeTab === "all" ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-[14px] border border-[#ebebeb] shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
                <Input
                  placeholder="Search by ID, department, or keyword…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#f7f7f7] border-[#ebebeb] rounded-[10px] focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#6a6a6a] font-medium">
                <SlidersHorizontal className="w-4 h-4 text-[#aaaaaa]" />
              </div>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-[160px] rounded-[10px] border-[#ebebeb] text-[13px]">
                  <SelectValue placeholder="All Tenders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenders</SelectItem>
                  <SelectItem value="pre-award">Pre-Award Alerts</SelectItem>
                  <SelectItem value="awarded">Awarded Contracts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[160px] rounded-[10px] border-[#ebebeb] text-[13px]">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Karnataka">Karnataka</SelectItem>
                  <SelectItem value="Gujarat">Gujarat</SelectItem>
                  <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                  <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                  <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                </SelectContent>
              </Select>
              <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger className="w-[160px] rounded-[10px] border-[#ebebeb] text-[13px]">
                  <SelectValue placeholder="Any Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Score</SelectItem>
                  <SelectItem value="40">Score 40+</SelectItem>
                  <SelectItem value="70">Score 70+ (High)</SelectItem>
                  <SelectItem value="85">Score 85+ (Critical)</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={handleExport}
                disabled={!filteredTenders.length}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#ebebeb] bg-white text-[13px] font-medium text-[#6a6a6a] hover:border-[#ff385c] hover:text-[#ff385c] disabled:opacity-40 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {!isLoading && (
              <p className="text-[13px] text-[#aaaaaa] font-medium -mb-2">
                {filteredTenders.length} tender{filteredTenders.length !== 1 ? "s" : ""} found
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-[14px]" />)
                : filteredTenders.map((tender) => (
                  <Link key={tender.id} href={`/tenders/${tender.id}`}>
                    <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm hover:shadow-md hover:border-[#dddddd] transition-all p-5 flex flex-col h-full cursor-pointer group">
                      <div className="flex justify-between items-center mb-3">
                        {tender.isPreAward ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-[6px] text-rose-600 text-[10px] font-bold">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                            </span>
                            <span>PRE-AWARD ALERT</span>
                          </div>
                        ) : (
                          <FraudTierBadge tier={tender.fraudTier} />
                        )}
                        <FraudScoreBadge score={tender.fraudScore} />
                      </div>

                      <h3 className="text-[14px] font-semibold text-[#222222] line-clamp-2 mb-1 group-hover:text-[#ff385c] transition-colors leading-snug">
                        {tender.title}
                      </h3>
                      {(tender.evidencePackage as any)?.verificationStatus === "verified" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-[4px] mb-2">✓ Verified — Public Records</span>
                      ) : (tender.evidencePackage as any)?.verificationStatus === "illustrative" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-[4px] mb-2">⚠ Illustrative</span>
                      ) : null}

                      <div className="flex flex-col gap-1.5 text-[12px] mt-auto">
                        <div className="flex justify-between">
                          <span className="text-[#aaaaaa]">Department</span>
                          <span className="font-medium text-[#3f3f3f] truncate max-w-[130px] text-right" title={tender.department}>
                            {tender.department}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#aaaaaa]">Value</span>
                          <span className="font-semibold text-[#222222]">{formatIndianCurrency(tender.contractValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#aaaaaa]">{tender.isPreAward ? "Time Remaining" : "Published"}</span>
                          <span className={tender.isPreAward ? "text-rose-600 font-bold" : "text-[#3f3f3f]"}>
                            {tender.isPreAward ? getCountdownText(tender.closingAt) : format(new Date(tender.publishedAt), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#aaaaaa]">{tender.isPreAward ? "Favored Contractor" : "Awarded To"}</span>
                          <span className="text-[#3f3f3f] truncate max-w-[120px] text-right">
                            {tender.isPreAward 
                              ? tender.awardedTo.replace("UNDER EVALUATION (Favored: ", "").replace(")", "") 
                              : tender.awardedTo}
                          </span>
                        </div>
                      </div>

                      {tender.primarySignal && (
                        <div className="mt-3 pt-3 border-t border-[#f7f7f7] flex items-center justify-between">
                          <span className="inline-block bg-[#ff385c]/8 text-[#ff385c] text-[11px] px-2 py-0.5 rounded-[5px] font-semibold">
                            {tender.primarySignal}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#dddddd] group-hover:text-[#ff385c] transition-colors" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              }
              {filteredTenders.length === 0 && !isLoading && (
                <div className="col-span-full py-16 text-center">
                  <p className="text-[#aaaaaa] text-[14px]">No tenders match the current filters.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-5 bg-white border border-[#ebebeb] rounded-[14px] shadow-sm">
              <h3 className="text-[16px] font-bold text-[#222222] mb-1">Recycled Specifications Index (S-09)</h3>
              <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                Uses advanced text similarity matching to discover copied or cloned technical specification blocks across multiple tenders. Specification recycling is a high-confidence indicator of single-contractor tailoring.
              </p>
            </div>

            <div className="space-y-4">
              {isRecycledLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[14px]" />)
              ) : recycledData.length > 0 ? (
                recycledData.map((match) => (
                  <div key={match.id} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 hover:border-[#ff385c]/30 transition-all space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#ff385c]/10 text-[#ff385c] text-[11px] px-2.5 py-1 rounded-[6px] font-bold">
                          {match.similarity}% Similarity Match
                        </span>
                        {match.tender1.awardedTo === match.tender2.awardedTo && (
                          <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[11px] px-2.5 py-1 rounded-[6px] font-bold">
                            Same Awarded Contractor Warning
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-mono text-[#aaaaaa]">Signal ID: S-09</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Tender 1 */}
                      <Link href={`/tenders/${match.tender1.id}`} className="cursor-pointer group">
                        <div className="p-4 bg-[#f9f9f9] border border-[#f0f0f0] rounded-[10px] group-hover:border-[#dddddd] transition-all space-y-2 h-full">
                          <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-wider">Tender A ({match.tender1.tenderId})</p>
                          <h4 className="text-[13px] font-bold text-[#222222] group-hover:text-[#ff385c] transition-all line-clamp-2">{match.tender1.title}</h4>
                          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] pt-1 text-[#6a6a6a]">
                            <div>State: <span className="font-semibold text-[#222222]">{match.tender1.state}</span></div>
                            <div>Dept: <span className="font-semibold text-[#222222] truncate inline-block max-w-[100px] align-bottom">{match.tender1.department}</span></div>
                            <div className="col-span-2">Winner: <span className="font-semibold text-[#222222]">{match.tender1.awardedTo}</span></div>
                          </div>
                        </div>
                      </Link>

                      {/* Tender 2 */}
                      <Link href={`/tenders/${match.tender2.id}`} className="cursor-pointer group">
                        <div className="p-4 bg-[#f9f9f9] border border-[#f0f0f0] rounded-[10px] group-hover:border-[#dddddd] transition-all space-y-2 h-full">
                          <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-wider">Tender B ({match.tender2.tenderId})</p>
                          <h4 className="text-[13px] font-bold text-[#222222] group-hover:text-[#ff385c] transition-all line-clamp-2">{match.tender2.title}</h4>
                          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] pt-1 text-[#6a6a6a]">
                            <div>State: <span className="font-semibold text-[#222222]">{match.tender2.state}</span></div>
                            <div>Dept: <span className="font-semibold text-[#222222] truncate inline-block max-w-[100px] align-bottom">{match.tender2.department}</span></div>
                            <div className="col-span-2">Winner: <span className="font-semibold text-[#222222]">{match.tender2.awardedTo}</span></div>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {Array.isArray(match.sharedKeywords) && match.sharedKeywords.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6a6a6a]">
                        <span className="font-bold mr-1">Overlapping Spec Keywords:</span>
                        {match.sharedKeywords.map((kw: string) => (
                          <span key={kw} className="bg-[#ebebeb] px-2 py-0.5 rounded-[4px] font-mono text-[#3f3f3f]">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-[#aaaaaa] text-[14px]">No recycled spec clusters detected yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
