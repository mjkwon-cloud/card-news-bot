// OpenAI 호환 게이트웨이(OpenRouter 등) 앞으로 카드뉴스 문구 생성을 요청한다.
// 개발문서 03절 "카드뉴스 구조 템플릿(캐러셀 5장)"의 슬라이드 구성을 그대로 스키마로 강제한다.

const RESTAURANT_PROFILE = `
- 상호: 광양본가 (한우 전문 한식당)
- 위치: 서울 강남구 역삼동, 강남역 1번 출구 298m (국기원사거리 코너건물)
- 대표메뉴: 한우생갈비, 꽃등심, 갈비탕, 광양불고기(참숯구이)
- 영업시간: 매일 11:00-22:00 (브레이크 15:00-17:00), 매주 일요일 휴무
- 전화: 02-555-8494
- 편의: 프라이빗룸, 단체 이용 가능, 주차 가능
`.trim();

const SYSTEM_PROMPT = `너는 강남 역삼 한우 전문점 "광양본가"의 인스타그램 카드뉴스 카피라이터다.
아래 매장 정보를 벗어난 사실(가격, 메뉴, 위치 등)을 지어내지 마라.

${RESTAURANT_PROFILE}

오늘은 벤치마킹 대상 계정의 "톤/구성 방식"만 참고 각도로 삼는다.
그 계정의 실제 문구를 베끼거나 그 계정을 언급하지 말고, 광양본가만의 사실에 그 톤을 입혀라.

캐러셀 5장 구조로 카피를 작성한다:
1. cover - 후킹 카피 2줄 이내
2. need - 독자 상황 공감 한 문장
3. info - 오늘 주제에 맞는 핵심 정보 (장당 메시지 1개)
4. trust - 신뢰 요소 (리뷰 톤의 문장, 과장 금지)
5. cta - 예약 전화번호 + 위치 + 영업시간

반드시 아래 JSON 스키마로만 답하라. 다른 텍스트는 출력하지 마라:
{
  "slides": [
    {"role": "cover", "headline": "string", "subtext": "string"},
    {"role": "need", "headline": "string"},
    {"role": "info", "headline": "string", "body": "string"},
    {"role": "trust", "headline": "string", "body": "string"},
    {"role": "cta", "headline": "string", "body": "string"}
  ],
  "caption": "string (게시물 본문, 2~3문장 + 자연스러운 톤)",
  "hashtags": ["#광양본가", "string", "..."]
}`;

export async function generateCardNewsCopy({ theme, brief, styleAngle }) {
  const apiKey = process.env.CARD_NEWS_LLM_API_KEY;
  const baseUrl = process.env.CARD_NEWS_LLM_BASE_URL;
  const model = process.env.CARD_NEWS_LLM_MODEL;

  if (!apiKey || !baseUrl || !model) {
    throw new Error(
      "CARD_NEWS_LLM_API_KEY / CARD_NEWS_LLM_BASE_URL / CARD_NEWS_LLM_MODEL 환경변수를 확인하세요."
    );
  }

  const body = JSON.stringify({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `오늘의 주제: ${theme}\n참고 브리프: ${brief}\n오늘의 톤 참고 각도: ${styleAngle ?? "없음 — 기본 톤으로"}\n이 주제로 카드뉴스 카피를 작성해줘.`,
      },
    ],
  });

  const MAX_ATTEMPTS = 4;
  let lastErrText = "";
  let lastStatus = 0;
  let data;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (res.ok) {
      data = await res.json();
      break;
    }

    lastStatus = res.status;
    lastErrText = await res.text().catch(() => "");

    // 429(rate limit), 503(과부하) 등 일시적 오류만 재시도 — 401/400 같은 설정 오류는 바로 실패.
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`LLM 요청 실패 (${lastStatus}): ${lastErrText.slice(0, 300)}`);
    }
    const backoffMs = 1000 * 2 ** (attempt - 1);
    console.log(`  LLM 요청 실패 (${lastStatus}), ${backoffMs}ms 후 재시도 (${attempt}/${MAX_ATTEMPTS})...`);
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 응답에 content가 없습니다.");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`LLM이 JSON이 아닌 응답을 반환했습니다:\n${content.slice(0, 500)}`);
  }
}
