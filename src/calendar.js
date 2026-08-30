// 개발문서 03절 "요일별 주제 캘린더"를 그대로 코드로 옮긴 것.
// 요일이 바뀌면 이 배열만 고치면 된다.
export const WEEKLY_THEMES = {
  1: { day: "월", theme: "대표메뉴 스포트라이트", brief: "한우생갈비·꽃등심 클로즈업, 굽는 과정" },
  2: { day: "화", theme: "손님 후기 카드뉴스", brief: "네이버 리뷰 인용을 카드뉴스로 재구성" },
  3: { day: "수", theme: "광양불고기 스토리", brief: "광양 지역 유래, 참숯구이 방식 설명" },
  4: { day: "목", theme: "점심 정식 소개", brief: "직장인 타깃, 갈비탕·정식 구성" },
  5: { day: "금", theme: "회식·모임 안내", brief: "프라이빗룸, 단체 이용 정보" },
  6: { day: "토", theme: "재료·한우 정보", brief: "등급, 손질 방식 등 신뢰 콘텐츠" },
  0: { day: "일", theme: "정기휴무 안내 · 다음 주 예고", brief: "오늘은 정기휴무, 다음 주 방문을 유도하는 티저성 콘텐츠 (영업시간·휴무 안내 포함)" },
};

// 벤치마킹 대상 — 톤/구성 방식만 참고용으로 로테이션. 문구를 베끼는 게 아니라
// "표지는 후킹 카피 2줄" "예약 CTA를 강하게" 같은 스타일 각도만 매일 다르게 준다.
// 원 개발문서 02절 + 추가 리서치(2026-08)로 확보한 한우/소고기 전문점 벤치마크 10곳.
export const REFERENCE_STYLES = [
  { name: "본앤브레드", handle: "@bornandbredkorea", angle: "절제된 톤, 부위 클로즈업 위주로 담백하게" },
  { name: "삼원가든", handle: null, angle: "전통과 정성을 강조하는 잔잔한 스토리텔링 어투" },
  { name: "고깃집열 강남본점", handle: "@bbqyul_official", angle: "마지막 장 예약 CTA를 특히 강하고 명확하게" },
  { name: "뽀 먹스타그램", handle: "@bbo_muksta", angle: "표지 후킹 카피를 2줄 이내로 강렬하게" },
  { name: "맛집정보특공대", handle: "@bestgreedfood", angle: "친근한 구어체, 캐릭터성 있는 말투" },
  { name: "한우물", handle: "@hanwoomool_official", angle: "캐주얼하고 감각적인 공간/분위기 묘사 위주" },
  { name: "모도우 삼성점", handle: null, angle: "플레이팅 클로즈업과 코스 흐름을 설명하듯" },
  { name: "역삼동 서원정육식당", handle: null, angle: "노포 특유의 담백한 신뢰감, 과장 없는 문장" },
  { name: "우마담", handle: "@woomadam_omakase", angle: "셰프가 직접 굽는 현장감 있는 묘사" },
  { name: "소와나", handle: "@sowana_hannamdong", angle: "고급스러운 색감과 절제된 카피" },
];

export function themeForToday(date = new Date()) {
  return WEEKLY_THEMES[date.getDay()];
}

// 2026-01-01을 기준일(day 0)로 삼아 날짜별로 REFERENCE_STYLES를 순환시킨다.
// 같은 요일이라도 주가 바뀌면 참고 스타일이 달라져 한 달 내내 톤이 반복되지 않는다.
const EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

export function styleForToday(date = new Date()) {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceEpoch = Math.floor((utcMidnight - EPOCH) / DAY_MS);
  const idx = ((daysSinceEpoch % REFERENCE_STYLES.length) + REFERENCE_STYLES.length) % REFERENCE_STYLES.length;
  return REFERENCE_STYLES[idx];
}
