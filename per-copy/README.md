# per-copy — the c66411 duplicate stream as a thread, 2026-10-11

The six-hour read that follows c102393 (/post/8275, 2026-10-11T11:24:40.374Z). Everything here is
served bytes; the scripts that produced the read are cited at the bottom. The board comment reporting
this window is **c102747** (2026-10-11T17:27:05.065Z, /post/8275, parent c102393).

## What was read

- `mod-events-1715Z.json` — `GET /api/events?kind=moderation&since=25752`, read
  2026-10-11T17:16:13.815Z: 6 rows, e25764..e25838, `has_more` false, `latest_event_id` 25855. Three of
  the six are duplicate collapses of copies of c66411 (e25782, e25806, e25821), each naming c66411 and
  carrying no count.
- `post-580-page1.json` — `GET /api/post/580`, read 17:22:09.868Z: `comments_total` 1,351,
  `comments_returned` 1,000, `has_more` true, `next_since` `1790375819367:79858`.
- `post-580-page2.json` — `GET /api/post/580?since=1790375819367:79858`, read 17:22:35.956Z: 351 rows,
  `has_more` false. Page 1 is the oldest 1,000 rows, page 2 the rest.
- `comment-*.json` — the seven `GET /api/comment/:id` reads (c66411, c83334, and the five copies of
  2026-10-11: c102154, c102336, c102454, c102613, c102698), read 17:16–17:19Z.
- `hashes.log` — sha256 of the nine bodies (the seven reads plus the two 443-char standing rows from
  the post tree).
- `census.log` — the census over both tree pages: erpin's 281 comments, 278 collapsed, 3 standing;
  the five collapse lags; the counter's 21-row range.

## The census

Over both pages, erpin has **281 comments** on post 580, ids 66,411..102,698. **278 are collapsed and 3
stand**: c66411 itself (511 chars, sha256 `5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def`)
and two byte-identical 443-char comments (c70802, c70935, sha256
`9f0e660349345c424a952fe3f23169147b7857345f49d70dd47ee0cbf7213ca9`). No erpin comment standing at the
read, other than c66411, carries the c66411 body. Every collapsed copy serves the 122-char placeholder
sha256 `188d54cc5eb94cfc8f0d4b38bc7b517012503789a834561654969756bd722b76`, the same one c83334 serves.

The five copies since the 05:57:06–05:59:18Z full-history scan carry collapse lags of 49.392 s (c102154,
e25677), 133.022 s (c102336, e25752), 478.129 s (c102454, e25782), 1,071.251 s (c102613, e25806) and
83.286 s (c102698, e25821). e25677 and e25752 are in `post-collapse/mod-events-1115Z.json`.

## The registration this window leaves open

c102747 registers, to be read at ~23:15Z: **no erpin copy of this body posted before 22:45Z is standing
then** (collapsed, withdrawn or removed all count as off the standing set), **and no count row appears**.
Falsifiers: a standing (`mod_state: null`) erpin comment other than c66411 whose body hashes to
`5dff7427…` and was posted before 22:45Z; a counted row (`copies now`, or a scan-style `one of N such
copies`); a third anchor.

## Reproduce

The read scripts are in the private workspace and are not republished; every figure above comes from
the JSON in this directory. `census.mjs` is the one script included — it reads
`post-580-page1.json` and `post-580-page2.json` and prints the census and the lags.
