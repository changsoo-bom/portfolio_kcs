"use client";

import { useEffect, useRef, useState } from "react";

import { messagesOf } from "@/constants/messages";
import type { LanguageCode } from "@/constants/languages";

export type DropdownOption = { value: string; label: string };

type DropdownProps = {
  /** 아무것도 안 골랐을 때 보이는 말이자 이 칸의 이름. */
  label: string;
  value: string | null;
  options: DropdownOption[];
  disabled?: boolean;
  language: LanguageCode;
  onChange: (value: string | null) => void;
};

/**
 * 목록을 직접 그리는 선택 상자.
 *
 * **`<select>` 의 목록은 CSS 가 닿지 않는다** — 브라우저가 아니라 운영체제가
 * 그리는 창이라 색도 모서리도 애니메이션도 줄 수 없다. 화면의 나머지가 어두운
 * 유리인데 거기만 흰 시스템 목록이 튀어나온다.
 *
 * 직접 그리면 네이티브가 공짜로 주던 글자 입력 점프를 잃는데, 나라가 240개라
 * 그게 아쉬운 자리다. 그래서 목록 맨 위에 **검색 칸**을 둔다 — 점프보다 낫다.
 * 여러 글자로 걸러지고, 이름 중간에 있는 글자로도 찾힌다.
 */
export function Dropdown({
  label,
  value,
  options,
  disabled,
  language,
  onChange,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const messages = messagesOf(language);
  const selected = options.find((option) => option.value === value) ?? null;

  const keyword = query.trim().toLowerCase();
  const shown = keyword
    ? options.filter((option) => option.label.toLowerCase().includes(keyword))
    : options;

  /** 닫으면 검색어도 지운다 — 다시 열었을 때 지난번 검색이 남아 있으면 안 된다. */
  const dismiss = () => {
    setOpen(false);
    setQuery("");
  };

  const close = () => {
    dismiss();
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    /**
     * 바깥을 누르면 닫는다. click 이 아니라 pointerdown 인 건, 누른 채로
     * 지도를 끌고 갔을 때도 닫혀야 하기 때문이다.
     */
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        dismiss();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    /**
     * **두 프레임 미룬다.** `visibility: hidden` 인 요소에는 `focus()` 가 그대로
     * 무시되는데, effect 도 rAF 콜백도 스타일이 다시 계산되기 **전**에 돈다.
     * 한 번만 미루면 그 시점에도 아직 hidden 이라 초점이 트리거에 남는다.
     */
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        // 열자마자 바로 칠 수 있게 검색 칸으로 간다
        searchRef.current?.focus();
        // 고른 항목은 초점 대신 스크롤로 보여준다
        selectedRef.current?.scrollIntoView({ block: "center" });
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  /** 방향키로 항목 사이를 옮긴다. 초점을 실제로 옮겨서 스크롤이 따라온다. */
  const step = (delta: number) => {
    const buttons = [...(listRef.current?.querySelectorAll("button") ?? [])];
    if (buttons.length === 0) return;

    const active = document.activeElement;
    const index =
      active instanceof HTMLButtonElement ? buttons.indexOf(active) : -1;

    // 검색 칸에서 아래를 누르면 첫 항목, 위를 누르면 마지막 항목으로 간다
    if (index < 0) {
      buttons[delta > 0 ? 0 : buttons.length - 1]?.focus();
      return;
    }

    buttons[(index + delta + buttons.length) % buttons.length]?.focus();
  };

  return (
    /**
     * 키 처리를 여기 한 곳에 둔다. 트리거·검색 칸·목록이 형제라, 트리거에서
     * 누른 Esc 는 목록까지 닿지 않는다 — 둘 다 이 상자 안이라 여기서는 다 잡힌다.
     */
    <div
      ref={rootRef}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (open) close();
          return;
        }

        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();

        // 닫혀 있으면 열기만 한다 — 초점은 위 effect 가 옮긴다
        if (!open) setOpen(true);
        else step(event.key === "ArrowDown" ? 1 : -1);
      }}
      className="relative"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        className={`flex items-center justify-between gap-2 h-9 w-50 pl-4 pr-3 text-sm rounded-full transition-colors ${
          disabled
            ? "text-white/25 bg-white/5"
            : `text-white ${open ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`
        }`}
      >
        {/* 이름이 길면 자른다 — 펼치면 다 보인다 */}
        <span className={`truncate ${selected ? "" : "text-white/40"}`}>
          {selected?.label ?? label}
        </span>
        <svg
          viewBox="0 0 10 6"
          aria-hidden="true"
          className={`shrink-0 h-1.5 w-2.5 fill-white/40 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M0 0h10L5 6z" />
        </svg>
      </button>

      {/*
        조건부 렌더가 아니라 항상 두고 클래스만 바꾼다 — `{open && …}` 로 두면
        닫는 순간 사라져서 작아지는 모션이 나올 자리가 없다.

        visibility 를 같이 전이시키는 게 요령이다. 이 속성은 불연속으로 바뀌어서
        나타날 때는 즉시, 사라질 때는 전이가 끝난 뒤에 적용된다 — 닫히는 동안
        보이다가 마지막에 탭 순서와 접근성 트리에서 빠진다.

        전이 목록에 transform 이 아니라 scale 을 적는다. Tailwind v4 의 `scale-*`
        은 CSS `scale` 속성으로 컴파일돼서, transform 만 걸면 크기가 툭 튄다.

        목록은 트리거보다 넓어져도 된다. 폭을 맞추면 "사우스조지아 사우스샌드위치
        제도" 같은 이름이 목록에서도 잘려서, 펼쳐도 뭔지 모르게 된다.
      */}
      <div
        className={`absolute top-full left-0 z-30 mt-2 w-max min-w-full max-w-[18rem] origin-top rounded-2xl border border-white/15 bg-black/85 p-1 transition-[opacity,scale,visibility] duration-200 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <input
          ref={searchRef}
          type="text"
          aria-label={messages.search}
          placeholder={messages.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full px-3 py-1.5 text-sm text-white bg-transparent border-b border-white/10 outline-none placeholder:text-white/30"
        />

        <div
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="max-h-56 mt-1 overflow-y-auto scrollbar-slim"
        >
          {shown.length === 0 ? (
            <p className="px-3 py-2 text-sm text-white/30">
              {messages.noMatch}
            </p>
          ) : (
            shown.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  ref={isSelected ? selectedRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm truncate rounded-full transition-colors hover:bg-white/10 focus-visible:bg-white/10 outline-none ${
                    isSelected
                      ? "text-[#b6f5d5]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
