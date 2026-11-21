import React, { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Database,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "../../components/common/Avatar";
import type { AppViewId } from "../../components/layout/AppShell";
import { SCHOOL_CONFIG } from "../../config/schoolConfig";
import { useSchool } from "../../context/SchoolContext";
import {
  canAccessClassDetails,
  canViewStudentPrivateRecords,
} from "../../db/databaseAdapter";
import type { AttendanceType, JustificationStatus, UserAccount } from "../../db/types";

interface TeacherDashboardProps {
  onNavigate: (view: AppViewId) => void;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const {
    currentUser,
    db,
    addGrade,
    recordAttendance,
    updateAttendanceStatus,
    publishAnnouncement,
    sendMessage,
    notify,
  } = useSchool();

  if (!currentUser || currentUser.role !== "teacher") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c1322]">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Teacher access is required to view assigned classes and student academic records.
        </p>
      </div>
    );
  }

  const assignedClasses = useMemo(
    () => db.classes.filter((cls) => canAccessClassDetails(currentUser, cls)),
    [db.classes, currentUser],
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(
    assignedClasses[0]?.id || "",
  );
  const selectedClass =
    assignedClasses.find((c) => c.id === selectedClassId) || assignedClasses[0] || null;

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modals
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  // Grade form
  const teacherSubjects = useMemo(
    () => db.subjects.filter((s) => s.teacherId === currentUser.id),
    [db.subjects, currentUser.id],
  );
  const defaultSubject = teacherSubjects[0] || db.subjects[0];

  const [gradeSubjectId, setGradeSubjectId] = useState(defaultSubject?.id || "");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeScore, setGradeScore] = useState("16");
  const [gradeMaxScore, setGradeMaxScore] = useState("20");
  const [gradeSemester, setGradeSemester] = useState<"Semester 1" | "Semester 2">(
    "Semester 1",
  );
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Attendance form
  const [attSubject, setAttSubject] = useState(
    currentUser.department || defaultSubject?.name || "Class Session",
  );
  const [attType, setAttType] = useState<AttendanceType>("absent");
  const [attHours, setAttHours] = useState("1");
  const [attStatus, setAttStatus] = useState<JustificationStatus>("pending");
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attNote, setAttNote] = useState("");

  // Announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCategory, setAnnCategory] = useState<"Class" | "Exam">("Class");

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const q = studentSearch.trim().toLowerCase();
    return db.users
      .filter(
        (u) =>
          u.role === "student" &&
          u.classId === selectedClass.id &&
          canViewStudentPrivateRecords(currentUser, u.id, selectedClass.id),
      )
      .filter(
        (u) =>
          !q ||
          u.fullName.toLowerCase().includes(q) ||
          (u.studentNumber?.toLowerCase().includes(q) ?? false),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [db.users, selectedClass, currentUser, studentSearch]);

  const activeStudent: UserAccount | null = useMemo(() => {
    if (selectedStudentId) {
      return classStudents.find((s) => s.id === selectedStudentId) || classStudents[0] || null;
    }
    return classStudents[0] || null;
  }, [classStudents, selectedStudentId]);

  const getStudentAverage = (studentId: string) => {
    const records = db.grades.filter((g) => g.studentId === studentId);
    if (records.length === 0) return null;
    const weighted = records.reduce(
      (acc, g) => acc + (g.score / g.maxScore) * 20 * g.coefficient,
      0,
    );
    const totalCoeff = records.reduce((acc, g) => acc + g.coefficient, 0);
    return totalCoeff > 0 ? weighted / totalCoeff : null;
  };

  const getStudentMissedHours = (studentId: string) => {
    return db.attendance
      .filter((a) => a.studentId === studentId)
      .reduce((acc, a) => acc + a.missedHours, 0);
  };

  const activeStudentGrades = useMemo(() => {
    if (!activeStudent || !selectedClass) return [];
    if (!canViewStudentPrivateRecords(currentUser, activeStudent.id, selectedClass.id)) {
      return [];
    }
    return db.grades
      .filter((g) => g.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db.grades, activeStudent, selectedClass, currentUser]);

  const activeStudentAttendance = useMemo(() => {
    if (!activeStudent || !selectedClass) return [];
    if (!canViewStudentPrivateRecords(currentUser, activeStudent.id, selectedClass.id)) {
      return [];
    }
    return db.attendance
      .filter((a) => a.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db.attendance, activeStudent, selectedClass, currentUser]);

  const classAnnouncements = useMemo(() => {
    if (!selectedClass) return [];
    return db.announcements.filter((a) => a.targetClassId === selectedClass.id);
  }, [db.announcements, selectedClass]);

  const viceRep = useMemo(() => {
    if (!selectedClass?.viceRepresentativeId) return null;
    return db.users.find((u) => u.id === selectedClass.viceRepresentativeId) || null;
  }, [db.users, selectedClass]);

  const handlePublishGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !selectedClass) return;
    const subj = db.subjects.find((s) => s.id === gradeSubjectId) || defaultSubject;
    const parsedScore = Number(gradeScore);
    const parsedMax = Number(gradeMaxScore) || 20;
    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > parsedMax) {
      notify(`Score must be between 0 and ${parsedMax}.`, "error");
      return;
    }

    addGrade({
      studentId: activeStudent.id,
      classId: selectedClass.id,
      subjectId: subj?.id || "subj-general",
      subjectName: subj?.name || currentUser.department || "Subject",
      assessmentTitle: gradeTitle.trim() || "Class Evaluation",
      semester: gradeSemester,
      score: parsedScore,
      maxScore: parsedMax,
      coefficient: subj?.coefficient || 2,
      date: new Date().toISOString().slice(0, 10),
      feedback: gradeFeedback.trim() || "Evaluated by teacher.",
      teacherId: currentUser.id,
    });
    setGradeTitle("");
    setGradeFeedback("");
    setGradeModalOpen(false);
  };

  const handleRecordAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !selectedClass) return;
    recordAttendance({
      studentId: activeStudent.id,
      classId: selectedClass.id,
      date: attDate,
      subjectName: attSubject.trim() || "Class Session",
      type: attType,
      missedHours: Math.max(0.5, Number(attHours) || 1),
      status: attStatus,
      note: attNote.trim() || "Recorded during class roll call.",
      recordedBy: currentUser.fullName,
    });
    setAttNote("");
    setAttendanceModalOpen(false);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !annTitle.trim() || !annBody.trim()) return;
    publishAnnouncement({
      title: annTitle.trim(),
      body: annBody.trim(),
      category: annCategory,
      targetClassId: selectedClass.id,
      targetLevel: selectedClass.academicLevel,
      authorName: currentUser.fullName,
      authorRole: "teacher",
    });
    setAnnTitle("");
    setAnnBody("");
    setAnnouncementModalOpen(false);
  };

  const handleQuickMessageStudent = () => {
    if (!activeStudent) return;
    sendMessage({
      studentId: activeStudent.id,
      teacherId: currentUser.id,
      subjectLabel: currentUser.department || "Academic Follow-up",
      text: `Hello ${activeStudent.fullName}, please check your latest update in ${selectedClass?.name || "class"}.`,
    });
    onNavigate("messages");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size="lg" />
            <div>
              <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                Faculty Workspace · {currentUser.department || "Teaching Staff"}
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#080B12] dark:text-white">
                {currentUser.fullName}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {assignedClasses.length} assigned Makdisi School classes · Role-authorized student
                academic access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-[#101C35] dark:text-slate-300">
            <Database className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
            <span>
              Data adapter: <strong className="font-mono">{SCHOOL_CONFIG.dataProvider}</strong>{" "}
              (ready to swap in <code className="font-mono">src/db/databaseAdapter.ts</code>)
            </span>
          </div>
        </div>
      </section>

      {/* Assigned Classes Selector */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>Assigned Classes</span>
          </h3>
          {selectedClass ? (
            <button
              type="button"
              onClick={() => setAnnouncementModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0c1322] dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <Megaphone className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Post class announcement</span>
            </button>
          ) : null}
        </div>

        {assignedClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#0c1322]">
            No classes are currently assigned to your teacher account. Contact an administrator to
            assign classes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignedClasses.map((cls) => {
              const count = db.users.filter(
                (u) => u.role === "student" && u.classId === cls.id,
              ).length;
              const isSelected = selectedClass?.id === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedStudentId(null);
                  }}
                  className={`text-left rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? "border-[#2563EB] bg-blue-50/50 dark:border-[#60A5FA] dark:bg-[#101C35]"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#0c1322]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                      {cls.academicLevel}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {cls.room}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-lg font-bold text-[#080B12] dark:text-white">
                    {cls.name}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="tabular-nums">{count} enrolled students</span>
                    <span>{isSelected ? "Viewing roster" : "Select class"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Class Student Roster + Authorized Student Details */}
      {selectedClass ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Student List */}
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <h4 className="font-display text-base font-semibold text-[#080B12] dark:text-white">
                    {selectedClass.name} Roster
                  </h4>
                </div>
                {viceRep ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Vice Rep: {viceRep.fullName}
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter students by name or ID..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
              {classStudents.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No students match your search in {selectedClass.name}.
                </div>
              ) : (
                classStudents.map((stu) => {
                  const avg = getStudentAverage(stu.id);
                  const missed = getStudentMissedHours(stu.id);
                  const selected = activeStudent?.id === stu.id;

                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => setSelectedStudentId(stu.id)}
                      className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${
                        selected
                          ? "bg-blue-50/70 dark:bg-[#101C35]"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={stu.fullName} avatarUrl={stu.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#080B12] dark:text-white truncate">
                            {stu.fullName}
                            {stu.isViceRepresentative ? (
                              <span className="ml-1.5 text-[11px] font-medium text-[#2563EB] dark:text-[#60A5FA]">
                                · Vice Rep
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {stu.studentNumber || stu.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <div className="text-xs font-semibold text-[#080B12] dark:text-white">
                          {avg !== null ? `${avg.toFixed(2)}/20` : "No grades"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {missed}h missed
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Student Academic Detail Panel */}
          <section className="lg:col-span-7 space-y-5">
            {!activeStudent ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c1322]">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select a student from {selectedClass.name} to view authorized grades and
                  attendance records.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        name={activeStudent.fullName}
                        avatarUrl={activeStudent.avatarUrl}
                        size="md"
                      />
                      <div>
                        <h4 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                          {activeStudent.fullName}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedClass.name} ·{" "}
                          <span className="font-mono">{activeStudent.studentNumber}</span> ·{" "}
                          {activeStudent.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setGradeModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add grade</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35] whitespace-nowrap"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Log attendance</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickMessageStudent}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35] whitespace-nowrap"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Award className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                      <h5 className="text-sm font-semibold text-[#080B12] dark:text-white">
                        Academic Grades ({activeStudentGrades.length})
                      </h5>
                    </div>
                    {activeStudentGrades.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No grades recorded yet for this student.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                              <th className="py-2 pr-3 font-medium">Subject</th>
                              <th className="py-2 pr-3 font-medium">Assessment</th>
                              <th className="py-2 pr-3 font-medium">Score</th>
                              <th className="py-2 font-medium">Teacher Feedback</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeStudentGrades.map((g) => (
                              <tr key={g.id}>
                                <td className="py-2.5 pr-3 font-medium text-[#080B12] dark:text-white">
                                  {g.subjectName}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                                  {g.assessmentTitle} · {g.date}
                                </td>
                                <td className="py-2.5 pr-3 font-semibold tabular-nums text-[#2563EB] dark:text-[#60A5FA]">
                                  {g.score}/{g.maxScore}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300">
                                  {g.feedback}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Attendance Records */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2.5">
                      <BookOpen className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                      <h5 className="text-sm font-semibold text-[#080B12] dark:text-white">
                        Attendance & Justification Log ({activeStudentAttendance.length})
                      </h5>
                    </div>
                    {activeStudentAttendance.length === 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Perfect attendance recorded.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeStudentAttendance.map((att) => (
                          <div
                            key={att.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-[#101C35]/40 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-[#080B12] dark:text-white capitalize">
                                {att.type} · {att.subjectName} ({att.missedHours}h)
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {att.date} · {att.note}
                              </div>
                            </div>
                            <select
                              value={att.status}
                              onChange={(e) =>
                                updateAttendanceStatus(
                                  att.id,
                                  e.target.value as JustificationStatus,
                                )
                              }
                              aria-label="Update justification status"
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                            >
                              <option value="justified">Justified</option>
                              <option value="pending">Pending</option>
                              <option value="unjustified">Unjustified</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Class Announcements */}
                {classAnnouncements.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322] space-y-2.5">
                    <h5 className="text-sm font-semibold text-[#080B12] dark:text-white">
                      {selectedClass.name} Announcements
                    </h5>
                    {classAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-xl bg-slate-50 dark:bg-[#101C35]/50 p-3 text-xs"
                      >
                        <div className="font-semibold text-[#080B12] dark:text-white">
                          {ann.title} ·{" "}
                          <span className="font-normal text-slate-500">{ann.publishedAt}</span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{ann.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      ) : null}

      {/* Add Grade Modal */}
      {gradeModalOpen && activeStudent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                Publish Grade · {activeStudent.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setGradeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePublishGrade} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={gradeSubjectId}
                  onChange={(e) => setGradeSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                >
                  {db.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Coeff. {s.coefficient})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={gradeTitle}
                  onChange={(e) => setGradeTitle(e.target.value)}
                  placeholder="e.g., Unit 3 Exam"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Out of
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={gradeMaxScore}
                    onChange={(e) => setGradeMaxScore(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={gradeSemester}
                    onChange={(e) =>
                      setGradeSemester(e.target.value as "Semester 1" | "Semester 2")
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    <option value="Semester 1">S1</option>
                    <option value="Semester 2">S2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Personalized Teacher Feedback
                </label>
                <textarea
                  rows={2}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Share constructive feedback..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradeModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save grade
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Log Attendance Modal */}
      {attendanceModalOpen && activeStudent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                Record Attendance · {activeStudent.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleRecordAttendance} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={attType}
                    onChange={(e) => setAttType(e.target.value as AttendanceType)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    <option value="absent">Absence</option>
                    <option value="late">Late Arrival</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Missed Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={attHours}
                    onChange={(e) => setAttHours(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Justification
                  </label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as JustificationStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="unjustified">Unjustified</option>
                    <option value="justified">Justified</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={attSubject}
                  onChange={(e) => setAttSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={attNote}
                  onChange={(e) => setAttNote(e.target.value)}
                  placeholder="Optional roll-call note..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save record
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Class Announcement Modal */}
      {announcementModalOpen && selectedClass ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                Announcement for {selectedClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePublishAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as "Class" | "Exam")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                >
                  <option value="Class">Class Notice</option>
                  <option value="Exam">Exam Reminder</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g., Lab Safety Briefing Tomorrow"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
