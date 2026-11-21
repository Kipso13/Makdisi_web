import type {
  Announcement,
  AttendanceRecord,
  Club,
  CommunityCategory,
  CommunityPost,
  Conversation,
  DirectMessage,
  GradeRecord,
  MessageAttachment,
  NotificationItem,
  ProblemReport,
  ReportCategory,
  ReportStatus,
  ReportUrgency,
  SchoolClass,
  SchoolDatabaseState,
  TimetableSlot,
  UserAccount,
  UserRole,
} from "./types";

/**
 * Role-Based Access Control (RBAC) helpers.
 * Mirrors the PostgreSQL RLS rules in src/db/schema.sql so UI & data layers
 * enforce strict student, teacher, vice-representative, and admin boundaries.
 */
export function canViewStudentPrivateRecords(actor: UserAccount | null, targetStudentId: string, targetClassId?: string): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "student") return actor.id === targetStudentId;
  if (actor.role === "teacher") {
    if (!targetClassId) return false;
    return Boolean(actor.assignedClassIds?.includes(targetClassId));
  }
  return false;
}

export function canViewProblemReport(actor: UserAccount | null, report: ProblemReport): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.id === report.studentId) return true;
  if (
    actor.role === "student" &&
    actor.isViceRepresentative &&
    actor.viceRepClassId === report.classId
  ) {
    return true;
  }
  return false;
}

export function canManageProblemReport(actor: UserAccount | null, report: ProblemReport): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  return (
    actor.role === "student" &&
    Boolean(actor.isViceRepresentative) &&
    actor.viceRepClassId === report.classId
  );
}

export function canAccessClassDetails(actor: UserAccount | null, schoolClass: SchoolClass): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "teacher") {
    return (
      Boolean(actor.assignedClassIds?.includes(schoolClass.id)) ||
      schoolClass.teacherIds.includes(actor.id)
    );
  }
  if (actor.role === "student") {
    return actor.classId === schoolClass.id;
  }
  return false;
}

/**
 * Clean database interface so you can swap DemoDatabaseAdapter for a real
 * Supabase or PostgreSQL API adapter without rewriting any page components.
 */
export interface ISchoolDatabaseAdapter {
  getState(): SchoolDatabaseState;
  resetDemoData(): SchoolDatabaseState;

  // Auth & Users
  authenticate(email: string, password: string): UserAccount | null;
  registerAccount(input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    classId?: string;
    department?: string;
  }): UserAccount;
  updateProfile(actor: UserAccount, patch: Partial<UserAccount>): UserAccount;

  // Grades & Attendance
  addOrUpdateGrade(
    actor: UserAccount,
    input: Omit<GradeRecord, "id">,
  ): GradeRecord;
  recordAttendance(
    actor: UserAccount,
    input: Omit<AttendanceRecord, "id">,
  ): AttendanceRecord;
  updateAttendanceStatus(
    actor: UserAccount,
    recordId: string,
    status: AttendanceRecord["status"],
    note?: string,
  ): AttendanceRecord;

  // Messaging
  sendMessage(
    actor: UserAccount,
    input: {
      studentId: string;
      teacherId: string;
      subjectLabel: string;
      text: string;
      attachment?: MessageAttachment;
    },
  ): { conversation: Conversation; message: DirectMessage };
  markConversationRead(actor: UserAccount, conversationId: string): void;

  // Community
  createCommunityPost(
    actor: UserAccount,
    input: {
      title: string;
      description: string;
      category: CommunityCategory;
      academicLevel: CommunityPost["academicLevel"];
      mediaType: "video" | "guide";
      durationOrReadTime: string;
      thumbnailUrl?: string;
    },
  ): CommunityPost;
  toggleLikePost(actor: UserAccount, postId: string): CommunityPost;
  toggleSavePost(actor: UserAccount, postId: string): CommunityPost;
  addCommunityComment(actor: UserAccount, postId: string, text: string): CommunityPost;
  deleteCommunityPost(actor: UserAccount, postId: string): void;
  toggleFollowTopic(actor: UserAccount, topic: string): UserAccount;

  // Clubs
  toggleClubMembership(actor: UserAccount, clubId: string): Club;
  createClub(actor: UserAccount, input: Omit<Club, "id" | "memberIds" | "announcements">): Club;
  deleteClub(actor: UserAccount, clubId: string): void;

  // Problems & Suggestions (Routed to Class Vice Representative)
  submitProblemReport(
    actor: UserAccount,
    input: {
      title: string;
      category: ReportCategory;
      urgency: ReportUrgency;
      summary: string;
      originalTranscript: { role: "user" | "assistant"; content: string }[];
    },
  ): ProblemReport;
  updateProblemReportStatus(
    actor: UserAccount,
    reportId: string,
    status: ReportStatus,
    handlingNote?: string,
  ): ProblemReport;

  // Announcements, Classes, Schedules & Admin Tools
  publishAnnouncement(
    actor: UserAccount,
    input: Omit<Announcement, "id" | "publishedAt">,
  ): Announcement;
  deleteAnnouncement(actor: UserAccount, announcementId: string): void;
  upsertClass(
    actor: UserAccount,
    input: Omit<SchoolClass, "id"> & { id?: string },
  ): SchoolClass;
  assignStudentToClass(
    actor: UserAccount,
    studentId: string,
    classId: string,
    isViceRepresentative?: boolean,
  ): UserAccount;
  upsertTimetableSlot(
    actor: UserAccount,
    input: Omit<TimetableSlot, "id"> & { id?: string },
  ): TimetableSlot;
  deleteTimetableSlot(actor: UserAccount, slotId: string): void;

  // Notifications
  markNotificationRead(actor: UserAccount, notificationId: string): void;
  markAllNotificationsRead(actor: UserAccount): void;
}
