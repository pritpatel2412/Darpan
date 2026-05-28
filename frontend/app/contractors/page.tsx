"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIndianCurrency } from "@/lib/utils";
import { Building2, AlertTriangle, ChevronRight, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { api, Contractor } from "@/lib/api";

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
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.listContractors()
      .then((data) => {
        setContractors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch contractor registry:", err);
        setLoading(false);
      });
  }, []);

  const filteredContractors = contractors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cin && c.cin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalWonValue = contractors.reduce((sum, c) => sum + Number(c.total_value_won || 0), 0);
  const watchlistCount = contractors.filter(c => c.watchlist).length;

  return (
    <MainLayout title="Contractor Registry" subtitle="Corporate entities monitored under vigilance protocols">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Entities on Watchlist", value: loading ? "—" : watchlistCount },
            { label: "Monitored Entities", value: loading ? "—" : contractors.length },
            { label: "Total Monitored Tender Value", value: loading ? "—" : formatIndianCurrency(totalWonValue) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
              <p className="text-[12px] text-[#aaaaaa] font-medium mb-1">{label}</p>
              <p className="text-[24px] font-bold text-[#222222]">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#aaaaaa]" />
              <h2 className="text-[14px] font-bold text-[#222222]">Contractors Registry</h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaaaaa]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by CIN or Name..."
                className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] pl-9 pr-4 py-1.5 text-[12.5px] text-[#222222] placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ff385c]"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f7f7f7] bg-[#fafafa] text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">
                  <th className="px-6 py-4 text-center w-16">#</th>
                  <th className="px-6 py-4 min-w-[250px]">Contractor Entity</th>
                  <th className="px-6 py-4 w-52">CIN / Registration</th>
                  <th className="px-6 py-4 w-32 text-center">Tenders Won</th>
                  <th className="px-6 py-4 w-44">Total Value Won</th>
                  <th className="px-6 py-4 w-40">Risk Index</th>
                  <th className="px-6 py-4 w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f7f7] text-[13px]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <Skeleton className="h-6 w-full rounded-[4px]" />
                      </td>
                    </tr>
                  ))
                ) : filteredContractors.length > 0 ? (
                  filteredContractors.map((c, i) => {
                    const riskScore = c.watchlist ? 92 : 30;
                    return (
                      <tr key={c.id} className="hover:bg-[#fafafa] transition-colors group">
                        <td className="px-6 py-4 text-center font-extrabold text-[#8a8a8a]">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-[#f7f7f7] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#aaaaaa]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#222222] truncate max-w-[220px]">{c.name}</p>
                              {c.watchlist && (
                                <p className="text-[11px] text-[#ff385c] font-medium truncate max-w-[220px] mt-0.5">
                                  {c.watchlist_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#6a6a6a]">
                          {c.cin || "UNREGISTERED"}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-[#222222]">
                          {c.total_won}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#222222]">
                          {formatIndianCurrency(c.total_value_won)}
                        </td>
                        <td className="px-6 py-4">
                          <RiskBar score={riskScore} />
                        </td>
                        <td className="px-6 py-4">
                          {c.watchlist ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-[5px]">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              WATCHLIST
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-[5px]">
                              MONITORED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#aaaaaa] italic">
                      No contractors matching query found.
                    </td>
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
