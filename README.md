# Makdisi School — QR Identification & Box Chat

Standalone mobile-first **Student Identification + Problems & Suggestions Box Chat** ready to export to a dedicated GitHub repository and publish via GitHub Pages for school QR code scanning.

## Run Locally (VS Code)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Publish on GitHub Pages (New Repository)

1. Export/push this project to a new GitHub repository (for example, `makdisi-box-chat`).
2. Open the repository on GitHub → **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. `.github/workflows/deploy.yml` builds and publishes your live link (`https://YOUR_USERNAME.github.io/YOUR_REPO/`).
5. Open your live link, click **QR Poster** in the top bar, and **Print poster** or **Download PNG** to hang around Makdisi School.

## Optional: Receiving Submissions Centrally & Live AI

- **Centralized delivery on GitHub Pages**: Set `VITE_SUBMISSION_WEBHOOK_URL` (e.g. a Formspree or Google Apps Script webhook URL) so student submissions from any phone are delivered to your Vice Representatives / school inbox.
- **Live Gemini AI follow-up chat**: Host `server.ts` on Render or Railway with `GEMINI_API_KEY` set, and set `VITE_CHAT_API_URL` to your `/api/assistant/report-chat` URL. On static GitHub Pages without a backend server, the chat runs in **Guided Intake Mode**.
