import React, { useMemo, useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  FileCheck2,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCircle,
  Users,
  Video,
  X,
} from "lucide-react";
import { SCHOOL_CONFIG } from "../../config/schoolConfig";
import { useSchool } from "../../context/SchoolContext";
import { useTheme } from "../../context/ThemeContext";
import { canViewProblemReport } from "../../db/databaseAdapter";
import { Avatar } from "../common/Avatar";

export type AppViewId =
  | "dashboard"
  | "grades"
  | "attendance"
  | "messages"
  | "community"
  | "class"
  | "reports"
  | "vice-rep-inbox"
  | "clubs"
  | "school-info"
  | "notifications"
  | "profile"
  | "teacher-dashboard"
  | "admin-dashboard";

interface NavItem {
  id: AppViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

interface AppShellProps {
  activeView: AppViewId;
  onNavigate: (view: AppViewId) => void;
  children: React.ReactNode;
}

export function AppShell({ activeView, onNavigate, children }: AppShellProps) {
  const { currentUser, db, signOut, markNotificationRead, markAllNotificationsRead } =
    useSchool();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!currentUser) return null;

  const userNotifications = useMemo(
    () => db.notifications.filter((n) => n.userId === currentUser.id),
    [db.notifications, currentUser.id],
  );
  const unreadNotifCount = userNotifications.filter((n) => !n.read).length;

  const unreadMessageCount = useMemo(() => {
    return db.conversations.reduce((acc, conv) => {
      if (currentUser.role === "student" && conv.studentId === currentUser.id) {
        return acc + conv.unreadForStudent;
      }
      if (currentUser.role === "teacher" && conv.teacherId === currentUser.id) {
        return acc + conv.unreadForTeacher;
      }
      return acc;
    }, 0);
  }, [db.conversations, currentUser]);

  const viceRepOpenReportsCount = useMemo(() => {
    if (!currentUser.isViceRepresentative || !currentUser.viceRepClassId) return 0;
    return db.reports.filter(
      (r) =>
        r.classId === currentUser.viceRepClassId &&
        r.status === "submitted" &&
        canViewProblemReport(currentUser, r),
    ).length;
  }, [db.reports, currentUser]);

  const navItems: NavItem[] = useMemo(() => {
    if (currentUser.role === "student") {
      const items: NavItem[] = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "grades", label: "Grades & Progress", icon: Award },
        { id: "attendance", label: "Attendance", icon: CalendarDays },
        {
          id: "messages",
          label: "Teacher Messaging",
          icon: MessageSquare,
          badgeCount: unreadMessageCount,
        },
        { id: "community", label: "Learning Community", icon: Video },
        { id: "class", label: "My Class", icon: Users },
        { id: "reports", label: "Problems & Suggestions", icon: Sparkles },
      ];
      if (currentUser.isViceRepresentative) {
        items.push({
          id: "vice-rep-inbox",
          label: "Vice Rep Inbox",
          icon: Inbox,
          badgeCount: viceRepOpenReportsCount,
        });
      }
      items.push(
        { id: "clubs", label: "Clubs", icon: Compass },
        { id: "school-info", label: "School Info", icon: BookOpen },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          badgeCount: unreadNotifCount,
        },
        { id: "profile", label: "Profile", icon: UserCircle },
      );
      return items;
    }

    if (currentUser.role === "teacher") {
      return [
        { id: "teacher-dashboard", label: "My Classes & Students", icon: GraduationCap },
        {
          id: "messages",
          label: "Student Messaging",
          icon: MessageSquare,
          badgeCount: unreadMessageCount,
        },
        { id: "community", label: "Learning Community", icon: Video },
        { id: "school-info", label: "School Info", icon: BookOpen },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          badgeCount: unreadNotifCount,
        },
        { id: "profile", label: "Profile", icon: UserCircle },
      ];
    }

    return [
      { id: "admin-dashboard", label: "Admin Console", icon: ShieldCheck },
      { id: "school-info", label: "School Info & Schedules", icon: BookOpen },
      { id: "community", label: "Community Moderation", icon: Video },
      { id: "clubs", label: "Clubs Directory", icon: Compass },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        badgeCount: unreadNotifCount,
      },
      { id: "profile", label: "Profile", icon: UserCircle },
    ];
  }, [currentUser, unreadMessageCount, unreadNotifCount, viceRepOpenReportsCount]);

  // Global search scoped strictly by user's role permissions
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { id: string; title: string; subtitle: string; view: AppViewId }[] = [];

    for (const ann of db.announcements) {
      if (
        ann.title.toLowerCase().includes(q) ||
        ann.body.toLowerCase().includes(q)
      ) {
        if (
          !ann.targetClassId ||
          currentUser.role === "admin" ||
          currentUser.classId === ann.targetClassId ||
          currentUser.assignedClassIds?.includes(ann.targetClassId)
        ) {
          results.push({
            id: ann.id,
            title: ann.title,
            subtitle: `Announcement · ${ann.category}`,
            view: "school-info",
          });
        }
      }
    }

    for (const post of db.communityPosts) {
      if (
        post.title.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: post.id,
          title: post.title,
          subtitle: `Community · ${post.category}`,
          view: "community",
        });
      }
    }

    for (const club of db.clubs) {
      if (club.name.toLowerCase().includes(q) || club.category.toLowerCase().includes(q)) {
        results.push({
          id: club.id,
          title: club.name,
          subtitle: `Club · ${club.schedule}`,
          view: currentUser.role === "teacher" ? "school-info" : "clubs",
        });
      }
    }

    if (currentUser.role === "student") {
      for (const g of db.grades) {
        if (
          g.studentId === currentUser.id &&
          (g.subjectName.toLowerCase().includes(q) ||
            g.assessmentTitle.toLowerCase().includes(q))
        ) {
          results.push({
            id: g.id,
            title: `${g.subjectName} — ${g.score}/${g.maxScore}`,
            subtitle: g.assessmentTitle,
            view: "grades",
          });
        }
      }
    }

    if (currentUser.role === "teacher" || currentUser.role === "admin") {
      for (const cls of db.classes) {
        if (
          cls.name.toLowerCase().includes(q) &&
          (currentUser.role === "admin" ||
            currentUser.assignedClassIds?.includes(cls.id))
        ) {
          results.push({
            id: cls.id,
            title: cls.name,
            subtitle: `Class · ${cls.room}`,
            view: currentUser.role === "admin" ? "admin-dashboard" : "teacher-dashboard",
          });
        }
      }
    }

    return results.slice(0, 7);
  }, [searchQuery, db, currentUser]);

  const activeNavLabel =
    navItems.find((item) => item.id === activeView)?.label || SCHOOL_CONFIG.appName;

  const roleLabel =
    currentUser.role === "student"
      ? currentUser.isViceRepresentative
        ? "Student · Vice Representative"
        : "Student"
      : currentUser.role === "teacher"
        ? "Teacher"
        : "Administrator";

  const handleSelectNav = (id: AppViewId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setNotifOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#080B12] dark:bg-[#080B12] dark:text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322]">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold text-sm shrink-0">
            S+
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold tracking-tight text-[#080B12] dark:text-white truncate">
              {SCHOOL_CONFIG.appName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {SCHOOL_CONFIG.schoolName}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#080B12] dark:text-slate-300 dark:hover:bg-[#101C35] dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`tabular-nums text-xs font-semibold px-1.5 py-0.5 rounded ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-[#60A5FA]"
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <button
            type="button"
            onClick={() => handleSelectNav("profile")}
            className="w-full flex items-center gap-2.5 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-[#101C35] transition-colors"
          >
            <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#080B12] dark:text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {roleLabel}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-[#101C35] dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-[#0c1322] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold text-xs">
                  S+
                </div>
                <div>
                  <div className="font-display text-sm font-bold">{SCHOOL_CONFIG.appName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {SCHOOL_CONFIG.schoolName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#2563EB] text-white"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101C35]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="tabular-nums text-xs font-semibold">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-[#080B12]/95 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101C35]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {SCHOOL_CONFIG.schoolName} · {SCHOOL_CONFIG.academicYear}
              </div>
              <h1 className="font-display text-base sm:text-lg font-semibold text-[#080B12] dark:text-white truncate">
                {activeNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Search */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search grades, clubs, announcements..."
                aria-label="Global search"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-[#080B12] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white dark:focus:bg-[#101C35]"
              />
              {searchOpen && searchQuery.trim().length > 0 ? (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#101C35] p-2 z-50">
                  <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>Search results</span>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="hover:text-[#080B12] dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                      No matching items found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => {
                            handleSelectNav(res.view);
                            setSearchQuery("");
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <div className="text-sm font-medium text-[#080B12] dark:text-white truncate">
                            {res.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {res.subtitle}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-[#101C35]"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-semibold text-white tabular-nums">
                    {unreadNotifCount}
                  </span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#101C35] p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold">Notifications</span>
                    <div className="flex items-center gap-3 text-xs">
                      {unreadNotifCount > 0 ? (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                        >
                          Mark all read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleSelectNav("notifications")}
                        className="text-slate-500 hover:text-[#080B12] dark:text-slate-300 dark:hover:text-white"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {userNotifications.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        You are all caught up.
                      </div>
                    ) : (
                      userNotifications.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(item.id);
                            if (item.linkView) {
                              handleSelectNav(item.linkView as AppViewId);
                            }
                          }}
                          className={`w-full text-left py-2.5 px-2 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !item.read ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#080B12] dark:text-white truncate">
                              {item.title}
                            </span>
                            {!item.read ? (
                              <span className="text-[11px] font-medium text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                                New
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {item.body}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-[#101C35]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-10">
          {children}
        </main>

        {/* Mobile Quick Bottom Bar (compact <= 10% viewport height) */}
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-[#0c1322]/95 flex items-center justify-around py-1.5 px-2"
        >
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] px-2 rounded-lg text-[11px] font-medium ${
                  active
                    ? "text-[#2563EB] dark:text-[#60A5FA]"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span className="truncate max-w-[72px]">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] px-2 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            <FileCheck2 className="h-4 w-4 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
