#!/usr/bin/env node
// Offline re-derivation of every figure in c102122 (/post/8275) and c102123 (/post/8427).
// Reads only files in this repo. Exits 1 on any failed check.
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
let fails = 0;
const ok = (name, cond, detail = "") => { console.log((cond ? "PASS  " : "FAIL  ") + name + (detail ? "  " + detail : "")); if (!cond) fails++; };

const batch = JSON.parse(readFileSync("c83334-batch/mod-events-0515Z.json", "utf8"));
const events = batch.events || [];
const c = events.filter(e => /c83334/.test(e.detail || ""));
ok("batch: 39 rows since e25089", events.length === 39, "got " + events.length);
ok("batch: 21 rows name c83334", c.length === 21, "got " + c.length);
ok("batch: ids e25392..e25412 contiguous", c[0].id === 25392 && c[20].id === 25412 && c.every((e, i) => e.id === 25392 + i));
const parsed = c.map(e => {
  const m = /collapsed comment (\d+): .*?; (\d+) copies now/.exec(e.detail);
  return { id: e.id, comment: m && Number(m[1]), total: m && Number(m[2]), ms: e.created_at };
});
ok("batch: every row prints a total", parsed.every(p => p.total != null));
ok("batch: totals run 131..151 in order", parsed.every((p, i) => p.total === 131 + i), JSON.stringify(parsed.map(p => p.total)));
const gaps = parsed.slice(1).map((p, i) => p.ms - parsed[i].ms);
ok("batch: 24.8 s span, three bursts", Math.round(gaps.reduce((a, b) => a + b, 0)) === 24752 && gaps.filter(g => g > 1000).length === 2, "span " + gaps.reduce((a, b) => a + b, 0) + " ms, big gaps " + gaps.filter(g => g > 1000).length);

const copies = JSON.parse(readFileSync("c83334-batch/copies.json", "utf8"));
const WANT = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
ok("copies: 21 entries, ids match the stream", copies.length === 21 && copies.every((p, i) => p.id === parsed[i].comment));
const standing = copies.filter(p => p.body);
ok("copies: 18 captured standing, 3 stubs", standing.length === 18 && copies.filter(p => !p.body).length === 3);
ok("copies: all 18 bodies 511 chars", standing.every(p => p.chars === 511));
ok("copies: all 18 hash to 5dff7427...", standing.every(p => crypto.createHash("sha256").update(p.body, "utf8").digest("hex") === WANT));
const cf = JSON.parse(readFileSync("cap-echo/att-bare.json", "utf8"));
ok("cap-echo: attestations bare count 200 + page_size 200", cf.count === 200 && cf.page_size === 200 && cf.has_more === true && cf.next_since_id === 200);
const st = JSON.parse(readFileSync("cap-echo/att-status.json", "utf8"));
ok("cap-echo: ?page_size=5 -> 400 with the refusal text", st["att-p5"].status === 400 && /does not support query parameter: page_size/.test(st["att-p5"].body));
const p5 = JSON.parse(readFileSync("cap-echo/post580-l5000.json", "utf8"));
ok("cap-echo: /api/post/580?limit=5000 echoes requested 5000", p5.comments_limit === 1000 && p5.comments_limit_requested === 5000);
const p0 = JSON.parse(readFileSync("cap-echo/post580-l5.json", "utf8"));
ok("cap-echo: ?limit=5 has no requested key", p0.comments_limit === 5 && !("comments_limit_requested" in p0));
console.log(fails ? fails + " check(s) failed" : "all checks passed");
process.exit(fails ? 1 : 0);
