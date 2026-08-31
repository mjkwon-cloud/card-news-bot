// 카피 JSON(5슬라이드)을 1080x1350 PNG 카드뉴스 이미지로 렌더링한다.
// 디자인 언어는 Claude Design 프로젝트 "Qitchen Design System"(다크-럭스 레스토랑 브랜드 시스템)
// 의 컬러/타이포/이펙트 토큰을 그대로 이식한 것 — 원본은 가상의 스시 레스토랑이라
// 광양본가의 실제 콘텐츠(한글 카피·실사진)는 전혀 섞지 않고 톤/토큰만 가져왔다.
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { photosForWeekday, CTA_PHOTO } from "./photos.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.resolve(__dirname, "../assets/photos");

// --- Qitchen Design System 토큰 (tokens/colors.css, typography.css, effects.css) ---
const COLORS = {
  black: "#0A0B0A",
  cream: "#EFE7D2",
  creamMuted: "rgba(239,231,210,0.7)",
  hairline: "rgba(239,231,210,0.15)",
};

const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Forum&display=swap">' +
  '<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap">';

// SVG feTurbulence 그레인 — 원본 grain.png(6~8% 오파시티 노이즈)을 대체하는 CSS 근사치.
const GRAIN_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  );

const BASE_STYLE = `
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:1080px;height:1350px;overflow:hidden;}
  body{
    font-family:'Satoshi', sans-serif;
    font-weight:300;
    position:relative;
    background:${COLORS.black};
    color:${COLORS.cream};
  }
  .content{
    position:relative;
    z-index:2;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    padding:96px 88px;
  }
  .bg-photo{
    position:absolute; inset:0;
    width:100%; height:100%;
    object-fit:cover;
    z-index:0;
  }
  .bg-overlay{
    position:absolute; inset:0;
    z-index:1;
    background:linear-gradient(180deg, rgba(10,11,10,0.15) 0%, rgba(10,11,10,0.62) 55%, rgba(10,11,10,0.96) 100%);
  }
  .grain{
    position:absolute; inset:0; z-index:3;
    background-image:url("${GRAIN_DATA_URI}");
    opacity:0.07;
    mix-blend-mode:overlay;
    pointer-events:none;
  }
  h1,h2{
    font-family:'Forum', Georgia, serif;
    font-weight:400;
    line-height:1.18;
    text-transform:uppercase;
    letter-spacing:0.5px;
    text-wrap:balance;
    color:${COLORS.cream};
  }
  .eyebrow-row{
    display:flex; align-items:center; gap:14px;
    margin-bottom:26px;
  }
  .eyebrow-diamond{
    width:8px; height:8px; flex:none;
    box-shadow:inset 0 0 0 1px ${COLORS.hairline};
    background:rgba(239,231,210,0.06);
    transform:rotate(45deg);
  }
  .eyebrow-line{ width:28px; height:1px; background:${COLORS.hairline}; flex:none; }
  .eyebrow{
    font-family:'Forum', Georgia, serif;
    font-weight:400;
    letter-spacing:2px;
    text-transform:uppercase;
    font-size:24px;
    color:${COLORS.cream};
    white-space:nowrap;
  }
  .brand-mark{
    position:absolute; top:64px; left:88px; z-index:2;
    font-family:'Forum', Georgia, serif;
    font-weight:400; font-size:26px; letter-spacing:2px;
    text-transform:uppercase;
    color:${COLORS.cream};
  }
  .page-num{
    position:absolute; bottom:56px; right:88px; z-index:2;
    font-family:'Satoshi', sans-serif; font-weight:300;
    font-size:22px; color:${COLORS.creamMuted};
  }
  .muted{ color:${COLORS.creamMuted}; font-weight:300; }
`;

function imageDataUri(filename) {
  if (!filename) return null;
  const filePath = path.join(PHOTO_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

function eyebrow(text) {
  return `<div class="eyebrow-row"><div class="eyebrow-diamond"></div><div class="eyebrow-line"></div><span class="eyebrow">${text}</span></div>`;
}

function shell({ body, photoDataUri }) {
  const bgLayer = photoDataUri
    ? `<img class="bg-photo" src="${photoDataUri}"><div class="bg-overlay"></div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${BASE_STYLE}</style></head><body>
    ${bgLayer}
    <div class="grain"></div>
    <div class="brand-mark">광양본가</div>
    <div class="content">${body}</div>
  </body></html>`;
}

function renderCover(slide, n, photoDataUri) {
  return shell({
    photoDataUri,
    body: `
      <h1 style="font-size:80px;">${slide.headline}</h1>
      <p class="muted" style="font-size:30px;margin-top:28px;max-width:820px;">${slide.subtext ?? ""}</p>
    `,
  });
}

function renderNeed(slide, n) {
  return shell({
    body: `
      ${eyebrow("공감")}
      <h2 style="font-size:60px;">${slide.headline}</h2>
      <div class="page-num">${n}/5</div>
    `,
  });
}

function renderInfo(slide, n) {
  return shell({
    body: `
      ${eyebrow("오늘의 정보")}
      <h2 style="font-size:54px;">${slide.headline}</h2>
      <p class="muted" style="font-size:32px;margin-top:26px;max-width:840px;">${slide.body ?? ""}</p>
      <div class="page-num">${n}/5</div>
    `,
  });
}

function renderTrust(slide, n, photoDataUri) {
  return shell({
    photoDataUri,
    body: `
      ${eyebrow("손님 이야기")}
      <h2 style="font-size:50px;">${slide.headline}</h2>
      <p class="muted" style="font-size:30px;margin-top:26px;max-width:840px;">${slide.body ?? ""}</p>
      <div class="page-num">${n}/5</div>
    `,
  });
}

function renderCta(slide, n, photoDataUri) {
  return shell({
    photoDataUri,
    body: `
      ${eyebrow("오시는 길")}
      <h2 style="font-size:52px;">${slide.headline}</h2>
      <p class="muted" style="font-size:32px;margin-top:28px;line-height:1.7;max-width:840px;">${(slide.body ?? "").replace(/\n/g, "<br>")}</p>
      <div class="page-num">${n}/5</div>
    `,
  });
}

const RENDERERS = {
  cover: renderCover,
  need: renderNeed,
  info: renderInfo,
  trust: renderTrust,
  cta: renderCta,
};

export async function renderCardNewsImages(copy, outDir, { weekday } = {}) {
  const photoSet = weekday != null ? photosForWeekday(weekday) : null;
  const photoFor = {
    cover: imageDataUri(photoSet?.cover),
    trust: imageDataUri(photoSet?.trust),
    cta: imageDataUri(CTA_PHOTO),
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const paths = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

    for (let i = 0; i < copy.slides.length; i++) {
      const slide = copy.slides[i];
      const renderer = RENDERERS[slide.role];
      if (!renderer) throw new Error(`알 수 없는 슬라이드 role: ${slide.role}`);

      const html = renderer(slide, i + 1, photoFor[slide.role]);
      await page.setContent(html, { waitUntil: "networkidle0" });

      const outPath = `${outDir}/slide-${i + 1}-${slide.role}.png`;
      await page.screenshot({ path: outPath, type: "png" });
      paths.push(outPath);
    }
  } finally {
    await browser.close();
  }
  return paths;
}
