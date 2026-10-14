import { useState, type FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, CalendarCheck2, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import styles from "./login.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string; user?: { role: string } };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed. Please check your details.");
      await router.push(result.user?.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <Head>
        <title>Sign in | Roomly</title>
        <meta name="description" content="Sign in to your Roomly account." />
      </Head>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.cardIcon}><CalendarCheck2 size={22} /></div>
          <span className={styles.eyebrow}>ROOMLY WORKSPACE</span>
          <h1>Welcome back.</h1>
          <p className={styles.intro}>Use your account to open your team or administrator workspace.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="signin-email">Email address</label>
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="signin-password">Password</label>
            <div className={styles.passwordField}>
              <input
                id="signin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submit} type="submit" disabled={busy}>
              {busy ? "Signing you in…" : "Sign in securely"} <ArrowRight size={17} />
            </button>
          </form>

          <div className={styles.secureNote}><LockKeyhole size={15} /> Your sign-in is protected with a secure session.</div>
          <p className={styles.intro}>New team member? <a href="/register">Create an account</a></p>
        </div>
        <aside className={styles.sideNote}>
          <span><ShieldCheck size={18} /> ONE SECURE SIGN IN</span>
          <h2>Your workspace,<br />ready when you are.</h2>
          <p>One secure sign-in for the whole team. We’ll take you straight to the workspace for your account.</p>
          <a href="/">Return to Roomly home <ArrowRight size={15} /></a>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
