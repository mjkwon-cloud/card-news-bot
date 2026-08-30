# card-news-bot

광양본가(강남 역삼 한우 전문점) 인스타그램 카드뉴스를 매일 자동 생성하는 스크립트. `카드뉴스 파이프라인` 개발문서(아티팩트)의 03절·04절을 코드로 옮긴 것에서 출발했다.

인스타그램 Graph API 연동(Meta 앱 심사)은 하지 않는다 — **매일 이미지+캡션을 생성해 이 저장소에 커밋하면, 사람이 직접 인스타그램에 업로드**하는 반자동 구조다.

## 무엇을 하는가

1. 오늘 요일에 맞는 주제(`src/calendar.js`, 일요일 포함 매일)와 참고 스타일(10개 실제 한우/소고기 전문점 계정 로테이션)을 정한다.
2. Gemini(OpenAI 호환 엔드포인트)로 캐러셀 5슬라이드 카피(표지/공감/정보/신뢰/CTA) + 캡션 + 해시태그를 생성한다.
3. 광양본가 실사진(`assets/photos/`, 공개 리뷰 플랫폼에서 확보) 위에 카피를 얹어 1080×1350 PNG 5장을 렌더링한다.
4. 5장 + 캡션을 이미지가 박힌 HTML 갤러리 페이지(`out/YYYY-MM-DD/gallery.html`) 한 장으로 묶는다.
5. 결과를 `out/YYYY-MM-DD/`에 커밋/push하고, 갤러리 페이지를 Artifact로 발행해 그 링크를 Slack(본인 DM)으로 보낸다.

매일 밤 23:00(KST)에 Claude 스케줄 루틴(cron)이 이 전체 과정을 자동 실행한다 — GitHub Actions가 아니라 `/schedule`로 만든 클라우드 루틴이 실제 동작 주체다 (아래 "자동 실행" 참고).

## 디자인

Claude Design 프로젝트 **"Qitchen Design System"**(다크-럭스 레스토랑 브랜드 시스템 — 원본은 가상의 스시 레스토랑)의 컬러·타이포·이펙트 토큰을 이식했다. 근/완전 검정 배경(`#0A0B0A`) + 크림색 텍스트(`#EFE7D2`) + Forum(디스플레이 세리프, 대문자) + Satoshi(라이트 바디)의 조합이다. 콘텐츠(한글 카피·광양본가 실사진)는 원본 프로젝트와 무관하게 전부 새로 만든 것 — 토큰/톤만 가져왔다.

## 로컬 사용법

```bash
npm install
npx puppeteer browsers install chrome   # 최초 1회
npm run generate   # 오늘 주제로 카피 생성 → out/YYYY-MM-DD.json
npm run render      # 그 카피로 이미지 5장 렌더링 → out/YYYY-MM-DD/
npm run run         # generate + render 한 번에
```

일요일에도 콘텐츠는 생성된다(정기휴무 안내 · 다음 주 예고 테마).

`samples/monday-demo/`에 실제 생성 결과 예시가 있다.

## 자동 실행 (Claude 스케줄 루틴)

`/schedule`로 만든 클라우드 루틴 2개가 이 저장소를 체크아웃해서 매일 실행한다:

- **매일 23:00 KST** — `npm run run` → `out/<날짜>/` 커밋·push → `gallery.html`을 Artifact로 발행 → 그 링크 + 캡션 미리보기를 Slack(본인 DM)으로 전송
- 루틴은 claude.ai 계정에 연결된 것이라 GitHub Actions와 별개다. `.github/workflows/daily-card-news.yml`도 저장소에 있지만, 이 GitHub 계정에서 Actions가 아직 활성화되지 않아 현재는 쓰이지 않는 이중 안전장치일 뿐이다.
- 루틴 프롬프트에 Gemini API 키가 그대로 들어있다 — 클라우드 루틴에는 GitHub Actions secrets 같은 별도 저장소가 없어서다. 결제 수단이 아닌 개인 키라 감수한 절충.
- 루틴 관리: https://claude.ai/code/routines

## 환경변수 (`.env`, 로컬 전용 — 커밋되지 않음)

| 변수 | 용도 |
|---|---|
| `CARD_NEWS_LLM_API_KEY` | Gemini API 키 (OpenAI 호환 엔드포인트로 재사용) |
| `CARD_NEWS_LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `CARD_NEWS_LLM_MODEL` | `gemini-3.6-flash` |

GitHub Actions에서는 이 값들을 리포지토리 **Secrets**로 등록해서 쓴다 (`.github/workflows/daily-card-news.yml` 참고).

## 참고 스타일 로테이션

`src/calendar.js`의 `REFERENCE_STYLES`에 실제 한우/소고기 전문점 인스타그램 계정 10곳(본앤브레드, 삼원가든, 고깃집열 강남본점, 뽀 먹스타그램, 맛집정보특공대, 한우물, 모도우 삼성점, 역삼동 서원정육식당, 우마담, 소와나)의 톤/구성 방식을 요약해뒀고, 날짜별로 매일 다른 곳을 참고하도록 로테이션한다. **문구를 베끼지 않고 톤(예: "표지 후킹 카피 2줄", "예약 CTA를 강하게")만 참고**하도록 프롬프트에 명시했다.

> Gemini의 Google Search 그라운딩 기능은 무료 티어 키에서 429(quota exceeded)로 막혀 있어 LLM 호출 안에서 실시간 검색은 못 쓴다. 대신 **매일 실행되는 Claude 스케줄 루틴 자신이 WebSearch로 그날 직접 조사**해서, 그 결과를 `CARD_NEWS_STYLE_OVERRIDE` 환경변수로 넘긴다 — `cmdGenerate`가 이 값이 있으면 고정 로테이션 대신 그걸 톤 참고로 쓴다(`src/index.js`). 로컬에서 이 변수 없이 실행하면 `REFERENCE_STYLES` 고정 로테이션으로 자동 폴백한다.

## 아직 안 되는 것 / 한계

- **사진 저작권**: `assets/photos/`의 사진은 다이닝코드 등 공개 리뷰 플랫폼에 올라온 리뷰어 사진이다. 광양본가 본인이 찍은 사진이 아니라서 장기 운영 시 매장이 직접 찍은 사진으로 교체하는 게 가장 안전하다.
- **인스타그램 게시**: `src/instagram.js` + `npm run post`는 Meta 앱 심사를 통과했을 때를 위해 남겨둔 코드다. 현재 워크플로에서는 쓰지 않는다.
- **Slack 이미지 전송**: Slack 메시지의 이미지 URL 자동 미리보기, Slack Canvas의 외부 이미지 임베드(`![]()`) 둘 다 동작하지 않는 것을 확인했다(Canvas는 `!`를 조용히 지워서 일반 링크로 바꿔버린다). 그래서 이미지를 base64로 페이지에 직접 박아넣은 Artifact 링크 하나를 보내는 방식으로 우회했다.
