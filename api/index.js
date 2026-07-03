import app, { startServer } from '../server/server.js';

let isConnected = false;

export default async function handler(req, res) {
  // Ensure database connection and seeding are done once in serverless runtime
  if (!isConnected) {
    await startServer();
    isConnected = true;
  }
  return app(req, res);
}
