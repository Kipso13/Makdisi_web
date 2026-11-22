export interface SchoolClassOption {
  id: string;
  name: string;
  level: string;
  viceRepName: string;
}

export const MAKDISI_CLASSES: SchoolClassOption[] = [
  {
    id: "cls-1bac-sm-a",
    name: "1ère Bac Sciences Math A",
    level: "1ère Bac Sciences Math",
    viceRepName: "Lina Benali",
  },
  {
    id: "cls-2bac-pc-b",
    name: "2ème Bac Physique B",
    level: "2ème Bac Physique",
    viceRepName: "Youssef El Mansouri",
  },
  {
    id: "cls-tc-sci-1",
    name: "Tronc Commun Sciences 1",
    level: "Tronc Commun Sciences",
    viceRepName: "Maya Zaki",
  },
  {
    id: "cls-general",
    name: "General Campus / Prefer Not to Specify",
    level: "Makdisi School",
    viceRepName: "Student Council & Administration",
  },
];

export const BOX_CHAT_CONFIG = {
  schoolName: "Makdisi School",
  appName: "School Plus · Box Chat",
  // Optional: Full-stack AI chat endpoint URL if hosted separately (e.g. Render/Railway)
  chatApiUrl: (import.meta.env.VITE_CHAT_API_URL as string) || "/api/assistant/report-chat",
  // Optional: Webhook URL (Formspree, Google Apps Script, etc.) to receive reports on static GitHub Pages
  submissionWebhookUrl: (import.meta.env.VITE_SUBMISSION_WEBHOOK_URL as string) || "",
} as const;
