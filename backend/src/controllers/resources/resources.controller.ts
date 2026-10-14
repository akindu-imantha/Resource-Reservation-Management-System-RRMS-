import type { Request, Response } from "express";
import { listVisibleResources } from "../../models/resources/resources.model.js";

export async function list(_req: Request, res: Response): Promise<void> {
  try { res.json({ resources: await listVisibleResources(_req.user!.role) }); }
  catch (error) { console.error("Resource fetch failed:", error); res.status(500).json({ error: "Could not load resources right now." }); }
}
