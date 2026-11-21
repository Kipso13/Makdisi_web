import React, { useMemo } from "react";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Clock,
  Inbox,
  MessageSquare,
  Sparkles,
  Video,
} from "lucide-react";
import { Avatar } from "../../components/common/Avatar";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import type { AppViewId } from "../../components/layout/AppShell";
import { useSchool } from "../../context/SchoolContext";

interface StudentDashboardProps {
  onNavigate: (view: AppViewId) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { currentUser, db } = useSchool();

  if (!currentUser || currentUser.role !== "student") return null;

  const studentClass = db.classes.find((c) => c.id === currentUser.classId);

  const myGrades = useMemo(
    () => db.grades.filter((g) => g.studentId === currentUser.id),
    [db.grades, currentUser.id],
  );

  const overallAverage = useMemo(() => {
    if (myGrades.length === 0) return 0;
    const weightedSum = myGrades.reduce(
      (acc, g) => acc + (g.score / g.maxScore) * 20 * g.coefficient,
      0,
    );
    const totalCoeff = myGrades.reduce((acc, g) => acc + g.coefficient, 0);
    return totalCoeff > 0 ? weightedSum / totalCoeff : 0;
  }, [myGrades]);

  const myAttendance = useMemo(
    () => db.attendance.filter((a) => a.studentId === currentUser.id),
    [db.attendance, currentUser.id],
  );

  const totalMissedHours = useMemo(
    () => myAttendance.reduce((acc, a) => acc + a.missedHours, 0),
    [myAttendance],
  );

  const upcomingItems = useMemo(
    () =>
      db.upcoming.filter(
        (item) =>
          item.classId === currentUser.classId ||
          item.academicLevel === currentUser.academicLevel,
      ),
    [db.upcoming, currentUser.classId, currentUser.academicLevel],
  );

  const relevantAnnouncements = useMemo(
    () =>
      db.announcements
        .filter(
          (a) =>
            !a.targetClassId ||
            a.targetClassId === currentUser.classId ||
            a.targetLevel === "All Levels" ||
            a.targetLevel === currentUser.academicLevel,
        )
        .slice(0, 4),
    [db.announcements, currentUser.classId, currentUser.academicLevel],
  );

  const myConversations = useMemo(
    () => db.conversations.filter((c) => c.studentId === currentUser.id),
    [db.conversations, currentUser.id],
  );

  const recommendedPosts = useMemo(
    () =>
      db.communityPosts
        .filter(
          (p) =>
            p.academicLevel === "All Levels" ||
            p.academicLevel === currentUser.academicLevel,
        )
        .slice(0, 3),
    [db.communityPosts, currentUser.academicLevel],
  );

  const viceRepClassReports = useMemo(() => {
    if (!currentUser.isViceRepresentative || !currentUser.viceRepClassId) return [];
    return db.reports.filter(
      (r) => r.classId === currentUser.viceRepClassId && r.status === "submitted",
    );
  }, [db.reports, currentUser]);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size="lg" />
            <div>
              <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-medium">
                {studentClass?.name || currentUser.academicLevel} ·{" "}
                <span className="font-mono">{currentUser.studentNumber || "Student"}</span>
                {currentUser.isViceRepresentative ? " · Class Vice Representative" : ""}
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#080B12] dark:text-white">
                Welcome back, {currentUser.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                Makdisi School · {studentClass?.room || "Campus"} · Tailored to your{" "}
                {currentUser.academicLevel} track
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("reports")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Problems & Suggestions</span>
            </button>
            {currentUser.isViceRepresentative ? (
              <button
                type="button"
                onClick={() => onNavigate("vice-rep-inbox")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-[#080B12] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#101C35] dark:text-white dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Inbox className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>Vice Rep Inbox ({viceRepClassReports.length} new)</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* 4 Key Academic KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate("grades")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-[#0c1322] dark:hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Weighted Overall Average</span>
            <Award className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {overallAverage.toFixed(2)} / 20
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {myGrades.length} graded assessments
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("attendance")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-[#0c1322] dark:hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Missed Hours</span>
            <Clock className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {totalMissedHours.toFixed(1)} hrs
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {myAttendance.filter((a) => a.status === "unjustified").length} unjustified records
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("class")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-[#0c1322] dark:hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Upcoming Exams & Tasks</span>
            <CalendarDays className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {upcomingItems.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Next due: {upcomingItems[0]?.dueDate || "None scheduled"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("messages")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-[#0c1322] dark:hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Teacher Conversations</span>
            <MessageSquare className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
            {myConversations.length} Active
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {myConversations.reduce((s, c) => s + c.unreadForStudent, 0)} unread messages
          </div>
        </button>
      </section>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Exams & Assignments */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold">
                Upcoming Exams & Assignments
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("class")}
                className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap"
              >
                Class timetable
              </button>
            </div>
            {upcomingItems.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No upcoming exams or assignments posted for your class yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-[#2563EB] dark:text-[#60A5FA]">
                          {item.kind === "exam" ? "Exam" : "Assignment"}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.subjectName}</span>
                      </div>
                      <div className="mt-0.5 text-sm font-medium text-[#080B12] dark:text-white">
                        {item.title}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right shrink-0">
                      <div className="font-mono font-medium text-[#080B12] dark:text-slate-200">
                        {item.dueDate}
                      </div>
                      <div>{item.roomOrWeight}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Grades */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold">Latest Grades</h3>
              <button
                type="button"
                onClick={() => onNavigate("grades")}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline"
              >
                <span>Full breakdown</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {myGrades.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No grades recorded yet for this semester.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Assessment</th>
                      <th className="pb-2 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myGrades.slice(0, 5).map((g) => (
                      <tr key={g.id}>
                        <td className="py-2.5 font-medium text-[#080B12] dark:text-white">
                          {g.subjectName}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {g.assessmentTitle}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-[#2563EB] dark:text-[#60A5FA]">
                          {g.score.toFixed(1)}/{g.maxScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* School & Class Announcements */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold">
                Makdisi School Announcements
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("school-info")}
                className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline"
              >
                Info Center
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {relevantAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="pb-3.5 border-b last:border-b-0 last:pb-0 border-slate-100 dark:border-slate-800"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{ann.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{ann.publishedAt}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#080B12] dark:text-white">
                    {ann.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {ann.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Teacher Messages */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold">Recent Teacher Messages</h3>
              <button
                type="button"
                onClick={() => onNavigate("messages")}
                className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline"
              >
                Open inbox
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {myConversations.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No teacher conversations yet.
                </p>
              ) : (
                myConversations.map((conv) => {
                  const teacher = db.users.find((u) => u.id === conv.teacherId);
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => onNavigate("messages")}
                      className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-100 p-3 hover:border-[#2563EB] dark:border-slate-800 dark:hover:border-[#60A5FA] transition-colors"
                    >
                      <Avatar name={teacher?.fullName || "Teacher"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {teacher?.fullName || "Instructor"}
                          </span>
                          {conv.unreadForStudent > 0 ? (
                            <span className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] tabular-nums">
                              {conv.unreadForStudent} new
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {conv.lastMessagePreview}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Educational Videos for Student's Academic Level */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold">
              Recommended for {currentUser.academicLevel}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Educational videos and study guides curated for your academic level
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("community")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Explore Community</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onNavigate("community")}
              className="text-left overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition-colors flex flex-col"
            >
              <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-[#101C35]">
                <ImageWithFallback
                  src={post.thumbnailUrl}
                  alt={post.title}
                  fallbackTitle={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4 flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>{post.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{post.durationOrReadTime}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-[#080B12] dark:text-white line-clamp-2">
                  {post.title}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  By {post.authorName}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
