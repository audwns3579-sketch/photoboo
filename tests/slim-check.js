/* 얼굴 줄이기(slimInto) 검사. 브라우저 없이 node 로 돌립니다.
   쓰는 법: booth 폴더에서  node tests/slim-check.js
   세기 상한(0.45)이나 계산식을 고치면 꼭 다시 돌리세요. 그림이 접히면 여기서 걸립니다. */
var fs = require("fs"), path = require("path"), assert = require("assert");
var src = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
eval(src.match(/function slimInto[\s\S]*?\n}\n/)[0]);

// 가짜 캔버스 — 빨강 값이 x 좌표인 그림. 픽셀이 어디서 왔는지 빨강으로 알 수 있습니다.
function fakeCanvas(W, H){
  var d = new Uint8ClampedArray(W*H*4);
  for (var y=0; y<H; y++) for (var x=0; x<W; x++) d[(y*W+x)*4] = x;
  var cv = { width:W, height:H, d:d };
  cv.getContext = function(){ return {
    getImageData: function(x0, y0, w, h){
      var o = new Uint8ClampedArray(w*h*4);
      for (var y=0; y<h; y++) o.set(d.subarray(((y+y0)*W+x0)*4, ((y+y0)*W+x0+w)*4), y*w*4);
      return { data:o, width:w };
    },
    putImageData: function(img, x0, y0){
      var w = img.width, h = img.data.length/4/w;
      for (var y=0; y<h; y++) d.set(img.data.subarray(y*w*4, (y+1)*w*4), ((y+y0)*W+x0)*4);
    }
  }; };
  return cv;
}
var W = 200, H = 200, plain = fakeCanvas(W, H).d.slice();

var cv = fakeCanvas(W, H);
slimInto(cv, { amount:0, x:50, y:50, size:50 });
assert.deepStrictEqual(cv.d, plain, "세기 0 이면 그림이 그대로여야 합니다");

cv = fakeCanvas(W, H);
slimInto(cv, { amount:100, x:50, y:50, size:50 });   // 가장 센 값
var R = function(x, y){ return cv.d[(y*W+x)*4]; };
assert.strictEqual(R(100,100), 100, "가운데는 움직이지 않아야 합니다");
assert.ok(R(125,100) > 125, "안쪽 점은 더 바깥 픽셀을 가져와야 얼굴이 작아집니다");
assert.strictEqual(R(10,100), 10, "타원 밖은 그대로여야 합니다");
// 대각선으로 가운데에서 타원 밖까지 걸어갑니다. 세기가 너무 세면 타원 경계 안쪽이
// 타원 밖 픽셀을 가져와서, 경계를 넘는 순간 값이 뒤로 돌아갑니다(접힘).
// (가로줄로만 보면 범위 끝에서 잘려 접힘이 가려집니다)
for (var i=1, last=R(100,100); i<45; i++){
  var x = 100+i, y = 100+Math.round(i*1.3), v = R(x,y);
  assert.ok(v >= last, "그림이 접히면 안 됩니다 (x="+x+", y="+y+")");
  last = v;
}

cv = fakeCanvas(W, H);
slimInto(cv, { amount:100, x:95, y:5, size:60 });    // 타원이 그림 밖으로 나가도 오류 없이
console.log("slimInto 검사 통과");
