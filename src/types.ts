export const statuses = [
  "Applied",
  "Waiting",
  "Interview",
  "Offer",
  "Rejected",
  "Completed",
] as const;
export const platforms = [
  "Gmail",
  "Telegram",
  "hh.kz",
  "LinkedIn",
  "Company website",
  "Other",
] as const;
export type Status = (typeof statuses)[number];
export type Platform = (typeof platforms)[number];
export interface Application {
  id: string;
  company: string;
  role: string;
  url: string;
  platform: Platform;
  status: Status;
  appliedOn: string;
  description: string;
  summary: string;
  response: string;
}
export type Draft = Omit<Application, "id">;
export const STORAGE_KEY = "jobappl.applications.v1";
export function readApplications(): Application[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(isApplication))
    throw new Error(
      "Saved data could not be read. Export or recover your browser data before making changes.",
    );
  return data;
}
export function isApplication(value: unknown): value is Application {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    [
      "id",
      "company",
      "role",
      "url",
      "appliedOn",
      "description",
      "summary",
      "response",
    ].every((k) => typeof a[k] === "string") &&
    platforms.includes(a.platform as Platform) &&
    statuses.includes(a.status as Status)
  );
}
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
