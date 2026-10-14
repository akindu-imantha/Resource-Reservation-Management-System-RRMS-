import { CalendarCheck2, Mail, MapPin } from "lucide-react";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.brandColumn}>
          <a className={styles.brand} href="/" aria-label="Roomly home">
            <span className={styles.brandMark}><CalendarCheck2 size={18} strokeWidth={2.2} /></span>
            <span>roomly</span>
          </a>
          <p>Make room for what matters. Find and reserve the spaces and tools your team needs.</p>
        </div>
        <div className={styles.footerLinks}>
          <strong>Explore</strong>
          <a href="/#resources">Resources</a>
          <a href="/#benefits">Why Roomly</a>
          <a href="/#how-it-works">How it works</a>
        </div>
        <div className={styles.footerLinks}>
          <strong>Account</strong>
          <a href="/admin/login">Admin login</a>
          <a href="/#resources">Find a resource</a>
        </div>
        <div className={styles.contact}>
          <strong>Here to help</strong>
          <span><Mail size={15} /> Contact your workspace administrator</span>
          <span><MapPin size={15} /> Your team, all in one place</span>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Roomly · Resource Reservation Management</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
