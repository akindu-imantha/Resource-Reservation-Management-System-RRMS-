import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, CalendarCheck2, CalendarClock, CalendarDays, CalendarPlus, LogOut, MapPin, Package, UserRound, UsersRound } from "lucide-react";
import SiteFooter from "../../components/layout/SiteFooter";
import MemberSidebar from "../../components/layout/MemberSidebar";
import WorkspaceSearch from "../../components/layout/WorkspaceSearch";
import styles from "../admin/dashboard.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Account = { name: string; email: string; role: string };
type Resource = { id: string; name: string; description: string | null; category: string | null; location: string | null; capacity: number; type: string };
type Reservation = { id: string; resourceName: string; startTime: string; endTime: string; purpose: string; status: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [resourceError, setResourceError] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const filteredResources = resources.filter((resource) => JSON.stringify(resource).toLowerCase().includes(resourceSearch.trim().toLowerCase()));
  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sign-in required");
        return response.json() as Promise<{ user: Account }>;
      })
      .then(({ user: account }) => {
        if (!active) return;
        if (account.role === "admin") void router.replace("/admin/dashboard");
        else {
          setUser(account);
          void Promise.all([
            fetch(`${apiUrl}/resources`, { credentials: "include" }),
            fetch(`${apiUrl}/reservations`, { credentials: "include" }),
            fetch(`${apiUrl}/teams/mine`, { credentials: "include" }),
          ]).then(async ([resourceResponse, reservationResponse, teamResponse]) => {
            const [resourceData, reservationData, teamData] = await Promise.all([
              resourceResponse.json() as Promise<{ resources?: Resource[]; error?: string }>,
              reservationResponse.json() as Promise<{ reservations?: Reservation[]; error?: string }>,
              teamResponse.json() as Promise<{ teams?: unknown[]; error?: string }>,
            ]);
            if (!resourceResponse.ok) throw new Error(resourceData.error ?? "Could not load resources.");
            if (!reservationResponse.ok) throw new Error(reservationData.error ?? "Could not load reservations.");
            if (!teamResponse.ok) throw new Error(teamData.error ?? "Could not load teams.");
            if (!active) return;
            setResources(resourceData.resources ?? []);
            setReservations(reservationData.reservations ?? []);
            setTeamCount(teamData.teams?.length ?? 0);
          }).catch((caught: unknown) => { if (active) setResourceError(caught instanceof Error ? caught.message : "Could not load workspace data."); })
            .finally(() => { if (active) setWorkspaceLoading(false); });
        }
      })
      .catch(() => { if (active) void router.replace("/login"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" });
    await router.replace("/login");
  }

  return <div className={styles.page}>
    <Head><title>My workspace | Roomly</title></Head>
    <div className={styles.workspaceLayout}>
    <MemberSidebar />
    <main className={styles.main}>
      <div className={styles.headingRow}>
        <div><span className={styles.eyebrow}><CalendarCheck2 size={15} /> TEAM MEMBER WORKSPACE</span><h1>My workspace</h1></div>
        {user && <button className={styles.signOut} onClick={signOut} type="button"><LogOut size={16} /> Sign out</button>}
      </div>
      {loading ? <p className={styles.message}>Checking your secure session…</p> : user && <section className={styles.welcomeCard}>
        <span className={styles.icon}><CalendarCheck2 size={23} /></span>
        <h2>Welcome, {user.name}</h2>
        <p>You are signed in as <strong>{user.email}</strong>. Your account and reservations are stored in the shared workspace database.</p>
      </section>}
      {user && <section className={styles.resourcesSection}>
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>YOUR WORKSPACE</span><h2>What would you like to do?</h2></div><span>Choose a section to get started</span></div>
        <nav className={styles.quickLinks} aria-label="Team member sections">
          {[
            { href: "/member/resources", title: "Browse resources", description: "Find a room or equipment", icon: Package },
            { href: "/member/reservations", title: "My reservations", description: "View and manage your bookings", icon: CalendarClock },
            { href: "/member/teams", title: "Teams", description: "See and join your teams", icon: UsersRound },
            { href: "/member/profile", title: "My profile", description: "Update your account details", icon: UserRound },
          ].map(({ href, title, description, icon: Icon }) => <Link className={styles.quickLink} href={href} key={href} prefetch>
            <span className={styles.quickLinkIcon}><Icon size={19} /></span><span className={styles.quickLinkCopy}><strong>{title}</strong><small>{description}</small></span><ArrowRight className={styles.quickLinkArrow} size={16} />
          </Link>)}
        </nav>
        <section className={styles.memberMetricGrid} aria-label="Your workspace at a glance">
          <Link className={styles.memberMetricCard} href="/member/resources" prefetch><span><CalendarCheck2 size={17} /> Available resources</span><strong>{resources.length}</strong><small>Find a space to book <ArrowRight size={13} /></small></Link>
          <Link className={styles.memberMetricCard} href="/member/reservations" prefetch><span><CalendarDays size={17} /> Your reservations</span><strong>{reservations.length}</strong><small>Review your requests <ArrowRight size={13} /></small></Link>
          <Link className={styles.memberMetricCard} href="/member/teams" prefetch><span><UsersRound size={17} /> Your teams</span><strong>{teamCount}</strong><small>Open team directory <ArrowRight size={13} /></small></Link>
        </section>
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}><Package size={14} /> AVAILABLE TO YOUR TEAM</span><h2>Resources you can book</h2><p className={styles.sectionDescription}>Choose a resource to see available reservation times.</p></div><span>{resources.length} available</span></div>
        <WorkspaceSearch value={resourceSearch} onChange={setResourceSearch} placeholder="Search resources by name, type, or location…" resultCount={filteredResources.length} totalCount={resources.length} />
        {workspaceLoading ? <p className={styles.message}>Loading your reservations and team details…</p> : resourceError ? <p className={styles.message} role="alert">{resourceError}</p> : filteredResources.length === 0 ? <p className={styles.message}>{resources.length === 0 ? "No available resources yet." : `No resources match “${resourceSearch}”.`}</p> :
          <div className={styles.resourceGrid}>{filteredResources.map((resource) => <article className={styles.resourceCard} key={resource.id}>
            <span className={styles.resourceCategory}>{resource.category ?? resource.type}</span><h3>{resource.name}</h3>
            <p>{resource.description ?? "Available for your team to reserve."}</p>
            <small className={styles.resourceMeta}><MapPin size={14} /> {resource.location ?? "Location not set"}<span aria-hidden="true">·</span><UsersRound size={14} /> Up to {resource.capacity}</small>
            <a className={styles.inlineAction} href={`/member/reservations?resource=${resource.id}`}><CalendarPlus size={15} /> Reserve this resource <ArrowRight size={14} /></a>
          </article>)}</div>}
      </section>}
      {user && reservations.length > 0 && <section className={styles.recentReservations} aria-labelledby="recent-reservations-title">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>KEEP YOUR PLANS CLOSE</span><h2 id="recent-reservations-title">Recent reservations</h2></div><a className={styles.inlineAction} href="/member/reservations">View all <ArrowRight size={14} /></a></div>
        <div className={styles.recentReservationList}>{reservations.slice(0, 3).map((reservation) => <a className={styles.recentReservation} href="/member/reservations" key={reservation.id}>
          <span className={styles.icon}><CalendarDays size={18} /></span><span className={styles.recentReservationText}><strong>{reservation.resourceName}</strong><small>{new Date(reservation.startTime).toLocaleString()} · {reservation.purpose}</small></span><span className={styles.tableBadge}>{reservation.status}</span>
        </a>)}</div>
      </section>}
    </main>
    </div>
    <SiteFooter />
  </div>;
}
