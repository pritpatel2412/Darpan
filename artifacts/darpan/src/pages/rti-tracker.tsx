import { useListRtis, getListRtisQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function RtiTracker() {
  const { data, isLoading } = useListRtis({}, { query: { queryKey: getListRtisQueryKey({}) } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'drafted': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'responded': return 'bg-green-100 text-green-700';
      case 'appealed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#222222] tracking-tight">RTI Tracker</h1>
          <p className="text-[16px] text-[#6a6a6a] mt-1">Monitor the status of Right to Information applications filed.</p>
        </div>

        <div className="bg-white rounded-[14px] border border-[#dddddd] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f7] border-b border-[#dddddd]">
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Tender ID</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Department</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Status</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Filing Date</th>
                  <th className="py-4 px-6 text-[14px] font-medium text-[#6a6a6a]">Response Deadline</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#ebebeb]"><td colSpan={5} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : data?.rtis.map(rti => (
                  <tr key={rti.id} className="border-b border-[#ebebeb] hover:bg-[#f7f7f7]/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-[#222222]">{rti.tenderId}</td>
                    <td className="py-4 px-6 text-[#3f3f3f] text-[14px] truncate max-w-[200px]">{rti.department}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wider ${getStatusColor(rti.status)}`}>
                        {rti.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#6a6a6a] text-[14px]">
                      {rti.filingDate ? format(new Date(rti.filingDate), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="py-4 px-6 text-[#6a6a6a] text-[14px]">
                      {rti.responseDeadline ? format(new Date(rti.responseDeadline), "dd MMM yyyy") : "-"}
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
