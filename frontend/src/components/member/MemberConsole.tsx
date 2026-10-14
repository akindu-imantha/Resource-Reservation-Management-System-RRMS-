import { useCallback, useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { CalendarPlus, LogOut, Users, UserRound } from "lucide-react";
import SiteFooter from "../layout/SiteFooter";
import MemberSidebar from "../layout/MemberSidebar";
import WorkspaceSearch from "../layout/WorkspaceSearch";
import styles from "../../pages/admin/dashboard.module.css";

type Section = "resources" | "reservations" | "teams" | "profile";
type Resource = { id: string; name: string; description: string | null; category: string | null; location: string | null; capacity: number; type: string };
type Reservation = { id: string; resourceName: string; teamName: string | null; startTime: string; endTime: string; purpose: string; status: string };
type Team = { id: string; name: string; description: string | null; memberCount: number; isMember: boolean; membershipId?: string };
type Account = { id: string; name: string; email: string; role: string; phone: string | null };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const headings: Record<Section, string> = { resources: "Find a resource", reservations: "My reservations", teams: "Teams", profile: "My profile" };

export default function MemberConsole({ section }: { section: Section }) {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredResources = resources.filter((resource) => JSON.stringify(resource).toLowerCase().includes(searchTerm));
  const filteredReservations = reservations.filter((reservation) => JSON.stringify(reservation).toLowerCase().includes(searchTerm));
  const filteredTeams = teams.filter((team) => JSON.stringify(team).toLowerCase().includes(searchTerm));

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const sessionResponse = await fetch(`${apiUrl}/auth/me`, { credentials: "include" });
      if (!sessionResponse.ok) { await router.replace("/login"); return; }
      const session = await sessionResponse.json() as { user: Account };
      if (session.user.role === "admin") { await router.replace("/admin/dashboard"); return; }
      setUser(session.user);
      if (section === "resources") {
        const response = await fetch(`${apiUrl}/resources`, { credentials: "include" });
        const data = await response.json() as { resources?: Resource[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load resources.");
        setResources(data.resources ?? []);
      } else if (section === "reservations") {
        const [reservationResponse, resourcesResponse, teamsResponse] = await Promise.all([
          fetch(`${apiUrl}/reservations`, { credentials: "include" }), fetch(`${apiUrl}/resources`, { credentials: "include" }), fetch(`${apiUrl}/teams/mine`, { credentials: "include" }),
        ]);
        const data = await reservationResponse.json() as { reservations?: Reservation[]; error?: string };
        const resourceData = await resourcesResponse.json() as { resources?: Resource[] };
        const teamData = await teamsResponse.json() as { teams?: Team[] };
        if (!reservationResponse.ok) throw new Error(data.error ?? "Could not load reservations.");
        setReservations(data.reservations ?? []); setResources(resourceData.resources ?? []); setTeams(teamData.teams ?? []);
      } else if (section === "teams") {
        const [teamResponse, myResponse] = await Promise.all([fetch(`${apiUrl}/teams`, { credentials: "include" }), fetch(`${apiUrl}/teams/mine`, { credentials: "include" })]);
        const data = await teamResponse.json() as { teams?: Team[]; error?: string };
        const mine = await myResponse.json() as { teams?: (Team & { membershipId: string })[] };
        if (!teamResponse.ok) throw new Error(data.error ?? "Could not load teams.");
        const membershipByTeam = new Map((mine.teams ?? []).map((team) => [team.id, team.membershipId]));
        setTeams((data.teams ?? []).map((team) => ({ ...team, membershipId: membershipByTeam.get(team.id) })));
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load this page."); }
    finally { setLoading(false); }
  }, [router, section]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (section === "reservations" && typeof router.query.resource === "string") setResourceId(router.query.resource);
  }, [router.query.resource, section]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const endpoint = section === "reservations" ? "/reservations" : "/profile";
    const body = section === "reservations" ? { resourceId: Number(resourceId), teamId: form.teamId ? Number(form.teamId) : null,
      startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), purpose: form.purpose } : {
      name: (form.name ?? user?.name ?? "").trim(),
      phone: (form.phone ?? user?.phone ?? "").trim() || null,
    };
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, { method: section === "profile" ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { error?: string; user?: Account };
      if (!response.ok) throw new Error(data.error ?? "Could not save your changes.");
      if (data.user) setUser(data.user);
      setNotice(section === "profile" ? "Your profile has been updated." : "Your reservation request was sent.");
      if (section === "reservations") { setForm({}); setResourceId(""); }
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }

  async function teamAction(team: Team) {
    setError("");
    try {
      const response = await fetch(`${apiUrl}${team.isMember ? `/teams/memberships/${team.membershipId}` : `/teams/${team.id}/join`}`, { method: team.isMember ? "DELETE" : "POST", credentials: "include" });
      if (!response.ok) { const data = await response.json() as { error?: string }; throw new Error(data.error ?? "Could not update team membership."); }
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update team membership."); }
  }

  async function cancelReservation(id: string) {
    const response = await fetch(`${apiUrl}/reservations/${id}/cancel`, { method: "PATCH", credentials: "include" });
    if (!response.ok) { const data = await response.json() as { error?: string }; setError(data.error ?? "Could not cancel reservation."); }
    else await load();
  }
  async function signOut() { await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }); await router.replace("/login"); }

  return <div className={styles.page}><Head><title>{headings[section]} | Roomly</title></Head>
    <div className={styles.workspaceLayout}><MemberSidebar />
    <main className={styles.main}>
      <div className={styles.headingRow}><div><span className={styles.eyebrow}><UserRound size={15} /> TEAM MEMBER WORKSPACE</span><h1>{headings[section]}</h1></div>{user && <button className={styles.signOut} type="button" onClick={signOut}><LogOut size={16} /> Sign out</button>}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
      {loading ? <p className={styles.message}>Loading your workspace…</p> : <>
        {section !== "profile" && <WorkspaceSearch value={searchQuery} onChange={setSearchQuery} placeholder={section === "resources" ? "Search by resource, type, or location…" : section === "teams" ? "Search teams…" : "Search reservations…"} resultCount={section === "resources" ? filteredResources.length : section === "teams" ? filteredTeams.length : filteredReservations.length} totalCount={section === "resources" ? resources.length : section === "teams" ? teams.length : reservations.length} />}
        {section === "resources" && <div className={styles.resourceGrid}>{filteredResources.map((resource) => <article className={styles.resourceCard} key={resource.id}><span className={styles.resourceCategory}>{resource.category ?? resource.type}</span><h3>{resource.name}</h3><p>{resource.description ?? "Available for your team."}</p><small>{resource.location ?? "Location not set"} · Capacity {resource.capacity}</small><a className={styles.inlineAction} href={`/member/reservations?resource=${resource.id}`}><CalendarPlus size={14} /> Request a reservation</a></article>)}{filteredResources.length === 0 && <p className={styles.message}>{resources.length === 0 ? "No resources are available right now." : `No resources match “${searchQuery}”.`}</p>}</div>}
        {section === "reservations" && <>
          <form className={styles.dataForm} onSubmit={submit}><h2>Request a reservation</h2><div className={styles.formGrid}>
            <label>Resource<select required value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Choose a resource</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label>
            <label>Team (optional)<select value={form.teamId ?? ""} onChange={(event) => setForm({ ...form, teamId: event.target.value })}><option value="">Personal reservation</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>Start<input type="datetime-local" required min={new Date().toISOString().slice(0,16)} value={form.startTime ?? ""} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
            <label>End<input type="datetime-local" required min={form.startTime ?? new Date().toISOString().slice(0,16)} value={form.endTime ?? ""} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
            <label className={styles.wideField}>Purpose<input required minLength={3} maxLength={500} value={form.purpose ?? ""} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></label>
          </div><button className={styles.submit} disabled={busy}><CalendarPlus size={15} /> {busy ? "Sending…" : "Request reservation"}</button></form>
          <h2 className={styles.listHeading}>Your requests</h2>{filteredReservations.length > 0 ? <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Resource</th><th>Time</th><th>Purpose</th><th>Status</th><th /></tr></thead><tbody>{filteredReservations.map((reservation) => <tr key={reservation.id}><td><strong>{reservation.resourceName}</strong><small>{reservation.teamName ?? "Personal"}</small></td><td>{new Date(reservation.startTime).toLocaleString()}<small>to {new Date(reservation.endTime).toLocaleString()}</small></td><td>{reservation.purpose}</td><td><span className={styles.tableBadge}>{reservation.status}</span></td><td>{reservation.status === "pending" && <button className={styles.rowButton} onClick={() => void cancelReservation(reservation.id)}>Cancel</button>}</td></tr>)}</tbody></table></div> : <p className={styles.message}>{reservations.length === 0 ? "You have no reservations yet." : `No reservations match “${searchQuery}”.`}</p>}
        </>}
        {section === "teams" && <div className={styles.resourceGrid}>{filteredTeams.map((team) => <article className={styles.resourceCard} key={team.id}><span className={styles.resourceCategory}><Users size={13} /> {team.memberCount} members</span><h3>{team.name}</h3><p>{team.description ?? "A shared team workspace."}</p><button className={styles.rowButton} onClick={() => void teamAction(team)}>{team.isMember ? "Leave team" : "Join team"}</button></article>)}{filteredTeams.length === 0 && <p className={styles.message}>{teams.length === 0 ? "No teams available yet." : `No teams match “${searchQuery}”.`}</p>}</div>}
        {section === "profile" && user && <form className={styles.dataForm} onSubmit={submit}><div className={styles.formGrid}><label>Full name<input required minLength={2} maxLength={120} value={form.name ?? user.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input disabled value={user.email} /></label><label>Phone<input value={form.phone ?? user.phone ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div><button className={styles.submit} disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></form>}
      </>}
    </main></div><SiteFooter /></div>;
}
