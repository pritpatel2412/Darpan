import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, ShieldAlert, Award, 
  Search, Info, AlertTriangle, ArrowUpDown, HelpCircle 
} from "lucide-react";
import { motion } from "framer-motion";

interface ScorecardItem {
  id: number;
  department: string;
  state: string;
  totalTenders: number;
  flaggedCount: number;
  avgScore: number;
  grade: string;
  status: string;
  singleBidderRate: number;
  priceInflationRate: number;
  winConcentration: number;
  q4Dumping: number;
  isDeteriorating: boolean;
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    B: { bg: "bg-teal-50 border-teal-100", text: "text-teal-700", border: "border-teal-200" },
    C: { bg: "bg-yellow-50 border-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    D: { bg: "bg-orange-50 border-orange-100", text: "text-orange-700", border: "border-orange-200" },
    F: { bg: "bg-rose-50 border-rose-100", text: "text-rose-700", border: "border-rose-200" },
  };

  const style = map[grade] ?? map["C"];

  return (
    <div className={`w-9 h-9 rounded-full ${style.bg} border ${style.border} flex items-center justify-center font-extrabold text-[14px] ${style.text} shadow-sm`}>
      {grade}
    </div>
  );
}

export default function Scorecard() {
  const { toast } = useToast();
  const [data, setData] = useState<ScorecardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortField, setSortField] = useState<"avgScore" | "singleBidderRate" | "priceInflationRate" | "winConcentration">("avgScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/dashboard/integrity-scorecard");
        if (!res.ok) throw new Error("Failed to load scorecard metrics.");
        const scorecardData = await res.json();
        setData(Array.isArray(scorecardData) ? scorecardData : []);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch department scorecard rankings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScorecard();
  }, []);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredData = Array.isArray(data)
    ? data
        .filter((item) => {
          const matchSearch = item.department.toLowerCase().includes(search.toLowerCase()) || item.state.toLowerCase().includes(search.toLowerCase());
          const matchState = stateFilter === "all" || item.state === stateFilter;
          return matchSearch && matchState;
        })
        .sort((a, b) => {
          let valA = a[sortField];
          let valB = b[sortField];
          return sortOrder === "asc" ? valA - valB : valB - valA;
        })
    : [];

  const preElectionStates = ["Uttar Pradesh", "Bihar", "Delhi"];

  const processedData = filteredData.map((item) => {
    if (preElectionStates.includes(item.state)) {
      const originalScore = item.avgScore;
      const boostedScore = Math.min(99, Math.round(originalScore * 1.3));
      
      let grade = item.grade;
      let status = item.status;
      if (boostedScore >= 85) { grade = "F"; status = "Critical Risk"; }
      else if (boostedScore >= 70) { grade = "D"; status = "High Risk"; }
      else if (boostedScore >= 55) { grade = "C"; status = "Watchlist"; }
      else if (boostedScore >= 40) { grade = "B"; status = "Fair"; }

      return {
        ...item,
        avgScore: boostedScore,
        grade,
        status,
        isPreElection: true,
        originalScore
      };
    }
    return {
      ...item,
      isPreElection: false,
      originalScore: item.avgScore
    };
  });

  return (
    <MainLayout 
      title="Integrity Scorecards" 
      subtitle="CVC-Standard monthly scoreboard grading public entity procurement risk"
    >
      <div className="flex flex-col gap-6">

        {/* Informative Header card */}
        <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#ff385c]" />
              National Procurement Integrity League Tables
            </h3>
            <p className="text-[12.5px] text-[#6a6a6a] leading-relaxed">
              Based on Central Vigilance Commission guidelines, departments are dynamically graded from <strong className="text-emerald-600 font-bold">A (Clean)</strong> to <strong className="text-rose-600 font-bold">F (Highly Rigged)</strong> based on live mathematical signals: single-bidder rates, price markup ratios, contractor concentration coefficients, and Q4 budget dumps.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#ff385c]/5 border border-[#ff385c]/10 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#ff385c]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff385c] animate-pulse" />
            May 2026 Audit Period
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-[14px] border border-[#ebebeb] shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
            <Input
              placeholder="Search departments or states…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#f7f7f7] border-[#ebebeb] rounded-[10px] focus:bg-white text-[13px]"
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[180px] rounded-[10px] border-[#ebebeb] text-[13px]">
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
        </div>

        {/* League Table Block */}
        <div className="bg-white border border-[#ebebeb] rounded-[14px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#ebebeb] bg-[#fafafa] font-bold text-[#6a6a6a] select-none">
                  <th className="py-4 px-5 text-center w-14">Grade</th>
                  <th className="py-4 px-4 min-w-[200px]">Department / Ministry</th>
                  <th className="py-4 px-4 w-28">State</th>
                  <th 
                    onClick={() => handleSort("avgScore")}
                    className="py-4 px-4 w-28 text-center cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg Risk
                      <ArrowUpDown className="w-3 h-3 text-[#aaaaaa]" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("singleBidderRate")}
                    className="py-4 px-4 w-36 text-center cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Single Bidder
                      <ArrowUpDown className="w-3 h-3 text-[#aaaaaa]" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("priceInflationRate")}
                    className="py-4 px-4 w-36 text-center cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg Markup
                      <ArrowUpDown className="w-3 h-3 text-[#aaaaaa]" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("winConcentration")}
                    className="py-4 px-4 w-36 text-center cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Win Concentration
                      <ArrowUpDown className="w-3 h-3 text-[#aaaaaa]" />
                    </div>
                  </th>
                  <th className="py-4 px-5 text-center w-24">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f7f7]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-4 px-5"><Skeleton className="h-9 w-9 rounded-full mx-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-44" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 mx-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 mx-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 mx-auto" /></td>
                      <td className="py-4 px-5"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    </tr>
                  ))
                ) : processedData.length > 0 ? (
                  processedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-5 text-center">
                        <GradeBadge grade={item.grade} />
                      </td>
                      <td className="py-3 px-4 font-bold text-[#222222]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.department}
                          {item.isPreElection && (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider animate-pulse inline-flex items-center gap-0.5">
                              ⚠️ MCC active (+30% risk multiplier)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#aaaaaa] font-medium mt-0.5">
                          {item.totalTenders} audited · {item.flaggedCount} high risk cases
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#6a6a6a]">{item.state}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`inline-block font-extrabold text-[14px] ${item.avgScore >= 70 ? "text-[#ff385c]" : item.avgScore >= 50 ? "text-[#f59e0b]" : "text-[#222222]"}`}>
                            {item.avgScore}
                          </span>
                          {item.isPreElection && (
                            <span className="text-[9.5px] font-bold text-[#aaaaaa] line-through leading-none">
                              {item.originalScore}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-[#3f3f3f]">{item.singleBidderRate}%</span>
                          <div className="w-20 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                            <div className="h-full bg-[#f59e0b]" style={{ width: `${item.singleBidderRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-[#3f3f3f]">{item.priceInflationRate > 0 ? `+${item.priceInflationRate}%` : "0%"}</span>
                          <div className="w-20 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                            <div className="h-full bg-[#ff385c]" style={{ width: `${Math.min(100, item.priceInflationRate)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#3f3f3f]">
                        {item.winConcentration}%
                      </td>
                      <td className="py-3 px-5 text-center">
                        {item.isDeteriorating ? (
                          <div className="flex items-center justify-center gap-1 text-rose-500 font-bold text-[11px]">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Deteriorating
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <TrendingDown className="w-3.5 h-3.5" />
                            Stable
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#aaaaaa]">
                      No department data matches the filter query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom risk warning */}
        {!loading && filteredData.some((item) => item.grade === "F") && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-[14px] text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-[12px] font-medium leading-relaxed">
              <strong>Caution Required</strong>: Multiple departments have been flagged with a Grade F rating. General Financial Rules (GFR) Rule 175 requires immediate review of tender bid windows and structural pricing catalogs to block cartel lock-ins.
            </span>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
