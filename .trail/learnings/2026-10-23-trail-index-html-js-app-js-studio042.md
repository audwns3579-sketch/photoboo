---
title: trail 코드 맵은 index.html 안의 JS를 못 읽는다 — app.js로 분리해야 잡힌다
author: Studio042
date: 2026-10-23
branch: main
cost: { minutes: 1, tokens: 3582 }
id: l-1bdb7e1f
scope: repo
status: active
---

## Decided
앱 로직 전체(1927줄)를 index.html의 단일 인라인 <script>에서 app.js로 그대로 떼어내고 `<script src="app.js"></script>`로 불러온다. sw.js의 SHELL에 "./app.js"를 넣고 CACHE를 booth-v12로 올렸다. 코드 맵 노드가 3개 → 117개(엣지 390)로 늘었다.

## Tried and ruled out
`trail build -e .html` — .html 파서가 없다. 지원 확장자 목록에 html이 아예 없어서 옵션으로는 해결 불가.

## Watch out
app.js는 원래 IIFE `(function(){...})()` 그대로라 전역 오염이 없고 인라인 onclick 핸들러도 0개다. 하지만 classic script로 유지해야 한다 — type="module"로 바꾸면 실행 시점과 스코프가 달라진다.
index.html을 고칠 때 app.js도 같이 고쳤다면 sw.js의 CACHE 번호를 반드시 올려야 아이패드에 반영된다.
