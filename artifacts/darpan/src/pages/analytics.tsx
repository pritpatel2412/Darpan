import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetStateHeatmap,
  useGetDepartmentLeaderboard,
  useListTenders,
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, AlertCircle, Target, Layers } from "lucide-react";

const SIGNAL_LABELS: Record<string, string> = {
  "Price Inflation": "S-01",
  "Specification Tailoring": "S-02",
  "Contractor Win Concentration": "S-03",
  "Single Bidder Anomaly": "S-04",
  "Narrow Bid Window": "S-05",
  "New Entity Anomaly": "S-06",
  "Bid Amount Clustering": "S-07",
};

const TIER_COLORS: Record<string, string> = {
  critical: "#ff385c",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#aaaaaa",
};

const MONTHLY_MOCK = [
  { month: "Jan", tenders: 820, fraud: 12 },
  { month: "Feb", tenders: 940, fraud: 18 },
  { month: "Mar", tenders: 1100, fraud: 24 },
  { month: "Apr", tenders: 980, fraud: 16 },
  { month: "May", tenders: 1240, fraud: 31 },
];

function SectionCard({ title, subtitle, children, loading }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f7f7f7]">
        <h3 className="text-[15px] font-bold text-[#222222]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#6a6a6a] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">
        {loading ? <Skeleton className="w-full h-48" /> : children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: heatmap, isLoading: heatmapLoading } = useGetStateHeatmap();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetDepartmentLeaderboard();
  const { data: tendersData, isLoading: tendersLoading } = useListTenders({ limit: 100 });

  const tierCounts = Array.isArray(tendersData?.tenders)
    ? tendersData.tenders.reduce<Record<string, number>>((acc, t) => {
        acc[t.fraudTier] = (acc[t.fraudTier] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  const tierPieData = Object.entries(tierCounts).map(([tier, count]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: count,
    fill: TIER_COLORS[tier] ?? "#aaaaaa",
  }));

  const signalCounts = Array.isArray(tendersData?.tenders)
    ? tendersData.tenders.reduce<Record<string, number>>((acc, t) => {
        if (t.primarySignal) acc[t.primarySignal] = (acc[t.primarySignal] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  const signalBarData = Object.entries(signalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([signal, count]) => ({ signal, count }));

  const leaderboardBarData = Array.isArray(leaderboard)
    ? leaderboard.slice(0, 6).map((d) => ({
        name: d.department.length > 18 ? d.department.slice(0, 18) + "…" : d.department,
        avgScore: d.avgScore,
        flaggedCount: d.flaggedCount,
      }))
    : [];

  const stateScoreData = Array.isArray(heatmap)
    ? heatmap.map((h) => ({
        state: h.state,
        avgScore: h.avgScore,
        flaggedCount: h.flaggedCount,
      }))
    : [];

  const radarData = [
    { subject: "Price Inflation", A: 88 },
    { subject: "Spec Tailoring", A: 72 },
    { subject: "Win Concentration", A: 65 },
    { subject: "Single Bidder", A: 80 },
    { subject: "Bid Window", A: 55 },
    { subject: "New Entity", A: 48 },
    { subject: "Bid Clustering", A: 40 },
  ];

  return (
    <MainLayout title="Analytics" subtitle="Fraud detection patterns, trends, and signal intelligence">
      <div className="space-y-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: TrendingUp,
              label: "Scan Coverage",
              value: statsLoading ? "—" : `${stats?.tendersScannedToday ?? 0} tenders`,
              sub: "This session",
              color: "bg-[#f7f7f7]",
              iconColor: "text-[#6a6a6a]",
            },
            {
              icon: AlertCircle,
              label: "Detection Rate",
              value: statsLoading ? "—" : `${((stats?.flaggedToday ?? 0) / Math.max(stats?.tendersScannedToday ?? 1, 1) * 100).toFixed(1)}%`,
              sub: "Of scanned tenders",
              color: "bg-[#ff385c]/10",
              iconColor: "text-[#ff385c]",
            },
            {
              icon: Target,
              label: "Avg Fraud Score",
              value: tendersLoading || !Array.isArray(tendersData?.tenders)
                ? "—"
                : tendersData.tenders.length
                ? `${(tendersData.tenders.reduce((s, t) => s + t.fraudScore, 0) / tendersData.tenders.length).toFixed(1)}`
                : "—",
              sub: "Across all flagged",
              color: "bg-[#f97316]/10",
              iconColor: "text-[#f97316]",
            },
            {
              icon: Layers,
              label: "Total Fraud Value",
              value: statsLoading ? "—" : stats ? formatIndianCurrency(stats.fraudValueDetected) : "—",
              sub: "Detected so far",
              color: "bg-[#ff385c]/10",
              iconColor: "text-[#ff385c]",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
              <div className={`w-8 h-8 rounded-[8px] ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <p className="text-[13px] text-[#6a6a6a] mb-1">{card.label}</p>
              <p className="text-[22px] font-bold text-[#222222] leading-none">{card.value}</p>
              <p className="text-[11px] text-[#aaaaaa] mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Monthly Scan vs Fraud Trend" subtitle="Tenders scanned vs fraudulent tenders detected">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_MOCK} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="tenders" stroke="#dddddd" strokeWidth={2} dot={false} name="Scanned" />
                  <Line type="monotone" dataKey="fraud" stroke="#ff385c" strokeWidth={2.5} dot={{ fill: "#ff385c", r: 3 }} name="Fraud Detected" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Fraud Tier Distribution" subtitle="Breakdown of all flagged tenders by severity" loading={tendersLoading}>
            <div className="h-[220px] flex items-center justify-center">
              {tierPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {tierPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[13px] text-[#aaaaaa]">No data</p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Primary Fraud Signals" subtitle="Most common fraud pattern detected per tender" loading={tendersLoading}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalBarData} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="signal"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#3f3f3f", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#ff385c" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Signal Prevalence Radar" subtitle="Relative strength of each fraud signal detected">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <PolarGrid gridType="polygon" stroke="#ebebeb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6a6a6a", fontSize: 10 }} />
                  <Radar name="Confidence" dataKey="A" stroke="#ff385c" fill="#ff385c" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Department Risk Leaderboard" subtitle="Average fraud score per department" loading={leaderboardLoading}>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardBarData} margin={{ top: 4, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6a6a6a", fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} maxBarSize={40} name="Avg Score">
                    {leaderboardBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.avgScore > 75 ? "#ff385c" : entry.avgScore > 55 ? "#f97316" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="State Fraud Scores" subtitle="Average fraud confidence score by state" loading={heatmapLoading}>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateScoreData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} maxBarSize={40} name="Avg Score">
                    {stateScoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.avgScore > 70 ? "#ff385c" : "#f97316"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

      </div>
    </MainLayout>
  );
}
