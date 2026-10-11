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

// post-collapse: the same objects six hours later (c102393, /post/8275)
const pc = (n) => JSON.parse(readFileSync("post-collapse/" + n, "utf8"));
const H = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const PLACE = "188d54cc5eb94cfc8f0d4b38bc7b517012503789a834561654969756bd722b76";
const g83334 = pc("comment-83334.json").comment;
const g66411 = pc("comment-66411.json").comment;
ok("post-collapse: c83334 collapsed, 122-char placeholder", g83334.mod_state === "collapsed" && g83334.body.length === 122 && H(g83334.body) === PLACE);
ok("post-collapse: c66411 standing, 511-char body 5dff7427...", g66411.mod_state === null && g66411.body.length === 511 && H(g66411.body) === WANT);
for (const id of [102154, 102336]) {
  const cc = pc("comment-" + id + ".json").comment;
  ok("post-collapse: c" + id + " collapsed placeholder", cc.mod_state === "collapsed" && cc.body.length === 122 && H(cc.body) === PLACE);
}
const w1 = pc("mod-events-1115Z.json").events;
const w2 = pc("mod-events-1115Z-gap.json").events;
ok("post-collapse: both windows 252 rows, e25447..e25752", w1.length === 252 && w2.length === 252 && w1[0].id === 25447 && w1[251].id === 25752);
ok("post-collapse: no 'copies now' row in either window", !w1.some(e => /copies now/.test(e.detail || "")) && !w2.some(e => /copies now/.test(e.detail || "")));
const g87 = w1.filter(e => /one of 87 such copies/.test(e.detail || ""));
const ids87 = g87.map(e => Number(/collapsed comment (\d+)/.exec(e.detail)[1])).sort((a, b) => a - b);
ok("post-collapse: 87-row c66411 group, ids 66550..83334", g87.length === 87 && ids87[0] === 66550 && ids87[86] === 83334);
const e25636 = w1.find(e => e.id === 25636);
ok("post-collapse: e25636 collapses c83334 under the c66411 reason", !!e25636 && /collapsed comment 83334/.test(e25636.detail) && /earlier comment c66411/.test(e25636.detail));
const anchors = new Set(w1.map(e => (/earlier comment c(\d+) on this post; one of/.exec(e.detail || "") || [])[1]).filter(Boolean));
ok("post-collapse: 18 anchors in the scan", anchors.size === 18, "got " + anchors.size);
const ids21 = events.filter(e => /copies now/.test(e.detail || "")).map(e => Number(/collapsed comment (\d+)/.exec(e.detail)[1]));
ok("post-collapse: scan ids and batch ids disjoint", ids87.every(x => !ids21.includes(x)), ids87.length + " vs " + ids21.length);
console.log(fails ? fails + " check(s) failed" : "all checks passed");
process.exit(fails ? 1 : 0);
