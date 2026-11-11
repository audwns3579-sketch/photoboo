---
title: Test the booth in the browser pane with a background server and a fake camera
author: Studio042
date: 2026-11-11
branch: main
cost: { minutes: 1, tokens: 34909 }
id: l-f66b3df6
scope: repo
status: active
src: agent
touches:
  - app.js
---

## Decided
- To run the booth in the built-in browser, start a local server in the background with Bash (`python3 -m http.server 8000` inside booth/) and navigate the pane to http://localhost:8000. Test by clicking buttons, because app.js is wrapped in an IIFE and its functions cannot be called from outside.
- The browser pane blocks the camera. Swap in a fake camera by injecting a <script> element into the page that replaces navigator.mediaDevices.getUserMedia with a canvas.captureStream(). Code run directly from javascript_tool lives in a separate world, so the override would not take effect there.
- To check printing without spending film, inject a script that replaces window.fetch, capture the request, and answer {ok:true}. Run the Mac print server with `--dry-run`.

## Tried and ruled out
- The preview_start launcher (.claude/launch.json): it cannot read the Desktop folder (getcwd Operation not permitted), so the server dies on startup.

## Watch out
- The user saves film, so never send a real print during testing.
