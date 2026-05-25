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

export default function Tenders() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");

  const queryParams = {
    search: search || undefined,
    state: stateFilter !== "all" ? stateFilter : undefined,
    minScore: minScore ? Number(minScore) : undefined
  };

  const { data, isLoading } = useListTenders(queryParams, { query: { queryKey: getListTendersQueryKey(queryParams) } });

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#222222] tracking-tight">Tenders Feed</h1>
            <p className="text-[16px] text-[#6a6a6a] mt-1">Live feed of scanned procurement contracts.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-[#f7f7f7] p-4 rounded-[14px] border border-[#ebebeb]">
          <Input 
            placeholder="Search by ID, department, or keyword..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border-[#dddddd] rounded-full md:max-w-xs"
          />
          
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[180px] bg-white rounded-full">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="Maharashtra">Maharashtra</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Karnataka">Karnataka</SelectItem>
              <SelectItem value="Gujarat">Gujarat</SelectItem>
            </SelectContent>
          </Select>

          <Select value={minScore} onValueChange={setMinScore}>
            <SelectTrigger className="w-[180px] bg-white rounded-full">
              <SelectValue placeholder="Min Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Score</SelectItem>
              <SelectItem value="40">Score 40+</SelectItem>
              <SelectItem value="70">Score 70+</SelectItem>
              <SelectItem value="85">Score 85+ (Critical)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[14px]" />)
          ) : data?.tenders.map((tender) => (
            <Link key={tender.id} href={`/tenders/${tender.id}`}>
              <div className="bg-white rounded-[14px] border border-[#dddddd] shadow-sm hover:shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_4px_12px] transition-shadow p-5 flex flex-col h-full cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <FraudTierBadge tier={tender.fraudTier} />
                  <FraudScoreBadge score={tender.fraudScore} className="text-[14px] px-3 py-1" />
                </div>
                
                <h3 className="text-[16px] font-semibold text-[#222222] line-clamp-2 mb-2 group-hover:text-[#ff385c] transition-colors">{tender.title}</h3>
                
                <div className="flex flex-col gap-1.5 mt-auto text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Department:</span>
                    <span className="font-medium text-[#222222] truncate max-w-[120px]" title={tender.department}>{tender.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Value:</span>
                    <span className="font-medium text-[#222222]">{formatIndianCurrency(tender.contractValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Published:</span>
                    <span className="font-medium text-[#222222]">{format(new Date(tender.publishedAt), "dd MMM yyyy")}</span>
                  </div>
                </div>

                {tender.primarySignal && (
                  <div className="mt-4 pt-4 border-t border-[#ebebeb]">
                    <span className="inline-block bg-[#ff385c]/10 text-[#ff385c] text-[12px] px-2.5 py-1 rounded-md font-semibold">
                      {tender.primarySignal}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
          {data?.tenders.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#6a6a6a]">No tenders found matching filters.</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
