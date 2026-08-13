import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
