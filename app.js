(function(){
"use strict";

/* ══════════════════════════════════════════
   설정 — 모든 인화 디자인이 여기 한 덩어리에 들어 있고,
   관리자 화면에서 고친 내용이 그대로 이 구조로 저장됩니다.
   ══════════════════════════════════════════ */
function defaultConfig(){
  return {
    version: 8,
    brand: "STUDIO 042",
    timer: 3,
    filter: "bright",
    cameraId: null,
    filters: defaultFilters(),
    backgrounds: [],     // 배경 목록 {id,name,h,v}
    bgId: null,          // 지금 고른 배경 (모든 인화 방식이 함께 씁니다)
    layouts: [
      {
        id: "strip4", name: "가로 4컷", enabled: true,
        canvas: { w:1800, h:1200 },
        frame: null,
        slots: [
          {x:75,  y:520, w:390, h:260, shot:0},
          {x:495, y:520, w:390, h:260, shot:1},
          {x:915, y:520, w:390, h:260, shot:2},
          {x:1335,y:520, w:390, h:260, shot:3}
        ],
        texts: [
          {content:"{brand}", x:900, y:400, size:76, font:"display", align:"center", color:"#111111"},
          {content:"{date}",  x:900, y:452, size:24, font:"body",    align:"center", color:"#9A9A9A"},
          {content:"SELF PHOTO BOOTH", x:900, y:845, size:22, font:"body", align:"center", color:"#BBBBBB"}
        ],
        cut: { on:false, x:900, color:"#D8D0CA" }
      },
      {
        id: "twin4", name: "세로 4컷", enabled: true,
        canvas: { w:1200, h:1800 },
        frame: null,
        slots: [
          {x:170, y:80,   w:260, h:390, shot:0},
          {x:170, y:485,  w:260, h:390, shot:1},
          {x:170, y:890,  w:260, h:390, shot:2},
          {x:170, y:1295, w:260, h:390, shot:3},
          {x:770, y:80,   w:260, h:390, shot:0},
          {x:770, y:485,  w:260, h:390, shot:1},
          {x:770, y:890,  w:260, h:390, shot:2},
          {x:770, y:1295, w:260, h:390, shot:3}
        ],
        texts: [
          {content:"{brand}", x:300, y:1715, size:36, font:"display", align:"center", color:"#111111"},
          {content:"{date}",  x:300, y:1758, size:19, font:"body",    align:"center", color:"#9A9A9A"},
          {content:"{brand}", x:900, y:1715, size:36, font:"display", align:"center", color:"#111111"},
          {content:"{date}",  x:900, y:1758, size:19, font:"body",    align:"center", color:"#9A9A9A"}
        ],
        cut: { on:true, x:600, color:"#D8D0CA" }
      },
      /* 폴라로이드 — photoshop/polaroid-4x6.jsx 와 같은 자리를 씁니다.
         여백 90, 사진 1020 × 1275 (4:5), 아래 띠 435, 글자 색 #740A1B. */
      {
        id: "polaroid", name: "폴라로이드", enabled: true,
        canvas: { w:1200, h:1800 },
        frame: null,
        slots: [
          {x:90, y:90, w:1020, h:1275, shot:0}
        ],
        texts: [
          {content:"{brand}", x:600, y:1600, size:60, font:"display", align:"center", color:"#740A1B"},
          {content:"{date}",  x:600, y:1650, size:20, font:"body",    align:"center", color:"#9A9A9A"}
        ],
        cut: { on:false, x:600, color:"#D8D0CA" }
      }
    ]
  };
}

/* 보정 한 가지는 숫자 묶음입니다. 같은 숫자로 미리보기(CSS)와
   인화(캔버스)를 똑같이 그리기 때문에 화면에 보이는 게 그대로 나옵니다.
   smooth = 피부 보정, tint = 색감 덧씌우기, fade = 먹색 띄우기 */
function newFilter(over){
  var f = {
    id:"F"+Date.now(), name:"새 보정", enabled:true,
    brightness:100, contrast:100, saturate:100, sepia:0, hue:0,
    smooth:0, detail:70, fade:0, vignette:0,
    tint:{ color:"#FFB07A", mode:"soft-light", amount:0 }
  };
  for (var k in (over||{})) f[k]=over[k];
  return f;
}
function defaultFilters(){
  return [
    newFilter({id:"none",   name:"원본"}),
    newFilter({id:"bright", name:"화사하게", brightness:105, contrast:101, saturate:108, smooth:55, detail:72}),
    newFilter({id:"soft",   name:"뽀샤시",   brightness:108, contrast:97,  saturate:104, smooth:85, detail:58, fade:14,
                            tint:{color:"#FFD9C2", mode:"soft-light", amount:18}}),
    newFilter({id:"mono",   name:"흑백",     saturate:0, contrast:110, smooth:48, detail:74}),
    newFilter({id:"film",   name:"필름",     brightness:102, contrast:105, saturate:92, sepia:20,
                            smooth:40, detail:76, fade:16, vignette:22,
                            tint:{color:"#FF9E5E", mode:"soft-light", amount:22}}),
    newFilter({id:"cool",   name:"쿨톤",     brightness:103, contrast:102, saturate:96, smooth:58, detail:70,
                            tint:{color:"#8FB8E8", mode:"soft-light", amount:24}})
  ];
}
var BLEND_MODES = [
  {v:"soft-light", n:"은은하게"},
  {v:"overlay",    n:"또렷하게"},
  {v:"multiply",   n:"곱하기"},
  {v:"screen",     n:"밝히기"},
  {v:"color",      n:"색만 입히기"},
  {v:"hard-light", n:"세게"}
];
var TIMERS = [3,5,10];

/* 예전에 저장해둔 설정을 새 기본값에 맞춰 올려줍니다.
   손대지 않은 기본 레이아웃만 바꾸고, 직접 편집했거나 이미지를 올린 것은 그대로 둡니다. */
function migrate(cfg){
  if (!cfg || cfg.version >= 8) return cfg;

  // 예전 보정은 이름만 있었습니다. 같은 이름의 새 보정으로 바꿔 끼웁니다.
  if (!Array.isArray(cfg.filters) || !cfg.filters.length){
    cfg.filters = defaultFilters();
    var map = { none:"none", bright:"bright", mono:"mono", film:"film" };
    cfg.filter = map[cfg.filter] || "bright";
  }

  if (cfg.version < 4) cfg.layouts.forEach(function(l){
    // 잠깐 한 줄로 나갔던 세로 4컷을 두 줄로 되돌립니다.
    var oneColumn = l.id === "twin4" && l.slots.length === 4 && !l.bg && !l.frame &&
      l.slots.every(function(s){ return s.w === 260 && s.h === 390 && s.x === 470; });
    if (!oneColumn) return;
    var fresh = defaultConfig().layouts.filter(function(d){ return d.id === "twin4"; })[0];
    l.slots = fresh.slots;
    l.texts = fresh.texts;
    l.cut   = fresh.cut;
  });
  // 예전 보정에는 디테일 문턱이 없었습니다. 기본값을 채워 넣습니다.
  (cfg.filters||[]).forEach(function(f){ if (f.detail===undefined) f.detail = 70; });
  // 레이아웃마다 따로 올리던 배경을 공용 목록으로 옮깁니다
  if (!Array.isArray(cfg.backgrounds)) cfg.backgrounds = [];
  cfg.layouts.forEach(function(l, i){
    delete l.bgId;
    if (!l.bg) return;
    var landscape = l.canvas.w > l.canvas.h;
    var e = { id:"B"+Date.now()+i, name: l.name + " 배경", h:null, v:null };
    e[landscape ? "h" : "v"] = l.bg;
    cfg.backgrounds.push(e);
    if (!cfg.bgId) cfg.bgId = e.id;
    delete l.bg;
  });
  if (cfg.bgId === undefined) cfg.bgId = null;
  // 폴라로이드를 나중에 넣었습니다. 예전 설정에는 없으니 뒤에 붙여줍니다.
  var hasPolaroid = cfg.layouts.filter(function(l){ return l.id === "polaroid"; }).length > 0;
  if (!hasPolaroid){
    cfg.layouts.push(defaultConfig().layouts.filter(function(d){ return d.id === "polaroid"; })[0]);
  }
  cfg.version = 8;
  return cfg;
}

var CFG = defaultConfig();
var cur = 0;            // 손님이 고른 레이아웃 index
var admIdx = 0;         // 관리자가 편집 중인 레이아웃 index
var selSlot = -1, selText = -1;

var S = { shots:[], cancelled:false, blob:null, stream:null, facing:"user", wakeLock:null };

var $ = function(id){ return document.getElementById(id); };
var setupEl=$("setup"), shootEl=$("shoot"), resultEl=$("result"), adminEl=$("admin");

/* ── 저장소 (IndexedDB: 설정 + 이미지) ── */
function idb(){
  return new Promise(function(res,rej){
    var r = indexedDB.open("booth", 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore("kv"); };
    r.onsuccess = function(){ res(r.result); };
    r.onerror  = function(){ rej(r.error); };
  });
}
function kv(mode, fn){
  return idb().then(function(db){
    return new Promise(function(res,rej){
      var store = db.transaction("kv", mode).objectStore("kv");
      var req = fn(store);
      req.onsuccess = function(){ res(req.result); };
      req.onerror  = function(){ rej(req.error); };
    });
  });
}
var kvGet = function(k){ return kv("readonly",  function(s){ return s.get(k); }); };
var kvSet = function(k,v){ return kv("readwrite", function(s){ return s.put(v,k); }); };
var kvDel = function(k){ return kv("readwrite", function(s){ return s.delete(k); }); };

function saveConfig(){ return kvSet("config", JSON.parse(JSON.stringify(CFG))).catch(function(){}); }

/* 이미지 캐시: key -> {blob, url, img} */
var imgCache = {};
function putImage(blob){
  var key = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
  return kvSet(key, blob).then(function(){ return key; });
}
function getImage(key){
  if (!key) return Promise.resolve(null);
  if (imgCache[key]) return Promise.resolve(imgCache[key]);
  return kvGet(key).then(function(blob){
    if (!blob) return null;
    return new Promise(function(res){
      var url = URL.createObjectURL(blob);
      var im = new Image();
      im.onload = function(){ imgCache[key] = {url:url, img:im}; res(imgCache[key]); };
      im.onerror = function(){ res(null); };
      im.src = url;
    });
  });
}

/* ── 알림 / 확인 ──────────────────────── */
var msgT;
function say(t, ms){
  var el=$("msg"); el.textContent=t; el.hidden=false;
  clearTimeout(msgT);
  if (ms!==0) msgT=setTimeout(function(){ el.hidden=true; }, ms||3400);
}
function hush(){ clearTimeout(msgT); $("msg").hidden=true; }

var confirmCb=null;
function ask(text, cb){ $("confirmText").textContent=text; confirmCb=cb; $("confirm").hidden=false; }
$("confirmNo").addEventListener("click", function(){ $("confirm").hidden=true; confirmCb=null; });
$("confirmYes").addEventListener("click", function(){
  $("confirm").hidden=true;
  var cb=confirmCb; confirmCb=null; if (cb) cb();
});

function show(el){ [setupEl,shootEl,resultEl,adminEl].forEach(function(s){ s.hidden = s!==el; }); }

function today(){
  var d=new Date(), p=function(n){ return String(n).padStart(2,"0"); };
  return d.getFullYear()+"."+p(d.getMonth()+1)+"."+p(d.getDate());
}
function enabledLayouts(){ return CFG.layouts.filter(function(l){ return l.enabled; }); }

/* ── 배경 목록 ─────────────────────────────
   배경 하나가 가로(h)·세로(v) 두 장을 갖습니다.
   인화 방식의 방향에 맞는 쪽을 골라 씁니다. */
function allBackgrounds(){
  if (!Array.isArray(CFG.backgrounds)) CFG.backgrounds = [];
  return CFG.backgrounds;
}
function bgById(id){
  var a = allBackgrounds();
  for (var i=0;i<a.length;i++) if (a[i].id===id) return a[i];
  return null;
}
/* 지금 고른 배경에서 이 인화 방식에 쓸 이미지 키를 찾습니다.
   방향에 맞는 게 없으면 있는 쪽을 씁니다. */
function bgKeyFor(L){
  if (!L || !CFG.bgId) return null;
  var e = bgById(CFG.bgId);
  if (!e) return null;
  return (L.canvas.w > L.canvas.h) ? (e.h || e.v) : (e.v || e.h);
}
function shotCount(L){
  var m=0; L.slots.forEach(function(s){ if (s.shot+1>m) m=s.shot+1; });
  return Math.max(1,m);
}
function fontOf(t){
  return (t.font==="display")
    ? t.size+"px Anton, sans-serif"
    : "500 "+t.size+"px 'IBM Plex Sans KR', sans-serif";
}
function resolveText(s){
  return String(s).replace(/\{brand\}/g, CFG.brand).replace(/\{date\}/g, today());
}

/* ══════════════════════════════════════════
   손님 화면
   ══════════════════════════════════════════ */
var MINI_LONG = 112;   // 미리보기 네모의 긴 쪽 길이(px)
function miniHtml(L, idx){
  var scale = MINI_LONG / Math.max(L.canvas.w, L.canvas.h);
  var w = Math.round(L.canvas.w*scale), h = Math.round(L.canvas.h*scale);
  var html = '<span class="mini" data-mini="'+idx+'" style="width:'+w+'px;height:'+h+'px">';
  L.slots.slice(0,16).forEach(function(s){
    html += '<i style="left:'+(s.x/L.canvas.w*100)+'%;top:'+(s.y/L.canvas.h*100)+'%;'+
            'width:'+(s.w/L.canvas.w*100)+'%;height:'+(s.h/L.canvas.h*100)+'%"></i>';
  });
  return html+'<b data-minifr="'+idx+'"></b></span>';
}
function buildModes(){
  var list = enabledLayouts();
  if (!list.length){ $("modes").innerHTML = '<p class="note">보이도록 켜둔 인화 방식이 없습니다. 관리자 화면에서 켜주세요.</p>'; return; }
  if (cur >= list.length) cur = 0;
  $("modes").innerHTML = list.map(function(L,i){
    return '<button class="mode" data-i="'+i+'" aria-pressed="'+(i===cur)+'">'+
      miniHtml(L, i)+
      '<span style="min-width:0"><span class="mode-name">'+L.name+'</span><br>'+
      '<span class="mode-sub">'+shotCount(L)+'컷 · '+L.canvas.w+'×'+L.canvas.h+'</span></span></button>';
  }).join("");
  paintMiniBackgrounds(list);
  updateShotNote();
}

/* 인화 방식 미리보기 네모에 고른 배경과 프레임을 깔아줍니다 */
function paintMiniBackgrounds(list){
  list.forEach(function(L, i){
    var el = document.querySelector('.mini[data-mini="'+i+'"]');
    if (!el) return;
    var key = bgKeyFor(L);
    if (!key){ el.style.backgroundImage = "none"; }
    else getImage(key).then(function(b){
      var e2 = document.querySelector('.mini[data-mini="'+i+'"]');
      if (e2) e2.style.backgroundImage = b ? 'url('+b.url+')' : "none";
    });
    getImage(L.frame).then(function(f){
      var e3 = document.querySelector('b[data-minifr="'+i+'"]');
      if (e3) e3.style.backgroundImage = f ? 'url('+f.url+')' : "none";
    });
  });
}

/* 시작 화면의 배경 고르기 줄 */
function buildBgPick(){
  var L = enabledLayouts()[cur];
  var host = $("bgPick");
  if (!L){ host.innerHTML = ""; return; }
  var list = allBackgrounds();
  // 섬네일을 인화지 비율에 맞춰 크게 보여줍니다
  var ar = L.canvas.w / L.canvas.h, SW_LONG = 118;
  var tw = (ar >= 1) ? SW_LONG : Math.round(SW_LONG*ar);
  var th = (ar >= 1) ? Math.round(SW_LONG/ar) : SW_LONG;
  var size = 'style="width:'+tw+'px;height:'+th+'px"';
  var html = '<button class="sw none" data-b="" '+size+' aria-pressed="'+(!CFG.bgId)+'">'+
             '<span class="nm">없음</span></button>';
  list.forEach(function(e){
    html += '<button class="sw" data-b="'+e.id+'" '+size+' aria-pressed="'+(CFG.bgId===e.id)+'">'+
            '<span class="nm">'+escapeHtml(e.name)+'</span></button>';
  });
  if (!list.length){
    html += '<p class="note" style="align-self:center">관리자 화면에서 배경을 올리면 여기에 나옵니다.</p>';
  }
  host.innerHTML = html;

  // 섬네일 채우기 — 지금 인화 방식 방향에 맞는 쪽을 보여줍니다
  var landscape = L.canvas.w > L.canvas.h;
  list.forEach(function(e){
    var key = landscape ? (e.h || e.v) : (e.v || e.h);
    if (!key) return;
    getImage(key).then(function(b){
      var el = host.querySelector('.sw[data-b="'+e.id+'"]');
      if (el && b) el.style.backgroundImage = 'url('+b.url+')';
    });
  });
}

$("bgPick").addEventListener("click", function(e){
  var b = e.target.closest(".sw"); if (!b) return;
  CFG.bgId = b.dataset.b || null;
  saveConfig();
  buildBgPick();
  buildModes();          // 미리보기 네모를 새 배경으로 다시 그립니다
});
function updateShotNote(){
  var L = enabledLayouts()[cur];
  $("shotNote").innerHTML = L
    ? '카메라가 먼저 켜집니다. 얼굴을 맞춘 뒤 촬영 시작을 누르면 <b>'+shotCount(L)+'컷</b>을 이어서 찍습니다.'
    : '';
}
function buildChips(host, items, current, isTimer){
  host.innerHTML = items.map(function(it){
    var v = isTimer ? it : it.id, label = isTimer ? it+"초" : it.name;
    return '<button class="chip" data-v="'+v+'" aria-pressed="'+(String(current)===String(v))+'">'+label+'</button>';
  }).join("");
}
function pressOnly(host, value){
  Array.prototype.forEach.call(host.children, function(b){
    if (b.dataset.v!==undefined) b.setAttribute("aria-pressed", String(b.dataset.v===String(value)));
  });
}

$("modes").addEventListener("click", function(e){
  var b=e.target.closest(".mode"); if(!b) return;
  cur = Number(b.dataset.i);
  Array.prototype.forEach.call($("modes").children, function(x){
    x.setAttribute("aria-pressed", String(Number(x.dataset.i)===cur));
  });
  buildBgPick();
  updateShotNote();
});
$("filters").addEventListener("click", function(e){
  var b=e.target.closest(".chip"); if(!b) return;
  CFG.filter=b.dataset.v; pressOnly($("filters"), CFG.filter); saveConfig(); applyPreviewFilter();
});
$("timers").addEventListener("click", function(e){
  var b=e.target.closest(".chip"); if(!b) return;
  CFG.timer=Number(b.dataset.v); pressOnly($("timers"), CFG.timer); saveConfig();
});
$("brandEdit").addEventListener("input", function(e){
  CFG.brand = e.target.value.trim() || "STUDIO 042"; saveConfig();
});

/* 이름 길게 누르면 관리자 */
(function(){
  var t=null;
  var el=$("brandEdit");
  var start=function(){ t=setTimeout(function(){ el.blur(); openAdmin(); }, 750); };
  var stop =function(){ clearTimeout(t); };
  ["pointerdown"].forEach(function(ev){ el.addEventListener(ev,start); });
  ["pointerup","pointerleave","pointercancel"].forEach(function(ev){ el.addEventListener(ev,stop); });
})();

/* ══════════════════════════════════════════
   보정 엔진 — 미리보기와 인화가 같은 숫자를 씁니다
   ══════════════════════════════════════════ */
function allFilters(){
  return (CFG.filters && CFG.filters.length) ? CFG.filters : defaultFilters();
}
function shownFilters(){
  var on = allFilters().filter(function(f){ return f.enabled; });
  return on.length ? on : allFilters().slice(0,1);
}
function filterById(id){
  var all=allFilters();
  for (var i=0;i<all.length;i++) if (all[i].id===id) return all[i];
  return shownFilters()[0] || newFilter({name:"원본"});
}
function activeFilter(){ return filterById(CFG.filter); }

/* 색 보정만 모은 CSS 문자열. 캔버스 ctx.filter 도 같은 문법을 씁니다. */
function colorCss(f){
  var p=[];
  if (f.brightness!==100) p.push("brightness("+(f.brightness/100)+")");
  if (f.contrast  !==100) p.push("contrast("+(f.contrast/100)+")");
  if (f.saturate  !==100) p.push("saturate("+(f.saturate/100)+")");
  if (f.sepia)            p.push("sepia("+(f.sepia/100)+")");
  if (f.hue)              p.push("hue-rotate("+f.hue+"deg)");
  return p.length ? p.join(" ") : "none";
}
/* 피부 보정 세기 → 흐림 반지름과 섞는 정도.
   반지름을 그림 너비에 비례시켜야 미리보기와 인화가 같아집니다. */
/* 잡티 크기만큼만 번지게 합니다. 너무 크면 눈 밑 그늘까지 뭉개집니다. */
function softBlur(f, px){ return Math.max(1, px*(0.005 + 0.008*(f.smooth/100))); }
function softAlpha(f){ return (f.smooth/100)*0.92; }
/* 밝기 차 문턱. 이 값보다 차이가 크면 눈·머리카락·윤곽으로 보고 손대지 않습니다.
   디테일 지키기를 올릴수록 문턱이 낮아져 아주 옅은 잡티만 건드립니다. */
function softThreshold(f){
  var d = (f.detail===undefined) ? 70 : f.detail;
  return 10 + (100 - d) * 0.45;
}
/* 미리보기는 CSS 흐림이라 이 선택적 보정을 그대로 못 그립니다.
   느낌만 보이도록 약하게 깔고, 실제 결과는 찍은 사진에서 나옵니다. */
function previewSoftAlpha(f){ return softAlpha(f) * 0.35; }
function fadeAlpha(f){ return (f.fade/100)*0.35; }
function vignAlpha(f){ return (f.vignette/100)*0.55; }

/* 미리보기 층에 보정을 입힙니다. els = {base, soft, tint, fade, vign}
   겹치는 순서: 색 보정 → 피부 보정 → 색감 → 먹색 → 비네팅.
   인화 합성도 이 순서 그대로입니다. */
function paintLook(els, f, px){
  if (els.base) els.base.style.filter = colorCss(f);
  if (els.soft){
    var on = f.smooth>0;
    els.soft.style.webkitBackdropFilter = on ? "blur("+softBlur(f,px)+"px)" : "none";
    els.soft.style.backdropFilter        = on ? "blur("+softBlur(f,px)+"px)" : "none";
    els.soft.style.opacity = on ? previewSoftAlpha(f) : 0;
  }
  if (els.tint){
    els.tint.style.background      = f.tint.color;
    els.tint.style.mixBlendMode    = f.tint.mode;
    els.tint.style.opacity         = (f.tint.amount||0)/100;
  }
  if (els.fade){
    els.fade.style.opacity = fadeAlpha(f);
  }
  if (els.vign){
    els.vign.style.opacity = 1;
    els.vign.style.background = f.vignette
      ? "radial-gradient(ellipse at center, rgba(0,0,0,0) 38%, rgba(0,0,0,"+vignAlpha(f)+") 100%)"
      : "none";
  }
}
function applyPreviewFilter(){
  var st=$("stage");
  paintLook({base:$("video"), soft:$("softLayer"), tint:$("tintLayer"),
             fade:$("fadeLayer"), vign:$("vignLayer")},
            activeFilter(), st ? (st.clientWidth||480) : 480);
}

/* 캔버스에 같은 보정을 입힙니다.
   iOS 17 아래 사파리는 ctx.filter 를 무시하므로 색은 직접 계산합니다. */
var _ctxFilterOK = null;
function ctxFilterWorks(){
  if (_ctxFilterOK!==null) return _ctxFilterOK;
  try{
    var c=document.createElement("canvas"); c.width=c.height=1;
    var x=c.getContext("2d");
    if (!("filter" in x)) return (_ctxFilterOK=false);
    x.filter="brightness(0)"; x.fillStyle="#ffffff"; x.fillRect(0,0,1,1);
    _ctxFilterOK = x.getImageData(0,0,1,1).data[0] < 12;
  } catch(e){ _ctxFilterOK=false; }
  return _ctxFilterOK;
}
/* CSS 필터와 같은 순서로 색 행렬을 쌓습니다 (ctx.filter 가 없을 때만 씁니다) */
function colorMatrix(f){
  var m=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,0];  // 3x3 + 오프셋 3
  function mul(a){
    var r=[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    for (var i=0;i<3;i++){
      for (var j=0;j<3;j++){
        r[i*4+j] = a[i*4]*m[j] + a[i*4+1]*m[4+j] + a[i*4+2]*m[8+j];
      }
      r[i*4+3] = a[i*4]*m[3] + a[i*4+1]*m[7] + a[i*4+2]*m[11] + a[i*4+3];
    }
    m=r;
  }
  var b=f.brightness/100, c=f.contrast/100, s=f.saturate/100, se=f.sepia/100;
  if (b!==1) mul([b,0,0,0, 0,b,0,0, 0,0,b,0]);
  if (c!==1){ var o=(0.5-0.5*c)*255; mul([c,0,0,o, 0,c,0,o, 0,0,c,o]); }
  if (s!==1){
    var R=0.213,G=0.715,B=0.072;
    mul([R+(1-R)*s, G-G*s, B-B*s, 0,
         R-R*s, G+(1-G)*s, B-B*s, 0,
         R-R*s, G-G*s, B+(1-B)*s, 0]);
  }
  if (se) mul([0.393+0.607*(1-se), 0.769-0.769*(1-se), 0.189-0.189*(1-se), 0,
               0.349-0.349*(1-se), 0.686+0.314*(1-se), 0.168-0.168*(1-se), 0,
               0.272-0.272*(1-se), 0.534-0.534*(1-se), 0.131+0.869*(1-se), 0]);
  if (f.hue){
    var a=f.hue*Math.PI/180, cs=Math.cos(a), sn=Math.sin(a);
    mul([0.213+cs*0.787-sn*0.213, 0.715-cs*0.715-sn*0.715, 0.072-cs*0.072+sn*0.928, 0,
         0.213-cs*0.213+sn*0.143, 0.715+cs*0.285+sn*0.140, 0.072-cs*0.072-sn*0.283, 0,
         0.213-cs*0.213-sn*0.787, 0.715-cs*0.715+sn*0.715, 0.072+cs*0.928+sn*0.072, 0]);
  }
  return m;
}
function applyMatrix(ctx, w, h, f){
  var m=colorMatrix(f);
  var d=ctx.getImageData(0,0,w,h), p=d.data;
  for (var i=0;i<p.length;i+=4){
    var r=p[i], g=p[i+1], bl=p[i+2];
    p[i]   = m[0]*r + m[1]*g + m[2]*bl + m[3];
    p[i+1] = m[4]*r + m[5]*g + m[6]*bl + m[7];
    p[i+2] = m[8]*r + m[9]*g + m[10]*bl + m[11];
  }
  ctx.putImageData(d,0,0);
}
function free(c){ if (c && c.width){ c.width=0; c.height=0; } }

/* 피부 보정: 줄였다 늘리면 부드러운 흐림이 됩니다.
   ctx.filter 가 없어도 동작하고 큰 그림에서도 빠릅니다. */
/* 잡티만 다듬기.
   흐린 복사본을 만든 뒤, 원본과 밝기 차가 작은 자리에만 섞습니다.
   잡티·모공은 주변과 차이가 작아서 다듬어지고,
   눈·눈썹·머리카락·얼굴 윤곽은 차이가 커서 그대로 남습니다. */
function softenInto(dst, src, f){
  var a = softAlpha(f);
  if (a<=0) return;
  var W = dst.width, H = dst.height;
  if (!W || !H) return;

  var div = Math.max(2, softBlur(f, W));
  var sw = Math.max(2, Math.round(W/div)), sh = Math.max(2, Math.round(H/div));

  var small = document.createElement("canvas");
  small.width=sw; small.height=sh;
  var sx = small.getContext("2d");
  sx.imageSmoothingEnabled = true;
  sx.drawImage(src, 0, 0, sw, sh);

  var blur = document.createElement("canvas");
  blur.width=W; blur.height=H;
  var bx = blur.getContext("2d");
  bx.imageSmoothingEnabled = true;
  bx.drawImage(small, 0, 0, W, H);
  free(small);

  var dctx = dst.getContext("2d");
  var o, b;
  try {
    o = dctx.getImageData(0,0,W,H);
    b = bx.getImageData(0,0,W,H);
  } catch(e){ free(blur); return; }
  free(blur);

  var op = o.data, bp = b.data;
  var t = softThreshold(f), inv = 1/t;
  for (var i=0; i<op.length; i+=4){
    // 밝기 차이로 판단합니다. 색이 달라도 밝기가 비슷하면 피부로 봅니다.
    var dl = 0.299*(bp[i]-op[i]) + 0.587*(bp[i+1]-op[i+1]) + 0.114*(bp[i+2]-op[i+2]);
    var n = (dl<0 ? -dl : dl) * inv;
    if (n >= 1) continue;              // 차이가 크면 건드리지 않습니다
    // 두 번 제곱해서 경계 근처에서는 빠르게 손을 뗍니다. 눈가 후광을 줄여줍니다.
    var m = 1 - n*n;
    var k = m * m * a;
    op[i]   += (bp[i]  -op[i]  )*k;
    op[i+1] += (bp[i+1]-op[i+1])*k;
    op[i+2] += (bp[i+2]-op[i+2])*k;
  }
  dctx.putImageData(o, 0, 0);
}
/* 색감 덧씌우기와 먹색 띄우기 — 미리보기의 겹침 순서와 같습니다 */
function overlayInto(ctx, w, h, f){
  if (f.tint && f.tint.amount>0){
    ctx.save();
    ctx.globalCompositeOperation = f.tint.mode;
    ctx.globalAlpha = f.tint.amount/100;
    ctx.fillStyle = f.tint.color;
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }
  if (f.fade>0){
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = fadeAlpha(f);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }
}
function drawVignette(ctx, x, y, w, h, f){
  if (!f.vignette) return;
  var cx=x+w/2, cy=y+h/2;
  var g=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.38, cx,cy,Math.max(w,h)*0.72);
  g.addColorStop(0,"rgba(0,0,0,0)");
  g.addColorStop(1,"rgba(0,0,0,"+vignAlpha(f)+")");
  ctx.save(); ctx.fillStyle=g; ctx.fillRect(x,y,w,h); ctx.restore();
}

/* ── 카메라 ───────────────────────────── */
function stopStream(){
  if (S.stream){ S.stream.getTracks().forEach(function(t){ t.stop(); }); S.stream=null; }
}
/* 쓸 카메라를 고릅니다. 관리자가 정해둔 카메라가 없거나 빠졌으면
   기본 카메라로 돌아갑니다. */
function videoConstraint(){
  var c = { width:{ideal:1920}, height:{ideal:1440} };
  if (CFG.cameraId) c.deviceId = { exact: CFG.cameraId };
  else c.facingMode = S.facing;
  return c;
}
function mirrorFor(){
  // 외장 카메라는 거울로 뒤집지 않습니다. 전면 카메라만 뒤집습니다.
  return !CFG.cameraId && S.facing === "user";
}
function openCamera(){
  stopStream();
  var tryOpen = function(constraint){
    return navigator.mediaDevices.getUserMedia({ video:constraint, audio:false });
  };
  return tryOpen(videoConstraint())
    .catch(function(err){
      if (!CFG.cameraId) throw err;
      // 정해둔 카메라가 사라졌으면 기본 카메라로 한 번 더 시도합니다
      CFG.cameraId = null; saveConfig();
      say("정해둔 카메라를 찾지 못해 기본 카메라로 엽니다.", 5000);
      return tryOpen({ facingMode:S.facing, width:{ideal:1920}, height:{ideal:1440} });
    })
    .then(function(st){
      S.stream=st;
      var v=$("video"); v.srcObject=st;
      v.style.transform = mirrorFor() ? "scaleX(-1)" : "none";
      return v.play().catch(function(){});
    });
}
function cameraError(err){
  var n = err && err.name ? err.name : "";
  if (n==="NotAllowedError") return "카메라 권한이 꺼져 있습니다. 설정 → Safari → 카메라에서 허용으로 바꾼 뒤 다시 열어주세요.";
  if (n==="NotFoundError" || n==="OverconstrainedError") return "쓸 수 있는 카메라를 찾지 못했습니다.";
  if (location.protocol!=="https:" && location.hostname!=="localhost")
    return "카메라는 https 주소에서만 열립니다. 주소가 https로 시작하는지 확인해 주세요.";
  return "카메라를 열지 못했습니다. 다른 앱이 카메라를 쓰고 있는지 확인해 주세요.";
}
function keepAwake(){
  if (!("wakeLock" in navigator)) return;
  navigator.wakeLock.request("screen").then(function(l){ S.wakeLock=l; }).catch(function(){});
}
function releaseAwake(){
  if (S.wakeLock){ S.wakeLock.release().catch(function(){}); S.wakeLock=null; }
}
document.addEventListener("visibilitychange", function(){
  if (document.visibilityState==="visible" && !shootEl.hidden) keepAwake();
});

/* ── 촬영 ─────────────────────────────── */
function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

/* 카메라 화면을 통째로 한 장 담아둡니다. 칸마다 비율이 달라도
   합성할 때 각 칸에 맞춰 가운데를 잘라 쓰면 되기 때문입니다. */
function grabFull(){
  var v=$("video"), vw=v.videoWidth, vh=v.videoHeight;
  if (!vw||!vh) return null;
  var f = activeFilter();
  var scale = Math.min(1, 1600/Math.max(vw,vh));
  var W=Math.round(vw*scale), H=Math.round(vh*scale);

  // 1) 원본 (전면 카메라는 거울처럼 뒤집어 담습니다)
  var out=document.createElement("canvas");
  out.width=W; out.height=H;
  var ox=out.getContext("2d");
  ox.save();
  if (mirrorFor()){ ox.translate(W,0); ox.scale(-1,1); }

  // 2) 색 보정 — 미리보기는 video 에 CSS filter 를 걸고, 여기서는 같은 문자열을 씁니다
  if (ctxFilterWorks()){
    ox.filter = colorCss(f);
    ox.drawImage(v,0,0,W,H);
    ox.filter = "none";
    ox.restore();
  } else {
    ox.drawImage(v,0,0,W,H);
    ox.restore();
    applyMatrix(ox, W, H, f);
  }

  // 3) 피부 보정 → 4) 색감 덧씌우기 → 먹색 띄우기
  softenInto(out, out, f);
  overlayInto(ox, W, H, f);
  return out;
}
/* 다 쓴 캔버스는 바로 비웁니다. iOS Safari는 페이지 전체의 캔버스 메모리가
   한도를 넘으면 오류 없이 잡티 섞인 그림을 돌려줍니다. */
var lastResultUrl = null;
function setResult(blob){
  S.blob = blob;
  if (lastResultUrl) URL.revokeObjectURL(lastResultUrl);
  lastResultUrl = URL.createObjectURL(blob);
  $("resultImg").src = lastResultUrl;
}
function freeCanvases(list){
  (list||[]).forEach(function(c){ if (c && c.width){ c.width=0; c.height=0; } });
}

function ticks(done,total){
  var h=""; for (var i=0;i<total;i++) h+='<span class="tick'+(i<done?" done":"")+'"></span>';
  $("ticks").innerHTML=h;
}
function countdown(sec){
  var n=sec;
  $("count").hidden=false; $("countCue").textContent="준비";
  return new Promise(function(resolve){
    (function step(){
      if (S.cancelled) return resolve();
      $("countNum").textContent=n;
      if (n<=1) $("countCue").textContent="찰칵";
      if (n<=0){ $("count").hidden=true; return resolve(); }
      n--; setTimeout(step,1000);
    })();
  });
}
function flash(){
  var f=$("flash"); f.classList.add("on");
  return wait(80).then(function(){ f.classList.remove("on"); });
}
function runSession(){
  var L = enabledLayouts()[cur];
  var total = shotCount(L);
  S.shots=[]; S.cancelled=false; ticks(0,total);
  function next(i){
    if (S.cancelled || i>=total) return Promise.resolve();
    return countdown(CFG.timer).then(function(){
      if (S.cancelled) return;
      var c=grabFull();
      if (!c){ say("카메라 화면을 읽지 못했습니다."); S.cancelled=true; return; }
      S.shots.push(c); ticks(S.shots.length,total);
      return flash().then(function(){ return wait(700); }).then(function(){ return next(i+1); });
    });
  }
  return next(0).then(function(){
    if (S.cancelled || S.shots.length<total) return;
    return renderPrint(L, S.shots).then(function(blob){
      setResult(blob);
      freeCanvases(S.shots); S.shots=[];
      setPrintPage(L);
      stopStream(); releaseAwake(); show(resultEl);
    });
  });
}

/* ══════════════════════════════════════════
   합성 — 관리자 설정 그대로 그립니다
   ══════════════════════════════════════════ */
function drawCover(ctx, src, x, y, w, h){
  var sw=src.width, sh=src.height;
  var ar=w/h, cw=sh*ar, ch=sh;
  if (cw>sw){ cw=sw; ch=sw/ar; }
  ctx.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,x,y,w,h);
}
function renderPrint(L, shots){
  var c=document.createElement("canvas");
  c.width=L.canvas.w; c.height=L.canvas.h;
  var ctx=c.getContext("2d");
  ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,c.width,c.height);

  return Promise.all([getImage(bgKeyFor(L)), getImage(L.frame),
                      (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve()])
    .then(function(r){
      var bg=r[0], fr=r[1];
      if (bg) ctx.drawImage(bg.img, 0,0, c.width, c.height);

      var look = activeFilter();
      L.slots.forEach(function(s){
        var src = shots[s.shot % shots.length];
        if (!src) return;
        drawCover(ctx, src, s.x, s.y, s.w, s.h);
        // 비네팅은 칸마다 겁니다. 촬영 화면에서 보이던 것과 같은 모양이 됩니다.
        drawVignette(ctx, s.x, s.y, s.w, s.h, look);
      });

      if (L.cut && L.cut.on){
        ctx.strokeStyle=L.cut.color; ctx.lineWidth=2; ctx.setLineDash([11,11]);
        ctx.beginPath(); ctx.moveTo(L.cut.x,40); ctx.lineTo(L.cut.x, c.height-40); ctx.stroke();
        ctx.setLineDash([]);
      }

      L.texts.forEach(function(t){
        ctx.fillStyle=t.color; ctx.font=fontOf(t); ctx.textAlign=t.align; ctx.textBaseline="alphabetic";
        ctx.fillText(resolveText(t.content), t.x, t.y);
      });

      if (fr) ctx.drawImage(fr.img, 0,0, c.width, c.height);
      return new Promise(function(res){ c.toBlob(res,"image/jpeg",0.95); });
    });
}
function setPrintPage(L){
  var el=$("pageSize"); if (!el) return;
  var w=(L.canvas.w/300).toFixed(2), h=(L.canvas.h/300).toFixed(2);
  el.textContent = "@page{ size:"+w+"in "+h+"in; margin:0 }";
}

/* ── 손님 버튼 ────────────────────────── */
$("startBtn").addEventListener("click", function(){
  hush();
  var L = enabledLayouts()[cur];
  if (!L){ say("관리자 화면에서 인화 방식을 하나 이상 켜주세요."); return; }
  var s0 = L.slots[0] || {w:2,h:3};
  $("stage").style.setProperty("--ar", s0.w+" / "+s0.h);
  $("stage").style.setProperty("--ar-num", s0.w/s0.h);
  show(shootEl); ticks(0, shotCount(L)); applyPreviewFilter(); keepAwake();
  // 카메라만 켜고 기다립니다. 얼굴을 맞춘 뒤 촬영 시작을 눌러야 찍기 시작합니다.
  readyMode(true);
  openCamera()
    .catch(function(err){ say(cameraError(err),0); releaseAwake(); show(setupEl); });
});

/* 촬영 화면의 두 가지 상태: 기다리는 중 / 찍는 중 */
function readyMode(on){
  $("goBtn").hidden = !on;
  $("flipBtn").hidden = !on;
  $("shootHint").hidden = !on;
  $("count").hidden = true;
}

$("goBtn").addEventListener("click", function(){
  if (!S.stream){ say("카메라가 아직 준비되지 않았습니다."); return; }
  readyMode(false);
  runSession().catch(function(){ readyMode(true); });
});
$("cancelBtn").addEventListener("click", function(){
  S.cancelled=true; readyMode(true); stopStream(); releaseAwake(); show(setupEl);
});
$("flipBtn").addEventListener("click", function(){
  S.facing = S.facing==="user" ? "environment" : "user";
  openCamera().then(applyPreviewFilter).catch(function(e){ say(cameraError(e)); });
});
$("againBtn").addEventListener("click", function(){
  S.blob=null; freeCanvases(S.shots); S.shots=[]; hush(); readyMode(true); show(setupEl);
});
$("printBtn").addEventListener("click", function(){ window.print(); });
$("saveBtn").addEventListener("click", function(){
  if (!S.blob) return;
  var name = CFG.brand.replace(/\s+/g,"_")+"_"+Date.now()+".jpg";
  var file = new File([S.blob], name, {type:"image/jpeg"});
  if (navigator.canShare && navigator.canShare({files:[file]})){
    navigator.share({files:[file]}).catch(function(e){
      if (e && e.name==="AbortError") return;
      say("위 사진을 길게 눌러 ‘사진에 추가’를 고르면 저장됩니다.",6000);
    });
    return;
  }
  say("위 사진을 길게 눌러 ‘사진에 추가’를 고르면 저장됩니다.",6000);
});

/* ══════════════════════════════════════════
   관리자 화면
   ══════════════════════════════════════════ */
function L(){ return CFG.layouts[admIdx]; }

function openAdmin(){
  if (!CFG.layouts.length) CFG.layouts = defaultConfig().layouts;
  admIdx = Math.min(admIdx, CFG.layouts.length-1);
  selSlot = L().slots.length ? 0 : -1;
  selText = L().texts.length ? 0 : -1;
  CFG.filters = allFilters();
  var at = allFilters().map(function(f){ return f.id; }).indexOf(CFG.filter);
  fIdx = at < 0 ? 0 : at;
  show(adminEl);
  renderAdmin();
}
$("admClose").addEventListener("click", function(){
  pvStop();
  saveConfig().then(function(){
    buildModes();
    buildChips($("filters"), shownFilters(), CFG.filter, false);
    show(setupEl); say("설정을 저장했습니다.");
  });
});

/* ── 카메라 고르기 ────────────────────── */
function scanCameras(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
    $("camNote").textContent = "이 브라우저에서는 카메라 목록을 볼 수 없습니다.";
    return Promise.resolve([]);
  }
  return navigator.mediaDevices.enumerateDevices().then(function(all){
    var cams = all.filter(function(d){ return d.kind==="videoinput"; });
    var named = cams.filter(function(d){ return d.label; }).length;
    $("camPick").innerHTML = '<option value="">기본 카메라</option>' +
      cams.map(function(d,i){
        return '<option value="'+escapeHtml(d.deviceId)+'">'+
               escapeHtml(d.label || ("카메라 "+(i+1)+" (이름 모름)"))+'</option>';
      }).join("");
    // 저장해둔 카메라가 아직 꽂혀 있으면 그대로 골라둡니다
    var still = CFG.cameraId && cams.some(function(d){ return d.deviceId===CFG.cameraId; });
    $("camPick").value = still ? CFG.cameraId : "";
    if (CFG.cameraId && !still){
      CFG.cameraId = null; saveConfig();
      $("camNote").textContent = "정해둔 카메라가 지금은 없습니다. 기본 카메라로 돌려놨습니다.";
    } else if (!cams.length){
      $("camNote").textContent = "찾은 카메라가 없습니다.";
    } else if (!named){
      $("camNote").textContent = cams.length+"대를 찾았지만 이름을 모릅니다. 아래에서 카메라를 한 번 켜서 권한을 허용한 뒤 다시 찾으세요.";
    } else {
      $("camNote").textContent = cams.length+"대를 찾았습니다. 쓸 카메라를 고르세요.";
    }
    return cams;
  }).catch(function(){ return []; });
}
$("camScan").addEventListener("click", function(){
  scanCameras().then(function(){ say("카메라 목록을 다시 읽었습니다."); });
});
$("camPick").addEventListener("change", function(e){
  CFG.cameraId = e.target.value || null;
  saveConfig();
  if (pvStream){ pvStop(); $("pvToggle").click(); }   // 미리보기를 새 카메라로 다시 엽니다
  say(CFG.cameraId ? "이 카메라를 쓰도록 정했습니다." : "기본 카메라로 돌렸습니다.");
});
$("camFlip").addEventListener("click", function(){
  S.facing = S.facing==="user" ? "environment" : "user";
  CFG.cameraId = null; $("camPick").value=""; saveConfig();
  if (pvStream){ pvStop(); $("pvToggle").click(); }
  say(S.facing==="user" ? "앞 카메라로 바꿨습니다." : "뒤 카메라로 바꿨습니다.");
});

/* ── 보정 편집 ────────────────────────── */
var fIdx = 0;
var SLIDERS = [
  {k:"brightness", n:"밝기",      min:50,  max:150, def:100},
  {k:"contrast",   n:"대비",      min:50,  max:150, def:100},
  {k:"saturate",   n:"채도",      min:0,   max:200, def:100},
  {k:"smooth",     n:"피부 보정", min:0,   max:100, def:0},
  {k:"detail",     n:"디테일 지키기", min:0, max:100, def:70},
  {k:"fade",       n:"먹색 띄우기",min:0,  max:100, def:0},
  {k:"vignette",   n:"비네팅",    min:0,   max:100, def:0},
  {k:"sepia",      n:"세피아",    min:0,   max:100, def:0},
  {k:"hue",        n:"색상 돌리기",min:-45,max:45,  def:0}
];
function F(){
  var all=allFilters();
  if (fIdx>=all.length) fIdx=0;
  return all[fIdx];
}
function buildSliders(){
  $("fSliders").innerHTML = SLIDERS.map(function(s){
    return '<div class="sl"><label for="sl_'+s.k+'">'+s.n+'</label>'+
      '<input type="range" id="sl_'+s.k+'" min="'+s.min+'" max="'+s.max+'" step="1">'+
      '<output id="out_'+s.k+'"></output></div>';
  }).join("");
  $("fTintSlider").innerHTML =
    '<div class="sl"><label for="sl_tint">세기</label>'+
    '<input type="range" id="sl_tint" min="0" max="100" step="1">'+
    '<output id="out_tint"></output></div>';
  $("fTintMode").innerHTML = BLEND_MODES.map(function(m){
    return '<option value="'+m.v+'">'+m.n+'</option>';
  }).join("");

  SLIDERS.forEach(function(s){
    $("sl_"+s.k).addEventListener("input", function(e){
      F()[s.k] = Number(e.target.value);
      $("out_"+s.k).textContent = e.target.value;
      paintAdminLook(); applyPreviewFilter(); renderCompare();
    });
    $("sl_"+s.k).addEventListener("change", saveConfig);
  });
  $("sl_tint").addEventListener("input", function(e){
    F().tint.amount = Number(e.target.value);
    $("out_tint").textContent = e.target.value;
    paintAdminLook(); applyPreviewFilter(); renderCompare();
  });
  $("sl_tint").addEventListener("change", saveConfig);
  $("fTintColor").addEventListener("input", function(e){
    F().tint.color = e.target.value; paintAdminLook(); applyPreviewFilter();
  });
  $("fTintColor").addEventListener("change", saveConfig);
  $("fTintMode").addEventListener("change", function(e){
    F().tint.mode = e.target.value; paintAdminLook(); applyPreviewFilter(); saveConfig();
  });
}
function renderFilterList(){
  $("filterList").innerHTML = allFilters().map(function(f,i){
    return '<button class="lrow" data-i="'+i+'" aria-pressed="'+(i===fIdx)+'">'+
      '<span class="nm">'+f.name+'</span>'+
      '<span class="off">'+(f.enabled?'':'숨김')+'</span></button>';
  }).join("");
}
$("filterList").addEventListener("click", function(e){
  var b=e.target.closest(".lrow"); if(!b) return;
  fIdx=Number(b.dataset.i);
  CFG.filter = F().id;          // 고른 보정을 바로 미리봅니다
  renderFilterFields(); renderFilterList(); paintAdminLook();
  buildChips($("filters"), shownFilters(), CFG.filter, false);
  applyPreviewFilter(); saveConfig();
});
function renderFilterFields(){
  var f=F();
  $("fName").value=f.name;
  $("fEnabled").checked=!!f.enabled;
  SLIDERS.forEach(function(s){
    var v = (f[s.k]===undefined) ? s.def : f[s.k];
    $("sl_"+s.k).value=v; $("out_"+s.k).textContent=v;
  });
  if (!f.tint) f.tint={color:"#FFB07A",mode:"soft-light",amount:0};
  $("fTintColor").value=f.tint.color;
  $("fTintMode").value=f.tint.mode;
  $("sl_tint").value=f.tint.amount; $("out_tint").textContent=f.tint.amount;
}
$("fName").addEventListener("input", function(e){
  F().name=e.target.value||"이름 없음"; renderFilterList(); saveConfig();
  buildChips($("filters"), shownFilters(), CFG.filter, false);
});
$("fEnabled").addEventListener("change", function(e){
  var on=e.target.checked;
  if (!on && shownFilters().length<=1 && F().enabled){
    e.target.checked=true; say("보정은 최소 하나는 보여야 합니다."); return;
  }
  F().enabled=on; renderFilterList(); saveConfig();
  if (!on && CFG.filter===F().id) CFG.filter = shownFilters()[0].id;
  buildChips($("filters"), shownFilters(), CFG.filter, false);
});
$("fAdd").addEventListener("click", function(){
  CFG.filters = allFilters().concat([newFilter({name:"새 보정", brightness:105, smooth:30})]);
  fIdx=CFG.filters.length-1; CFG.filter=F().id;
  renderFilterList(); renderFilterFields(); paintAdminLook();
  buildChips($("filters"), shownFilters(), CFG.filter, false); saveConfig();
});
$("fDup").addEventListener("click", function(){
  var c=JSON.parse(JSON.stringify(F()));
  c.id="F"+Date.now(); c.name=F().name+" 복사본";
  CFG.filters = allFilters(); CFG.filters.splice(fIdx+1,0,c);
  fIdx++; CFG.filter=F().id;
  renderFilterList(); renderFilterFields(); paintAdminLook();
  buildChips($("filters"), shownFilters(), CFG.filter, false); saveConfig();
});
$("fDel").addEventListener("click", function(){
  if (allFilters().length<=1){ say("마지막 하나는 지울 수 없습니다."); return; }
  var name=F().name;
  ask("‘"+name+"’ 보정을 지울까요?", function(){
    CFG.filters = allFilters(); CFG.filters.splice(fIdx,1);
    fIdx=Math.max(0,fIdx-1); CFG.filter=shownFilters()[0].id;
    renderFilterList(); renderFilterFields(); paintAdminLook();
    buildChips($("filters"), shownFilters(), CFG.filter, false); saveConfig();
  });
});
$("fReset").addEventListener("click", function(){
  ask("보정 목록을 기본값으로 되돌릴까요? 인화 방식은 그대로 둡니다.", function(){
    CFG.filters=defaultFilters(); fIdx=0; CFG.filter=CFG.filters[1].id;
    renderFilterList(); renderFilterFields(); paintAdminLook();
    buildChips($("filters"), shownFilters(), CFG.filter, false); saveConfig();
    say("보정을 기본값으로 되돌렸습니다.");
  });
});

/* 한 장 찍어서 보정 전후를 나란히 보여줍니다.
   잡티 보정은 움직이는 화면으로는 판단이 안 되기 때문입니다. */
var cmpFrame = null;
function renderCompare(){
  if (!cmpFrame) return;
  var f = F(), W = cmpFrame.width, H = cmpFrame.height;

  // 보정 전 — 색만 입히고 피부 보정은 빼둡니다
  var plain = Object.create(null);
  for (var k in f) plain[k] = f[k];
  plain.smooth = 0;

  var a = renderLook(cmpFrame, plain);
  var b = renderLook(cmpFrame, f);
  $("cmpA").src = a.toDataURL("image/jpeg", 0.9);
  $("cmpB").src = b.toDataURL("image/jpeg", 0.9);
  free(a); free(b);
  $("cmpBox").hidden = false;
  $("cmpNote").hidden = false;
}
/* 한 장짜리 캔버스에 보정을 입힙니다. grabFull 과 같은 순서입니다. */
function renderLook(src, f){
  var W = src.width, H = src.height;
  var out = document.createElement("canvas");
  out.width = W; out.height = H;
  var ox = out.getContext("2d");
  if (ctxFilterWorks()){
    ox.filter = colorCss(f); ox.drawImage(src,0,0); ox.filter = "none";
  } else {
    ox.drawImage(src,0,0); applyMatrix(ox, W, H, f);
  }
  softenInto(out, out, f);
  overlayInto(ox, W, H, f);
  return out;
}
$("cmpShot").addEventListener("click", function(){
  var v = $("pvVideo");
  if (!pvStream || !v.videoWidth){ say("먼저 카메라를 켜주세요."); return; }
  free(cmpFrame);
  var scale = Math.min(1, 900/Math.max(v.videoWidth, v.videoHeight));
  cmpFrame = document.createElement("canvas");
  cmpFrame.width  = Math.round(v.videoWidth*scale);
  cmpFrame.height = Math.round(v.videoHeight*scale);
  var c = cmpFrame.getContext("2d");
  if (mirrorFor()){ c.translate(cmpFrame.width,0); c.scale(-1,1); }
  c.drawImage(v, 0, 0, cmpFrame.width, cmpFrame.height);
  renderCompare();
});

function paintAdminLook(){
  var box=$("lookPrevBox");
  paintLook({base:$("pvVideo"), soft:$("pvSoft"), tint:$("pvTint"),
             fade:$("pvFade"), vign:$("pvVign")},
            F(), box ? (box.clientWidth||360) : 360);
}

/* 보정 미리보기용 카메라 */
var pvStream=null;
function pvStop(){
  if (pvStream){ pvStream.getTracks().forEach(function(t){ t.stop(); }); pvStream=null; }
  $("pvVideo").srcObject=null;
  $("pvOff").hidden=false;
  $("pvToggle").textContent="카메라 켜기";
}
$("pvToggle").addEventListener("click", function(){
  if (pvStream){ pvStop(); return; }
  var c = CFG.cameraId ? {deviceId:{exact:CFG.cameraId}} : {facingMode:S.facing};
  c.width = {ideal:1280};
  navigator.mediaDevices.getUserMedia({video:c,audio:false})
    .then(function(st){
      pvStream=st;
      var v=$("pvVideo");
      v.srcObject=st;
      v.style.transform = mirrorFor() ? "scaleX(-1)" : "none";
      $("pvOff").hidden=true;
      $("pvToggle").textContent="카메라 끄기";
      paintAdminLook();
      return v.play().catch(function(){});
    })
    .catch(function(err){ say(cameraError(err),5000); });
});

function renderAdmin(){
  scanCameras();
  renderFilterList();
  renderFilterFields();
  paintAdminLook();
  renderLayoutList();
  renderLayoutFields();
  renderBgList();
  renderBgSelect();
  renderTextList();
  renderTextFields();
  renderSlotFields();
  renderEditor();
}

function renderLayoutList(){
  $("admLayouts").innerHTML = CFG.layouts.map(function(l,i){
    return '<button class="lrow" data-i="'+i+'" aria-pressed="'+(i===admIdx)+'">'+
      '<span class="nm">'+l.name+'</span>'+
      '<span class="off">'+shotCount(l)+'컷'+(l.enabled?'':' · 숨김')+'</span></button>';
  }).join("");
}
$("admLayouts").addEventListener("click", function(e){
  var b=e.target.closest(".lrow"); if(!b) return;
  admIdx=Number(b.dataset.i);
  selSlot = L().slots.length?0:-1; selText = L().texts.length?0:-1;
  renderAdmin();
});

function renderLayoutFields(){
  var l=L();
  $("admName").value=l.name;
  $("admEnabled").checked=!!l.enabled;
  $("admW").value=l.canvas.w; $("admH").value=l.canvas.h;
  var key=l.canvas.w+"x"+l.canvas.h;
  var opt=Array.prototype.filter.call($("admPreset").options,function(o){return o.value===key;})[0];
  $("admPreset").value = opt ? key : "custom";
  $("cutOn").checked = !!(l.cut && l.cut.on);
  $("cutX").value = l.cut ? l.cut.x : Math.round(l.canvas.w/2);
  $("cutColor").value = l.cut ? l.cut.color : "#D8D0CA";
  $("editNote").textContent = l.canvas.w+" × "+l.canvas.h+" px · 300dpi 기준 "+
    (l.canvas.w/300).toFixed(1)+" × "+(l.canvas.h/300).toFixed(1)+" 인치 · 촬영 "+shotCount(l)+"컷";
}
$("admName").addEventListener("input", function(e){
  L().name = e.target.value || "이름 없음"; renderLayoutList(); saveConfig();
});
$("admEnabled").addEventListener("change", function(e){
  L().enabled = e.target.checked; renderLayoutList(); saveConfig();
});
$("admPreset").addEventListener("change", function(e){
  if (e.target.value==="custom") return;
  var p=e.target.value.split("x");
  L().canvas.w=Number(p[0]); L().canvas.h=Number(p[1]);
  renderLayoutFields(); renderEditor(); saveConfig();
});
["admW","admH"].forEach(function(id){
  $(id).addEventListener("change", function(){
    var w=Number($("admW").value)||1200, h=Number($("admH").value)||1800;
    L().canvas.w=Math.max(200,Math.min(6000,w));
    L().canvas.h=Math.max(200,Math.min(6000,h));
    renderLayoutFields(); renderEditor(); saveConfig();
  });
});
["cutOn","cutX","cutColor"].forEach(function(id){
  $(id).addEventListener("change", function(){
    var l=L();
    if (!l.cut) l.cut={on:false,x:Math.round(l.canvas.w/2),color:"#D8D0CA"};
    l.cut.on = $("cutOn").checked;
    l.cut.x = Number($("cutX").value)||Math.round(l.canvas.w/2);
    l.cut.color = $("cutColor").value;
    renderEditor(); saveConfig();
  });
});

/* 레이아웃 추가·복제·삭제 */
$("admAdd").addEventListener("click", function(){
  CFG.layouts.push({
    id:"L"+Date.now(), name:"새 인화", enabled:true,
    canvas:{w:1200,h:1800}, bgId:null, frame:null,
    slots:[{x:150,y:150,w:900,h:600,shot:0}],
    texts:[{content:"{brand}",x:600,y:1700,size:48,font:"display",align:"center",color:"#111111"}],
    cut:{on:false,x:600,color:"#D8D0CA"}
  });
  admIdx=CFG.layouts.length-1; selSlot=0; selText=0; renderAdmin(); saveConfig();
});
$("admDup").addEventListener("click", function(){
  var copy=JSON.parse(JSON.stringify(L()));
  copy.id="L"+Date.now(); copy.name=L().name+" 복사본";
  CFG.layouts.splice(admIdx+1,0,copy); admIdx++; renderAdmin(); saveConfig();
});
$("admDel").addEventListener("click", function(){
  if (CFG.layouts.length<=1){ say("마지막 하나는 지울 수 없습니다."); return; }
  ask("‘"+L().name+"’ 인화 방식을 지울까요?", function(){
    CFG.layouts.splice(admIdx,1);
    admIdx=Math.max(0,admIdx-1); selSlot=0; selText=0; renderAdmin(); saveConfig();
    buildModes();
  });
});

/* 배경 / 프레임 이미지 */
/* 올린 이미지를 인화지 크기로 줄여서 저장합니다.
   카메라 원본처럼 큰 사진을 그대로 들고 있으면 합성할 때 캔버스 메모리가
   터지면서 결과가 잡티로 나옵니다. 어차피 인화지 크기로 늘여 쓰므로
   원본 해상도를 보관할 이유가 없습니다. */
function fitImage(file, w, h, keepAlpha){
  return new Promise(function(res, rej){
    var url = URL.createObjectURL(file);
    var im = new Image();
    im.onload = function(){
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      var x = c.getContext("2d");
      if (!keepAlpha){ x.fillStyle = "#FFFFFF"; x.fillRect(0,0,w,h); }
      x.drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(function(b){
        c.width = c.height = 0;
        b ? res(b) : rej(new Error("encode"));
      }, keepAlpha ? "image/png" : "image/jpeg", 0.92);
    };
    im.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("decode")); };
    im.src = url;
  });
}

/* 프레임은 인화 방식마다 다른 그림이라 레이아웃에 그대로 둡니다 */
function handleImage(input, which){
  var f = input.files && input.files[0]; if (!f) return;
  if (!/^image\//.test(f.type)){ say("이미지 파일만 올릴 수 있습니다."); input.value=""; return; }
  var l = L();
  say("이미지를 인화지 크기로 맞추는 중…", 0);
  fitImage(f, l.canvas.w, l.canvas.h, true)
    .then(putImage)
    .then(function(key){
      var old = l[which];
      l[which] = key;
      if (old){ kvDel(old); delete imgCache[old]; }
      return saveConfig();
    })
    .then(function(){ renderEditor(); say("프레임을 올렸습니다."); })
    .catch(function(){
      say("이미지를 읽지 못했습니다. PNG나 JPG로 저장해서 다시 올려주세요.", 5000);
    })
    .then(function(){ input.value=""; });
}
$("admFrame").addEventListener("change", function(){ handleImage(this,"frame"); });
$("admFrameDel").addEventListener("click", function(){
  var k=L().frame; if(!k){ say("올린 프레임이 없습니다."); return; }
  L().frame=null; kvDel(k); delete imgCache[k]; saveConfig(); renderEditor(); say("프레임을 지웠습니다.");
});

/* ── 배경 목록 관리 ─────────────────────────
   배경은 공용이라 어느 한 인화 방식에 매달지 않습니다.
   가로 배경은 가장 큰 가로 인화지, 세로 배경은 가장 큰 세로 인화지에 맞춰
   줄여서 저장합니다. 원본 그대로 두면 아이패드에서 합성 중에 메모리가 터집니다. */
function bgTargetSize(which){
  var w=0, h=0;
  CFG.layouts.forEach(function(l){
    var land = l.canvas.w > l.canvas.h;
    if ((which==="h") === land && l.canvas.w*l.canvas.h > w*h){ w=l.canvas.w; h=l.canvas.h; }
  });
  if (!w) return which==="h" ? {w:1800,h:1200} : {w:1200,h:1800};
  return {w:w, h:h};
}

function renderBgList(){
  var host = $("bgList"), a = allBackgrounds();
  if (!a.length){
    host.innerHTML = '<p class="note">아직 올린 배경이 없습니다. 배경 추가를 눌러 시작하세요.</p>';
    return;
  }
  host.innerHTML = a.map(function(e){
    return '<div class="bgrow" data-id="'+e.id+'">'+
      '<span class="bgthumb" data-slot="h"></span>'+
      '<span class="bgthumb" data-slot="v"></span>'+
      '<input class="bgname" type="text" maxlength="20" value="'+escapeHtml(e.name)+'">'+
      '<label class="btn sm filepick">가로<input type="file" accept="image/*" data-up="h"></label>'+
      '<label class="btn sm filepick">세로<input type="file" accept="image/*" data-up="v"></label>'+
      '<button class="btn sm danger" data-del="1">삭제</button></div>';
  }).join("");

  a.forEach(function(e){
    ["h","v"].forEach(function(k){
      var el = host.querySelector('.bgrow[data-id="'+e.id+'"] .bgthumb[data-slot="'+k+'"]');
      if (!el) return;
      if (!e[k]){ el.textContent = "없음"; return; }
      getImage(e[k]).then(function(b){ if (b) el.style.backgroundImage = 'url('+b.url+')'; });
    });
  });
}

function renderBgSelect(){
  var sel = $("admBgSel");
  var html = '<option value="">없음</option>';
  allBackgrounds().forEach(function(e){
    html += '<option value="'+e.id+'">'+escapeHtml(e.name)+'</option>';
  });
  sel.innerHTML = html;
  sel.value = CFG.bgId || "";
}
$("admBgSel").addEventListener("change", function(){
  CFG.bgId = this.value || null;
  saveConfig(); renderEditor(); buildBgPick(); buildModes();
});

$("bgAdd").addEventListener("click", function(){
  allBackgrounds().push({
    id: "B"+Date.now()+Math.floor(Math.random()*1000),
    name: "배경 "+(allBackgrounds().length+1), h:null, v:null
  });
  saveConfig(); renderBgList(); renderBgSelect(); buildBgPick();
  say("배경을 하나 만들었습니다. 가로·세로 그림을 올려주세요.");
});

$("bgList").addEventListener("change", function(ev){
  var row = ev.target.closest(".bgrow"); if (!row) return;
  var e = bgById(row.dataset.id); if (!e) return;

  if (ev.target.classList.contains("bgname")){
    e.name = ev.target.value.trim() || "배경";
    ev.target.value = e.name;
    saveConfig(); renderBgSelect(); buildBgPick();
    return;
  }

  var which = ev.target.dataset.up;
  if (!which) return;
  var input = ev.target;
  var f = input.files && input.files[0]; if (!f) return;
  if (!/^image\//.test(f.type)){ say("이미지 파일만 올릴 수 있습니다."); input.value=""; return; }
  var t = bgTargetSize(which);
  say("배경을 인화지 크기로 맞추는 중…", 0);
  fitImage(f, t.w, t.h, false)
    .then(putImage)
    .then(function(key){
      var old = e[which];
      e[which] = key;
      if (old){ kvDel(old); delete imgCache[old]; }
      return saveConfig();
    })
    .then(function(){
      renderBgList(); renderEditor(); buildBgPick(); buildModes();
      say((which==="h"?"가로":"세로")+" 배경을 올렸습니다.");
    })
    .catch(function(){
      say("이미지를 읽지 못했습니다. PNG나 JPG로 저장해서 다시 올려주세요.", 5000);
    })
    .then(function(){ input.value=""; });
});

$("bgList").addEventListener("click", function(ev){
  var btn = ev.target.closest("[data-del]"); if (!btn) return;
  var row = ev.target.closest(".bgrow"); if (!row) return;
  var id = row.dataset.id, e = bgById(id); if (!e) return;
  ask('배경 "'+e.name+'" 을 지울까요?', function(){
    var keys = [e.h, e.v].filter(Boolean);
    CFG.backgrounds = allBackgrounds().filter(function(x){ return x.id !== id; });
    if (CFG.bgId === id) CFG.bgId = null;
    keys.forEach(function(k){ kvDel(k); delete imgCache[k]; });
    saveConfig().then(function(){
      renderBgList(); renderBgSelect(); renderEditor(); buildBgPick(); buildModes();
      say("배경을 지웠습니다.");
    });
  });
});

/* 사진 칸 */
function renderSlotFields(){
  var s = L().slots[selSlot];
  var on = !!s;
  ["slotX","slotY","slotW","slotH","slotShot"].forEach(function(id){ $(id).disabled=!on; });
  if (!on) return;
  $("slotX").value=s.x; $("slotY").value=s.y;
  $("slotW").value=s.w; $("slotH").value=s.h; $("slotShot").value=s.shot+1;
}
["slotX","slotY","slotW","slotH","slotShot"].forEach(function(id){
  $(id).addEventListener("change", function(){
    var s=L().slots[selSlot]; if(!s) return;
    s.x=Math.round(Number($("slotX").value)||0);
    s.y=Math.round(Number($("slotY").value)||0);
    s.w=Math.max(20,Math.round(Number($("slotW").value)||20));
    s.h=Math.max(20,Math.round(Number($("slotH").value)||20));
    s.shot=Math.max(0,(Number($("slotShot").value)||1)-1);
    renderEditor(); renderLayoutFields(); renderLayoutList(); saveConfig();
  });
});
$("slotAdd").addEventListener("click", function(){
  var l=L();
  l.slots.push({x:Math.round(l.canvas.w*0.1), y:Math.round(l.canvas.h*0.1),
                w:Math.round(l.canvas.w*0.3), h:Math.round(l.canvas.h*0.2),
                shot:shotCount(l)});
  selSlot=l.slots.length-1; renderAdmin(); saveConfig();
});
$("slotDup").addEventListener("click", function(){
  var s=L().slots[selSlot]; if(!s){ say("복제할 칸을 먼저 고르세요."); return; }
  var c=JSON.parse(JSON.stringify(s)); c.x+=Math.round(s.w*0.3); c.y+=Math.round(s.h*0.3);
  L().slots.push(c); selSlot=L().slots.length-1; renderAdmin(); saveConfig();
});
$("slotDel").addEventListener("click", function(){
  if (L().slots.length<=1){ say("칸은 최소 하나 있어야 합니다."); return; }
  if (selSlot<0) return;
  L().slots.splice(selSlot,1); selSlot=Math.max(0,selSlot-1); renderAdmin(); saveConfig();
});
$("slotRowX").addEventListener("click", function(){
  var l=L(), n=l.slots.length; if(n<2) return;
  var m=Math.round(l.canvas.w*0.05), gap=Math.round(l.canvas.w*0.02);
  var w=Math.floor((l.canvas.w-m*2-gap*(n-1))/n);
  l.slots.forEach(function(s,i){ s.w=w; s.x=m+i*(w+gap); });
  renderAdmin(); saveConfig();
});
$("slotRowY").addEventListener("click", function(){
  var l=L(), n=l.slots.length; if(n<2) return;
  var m=Math.round(l.canvas.h*0.04), gap=Math.round(l.canvas.h*0.012);
  var h=Math.floor((l.canvas.h-m*2-gap*(n-1))/n);
  l.slots.forEach(function(s,i){ s.h=h; s.y=m+i*(h+gap); });
  renderAdmin(); saveConfig();
});
$("slotTwin").addEventListener("click", function(){
  var l=L();
  var half=l.canvas.w/2;
  var base=l.slots.filter(function(s){ return s.x+s.w/2 < half; });
  if (!base.length) base=l.slots.slice();
  l.slots = base.concat(base.map(function(s){
    var c=JSON.parse(JSON.stringify(s)); c.x=Math.round(s.x+half); return c;
  }));
  selSlot=0; renderAdmin(); saveConfig();
  say("왼쪽 칸을 오른쪽에 같은 사진 번호로 복제했습니다.");
});

/* ── 정렬 ────────────────────────────────
   편집 화면만 다시 그립니다. 카메라는 다시 찾지 않습니다. */
function redrawEdit(){
  renderSlotFields(); renderTextList(); renderTextFields();
  renderLayoutFields(); renderEditor(); saveConfig();
}
/* 선택한 칸을 인화지 끝이나 가운데에 붙입니다 */
function alignSlot(how){
  var l=L(), s=l.slots[selSlot];
  if (!s){ say("먼저 칸을 고르세요."); return; }
  if (how==="left")        s.x=0;
  else if (how==="cx")     s.x=Math.round((l.canvas.w-s.w)/2);
  else if (how==="right")  s.x=l.canvas.w-s.w;
  else if (how==="top")    s.y=0;
  else if (how==="cy")     s.y=Math.round((l.canvas.h-s.h)/2);
  else if (how==="bottom") s.y=l.canvas.h-s.h;
  redrawEdit();
}
[["slotAlL","left"],["slotAlCX","cx"],["slotAlR","right"],
 ["slotAlT","top"],["slotAlCY","cy"],["slotAlB","bottom"]].forEach(function(pair){
  $(pair[0]).addEventListener("click", function(){ alignSlot(pair[1]); });
});
$("slotSame").addEventListener("click", function(){
  var l=L(), s=l.slots[selSlot];
  if (!s){ say("기준이 될 칸을 먼저 고르세요."); return; }
  l.slots.forEach(function(o){ o.w=s.w; o.h=s.h; });
  redrawEdit(); say("모든 칸을 선택 칸과 같은 크기로 맞췄습니다.");
});
/* 선택 칸과 위아래로 겹치는 칸들의 Y·세로를 같게 만듭니다 */
$("slotAlRow").addEventListener("click", function(){
  var l=L(), s=l.slots[selSlot];
  if (!s){ say("기준이 될 칸을 먼저 고르세요."); return; }
  var c=s.y+s.h/2, n=0;
  l.slots.forEach(function(o,i){
    if (i===selSlot) return;
    if (Math.abs((o.y+o.h/2)-c) <= Math.max(s.h,o.h)*0.6){ o.y=s.y; o.h=s.h; n++; }
  });
  redrawEdit();
  say(n ? n+"개 칸을 같은 줄로 맞췄습니다." : "같은 줄에 있는 칸이 없습니다.");
});
/* 선택 칸과 좌우로 겹치는 칸들의 X·가로를 같게 만듭니다 */
$("slotAlCol").addEventListener("click", function(){
  var l=L(), s=l.slots[selSlot];
  if (!s){ say("기준이 될 칸을 먼저 고르세요."); return; }
  var c=s.x+s.w/2, n=0;
  l.slots.forEach(function(o,i){
    if (i===selSlot) return;
    if (Math.abs((o.x+o.w/2)-c) <= Math.max(s.w,o.w)*0.6){ o.x=s.x; o.w=s.w; n++; }
  });
  redrawEdit();
  say(n ? n+"개 칸을 같은 열로 맞췄습니다." : "같은 열에 있는 칸이 없습니다.");
});

/* 글자 */
function renderTextList(){
  $("textList").innerHTML = L().texts.map(function(t,i){
    return '<button class="txtrow" data-i="'+i+'" aria-pressed="'+(i===selText)+'">'+
      '<span class="nm">'+(t.content||"(빈 글자)")+'</span></button>';
  }).join("") || '<p class="note">글자가 없습니다.</p>';
}
$("textList").addEventListener("click", function(e){
  var b=e.target.closest(".txtrow"); if(!b) return;
  selText=Number(b.dataset.i); renderTextList(); renderTextFields(); renderEditor();
});
function renderTextFields(){
  var t=L().texts[selText], on=!!t;
  ["textContent","textX","textY","textSize","textFont","textAlign","textColor"].forEach(function(id){ $(id).disabled=!on; });
  if (!on) return;
  $("textContent").value=t.content; $("textX").value=t.x; $("textY").value=t.y;
  $("textSize").value=t.size; $("textFont").value=t.font;
  $("textAlign").value=t.align; $("textColor").value=t.color;
}
["textContent","textX","textY","textSize","textFont","textAlign","textColor"].forEach(function(id){
  $(id).addEventListener("change", function(){
    var t=L().texts[selText]; if(!t) return;
    t.content=$("textContent").value;
    t.x=Math.round(Number($("textX").value)||0);
    t.y=Math.round(Number($("textY").value)||0);
    t.size=Math.max(6,Math.round(Number($("textSize").value)||20));
    t.font=$("textFont").value; t.align=$("textAlign").value; t.color=$("textColor").value;
    renderTextList(); renderEditor(); saveConfig();
  });
});
$("textAdd").addEventListener("click", function(){
  var l=L();
  l.texts.push({content:"{brand}", x:Math.round(l.canvas.w/2), y:Math.round(l.canvas.h*0.9),
                size:40, font:"display", align:"center", color:"#111111"});
  selText=l.texts.length-1; renderTextList(); renderTextFields(); renderEditor(); saveConfig();
});
$("textDel").addEventListener("click", function(){
  if (selText<0) return;
  L().texts.splice(selText,1); selText=Math.min(selText, L().texts.length-1);
  renderTextList(); renderTextFields(); renderEditor(); saveConfig();
});
/* 글자 정렬. Y 는 글자 밑줄(기준선)이라 세로 가운데는 글자 크기만큼 내려 잡습니다 */
function alignText(how){
  var l=L(), t=l.texts[selText];
  if (!t){ say("먼저 글자를 고르세요."); return; }
  if (how==="cx"){ t.align="center"; t.x=Math.round(l.canvas.w/2); }
  else if (how==="cy"){ t.y=Math.round(l.canvas.h/2 + t.size*0.35); }
  else if (how==="slot"){
    var s=l.slots[selSlot];
    if (!s){ say("기준이 될 칸을 먼저 고르세요."); return; }
    t.align="center"; t.x=Math.round(s.x+s.w/2);
  } else if (how==="same"){
    var n=0;
    l.texts.forEach(function(o,i){ if (i!==selText){ o.x=t.x; o.align=t.align; n++; } });
    if (!n){ say("맞출 다른 글자가 없습니다."); return; }
    say(n+"개 글자를 선택 글자와 같은 세로줄에 맞췄습니다.");
  }
  redrawEdit();
}
[["textAlCX","cx"],["textAlCY","cy"],["textAlSlot","slot"],["textAlSame","same"]]
  .forEach(function(pair){
    $(pair[0]).addEventListener("click", function(){ alignText(pair[1]); });
  });

/* ── 편집 캔버스 ──────────────────────── */
var EDIT_MAX = 460;
function editScale(){
  var l=L();
  var box=$("editor").parentElement.clientWidth - 32;
  var maxW=Math.min(box>120?box:EDIT_MAX, EDIT_MAX);
  var maxH=Math.min(window.innerHeight*0.56, 620);
  return Math.min(maxW/l.canvas.w, maxH/l.canvas.h);
}
function renderEditor(){
  var l=L(), k=editScale();
  var ed=$("editor");
  ed.style.width = (l.canvas.w*k)+"px";
  ed.style.height= (l.canvas.h*k)+"px";

  var html="";
  html += '<div class="layer" id="bgLayer"></div>';
  l.slots.forEach(function(s,i){
    html += '<div class="slot'+(i===selSlot?" sel":"")+'" data-i="'+i+'" style="'+
      'left:'+(s.x*k)+'px;top:'+(s.y*k)+'px;width:'+(s.w*k)+'px;height:'+(s.h*k)+'px">'+
      '<span>'+(s.shot+1)+'</span>'+(i===selSlot?'<div class="hd" data-h="1"></div>':'')+'</div>';
  });
  if (l.cut && l.cut.on){
    html += '<div style="position:absolute;left:'+(l.cut.x*k)+'px;top:0;bottom:0;width:0;'+
            'border-left:1px dashed '+l.cut.color+';pointer-events:none"></div>';
  }
  l.texts.forEach(function(t,i){
    var left = t.x*k, align=t.align;
    var tx = align==="center" ? "-50%" : (align==="right" ? "-100%" : "0%");
    html += '<div class="txt'+(i===selText?" sel":"")+'" data-t="'+i+'" style="'+
      'left:'+left+'px;top:'+(t.y*k)+'px;transform:translate('+tx+',-100%);'+
      'font-size:'+Math.max(7,t.size*k)+'px;color:'+t.color+';'+
      'font-family:'+(t.font==="display"?"var(--display)":"var(--body)")+'">'+
      escapeHtml(resolveText(t.content))+'</div>';
  });
  html += '<div class="layer frameLayer" id="frLayer"></div>';
  // 자석이 걸린 자리를 노란 선으로 보여줍니다
  snapGuides.forEach(function(g){
    html += '<div class="guide" style="'+(g.d==="v"
      ? 'left:'+Math.round(g.at*k)+'px;top:0;width:1px;height:100%'
      : 'top:'+Math.round(g.at*k)+'px;left:0;height:1px;width:100%')+'"></div>';
  });
  ed.innerHTML=html;

  getImage(bgKeyFor(l)).then(function(b){
    var el=$("bgLayer"); if (el) el.style.backgroundImage = b ? 'url('+b.url+')' : "none";
  });
  getImage(l.frame).then(function(f){
    var el=$("frLayer"); if (el) el.style.backgroundImage = f ? 'url('+f.url+')' : "none";
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];
  });
}

/* ── 자석 맞추기 ──────────────────────────
   끌 때 다른 칸·글자의 선과 인화지 가운데에 달라붙게 합니다.
   SNAP_TOL 은 화면 픽셀이라 편집 배율로 나눠 인화지 픽셀로 바꿉니다. */
var SNAP_TOL = 7;
var snapGuides = [];
function snapOn(){ var c=$("snapOn"); return !c || c.checked; }
/* 달라붙을 세로선 자리들 — 인화지 양끝·가운데, 다른 칸의 왼쪽·가운데·오른쪽, 글자, 절취선 */
function vLines(skipSlot, skipText){
  var l=L(), out=[0, Math.round(l.canvas.w/2), l.canvas.w];
  l.slots.forEach(function(s,i){ if (i===skipSlot) return; out.push(s.x, s.x+s.w/2, s.x+s.w); });
  l.texts.forEach(function(t,i){ if (i===skipText) return; out.push(t.x); });
  if (l.cut && l.cut.on) out.push(l.cut.x);
  return out;
}
function hLines(skipSlot, skipText){
  var l=L(), out=[0, Math.round(l.canvas.h/2), l.canvas.h];
  l.slots.forEach(function(s,i){ if (i===skipSlot) return; out.push(s.y, s.y+s.h/2, s.y+s.h); });
  l.texts.forEach(function(t,i){ if (i===skipText) return; out.push(t.y); });
  return out;
}
/* 다른 칸들의 가로(또는 세로) 길이 — 크기를 바꿀 때 같은 크기로 달라붙게 씁니다 */
function otherSizes(which, skipSlot){
  var out=[];
  L().slots.forEach(function(s,i){ if (i!==skipSlot) out.push(which==="w" ? s.w : s.h); });
  return out;
}
/* 끌고 있는 기준점들 가운데 가장 가까운 선을 찾습니다. 없으면 null */
function nearestLine(anchors, lines, tol){
  var best=null, i, j, d;
  for (i=0;i<anchors.length;i++){
    for (j=0;j<lines.length;j++){
      d = lines[j]-anchors[i];
      if (Math.abs(d)<=tol && (!best || Math.abs(d)<Math.abs(best.d))) best={d:d, at:lines[j]};
    }
  }
  return best;
}

/* 드래그: 칸 이동·크기, 글자 이동 */
(function(){
  var drag=null;
  $("editor").addEventListener("pointerdown", function(e){
    var handle=e.target.closest(".hd");
    var slot=e.target.closest(".slot");
    var text=e.target.closest(".txt");
    var k=editScale();
    if (handle && slot){
      selSlot=Number(slot.dataset.i);
      var s=L().slots[selSlot];
      drag={type:"size", k:k, sx:e.clientX, sy:e.clientY, w0:s.w, h0:s.h};
    } else if (slot){
      selSlot=Number(slot.dataset.i);
      var s2=L().slots[selSlot];
      drag={type:"move", k:k, sx:e.clientX, sy:e.clientY, x0:s2.x, y0:s2.y};
      renderSlotFields(); renderEditor();
    } else if (text){
      selText=Number(text.dataset.t);
      var t=L().texts[selText];
      drag={type:"text", k:k, sx:e.clientX, sy:e.clientY, x0:t.x, y0:t.y};
      renderTextList(); renderTextFields(); renderEditor();
    } else return;
    if (drag.type!=="size"){ renderSlotFields(); }
    $("editor").setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  $("editor").addEventListener("pointermove", function(e){
    if (!drag) return;
    var dx=(e.clientX-drag.sx)/drag.k, dy=(e.clientY-drag.sy)/drag.k;
    // 손가락이 2px 넘게 움직였을 때만 자석을 겁니다. 그냥 눌러서 고르기만 할 때는
    // 칸이 혼자 움직이지 않습니다.
    var moved = Math.abs(e.clientX-drag.sx) + Math.abs(e.clientY-drag.sy);
    var l=L(), tol=SNAP_TOL/drag.k, on=snapOn() && moved>2, g=[], hit;
    if (drag.type==="move"){
      var s=l.slots[selSlot];
      s.x=Math.round(drag.x0+dx); s.y=Math.round(drag.y0+dy);
      if (on){
        hit=nearestLine([s.x, s.x+s.w/2, s.x+s.w], vLines(selSlot,-1), tol);
        if (hit){ s.x=Math.round(s.x+hit.d); g.push({d:"v", at:hit.at}); }
        hit=nearestLine([s.y, s.y+s.h/2, s.y+s.h], hLines(selSlot,-1), tol);
        if (hit){ s.y=Math.round(s.y+hit.d); g.push({d:"h", at:hit.at}); }
      }
    } else if (drag.type==="size"){
      var s2=l.slots[selSlot];
      s2.w=Math.max(20,Math.round(drag.w0+dx)); s2.h=Math.max(20,Math.round(drag.h0+dy));
      if (on){
        // 오른쪽·아래 끝을 선에 맞추고, 선에 안 걸리면 다른 칸과 같은 크기로 맞춥니다
        hit=nearestLine([s2.x+s2.w], vLines(selSlot,-1), tol);
        if (hit){ s2.w=Math.max(20,Math.round(s2.w+hit.d)); g.push({d:"v", at:hit.at}); }
        else {
          hit=nearestLine([s2.w], otherSizes("w",selSlot), tol);
          if (hit) s2.w=Math.max(20,Math.round(s2.w+hit.d));
        }
        hit=nearestLine([s2.y+s2.h], hLines(selSlot,-1), tol);
        if (hit){ s2.h=Math.max(20,Math.round(s2.h+hit.d)); g.push({d:"h", at:hit.at}); }
        else {
          hit=nearestLine([s2.h], otherSizes("h",selSlot), tol);
          if (hit) s2.h=Math.max(20,Math.round(s2.h+hit.d));
        }
      }
    } else {
      var t=l.texts[selText];
      t.x=Math.round(drag.x0+dx); t.y=Math.round(drag.y0+dy);
      if (on){
        hit=nearestLine([t.x], vLines(-1,selText), tol);
        if (hit){ t.x=Math.round(hit.at); g.push({d:"v", at:hit.at}); }
        hit=nearestLine([t.y], hLines(-1,selText), tol);
        if (hit){ t.y=Math.round(hit.at); g.push({d:"h", at:hit.at}); }
      }
    }
    snapGuides=g;
    renderEditor();
  });
  function end(){
    if (!drag) return;
    drag=null;
    if (snapGuides.length){ snapGuides=[]; }
    renderSlotFields(); renderTextFields(); renderEditor(); saveConfig();
  }
  $("editor").addEventListener("pointerup", end);
  $("editor").addEventListener("pointercancel", end);
})();

window.addEventListener("resize", function(){
  if (!adminEl.hidden){ renderEditor(); paintAdminLook(); }
  if (!shootEl.hidden) applyPreviewFilter();
});

/* 미리보기 — 더미 사진으로 실제 합성 결과를 봅니다 */
$("admPreview").addEventListener("click", function(){
  var l=L(), n=shotCount(l), shots=[];
  for (var i=0;i<n;i++){
    var c=document.createElement("canvas"); c.width=900; c.height=900;
    var x=c.getContext("2d");
    var tone=[ "#2A4060", "#4E586E", "#786060", "#96765F", "#5F7866", "#6B5F78" ][i%6];
    x.fillStyle=tone; x.fillRect(0,0,900,900);
    x.fillStyle="rgba(255,255,255,.85)"; x.textAlign="center"; x.textBaseline="middle";
    x.font="140px Anton, sans-serif"; x.fillText(String(i+1),450,450);
    shots.push(c);
  }
  renderPrint(l, shots).then(function(blob){
    setResult(blob); freeCanvases(shots);
    setPrintPage(l); show(resultEl);
    say("미리보기입니다. 다시 찍기를 누르면 손님 화면으로 돌아갑니다.",5000);
  });
});

/* 내보내기 / 가져오기 — 이미지까지 한 파일에 담습니다 */
$("admExport").addEventListener("click", function(){
  var out=JSON.parse(JSON.stringify(CFG));
  var jobs=[];
  function embed(key, target, field){
    if (!key) return;
    jobs.push(kvGet(key).then(function(blob){
      if (!blob) return;
      return new Promise(function(res){
        var fr=new FileReader();
        fr.onload=function(){ target[field]=fr.result; res(); };
        fr.onerror=function(){ res(); };
        fr.readAsDataURL(blob);
      });
    }));
  }
  CFG.layouts.forEach(function(l,i){ embed(l.frame, out.layouts[i], "frameData"); });
  (CFG.backgrounds||[]).forEach(function(e,i){
    embed(e.h, out.backgrounds[i], "hData");
    embed(e.v, out.backgrounds[i], "vData");
  });
  Promise.all(jobs).then(function(){
    var blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
    var file=new File([blob],"booth-settings.json",{type:"application/json"});
    if (navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file]}).catch(function(){});
    } else {
      var a=document.createElement("a");
      a.href=URL.createObjectURL(blob); a.download="booth-settings.json"; a.click();
    }
  });
});
$("admImport").addEventListener("change", function(){
  var f=this.files && this.files[0]; if(!f) return;
  var input=this;
  f.text().then(function(txt){
    var data=JSON.parse(txt);
    if (!data || !Array.isArray(data.layouts)) throw new Error("형식이 다릅니다");
    ask("지금 설정을 지우고 이 파일 내용으로 바꿀까요?", function(){
      var jobs=[];
      function restore(obj, field, dest){
        var d=obj[field];
        delete obj[field];
        obj[dest]=null;
        if (!d) return;
        jobs.push(fetch(d).then(function(r){ return r.blob(); })
          .then(putImage).then(function(key){ obj[dest]=key; }).catch(function(){}));
      }
      data.layouts.forEach(function(l){
        delete l.bgData; delete l.bg;        // 옛 파일에 있던 레이아웃별 배경
        restore(l, "frameData", "frame");
      });
      if (!Array.isArray(data.backgrounds)) data.backgrounds=[];
      data.backgrounds.forEach(function(e){
        restore(e, "hData", "h");
        restore(e, "vData", "v");
      });
      Promise.all(jobs).then(function(){
        CFG=data; if (!CFG.brand) CFG.brand="STUDIO 042";
        admIdx=0; selSlot=0; selText=0;
        return saveConfig();
      }).then(function(){
        $("brandEdit").value=CFG.brand;
        buildChips($("filters"),shownFilters(),CFG.filter,false);
        buildChips($("timers"),TIMERS,CFG.timer,true);
        buildModes(); buildBgPick(); renderAdmin(); say("설정을 가져왔습니다.");
      });
    });
  }).catch(function(){ say("읽을 수 없는 설정 파일입니다."); })
    .then(function(){ input.value=""; });
});

$("admReset").addEventListener("click", function(){
  ask("모든 인화 설정과 올린 이미지를 지우고 기본값으로 되돌릴까요?", function(){
    var keys=[];
    CFG.layouts.forEach(function(l){ if(l.frame) keys.push(l.frame); });
    (CFG.backgrounds||[]).forEach(function(e){ if(e.h) keys.push(e.h); if(e.v) keys.push(e.v); });
    Promise.all(keys.map(kvDel)).then(function(){
      imgCache={}; CFG=defaultConfig(); admIdx=0; selSlot=0; selText=0;
      return saveConfig();
    }).then(function(){
      $("brandEdit").value=CFG.brand;
      buildChips($("filters"),shownFilters(),CFG.filter,false);
      buildChips($("timers"),TIMERS,CFG.timer,true);
      buildModes(); buildBgPick(); renderAdmin(); say("기본 설정으로 되돌렸습니다.");
    });
  });
});

/* ── 시작 ─────────────────────────────── */
document.addEventListener("gesturestart", function(e){ e.preventDefault(); });

kvGet("config").then(function(saved){
  if (saved && Array.isArray(saved.layouts) && saved.layouts.length){
    CFG = migrate(saved);
    saveConfig();
  }
}).catch(function(){}).then(function(){
  CFG.filters = allFilters();
  if (!filterById(CFG.filter) || shownFilters().map(function(f){return f.id;}).indexOf(CFG.filter)<0)
    CFG.filter = shownFilters()[0].id;
  $("brandEdit").value = CFG.brand;
  buildSliders();
  buildChips($("filters"), shownFilters(), CFG.filter, false);
  buildChips($("timers"), TIMERS, CFG.timer, true);
  buildModes();
  buildBgPick();
  var L0 = enabledLayouts()[0];
  if (L0) setPrintPage(L0);
});

if ("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
  });
}
})();
