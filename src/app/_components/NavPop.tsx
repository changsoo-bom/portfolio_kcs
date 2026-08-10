"use client";

import Link from "next/link";
import { useRef } from "react";

import { NAV_ITEMS, PROFILE } from "@/constants/profile";

/**
 * 풀스크린 버거 메뉴.
 *
 * 네이티브 `<dialog>` + `showModal()`을 쓴다 — 포커스 트랩, Esc 닫기,
 * 닫은 뒤 트리거로 포커스 복귀, 배경 inert가 전부 브라우저 기본 동작이다.
 * 직접 구현하면 저 넷 중 하나는 반드시 빠진다.
 */
export function NavPop() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="메뉴 열기"
        className="flex flex-col items-end justify-center gap-1.5 w-11 h-11 -mr-2 cursor-pointer"
      >
        <span className="block w-7 h-px bg-white" />
        <span className="block w-5 h-px bg-white" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="사이트 메뉴"
        className="w-screen max-w-none h-dvh max-h-none m-0 p-0 bg-abyss backdrop:bg-abyss/90"
      >
        <div className="flex flex-col h-full px-5 py-6 sm:px-8 lg:px-12">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              aria-label="메뉴 닫기"
              className="flex items-center justify-center w-11 h-11 -mr-2 text-2xl leading-none text-white cursor-pointer"
            >
              ×
            </button>
          </div>

          <nav className="flex flex-1 items-center">
            <ul className="w-full">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    onClick={close}
                    className="flex items-baseline gap-5 py-3"
                  >
                    <span className="text-[10px] uppercase tracking-[0.15em] text-silver">
                      {item.no}
                    </span>
                    <span className="text-4xl font-medium tracking-[-0.04em] text-white sm:text-6xl">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-silver">
            <a href={`mailto:${PROFILE.email}`} className="py-2">
              {PROFILE.email}
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
