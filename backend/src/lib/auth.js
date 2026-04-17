import crypto from "node:crypto";
import { config } from "../config.js";

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload) {
  return crypto.createHmac("sha256", config.tokenSecret).update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function authenticateUser(username, password) {
  return safeEqual(username, config.adminUsername) && safeEqual(password, config.adminPassword);
}

export function createToken(username) {
  const payload = JSON.stringify({
    sub: username,
    exp: Date.now() + config.tokenTtlMinutes * 60 * 1000
  });
  const encodedPayload = encode(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload));

    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = verifyToken(token);

  if (!payload) {
    return response.status(401).json({ error: "Sesión inválida o vencida." });
  }

  request.user = payload;
  return next();
}
