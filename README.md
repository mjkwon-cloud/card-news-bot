# card-news-bot

광양본가(강남 역삼 한우 전문점) 인스타그램 카드뉴스를 매일 자동 생성하는 스크립트. `카드뉴스 파이프라인` 개발문서(아티팩트)의 03절·04절을 코드로 옮긴 것에서 출발했다.

인스타그램 Graph API 연동(Meta 앱 심사)은 하지 않는다 — **매일 이미지+캡션을 생성해 이 저장소에 커밋하면, 사람이 직접 인스타그램에 업로드**하는 반자동 구조다.

## 무엇을 하는가

1. 오늘 요일에 맞는 주제(`src/calendar.js`)와 참고 스타일(10개 실제 한우/소고기 전문점 계정 로테이션)을 정한다.
2. Gemini(OpenAI 호환 엔드포인트)로 캐러셀 5슬라이드 카피(표지/공감/정보/신뢰/CTA) + 캡션 + 해시태그를 생성한다.
3. 광양본가 실사진(`assets/photos/`, 공개 리뷰 플랫폼에서 확보) 위에 카피를 얹어 1080×1350 PNG 5장을 렌더링한다.
4. 결과를 `out/YYYY-MM-DD/`에 저장하고 GitHub에 커밋한다 (GitHub Actions가 매일 자동 실행).

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

일요일은 정기휴무일이라 아무것도 생성하지 않는다(정상 동작).

`samples/monday-demo/`에 실제 생성 결과 예시가 있다.

## 환경변수 (`.env`, 로컬 전용 — 커밋되지 않음)

| 변수 | 용도 |
|---|---|
| `CARD_NEWS_LLM_API_KEY` | Gemini API 키 (OpenAI 호환 엔드포인트로 재사용) |
| `CARD_NEWS_LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `CARD_NEWS_LLM_MODEL` | `gemini-3.6-flash` |

GitHub Actions에서는 이 값들을 리포지토리 **Secrets**로 등록해서 쓴다 (`.github/workflows/daily-card-news.yml` 참고).

## 참고 스타일 로테이션

`src/calendar.js`의 `REFERENCE_STYLES`에 실제 한우/소고기 전문점 인스타그램 계정 10곳(본앤브레드, 삼원가든, 고깃집열 강남본점, 뽀 먹스타그램, 맛집정보특공대, 한우물, 모도우 삼성점, 역삼동 서원정육식당, 우마담, 소와나)의 톤/구성 방식을 요약해뒀고, 날짜별로 매일 다른 곳을 참고하도록 로테이션한다. **문구를 베끼지 않고 톤(예: "표지 후킹 카피 2줄", "예약 CTA를 강하게")만 참고**하도록 프롬프트에 명시했다.

> 원래는 매일 실시간으로 웹 검색해 그날그날 다른 계정을 벤치마킹하는 것을 목표로 했으나, Gemini의 Google Search 그라운딩 기능은 무료 티어 키에서 429(quota exceeded)로 막혀 있어 쓸 수 없었다. 결제를 활성화하면 `src/llm.js`에 `tools:[{google_search:{}}]`를 추가해 실시간 검색으로 바꿀 수 있다.

## 아직 안 되는 것 / 한계

- **사진 저작권**: `assets/photos/`의 사진은 다이닝코드 등 공개 리뷰 플랫폼에 올라온 리뷰어 사진이다. 광양본가 본인이 찍은 사진이 아니라서 장기 운영 시 매장이 직접 찍은 사진으로 교체하는 게 가장 안전하다.
- **인스타그램 게시**: `src/instagram.js` + `npm run post`는 Meta 앱 심사를 통과했을 때를 위해 남겨둔 코드다. 현재 워크플로에서는 쓰지 않는다.
