// 작은 도형 도우미: 좌표 변환과 반평면 자르기
export function makeFrame(W, H, xr, yr, m = {l: 30, r: 12, t: 12, b: 26}) {
  const X = (x) => m.l + ((x - xr[0]) / (xr[1] - xr[0])) * (W - m.l - m.r);
  const Y = (y) => m.t + (1 - (y - yr[0]) / (yr[1] - yr[0])) * (H - m.t - m.b);
  const ix = (px) => xr[0] + ((px - m.l) / (W - m.l - m.r)) * (xr[1] - xr[0]);
  const iy = (py) => yr[0] + (1 - (py - m.t) / (H - m.t - m.b)) * (yr[1] - yr[0]);
  return {X, Y, ix, iy};
}

// 다각형 poly(점 배열)에서 a*x + b*y + c > 0 인 쪽만 남긴다.
export function clipHalfPlane(poly, a, b, c) {
  const out = [];
  const f = (p) => a * p[0] + b * p[1] + c;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = f(p);
    const fq = f(q);
    if (fp > 0) out.push(p);
    if ((fp > 0 && fq < 0) || (fp < 0 && fq > 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

// 직선 a*x + b*y + c = 0 을 사각형 [x0,x1]x[y0,y1] 안에서 자른 두 끝점(없으면 null)
export function clipLine(a, b, c, x0, x1, y0, y1) {
  const pts = [];
  if (Math.abs(b) > 1e-9) {
    [x0, x1].forEach((x) => {
      const y = -(a * x + c) / b;
      if (y >= y0 - 1e-9 && y <= y1 + 1e-9) pts.push([x, y]);
    });
  }
  if (Math.abs(a) > 1e-9) {
    [y0, y1].forEach((y) => {
      const x = -(b * y + c) / a;
      if (x >= x0 - 1e-9 && x <= x1 + 1e-9) pts.push([x, y]);
    });
  }
  return pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : null;
}

export const num = (x, n = 2) => {
  const v = Math.round(x * 10 ** n) / 10 ** n;
  return String(Object.is(v, -0) ? 0 : v.toFixed(n)).replace('-', '−');
};
