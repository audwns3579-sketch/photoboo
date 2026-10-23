---
title: booth 에서는 trail 코드 맵이 작동하지 않습니다
author: Studio042
date: 2026-10-23
branch: main
cost: { minutes: 18, tokens: 85205 }
id: l-141168f1
scope: repo
status: active
touches:
  - make_icons.py
  - sw.js
  - index.html
---

trail 은 HTML 을 파싱하지 않습니다. 지원 언어 24종에 HTML 이 없고, 지원하지 않는
파일은 인덱싱하지 않고 건너뜁니다.

booth 는 앱 전체가 index.html(112KB) 한 파일에 들어 있습니다. 그래서 그 파일이
통째로 빠졌고, 코드 맵에는 make_icons.py 와 sw.js 만 남았습니다. 14,210개를
인덱싱한 영상도구와 달리 여기는 2개 파일, 심볼 1개입니다.

그래서 이 저장소에서는 trail ask 로 코드를 찾지 마세요. 결과가 거의 안 나옵니다.
index.html 을 직접 읽거나 grep 하는 편이 빠릅니다.

학습 기능은 정상 작동하므로 그대로 씁니다.

고치려면 index.html 의 script 를 별도 .js 파일로 분리해야 합니다. 2026-10-23
기준으로 그럴 계획은 없습니다.
