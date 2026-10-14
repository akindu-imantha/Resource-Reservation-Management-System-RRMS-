import Link from "next/link";
import { useRouter } from "next/router";
import { CalendarCheck2, CalendarClock, LayoutDashboard, Package, UserRound, UsersRound } from "lucide-react";
import styles from "./WorkspaceSidebar.module.css";

const links = [
  { href: "/member/dashboard", label: "My workspace", icon: LayoutDashboard },
  { href: "/member/resources", label: "Browse resources", icon: Package },
  { href: "/member/reservations", label: "My reservations", icon: CalendarClock },
  { href: "/member/teams", label: "Teams", icon: UsersRound },
  { href: "/member/profile", label: "My profile", icon: UserRound },
];

export default function MemberSidebar() {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];

  return <aside className={styles.sidebar} aria-label="Team member workspace">
    <Link className={styles.brand} href="/member/dashboard"><span className={styles.brandMark}><CalendarCheck2 size={18} /></span><span>My workspace</span></Link>
    <span className={styles.caption}>YOUR TEAM SPACE</span>
    <nav className={styles.navigation} aria-label="Team member navigation">
      {links.map(({ href, label, icon: Icon }) => <Link className={styles.link} href={href} key={href} aria-current={currentPath === href ? "page" : undefined}>
        <Icon size={18} /><span>{label}</span>
      </Link>)}
    </nav>
    <p className={styles.sidebarNote}>Find a space, make a reservation, and keep your team plans together.</p>
  </aside>;
}
