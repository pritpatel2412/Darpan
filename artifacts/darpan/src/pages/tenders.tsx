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
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.department.replace(/"/g, '""')}"`,
    t.state,
    t.contractValue,
    t.fraudScore,
    t.fraudTier,
    `"${(t.primarySignal ?? "").replace(/"/g, '""')}"`,
    format(new Date(t.publishedAt), "dd/MM/yyyy"),
    t.bidWindowDays,
    `"${t.awardedTo.replace(/"/g, '""')}"`,
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

export default function Tenders() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");
  const { toast } = useToast();

  const queryParams = {
    search: search || undefined,
    state: stateFilter !== "all" ? stateFilter : undefined,
    minScore: minScore ? Number(minScore) : undefined,
  };

  const { data, isLoading } = useListTenders(queryParams, { query: { queryKey: getListTendersQueryKey(queryParams) } });

  const handleExport = () => {
    if (!data?.tenders.length) return;
    exportToCSV(data.tenders);
    toast({ title: "Exported", description: `${data.tenders.length} tenders exported to CSV.` });
  };

  return (
    <MainLayout title="Tenders Feed" subtitle="Live feed of scanned government procurement contracts">
      <div className="flex flex-col gap-6">

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
            disabled={!data?.tenders.length}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#ebebeb] bg-white text-[13px] font-medium text-[#6a6a6a] hover:border-[#ff385c] hover:text-[#ff385c] disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {!isLoading && data && (
          <p className="text-[13px] text-[#aaaaaa] font-medium -mb-2">
            {data.tenders.length} tender{data.tenders.length !== 1 ? "s" : ""} found
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-[14px]" />)
            : data?.tenders.map((tender) => (
              <Link key={tender.id} href={`/tenders/${tender.id}`}>
                <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm hover:shadow-md hover:border-[#dddddd] transition-all p-5 flex flex-col h-full cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <FraudTierBadge tier={tender.fraudTier} />
                    <FraudScoreBadge score={tender.fraudScore} />
                  </div>

                  <h3 className="text-[14px] font-semibold text-[#222222] line-clamp-2 mb-3 group-hover:text-[#ff385c] transition-colors leading-snug">
                    {tender.title}
                  </h3>

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
                      <span className="text-[#aaaaaa]">Published</span>
                      <span className="text-[#3f3f3f]">{format(new Date(tender.publishedAt), "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaaaaa]">State</span>
                      <span className="text-[#3f3f3f]">{tender.state}</span>
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
          {data?.tenders.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <p className="text-[#aaaaaa] text-[14px]">No tenders match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
