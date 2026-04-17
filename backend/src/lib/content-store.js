import fs from "node:fs/promises";
import path from "node:path";
import { config, contentFiles } from "../config.js";
import { defaultContent } from "../../../shared/content-defaults.js";

const contentKeys = Object.keys(contentFiles);

function cloneDefault(value) {
  return structuredClone(value);
}

function mergeWithDefaults(defaultValue, currentValue) {
  if (Array.isArray(defaultValue)) {
    if (!Array.isArray(currentValue)) {
      return cloneDefault(defaultValue);
    }

    return Array.from({ length: Math.max(defaultValue.length, currentValue.length) }, (_, index) => {
      const item = currentValue[index];
      const fallback = defaultValue[index];

      if (item === undefined) {
        return cloneDefault(fallback);
      }

      return fallback && typeof fallback === "object" && item && typeof item === "object"
        ? mergeWithDefaults(fallback, item)
        : item;
    });
  }

  if (
    defaultValue &&
    typeof defaultValue === "object" &&
    currentValue &&
    typeof currentValue === "object" &&
    !Array.isArray(currentValue)
  ) {
    const merged = { ...currentValue };

    for (const [key, fallback] of Object.entries(defaultValue)) {
      if (key in currentValue) {
        merged[key] = mergeWithDefaults(fallback, currentValue[key]);
      } else {
        merged[key] = cloneDefault(fallback);
      }
    }

    return merged;
  }

  if (typeof defaultValue === "string" && typeof currentValue === "string") {
    const looksBroken = /Ã|Â|�/.test(currentValue);
    const fallbackLooksHealthy = !/Ã|Â|�/.test(defaultValue);
    return looksBroken && fallbackLooksHealthy ? cloneDefault(defaultValue) : currentValue;
  }

  return currentValue ?? cloneDefault(defaultValue);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureFile(filePath, content) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf8");
  }
}

export async function ensureStorage() {
  await ensureDir(config.contentRoot);
  await ensureDir(config.uploadsRoot);

  await Promise.all(
    contentKeys.map((key) =>
      ensureFile(path.join(config.contentRoot, contentFiles[key]), cloneDefault(defaultContent[key]))
    )
  );
}

export async function readDocument(key) {
  const fileName = contentFiles[key];

  if (!fileName) {
    throw new Error(`Documento desconocido: ${key}`);
  }

  const raw = await fs.readFile(path.join(config.contentRoot, fileName), "utf8");
  return mergeWithDefaults(defaultContent[key], JSON.parse(raw));
}

export async function writeDocument(key, value) {
  const fileName = contentFiles[key];

  if (!fileName) {
    throw new Error(`Documento desconocido: ${key}`);
  }

  const targetPath = path.join(config.contentRoot, fileName);
  const tempPath = `${targetPath}.tmp`;

  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tempPath, targetPath);

  return value;
}

export async function readAllDocuments() {
  const entries = await Promise.all(
    contentKeys.map(async (key) => [key, await readDocument(key)])
  );

  return Object.fromEntries(entries);
}
