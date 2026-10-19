// Stands in for the Claude artifact "db" so the game's inbox works on Vercel.
// Polls /api/inbox and hands the docs to the game the same way the artifact did.
window.claude = { use: async (name) => name !== "db" ? null : ({
  collection: () => ({
    onSnapshot(ok, fail) {
      const pull = async () => {
        try {
          const r = await fetch("/api/inbox", { cache: "no-store" });
          const j = await r.json();
          ok({ docs: Object.entries(j.docs || {}).map(([id, d]) => ({ id, data: () => d })) });
        } catch (e) { fail && fail(e); }
      };
      pull(); setInterval(pull, 30000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(); });
      return () => {};
    }
  })
}) };
