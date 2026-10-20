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

// Lets Claude add items from your own browser without ever seeing your password.
// First call asks YOU for the game password once and keeps it in this browser only (localStorage).
// Usage (from the page console or Claude): await window.sendToIsland({ "doc-id": { type:"quest", ... } })
window.sendToIsland = async (items) => {
  const KEY = "lifeisland.inboxKey";
  let k = null;
  try { k = localStorage.getItem(KEY); } catch (e) {}
  if (!k) {
    k = window.prompt("Life Island password (saved only in this browser, one time):");
    if (!k) return "cancelled: no password entered";
    try { localStorage.setItem(KEY, k); } catch (e) {}
  }
  const r = await fetch("/api/inbox", {
    method: "POST",
    headers: { Authorization: "Bearer " + k, "Content-Type": "application/json" },
    body: JSON.stringify(items || {}),
  });
  if (r.status === 401) { try { localStorage.removeItem(KEY); } catch (e) {} return "401: wrong password, run again to re-enter it"; }
  return r.status + " " + r.statusText;
};
