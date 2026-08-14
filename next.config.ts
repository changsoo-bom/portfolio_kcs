import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * 구역 폴리곤은 지도가 브라우저로 내려받는 정적 파일이지만, 명소를 구역
   * 밖까지 긁어 오지 않으려고 **서버도 같은 파일을 읽는다**(`lib/regions/shape`).
   * 배포 추적은 코드에서 보이는 import 만 따라가므로 여기서 짚어 주지 않으면
   * 서버 쪽에 파일이 안 실리고, 그러면 걸러 내기가 조용히 꺼진다.
   */
  outputFileTracingIncludes: {
    "/": ["./public/admin1/**"],
  },
  images: {
    /**
     * 명소 사진은 Commons 에서 온다. Special:FilePath 가 실제 파일이 있는
     * upload 도메인으로 넘기므로 **둘 다 등록해야** 한다.
     */
    remotePatterns: [
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
