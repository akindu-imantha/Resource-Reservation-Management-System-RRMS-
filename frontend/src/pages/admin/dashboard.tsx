import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, CalendarCheck2, CalendarClock, FolderTree, LogOut, Package, ShieldCheck, UsersRound } from "lucide-react";
import SiteFooter from "../../components/layout/SiteFooter";
import AdminSidebar from "../../components/layout/AdminSidebar";
import WorkspaceSearch from "../../components/layout/WorkspaceSearch";
import styles from "./dashboard.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type AdminUser = { name: string; email: string; role: string };
type Overview = {
  metrics: { resources: number; teams: number; members: number; reservations: number; pending: number };
  resources: { id: string; name: string; type: string; location: string | null; status: string; category: string | null }[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const filteredResources = (overview?.resources ?? []).filter((resource) => JSON.stringify(resource).toLowerCase().includes(resourceSearch.trim().toLowerCase()));

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${apiUrl}/auth/me`, { credentials: "include" }),
      fetch(`${apiUrl}/admin/overview`, { credentials: "include" }),
    ])
      .then(async ([sessionResponse, overviewResponse]) => {
        if (!sessionResponse.ok) throw new Error("No active session");
        const result = await sessionResponse.json() as { user: AdminUser };
        if (!active) return;
        if (result.user.role !== "admin") void router.replace("/member/dashboard");
        else {
          setUser(result.user);
          const data = await overviewResponse.json() as Overview & { error?: string };
          if (!overviewResponse.ok) throw new Error(data.error ?? "Could not load dashboard information.");
          if (active) setOverview(data);
        }
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof Error && caught.message !== "No active session") setOverviewError(caught.message);
        if (caught instanceof Error && caught.message === "No active session") void router.replace("/login");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" });
    await router.replace("/login");
  }

  return (
    <div className={styles.page}>
      <Head><title>Admin dashboard | Roomly</title></Head>
      <div className={styles.workspaceLayout}>
      <AdminSidebar />
      <main className={styles.main}>
        <div className={styles.headingRow}>
          <div><span className={styles.eyebrow}><ShieldCheck size={15} /> ADMIN WORKSPACE</span><h1>Dashboard</h1><p className={styles.pageIntro}>A clear overview of your resources, teams, and reservations.</p></div>
          {user && <button className={styles.signOut} onClick={signOut} type="button"><LogOut size={16} /> Sign out</button>}
        </div>
        {loading ? <p className={styles.message}>Checking your secure session…</p> : user && (
          <section className={styles.welcomeCard}>
            <span className={styles.icon}><CalendarCheck2 size={23} /></span>
            <h2>Welcome back, {user.name}</h2>
            <p>You’re signed in as <strong>{user.email}</strong>. Use the shortcuts below to manage your workspace.</p>
          </section>
        )}
        {user && overviewError && <p className={styles.message} role="alert">{overviewError}</p>}
        {user && overview && <>
          <section className={styles.dashboardSection} aria-labelledby="shortcuts-title">
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>GET THINGS DONE</span><h2 id="shortcuts-title">Quick actions</h2></div><span>Choose an area to manage</span></div>
            <nav className={styles.quickLinks} aria-label="Admin sections">
              {[
                { href: "/admin/resources", title: "Manage resources", description: "Add spaces and equipment", icon: Package },
                { href: "/admin/categories", title: "Resource categories", description: "Organize your inventory", icon: FolderTree },
                { href: "/admin/reservations", title: "Review reservations", description: "Approve or decline requests", icon: CalendarClock },
                { href: "/admin/teams", title: "Manage teams", description: "Create and update teams", icon: UsersRound },
                { href: "/admin/members", title: "Team members", description: "Assign members to teams", icon: UsersRound },
      ].map(({ href, title, description, icon: Icon }) => <Link className={styles.quickLink} href={href} key={href} prefetch>
                <span className={styles.quickLinkIcon}><Icon size={19} /></span><span className={styles.quickLinkCopy}><strong>{title}</strong><small>{description}</small></span><ArrowRight className={styles.quickLinkArrow} size={16} />
      </Link>)}
            </nav>
          </section>
          <section className={styles.dashboardSection} aria-labelledby="overview-title">
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>YOUR WORKSPACE</span><h2 id="overview-title">At a glance</h2></div><span>Live totals from your database</span></div>
            <div className={styles.metricGrid} aria-label="Workspace summary">
            {[["Resources", overview.metrics.resources], ["Teams", overview.metrics.teams], ["Team members", overview.metrics.members], ["Reservations", overview.metrics.reservations], ["Pending", overview.metrics.pending]].map(([label, value]) =>
              <a className={styles.metricCard} href={label === "Resources" ? "/admin/resources" : label === "Teams" ? "/admin/teams" : label === "Team members" ? "/admin/members" : "/admin/reservations"} key={label}><span>{label === "Pending" ? "Needs review" : label}</span><strong>{value}</strong><small className={styles.metricNote}>{label === "Resources" ? "Spaces and equipment" : label === "Teams" ? "In your workspace" : label === "Team members" ? "Registered accounts" : label === "Reservations" ? "All booking requests" : "Pending requests"}</small><small className={styles.metricAction}>View details <ArrowRight size={13} /></small></a>)}
            </div>
          </section>
          <section className={styles.resourceSection}>
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>SPACES & EQUIPMENT</span><h2>Resource inventory</h2><p className={styles.sectionDescription}>A sample of the resources your team can reserve.</p></div><a className={styles.sectionAction} href="/admin/resources">View all resources <ArrowRight size={14} /></a></div>
            {overview.resources.length === 0 ? <p className={styles.message}>No resources yet. Run the admin seed command to add sample resources.</p> :
              <><WorkspaceSearch value={resourceSearch} onChange={setResourceSearch} placeholder="Search resources by name, type, category, or location…" resultCount={filteredResources.length} totalCount={overview.resources.length} />{filteredResources.length === 0 ? <p className={styles.message}>No resources match “{resourceSearch}”.</p> : <div className={styles.resourceGrid}>{filteredResources.map((resource) => <article className={styles.resourceCard} key={resource.id}>
                <div className={styles.resourceTop}><span className={styles.resourceCategory}>{resource.category ?? resource.type}</span><span className={`${styles.status} ${resource.status === "available" ? styles.available : ""}`}>{resource.status}</span></div>
                <h3>{resource.name}</h3><p>{resource.location ?? "Location not set"}</p><a className={styles.inlineAction} href="/admin/resources">Manage inventory <ArrowRight size={14} /></a>
              </article>)}</div>}</>}
          </section>
        </>}
      </main>
      </div>
      <SiteFooter />
    </div>
  );
}
