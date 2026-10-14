import type { Request, Response } from "express";
import { z } from "zod";
import { updateProfile } from "../../models/profile/profile.model.js";

const profileSchema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(40).nullable() });

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter a valid name and phone number." }); return; }
  try { const user = await updateProfile(req.user!.id,parsed.data.name,parsed.data.phone); if (!user) { res.status(404).json({ error: "Account not found." }); return; } res.json({ user }); }
  catch (error) { console.error("Profile update failed:", error); res.status(500).json({ error: "Could not update the profile." }); }
}
