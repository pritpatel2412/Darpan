import { useListContractors, getListContractorsQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIndianCurrency } from "@/lib/utils";
import { Building2, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "wouter";

function RiskBar({ score }: { score: number }) {
  const color = score >= 85 ? "#ff385c" : score >= 70 ? "#f97316" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 bg-[#f7f7f7] rounded-full h-1.5 border border-[#ebebeb]">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[13px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Contractors() {
  const { data, isLoading } = useListContractors({}, { query: { queryKey: getListContractorsQueryKey({}) } });

  return (
    <MainLayout title="Contractor Watchlist" subtitle="High-risk entities repeatedly flagged across government procurements">
      <div className="space-y-6">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Entities on Watchlist", value: isLoading || !Array.isArray(data?.contractors) ? "—" : data.contractors.length },
            { label: "Critical Risk (≥85)", value: isLoading || !Array.isArray(data?.contractors) ? "—" : data.contractors.filter(c => c.riskScore >= 85).length },
            { label: "Total Fraud Exposure", value: isLoading || !Array.isArray(data?.contractors) ? "—" : formatIndianCurrency(data.contractors.reduce((s, c) => s + c.totalValue, 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
              <p className="text-[12px] text-[#aaaaaa] font-medium mb-1">{label}</p>
              <p className="text-[24px] font-bold text-[#222222]">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#aaaaaa]" />
            <h2 className="text-[14px] font-bold text-[#222222]">Entities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f7f7f7]">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">#</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Contractor</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">CIN / Registration</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Flagged</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Total Value</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Risk Score</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f7f7f7]">
                      <td colSpan={7} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))
                  : Array.isArray(data?.contractors) && data.contractors.map((c, i) => (
                    <tr key={c.id} className="border-b border-[#f7f7f7] hover:bg-[#fafafa] transition-colors group cursor-pointer">
                      <td className="px-6 py-4 text-[12px] text-[#aaaaaa] font-medium">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-[8px] bg-[#f7f7f7] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-[#aaaaaa]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#222222] group-hover:text-[#ff385c] transition-colors">{c.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#6a6a6a] font-mono">{c.cin}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#ff385c]" />
                          <span className="text-[14px] font-bold text-[#ff385c]">{c.flaggedTenders}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold text-[#222222]">{formatIndianCurrency(c.totalValue)}</td>
                      <td className="px-6 py-4"><RiskBar score={c.riskScore} /></td>
                      <td className="px-6 py-4">
                        <Link href={`/contractors/${c.id}`}>
                          <button className="flex items-center gap-1 text-[12px] text-[#aaaaaa] hover:text-[#ff385c] transition-colors opacity-0 group-hover:opacity-100">
                            Profile <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                }
                {!isLoading && (!Array.isArray(data?.contractors) || data.contractors.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#aaaaaa]">No contractors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
