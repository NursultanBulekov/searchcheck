import { isApplication } from "./types.ts";
import type { Application } from "./types.ts";

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function parseBackup(text: string): Application[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a backup exported by this app.",
    );
  }
  if (!Array.isArray(data) || !data.every(isApplication)) {
    throw new Error(
      "This file is not an application backup. No applications were changed.",
    );
  }
  const ids = new Set<string>();
  for (const application of data) {
    const date = new Date(`${application.appliedOn}T12:00:00Z`);
    if (
      !application.id.trim() ||
      !application.company.trim() ||
      !application.role.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(application.appliedOn) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== application.appliedOn
    ) {
      throw new Error(
        "A backup record has missing details or an invalid date. No applications were changed.",
      );
    }
    if (application.url) {
      try {
        const url = new URL(application.url);
        if (url.protocol !== "http:" && url.protocol !== "https:")
          throw new Error();
      } catch {
        throw new Error(
          "A backup record has an invalid job link. No applications were changed.",
        );
      }
    }
    if (ids.has(application.id)) {
      throw new Error(
        "This backup contains duplicate application IDs. No applications were changed.",
      );
    }
    ids.add(application.id);
  }
  // Copy only application fields from untrusted JSON.
  return data.map(
    ({
      id,
      company,
      role,
      url,
      platform,
      status,
      appliedOn,
      description,
      summary,
      response,
    }) => ({
      id,
      company,
      role,
      url,
      platform,
      status,
      appliedOn,
      description,
      summary,
      response,
    }),
  );
}

export function mergeBackup(current: Application[], imported: Application[]) {
  const existingIds = new Set(current.map((application) => application.id));
  const additions = imported.filter(
    (application) => !existingIds.has(application.id),
  );
  return {
    applications: [...additions, ...current],
    added: additions.length,
    skipped: imported.length - additions.length,
  };
}
