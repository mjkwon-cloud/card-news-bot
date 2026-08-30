// Instagram Graph API 캐러셀(카드뉴스) 게시 — 개발문서 04절 4단계 플로우 구현.
// https://developers.facebook.com/docs/instagram-platform/content-publishing/

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function requireEnv() {
  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error(
      "IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN이 비어 있습니다. " +
      "Meta 앱 심사 통과 후 발급받은 값을 .env에 채워야 실제 게시가 됩니다."
    );
  }
  return { igUserId, accessToken };
}

async function graphPost(path, params) {
  const url = `${GRAPH_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Graph API 오류: ${JSON.stringify(data.error ?? data)}`);
  }
  return data;
}

async function graphGet(path, params) {
  const url = `${GRAPH_BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Graph API 오류: ${JSON.stringify(data.error ?? data)}`);
  }
  return data;
}

// ① 이미지 1장당 자식 컨테이너 생성
async function createChildContainer(imageUrl, accessToken, igUserId) {
  const data = await graphPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    is_carousel_item: "true",
    access_token: accessToken,
  });
  return data.id;
}

// ② FINISHED 상태가 될 때까지 폴링
async function waitUntilFinished(containerId, accessToken, { intervalMs = 3000, timeoutMs = 60000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const data = await graphGet(`/${containerId}`, {
      fields: "status_code",
      access_token: accessToken,
    });
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(`컨테이너 ${containerId} 처리 실패 (status_code=ERROR)`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`컨테이너 ${containerId}가 시간 내에 FINISHED되지 않았습니다.`);
}

// ③ 캐러셀 부모 컨테이너 생성
async function createCarouselContainer(childIds, caption, accessToken, igUserId) {
  const data = await graphPost(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: accessToken,
  });
  return data.id;
}

// ④ 게시
async function publish(containerId, accessToken, igUserId) {
  const data = await graphPost(`/${igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });
  return data.id; // 게시된 미디어 ID
}

/**
 * imageUrls: 카드뉴스 슬라이드 순서대로 공개 접근 가능한 이미지 URL 배열 (2~10장)
 * caption: 게시물 본문 (해시태그 포함)
 */
export async function postCarousel({ imageUrls, caption }) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error("캐러셀은 이미지 2~10장이 필요합니다.");
  }
  const { igUserId, accessToken } = requireEnv();

  const childIds = [];
  for (const url of imageUrls) {
    const id = await createChildContainer(url, accessToken, igUserId);
    await waitUntilFinished(id, accessToken);
    childIds.push(id);
  }

  const parentId = await createCarouselContainer(childIds, caption, accessToken, igUserId);
  await waitUntilFinished(parentId, accessToken);

  const mediaId = await publish(parentId, accessToken, igUserId);
  return { mediaId };
}
