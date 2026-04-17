import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const storageRoot = path.join(backendRoot, "storage");

export const config = {
  backendRoot,
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:4321",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "cambia-esta-clave",
  tokenSecret: process.env.TOKEN_SECRET || "cambia-esta-clave-super-segura",
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
