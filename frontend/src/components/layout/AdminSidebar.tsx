import Link from "next/link";
import { useRouter } from "next/router";
import { CalendarCheck2, CalendarClock, FolderTree, LayoutDashboard, Package, UsersRound } from "lucide-react";
import styles from "./WorkspaceSidebar.module.css";

const links = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/resources", label: "Resources", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/members", label: "Team members", icon: UsersRound },
];

export default function AdminSidebar() {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];

  return <aside className={styles.sidebar} aria-label="Administrator workspace">
    <Link className={styles.brand} href="/admin/dashboard"><span className={styles.brandMark}><CalendarCheck2 size={18} /></span><span>Admin workspace</span></Link>
    <span className={styles.caption}>MANAGE YOUR WORKSPACE</span>
    <nav className={styles.navigation} aria-label="Admin navigation">
      {links.map(({ href, label, icon: Icon }) => <Link className={styles.link} href={href} key={href} aria-current={currentPath === href ? "page" : undefined}>
        <Icon size={18} /><span>{label}</span>
      </Link>)}
    </nav>
    <p className={styles.sidebarNote}>Manage resources, reservations, teams, and member access from one place.</p>
  </aside>;
}
