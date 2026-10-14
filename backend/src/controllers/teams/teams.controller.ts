import type { Request, Response } from "express";
import { z } from "zod";
import * as model from "../../models/teams/teams.model.js";

const idSchema = z.string().regex(/^\d+$/);
const uniqueViolation = (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23505";

export async function list(req: Request, res: Response): Promise<void> {
  try { res.json({ teams: await model.listTeamsForUser(req.user!.id) }); }
  catch (error) { console.error("Team list failed:", error); res.status(500).json({ error: "Could not load teams." }); }
}
export async function mine(req: Request, res: Response): Promise<void> {
  try { res.json({ teams: await model.listTeamsForMember(req.user!.id) }); }
  catch (error) { console.error("Member teams fetch failed:", error); res.status(500).json({ error: "Could not load your teams." }); }
}
export async function join(req: Request, res: Response): Promise<void> {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid team." }); return; }
  try { const membership = await model.joinTeam(req.user!.id,String(req.params.id)); if (!membership) { res.status(404).json({ error: "Team not found." }); return; } res.status(201).json({ membership }); }
  catch (error) { if (uniqueViolation(error)) res.status(409).json({ error: "You have already joined this team." }); else { console.error("Team join failed:", error); res.status(404).json({ error: "Team not found." }); } }
}
export async function leave(req: Request, res: Response): Promise<void> {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid membership." }); return; }
  try { if (!await model.leaveTeam(req.user!.id,String(req.params.id))) { res.status(404).json({ error: "Membership not found." }); return; } res.status(204).end(); }
  catch (error) { console.error("Team leave failed:", error); res.status(500).json({ error: "Could not leave the team." }); }
}
