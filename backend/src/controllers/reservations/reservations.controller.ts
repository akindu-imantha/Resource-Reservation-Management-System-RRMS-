import type { Request, Response } from "express";
import { z } from "zod";
import { cancelReservation, createReservation, listReservationsForUser, ReservationModelError } from "../../models/reservations/reservations.model.js";

const reservationSchema = z.object({
  resourceId: z.coerce.number().int().positive(), teamId: z.coerce.number().int().positive().nullable().optional(),
  startTime: z.string().datetime(), endTime: z.string().datetime(), purpose: z.string().trim().min(3).max(500),
});
const idSchema = z.string().regex(/^\d+$/);

export async function list(req: Request, res: Response): Promise<void> {
  try { res.json({ reservations: await listReservationsForUser(req.user!.id) }); }
  catch (error) { console.error("Reservation list failed:", error); res.status(500).json({ error: "Could not load reservations." }); }
}
export async function create(req: Request, res: Response): Promise<void> {
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success || new Date(parsed.data?.endTime ?? 0) <= new Date(parsed.data?.startTime ?? 0)) { res.status(400).json({ error: "Choose a resource, valid future start/end times, and a purpose." }); return; }
  if (new Date(parsed.data.startTime) <= new Date()) { res.status(400).json({ error: "Reservations must start in the future." }); return; }
  try { const reservation = await createReservation(req.user!.id,parsed.data); res.status(201).json({ reservation }); }
  catch (error) { if (error instanceof ReservationModelError) { res.status(error.status).json({ error: error.message }); return; } console.error("Reservation create failed:", error); res.status(500).json({ error: "Could not create the reservation." }); }
}
export async function cancel(req: Request, res: Response): Promise<void> {
  if (!idSchema.safeParse(req.params.id).success) { res.status(400).json({ error: "Invalid reservation." }); return; }
  try { const reservation = await cancelReservation(req.user!.id,String(req.params.id)); if (!reservation) { res.status(409).json({ error: "Only your pending reservations can be cancelled." }); return; } res.json({ reservation }); }
  catch (error) { console.error("Reservation cancellation failed:", error); res.status(500).json({ error: "Could not cancel the reservation." }); }
}
