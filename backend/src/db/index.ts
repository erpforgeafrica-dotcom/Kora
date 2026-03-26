import { queryDb as realQueryDb } from "./client.js";
import { queryDb as mockQueryDb } from "./mockClient.js";

// Use mock database in demo mode
export const queryDb = process.env.DEMO_MODE === "true" ? mockQueryDb : realQueryDb;