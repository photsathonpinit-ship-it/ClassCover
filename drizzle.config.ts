import { defineConfig } from "drizzle-kit";

const pgUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: pgUrl?.startsWith("postgres") ? "postgresql" : "sqlite",
  dbCredentials: pgUrl?.startsWith("postgres")
    ? { url: pgUrl }
    : { url: "file:./school.db" },
} as any);
