import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, TrendingUp } from "lucide-react";
import { useSchool } from "../../context/SchoolContext";

export function GradesPage() {
  const { currentUser, db } = useSchool();
  const [semesterFilter, setSemesterFilter] = useState<"All" | "Semester 1" | "Semester 2">("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  if (!currentUser || currentUser.role !== "student") return null;

  const myGrades = useMemo(() => {
    return db.grades
      .filter((g) => g.studentId === currentUser.id)
      .filter((g) => semesterFilter === "All" || g.semester === semesterFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [db.grades, currentUser.id, semesterFilter]);

  const subjectSummaries = useMemo(() => {
    const map = new Map<
      string,
      { subjectName: string; scores: number[]; coefficient: number; count: number }
    >();
    for (const g of myGrades) {
      const normalized = (g.score / g.maxScore) * 20;
      const existing = map.get(g.subjectName);
      if (existing) {
        existing.scores.push(normalized);
        existing.count += 1;
      } else {
        map.set(g.subjectName, {
          subjectName: g.subjectName,
          scores: [normalized],
          coefficient: g.coefficient,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).map((entry) => ({
      subject: entry.subjectName,
      shortName: entry.subjectName.split(" ")[0],
      average: Number(
        (entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length).toFixed(2),
      ),
      coefficient: entry.coefficient,
      count: entry.count,
    }));
  }, [myGrades]);

  const overallAverage = useMemo(() => {
    if (subjectSummaries.length === 0) return 0;
    const weighted = subjectSummaries.reduce(
      (acc, s) => acc + s.average * s.coefficient,
      0,
    );
    const totalCoeff = subjectSummaries.reduce((acc, s) => acc + s.coefficient, 0);
    return totalCoeff > 0 ? weighted / totalCoeff : 0;
  }, [subjectSummaries]);

  const progressTimeline = useMemo(() => {
    return myGrades.map((g) => ({
      date: g.date.slice(5),
      score: Number(((g.score / g.maxScore) * 20).toFixed(2)),
      label: `${g.subjectName}: ${g.assessmentTitle}`,
    }));
  }, [myGrades]);

  const filteredTableGrades = useMemo(() => {
    return myGrades
      .filter((g) => selectedSubject === "All" || g.subjectName === selectedSubject)
      .slice()
      .reverse();
  }, [myGrades, selectedSubject]);

  const highestSubject = useMemo(() => {
    if (subjectSummaries.length === 0) return null;
    return subjectSummaries.reduce((best, cur) => (cur.average > best.average ? cur : best));
  }, [subjectSummaries]);

  return (
    <div className="space-y-6">
      {/* Top Filters & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Grades & Academic Progress</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Private academic record for {currentUser.fullName} · {currentUser.academicLevel}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-[#101C35] self-start">
          {(["All", "Semester 1", "Semester 2"] as const).map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSemesterFilter(sem)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                semesterFilter === sem
                  ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {sem}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Weighted Overall Average</span>
            <Award className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {overallAverage.toFixed(2)} <span className="text-base font-normal text-slate-400">/ 20</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {overallAverage >= 16
              ? "Honors standing"
              : overallAverage >= 12
                ? "Good academic standing"
                : "Needs targeted review"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Strongest Subject</span>
            <TrendingUp className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 font-display text-xl font-bold truncate">
            {highestSubject ? highestSubject.subject : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {highestSubject ? `${highestSubject.average.toFixed(2)} / 20 average` : "No grades yet"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Graded Assessments</div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">{myGrades.length}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {subjectSummaries.length} subjects
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
          <h3 className="font-display text-base font-semibold">Subject Averages (/20)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare your current average across Makdisi School subjects
          </p>
          <div className="mt-5 h-64 w-full">
            {subjectSummaries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No grades available for this filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectSummaries} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="shortName" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
          <h3 className="font-display text-base font-semibold">Assessment Trend Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological trajectory of all graded tests and projects
          </p>
          <div className="mt-5 h-64 w-full">
            {progressTimeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No timeline points yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTimeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563EB" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Subject Cards + Detailed Feedback Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold">
            Detailed Grades & Teacher Feedback
          </h3>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            aria-label="Filter by subject"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#080B12] dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
          >
            <option value="All">All subjects</option>
            {subjectSummaries.map((s) => (
              <option key={s.subject} value={s.subject}>
                {s.subject} ({s.average.toFixed(1)}/20)
              </option>
            ))}
          </select>
        </div>

        {filteredTableGrades.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No assessments match this filter.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Date</th>
                  <th className="py-2.5 pr-4 font-medium">Subject</th>
                  <th className="py-2.5 pr-4 font-medium">Assessment</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Coeff</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Score</th>
                  <th className="py-2.5 font-medium">Teacher Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTableGrades.map((g) => (
                  <tr key={g.id} className="align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {g.date}
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#080B12] dark:text-white whitespace-nowrap">
                      {g.subjectName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-200">
                      {g.assessmentTitle}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      {g.coefficient}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-semibold tabular-nums text-[#2563EB] dark:text-[#60A5FA] whitespace-nowrap">
                      {g.score.toFixed(1)}/{g.maxScore}
                    </td>
                    <td className="py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                      {g.feedback}
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
