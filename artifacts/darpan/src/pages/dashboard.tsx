import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetStateHeatmap, useGetDepartmentLeaderboard, useGetRecentActivity, useListTenders } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { AlertCircle, FileText, IndianRupee, ShieldAlert, Activity, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";

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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: heatmap, isLoading: heatmapLoading } = useGetStateHeatmap();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetDepartmentLeaderboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: tendersData, isLoading: tendersLoading } = useListTenders({ limit: 6 });

  return (
    <MainLayout title="Dashboard" subtitle="Live intelligence overview for government procurement fraud">
      <div className="space-y-8">

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
                : tendersData?.tenders.map((tender, i) => (
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
                  : activity?.slice(0, 6).map((item, i) => (
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
                  : leaderboard?.slice(0, 5).map((dept, i) => (
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
                  <BarChart data={heatmap} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "#f7f7f7", radius: 6 }}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 13 }}
                    />
                    <Bar dataKey="flaggedCount" radius={[5, 5, 0, 0]} name="Flagged">
                      {heatmap?.map((entry, idx) => (
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
