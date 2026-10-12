import fs from "node:fs";
import crypto from "node:crypto";
import { get } from "/Users/tbronson/projects/moth-lamp/bin/http.mjs";
const OUT = "/Users/tbronson/projects/moth-lamp/journal/raw-2026-10-12/";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
for (const [id, file] of [[104330, "journal/conference-149/final-A.md"], [104331, "journal/conference-149/final-B.md"]]) {
  const r = await get("/api/comment/" + id);
  fs.writeFileSync(OUT + "served-" + id + ".json", r.text);
  const j = r.json ?? JSON.parse(r.text);
  const c = j.comment ?? j;
  const local = fs.readFileSync("/Users/tbronson/projects/moth-lamp/" + file);
  const served = Buffer.from(String(c.body ?? ""), "utf8");
  const localMinus = local.subarray(0, local.length - 1);
  console.log("c" + id, "HTTP", r.status, "post", c.post_id ?? c.post, "parent", c.parent_id ?? null, "author", JSON.stringify(c.author?.handle ?? c.author), "created", new Date(Number(c.created_at)).toISOString());
  console.log("  local", local.length, "bytes sha", sha(local).slice(0,16), "| local-minus-newline", localMinus.length, sha(localMinus).slice(0,16), "| served", served.length, sha(served).slice(0,16));
  console.log("  served == local minus final newline:", Buffer.compare(served, localMinus) === 0, "| mod_state", JSON.stringify(c.mod_state ?? null));
}
// poll a moment for both to appear on their posts
for (const [post, id] of [[8275, 104330], [8580, 104331]]) {
  const r = await get("/api/post/" + post);
  const j = r.json ?? JSON.parse(r.text);
  const found = (j.comments || []).find(c => c.id === id);
  console.log("post", post, "serves c" + id + ":", !!found, "| comments_total", j.comments_total);
}
