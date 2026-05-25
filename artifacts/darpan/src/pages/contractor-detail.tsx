import { useParams, Link } from "wouter";
import { useGetContractor, getGetContractorQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, AlertTriangle, ChevronRight, Shield, TrendingUp, Hash, Calendar } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

function RiskBar({ score }: { score: number }) {
  const color = score >= 85 ? "#ff385c" : score >= 70 ? "#f97316" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#f7f7f7] rounded-full h-2 border border-[#ebebeb] overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[14px] font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ContractorDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: contractor, isLoading } = useGetContractor(id, {
    query: { enabled: !!id, queryKey: getGetContractorQueryKey(id) },
  });

  if (isLoading) {
    return (
      <MainLayout title="Contractor Profile">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-[14px]" />
          <Skeleton className="h-64 w-full rounded-[14px]" />
        </div>
      </MainLayout>
    );
  }

  if (!contractor) {
    return (
      <MainLayout title="Contractor Profile">
        <div className="text-center py-20 text-[#aaaaaa]">Contractor not found.</div>
      </MainLayout>
    );
  }

  const tendersByValue = [...(contractor.tenders ?? [])].sort((a, b) => b.contractValue - a.contractValue).slice(0, 6);

  return (
    <MainLayout title="Contractor Profile" subtitle={contractor.cin}>
      <div className="space-y-6">

        <Link href="/contractors">
          <button className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors font-medium group -mb-2">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Watchlist
          </button>
        </Link>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[12px] bg-[#f7f7f7] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-[#aaaaaa]" />
              </div>
              <div className="space-y-2">
                <h1 className="text-[22px] font-bold text-[#222222] tracking-tight">{contractor.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[12px] font-mono text-[#6a6a6a] bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-1 rounded-[6px]">{contractor.cin}</span>
                  <span className="text-[12px] text-[#6a6a6a] bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-1 rounded-[6px]">{contractor.state}</span>
                  {contractor.registrationDate && (
                    <span className="text-[12px] text-[#6a6a6a] bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-1 rounded-[6px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Reg. {format(new Date(contractor.registrationDate), "dd MMM yyyy")}
                    </span>
                  )}
                </div>
                {contractor.primarySignals && contractor.primarySignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {contractor.primarySignals.map((sig) => (
                      <span key={sig} className="text-[11px] bg-[#ff385c]/8 text-[#ff385c] border border-[#ff385c]/15 px-2 py-0.5 rounded-[4px] font-semibold">
                        {sig}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#aaaaaa]" />
                <span className="text-[12px] text-[#aaaaaa] font-medium">Risk Score</span>
              </div>
              <RiskBar score={contractor.riskScore} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#f7f7f7]">
            {[
              { icon: AlertTriangle, label: "Flagged Tenders", value: contractor.flaggedTenders, accent: "text-[#ff385c]" },
              { icon: TrendingUp, label: "Total Fraud Value", value: formatIndianCurrency(contractor.totalValue), accent: "text-[#f97316]" },
              { icon: Hash, label: "Risk Score", value: contractor.riskScore, accent: "text-[#f97316]" },
              { icon: Building2, label: "State", value: contractor.state, accent: "text-[#6a6a6a]" },
            ].map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${accent}`} />
                  <span className="text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">{label}</span>
                </div>
                <p className={`text-[20px] font-bold ${accent} leading-none`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {contractor.linkedEntities && contractor.linkedEntities.length > 0 && (
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-[#222222] mb-3">Linked Entities</h3>
            <div className="flex flex-wrap gap-2">
              {contractor.linkedEntities.map((entity) => (
                <span key={entity} className="text-[13px] bg-[#f7f7f7] border border-[#ebebeb] text-[#3f3f3f] px-3 py-1.5 rounded-[8px]">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {contractor.directors && contractor.directors.length > 0 && (
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-[#222222] mb-3">Directors / Key Persons</h3>
            <div className="flex flex-wrap gap-2">
              {contractor.directors.map((d) => (
                <span key={d} className="text-[13px] bg-[#f7f7f7] border border-[#ebebeb] text-[#3f3f3f] px-3 py-1.5 rounded-[8px]">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {tendersByValue.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold text-[#222222] mb-4">Contract Value Distribution</h2>
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendersByValue.map(t => ({ name: t.tenderId, value: t.contractValue, score: t.fraudScore }))} margin={{ top: 4, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1e7).toFixed(0)}Cr`} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatIndianCurrency(v)} contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50} name="Contract Value">
                    {tendersByValue.map((t, i) => (
                      <Cell key={i} fill={t.fraudScore >= 85 ? "#ff385c" : t.fraudScore >= 70 ? "#f97316" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {contractor.tenders && contractor.tenders.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold text-[#222222] mb-4">Flagged Tenders ({contractor.tenders.length})</h2>
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
              {contractor.tenders.map((tender, i) => (
                <Link key={tender.id} href={`/tenders/${tender.id}`}>
                  <div className="flex items-start gap-4 px-5 py-4 border-b border-[#f7f7f7] last:border-0 hover:bg-[#fafafa] transition-colors cursor-pointer group">
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
                        {tender.department} · {tender.state} · <span className="font-medium text-[#3f3f3f]">{formatIndianCurrency(tender.contractValue)}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#dddddd] group-hover:text-[#ff385c] flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
