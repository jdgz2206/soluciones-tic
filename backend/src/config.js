import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const isProduction = process.env.NODE_ENV === "production";
const storageRoot =
  process.env.STORAGE_ROOT || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(backendRoot, "storage");
const frontendOrigins = (process.env.FRONTEND_ORIGIN || (isProduction ? "" : "http://localhost:4321"))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function getAdminConfig(name, developmentFallback) {
  const configuredValue = process.env[name]?.trim();

  if (configuredValue) {
    return configuredValue;
  }

  if (!isProduction) {
    return developmentFallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  backendRoot,
  isProduction,
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 4000),
  frontendOrigins,
  adminUsername: getAdminConfig("ADMIN_USERNAME", "admin"),
  adminPassword: getAdminConfig("ADMIN_PASSWORD", "cambia-esta-clave"),
  tokenSecret: getAdminConfig("TOKEN_SECRET", "cambia-esta-clave-super-segura"),
  tokenTtlMinutes: Number(process.env.TOKEN_TTL_MINUTES || 720),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
  storageRoot,
  contentRoot: path.join(storageRoot, "content"),
  uploadsRoot: path.join(storageRoot, "uploads"),
  publicRoot: path.join(backendRoot, "public")
};

export const contentFiles = {
  site: "site.json",
  home: "home.json",
  pages: "pages.json",
  blog: "blog.json",
  support: "support.json"
};
