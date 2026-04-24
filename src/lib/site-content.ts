import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import siteContentTemplate from "@/content/site-content.json";
import type { MetadataBlock, SiteContent } from "@/lib/site-content-schema";

export const SITE_CONTENT_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "site-content.json"
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertMatchesShape(template: unknown, candidate: unknown, fieldPath: string) {
  if (Array.isArray(template)) {
    if (!Array.isArray(candidate)) {
      throw new Error(`${fieldPath} must be an array.`);
    }

    if (template.length === 0) {
      return;
    }

    candidate.forEach((item, index) => {
      assertMatchesShape(template[0], item, `${fieldPath}[${index}]`);
    });
    return;
  }

  if (isPlainObject(template)) {
    if (!isPlainObject(candidate)) {
      throw new Error(`${fieldPath} must be an object.`);
    }

    const templateKeys = Object.keys(template);
    const candidateKeys = Object.keys(candidate);

    for (const key of templateKeys) {
      if (!(key in candidate)) {
        throw new Error(`${fieldPath}.${key} is required.`);
      }
    }

    for (const key of candidateKeys) {
      if (!(key in template)) {
        throw new Error(`${fieldPath}.${key} is not part of the supported schema.`);
      }
    }

    for (const key of templateKeys) {
      assertMatchesShape(
        (template as Record<string, unknown>)[key],
        (candidate as Record<string, unknown>)[key],
        `${fieldPath}.${key}`
      );
    }
    return;
  }

  if (typeof template !== typeof candidate) {
    throw new Error(`${fieldPath} must be a ${typeof template}.`);
  }
}

export function validateSiteContent(candidate: unknown): SiteContent {
  assertMatchesShape(siteContentTemplate, candidate, "siteContent");
  return candidate as SiteContent;
}

export async function readSiteContentFile() {
  const raw = await readFile(SITE_CONTENT_FILE_PATH, "utf8");
  return validateSiteContent(JSON.parse(raw));
}

export async function getSiteContent() {
  noStore();
  return readSiteContentFile();
}

export async function writeSiteContent(candidate: unknown) {
  const content = validateSiteContent(candidate);
  await writeFile(SITE_CONTENT_FILE_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  return content;
}

export function toPageMetadata(metadata: MetadataBlock) {
  return {
    title: metadata.title,
    description: metadata.description,
  };
}
