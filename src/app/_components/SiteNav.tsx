"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { NAV_ITEMS, PROFILE } from "@/constants/profile";

/**
 * 데스크톱은 가로 메뉴, 모바일은 풀스크린 버거.
 *
 * 전환 기준이 `lg:`(1024px)인 이유 — 메뉴가 6개고 HOW I WORK이 길어서
 * 모노 13px + 넓은 트래킹으로도 가로 폭이 ~525px 나온다. `md:`(768px)에서는
 * 로고와 겹친다.
 *
 * 버거는 네이티브 `<dialog>` + `showModal()`이다 — 포커스 트랩, Esc 닫기,
 * 닫은 뒤 트리거로 포커스 복귀, 배경 inert가 전부 브라우저 기본 동작이다.
 * 직접 구현하면 저 넷 중 하나는 반드시 빠진다.
 *
 * 현재 경로 표시 때문에 클라이언트 컴포넌트다(`usePathname`).
 * 사이트에서 유일한 `"use client"`다.
 */
export function SiteNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      {/* 데스크톱 — 가로 메뉴 */}
      <nav aria-label="주 메뉴" className="hidden lg:block">
        <ul className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "pb-1 font-mono text-[13px] font-medium tracking-[0.12em] text-ink border-b-2 border-ink"
                      : "pb-1 font-mono text-[13px] font-medium tracking-[0.12em] text-muted transition-colors hover:text-ink"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 모바일 — 버거 */}
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="메뉴 열기"
        className="flex flex-col items-end justify-center gap-1.5 w-11 h-11 -mr-2 cursor-pointer lg:hidden"
      >
        <span className="block w-7 h-px bg-ink" />
        <span className="block w-5 h-px bg-ink" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="사이트 메뉴"
        className="w-screen max-w-none h-dvh max-h-none m-0 p-0 bg-surface text-ink backdrop:bg-ink/40"
      >
        <div className="flex flex-col h-full px-5 py-6 sm:px-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              aria-label="메뉴 닫기"
              className="flex items-center justify-center w-11 h-11 -mr-2 text-2xl leading-none text-ink cursor-pointer"
            >
              ×
            </button>
          </div>

          <nav aria-label="사이트 메뉴" className="flex flex-1 items-center">
            <ul className="w-full">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex items-baseline gap-5 py-2"
                  >
                    <span className="label">{item.no}</span>
                    <span className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-divider">
            <a
              href={`mailto:${PROFILE.email}`}
              className="py-2 font-mono text-sm text-label"
            >
              {PROFILE.email}
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 font-mono text-sm text-label"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
