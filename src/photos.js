// 광양본가 실제 매장/음식 사진 (다이닝코드 등 공개 리뷰 플랫폼에 게재된 사진에서 확보).
// 요일별 주제(calendar.js WEEKLY_THEMES)에 맞춰 표지/신뢰 슬라이드에 쓸 사진을 배정한다.
// 주의: 리뷰어가 올린 사진이라 저작권자가 매장 본인이 아닐 수 있음 — 장기적으로는
// 매장이 직접 찍은 사진으로 교체하는 게 가장 안전하다.
export const CTA_PHOTO = "exterior.webp"; // 오시는 길 슬라이드는 항상 외관 사진 고정

export const WEEKDAY_PHOTOS = {
  1: { cover: "grill-charcoal.webp", trust: "interior.webp" }, // 월 — 대표메뉴 스포트라이트
  2: { cover: "interior.webp", trust: "banchan-2.webp" }, // 화 — 손님 후기
  3: { cover: "grill-charcoal.webp", trust: "bulgogi.webp" }, // 수 — 광양불고기(참숯구이) 스토리
  4: { cover: "galbitang.webp", trust: "banchan-3.webp" }, // 목 — 점심 정식(갈비탕)
  5: { cover: "interior.webp", trust: "banchan-1.webp" }, // 금 — 회식·모임(프라이빗룸)
  6: { cover: "raw-meat.webp", trust: "banchan-3.webp" }, // 토 — 재료·한우 정보
  0: { cover: "exterior.webp", trust: "interior.webp" }, // 일 — 정기휴무 안내·다음주 예고
};

export function photosForWeekday(weekday) {
  return WEEKDAY_PHOTOS[weekday] ?? null;
}
