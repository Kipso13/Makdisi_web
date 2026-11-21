import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useSchool } from "../../context/SchoolContext";

export function AttendancePage() {
  const { currentUser, db } = useSchool();
  const [typeFilter, setTypeFilter] = useState<"all" | "absent" | "late">("all");

  if (!currentUser || currentUser.role !== "student") return null;

  const myRecords = useMemo(
    () =>
      db.attendance
        .filter((a) => a.studentId === currentUser.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [db.attendance, currentUser.id],
  );

  const filteredRecords = useMemo(
    () => myRecords.filter((r) => typeFilter === "all" || r.type === typeFilter),
    [myRecords, typeFilter],
  );

  const totalMissedHours = myRecords.reduce((sum, r) => sum + r.missedHours, 0);
  const absencesCount = myRecords.filter((r) => r.type === "absent").length;
  const lateCount = myRecords.filter((r) => r.type === "late").length;
  const justifiedCount = myRecords.filter((r) => r.status === "justified").length;
  const unjustifiedCount = myRecords.filter((r) => r.status === "unjustified").length;

  const monthlyChartData = useMemo(() => {
    const months = new Map<string, { month: string; justified: number; unjustified: number }>();
    for (const rec of myRecords) {
      const m = rec.date.slice(0, 7);
      const entry = months.get(m) || { month: m, justified: 0, unjustified: 0 };
      if (rec.status === "justified") entry.justified += rec.missedHours;
      else entry.unjustified += rec.missedHours;
      months.set(m, entry);
    }
    return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [myRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Attendance & Absence Record</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Absences, late arrivals, missed hours, and justification status
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-[#101C35] self-start">
          {(["all", "absent", "late"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === t
                  ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t === "all" ? "All records" : t === "absent" ? "Absences" : "Late arrivals"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Missed Hours</div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums">
            {totalMissedHours.toFixed(1)} hrs
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Semester 1</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Absences / Late</div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums">
            {absencesCount} / {lateCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recorded incidents</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Justified</div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {justifiedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Verified slips</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Unjustified</div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {unjustifiedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Submit slip to office if applicable
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <h3 className="font-display text-base font-semibold">Missed Hours by Month</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Justified vs. pending/unjustified missed hours
        </p>
        <div className="mt-4 h-56 w-full">
          {monthlyChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Perfect attendance — zero missed hours recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="justified" stackId="a" fill="#2563EB" name="Justified (hrs)" />
                <Bar dataKey="unjustified" stackId="a" fill="#F59E0B" name="Unjustified/Pending (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <h3 className="font-display text-base font-semibold">Attendance History</h3>
        {filteredRecords.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No attendance incidents matching this filter.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Date</th>
                  <th className="py-2.5 pr-4 font-medium">Subject</th>
                  <th className="py-2.5 pr-4 font-medium">Type</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Missed Hours</th>
                  <th className="py-2.5 pr-4 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#080B12] dark:text-white whitespace-nowrap">
                      {rec.subjectName}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {rec.type === "absent" ? "Absence" : "Late arrival"}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">
                      {rec.missedHours.toFixed(1)}h
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          rec.status === "justified"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : rec.status === "pending"
                              ? "text-[#2563EB] dark:text-[#60A5FA]"
                              : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {rec.status === "justified" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : rec.status === "pending" ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {rec.status === "justified"
                            ? "Justified"
                            : rec.status === "pending"
                              ? "Pending"
                              : "Unjustified"}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                      {rec.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
