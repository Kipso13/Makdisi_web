import { SCHOOL_CONFIG } from "../config/schoolConfig";
import {
  canManageProblemReport,
  type ISchoolDatabaseAdapter,
} from "./databaseAdapter";
import { INITIAL_DEMO_DATA } from "./demoData";
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

const STORAGE_KEY = "school_plus_makdisi_db_v1";

function cloneInitial(): SchoolDatabaseState {
  return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA)) as SchoolDatabaseState;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

class DemoDatabaseAdapter implements ISchoolDatabaseAdapter {
  private state: SchoolDatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): SchoolDatabaseState {
    if (typeof window === "undefined") {
      return cloneInitial();
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = cloneInitial();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return JSON.parse(raw) as SchoolDatabaseState;
    } catch {
      return cloneInitial();
    }
  }

  private save(): void {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Ignore storage quota issues in restricted preview environments
      }
    }
  }

  private pushNotification(item: Omit<NotificationItem, "id" | "createdAt" | "read">): void {
    this.state.notifications.unshift({
      ...item,
      id: uid("not"),
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  getState(): SchoolDatabaseState {
    return this.state;
  }

  resetDemoData(): SchoolDatabaseState {
    this.state = cloneInitial();
    this.save();
    return this.state;
  }

  authenticate(email: string, password: string): UserAccount | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.state.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!u.password || u.password === password),
    );
    return user ? { ...user } : null;
  }

  registerAccount(input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    classId?: string;
    department?: string;
  }): UserAccount {
    const cleanEmail = input.email.trim().toLowerCase();
    if (this.state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error("An account with that email already exists at Makdisi School.");
    }

    const chosenClass =
      this.state.classes.find((c) => c.id === input.classId) || this.state.classes[0];

    const newUser: UserAccount = {
      id: uid(input.role === "student" ? "stu" : input.role === "teacher" ? "tch" : "adm"),
      fullName: input.fullName.trim(),
      email: cleanEmail,
      password: input.password,
      role: input.role,
      academicLevel: input.role === "student" ? chosenClass?.academicLevel : undefined,
      classId: input.role === "student" ? chosenClass?.id : undefined,
      isViceRepresentative: false,
      assignedClassIds: input.role === "teacher" && chosenClass ? [chosenClass.id] : undefined,
      department: input.role !== "student" ? input.department || "General Faculty" : undefined,
      studentNumber:
        input.role === "student"
          ? `MK-2026-${Math.floor(300 + Math.random() * 600)}`
          : undefined,
      joinedClubIds: [],
      followedTopics: ["Mathematics", "Study Techniques"],
    };

    this.state.users.push(newUser);
    this.pushNotification({
      userId: newUser.id,
      type: "announcement",
      title: "Welcome to School Plus at Makdisi School",
      body: "Your personalized dashboard and campus directory are ready.",
      linkView: "dashboard",
    });
    this.save();
    return { ...newUser };
  }

  updateProfile(actor: UserAccount, patch: Partial<UserAccount>): UserAccount {
    const idx = this.state.users.findIndex((u) => u.id === actor.id);
    if (idx === -1) throw new Error("User profile not found.");
    const current = this.state.users[idx];
    const updated: UserAccount = {
      ...current,
      fullName: patch.fullName ?? current.fullName,
      bio: patch.bio ?? current.bio,
      avatarUrl: patch.avatarUrl ?? current.avatarUrl,
    };
    this.state.users[idx] = updated;
    this.save();
    return { ...updated };
  }

  addOrUpdateGrade(actor: UserAccount, input: Omit<GradeRecord, "id">): GradeRecord {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new Error("Only authorized teachers or administrators can publish grades.");
    }
    if (actor.role === "teacher" && !actor.assignedClassIds?.includes(input.classId)) {
      throw new Error("You are not assigned to grade students in this class.");
    }

    const grade: GradeRecord = {
      ...input,
      id: uid("grd"),
    };
    this.state.grades.unshift(grade);
    this.pushNotification({
      userId: input.studentId,
      type: "grade",
      title: `New grade in ${input.subjectName}`,
      body: `${input.assessmentTitle}: ${input.score} / ${input.maxScore}`,
      linkView: "grades",
    });
    this.save();
    return grade;
  }

  recordAttendance(actor: UserAccount, input: Omit<AttendanceRecord, "id">): AttendanceRecord {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new Error("Only teachers or administrators can record attendance.");
    }
    if (actor.role === "teacher" && !actor.assignedClassIds?.includes(input.classId)) {
      throw new Error("You are not assigned to manage attendance for this class.");
    }

    const rec: AttendanceRecord = {
      ...input,
      id: uid("att"),
    };
    this.state.attendance.unshift(rec);
    this.pushNotification({
      userId: input.studentId,
      type: "attendance",
      title: `Attendance ${input.type === "absent" ? "absence" : "late arrival"} recorded`,
      body: `${input.subjectName} (${input.date}) — ${input.missedHours}h (${input.status})`,
      linkView: "attendance",
    });
    this.save();
    return rec;
  }

  updateAttendanceStatus(
    actor: UserAccount,
    recordId: string,
    status: AttendanceRecord["status"],
    note?: string,
  ): AttendanceRecord {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new Error("Only teachers or administrators can update attendance status.");
    }
    const rec = this.state.attendance.find((a) => a.id === recordId);
    if (!rec) throw new Error("Attendance record not found.");
    rec.status = status;
    if (note !== undefined) rec.note = note;
    this.save();
    return rec;
  }

  sendMessage(
    actor: UserAccount,
    input: {
      studentId: string;
      teacherId: string;
      subjectLabel: string;
      text: string;
      attachment?: MessageAttachment;
    },
  ): { conversation: Conversation; message: DirectMessage } {
    if (actor.id !== input.studentId && actor.id !== input.teacherId && actor.role !== "admin") {
      throw new Error("You are not authorized to send messages in this conversation.");
    }

    let conversation = this.state.conversations.find(
      (c) => c.studentId === input.studentId && c.teacherId === input.teacherId,
    );

    const nowIso = new Date().toISOString();
    if (!conversation) {
      conversation = {
        id: uid("conv"),
        studentId: input.studentId,
        teacherId: input.teacherId,
        subjectLabel: input.subjectLabel,
        lastMessagePreview: input.text || input.attachment?.name || "Attachment",
        updatedAt: nowIso,
        unreadForStudent: 0,
        unreadForTeacher: 0,
      };
      this.state.conversations.unshift(conversation);
    }

    const message: DirectMessage = {
      id: uid("msg"),
      conversationId: conversation.id,
      senderId: actor.id,
      senderName: actor.fullName,
      senderRole: actor.role,
      text: input.text,
      attachment: input.attachment,
      sentAt: nowIso,
    };
    this.state.messages.push(message);

    conversation.lastMessagePreview = input.text || `Shared file: ${input.attachment?.name}`;
    conversation.updatedAt = nowIso;
    if (actor.role === "student") {
      conversation.unreadForTeacher += 1;
      this.pushNotification({
        userId: input.teacherId,
        type: "message",
        title: `New message from ${actor.fullName}`,
        body: conversation.lastMessagePreview,
        linkView: "messages",
      });
    } else {
      conversation.unreadForStudent += 1;
      this.pushNotification({
        userId: input.studentId,
        type: "message",
        title: `New message from ${actor.fullName}`,
        body: conversation.lastMessagePreview,
        linkView: "messages",
      });
    }

    this.save();
    return { conversation, message };
  }

  markConversationRead(actor: UserAccount, conversationId: string): void {
    const conv = this.state.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    if (actor.id === conv.studentId) conv.unreadForStudent = 0;
    if (actor.id === conv.teacherId) conv.unreadForTeacher = 0;
    this.save();
  }

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
  ): CommunityPost {
    const post: CommunityPost = {
      id: uid("post"),
      ...input,
      authorId: actor.id,
      authorName: actor.fullName,
      authorRole: actor.role,
      createdAt: new Date().toISOString().slice(0, 10),
      likes: [],
      savedBy: [],
      comments: [],
    };
    this.state.communityPosts.unshift(post);
    this.save();
    return post;
  }

  toggleLikePost(actor: UserAccount, postId: string): CommunityPost {
    const post = this.state.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error("Community post not found.");
    const exists = post.likes.includes(actor.id);
    post.likes = exists ? post.likes.filter((id) => id !== actor.id) : [...post.likes, actor.id];
    if (!exists && post.authorId !== actor.id) {
      this.pushNotification({
        userId: post.authorId,
        type: "community",
        title: `${actor.fullName} liked your study resource`,
        body: post.title,
        linkView: "community",
      });
    }
    this.save();
    return { ...post };
  }

  toggleSavePost(actor: UserAccount, postId: string): CommunityPost {
    const post = this.state.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error("Community post not found.");
    const exists = post.savedBy.includes(actor.id);
    post.savedBy = exists
      ? post.savedBy.filter((id) => id !== actor.id)
      : [...post.savedBy, actor.id];
    this.save();
    return { ...post };
  }

  addCommunityComment(actor: UserAccount, postId: string, text: string): CommunityPost {
    const post = this.state.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error("Community post not found.");
    post.comments.push({
      id: uid("cmt"),
      authorId: actor.id,
      authorName: actor.fullName,
      authorRole: actor.role,
      text: text.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    if (post.authorId !== actor.id) {
      this.pushNotification({
        userId: post.authorId,
        type: "community",
        title: `${actor.fullName} commented on your post`,
        body: text.trim().slice(0, 90),
        linkView: "community",
      });
    }
    this.save();
    return { ...post };
  }

  deleteCommunityPost(actor: UserAccount, postId: string): void {
    const post = this.state.communityPosts.find((p) => p.id === postId);
    if (!post) return;
    if (actor.role !== "admin" && post.authorId !== actor.id) {
      throw new Error("Only administrators or the post author can remove this content.");
    }
    this.state.communityPosts = this.state.communityPosts.filter((p) => p.id !== postId);
    this.save();
  }

  toggleFollowTopic(actor: UserAccount, topic: string): UserAccount {
    const user = this.state.users.find((u) => u.id === actor.id);
    if (!user) throw new Error("User not found.");
    const topics = user.followedTopics || [];
    user.followedTopics = topics.includes(topic)
      ? topics.filter((t) => t !== topic)
      : [...topics, topic];
    this.save();
    return { ...user };
  }

  toggleClubMembership(actor: UserAccount, clubId: string): Club {
    const club = this.state.clubs.find((c) => c.id === clubId);
    const user = this.state.users.find((u) => u.id === actor.id);
    if (!club || !user) throw new Error("Club or user not found.");
    const joined = club.memberIds.includes(actor.id);
    club.memberIds = joined
      ? club.memberIds.filter((id) => id !== actor.id)
      : [...club.memberIds, actor.id];
    const userClubs = user.joinedClubIds || [];
    user.joinedClubIds = joined
      ? userClubs.filter((id) => id !== clubId)
      : [...userClubs, clubId];
    this.save();
    return { ...club };
  }

  createClub(
    actor: UserAccount,
    input: Omit<Club, "id" | "memberIds" | "announcements">,
  ): Club {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can create or configure clubs.");
    }
    const club: Club = {
      ...input,
      id: uid("club"),
      memberIds: [],
      announcements: [],
    };
    this.state.clubs.unshift(club);
    this.save();
    return club;
  }

  deleteClub(actor: UserAccount, clubId: string): void {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can delete clubs.");
    }
    this.state.clubs = this.state.clubs.filter((c) => c.id !== clubId);
    this.save();
  }

  submitProblemReport(
    actor: UserAccount,
    input: {
      title: string;
      category: ReportCategory;
      urgency: ReportUrgency;
      summary: string;
      originalTranscript: { role: "user" | "assistant"; content: string }[];
    },
  ): ProblemReport {
    if (actor.role !== "student" || !actor.classId) {
      throw new Error("Only enrolled students can submit class problem reports.");
    }
    const schoolClass = this.state.classes.find((c) => c.id === actor.classId);
    if (!schoolClass) throw new Error("Assigned class not found.");
    const viceRep = this.state.users.find(
      (u) =>
        u.id === schoolClass.viceRepresentativeId ||
        (u.isViceRepresentative && u.viceRepClassId === schoolClass.id),
    );
    if (!viceRep) {
      throw new Error("No Vice Representative is currently assigned to your class.");
    }

    const now = new Date().toISOString();
    const report: ProblemReport = {
      id: uid("rep"),
      studentId: actor.id,
      studentName: actor.fullName,
      classId: schoolClass.id,
      className: schoolClass.name,
      viceRepId: viceRep.id,
      viceRepName: viceRep.fullName,
      title: input.title.trim(),
      category: input.category,
      urgency: input.urgency,
      summary: input.summary.trim(),
      originalTranscript: input.originalTranscript,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    };

    this.state.reports.unshift(report);
    this.pushNotification({
      userId: viceRep.id,
      type: "report",
      title: `New ${schoolClass.name} report from ${actor.fullName}`,
      body: report.title,
      linkView: "vice-rep-inbox",
    });
    this.save();
    return report;
  }

  updateProblemReportStatus(
    actor: UserAccount,
    reportId: string,
    status: ReportStatus,
    handlingNote?: string,
  ): ProblemReport {
    const report = this.state.reports.find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found.");
    if (!canManageProblemReport(actor, report)) {
      throw new Error("You are not authorized to update this report.");
    }
    report.status = status;
    report.updatedAt = new Date().toISOString();
    if (handlingNote !== undefined && handlingNote.trim().length > 0) {
      report.handlingNote = handlingNote.trim();
    }
    this.pushNotification({
      userId: report.studentId,
      type: "report",
      title: `Report marked as ${status === "received" ? "Received" : status === "handled" ? "Handled" : "Submitted"}`,
      body: `${report.title}${report.handlingNote ? ` — ${report.handlingNote}` : ""}`,
      linkView: "reports",
    });
    this.save();
    return { ...report };
  }

  publishAnnouncement(
    actor: UserAccount,
    input: Omit<Announcement, "id" | "publishedAt">,
  ): Announcement {
    if (actor.role !== "admin" && actor.role !== "teacher") {
      throw new Error("Only teachers or administrators can publish announcements.");
    }
    const ann: Announcement = {
      ...input,
      id: uid("ann"),
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    this.state.announcements.unshift(ann);

    const recipients = this.state.users.filter((u) => {
      if (u.id === actor.id) return false;
      if (ann.targetClassId) return u.classId === ann.targetClassId;
      if (ann.targetLevel && ann.targetLevel !== "All Levels") {
        return u.academicLevel === ann.targetLevel;
      }
      return true;
    });
    for (const r of recipients.slice(0, 15)) {
      this.pushNotification({
        userId: r.id,
        type: "announcement",
        title: ann.title,
        body: ann.body.slice(0, 95),
        linkView: ann.targetClassId ? "class" : "school-info",
      });
    }
    this.save();
    return ann;
  }

  deleteAnnouncement(actor: UserAccount, announcementId: string): void {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can delete announcements.");
    }
    this.state.announcements = this.state.announcements.filter((a) => a.id !== announcementId);
    this.save();
  }

  upsertClass(
    actor: UserAccount,
    input: Omit<SchoolClass, "id"> & { id?: string },
  ): SchoolClass {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can create or update classes.");
    }
    if (input.id) {
      const idx = this.state.classes.findIndex((c) => c.id === input.id);
      if (idx !== -1) {
        const updated = { ...this.state.classes[idx], ...input, id: input.id };
        this.state.classes[idx] = updated;
        this.syncViceRepFlags(updated);
        this.save();
        return updated;
      }
    }
    const created: SchoolClass = {
      ...input,
      id: uid("cls"),
    };
    this.state.classes.push(created);
    this.syncViceRepFlags(created);
    this.save();
    return created;
  }

  private syncViceRepFlags(schoolClass: SchoolClass): void {
    for (const u of this.state.users) {
      if (u.role === "student" && u.classId === schoolClass.id) {
        const isRep = u.id === schoolClass.viceRepresentativeId;
        u.isViceRepresentative = isRep;
        u.viceRepClassId = isRep ? schoolClass.id : undefined;
      }
    }
  }

  assignStudentToClass(
    actor: UserAccount,
    studentId: string,
    classId: string,
    isViceRepresentative?: boolean,
  ): UserAccount {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can assign students to classes.");
    }
    const student = this.state.users.find((u) => u.id === studentId && u.role === "student");
    const targetClass = this.state.classes.find((c) => c.id === classId);
    if (!student || !targetClass) throw new Error("Student or class not found.");

    student.classId = targetClass.id;
    student.academicLevel = targetClass.academicLevel;
    if (isViceRepresentative !== undefined) {
      if (isViceRepresentative) {
        targetClass.viceRepresentativeId = student.id;
        this.syncViceRepFlags(targetClass);
      } else if (targetClass.viceRepresentativeId === student.id) {
        targetClass.viceRepresentativeId = undefined;
        this.syncViceRepFlags(targetClass);
      }
    }
    this.save();
    return { ...student };
  }

  upsertTimetableSlot(
    actor: UserAccount,
    input: Omit<TimetableSlot, "id"> & { id?: string },
  ): TimetableSlot {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can manage school timetables.");
    }
    if (input.id) {
      const idx = this.state.timetable.findIndex((t) => t.id === input.id);
      if (idx !== -1) {
        const updated = { ...input, id: input.id };
        this.state.timetable[idx] = updated;
        this.save();
        return updated;
      }
    }
    const created: TimetableSlot = { ...input, id: uid("tt") };
    this.state.timetable.push(created);
    this.save();
    return created;
  }

  deleteTimetableSlot(actor: UserAccount, slotId: string): void {
    if (actor.role !== "admin") {
      throw new Error("Only administrators can remove timetable entries.");
    }
    this.state.timetable = this.state.timetable.filter((t) => t.id !== slotId);
    this.save();
  }

  markNotificationRead(actor: UserAccount, notificationId: string): void {
    const item = this.state.notifications.find(
      (n) => n.id === notificationId && n.userId === actor.id,
    );
    if (item) {
      item.read = true;
      this.save();
    }
  }

  markAllNotificationsRead(actor: UserAccount): void {
    for (const item of this.state.notifications) {
      if (item.userId === actor.id) item.read = true;
    }
    this.save();
  }
}

let singletonAdapter: ISchoolDatabaseAdapter | null = null;

/**
 * Central database adapter factory.
 * Currently returns DemoDatabaseAdapter when SCHOOL_CONFIG.dataProvider === "demo".
 * When you connect Supabase or PostgreSQL later, instantiate your production adapter here
 * implementing ISchoolDatabaseAdapter without changing any UI pages.
 */
export function getDatabaseAdapter(): ISchoolDatabaseAdapter {
  if (!singletonAdapter) {
    if (SCHOOL_CONFIG.dataProvider === "demo") {
      singletonAdapter = new DemoDatabaseAdapter();
    } else {
      // Fallback safely to DemoDatabaseAdapter until a custom adapter class is wired here
      singletonAdapter = new DemoDatabaseAdapter();
    }
  }
  return singletonAdapter;
}
