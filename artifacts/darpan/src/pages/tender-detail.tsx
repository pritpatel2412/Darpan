import { useParams } from "wouter";
import { useGetTender, getGetTenderQueryKey, useGenerateRti } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

export default function TenderDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: tender, isLoading } = useGetTender(id, { query: { enabled: !!id, queryKey: getGetTenderQueryKey(id) } });
  const generateRti = useGenerateRti();
  const { toast } = useToast();

  const handleGenerateRti = () => {
    generateRti.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "RTI Generated", description: "The RTI application has been successfully drafted." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to generate RTI application.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <MainLayout><Skeleton className="w-full h-96 rounded-[14px]" /></MainLayout>;
  }

  if (!tender) {
    return <MainLayout><div className="text-center py-20 text-[#6a6a6a]">Tender not found.</div></MainLayout>;
  }

  const priceData = [
    { name: "Awarded Price", value: tender.evidencePackage.priceComparison.awardedPrice, fill: "#ff385c" },
    { name: "Market Price", value: tender.evidencePackage.priceComparison.marketPrice, fill: "#6a6a6a" }
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        
        <div className="bg-white rounded-[14px] border border-[#dddddd] shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px] p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex gap-2 items-center">
              <FraudTierBadge tier={tender.fraudTier} />
              <span className="text-[14px] text-[#6a6a6a] font-medium">ID: {tender.tenderId}</span>
            </div>
            <h1 className="text-[24px] lg:text-[28px] font-bold text-[#222222] tracking-tight leading-tight">{tender.title}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-[14px] pt-2">
              <div className="flex flex-col gap-1"><span className="text-[#6a6a6a] uppercase tracking-wide text-[11px] font-semibold">Department</span><span className="font-medium text-[#222222]">{tender.department}</span></div>
              <div className="flex flex-col gap-1"><span className="text-[#6a6a6a] uppercase tracking-wide text-[11px] font-semibold">State</span><span className="font-medium text-[#222222]">{tender.state}</span></div>
              <div className="flex flex-col gap-1"><span className="text-[#6a6a6a] uppercase tracking-wide text-[11px] font-semibold">Contract Value</span><span className="font-medium text-[#222222]">{formatIndianCurrency(tender.contractValue)}</span></div>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end justify-center min-w-[140px] p-4 bg-[#f7f7f7] rounded-xl border border-[#ebebeb]">
            <span className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-3">Fraud Score</span>
            <FraudScoreBadge score={tender.fraudScore} className="text-4xl px-6 py-2 border-2" />
          </div>
        </div>

        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="bg-[#f7f7f7] border border-[#ebebeb] p-1 h-auto rounded-[12px] inline-flex mb-6 overflow-x-auto max-w-full">
            {["evidence", "signals", "contractor", "price comparison", "rti application"].map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize rounded-[8px] px-5 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="evidence" className="space-y-6">
            <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 lg:p-8 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#222222] mb-4">Executive Summary</h3>
              <p className="text-[16px] text-[#3f3f3f] leading-relaxed whitespace-pre-wrap">{tender.evidencePackage.executiveSummary}</p>
              
              {tender.evidencePackage.recommendedAction && (
                <div className="mt-8 p-4 bg-[#ff385c]/5 border border-[#ff385c]/20 rounded-xl">
                  <h4 className="text-[14px] font-bold text-[#ff385c] uppercase tracking-wide mb-2">Recommended Action</h4>
                  <p className="text-[#222222] font-medium">{tender.evidencePackage.recommendedAction}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
             {tender.evidencePackage.signalBreakdown.map((signal) => (
                <div key={signal.signalId} className="bg-white rounded-[14px] border border-[#dddddd] p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#222222] text-[16px]">{signal.name}</span>
                    <span className="text-[12px] font-semibold text-[#ff385c] bg-[#ff385c]/10 px-2.5 py-1 rounded-md whitespace-nowrap">{signal.confidence}% Confidence</span>
                  </div>
                  <p className="text-[14px] text-[#3f3f3f]">{signal.evidence}</p>
                </div>
             ))}
          </TabsContent>

          <TabsContent value="contractor">
            <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 lg:p-8 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#222222] mb-6">Contractor Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                <div className="flex flex-col gap-1.5"><span className="text-[#6a6a6a] text-[12px] uppercase font-semibold tracking-wide">Name</span><span className="font-medium text-[#222222] text-[16px]">{tender.evidencePackage.contractorProfile.name}</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[#6a6a6a] text-[12px] uppercase font-semibold tracking-wide">CIN</span><span className="font-medium text-[#222222] text-[16px]">{tender.evidencePackage.contractorProfile.cin}</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[#6a6a6a] text-[12px] uppercase font-semibold tracking-wide">Total Tenders Won</span><span className="font-medium text-[#222222] text-[16px]">{tender.evidencePackage.contractorProfile.totalTendersWon}</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[#6a6a6a] text-[12px] uppercase font-semibold tracking-wide">Total Value</span><span className="font-medium text-[#222222] text-[16px]">{formatIndianCurrency(tender.evidencePackage.contractorProfile.totalValue)}</span></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price comparison">
            <div className="bg-white rounded-[14px] border border-[#dddddd] p-6 lg:p-8 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#222222] mb-6">Price Anomaly</h3>
              
              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1 min-w-[300px] h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebebeb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#222222', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/100000}L`} tick={{ fill: '#6a6a6a' }} />
                      <Tooltip formatter={(value: number) => formatIndianCurrency(value)} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #dddddd' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {priceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full md:w-64 flex flex-col gap-6">
                  <div className="p-5 bg-[#ff385c]/5 rounded-[12px] border border-[#ff385c]/20">
                    <span className="text-[12px] font-bold text-[#ff385c] uppercase tracking-wide block mb-1">Price Inflation</span>
                    <span className="text-[32px] font-bold text-[#222222] leading-none block">{tender.evidencePackage.priceComparison.ratio}x</span>
                    <span className="text-[14px] text-[#6a6a6a] mt-2 block">Awarded price is {tender.evidencePackage.priceComparison.ratio} times higher than market average.</span>
                  </div>
                  
                  <div>
                    <span className="text-[12px] font-bold text-[#6a6a6a] uppercase tracking-wide block mb-2">Sources</span>
                    <ul className="text-[14px] text-[#222222] list-disc list-inside space-y-1">
                      {tender.evidencePackage.priceComparison.sources.map((src, i) => (
                        <li key={i}>{src}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rti application">
            <div className="bg-white rounded-[14px] border border-[#dddddd] p-8 shadow-sm flex flex-col items-center text-center py-16">
              <div className="w-16 h-16 bg-[#ff385c]/10 rounded-full flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff385c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <h3 className="text-[22px] font-bold text-[#222222] mb-3">File RTI Application</h3>
              <p className="text-[16px] text-[#6a6a6a] max-w-lg mb-8 leading-relaxed">Generate a legally sound Right to Information application based on the fraud evidence detected in this tender.</p>
              <Button onClick={handleGenerateRti} disabled={generateRti.isPending} className="bg-[#ff385c] hover:bg-[#d90b34] text-white rounded-lg px-8 py-6 h-auto text-[16px] font-semibold transition-all">
                {generateRti.isPending ? "Generating Draft..." : "Generate RTI Application"}
              </Button>
              <p className="text-[12px] text-[#6a6a6a] mt-6 max-w-sm">Draft will be generated using section 6(1) of the RTI Act, 2005. You will have a chance to review before filing.</p>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
}
