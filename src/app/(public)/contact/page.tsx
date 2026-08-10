import type { Metadata } from "next";

import { PROFILE } from "@/constants/profile";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="flex flex-col flex-1 justify-center w-full max-w-[1440px] mx-auto px-5 pt-20 pb-16 sm:px-8 lg:px-12">
      <div className="w-full px-6 py-16 bg-deep rounded-2xl sm:px-10 sm:py-24">
        <p className="text-[10px] uppercase tracking-[0.15em] text-silver">
          Contact
        </p>
        <h1 className="mt-6 text-[clamp(2rem,6vw,3rem)] font-medium leading-none tracking-[-0.04em] text-white">
          연락
        </h1>
        <div className="flex flex-col gap-2 mt-8 text-base text-silver">
          <a href={`mailto:${PROFILE.email}`} className="py-1">
            {PROFILE.email}
          </a>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </main>
  );
}
