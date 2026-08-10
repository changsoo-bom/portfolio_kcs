import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
};

export default function WorkPage() {
  return (
    <main className="flex flex-col flex-1 justify-center w-full max-w-[1440px] mx-auto px-5 pt-20 pb-16 sm:px-8 lg:px-12">
      <p className="text-[10px] uppercase tracking-[0.15em] text-silver">
        Work
      </p>
      <h1 className="mt-6 text-[clamp(2rem,6vw,3rem)] font-medium leading-none tracking-[-0.04em] text-white">
        작업물
      </h1>
      <p className="mt-5 max-w-[600px] text-base leading-[1.4] text-silver">
        원고 준비 중.
      </p>
    </main>
  );
}
