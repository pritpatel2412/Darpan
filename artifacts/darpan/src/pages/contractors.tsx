import { useListContractors, getListContractorsQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIndianCurrency } from "@/lib/utils";

export default function Contractors() {
  const { data, isLoading } = useListContractors({}, { query: { queryKey: getListContractorsQueryKey({}) } });

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#222222] tracking-tight">Contractor Watchlist</h1>
          <p className="text-[16px] text-[#6a6a6a] mt-1">High-risk entities flagged across multiple procurements.</p>
        </div>

        <div className="bg-white rounded-[14px] border border-[#dddddd] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f7] border-b border-[#dddddd]">
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Contractor Name</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">CIN / Registration</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Flagged Tenders</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Total Value</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#ebebeb]"><td colSpan={5} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : data?.contractors.map(c => (
                  <tr key={c.id} className="border-b border-[#ebebeb] hover:bg-[#f7f7f7]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#222222]">{c.name}</td>
                    <td className="py-4 px-6 text-[#6a6a6a] text-[14px]">{c.cin}</td>
                    <td className="py-4 px-6 font-medium text-[#ff385c]">{c.flaggedTenders}</td>
                    <td className="py-4 px-6 text-[#222222]">{formatIndianCurrency(c.totalValue)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-[#ebebeb] rounded-full h-2">
                          <div className="bg-[#ff385c] h-2 rounded-full" style={{ width: `${c.riskScore}%` }} />
                        </div>
                        <span className="text-[12px] font-bold">{c.riskScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
