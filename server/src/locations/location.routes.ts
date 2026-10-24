import { Router } from "express";
import { pool } from "../db/pool.js";

export interface Location {
  id: number;
  name: string;
  area: string;
}

export const locationsRouter = Router();

// Small, read-only lookup for the form and filter dropdowns, so the SQL lives here.
locationsRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query<Location>("SELECT id, name, area FROM locations ORDER BY name");
  res.json({ data: rows });
});
