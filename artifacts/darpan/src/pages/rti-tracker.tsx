import { useListRtis, getListRtisQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { ScrollText, Clock, CheckCircle, Send, MessageSquare, ChevronRight, Download } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  drafted: { color: "text-[#6a6a6a]", bg: "bg-[#f7f7f7]", icon: ScrollText, label: "Drafted" },
  submitted: { color: "text-blue-700", bg: "bg-blue-50", icon: Send, label: "Submitted" },
  responded: { color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle, label: "Responded" },
  appealed: { color: "text-orange-700", bg: "bg-orange-50", icon: MessageSquare, label: "Appealed" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.drafted;
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
  const daysLeft = differenceInDays(d, new Date());
  const overdue = daysLeft < 0;
  const urgent = daysLeft >= 0 && daysLeft <= 5;
  return (
    <div className="flex flex-col">
      <span className="text-[13px] text-[#3f3f3f]">{format(d, "dd MMM yyyy")}</span>
      <span className={`text-[11px] font-medium ${overdue ? "text-[#ff385c]" : urgent ? "text-orange-500" : "text-[#aaaaaa]"}`}>
        {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
      </span>
    </div>
  );
}

export default function RtiTracker() {
  const { data, isLoading } = useListRtis({}, { query: { queryKey: getListRtisQueryKey({}) } });
  const { toast } = useToast();

  const counts = data?.rtis.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const handleExport = () => {
    if (!data?.rtis.length) return;
    const headers = ["ID", "Tender ID", "Department", "Status", "Filing Date", "Response Deadline", "Confirmation Number"];
    const rows = data.rtis.map((r) => [
      r.id,
      r.tenderId,
      `"${r.department.replace(/"/g, '""')}"`,
      r.status,
      r.filingDate ? format(new Date(r.filingDate), "dd/MM/yyyy") : "",
      r.responseDeadline ? format(new Date(r.responseDeadline), "dd/MM/yyyy") : "",
      r.confirmationNumber ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darpan_rtis_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${data.rtis.length} RTI applications exported to CSV.` });
  };

  return (
    <MainLayout title="RTI Tracker" subtitle="Monitor all Right to Information applications filed by Darpan">
      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { status: "drafted", label: "Drafted", icon: ScrollText },
            { status: "submitted", label: "Submitted", icon: Send },
            { status: "responded", label: "Responded", icon: CheckCircle },
            { status: "appealed", label: "Appealed", icon: MessageSquare },
          ].map(({ status, label, icon: Icon }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[10px] ${cfg.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-[12px] text-[#aaaaaa] font-medium">{label}</p>
                  <p className="text-[22px] font-bold text-[#222222] leading-none">{isLoading ? "—" : counts[status] ?? 0}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#aaaaaa]" />
              <h2 className="text-[14px] font-bold text-[#222222]">All Applications</h2>
            </div>
            <button
              onClick={handleExport}
              disabled={!data?.rtis.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#ebebeb] text-[12px] font-medium text-[#6a6a6a] hover:border-[#ff385c] hover:text-[#ff385c] disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f7f7f7]">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Tender ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Department</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Filed</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest">Response Deadline</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#aaaaaa] uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f7f7f7]">
                      <td colSpan={6} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))
                  : data?.rtis.map((rti) => (
                    <tr key={rti.id} className="border-b border-[#f7f7f7] last:border-0 hover:bg-[#fafafa] transition-colors group">
                      <td className="px-6 py-4 font-mono text-[13px] text-[#222222] font-medium">{rti.tenderId}</td>
                      <td className="px-6 py-4 text-[13px] text-[#3f3f3f] max-w-[200px] truncate">{rti.department}</td>
                      <td className="px-6 py-4"><StatusBadge status={rti.status} /></td>
                      <td className="px-6 py-4 text-[13px] text-[#6a6a6a]">
                        {rti.filingDate ? format(new Date(rti.filingDate), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-6 py-4"><DeadlineCell deadline={rti.responseDeadline} /></td>
                      <td className="px-6 py-4">
                        <Link href={`/rti/${rti.id}`}>
                          <button className="flex items-center gap-1 text-[12px] text-[#aaaaaa] hover:text-[#ff385c] transition-colors opacity-0 group-hover:opacity-100">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                }
                {data?.rtis.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#aaaaaa] text-[14px]">No RTI applications filed yet.</td>
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
