import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { createClient } from "@libsql/client";
import postgres from "postgres";
import * as schemaSqlite from "./schema-sqlite";
import * as schemaPg from "./schema-pg";

const pgUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;

export type DbType = LibSQLDatabase<typeof schemaSqlite>;

let db: DbType;
if (pgUrl) {
  const client = postgres(pgUrl, { ssl: "require" });
  const pgDb = drizzlePg(client, {
    schema: schemaPg as unknown as typeof schemaSqlite,
  });
  db = pgDb as unknown as DbType;
} else {
  const url = process.env.DATABASE_URL ?? "file:./school.db";
  const client = createClient({ url, authToken: process.env.AUTH_TOKEN });
  db = drizzleLibsql(client, { schema: schemaSqlite });
}
export { db };
