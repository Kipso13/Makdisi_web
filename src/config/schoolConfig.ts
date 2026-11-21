export type DataProviderMode = "demo" | "supabase" | "custom_api";

export const SCHOOL_CONFIG = {
  appName: "School Plus",
  schoolName: "Makdisi School",
  academicYear: "2026–2027",
  semester: "Semester 1",
  tagline: "Academic clarity, direct support, and campus life in one place.",
  supportEmail: "campus@makdisischool.edu",
  /**
   * DATABASE CONNECTION SWITCH
   * Set VITE_DATA_PROVIDER in .env when connecting your production database:
   *  - "demo": Uses structured local sample data persisted in browser storage.
   *  - "supabase": Ready for your Supabase adapter in src/db/databaseAdapter.ts.
   *  - "custom_api": Ready for your Express/PostgreSQL API adapter.
   */
  dataProvider: (import.meta.env.VITE_DATA_PROVIDER as DataProviderMode) || "demo",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
} as const;

export const DATABASE_INTEGRATION_NOTES = [
  {
    area: "Authentication & Role Claims",
    status: "Demo Mode (Local Session)",
    howToConnect:
      "Replace AuthContext sign-in/register calls with your Supabase Auth or Express JWT endpoint, returning role ('student' | 'teacher' | 'admin') and classId from verified claims.",
  },
  {
    area: "Classes, Rosters, Grades & Attendance",
    status: "Adapter Ready (ISchoolDatabaseAdapter)",
    howToConnect:
      "Implement ISchoolDatabaseAdapter in src/db/databaseAdapter.ts using src/db/schema.sql and switch SCHOOL_CONFIG.dataProvider to 'supabase' or 'custom_api'. Pages require zero rewrites.",
  },
  {
    area: "Problems & Suggestions AI Assistant",
    status: "Live Server Route (/api/assistant/report-chat)",
    howToConnect:
      "Powered server-side by @google/genai using GEMINI_API_KEY in .env / AI Studio Secrets. Submitted reports persist via ISchoolDatabaseAdapter.",
  },
  {
    area: "File & Video Uploads",
    status: "Metadata & Preview Ready",
    howToConnect:
      "Connect Supabase Storage or S3 presigned uploads inside uploadAttachment() in your database adapter.",
  },
] as const;
