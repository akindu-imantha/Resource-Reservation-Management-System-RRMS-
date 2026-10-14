import type { Request, Response } from "express";
import { z } from "zod";
import * as model from "../../models/admin/management.model.js";
import { sendReservationApprovalNotification } from "../../services/notifications/reservation-email.service.js";

const resourceSchema = z.object({
  name: z.string().trim().min(2).max(160), description: z.string().trim().max(1000).nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(), capacity: z.coerce.number().int().positive(),
  location: z.string().trim().max(160).nullable().optional(), type: z.string().trim().min(2).max(80),
  status: z.enum(["available", "unavailable", "maintenance"]).optional(),
});
const namedSchema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).nullable().optional() });
const idSchema = z.string().regex(/^\d+$/);
const isUniqueViolation = (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23505";

export async function getResources(_req: Request, res: Response) {
  try { res.json({ resources: await model.listResources() }); }
  catch (error) { console.error("Admin resource list failed:", error); res.status(500).json({ error: "Could not load resources." }); }
}
export async function createResource(req: Request, res: Response) {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Check the resource details and try again." }); return; }
  try { res.status(201).json({ resource: await model.createResource(parsed.data) }); }
  catch (error) { console.error("Resource create failed:", error); res.status(500).json({ error: "Could not create the resource." }); }
}
export async function editResource(req: Request, res: Response) {
  const data = resourceSchema.partial().safeParse(req.body);
  if (!idSchema.safeParse(req.params.id).success || !data.success) { res.status(400).json({ error: "Check the resource details and try again." }); return; }
  try { const resource = await model.updateResource(String(req.params.id), data.data); if (!resource) { res.status(404).json({ error: "Resource not found." }); return; } res.json({ resource }); }
  catch (error) { console.error("Resource update failed:", error); res.status(500).json({ error: "Could not update the resource." }); }
}
export async function removeResource(req: Request, res: Response) {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid resource." }); return; }
  try { if (!await model.deleteResource(String(req.params.id))) { res.status(404).json({ error: "Resource not found." }); return; } res.status(204).end(); }
  catch { res.status(409).json({ error: "This resource has reservations and cannot be deleted. Mark it unavailable instead." }); }
}

export async function getCategories(_req: Request, res: Response) {
  try { res.json({ categories: await model.listCategories() }); }
  catch (error) { console.error("Category list failed:", error); res.status(500).json({ error: "Could not load categories." }); }
}
export async function createCategory(req: Request, res: Response) {
  const data = namedSchema.safeParse(req.body);
  if (!data.success) { res.status(400).json({ error: "Enter a category name." }); return; }
  try { res.status(201).json({ category: await model.createCategory(data.data) }); }
  catch (error) { res.status(isUniqueViolation(error) ? 409 : 500).json({ error: isUniqueViolation(error) ? "That category already exists." : "Could not create the category." }); }
}
export async function editCategory(req: Request, res: Response) {
  const data = namedSchema.partial().safeParse(req.body);
  if (!idSchema.safeParse(req.params.id).success || !data.success) { res.status(400).json({ error: "Enter a valid category name." }); return; }
  try { const category = await model.updateCategory(String(req.params.id), data.data); if (!category) { res.status(404).json({ error: "Category not found." }); return; } res.json({ category }); }
  catch (error) { res.status(isUniqueViolation(error) ? 409 : 500).json({ error: isUniqueViolation(error) ? "That category name is already in use." : "Could not update the category." }); }
}
export async function removeCategory(req: Request, res: Response) {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid category." }); return; }
  try { if (!await model.deleteCategory(String(req.params.id))) { res.status(404).json({ error: "Category not found." }); return; } res.status(204).end(); }
  catch { res.status(409).json({ error: "This category is in use and cannot be deleted." }); }
}

export async function getTeams(_req: Request, res: Response) {
  try { res.json({ teams: await model.listTeams() }); }
  catch (error) { console.error("Team list failed:", error); res.status(500).json({ error: "Could not load teams." }); }
}
export async function createTeam(req: Request, res: Response) {
  const data = namedSchema.safeParse(req.body);
  if (!data.success) { res.status(400).json({ error: "Enter a team name." }); return; }
  try { res.status(201).json({ team: await model.createTeam(data.data) }); }
  catch (error) { res.status(isUniqueViolation(error) ? 409 : 500).json({ error: isUniqueViolation(error) ? "That team name is already in use." : "Could not create the team." }); }
}
export async function editTeam(req: Request, res: Response) {
  const data = namedSchema.partial().safeParse(req.body);
  if (!idSchema.safeParse(req.params.id).success || !data.success) { res.status(400).json({ error: "Enter a valid team name." }); return; }
  try { const team = await model.updateTeam(String(req.params.id), data.data); if (!team) { res.status(404).json({ error: "Team not found." }); return; } res.json({ team }); }
  catch (error) { res.status(isUniqueViolation(error) ? 409 : 500).json({ error: isUniqueViolation(error) ? "That team name is already in use." : "Could not update the team." }); }
}
export async function removeTeam(req: Request, res: Response) {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid team." }); return; }
  try { if (!await model.deleteTeam(String(req.params.id))) { res.status(404).json({ error: "Team not found." }); return; } res.status(204).end(); }
  catch { res.status(409).json({ error: "This team still has members or reservations and cannot be deleted." }); }
}

export async function getMembers(_req: Request, res: Response) {
  try { res.json({ members: await model.listMembers() }); }
  catch (error) { console.error("Member list failed:", error); res.status(500).json({ error: "Could not load team members." }); }
}
export async function createMembership(req: Request, res: Response) {
  const input = z.object({ userId: z.coerce.number().int().positive(), teamId: z.coerce.number().int().positive() }).safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Choose a member and a team." }); return; }
  try { const membership = await model.addMembership(input.data.userId, input.data.teamId); if (!membership) { res.status(404).json({ error: "Team member or team not found." }); return; } res.status(201).json({ membership }); }
  catch (error) { res.status(isUniqueViolation(error) ? 409 : 404).json({ error: isUniqueViolation(error) ? "That member is already on the team." : "Team member or team not found." }); }
}
export async function removeMembership(req: Request, res: Response) {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid membership." }); return; }
  try { if (!await model.removeMembership(String(req.params.id))) { res.status(404).json({ error: "Membership not found." }); return; } res.status(204).end(); }
  catch (error) { console.error("Membership removal failed:", error); res.status(500).json({ error: "Could not remove membership." }); }
}

export async function getReservations(_req: Request, res: Response) {
  try { res.json({ reservations: await model.listReservations() }); }
  catch (error) { console.error("Reservation list failed:", error); res.status(500).json({ error: "Could not load reservations." }); }
}
export async function editReservation(req: Request, res: Response) {
  const input = z.object({ status: z.enum(["approved", "rejected", "cancelled", "completed"]) }).safeParse(req.body);
  if (!idSchema.safeParse(req.params.id).success || !input.success) { res.status(400).json({ error: "Invalid reservation status." }); return; }
  try {
    const reservation = await model.updateReservation(String(req.params.id), input.data.status);
    if (!reservation) { res.status(404).json({ error: "Reservation not found." }); return; }
    if (reservation.status === "approved" && reservation.previousStatus === "pending") {
      try { await sendReservationApprovalNotification(String(reservation.id)); }
      catch (error) { console.error("Could not send reservation approval notifications:", error); }
    }
    res.json({ reservation: { id: reservation.id, status: reservation.status } });
  }
  catch (error) { console.error("Reservation update failed:", error); res.status(500).json({ error: "Could not update reservation." }); }
}
