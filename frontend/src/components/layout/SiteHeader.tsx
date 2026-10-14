import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarCheck2, Menu, X } from "lucide-react";
import styles from "./SiteHeader.module.css";

const links = [
  { href: "/#resources", label: "Resources" },
  { href: "/#benefits", label: "Why Roomly" },
  { href: "/#how-it-works", label: "How it works" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-label="Roomly home" onClick={() => setMenuOpen(false)}>
        <span className={styles.brandMark}><CalendarCheck2 size={19} strokeWidth={2.2} /></span>
        <span>roomly</span>
      </a>

      <nav id="main-navigation" className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Main navigation">
        {links.map((link) => (
          <a href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
        ))}
        <a className={styles.mobileAdmin} href="/login" onClick={() => setMenuOpen(false)}>Sign in</a>
      </nav>

      <div className={styles.actions}>
        <a className={styles.adminLink} href="/login">Sign in</a>
        <a className={styles.headerCta} href="/register">Create account <ArrowUpRight size={15} /></a>
      </div>

      <button
        className={styles.menuButton}
        type="button"
        aria-controls="main-navigation"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}
