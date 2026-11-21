import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getDatabaseAdapter } from "../db/demoAdapter";
import type {
  Announcement,
  AttendanceRecord,
  Club,
  CommunityCategory,
  CommunityPost,
  GradeRecord,
  MessageAttachment,
  ProblemReport,
  ReportCategory,
  ReportStatus,
  ReportUrgency,
  SchoolClass,
  SchoolDatabaseState,
  TimetableSlot,
  UserAccount,
  UserRole,
} from "../db/types";

export interface ToastNotice {
  id: string;
  kind: "success" | "error" | "info";
  message: string;
}

interface SchoolContextValue {
  currentUser: UserAccount | null;
  db: SchoolDatabaseState;
  toasts: ToastNotice[];
  notify: (message: string, kind?: ToastNotice["kind"]) => void;
  dismissToast: (id: string) => void;

  // Auth
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signInDemoUser: (userId: string) => void;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    classId?: string;
    department?: string;
  }) => { ok: boolean; error?: string };
  signOut: () => void;
  resetDemoPlatform: () => void;
  updateProfile: (patch: Partial<UserAccount>) => void;

  // Grades & Attendance
  addGrade: (input: Omit<GradeRecord, "id">) => void;
  recordAttendance: (input: Omit<AttendanceRecord, "id">) => void;
  updateAttendanceStatus: (
    recordId: string,
    status: AttendanceRecord["status"],
    note?: string,
  ) => void;

  // Messaging
  sendMessage: (input: {
    studentId: string;
    teacherId: string;
    subjectLabel: string;
    text: string;
    attachment?: MessageAttachment;
  }) => void;
  markConversationRead: (conversationId: string) => void;

  // Community
  createCommunityPost: (input: {
    title: string;
    description: string;
    category: CommunityCategory;
    academicLevel: CommunityPost["academicLevel"];
    mediaType: "video" | "guide";
    durationOrReadTime: string;
    thumbnailUrl?: string;
  }) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addCommunityComment: (postId: string, text: string) => void;
  deleteCommunityPost: (postId: string) => void;
  toggleFollowTopic: (topic: string) => void;

  // Clubs
  toggleClubMembership: (clubId: string) => void;
  createClub: (input: Omit<Club, "id" | "memberIds" | "announcements">) => void;
  deleteClub: (clubId: string) => void;

  // Problems & Suggestions
  submitProblemReport: (input: {
    title: string;
    category: ReportCategory;
    urgency: ReportUrgency;
    summary: string;
    originalTranscript: { role: "user" | "assistant"; content: string }[];
  }) => ProblemReport | null;
  updateProblemReportStatus: (
    reportId: string,
    status: ReportStatus,
    handlingNote?: string,
  ) => void;

  // Announcements, Classes, Schedules, Notifications
  publishAnnouncement: (input: Omit<Announcement, "id" | "publishedAt">) => void;
  deleteAnnouncement: (announcementId: string) => void;
  upsertClass: (input: Omit<SchoolClass, "id"> & { id?: string }) => void;
  assignStudentToClass: (
    studentId: string,
    classId: string,
    isViceRepresentative?: boolean,
  ) => void;
  upsertTimetableSlot: (input: Omit<TimetableSlot, "id"> & { id?: string }) => void;
  deleteTimetableSlot: (slotId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);
const SESSION_USER_KEY = "school_plus_session_user_id";

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => getDatabaseAdapter(), []);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(SESSION_USER_KEY);
    } catch {
      return null;
    }
  });

  const db = useMemo(() => {
    void version;
    return adapter.getState();
  }, [adapter, version]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return db.users.find((u) => u.id === currentUserId) || null;
  }, [db.users, currentUserId]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastNotice["kind"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [],
  );

  const persistSessionId = (id: string | null) => {
    setCurrentUserId(id);
    if (typeof window !== "undefined") {
      try {
        if (id) window.sessionStorage.setItem(SESSION_USER_KEY, id);
        else window.sessionStorage.removeItem(SESSION_USER_KEY);
      } catch {
        // Ignore session storage errors
      }
    }
  };

  const signIn = (email: string, password: string) => {
    const user = adapter.authenticate(email, password);
    if (!user) {
      return { ok: false, error: "Invalid email or password for Makdisi School." };
    }
    persistSessionId(user.id);
    notify(`Signed in as ${user.fullName}`, "success");
    return { ok: true };
  };

  const signInDemoUser = (userId: string) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    persistSessionId(user.id);
    notify(`Signed in as ${user.fullName}`, "success");
  };

  const register: SchoolContextValue["register"] = (input) => {
    try {
      const created = adapter.registerAccount(input);
      bump();
      persistSessionId(created.id);
      notify(`Welcome to School Plus, ${created.fullName}!`, "success");
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not create account.",
      };
    }
  };

  const signOut = () => {
    persistSessionId(null);
    notify("Signed out of School Plus.", "info");
  };

  const resetDemoPlatform = () => {
    adapter.resetDemoData();
    bump();
    notify("Sample Makdisi School data restored to defaults.", "info");
  };

  const runAction = <T,>(fn: (actor: UserAccount) => T, successMsg?: string): T | null => {
    if (!currentUser) {
      notify("Please sign in to perform this action.", "error");
      return null;
    }
    try {
      const result = fn(currentUser);
      bump();
      if (successMsg) notify(successMsg, "success");
      return result;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Action could not be completed.", "error");
      return null;
    }
  };

  const value: SchoolContextValue = {
    currentUser,
    db,
    toasts,
    notify,
    dismissToast,
    signIn,
    signInDemoUser,
    register,
    signOut,
    resetDemoPlatform,
    updateProfile: (patch) =>
      runAction((actor) => adapter.updateProfile(actor, patch), "Profile updated."),
    addGrade: (input) =>
      runAction((actor) => adapter.addOrUpdateGrade(actor, input), "Grade published."),
    recordAttendance: (input) =>
      runAction((actor) => adapter.recordAttendance(actor, input), "Attendance recorded."),
    updateAttendanceStatus: (recordId, status, note) =>
      runAction(
        (actor) => adapter.updateAttendanceStatus(actor, recordId, status, note),
        "Attendance status updated.",
      ),
    sendMessage: (input) => {
      runAction((actor) => adapter.sendMessage(actor, input));
    },
    markConversationRead: (conversationId) => {
      if (!currentUser) return;
      adapter.markConversationRead(currentUser, conversationId);
      bump();
    },
    createCommunityPost: (input) =>
      runAction(
        (actor) => adapter.createCommunityPost(actor, input),
        "Study resource shared with the community.",
      ),
    toggleLikePost: (postId) => {
      runAction((actor) => adapter.toggleLikePost(actor, postId));
    },
    toggleSavePost: (postId) => {
      runAction((actor) => adapter.toggleSavePost(actor, postId));
    },
    addCommunityComment: (postId, text) =>
      runAction((actor) => adapter.addCommunityComment(actor, postId, text), "Comment added."),
    deleteCommunityPost: (postId) =>
      runAction((actor) => adapter.deleteCommunityPost(actor, postId), "Post removed."),
    toggleFollowTopic: (topic) => {
      runAction((actor) => adapter.toggleFollowTopic(actor, topic));
    },
    toggleClubMembership: (clubId) =>
      runAction((actor) => adapter.toggleClubMembership(actor, clubId), "Club membership updated."),
    createClub: (input) =>
      runAction((actor) => adapter.createClub(actor, input), "Club created."),
    deleteClub: (clubId) =>
      runAction((actor) => adapter.deleteClub(actor, clubId), "Club removed."),
    submitProblemReport: (input) =>
      runAction(
        (actor) => adapter.submitProblemReport(actor, input),
        "Your report has been sent to your class Vice Representative.",
      ),
    updateProblemReportStatus: (reportId, status, handlingNote) =>
      runAction(
        (actor) => adapter.updateProblemReportStatus(actor, reportId, status, handlingNote),
        `Report marked as ${status}.`,
      ),
    publishAnnouncement: (input) =>
      runAction((actor) => adapter.publishAnnouncement(actor, input), "Announcement published."),
    deleteAnnouncement: (id) =>
      runAction((actor) => adapter.deleteAnnouncement(actor, id), "Announcement deleted."),
    upsertClass: (input) =>
      runAction((actor) => adapter.upsertClass(actor, input), "Class saved."),
    assignStudentToClass: (studentId, classId, isViceRep) =>
      runAction(
        (actor) => adapter.assignStudentToClass(actor, studentId, classId, isViceRep),
        "Student assignment updated.",
      ),
    upsertTimetableSlot: (input) =>
      runAction((actor) => adapter.upsertTimetableSlot(actor, input), "Timetable updated."),
    deleteTimetableSlot: (slotId) =>
      runAction((actor) => adapter.deleteTimetableSlot(actor, slotId), "Timetable slot removed."),
    markNotificationRead: (notificationId) => {
      if (!currentUser) return;
      adapter.markNotificationRead(currentUser, notificationId);
      bump();
    },
    markAllNotificationsRead: () => {
      if (!currentUser) return;
      adapter.markAllNotificationsRead(currentUser);
      bump();
    },
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}
