import fs from "node:fs";
// Offline: window calibration for the 17:15Z read, and the post/comment enumeration for the
// "skipped tick" reading and the "nothing posted on another post" negative.
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const rows = [...(p1.comments || []), ...(p2.comments || [])]
  .filter(c => JSON.stringify(c.author || "").includes("erpin"))
  .sort((a, b) => a.id - b.id);
const times = rows.map(c => Number(c.created_at));
const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
const norm = gaps.filter(g => g < 10000000);
const mean = norm.reduce((s, g) => s + g, 0) / norm.length;
const ten = norm.slice(-10);
const m10 = ten.reduce((s, g) => s + g, 0) / ten.length;
console.log("stream mean", (mean / 1000).toFixed(3), "s; last-10 mean", (m10 / 1000).toFixed(3), "s; difference", ((mean - m10) / 1000).toFixed(3), "s");
for (const [name, ctr] of [["stream-mean scale", mean], ["last-10-mean scale", m10]]) {
  const d = norm.map(g => g - ctr);
  console.log(name, "n=" + norm.length, [30, 40, 45, 60].map(t => t + "s:" + d.filter(x => Math.abs(x) > t * 1000).length).join(" "), "| range", (Math.min(...d) / 1000).toFixed(3), "..", (Math.max(...d) / 1000).toFixed(3), "s");
}
const tail = norm.map(g => g - mean).filter(d => d > 30000).map(d => (d / 1000).toFixed(1));
console.log("stream-scale tail > 30 s:", tail.length, JSON.stringify(tail));
console.log("long-gap calibration against k x the stream mean (2 x = " + (2 * mean / 1000).toFixed(3) + " s, 3 x = " + (3 * mean / 1000).toFixed(3) + " s):");
for (const g of gaps.filter(g => g >= 10000000)) {
  const k = Math.round(g / mean);
  console.log("  gap", (g / 1000).toFixed(3), "s -> k=" + k + ", deviation " + ((g - k * mean) / 1000).toFixed(3), "s");
}
const last = times[times.length - 1];
console.log("centre = last + stream mean:", new Date(last + mean).toISOString(), "| last + last-10 mean:", new Date(last + m10).toISOString());
console.log("two-slot centre = last + 2 x stream mean:", new Date(last + 2 * mean).toISOString(), "| window", new Date(last + 2 * mean - 45000).toISOString(), "..", new Date(last + 2 * mean + 45000).toISOString());
console.log("tick due at the read:", new Date(last + mean).toISOString(), "| tree page 2 read 2026-10-12T17:16:09.334Z ->", ((Date.parse("2026-10-12T17:16:09.334Z") - (last + mean)) / 1000).toFixed(0), "s past due; largest normal deviation +39.495 s");
const ch = JSON.parse(fs.readFileSync("changes-p0.json", "utf8"));
const posts = ch.posts || [];
const ids = posts.map(p => p.id).sort((a, b) => a - b);
console.log("window posts:", posts.length, "ids", ids[0] + ".." + ids[ids.length - 1], "dense", ids.every((v, i) => v === ids[0] + i), "changes has_more", ch.has_more);
const erpinPosts = posts.filter(p => JSON.stringify(p.author || {}).includes("erpin"));
console.log("erpin posts in the window:", erpinPosts.length);
const comments = ch.comments || [];
console.log("window comments:", comments.length, "| erpin comments:", comments.filter(c => JSON.stringify(c.author || "").includes("erpin")).map(c => c.id).join(","));
const pulse = JSON.parse(fs.readFileSync("pulse.json", "utf8"));
console.log("pulse board.latest_post_id", pulse.board.latest_post_id, "| posts end", ids[ids.length - 1], "| agree", pulse.board.latest_post_id === ids[ids.length - 1]);
