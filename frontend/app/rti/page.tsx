"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Clock, CheckCircle, Send, MessageSquare, ChevronRight, Download } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import Link from "next/link";
import { api, RTIApplication } from "@/lib/api";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  draft: { color: "text-[#6a6a6a]", bg: "bg-[#f7f7f7]", icon: ScrollText, label: "Drafted" },
  queued: { color: "text-blue-700", bg: "bg-blue-50", icon: Send, label: "Queued" },
  filed: { color: "text-blue-700", bg: "bg-blue-50", icon: Send, label: "Submitted" },
  responded: { color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle, label: "Responded" },
  first_appeal: { color: "text-orange-700", bg: "bg-orange-50", icon: MessageSquare, label: "1st Appeal" },
  cic: { color: "text-orange-700", bg: "bg-orange-50", icon: MessageSquare, label: "CIC Appeal" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function DeadlineCell({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-[#aaaaaa] text-[13px]">—</span>;
  const d = new Date(deadline);
  
  const diffTime = d.getTime() - new Date().getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const overdue = daysLeft < 0;
  const urgent = daysLeft >= 0 && daysLeft <= 5;
  
  return (
    <div className="flex flex-col">
      <span className="text-[13px] text-[#3f3f3f]">
        {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </span>
      <span className={`text-[11px] font-medium ${overdue ? "text-[#ff385c]" : urgent ? "text-orange-500" : "text-[#aaaaaa]"}`}>
        {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
      </span>
    </div>
  );
}

export default function RtiTracker() {
  const [rtis, setRtis] = useState<RTIApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listRtis()
      .then((data: any) => {
        // Handle list format returned from API
        setRtis(data.applications || data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load RTI list:", err);
        setLoading(false);
      });
  }, []);

  const counts = rtis.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
    if (!rtis.length) return;
    const headers = ["ID", "Tender ID", "PIO Target", "Status", "Filing Date", "Response Deadline", "Confirmation Number"];
    const rows = rtis.map((r) => [
      r.id,
      r.tender_id || "N/A",
      `"${(r.pio_name ?? "").replace(/"/g, '""')}"`,
      r.status,
      r.filed_at ? new Date(r.filed_at).toLocaleDateString("en-IN") : "",
      r.response_due_at ? new Date(r.response_due_at).toLocaleDateString("en-IN") : "",
      r.confirmation_number ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darpan_rtis_${new Date().toISOString().substring(0, 10).replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="RTI Tracker" subtitle="Monitor all Right to Information applications filed by Darpan">
      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { status: "draft", label: "Drafted", icon: ScrollText },
            { status: "filed", label: "Submitted", icon: Send },
            { status: "responded", label: "Responded", icon: CheckCircle },
            { status: "first_appeal", label: "Appealed", icon: MessageSquare },
          ].map(({ status, label, icon: Icon }) => {
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
            return (
              <div key={status} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[10px] ${cfg.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-[12px] text-[#aaaaaa] font-medium">{label}</p>
                  <p className="text-[22px] font-bold text-[#222222] leading-none">
                    {loading ? "—" : counts[status] ?? 0}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#aaaaaa]" />
              <h2 className="text-[14px] font-bold text-[#222222]">Statutory Application Ledger</h2>
            </div>
            <button
              onClick={handleExport}
              disabled={!rtis.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#ebebeb] text-[12px] font-medium text-[#6a6a6a] hover:border-[#ff385c] hover:text-[#ff385c] disabled:opacity-40 transition-colors bg-transparent cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f7f7f7] bg-[#fafafa] text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">
                  <th className="px-6 py-4">Tender ID References</th>
                  <th className="px-6 py-4">PIO Department Target</th>
                  <th className="px-6 py-4">Filing Status</th>
                  <th className="px-6 py-4">Filing Date</th>
                  <th className="px-6 py-4">Response Due Deadline</th>
                  <th className="px-6 py-4">Statutory Confirmation No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f7f7] text-[13px]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f7f7f7]">
                      <td colSpan={6} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))
                ) : rtis.length > 0 ? (
                  rtis.map((rti) => (
                    <tr key={rti.id} className="hover:bg-[#fafafa] transition-colors group">
                      <td className="px-6 py-4 font-mono text-[13px] text-[#222222] font-bold">
                        {rti.tender_id ? "TENDER DOSSIER REFERENCE" : "GENERAL DISCOVERY"}
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#3f3f3f] max-w-[200px] truncate">
                        {rti.pio_department || "Delhi Jal Board"}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={rti.status} /></td>
                      <td className="px-6 py-4 text-[13px] text-[#6a6a6a]">
                        {rti.filed_at ? new Date(rti.filed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "DRAFT"}
                      </td>
                      <td className="px-6 py-4"><DeadlineCell deadline={rti.response_due_at ?? null} /></td>
                      <td className="px-6 py-4 font-mono text-[11.5px] text-[#888888]">
                        {rti.confirmation_number || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#aaaaaa] italic">
                      No statutory RTI applications compiled in ledger yet.
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
