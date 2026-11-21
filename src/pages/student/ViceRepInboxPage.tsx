import React, { useMemo, useState } from "react";
import { CheckCircle2, Clock, Inbox, Lock } from "lucide-react";
import { useSchool } from "../../context/SchoolContext";
import { canViewProblemReport } from "../../db/databaseAdapter";
import type { ReportStatus } from "../../db/types";

export function ViceRepInboxPage() {
  const { currentUser, db, updateProblemReportStatus } = useSchool();
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  if (!currentUser || !currentUser.isViceRepresentative || !currentUser.viceRepClassId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c1322]">
        <Lock className="h-8 w-8 mx-auto text-slate-400" />
        <h2 className="mt-3 font-display text-lg font-semibold">
          Vice Representative Access Required
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This private inbox is restricted to the assigned Vice Representative of each class.
        </p>
      </div>
    );
  }

  const assignedClass = db.classes.find((c) => c.id === currentUser.viceRepClassId);

  const classReports = useMemo(
    () =>
      db.reports
        .filter(
          (r) =>
            r.classId === currentUser.viceRepClassId &&
            canViewProblemReport(currentUser, r),
        )
        .filter((r) => statusFilter === "all" || r.status === statusFilter),
    [db.reports, currentUser, statusFilter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
            Private Class Representative Inbox
          </div>
          <h2 className="mt-1 font-display text-xl font-bold">
            {assignedClass?.name || "Class"} — Student Reports & Suggestions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Confidential submissions from your classmates. Mark items as received or handled as you
            coordinate with teachers or administration.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-[#101C35] self-start">
          {(["all", "submitted", "received", "handled"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {st === "all"
                ? "All"
                : st === "submitted"
                  ? "New"
                  : st === "received"
                    ? "Received"
                    : "Handled"}
            </button>
          ))}
        </div>
      </div>

      {classReports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0c1322]">
          <Inbox className="h-8 w-8 mx-auto text-slate-400" />
          <h3 className="mt-3 font-display text-base font-semibold">No reports in this view</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Classmate submissions sent through Problems & Suggestions will appear here privately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {classReports.map((rep) => (
            <article
              key={rep.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>From {rep.studentName}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{rep.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{rep.urgency} priority</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{rep.createdAt.slice(0, 10)}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    rep.status === "handled"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : rep.status === "received"
                        ? "text-[#2563EB] dark:text-[#60A5FA]"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {rep.status === "handled" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {rep.status === "handled"
                      ? "Handled"
                      : rep.status === "received"
                        ? "Received"
                        : "New submission"}
                  </span>
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-semibold text-[#080B12] dark:text-white">
                {rep.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {rep.summary}
              </p>

              {rep.handlingNote ? (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-[#101C35] dark:text-slate-200">
                  <span className="font-semibold">Latest note:</span> {rep.handlingNote}
                </div>
              ) : null}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={noteById[rep.id] ?? ""}
                  onChange={(e) =>
                    setNoteById((prev) => ({ ...prev, [rep.id]: e.target.value }))
                  }
                  placeholder="Optional update note for the student (e.g., 'Shared with homeroom teacher')..."
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={rep.status === "received"}
                    onClick={() => {
                      updateProblemReportStatus(rep.id, "received", noteById[rep.id]);
                      setNoteById((prev) => ({ ...prev, [rep.id]: "" }));
                    }}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-45 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35] whitespace-nowrap"
                  >
                    Mark as Received
                  </button>
                  <button
                    type="button"
                    disabled={rep.status === "handled"}
                    onClick={() => {
                      updateProblemReportStatus(rep.id, "handled", noteById[rep.id]);
                      setNoteById((prev) => ({ ...prev, [rep.id]: "" }));
                    }}
                    className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-45 whitespace-nowrap"
                  >
                    Mark as Handled
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
