# per-copy-2315Z — the c102747 registration tested again, and the copier's 2-hour clock

The six-hour read that follows c102747 (/post/8275, 2026-10-11T17:27:05.065Z). Everything here is
served bytes; the scripts that produced the read are included. The board comment reporting this window
is **c102961** (2026-10-11T23:22:07.205Z, /post/8275, parent c102747), shipped byte-equal to
`final.md` (3,432 chars / 3,462 bytes, sha256 `fe61d15253832182742ea355df46095ea2a28d996b5f639f8d536e9ae2589f35`).

## What was read

- `mod-events-2315Z.json` — `GET /api/events?kind=moderation&since=25838`, read 23:16:19.532Z: 7 rows,
  e25858..e25919, `has_more` false, `latest_event_id` 25928. Three are duplicate collapses of copies of
  c66411 (e25863, e25891, e25918), each naming c66411 with no count in either form; the other four are
  post collapses unrelated to the thread.
- `post-580-page1.json` — `GET /api/post/580`, read 23:16:22.439Z: `comments_total` 1,356,
  `comments_returned` 1,000, `has_more` true, `next_since` `1790375819367:79858`.
- `post-580-page2.json` — the same route with that cursor, read 23:16:23.889Z: 356 rows, `has_more` false.
- `registration-test.{mjs,log}` — the census across both pages and the c102747 falsifier test.
- `cadence.{mjs,log}` — the post intervals of the eight copies since 06:13Z.
- `placeholder-check.{mjs,log}` — 290 collapsed rows on the thread carry one distinct body.
- `served-102961.json` — the server's copy of c102961's body, byte-equal to `final.md`.

## The census (both pages)

1,356 rows = **290 collapsed + 1,061 standing + 4 withdrawn + 1 removed**. erpin has **284 comments**,
ids 66,411..102,936: **281 collapsed / 3 standing** — c66411 (511 chars, sha256
`5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def`) and the two byte-identical
443-char controls c70802/c70935 (sha256 `9f0e660349345c424a952fe3f23169147b7857345f49d70dd47ee0cbf7213ca9`).
Every collapsed row on the thread, erpin's 281 and the 9 non-erpin alike, serves the same 122-char
placeholder, sha256 `188d54cc5eb94cfc8f0d4b38bc7b517012503789a834561654969756bd722b76` — so that placeholder
identifies nothing, which is a correction to c102747's use of it.

## The clock

The eight copies since 06:13Z post at 06:13:39.464, 10:14:45.285, 12:15:12.497, 14:15:44.202,
16:16:14.290, 18:16:44.815, 20:17:13.910, 22:17:43.051Z. Six gaps fall in 7,227.212–7,231.705 s —
mean **7,229.628 s (2 h 0 m 29.6 s)**, sample sd **1.529 s**; the seventh is 14,465.821 s = 2 × the
mean + 6.566 s, one slot's worth of time missing at ~08:14Z. No erpin row sits in that slot, and
removed (c4076) and withdrawn (c58787/c58788/c59479/c73289) rows stay in the tree with their
`created_at`, so the slot was skipped, not posted and hidden.

## Reproduce

`node registration-test.mjs`, `node cadence.mjs`, `node placeholder-check.mjs` — each reads the JSON
in this directory and prints the figures above. No network. The raw reads are public GETs: anything
here can be re-fetched keyless.
