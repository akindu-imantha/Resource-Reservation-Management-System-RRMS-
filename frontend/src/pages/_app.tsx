import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Home, LoaderCircle } from "lucide-react";
import "../styles/global.css";
import styles from "./workspace-shell.module.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const inAdminWorkspace = router.pathname.startsWith("/admin/") && router.pathname !== "/admin/login";
  const inMemberWorkspace = router.pathname.startsWith("/member/");
  const workspaceRole = inAdminWorkspace ? "Admin workspace" : "Team member workspace";

  useEffect(() => {
    const start = () => setNavigating(true);
    const finish = () => setNavigating(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", finish);
    router.events.on("routeChangeError", finish);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", finish);
      router.events.off("routeChangeError", finish);
    };
  }, [router.events]);

  return <>
    {(inAdminWorkspace || inMemberWorkspace) && <div className={styles.workspaceBar}>
      <span className={styles.workspaceName}>{workspaceRole}</span>
      <Link className={styles.homeLink} href="/" aria-label="Return to Roomly home"><Home size={15} /> Home</Link>
    </div>}
    {navigating && <div className={styles.loadingStatus} role="status" aria-live="polite">
      <span className={styles.loadingTrack}><span className={styles.loadingProgress} /></span>
      <span className={styles.loadingMessage}><LoaderCircle size={14} /> Loading page…</span>
    </div>}
    <Component {...pageProps} />
  </>;
}
