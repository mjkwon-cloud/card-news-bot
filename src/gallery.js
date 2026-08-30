// 렌더링된 카드뉴스 5장 + 캡션을 하나의 HTML 페이지로 묶는다.
// 이미지를 base64로 직접 박아넣어서 외부 호스팅 없이 링크 하나로 전체를 볼 수 있게 한다.
// (Slack 메시지의 이미지 URL 자동 미리보기가 안 되고, Slack Canvas의 외부 이미지 임베드도
// 링크로 다운그레이드되는 걸 확인해서 — 그래서 이 방식으로 대체했다.)
import fs from "node:fs";
import path from "node:path";

const SLIDE_FILES = ["slide-1-cover.png", "slide-2-need.png", "slide-3-info.png", "slide-4-trust.png", "slide-5-cta.png"];
const ROLE_LABELS = { cover: "표지", need: "공감", info: "정보", trust: "신뢰", cta: "CTA" };

function dataUri(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export function buildGalleryHtml({ copy, dayDir, dateLabel, themeLabel, titleDate }) {
  const slidesHtml = copy.slides.map((slide, i) => {
    const uri = dataUri(path.join(dayDir, SLIDE_FILES[i]));
    return `
      <figure class="slide">
        <img src="${uri}" alt="${slide.headline}" loading="lazy">
        <figcaption><span class="slide-num">0${i + 1}</span><span class="slide-role">${ROLE_LABELS[slide.role] ?? slide.role}</span></figcaption>
      </figure>`;
  }).join("\n");

  const hashtags = (copy.hashtags ?? []).map((h) => `<span class="tag">${h}</span>`).join("");

  return `<title>광양본가 카드뉴스 ${titleDate ?? ""}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Forum&family=Inter:wght@300;400;500&display=swap">
<style>
  :root{
    --bg:#0A0B0A;
    --surface:#151515;
    --surface-2:#1B1B1B;
    --cream:#EFE7D2;
    --cream-muted:rgba(239,231,210,0.66);
    --line:rgba(239,231,210,0.14);
    --accent:#C9A24B;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    background:var(--bg);
    color:var(--cream);
    font-family:'Inter', -apple-system, sans-serif;
    font-weight:300;
    min-height:100vh;
  }
  .wrap{ max-width:640px; margin:0 auto; padding:56px 24px 96px; }

  header{ margin-bottom:44px; }
  .eyebrow{
    font-family:'Forum', Georgia, serif;
    letter-spacing:2px; text-transform:uppercase;
    font-size:14px; color:var(--accent); margin-bottom:10px;
  }
  h1{
    font-family:'Forum', Georgia, serif;
    font-weight:400; text-transform:uppercase; letter-spacing:0.5px;
    font-size:clamp(28px,6vw,40px); margin:0 0 8px; text-wrap:balance;
  }
  .meta{ color:var(--cream-muted); font-size:14px; }

  .slides{ display:flex; flex-direction:column; gap:28px; }
  .slide{ margin:0; }
  .slide img{
    width:100%; display:block; border-radius:12px;
    box-shadow:inset 0 0 0 1px var(--line);
  }
  .slide figcaption{
    display:flex; align-items:center; gap:10px;
    margin-top:10px; font-size:12px; letter-spacing:1px; text-transform:uppercase;
    color:var(--cream-muted);
  }
  .slide-num{ font-family:'Forum', serif; color:var(--accent); }

  .caption-card{
    margin-top:52px;
    background:var(--surface);
    border-radius:12px;
    box-shadow:inset 0 0 0 1px var(--line);
    padding:24px;
  }
  .caption-card .eyebrow{ margin-bottom:14px; }
  .caption-text{
    font-size:16px; line-height:1.7; color:var(--cream);
    white-space:pre-wrap;
    -webkit-user-select:all; user-select:all;
    padding:14px 16px;
    background:var(--surface-2);
    border-radius:8px;
    margin:0 0 16px;
  }
  .tags{ display:flex; flex-wrap:wrap; gap:8px; }
  .tag{
    font-family:'Inter', sans-serif; font-size:13px;
    color:var(--cream-muted);
    padding:5px 12px; border-radius:999px;
    box-shadow:inset 0 0 0 1px var(--line);
  }
  .hint{ margin-top:14px; font-size:12.5px; color:var(--cream-muted); }
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">광양본가 · 인스타그램 카드뉴스</div>
    <h1>${dateLabel}</h1>
    <div class="meta">${themeLabel}</div>
  </header>

  <div class="slides">${slidesHtml}
  </div>

  <div class="caption-card">
    <div class="eyebrow">게시글 캡션</div>
    <p class="caption-text">${copy.caption ?? ""}</p>
    <div class="tags">${hashtags}</div>
    <div class="hint">캡션 텍스트를 탭하면 전체 선택됩니다 — 복사해서 인스타그램에 붙여넣으세요.</div>
  </div>
</div>
`;
}
