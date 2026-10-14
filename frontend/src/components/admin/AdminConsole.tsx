import { useCallback, useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FileDown, LogOut, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import SiteFooter from "../layout/SiteFooter";
import AdminSidebar from "../layout/AdminSidebar";
import WorkspaceSearch from "../layout/WorkspaceSearch";
import { downloadTablePdf } from "../../utils/download-table-pdf";
import styles from "../../pages/admin/dashboard.module.css";

type Section = "resources" | "categories" | "teams" | "members" | "reservations";
type Row = Record<string, string | number | null | undefined>;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const configs: Record<Section, { title: string; endpoint: string; collection: string }> = {
  resources: { title: "Resources", endpoint: "/admin/resources", collection: "resources" },
  categories: { title: "Resource categories", endpoint: "/admin/categories", collection: "categories" },
  teams: { title: "Teams", endpoint: "/admin/teams", collection: "teams" },
  members: { title: "Team members", endpoint: "/admin/members", collection: "members" },
  reservations: { title: "Reservations", endpoint: "/admin/reservations", collection: "reservations" },
};

export default function AdminConsole({ section }: { section: Section }) {
  const router = useRouter();
  const config = configs[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [teams, setTeams] = useState<Row[]>([]);
  const [members, setMembers] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${apiUrl}${config.endpoint}`, { credentials: "include" });
      if (response.status === 401) { await router.replace("/login"); return; }
      if (response.status === 403) { await router.replace("/member/dashboard"); return; }
      const data = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load this section.");
      setRows((data[config.collection] as Row[]) ?? []);
      if (section === "resources") {
        const categoryResponse = await fetch(`${apiUrl}/admin/categories`, { credentials: "include" });
        const categoryData = await categoryResponse.json() as { categories?: Row[] };
        setCategories(categoryData.categories ?? []);
      }
      if (section === "members") {
        const teamResponse = await fetch(`${apiUrl}/admin/teams`, { credentials: "include" });
        const teamData = await teamResponse.json() as { teams?: Row[] };
        setTeams(teamData.teams ?? []);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load this section."); }
    finally { setLoading(false); }
  }, [config, router, section]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const body = section === "resources" ? {
      name: form.name, description: form.description || null, categoryId: form.categoryId ? Number(form.categoryId) : null,
      capacity: Number(form.capacity || 1), location: form.location || null, type: form.type || "room", status: form.status || "available",
    } : section === "members" ? { userId: Number(form.userId), teamId: Number(form.teamId) } : { name: form.name, description: form.description || null };
    try {
      const endpoint = section === "members" ? "/admin/memberships" : `${config.endpoint}${editingId ? `/${editingId}` : ""}`;
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: editingId ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save your changes.");
      setForm({}); setEditingId(null); setNotice("Saved successfully."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }

  async function updateStatus(id: string | number, status: string) {
    setError("");
    try {
      const response = await fetch(`${apiUrl}/admin/reservations/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update reservation.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update reservation."); }
  }

  async function removeMembership(id: string | number) {
    const response = await fetch(`${apiUrl}/admin/memberships/${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) setError("Could not remove that team membership."); else await load();
  }

  function editResource(row: Row) {
    setEditingId(String(row.id));
    setForm({ name: String(row.name ?? ""), description: String(row.description ?? ""), categoryId: String(row.categoryId ?? ""),
      capacity: String(row.capacity ?? 1), location: String(row.location ?? ""), type: String(row.type ?? "room"), status: String(row.status ?? "available") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editRow(row: Row) {
    setEditingId(String(row.id));
    setForm({ name: String(row.name ?? ""), description: String(row.description ?? "") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteRow(id: string | number, kind: "categories" | "teams") {
    if (!window.confirm(`Delete this ${kind === "teams" ? "team" : "category"}?`)) return;
    const response = await fetch(`${apiUrl}/admin/${kind}/${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) setError(`Could not delete this ${kind === "teams" ? "team" : "category"}.`);
    else { setNotice("Deleted successfully."); await load(); }
  }

  async function signOut() { await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }); await router.replace("/login"); }

  function exportSearchResults() {
    if (!filteredRows.length) return;
    const exportRows = filteredRows.map((row) => {
      if (section === "resources") return [row.name, row.category ?? row.type, row.type, row.capacity, row.location, row.status];
      if (section === "members") {
        const memberTeams = Array.isArray(row.teams) ? (row.teams as { name?: string }[]).map((team) => team.name).filter(Boolean).join(", ") : "—";
        return [row.name, row.email, row.phone, memberTeams || "Not assigned", row.status];
      }
      return [row.resourceName, row.teamName ?? "Personal", row.userName, row.startTime ? new Date(String(row.startTime)).toLocaleString() : "—",
        row.endTime ? new Date(String(row.endTime)).toLocaleString() : "—", row.purpose, row.status];
    }).map((row) => row.map((value) => String(value ?? "—")));

    const columns = section === "resources"
      ? [{ title: "Resource", weight: 1.5 }, { title: "Category", weight: 1.1 }, { title: "Type" }, { title: "Capacity", weight: .7 }, { title: "Location", weight: 1.1 }, { title: "Status", weight: .8 }]
      : section === "members"
        ? [{ title: "Member", weight: 1.3 }, { title: "Email", weight: 1.8 }, { title: "Phone", weight: 1 }, { title: "Teams", weight: 1.5 }, { title: "Account status", weight: 1 }]
        : [{ title: "Resource", weight: 1.2 }, { title: "Team", weight: 1 }, { title: "Member", weight: 1.2 }, { title: "Starts", weight: 1.3 }, { title: "Ends", weight: 1.3 }, { title: "Purpose", weight: 1.4 }, { title: "Status", weight: .8 }];
    const pdfRows = exportRows.map((row) => row.map(String));
    downloadTablePdf(`${config.title} table`, columns, pdfRows, `rrms-${section}`);
  }

  return <div className={styles.page}>
    <Head><title>{config.title} | Roomly Admin</title></Head>
    <div className={styles.workspaceLayout}><AdminSidebar />
    <main className={styles.main}>
      <div className={styles.headingRow}>
        <div><span className={styles.eyebrow}><ShieldCheck size={15} /> ADMIN WORKSPACE</span><h1>{config.title}</h1></div>
        <button className={styles.signOut} onClick={signOut} type="button"><LogOut size={16} /> Sign out</button>
      </div>
      {section !== "reservations" && <form className={styles.dataForm} onSubmit={submit}>
        {section === "members" ? <>
          <label>Team member<select required value={form.userId ?? ""} onChange={(event) => setForm({ ...form, userId: event.target.value })}><option value="">Choose a member</option>{rows.filter((row) => row.role === "team_member").map((row) => <option key={String(row.id)} value={String(row.id ?? "")}>{row.name} · {row.email}</option>)}</select></label>
          <label>Team<select required value={form.teamId ?? ""} onChange={(event) => setForm({ ...form, teamId: event.target.value })}><option value="">Choose a team</option>{teams.map((team) => <option key={String(team.id)} value={String(team.id ?? "")}>{team.name}</option>)}</select></label>
          <button className={styles.submit} disabled={busy}><Plus size={16} /> Add member to team</button>
        </> : <>
          <div className={styles.formGrid}>
            <label>Name<input required minLength={2} value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            {section === "resources" && <>
              <label>Type<input required placeholder="room, equipment, workspace" value={form.type ?? ""} onChange={(event) => setForm({ ...form, type: event.target.value })} /></label>
              <label>Category<select value={form.categoryId ?? ""} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">No category</option>{categories.map((category) => <option key={String(category.id)} value={String(category.id ?? "")}>{category.name}</option>)}</select></label>
              <label>Capacity<input type="number" min={1} required value={form.capacity ?? "1"} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
              <label>Location<input value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
              <label>Status<select value={form.status ?? "available"} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="maintenance">Maintenance</option></select></label>
            </>}
            <label className={styles.wideField}>Description<textarea rows={2} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          </div>
          <button className={styles.submit} disabled={busy}><Plus size={16} /> {busy ? "Saving…" : editingId ? "Save resource changes" : `Add ${section === "resources" ? "resource" : section === "teams" ? "team" : "category"}`}</button>
          {editingId && <button className={styles.cancelEdit} type="button" onClick={() => { setEditingId(null); setForm({}); }}>Cancel edit</button>}
        </>}
      </form>}
      {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
      <div className={styles.tableActions}><WorkspaceSearch value={searchQuery} onChange={setSearchQuery} placeholder={`Search ${section}…`} resultCount={filteredRows.length} totalCount={rows.length} />{(section === "resources" || section === "members" || section === "reservations") && <button className={styles.exportButton} onClick={exportSearchResults} disabled={!filteredRows.length} type="button"><FileDown size={15} /> Download table PDF</button>}<button className={styles.signOut} onClick={() => void load()} type="button"><RefreshCw size={14} /> Refresh</button></div>
      {loading ? <p className={styles.message}>Loading from the database…</p> : rows.length === 0 ? <section className={styles.welcomeCard}><p>No {section} have been added yet.</p></section> : filteredRows.length === 0 ? <section className={styles.welcomeCard}><p>No {section} match “{searchQuery}”.</p><button className={styles.cancelEdit} onClick={() => setSearchQuery("")} type="button">Clear search</button></section> :
        <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr>{section === "resources" ? <><th>Resource</th><th>Category / type</th><th>Capacity</th><th>Location</th><th>Status</th></> : section === "categories" ? <><th>Category</th><th>Description</th></> : section === "teams" ? <><th>Team</th><th>Description</th><th>Members</th></> : section === "members" ? <><th>Member</th><th>Contact</th><th>Teams</th><th>Account</th></> : <><th>Resource</th><th>Member</th><th>Time</th><th>Purpose</th><th>Status / action</th></>}</tr></thead>
          <tbody>{filteredRows.map((row) => <tr key={row.id}>
            {section === "resources" && <><td><strong>{row.name}</strong><small>{row.description}</small></td><td>{row.category ?? "—"}<small>{row.type}</small></td><td>{row.capacity}</td><td>{row.location ?? "—"}</td><td><span className={styles.tableBadge}>{row.status}</span><div className={styles.rowActions}><button onClick={() => editResource(row)} type="button">Edit</button></div></td></>}
            {section === "categories" && <><td><strong>{row.name}</strong></td><td>{row.description ?? "—"}<div className={styles.rowActions}><button type="button" onClick={() => editRow(row)}>Edit</button><button type="button" onClick={() => void deleteRow(row.id!, "categories")}>Delete</button></div></td></>}
            {section === "teams" && <><td><strong>{row.name}</strong><div className={styles.rowActions}><button type="button" onClick={() => editRow(row)}>Edit</button><button type="button" onClick={() => void deleteRow(row.id!, "teams")}>Delete</button></div></td><td>{row.description ?? "—"}</td><td>{row.memberCount ?? 0}</td></>}
            {section === "members" && <><td><strong>{row.name}</strong><small>{row.role}</small></td><td>{row.email}<small>{row.phone ?? "No phone"}</small></td><td>{(row.teams as { id: number; name: string; membershipId: number }[] | undefined)?.map((team) => <span className={styles.membershipChip} key={team.id}>{team.name}<button type="button" aria-label={`Remove ${String(row.name)} from ${team.name}`} onClick={() => void removeMembership(team.membershipId)}>×</button></span>)}{(row.teams as unknown[] | undefined)?.length === 0 && "Not assigned"}</td><td>{row.status}</td></>}
            {section === "reservations" && <><td><strong>{row.resourceName}</strong><small>{row.teamName ?? "No team"}</small></td><td>{row.userName}<small>{row.email}</small></td><td>{new Date(String(row.startTime)).toLocaleString()}<small>to {new Date(String(row.endTime)).toLocaleString()}</small></td><td>{row.purpose}</td><td><span className={styles.tableBadge}>{row.status}</span>{row.status === "pending" && <div className={styles.rowActions}><button onClick={() => void updateStatus(row.id!, "approved")}>Approve</button><button onClick={() => void updateStatus(row.id!, "rejected")}>Reject</button></div>}</td></>}
          </tr>)}</tbody></table></div>}
      {section === "members" && <p className={styles.hint}>Remove an existing assignment from a member’s Teams page. New accounts are created through team-member registration.</p>}
    </main></div><SiteFooter />
  </div>;
}
