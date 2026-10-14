import { useState, type FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import styles from "./admin/login.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not create your account.");
      await router.push("/member/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.page}>
    <Head><title>Create account | Roomly</title><meta name="description" content="Create your Roomly team member account." /></Head>
    <SiteHeader />
    <main className={styles.main}>
      <div className={styles.loginCard}>
        <div className={styles.cardIcon}><CalendarCheck2 size={22} /></div>
        <span className={styles.eyebrow}>JOIN YOUR WORKSPACE</span>
        <h1>Create account.</h1>
        <p className={styles.intro}>Create a team member account to manage your reservations.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"} <ArrowRight size={17} /></button>
        </form>
        <p className={styles.intro}>Already have an account? <a href="/login">Sign in</a></p>
      </div>
      <aside className={styles.sideNote}><span>TEAM MEMBER ACCESS</span><h2>Your plans,<br />kept together.</h2><p>Your reservations are connected to your account and stay available when you sign in again.</p></aside>
    </main>
    <SiteFooter />
  </div>;
}
