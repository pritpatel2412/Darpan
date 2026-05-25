import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetStateHeatmap, useGetDepartmentLeaderboard, useGetRecentActivity, useListTenders } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { AlertCircle, FileText, IndianRupee, ShieldAlert, Activity, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";

function StatCard({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: any, loading: boolean }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#dddddd] p-5 shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#6a6a6a]">{title}</span>
        <Icon className="w-5 h-5 text-[#dddddd]" />
      </div>
      {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-[28px] font-bold text-[#222222] tracking-tight">{value}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: heatmap, isLoading: heatmapLoading } = useGetStateHeatmap();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetDepartmentLeaderboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: tendersData, isLoading: tendersLoading } = useListTenders({ limit: 5 });

  return (
    <MainLayout>
      <div className="space-y-10">
        
        <section>
          <h2 className="text-[22px] font-bold text-[#222222] mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <StatCard loading={statsLoading} title="Tenders Scanned" value={stats?.tendersScannedToday || 0} icon={FileText} />
            <StatCard loading={statsLoading} title="Flagged Today" value={stats?.flaggedToday || 0} icon={ShieldAlert} />
            <StatCard loading={statsLoading} title="Fraud Detected" value={stats ? formatIndianCurrency(stats.fraudValueDetected) : 0} icon={IndianRupee} />
            <StatCard loading={statsLoading} title="Critical Cases" value={stats?.criticalCases || 0} icon={AlertCircle} />
            <StatCard loading={statsLoading} title="RTIs Filed" value={stats?.rtisFiled || 0} icon={Activity} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-bold text-[#222222]">Live Fraud Feed</h2>
              <Link href="/tenders" className="text-[14px] font-medium text-[#ff385c] hover:underline flex items-center">View all <ChevronRight className="w-4 h-4" /></Link>
            </div>
            <div className="bg-white rounded-[14px] border border-[#dddddd] shadow-sm flex flex-col divide-y divide-[#ebebeb]">
              {tendersLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5"><Skeleton className="h-16 w-full" /></div>)
              ) : (
                tendersData?.tenders.map((tender, i) => (
                  <Link key={tender.id} href={`/tenders/${tender.id}`}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-5 hover:bg-[#f7f7f7]/50 transition-colors cursor-pointer group flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <FraudScoreBadge score={tender.fraudScore} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FraudTierBadge tier={tender.fraudTier} />
                          <span className="text-[12px] font-medium text-[#6a6a6a]">{tender.tenderId}</span>
                        </div>
                        <h3 className="text-[16px] font-semibold text-[#222222] truncate group-hover:text-[#ff385c] transition-colors">{tender.title}</h3>
                        <div className="text-[14px] text-[#6a6a6a] mt-1 flex gap-4">
                          <span>{tender.department} ({tender.state})</span>
                          <span className="font-medium text-[#222222]">{formatIndianCurrency(tender.contractValue)}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-[22px] font-bold text-[#222222]">Recent Activity</h2>
              <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 shadow-sm flex flex-col gap-4">
                {activityLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  activity?.slice(0, 5).map((item, i) => (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={item.id} className="flex gap-4 items-start border-b border-[#ebebeb] pb-4 last:border-0 last:pb-0">
                      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${item.type === 'detection' ? 'bg-[#ff385c]' : 'bg-[#f59e0b]'}`} />
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-medium text-[#222222] line-clamp-2">{item.message}</span>
                        <span className="text-[12px] text-[#6a6a6a]">{format(new Date(item.timestamp), "MMM d, HH:mm")}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-[22px] font-bold text-[#222222]">Department Risk</h2>
              <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 shadow-sm flex flex-col gap-4">
                {leaderboardLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : (
                  leaderboard?.slice(0, 5).map((dept, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-[#ebebeb] pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-[#222222] truncate max-w-[150px]">{dept.department}</span>
                        <span className="text-[12px] text-[#6a6a6a]">{dept.flaggedCount} flagged</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-bold text-[#222222]">{formatIndianCurrency(dept.fraudValue)}</span>
                        <span className="text-[12px] font-medium text-[#ff385c]">Avg: {dept.avgScore}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="pt-4 border-t border-[#ebebeb]">
          <h2 className="text-[22px] font-bold text-[#222222] mb-6">State Risk Heatmap</h2>
          <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 shadow-sm h-[400px]">
            {heatmapLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: '#6a6a6a', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6a6a6a', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f7f7f7' }} contentStyle={{ borderRadius: '8px', border: '1px solid #dddddd', boxShadow: 'rgba(0,0,0,0.1) 0 4px 8px' }} />
                  <Bar dataKey="flaggedCount" radius={[4, 4, 0, 0]}>
                    {heatmap?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.avgScore > 75 ? '#ff385c' : entry.avgScore > 50 ? '#f97316' : '#dddddd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
