import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./utils/schema.js",
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:2g3HwtPXRnLE@ep-nameless-frog-a5wrxanz.us-east-2.aws.neon.tech/neondb?sslmode=require"
  }
});