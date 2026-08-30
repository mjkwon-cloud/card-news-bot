import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { themeForToday, styleForToday, WEEKLY_THEMES } from "./calendar.js";
import { generateCardNewsCopy } from "./llm.js";
import { renderCardNewsImages } from "./render.js";
import { buildGalleryHtml } from "./gallery.js";
import { postCarousel } from "./instagram.js";

// 로컬 개발용 — 저장소 루트의 .env를 읽는다. GitHub Actions에서는 secrets로 주입되므로 없어도 무방.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../.env") });

const OUT_DIR = path.resolve(__dirname, "../out");

function todayStr(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function cmdGenerate() {
  const today = themeForToday();
  if (!today.theme) {
    console.log("오늘은 정기 휴무일입니다 — 카드뉴스를 생성하지 않습니다.");
    return;
  }

  const style = styleForToday();
  console.log(`오늘의 주제: [${today.day}] ${today.theme}`);
  console.log(`오늘의 톤 참고: ${style.name}${style.handle ? ` (${style.handle})` : ""} — ${style.angle}`);
  const copy = await generateCardNewsCopy({ theme: today.theme, brief: today.brief, styleAngle: style.angle });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${todayStr()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(copy, null, 2), "utf-8");

  console.log(`카드뉴스 카피 생성 완료 → ${outPath}`);
  console.log(JSON.stringify(copy, null, 2));
  console.log(
    "\n다음 단계: `npm run render` 로 이미지를 만들거나, " +
    "`npm run post -- --images <url1>,<url2>,...` 로 (수동 업로드한) 이미지 URL과 함께 게시하세요."
  );
}

async function cmdRender(args) {
  const copyPathArg = args.find((a) => a.startsWith("--copy="))?.split("=")[1];
  const copyPath = copyPathArg ? path.resolve(copyPathArg) : path.join(OUT_DIR, `${todayStr()}.json`);

  if (!fs.existsSync(copyPath)) {
    throw new Error(`${copyPath} 를 찾을 수 없습니다. 먼저 \`npm run generate\` 로 카피를 생성하세요.`);
  }
  const copy = JSON.parse(fs.readFileSync(copyPath, "utf-8"));
  const dateStr = path.basename(copyPath, ".json");
  const dayDir = path.join(OUT_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  const weekday = new Date(`${dateStr}T00:00:00`).getDay();
  console.log(`이미지 ${copy.slides.length}장 렌더링 중...`);
  const paths = await renderCardNewsImages(copy, dayDir, { weekday });

  const captionPath = path.join(dayDir, "caption.txt");
  fs.writeFileSync(captionPath, `${copy.caption}\n\n${(copy.hashtags ?? []).join(" ")}`.trim(), "utf-8");

  const themeInfo = WEEKLY_THEMES[weekday];
  const galleryHtml = buildGalleryHtml({
    copy,
    dayDir,
    dateLabel: `${dateStr} (${themeInfo?.day ?? ""})`,
    themeLabel: themeInfo?.theme ?? "",
    titleDate: dateStr.slice(5).replace("-", "/"),
  });
  const galleryPath = path.join(dayDir, "gallery.html");
  fs.writeFileSync(galleryPath, galleryHtml, "utf-8");

  console.log(`렌더링 완료 → ${dayDir}`);
  for (const p of paths) console.log(`  - ${p}`);
  console.log(`  - ${captionPath}`);
  console.log(`  - ${galleryPath} (Artifact로 발행해서 Slack에 링크 공유)`);
}

async function cmdRun() {
  await cmdGenerate();
  const today = themeForToday();
  if (!today.theme) return;
  await cmdRender([]);
}

async function cmdPost(args) {
  const imagesArg = args.find((a) => a.startsWith("--images="))?.split("=")[1];
  const copyPathArg = args.find((a) => a.startsWith("--copy="))?.split("=")[1];

  if (!imagesArg) {
    throw new Error(
      "--images=<url1>,<url2>,... 형식으로 공개 접근 가능한 카드뉴스 이미지 URL을 전달하세요 (2~10장)."
    );
  }
  const imageUrls = imagesArg.split(",").map((s) => s.trim()).filter(Boolean);

  const copyPath = copyPathArg
    ? path.resolve(copyPathArg)
    : path.join(OUT_DIR, `${todayStr()}.json`);

  if (!fs.existsSync(copyPath)) {
    throw new Error(
      `${copyPath} 를 찾을 수 없습니다. 먼저 \`npm run generate\` 로 카피를 생성하세요.`
    );
  }
  const copy = JSON.parse(fs.readFileSync(copyPath, "utf-8"));
  const caption = `${copy.caption}\n\n${(copy.hashtags ?? []).join(" ")}`.trim();

  console.log(`이미지 ${imageUrls.length}장, 캡션 ${caption.length}자로 게시를 시작합니다...`);
  const { mediaId } = await postCarousel({ imageUrls, caption });
  console.log(`게시 완료 — media id: ${mediaId}`);
}

const [, , command, ...rest] = process.argv;

try {
  if (command === "generate") {
    await cmdGenerate();
  } else if (command === "render") {
    await cmdRender(rest);
  } else if (command === "run") {
    await cmdRun();
  } else if (command === "post") {
    await cmdPost(rest);
  } else {
    console.log("사용법: node src/index.js generate | render | run | post --images=<url1>,<url2>,...");
    process.exitCode = 1;
  }
} catch (err) {
  console.error(`오류: ${err.message}`);
  process.exitCode = 1;
}
