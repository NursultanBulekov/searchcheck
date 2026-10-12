# Personal job application tracker

A React + TypeScript app for keeping your remote job search organized.

## Run locally

Use Node.js 22.12+ or 24+:

```sh
npm install
npm run dev
```

Open http://localhost:5173. This command runs both the React frontend and the local AI endpoint. The server binds to your own computer only.

## Features

- Add, edit, and delete applications with company, job title, original posting link, and application date.
- Track Applied, Waiting, Interview, Offer, Rejected, and Completed statuses.
- Select Gmail, Telegram, hh.kz, LinkedIn, Company website, or Other as the application platform.
- Keep received replies and next steps in response notes.
- Paste the original job description; generate and review a short AI summary or write one yourself.
- Search by company, role, summary, or notes and filter by platform or status.
- Export a JSON backup and import it on another device.

Applications are saved in this browser's localStorage. They persist across reloads but do not sync across browsers or devices. Clearing browser data removes them. Export backups regularly.

## Export a backup

1. Open the app and return to the **Applications** list if you are editing a record.
2. Click **Export backup** beside the Applications heading.
3. Save the downloaded `job-applications.json` file. It includes your job links, descriptions, summaries, response notes, and statuses.

## Import a backup

1. Open the app in the browser where you want to restore your applications.
2. In the **Applications** list, click **Import backup**.
3. Select the `.json` file previously downloaded with **Export backup**.
4. Review the preview: it shows how many new applications will be added and how many existing applications will be skipped.
5. Click **Import applications** to save the imported records, or **Cancel** to leave your list unchanged.
6. Check the success message and your Applications list. Imported records are saved in this browser and remain after a reload.

Import adds new records and keeps existing records with the same ID unchanged. Importing the same backup twice does not create duplicates. Import does not overwrite local edits or update existing records; edit those records in the app instead.

Use an unmodified JSON backup exported by this app, up to 5 MB. Invalid JSON, missing required details, unsupported statuses or platforms, invalid dates or job links, and duplicate IDs within a file cause the import to be rejected. An empty backup adds nothing. If validation or saving fails, your current applications remain unchanged.

## Transfer to another device

1. Export a backup on the original device using the steps above.
2. Transfer `job-applications.json` to the other device, for example using a USB drive or your own cloud storage.
3. Set up this project on the other device, run `npm install` and `npm run dev`, and open http://localhost:5173.
4. Import the transferred JSON file using the steps above.

This is a manual transfer, not automatic synchronization. Future changes stay in the browser where you make them until you export and import another backup; existing IDs are still skipped.

Platforms are labels you select manually. This app does not read Gmail, Telegram, or hh.kz or send applications automatically.

## Enable AI summaries

1. Create an API key for [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).
2. Copy `.env.example` to `.env.local`.
3. Set `AI_GATEWAY_API_KEY` to your key and restart `npm run dev`.

The summary button sends only the pasted job description to the AI provider through a local server. API credits are required. Your key is never bundled into browser code. Without a key, tracking still works and the summary field can be filled manually.

`AI_MODEL` is configurable; the default is `openai/gpt-6-luna`. Choose a supported text model from the Gateway catalog.

## Where to code

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Dashboard, application list, filters, and storage updates |
| `src/components/ApplicationForm.tsx` | Application form and AI button |
| `src/types.ts` | Data model, platform/status options, and storage validation |
| `src/App.css` | Page and component styles |
| `src/index.css` | Global styles |
| `server/api.mjs` | Server-side summary endpoint |
| `server/dev.mjs` | Local frontend and API server |

## Checks

```sh
npm run build
npm run lint
npm test
```

`npm run build` creates the frontend in `dist/`. `npm run preview` previews only that frontend; AI summaries require the server started by `npm run dev`. This is a local personal app. A hosted version would need an authenticated backend and a database for cross-device storage.
