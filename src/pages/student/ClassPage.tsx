import React, { useMemo } from "react";
import { CalendarDays, MapPin, Shield, UserCheck, Users } from "lucide-react";
import { Avatar } from "../../components/common/Avatar";
import type { AppViewId } from "../../components/layout/AppShell";
import { useSchool } from "../../context/SchoolContext";

interface ClassPageProps {
  onNavigate: (view: AppViewId) => void;
}

export function ClassPage({ onNavigate }: ClassPageProps) {
  const { currentUser, db } = useSchool();

  if (!currentUser || currentUser.role !== "student") return null;

  const schoolClass = db.classes.find((c) => c.id === currentUser.classId);

  const homeroomTeacher = useMemo(
    () => db.users.find((u) => u.id === schoolClass?.homeroomTeacherId),
    [db.users, schoolClass],
  );

  const viceRep = useMemo(
    () => db.users.find((u) => u.id === schoolClass?.viceRepresentativeId),
    [db.users, schoolClass],
  );

  const classmates = useMemo(
    () =>
      db.users.filter(
        (u) => u.role === "student" && u.classId === currentUser.classId,
      ),
    [db.users, currentUser.classId],
  );

  const classAnnouncements = useMemo(
    () =>
      db.announcements.filter(
        (a) =>
          a.targetClassId === currentUser.classId ||
          (!a.targetClassId &&
            (a.targetLevel === "All Levels" || a.targetLevel === currentUser.academicLevel)),
      ),
    [db.announcements, currentUser.classId, currentUser.academicLevel],
  );

  const classTimetable = useMemo(
    () => db.timetable.filter((t) => t.classId === currentUser.classId),
    [db.timetable, currentUser.classId],
  );

  if (!schoolClass) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c1322]">
        <h2 className="font-display text-lg font-semibold">No Class Assigned Yet</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Please contact Makdisi School administration to assign your academic class.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Header Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              Makdisi School · {schoolClass.academicLevel}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-[#080B12] dark:text-white">
              {schoolClass.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>{schoolClass.room}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>{schoolClass.scheduleSummary}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Users className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>{classmates.length} Enrolled Students</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("reports")}
              className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Send Issue to Vice Rep
            </button>
            <button
              type="button"
              onClick={() => onNavigate("messages")}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35] whitespace-nowrap"
            >
              Message Teacher
            </button>
          </div>
        </div>

        {/* Homeroom & Vice Rep Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#101C35]/50">
            <Avatar name={homeroomTeacher?.fullName || "Homeroom Teacher"} />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Homeroom Advisor</div>
              <div className="text-sm font-semibold">{homeroomTeacher?.fullName || "TBD"}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {homeroomTeacher?.department}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#101C35]/50">
            <Avatar name={viceRep?.fullName || "Vice Representative"} />
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] dark:text-[#60A5FA] font-medium">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Class Vice Representative</span>
              </div>
              <div className="text-sm font-semibold">{viceRep?.fullName || "Unassigned"}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receives private Problems & Suggestions for {schoolClass.name}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Announcements */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <h3 className="font-display text-base font-semibold">Class & Level Announcements</h3>
            <div className="mt-4 space-y-4">
              {classAnnouncements.length === 0 ? (
                <p className="text-sm text-slate-500">No announcements for this class yet.</p>
              ) : (
                classAnnouncements.map((ann) => (
                  <article
                    key={ann.id}
                    className="pb-4 border-b last:border-b-0 last:pb-0 border-slate-100 dark:border-slate-800"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{ann.targetClassId ? "Class Notice" : ann.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">{ann.publishedAt}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{ann.authorName}</span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-[#080B12] dark:text-white">
                      {ann.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ann.body}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Weekly Class Schedule */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <h3 className="font-display text-base font-semibold">Weekly Class Timetable</h3>
            {classTimetable.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Timetable slots will appear here.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-4 font-medium">Day</th>
                      <th className="py-2 pr-4 font-medium">Time</th>
                      <th className="py-2 pr-4 font-medium">Subject</th>
                      <th className="py-2 pr-4 font-medium">Instructor</th>
                      <th className="py-2 font-medium">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classTimetable.map((slot) => (
                      <tr key={slot.id}>
                        <td className="py-2.5 pr-4 font-medium">{slot.day}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {slot.time}
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-[#2563EB] dark:text-[#60A5FA]">
                          {slot.subjectName}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                          {slot.teacherName}
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{slot.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Classmates Directory (Privacy-Preserving) */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold">Classmates Directory</h3>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Only directory names and class roles are shown. Grades and attendance stay private.
            </p>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {classmates.map((mate) => (
                <div key={mate.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={mate.fullName} avatarUrl={mate.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {mate.fullName}
                        {mate.id === currentUser.id ? " (You)" : ""}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {mate.isViceRepresentative ? "Class Vice Representative" : "Student"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
