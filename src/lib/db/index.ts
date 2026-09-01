import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { createClient } from "@libsql/client";
import postgres from "postgres";
import * as schema from "./schema";
import * as schemaSqlite from "./schema-sqlite";
import * as schemaPg from "./schema-pg";

const pgUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;

let db: any;
if (pgUrl) {
  const client = postgres(pgUrl, { ssl: "require" });
  db = drizzlePg(client, { schema: schemaPg as any });
} else {
  const url = process.env.DATABASE_URL ?? "file:./school.db";
  const client = createClient({ url, authToken: process.env.AUTH_TOKEN });
  db = drizzleLibsql(client, { schema: schemaSqlite as any });
}
export { db };
