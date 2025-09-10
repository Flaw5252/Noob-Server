import { neon, neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch = true;

const sql = neon(process.env.DATABASE_URL);
