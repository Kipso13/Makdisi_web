import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { SCHOOL_CONFIG } from "../config/schoolConfig";
import { useSchool } from "../context/SchoolContext";
import { useTheme } from "../context/ThemeContext";
import { CAMPUS_IMAGES } from "../db/demoData";
import type { UserRole } from "../db/types";

type AuthMode = "signin" | "register" | "forgot";

export function LandingPage() {
  const { db, signIn, signInDemoUser, register, notify } = useSchool();
  const { theme, toggleTheme } = useTheme();

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [rolePreview, setRolePreview] = useState<UserRole>("student");

  // Auth form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("student");
  const [regClassId, setRegClassId] = useState(db.classes[0]?.id || "cls-1bac-sm-a");
  const [regDepartment, setRegDepartment] = useState("Mathematics");
  const [formError, setFormError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const publicAnnouncements = db.announcements
    .filter((a) => !a.targetClassId)
    .slice(0, 3);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (authMode === "signin") {
      if (!email.trim() || !password) {
        setFormError("Please enter your Makdisi School email and password.");
        return;
      }
      const res = signIn(email, password);
      if (!res.ok) setFormError(res.error || "Sign in failed.");
      return;
    }

    if (authMode === "register") {
      if (!fullName.trim() || !email.trim() || password.length < 6) {
        setFormError("Enter your full name, school email, and a password of at least 6 characters.");
        return;
      }
      const res = register({
        fullName,
        email,
        password,
        role: regRole,
        classId: regRole === "student" ? regClassId : undefined,
        department: regRole !== "student" ? regDepartment : undefined,
      });
      if (!res.ok) setFormError(res.error || "Registration failed.");
      return;
    }

    if (authMode === "forgot") {
      if (!email.trim()) {
        setFormError("Enter your Makdisi School email to receive reset instructions.");
        return;
      }
      setForgotSent(true);
      notify("Password reset instructions prepared for your email.", "info");
    }
  };

  const scrollToSignIn = () => {
    document.getElementById("portal-signin")?.scrollIntoView({ behavior: "smooth" });
  };

  const roleDetails: Record<
    UserRole,
    { title: string; summary: string; capabilities: string[] }
  > = {
    student: {
      title: "Personalized Student Workspace",
      summary:
        "Everything tailored to your academic year and class at Makdisi School—from weighted averages to class representative support.",
      capabilities: [
        "Grades & Progress charts with subject averages and teacher feedback",
        "Attendance log tracking absences, late arrivals, and justification status",
        "Private 1-to-1 messaging with teachers and homework file sharing",
        "AI-guided Problems & Suggestions chat routed privately to your class Vice Representative",
      ],
    },
    teacher: {
      title: "Class & Student Oversight for Teachers",
      summary:
        "Switch smoothly between your assigned Makdisi School classes to review authorized student records and publish updates.",
      capabilities: [
        "Assigned classes view with live student rosters and academic summaries",
        "Publish grades with rubric feedback and record attendance or late arrivals",
        "Direct private conversations and file sharing with your students",
        "Structured database adapter ready for your Supabase or PostgreSQL connection",
      ],
    },
    admin: {
      title: "Makdisi School Administration Console",
      summary:
        "Full operational control across classes, clubs, timetables, announcements, and class representative report oversight.",
      capabilities: [
        "Manage student enrollments, teacher assignments, and class Vice Representatives",
        "Create and schedule campus clubs, timetables, and school-wide announcements",
        "Role-restricted oversight of Problems & Suggestions reports across all classes",
        "Community resource moderation and campus-wide analytics charts",
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white text-[#080B12] dark:bg-[#080B12] dark:text-white">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-[#080B12]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#080B12] dark:text-white whitespace-nowrap shrink-0"
          >
            {SCHOOL_CONFIG.appName}
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#overview"
              className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#portal-signin"
              className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0"
            >
              Portals
            </a>
            <a
              href="#bulletin"
              className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0"
            >
              Bulletin
            </a>
            <a
              href="#clubs"
              className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0"
            >
              Clubs
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={scrollToSignIn}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="sp-hero-gradient border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Copy */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  {SCHOOL_CONFIG.schoolName} · {SCHOOL_CONFIG.academicYear}
                </p>
                <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#080B12] dark:text-white leading-[1.12] [text-wrap:balance]">
                  Academic clarity and campus life for Makdisi School.
                </h1>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                  School Plus connects students, teachers, class vice representatives, and school
                  administrators in one focused digital workspace—with role-personalized dashboards,
                  live progress charts, private teacher messaging, and guided class support.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={scrollToSignIn}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors sp-blue-glow whitespace-nowrap shrink-0"
                  >
                    <span>Sign in to School Plus</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
                  </button>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Role-based access control</span>
                <span aria-hidden="true">·</span>
                <span>Private class vice rep routing</span>
                <span aria-hidden="true">·</span>
                <span>Database-ready architecture</span>
              </div>
            </div>

            {/* Right Campus Photography */}
            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <ImageWithFallback
                  src={CAMPUS_IMAGES.hero}
                  alt="Makdisi School courtyard and academic buildings"
                  fallbackTitle="Makdisi School Campus"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B12]/80 via-[#080B12]/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                  <div className="text-xs font-medium text-[#60A5FA]">
                    Makdisi School Campus Portal
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold">
                    Built for Tronc Commun, 1ère Bac, and 2ème Bac
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Campus Snapshot Row */}
          <div
            id="overview"
            className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101C35]/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">Academic Tracks</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
                {db.classes.length} Classes
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Level-adapted dashboards
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101C35]/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">Campus Clubs</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
                {db.clubs.length} Active
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Robotics, Debate, STEM & Chess
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101C35]/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">Learning Library</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
                {db.communityPosts.length} Resources
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Teacher & peer study guides
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101C35]/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">Student Support</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#080B12] dark:text-white">
                Private Inbox
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                AI-guided Vice Rep routing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Tailored Portal Overview + Functional Sign-In Section */}
      <section id="portal-signin" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Interactive Role Explorer */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                Role-Adapted Experience
              </p>
              <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight">
                One platform, tailored to your role at Makdisi School
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                After signing in, School Plus opens the exact tools and private records you are
                authorized to access.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Preview portal by role"
              className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-[#101C35]"
            >
              {(["student", "teacher", "admin"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={rolePreview === r}
                  onClick={() => setRolePreview(r)}
                  className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    rolePreview === r
                      ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                      : "text-slate-600 hover:text-[#080B12] dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {r === "student" ? "Student" : r === "teacher" ? "Teacher" : "Administrator"}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-[#101C35]/50">
              <h3 className="font-display text-lg font-semibold text-[#080B12] dark:text-white">
                {roleDetails[rolePreview].title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {roleDetails[rolePreview].summary}
              </p>
              <ul className="mt-5 space-y-3">
                {roleDetails[rolePreview].capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA] mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200">{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Demo Account Access */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#080B12] dark:text-white">
                    Instant Demo Access (Sample Data Mode)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Test any Makdisi School role directly—no password required for demo previews.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => signInDemoUser("stu-adam")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left hover:border-[#2563EB] hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-[#60A5FA] dark:hover:bg-[#101C35] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold">Adam Rami</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Student · 1ère Bac SM A
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                </button>

                <button
                  type="button"
                  onClick={() => signInDemoUser("stu-lina")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left hover:border-[#2563EB] hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-[#60A5FA] dark:hover:bg-[#101C35] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold">Lina Benali</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Student · Class Vice Rep
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                </button>

                <button
                  type="button"
                  onClick={() => signInDemoUser("tch-nadia")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left hover:border-[#2563EB] hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-[#60A5FA] dark:hover:bg-[#101C35] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold">Dr. Nadia Haddad</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Teacher · Mathematics
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                </button>

                <button
                  type="button"
                  onClick={() => signInDemoUser("adm-tariq")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left hover:border-[#2563EB] hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-[#60A5FA] dark:hover:bg-[#101C35] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold">Tariq Makdisi</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Administrator · School Director
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sign In / Register / Forgot Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-[#0c1322]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#080B12] dark:text-white">
                    {authMode === "signin"
                      ? "Sign in to School Plus"
                      : authMode === "register"
                        ? "Create Makdisi School Account"
                        : "Reset your password"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {SCHOOL_CONFIG.schoolName} Digital Portal
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-[#101C35]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setFormError("");
                      setForgotSent(false);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      authMode === "signin"
                        ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setFormError("");
                      setForgotSent(false);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      authMode === "register"
                        ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                {authMode === "register" ? (
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Karim Mansour"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                    />
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    School Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@makdisischool.edu"
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                    />
                  </div>
                </div>

                {authMode !== "forgot" ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Password
                      </label>
                      {authMode === "signin" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("forgot");
                            setFormError("");
                          }}
                          className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (demo: Password123!)"
                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                      />
                    </div>
                  </div>
                ) : null}

                {authMode === "register" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-role"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Account Role
                      </label>
                      <select
                        id="reg-role"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {regRole === "student" ? (
                      <div>
                        <label
                          htmlFor="reg-class"
                          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Class & Academic Year
                        </label>
                        <select
                          id="reg-class"
                          value={regClassId}
                          onChange={(e) => setRegClassId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                        >
                          {db.classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="reg-dept"
                          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Department
                        </label>
                        <input
                          id="reg-dept"
                          type="text"
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                ) : null}

                {formError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {formError}
                  </div>
                ) : null}

                {forgotSent && authMode === "forgot" ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
                    If {email} matches a Makdisi School account, password reset guidance is
                    ready. When you connect Supabase Auth or your backend mailer, real reset links
                    will be dispatched automatically.
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {authMode === "signin"
                    ? "Sign In"
                    : authMode === "register"
                      ? "Create Account"
                      : "Send Reset Instructions"}
                </button>

                {authMode === "forgot" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setForgotSent(false);
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-[#080B12] dark:text-slate-400 dark:hover:text-white"
                  >
                    Back to sign in
                  </button>
                ) : null}
              </form>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Sample sign-in credentials: <span className="font-mono">adam.rami@makdisischool.edu</span>{" "}
                / <span className="font-mono">Password123!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Bulletin & Feature Highlights */}
      <section
        id="bulletin"
        className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-[#0c1322]/60 py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                Makdisi School Bulletin
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                Campus Announcements & Key Dates
              </h2>
            </div>
            <button
              type="button"
              onClick={scrollToSignIn}
              className="text-sm font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap shrink-0"
            >
              Sign in for class-specific schedules
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicAnnouncements.map((ann) => (
              <article
                key={ann.id}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#101C35]/60 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{ann.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{ann.publishedAt}</span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-[#080B12] dark:text-white">
                    {ann.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.body}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Posted by {ann.authorName}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs Spotlight */}
      <section id="clubs" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              Student Life at Makdisi School
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              Clubs & Societies
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sign in as a student to join clubs and view meeting updates
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {db.clubs.map((club) => (
            <div
              key={club.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] flex flex-col"
            >
              <div className="h-40 overflow-hidden bg-slate-100 dark:bg-[#101C35]">
                <ImageWithFallback
                  src={club.imageUrl}
                  alt={club.name}
                  fallbackTitle={club.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-medium">
                    {club.category}
                  </div>
                  <h3 className="mt-1 font-display text-base font-semibold text-[#080B12] dark:text-white">
                    {club.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {club.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>
                    {club.schedule} · <span className="tabular-nums">{club.meetingTime}</span>
                  </div>
                  <div className="truncate">{club.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080B12]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {SCHOOL_CONFIG.appName} — {SCHOOL_CONFIG.schoolName} ({SCHOOL_CONFIG.academicYear})
          </div>
          <div className="flex items-center gap-6">
            <span>{SCHOOL_CONFIG.supportEmail}</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-[#080B12] dark:hover:text-white"
            >
              {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
