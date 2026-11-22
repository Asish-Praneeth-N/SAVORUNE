import { defineConfig } from "drizzle-kit";

// DATABASE_URL is read from the environment at generate/migrate time only.
// The schema module is added in Block 2; migrations are reviewed before apply.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
