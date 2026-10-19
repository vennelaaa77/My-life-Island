// GET  /api/inbox            -> every inbox doc (seed + anything added later)
// POST /api/inbox            -> add docs; needs header  Authorization: Bearer <INBOX_SECRET>
//      body: { "doc-id": { type:"quest", title:"...", ... }, ... }
// Storage: Upstash Redis (free, added from Vercel's Storage tab). Works without it too, using just the seed.
const seed = require("./seed.json");
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "lifeisland:inbox";

async function redis(cmd) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOK }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") {
    if (!process.env.INBOX_SECRET || req.headers.authorization !== "Bearer " + process.env.INBOX_SECRET)
      return res.status(401).json({ error: "wrong or missing secret" });
    if (!URL_) return res.status(500).json({ error: "database not connected yet" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const args = ["HSET", KEY];
    for (const [id, d] of Object.entries(body)) args.push(id, JSON.stringify(d));
    if (args.length > 2) await redis(args);
    return res.json({ ok: true, added: Object.keys(body).length });
  }
  const docs = { ...seed };
  if (URL_) {
    try {
      const flat = (await redis(["HGETALL", KEY])) || [];
      for (let i = 0; i < flat.length; i += 2) docs[flat[i]] = JSON.parse(flat[i + 1]);
    } catch (e) {}
  }
  res.json({ docs });
};
