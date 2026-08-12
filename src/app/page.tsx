import { WorldScene } from "@/components/world/scene/WorldScene";

export default function Home() {
  return (
    // h-dvh 로 높이를 직접 잡는다 — html/body 로 이어지는 퍼센트 사슬에 기대지 않고,
    // 모바일 브라우저 주소창 높이도 dvh 가 알아서 반영한다.
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <h1 className="sr-only">세계 명소 탐색 지도</h1>
      <WorldScene />
    </main>
  );
}
