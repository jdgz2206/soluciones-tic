process.env.HOST ||= "0.0.0.0";

await import("./dist/server/entry.mjs");
