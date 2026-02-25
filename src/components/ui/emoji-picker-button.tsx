"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import { SmileyIcon } from "@phosphor-icons/react";

const EmojiPickerComponent = dynamic(() => import("emoji-picker-react"), { ssr: false });

const PICKER_HEIGHT = 350;
const PICKER_WIDTH = 300;
const PICKER_MARGIN = 8;

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  buttonClassName?: string;
}

export function EmojiPickerButton({ onEmojiSelect, buttonClassName }: EmojiPickerButtonProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;

    const place = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      // Open above the button; clamp left so it doesn't overflow the viewport
      const top = rect.top - PICKER_HEIGHT - PICKER_MARGIN;
      const left = Math.min(rect.left, window.innerWidth - PICKER_WIDTH - 8);
      setCoords({ top, left });
    };

    place();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) return;
      setShow(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  const handleSelect = (data: EmojiClickData) => {
    onEmojiSelect(data.emoji);
    setShow(false);
  };

  return (
    <div className="flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShow((v) => !v)}
        className={buttonClassName ?? "text-gray-400 transition-colors hover:text-gray-600"}
      >
        <SmileyIcon className="h-5 w-5" />
      </button>

      {show && typeof window !== "undefined" && createPortal(
        <div
          ref={pickerRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
        >
          <EmojiPickerComponent
            onEmojiClick={handleSelect}
            lazyLoadEmojis
            height={PICKER_HEIGHT}
            width={PICKER_WIDTH}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            style={{
              "--epr-bg-color": "#ffffff",
              "--epr-category-label-bg-color": "#f9fafb",
              "--epr-text-color": "#111827",
              "--epr-hover-bg-color": "#f0fdfb",
              "--epr-focus-bg-color": "#e6faf9",
              "--epr-highlight-color": "#27CEC5",
              "--epr-search-border-color": "#E1F1F0",
              "--epr-search-input-bg-color": "#f9fafb",
              "--epr-search-input-text-color": "#111827",
              "--epr-search-input-placeholder-color": "#9ca3af",
              "--epr-border-color": "#E1F1F0",
              "--epr-category-icon-active-color": "#27CEC5",
              "--epr-emoji-size": "24px",
              "--epr-emoji-padding": "4px",
              "--epr-font-family": "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
              borderRadius: "12px",
              border: "1px solid #E1F1F0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            } as React.CSSProperties}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
