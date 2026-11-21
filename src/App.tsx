import React, { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { AppShell, type AppViewId } from "./components/layout/AppShell";
import { SchoolProvider, useSchool } from "./context/SchoolContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LandingPage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CommunityPage } from "./pages/shared/CommunityPage";
import { MessagesPage } from "./pages/shared/MessagesPage";
import { NotificationsPage } from "./pages/shared/NotificationsPage";
import { ProfilePage } from "./pages/shared/ProfilePage";
import { SchoolInfoPage } from "./pages/shared/SchoolInfoPage";
import { AttendancePage } from "./pages/student/AttendancePage";
import { ClassPage } from "./pages/student/ClassPage";
import { ClubsPage } from "./pages/student/ClubsPage";
import { GradesPage } from "./pages/student/GradesPage";
import { ProblemsSuggestionsPage } from "./pages/student/ProblemsSuggestionsPage";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { ViceRepInboxPage } from "./pages/student/ViceRepInboxPage";
import { TeacherDashboard } from "./pages/teacher/TeacherDashboard";

function defaultViewForRole(role: "student" | "teacher" | "admin"): AppViewId {
  if (role === "teacher") return "teacher-dashboard";
  if (role === "admin") return "admin-dashboard";
  return "dashboard";
}

function ToastViewport() {
  const { toasts, dismissToast } = useSchool();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.kind === "success"
            ? CheckCircle2
            : toast.kind === "error"
              ? XCircle
              : Info;
        const borderClass =
          toast.kind === "success"
            ? "border-emerald-200 dark:border-emerald-800"
            : toast.kind === "error"
              ? "border-red-200 dark:border-red-800"
              : "border-blue-200 dark:border-blue-800";
        const iconColor =
          toast.kind === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : toast.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-[#2563EB] dark:text-[#60A5FA]";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border ${borderClass} bg-white dark:bg-[#101C35] px-4 py-3 shadow-lg text-sm text-[#080B12] dark:text-white`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SchoolPlusRouter() {
  const { currentUser } = useSchool();
  const [activeView, setActiveView] = useState<AppViewId>("dashboard");

  useEffect(() => {
    if (currentUser) {
      setActiveView(defaultViewForRole(currentUser.role));
    }
  }, [currentUser?.id, currentUser?.role]);

  if (!currentUser) {
    return <LandingPage />;
  }

  const handleNavigate = (view: AppViewId) => {
    // Enforce role boundaries on navigation
    if (view === "admin-dashboard" && currentUser.role !== "admin") return;
    if (view === "teacher-dashboard" && currentUser.role !== "teacher") return;
    if (
      (view === "grades" ||
        view === "attendance" ||
        view === "class" ||
        view === "reports") &&
      currentUser.role !== "student"
    ) {
      return;
    }
    if (
      view === "vice-rep-inbox" &&
      (!currentUser.isViceRepresentative || currentUser.role !== "student")
    ) {
      return;
    }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return currentUser.role === "student" ? (
          <StudentDashboard onNavigate={handleNavigate} />
        ) : currentUser.role === "teacher" ? (
          <TeacherDashboard onNavigate={handleNavigate} />
        ) : (
          <AdminDashboard />
        );
      case "grades":
        return <GradesPage />;
      case "attendance":
        return <AttendancePage />;
      case "class":
        return <ClassPage onNavigate={handleNavigate} />;
      case "reports":
        return <ProblemsSuggestionsPage />;
      case "vice-rep-inbox":
        return <ViceRepInboxPage />;
      case "clubs":
        return <ClubsPage />;
      case "messages":
        return <MessagesPage />;
      case "community":
        return <CommunityPage />;
      case "school-info":
        return <SchoolInfoPage />;
      case "notifications":
        return <NotificationsPage onNavigate={handleNavigate} />;
      case "profile":
        return <ProfilePage />;
      case "teacher-dashboard":
        return <TeacherDashboard onNavigate={handleNavigate} />;
      case "admin-dashboard":
        return <AdminDashboard />;
      default:
        return currentUser.role === "teacher" ? (
          <TeacherDashboard onNavigate={handleNavigate} />
        ) : currentUser.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <StudentDashboard onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <AppShell activeView={activeView} onNavigate={handleNavigate}>
      {renderView()}
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SchoolProvider>
        <SchoolPlusRouter />
        <ToastViewport />
      </SchoolProvider>
    </ThemeProvider>
  );
}
