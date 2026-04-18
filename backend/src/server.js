import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import { config } from "./config.js";
import { ensureStorage, readAllDocuments, readDocument, writeDocument } from "./lib/content-store.js";
import { authenticateUser, createToken, requireAuth } from "./lib/auth.js";

const app = express();

await ensureStorage();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, config.uploadsRoot);
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      const safeBase = path
        .basename(file.originalname || "imagen", extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

      callback(null, `${Date.now()}-${safeBase || "imagen"}${extension || ".png"}`);
    }
  }),
  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Solo se permiten imagenes."));
    }

    return callback(null, true);
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (!config.frontendOrigins.length && !config.isProduction) {
        return callback(null, true);
      }

      if (config.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS."));
    },
    credentials: false
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(config.uploadsRoot));
app.use("/branding", express.static(path.join(config.publicRoot, "branding")));
app.use("/placeholders", express.static(path.join(config.publicRoot, "placeholders")));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "soluciones-tic-backend"
  });
});

app.post("/api/auth/login", (request, response) => {
  const { username = "", password = "" } = request.body || {};

  if (!authenticateUser(username, password)) {
    return response.status(401).json({ error: "Credenciales incorrectas." });
  }

  return response.json({
    token: createToken(username)
  });
});

app.get("/api/public/settings", async (_request, response, next) => {
  try {
    response.json(await readDocument("site"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/home", async (_request, response, next) => {
  try {
    response.json(await readDocument("home"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/page/:slug", async (request, response, next) => {
  try {
    const pages = await readDocument("pages");
    const page = pages[request.params.slug];

    if (!page) {
      return response.status(404).json({ error: "Pagina no encontrada." });
    }

    return response.json(page);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/public/blog", async (_request, response, next) => {
  try {
    const posts = await readDocument("blog");
    const ordered = posts.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
    response.json(ordered);
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/blog/:slug", async (request, response, next) => {
  try {
    const posts = await readDocument("blog");
    const post = posts.find((entry) => entry.slug === request.params.slug);

    if (!post) {
      return response.status(404).json({ error: "Articulo no encontrado." });
    }

    return response.json(post);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/public/support", async (_request, response, next) => {
  try {
    response.json(await readDocument("support"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/bootstrap", requireAuth, async (_request, response, next) => {
  try {
    response.json(await readAllDocuments());
  } catch (error) {
    next(error);
  }
});

for (const key of ["site", "home", "pages", "blog", "support"]) {
  app.put(`/api/admin/${key}`, requireAuth, async (request, response, next) => {
    try {
      response.json(await writeDocument(key, request.body));
    } catch (error) {
      next(error);
    }
  });
}

app.post("/api/admin/upload", requireAuth, upload.single("image"), async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "No se recibio ninguna imagen." });
    }

    return response.json({
      path: `/uploads/${request.file.filename}`
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  const message = error?.message || "Error interno del servidor.";
  const status =
    message === "Solo se permiten imagenes."
      ? 400
      : message === "Origen no permitido por CORS."
        ? 403
        : 500;
  response.status(status).json({ error: message });
});

app.listen(config.port, config.host, () => {
  console.log(`Soluciones TIC backend corriendo en http://${config.host}:${config.port}`);
});
