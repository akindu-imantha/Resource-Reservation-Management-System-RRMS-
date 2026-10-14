import type { Request, Response } from "express";
import { getDashboardData } from "../../models/admin/admin.model.js";

export async function overview(_request: Request, response: Response): Promise<void> {
  try {
    const { resources, counts } = await getDashboardData();
    response.json({
      metrics: { resources: Number(counts?.resource_count ?? 0), teams: Number(counts?.team_count ?? 0),
        members: Number(counts?.member_count ?? 0), reservations: Number(counts?.reservation_count ?? 0), pending: Number(counts?.pending_count ?? 0) },
      resources: resources.map((resource) => ({ id: resource.resource_id, name: resource.name, type: resource.type,
        location: resource.location, status: resource.availability_status, category: resource.category_name })),
    });
  } catch (error) {
    console.error("Admin overview fetch failed:", error);
    response.status(500).json({ error: "Could not load the dashboard right now." });
  }
}
