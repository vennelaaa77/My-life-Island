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
    k = await new Promise((resolve) => {
      const box = document.createElement("div");
      box.style.cssText = "position:fixed;left:50%;top:20px;transform:translateX(-50%);z-index:99999;background:#fff;color:#222;padding:14px 16px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.35);font:14px system-ui;display:flex;gap:8px;align-items:center";
      box.innerHTML = '<span>Life Island password (saved only in this browser, one time):</span><input type="password" style="padding:6px;border:1px solid #bbb;border-radius:6px"><button style="padding:6px 12px;border:0;border-radius:6px;background:#2b7;color:#fff;cursor:pointer">Save</button>';
      const inp = box.querySelector("input"), btn = box.querySelector("button");
      const done = (v) => { box.remove(); resolve(v); };
      btn.onclick = () => done(inp.value);
      inp.onkeydown = (e) => { if (e.key === "Enter") done(inp.value); };
      document.body.appendChild(box); inp.focus();
    });
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
