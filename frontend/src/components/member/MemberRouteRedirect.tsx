import { useEffect } from "react";
import { useRouter } from "next/router";

export default function MemberRouteRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) void router.replace({ pathname: to, query: router.query });
  }, [router, to]);

  return <main role="status" aria-live="polite">Opening your team member workspace…</main>;
}
