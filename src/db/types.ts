export type UserRole = "student" | "teacher" | "admin";

export type AcademicLevel =
  | "Tronc Commun Sciences"
  | "1ère Bac Sciences Math"
  | "2ème Bac Physique";

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  academicLevel?: AcademicLevel;
  classId?: string;
  isViceRepresentative?: boolean;
  viceRepClassId?: string;
  assignedClassIds?: string[];
  department?: string;
  studentNumber?: string;
  bio?: string;
  joinedClubIds?: string[];
  followedTopics?: string[];
}

export interface SchoolClass {
  id: string;
  name: string;
  academicLevel: AcademicLevel;
  room: string;
  homeroomTeacherId: string;
  viceRepresentativeId?: string;
  teacherIds: string[];
  studentCount?: number;
  scheduleSummary: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  teacherId: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  assessmentTitle: string;
  semester: "Semester 1" | "Semester 2";
  score: number;
  maxScore: number;
  coefficient: number;
  date: string;
  feedback: string;
  teacherId: string;
}

export type AttendanceType = "absent" | "late";
export type JustificationStatus = "justified" | "unjustified" | "pending";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  subjectName: string;
  type: AttendanceType;
  missedHours: number;
  status: JustificationStatus;
  note: string;
  recordedBy: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  time: string;
  subjectName: string;
  teacherName: string;
  room: string;
}

export interface UpcomingItem {
  id: string;
  classId: string;
  academicLevel: AcademicLevel;
  kind: "exam" | "assignment";
  subjectName: string;
  title: string;
  dueDate: string;
  roomOrWeight: string;
}

export interface MessageAttachment {
  name: string;
  sizeLabel: string;
  fileType: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  attachment?: MessageAttachment;
  sentAt: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  teacherId: string;
  subjectLabel: string;
  lastMessagePreview: string;
  updatedAt: string;
  unreadForStudent: number;
  unreadForTeacher: number;
}

export type CommunityCategory =
  | "Mathematics"
  | "Physics & Chemistry"
  | "Biology & Geology (SVT)"
  | "Languages"
  | "History & Geography"
  | "Computer Science"
  | "Study Techniques"
  | "Exam Preparation";

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  description: string;
  category: CommunityCategory;
  academicLevel: AcademicLevel | "All Levels";
  mediaType: "video" | "guide";
  durationOrReadTime: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  likes: string[];
  savedBy: string[];
  comments: CommunityComment[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: "General" | "Class" | "Exam" | "Holiday" | "Event" | "Administrative";
  targetClassId?: string | null;
  targetLevel?: AcademicLevel | "All Levels";
  authorName: string;
  authorRole: UserRole;
  publishedAt: string;
  pinned?: boolean;
}

export interface SchoolDocument {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  fileSize: string;
  summary: string;
}

export interface Club {
  id: string;
  name: string;
  category: string;
  description: string;
  schedule: string;
  meetingTime: string;
  location: string;
  advisorName: string;
  imageUrl?: string;
  memberIds: string[];
  announcements: {
    id: string;
    title: string;
    date: string;
    content: string;
  }[];
}

export type ReportStatus = "submitted" | "received" | "handled";
export type ReportCategory =
  | "Academic"
  | "Facilities"
  | "Schedule"
  | "Technology"
  | "Wellbeing"
  | "Suggestion";
export type ReportUrgency = "Low" | "Medium" | "High";

export interface ProblemReport {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  viceRepId: string;
  viceRepName: string;
  title: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  summary: string;
  originalTranscript: { role: "user" | "assistant"; content: string }[];
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  handlingNote?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "grade" | "attendance" | "message" | "announcement" | "exam" | "report" | "community";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  linkView?: string;
}

export interface SchoolDatabaseState {
  users: UserAccount[];
  classes: SchoolClass[];
  subjects: Subject[];
  grades: GradeRecord[];
  attendance: AttendanceRecord[];
  timetable: TimetableSlot[];
  upcoming: UpcomingItem[];
  conversations: Conversation[];
  messages: DirectMessage[];
  communityPosts: CommunityPost[];
  announcements: Announcement[];
  documents: SchoolDocument[];
  clubs: Club[];
  reports: ProblemReport[];
  notifications: NotificationItem[];
}
