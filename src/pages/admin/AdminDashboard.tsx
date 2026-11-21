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
import {
  CalendarDays,
  Compass,
  Inbox,
  Megaphone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useSchool } from "../../context/SchoolContext";
import { canManageProblemReport, canViewProblemReport } from "../../db/databaseAdapter";
import { CAMPUS_IMAGES } from "../../db/demoData";
import type {
  AcademicLevel,
  Announcement,
  ProblemReport,
  ReportStatus,
  TimetableSlot,
} from "../../db/types";

type AdminTab = "overview" | "people" | "classes" | "announcements" | "clubs";

const LEVELS: AcademicLevel[] = [
  "Tronc Commun Sciences",
  "1ère Bac Sciences Math",
  "2ème Bac Physique",
];

const DAYS: TimetableSlot["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export function AdminDashboard() {
  const {
    currentUser,
    db,
    assignStudentToClass,
    upsertClass,
    upsertTimetableSlot,
    deleteTimetableSlot,
    publishAnnouncement,
    deleteAnnouncement,
    createClub,
    deleteClub,
    updateProblemReportStatus,
  } = useSchool();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [noteByReport, setNoteByReport] = useState<Record<string, string>>({});

  // People search
  const [peopleSearch, setPeopleSearch] = useState("");

  // New class form
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState<AcademicLevel>("1ère Bac Sciences Math");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassHomeroomId, setNewClassHomeroomId] = useState("");

  // New timetable slot
  const [slotClassId, setSlotClassId] = useState(db.classes[0]?.id || "");
  const [slotDay, setSlotDay] = useState<TimetableSlot["day"]>("Monday");
  const [slotTime, setSlotTime] = useState("08:30 – 10:15");
  const [slotSubject, setSlotSubject] = useState("");
  const [slotTeacher, setSlotTeacher] = useState("");
  const [slotRoom, setSlotRoom] = useState("");

  // New announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCategory, setAnnCategory] = useState<Announcement["category"]>("General");
  const [annTargetClassId, setAnnTargetClassId] = useState<string>("");
  const [annPinned, setAnnPinned] = useState(false);

  // New club
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("STEM");
  const [clubSchedule, setClubSchedule] = useState("Wednesdays");
  const [clubTime, setClubTime] = useState("15:30 – 17:00");
  const [clubLocation, setClubLocation] = useState("");
  const [clubAdvisor, setClubAdvisor] = useState("");
  const [clubDesc, setClubDesc] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{
    type: "announcement" | "club" | "slot";
    id: string;
    label: string;
  } | null>(null);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c1322]">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Administrator privileges are required to access the Makdisi School Admin Console.
        </p>
      </div>
    );
  }

  const students = useMemo(() => db.users.filter((u) => u.role === "student"), [db.users]);
  const teachers = useMemo(() => db.users.filter((u) => u.role === "teacher"), [db.users]);

  const classPerformanceChart = useMemo(() => {
    return db.classes.map((cls) => {
      const classGrades = db.grades.filter((g) => g.classId === cls.id);
      const avg =
        classGrades.length > 0
          ? Number(
              (
                classGrades.reduce((a, g) => a + (g.score / g.maxScore) * 20, 0) /
                classGrades.length
              ).toFixed(2),
            )
          : 0;
      const count = students.filter((s) => s.classId === cls.id).length;
      return {
        name: cls.name.replace("1ère Bac ", "1B ").replace("2ème Bac ", "2B "),
        average: avg,
        students: count,
      };
    });
  }, [db.classes, db.grades, students]);

  const visibleReports = useMemo(() => {
    return db.reports
      .filter((r) => canViewProblemReport(currentUser, r))
      .filter((r) => (reportFilter === "all" ? true : r.status === reportFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.reports, currentUser, reportFilter]);

  const handleReportStatus = (report: ProblemReport, nextStatus: ReportStatus) => {
    if (!canManageProblemReport(currentUser, report)) return;
    updateProblemReportStatus(report.id, nextStatus, noteByReport[report.id]);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassRoom.trim()) return;
    const homeroomId = newClassHomeroomId || teachers[0]?.id || "";
    upsertClass({
      name: newClassName.trim(),
      academicLevel: newClassLevel,
      room: newClassRoom.trim(),
      homeroomTeacherId: homeroomId,
      teacherIds: homeroomId ? [homeroomId] : [],
      scheduleSummary: "Mon–Fri · 08:30 – 16:30",
    });
    setNewClassName("");
    setNewClassRoom("");
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotClassId || !slotSubject.trim() || !slotTeacher.trim()) return;
    upsertTimetableSlot({
      classId: slotClassId,
      day: slotDay,
      time: slotTime.trim(),
      subjectName: slotSubject.trim(),
      teacherName: slotTeacher.trim(),
      room: slotRoom.trim() || "Main Hall",
    });
    setSlotSubject("");
    setSlotTeacher("");
    setSlotRoom("");
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    publishAnnouncement({
      title: annTitle.trim(),
      body: annBody.trim(),
      category: annCategory,
      targetClassId: annTargetClassId || null,
      targetLevel: "All Levels",
      authorName: currentUser.fullName,
      authorRole: "admin",
      pinned: annPinned,
    });
    setAnnTitle("");
    setAnnBody("");
    setAnnPinned(false);
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !clubDesc.trim()) return;
    createClub({
      name: clubName.trim(),
      category: clubCategory.trim() || "Student Life",
      description: clubDesc.trim(),
      schedule: clubSchedule.trim() || "Wednesdays",
      meetingTime: clubTime.trim() || "15:30 – 17:00",
      location: clubLocation.trim() || "Student Center",
      advisorName: clubAdvisor.trim() || "Makdisi Faculty Advisor",
      imageUrl: CAMPUS_IMAGES.debate,
    });
    setClubName("");
    setClubLocation("");
    setClubAdvisor("");
    setClubDesc("");
  };

  const filteredStudents = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    return students.filter(
      (s) =>
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentNumber?.toLowerCase().includes(q) ?? false),
    );
  }, [students, peopleSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
              Makdisi School · Administration Console
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-[#080B12] dark:text-white">
              School Operations & Oversight
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manage students, teachers, classes, Vice Representatives, clubs, schedules, and
              problem reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "overview", label: "Overview & Reports", icon: Inbox },
                { id: "people", label: "Students & Vice Reps", icon: Users },
                { id: "classes", label: "Classes & Schedules", icon: CalendarDays },
                { id: "announcements", label: "Announcements", icon: Megaphone },
                { id: "clubs", label: "Clubs", icon: Compass },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#101C35] dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Enrolled Students</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {students.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Active Teachers</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {teachers.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Classes & Clubs</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {db.classes.length} · {db.clubs.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Open Reports</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#2563EB] dark:text-[#60A5FA]">
            {db.reports.filter((r) => r.status !== "handled").length}
          </div>
        </div>
      </section>

      {/* TAB: OVERVIEW & REPORTS OVERSIGHT */}
      {tab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
            <h3 className="font-display text-base font-semibold text-[#080B12] dark:text-white">
              Average Grade by Class (/20)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Live calculation from published academic evaluations.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101C35",
                      border: "1px solid #334155",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="average" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
                <h3 className="font-display text-base font-semibold text-[#080B12] dark:text-white">
                  Problems & Suggestions Oversight
                </h3>
              </div>
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                aria-label="Filter reports by status"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#080B12] dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="handled">Handled</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {visibleReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-[#101C35]/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#2563EB] dark:text-[#60A5FA]">
                      {report.className} · {report.category} · {report.urgency} urgency
                    </span>
                    <span className="capitalize font-semibold text-slate-700 dark:text-slate-200">
                      Status: {report.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                    {report.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {report.summary}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    From {report.studentName} → Vice Rep: {report.viceRepName}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={noteByReport[report.id] ?? report.handlingNote ?? ""}
                      onChange={(e) =>
                        setNoteByReport((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      placeholder="Add administrative note..."
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReportStatus(report, "received")}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#080B12] dark:text-slate-200"
                      >
                        Mark received
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportStatus(report, "handled")}
                        className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Mark handled
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB: STUDENTS & TEACHERS */}
      {tab === "people" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
                  Student Directory & Vice Representative Assignment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign students to classes and designate each class&apos;s Vice Representative.
                </p>
              </div>
              <input
                type="search"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search student..."
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Student</th>
                    <th className="py-2.5 pr-4 font-medium">Student ID</th>
                    <th className="py-2.5 pr-4 font-medium">Assigned Class</th>
                    <th className="py-2.5 font-medium">Vice Representative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.id}>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-[#080B12] dark:text-white">
                          {stu.fullName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">{stu.email}</div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-slate-600 dark:text-slate-300">
                        {stu.studentNumber || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={stu.classId || ""}
                          onChange={(e) =>
                            assignStudentToClass(
                              stu.id,
                              e.target.value,
                              stu.isViceRepresentative,
                            )
                          }
                          aria-label={`Class for ${stu.fullName}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                        >
                          {db.classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() =>
                            stu.classId &&
                            assignStudentToClass(
                              stu.id,
                              stu.classId,
                              !stu.isViceRepresentative,
                            )
                          }
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                            stu.isViceRepresentative
                              ? "bg-[#2563EB] text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {stu.isViceRepresentative
                            ? "Active Vice Rep"
                            : "Make Vice Rep"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-3">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Teaching Staff ({teachers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teachers.map((t) => {
                const classNames = db.classes
                  .filter((c) => t.assignedClassIds?.includes(c.id))
                  .map((c) => c.name);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#101C35]/40"
                  >
                    <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                      {t.fullName}
                    </div>
                    <div className="text-xs text-[#2563EB] dark:text-[#60A5FA]">
                      {t.department || "Faculty"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t.email}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Classes: {classNames.length > 0 ? classNames.join(", ") : "Unassigned"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB: CLASSES & SCHEDULES */}
      {tab === "classes" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Manage Classes
            </h3>
            <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class name (e.g., 1ère Bac SM B)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <select
                value={newClassLevel}
                onChange={(e) => setNewClassLevel(e.target.value as AcademicLevel)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newClassRoom}
                onChange={(e) => setNewClassRoom(e.target.value)}
                placeholder="Room (e.g., Building B · 205)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <select
                value={newClassHomeroomId}
                onChange={(e) => setNewClassHomeroomId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              >
                <option value="">Homeroom teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add class</span>
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {db.classes.map((cls) => {
                const rep = db.users.find((u) => u.id === cls.viceRepresentativeId);
                return (
                  <div key={cls.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                        {cls.name}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {cls.academicLevel} · {cls.room}
                      </div>
                    </div>
                    <div className="text-right text-slate-600 dark:text-slate-300">
                      Vice Rep: {rep?.fullName || "Unassigned"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Timetable & Schedule Slots
            </h3>
            <form onSubmit={handleCreateSlot} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={slotClassId}
                onChange={(e) => setSlotClassId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              >
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value as TimetableSlot["day"])}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                placeholder="08:30 – 10:15"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <input
                type="text"
                required
                value={slotSubject}
                onChange={(e) => setSlotSubject(e.target.value)}
                placeholder="Subject (e.g., Mathematics)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <input
                type="text"
                required
                value={slotTeacher}
                onChange={(e) => setSlotTeacher(e.target.value)}
                placeholder="Teacher name"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <input
                type="text"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                placeholder="Room"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <button
                type="submit"
                className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add timetable slot</span>
              </button>
            </form>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {db.timetable
                .filter((s) => s.classId === slotClassId)
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#080B12] dark:text-white">
                        {slot.day} · {slot.time}
                      </span>
                      <div className="text-slate-500 dark:text-slate-400">
                        {slot.subjectName} · {slot.teacherName} ({slot.room})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          type: "slot",
                          id: slot.id,
                          label: `${slot.subjectName} (${slot.day})`,
                        })
                      }
                      className="p-1.5 rounded text-slate-400 hover:text-red-600"
                      aria-label="Delete timetable slot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB: ANNOUNCEMENTS */}
      {tab === "announcements" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Publish School Announcement
            </h3>
            <form onSubmit={handlePublishAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={annCategory}
                    onChange={(e) =>
                      setAnnCategory(e.target.value as Announcement["category"])
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    {["General", "Class", "Exam", "Holiday", "Event", "Administrative"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Target Class
                  </label>
                  <select
                    value={annTargetClassId}
                    onChange={(e) => setAnnTargetClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    <option value="">All Makdisi School</option>
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                />
                Pin announcement to top
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Publish announcement
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-3">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Active Announcements ({db.announcements.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
              {db.announcements.map((ann) => (
                <div key={ann.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                      {ann.category} · {ann.publishedAt}
                    </div>
                    <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                      {ann.title}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {ann.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({
                        type: "announcement",
                        id: ann.id,
                        label: ann.title,
                      })
                    }
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 shrink-0"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB: CLUBS */}
      {tab === "clubs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Create Campus Club
            </h3>
            <form onSubmit={handleCreateClub} className="space-y-3">
              <input
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Club name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={clubCategory}
                  onChange={(e) => setClubCategory(e.target.value)}
                  placeholder="Category"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
                <input
                  type="text"
                  value={clubSchedule}
                  onChange={(e) => setClubSchedule(e.target.value)}
                  placeholder="Day (e.g., Fridays)"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={clubTime}
                  onChange={(e) => setClubTime(e.target.value)}
                  placeholder="Meeting time"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
                <input
                  type="text"
                  value={clubLocation}
                  onChange={(e) => setClubLocation(e.target.value)}
                  placeholder="Location"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <input
                type="text"
                value={clubAdvisor}
                onChange={(e) => setClubAdvisor(e.target.value)}
                placeholder="Faculty advisor"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <textarea
                rows={3}
                required
                value={clubDesc}
                onChange={(e) => setClubDesc(e.target.value)}
                placeholder="Club mission and activities..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create club
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-3">
            <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
              Registered Makdisi Clubs ({db.clubs.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {db.clubs.map((club) => (
                <div key={club.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#080B12] dark:text-white">
                      {club.name} ·{" "}
                      <span className="font-normal text-xs text-[#2563EB] dark:text-[#60A5FA]">
                        {club.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {club.schedule} · {club.meetingTime} · {club.location} ·{" "}
                      {club.memberIds.length} members
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {club.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({
                        type: "club",
                        id: club.id,
                        label: club.name,
                      })
                    }
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 shrink-0"
                    aria-label="Delete club"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Confirm Removal"
        description={`Are you sure you want to remove "${confirmDelete?.label}"?`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "announcement") deleteAnnouncement(confirmDelete.id);
          if (confirmDelete.type === "club") deleteClub(confirmDelete.id);
          if (confirmDelete.type === "slot") deleteTimetableSlot(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
