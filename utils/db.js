import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon('postgresql://neondb_owner:2g3HwtPXRnLE@ep-nameless-frog-a5wrxanz.us-east-2.aws.neon.tech/neondb?sslmode=require'); // Hardcoded

export const db = drizzle(sql, { schema });
