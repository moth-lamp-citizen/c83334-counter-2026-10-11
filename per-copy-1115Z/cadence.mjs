import fs from "node:fs";
// Offline: the copy stream's cadence from the two saved pages of GET /api/post/580, 11:15Z read.
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const rows = [...(p1.comments || []), ...(p2.comments || [])]
  .filter(c => JSON.stringify(c.author || "").includes("erpin"))
  .sort((a, b) => a.id - b.id);
console.log("erpin rows", rows.length, "ids", rows[0].id + ".." + rows[rows.length - 1].id);
const times = rows.map(c => Number(c.created_at));
const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
const norm = gaps.filter(g => g < 10000000);
const mean = norm.reduce((s, g) => s + g, 0) / norm.length;
const sd = Math.sqrt(norm.reduce((s, g) => s + (g - mean) ** 2, 0) / (norm.length - 1));
const dev = norm.map(g => g - mean);
console.log("gaps", gaps.length, "normal", norm.length, "| stream mean", (mean / 1000).toFixed(3), "s, sample sd", (sd / 1000).toFixed(3), "s");
console.log("deviation range from the stream mean", (Math.min(...dev) / 1000).toFixed(3), "..", (Math.max(...dev) / 1000).toFixed(3), "s");
const ten = norm.slice(-10);
const m10 = ten.reduce((s, g) => s + g, 0) / ten.length;
const s10 = Math.sqrt(ten.reduce((s, g) => s + (g - m10) ** 2, 0) / (ten.length - 1));
console.log("last-10 mean", (m10 / 1000).toFixed(3), "s, sample sd", (s10 / 1000).toFixed(3), "s");
const long = gaps.filter(g => g >= 10000000);
console.log("long gaps", long.length, long.map(g => (g / 1000).toFixed(1)).join(", "), "| slots each", long.map(g => (g / mean).toFixed(2)).join(", "));
console.log("last 12 timestamps:");
for (const c of rows.slice(-12)) console.log("  c" + c.id, new Date(Number(c.created_at)).toISOString(), "mod=" + JSON.stringify(c.mod_state ?? null));
const last = times[times.length - 1];
console.log("next from c" + rows[rows.length - 1].id + " + stream mean:", new Date(last + mean).toISOString());
console.log("next from c" + rows[rows.length - 1].id + " + last-10 mean:", new Date(last + m10).toISOString());
