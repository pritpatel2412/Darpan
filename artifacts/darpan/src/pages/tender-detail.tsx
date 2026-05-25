import { useParams, Link } from "wouter";
import { useGetTender, getGetTenderQueryKey, useGenerateRti } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { ArrowLeft, FileText, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default function TenderDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: tender, isLoading } = useGetTender(id, { query: { enabled: !!id, queryKey: getGetTenderQueryKey(id) } });
  const generateRti = useGenerateRti();
  const { toast } = useToast();

  const handleGenerateRti = () => {
    generateRti.mutate({ id }, {
      onSuccess: () => toast({ title: "RTI Generated", description: "The RTI application has been drafted successfully." }),
      onError: () => toast({ title: "Error", description: "Failed to generate RTI application.", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Tender Detail">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-[14px]" />
          <Skeleton className="h-96 w-full rounded-[14px]" />
        </div>
      </MainLayout>
    );
  }

  if (!tender) {
    return (
      <MainLayout title="Tender Detail">
        <div className="text-center py-20 text-[#aaaaaa]">Tender not found.</div>
      </MainLayout>
    );
  }

  const priceData = [
    { name: "Awarded", value: tender.evidencePackage.priceComparison.awardedPrice, fill: "#ff385c" },
    { name: "Market", value: tender.evidencePackage.priceComparison.marketPrice, fill: "#dddddd" },
  ];

  return (
    <MainLayout title="Tender Detail" subtitle={tender.tenderId}>
      <div className="space-y-6">

        <Link href="/tenders">
          <button className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors font-medium group -mb-2">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Tenders
          </button>
        </Link>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <FraudTierBadge tier={tender.fraudTier} />
              <span className="text-[12px] font-mono text-[#aaaaaa] bg-[#f7f7f7] px-2 py-0.5 rounded-[5px]">{tender.tenderId}</span>
            </div>
            <h1 className="text-[22px] lg:text-[26px] font-bold text-[#222222] tracking-tight leading-snug">{tender.title}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] pt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Department</span>
                <span className="font-semibold text-[#222222]">{tender.department}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">State</span>
                <span className="font-semibold text-[#222222]">{tender.state}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Contract Value</span>
                <span className="font-bold text-[#222222] text-[16px]">{formatIndianCurrency(tender.contractValue)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px] bg-[#f7f7f7] rounded-[12px] border border-[#ebebeb] p-5">
            <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-3">Fraud Score</span>
            <FraudScoreBadge score={tender.fraudScore} className="text-3xl px-5 py-2 border-2" />
            <span className="text-[11px] text-[#aaaaaa] mt-2">Confidence</span>
          </div>
        </div>

        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="bg-[#f7f7f7] border border-[#ebebeb] p-1 rounded-[12px] inline-flex gap-0.5 overflow-x-auto max-w-full mb-6 h-auto">
            {[
              { value: "evidence", label: "Evidence" },
              { value: "signals", label: "Signals" },
              { value: "contractor", label: "Contractor" },
              { value: "price comparison", label: "Price Comparison" },
              { value: "rti application", label: "RTI Application" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="capitalize rounded-[8px] px-4 py-2 text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-sm text-[#6a6a6a] transition-all whitespace-nowrap"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="evidence" className="space-y-4">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#ff385c]" />
                <h3 className="text-[16px] font-bold text-[#222222]">Executive Summary</h3>
              </div>
              <p className="text-[15px] text-[#3f3f3f] leading-relaxed">{tender.evidencePackage.executiveSummary}</p>
              {tender.evidencePackage.recommendedAction && (
                <div className="mt-6 p-4 bg-[#ff385c]/5 border border-[#ff385c]/15 rounded-[10px] flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#ff385c] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#ff385c] uppercase tracking-wide mb-1">Recommended Action</p>
                    <p className="text-[14px] text-[#222222] font-medium">{tender.evidencePackage.recommendedAction}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-3">
            {tender.evidencePackage.signalBreakdown.map((signal) => (
              <div key={signal.signalId} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5 hover:border-[#ff385c]/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#aaaaaa] bg-[#f7f7f7] px-2 py-0.5 rounded-[4px] font-mono">{signal.signalId}</span>
                    <h4 className="text-[15px] font-bold text-[#222222]">{signal.name}</h4>
                  </div>
                  <span className="text-[12px] font-bold text-[#ff385c] bg-[#ff385c]/10 px-2.5 py-1 rounded-[6px] flex-shrink-0">{signal.confidence}%</span>
                </div>
                <div className="w-full bg-[#f7f7f7] rounded-full h-1.5 mb-3">
                  <div
                    className="h-1.5 rounded-full bg-[#ff385c]"
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
                <p className="text-[13px] text-[#6a6a6a] leading-relaxed">{signal.evidence}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contractor">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <h3 className="text-[16px] font-bold text-[#222222] mb-6">Contractor Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                {[
                  { label: "Name", value: tender.evidencePackage.contractorProfile.name },
                  { label: "CIN / Registration", value: tender.evidencePackage.contractorProfile.cin },
                  { label: "Total Tenders Won", value: String(tender.evidencePackage.contractorProfile.totalTendersWon) },
                  { label: "Total Value Awarded", value: formatIndianCurrency(tender.evidencePackage.contractorProfile.totalValue) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">{label}</span>
                    <span className="text-[16px] font-semibold text-[#222222]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price comparison">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-[#ff385c]" />
                <h3 className="text-[16px] font-bold text-[#222222]">Price Anomaly Analysis</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7f7f7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#3f3f3f", fontWeight: 600, fontSize: 13 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatIndianCurrency(v)} cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {priceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-60 flex flex-col gap-5">
                  <div className="p-5 bg-[#ff385c]/5 border border-[#ff385c]/15 rounded-[12px]">
                    <p className="text-[10px] font-bold text-[#ff385c] uppercase tracking-widest mb-1">Price Inflation</p>
                    <p className="text-[36px] font-bold text-[#222222] leading-none">{tender.evidencePackage.priceComparison.ratio}×</p>
                    <p className="text-[13px] text-[#6a6a6a] mt-2">Awarded price is {tender.evidencePackage.priceComparison.ratio}x above market average.</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-2">Price Sources</p>
                    <ul className="space-y-1.5">
                      {tender.evidencePackage.priceComparison.sources.map((src, i) => (
                        <li key={i} className="text-[13px] text-[#3f3f3f] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dddddd] mt-1.5 flex-shrink-0" />
                          {src}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rti application">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-8 lg:p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#ff385c]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#ff385c]" />
              </div>
              <h3 className="text-[22px] font-bold text-[#222222] mb-2">File RTI Application</h3>
              <p className="text-[15px] text-[#6a6a6a] max-w-md mb-8 leading-relaxed">
                Generate a legally structured Right to Information application backed by the detected fraud evidence for this tender.
              </p>
              <Button
                onClick={handleGenerateRti}
                disabled={generateRti.isPending}
                className="bg-[#ff385c] hover:bg-[#e0022a] text-white rounded-[10px] px-10 py-3 h-auto text-[15px] font-semibold shadow-sm transition-all"
              >
                {generateRti.isPending ? "Generating…" : "Generate RTI Application"}
              </Button>
              <p className="text-[12px] text-[#aaaaaa] mt-5 max-w-sm leading-relaxed">
                Draft follows Section 6(1) of the RTI Act, 2005. Stored in RTI Tracker with a 30-day response deadline.
              </p>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
}
