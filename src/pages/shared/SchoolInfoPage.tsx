import React, { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Database,
  FileText,
  Megaphone,
  X,
} from "lucide-react";
import { DATABASE_INTEGRATION_NOTES, SCHOOL_CONFIG } from "../../config/schoolConfig";
import { useSchool } from "../../context/SchoolContext";
import type { SchoolDocument } from "../../db/types";

const DAYS: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday")[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export function SchoolInfoPage() {
  const { currentUser, db } = useSchool();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedDoc, setSelectedDoc] = useState<SchoolDocument | null>(null);

  if (!currentUser) return null;

  const accessibleClasses = useMemo(() => {
    if (currentUser.role === "admin") return db.classes;
    if (currentUser.role === "teacher") {
      return db.classes.filter((c) => currentUser.assignedClassIds?.includes(c.id));
    }
    return db.classes.filter((c) => c.id === currentUser.classId);
  }, [db.classes, currentUser]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    accessibleClasses[0]?.id || db.classes[0]?.id || "",
  );

  const effectiveClassId = accessibleClasses.some((c) => c.id === selectedClassId)
    ? selectedClassId
    : accessibleClasses[0]?.id || "";

  const visibleAnnouncements = useMemo(() => {
    return db.announcements
      .filter((a) => {
        const permitted =
          currentUser.role === "admin" ||
          !a.targetClassId ||
          a.targetClassId === currentUser.classId ||
          currentUser.assignedClassIds?.includes(a.targetClassId);
        if (!permitted) return false;
        if (categoryFilter !== "All" && a.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [db.announcements, currentUser, categoryFilter]);

  const classTimetable = useMemo(() => {
    return db.timetable.filter((slot) => slot.classId === effectiveClassId);
  }, [db.timetable, effectiveClassId]);

  const upcomingItems = useMemo(() => {
    if (currentUser.role === "admin") return db.upcoming;
    if (currentUser.role === "teacher") {
      return db.upcoming.filter((u) => currentUser.assignedClassIds?.includes(u.classId));
    }
    return db.upcoming.filter(
      (u) =>
        u.classId === currentUser.classId || u.academicLevel === currentUser.academicLevel,
    );
  }, [db.upcoming, currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#080B12] dark:text-white">
          Makdisi School Info Center
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Official announcements, class schedules, exam calendar, and school documents.
        </p>
      </div>

      {/* Announcements */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              School & Class Announcements
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "General", "Class", "Exam", "Holiday", "Event", "Administrative"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#101C35] dark:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleAnnouncements.map((ann) => (
            <div key={ann.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  {ann.category}
                  {ann.pinned ? " · Pinned" : ""}
                  {ann.targetLevel && ann.targetLevel !== "All Levels"
                    ? ` · ${ann.targetLevel}`
                    : ""}
                </span>
                <span>{ann.publishedAt}</span>
              </div>
              <h4 className="mt-1 text-sm font-semibold text-[#080B12] dark:text-white">
                {ann.title}
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {ann.body}
              </p>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Posted by {ann.authorName}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Timetable */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Weekly Timetable
            </h3>
          </div>
          {accessibleClasses.length > 1 ? (
            <select
              value={effectiveClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              aria-label="Select class timetable"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
            >
              {accessibleClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.room})
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {DAYS.map((day) => {
            const slots = classTimetable.filter((s) => s.day === day);
            return (
              <div
                key={day}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#101C35]/50"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA] mb-2.5">
                  {day}
                </div>
                {slots.length === 0 ? (
                  <div className="text-xs text-slate-400">No scheduled sessions</div>
                ) : (
                  <div className="space-y-2.5">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-lg bg-white dark:bg-[#080B12] p-2.5 border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {slot.time}
                        </div>
                        <div className="text-xs font-semibold text-[#080B12] dark:text-white mt-0.5">
                          {slot.subjectName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {slot.teacherName} · {slot.room}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Exam Dates & School Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Exam & Assignment Calendar
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingItems.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] capitalize">
                    {item.kind} · {item.subjectName}
                  </div>
                  <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.roomOrWeight}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                  {item.dueDate}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Official Makdisi School Documents
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {db.documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#080B12] dark:text-white truncate">
                    {doc.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.category} · Updated {doc.updatedAt} · {doc.fileSize}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35] whitespace-nowrap shrink-0"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Read summary</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Database Integration Architecture Summary (visible to Teacher & Admin) */}
      {currentUser.role === "teacher" || currentUser.role === "admin" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
              <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
                Database & Service Integration Status
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Active provider: {SCHOOL_CONFIG.dataProvider}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATABASE_INTEGRATION_NOTES.map((note) => (
              <div
                key={note.area}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#101C35]/50"
              >
                <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                  {note.area}
                </div>
                <div className="mt-0.5 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  {note.status}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {note.howToConnect}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selectedDoc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  {selectedDoc.category} · {selectedDoc.fileSize}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-[#080B12] dark:text-white">
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
              {selectedDoc.summary}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
