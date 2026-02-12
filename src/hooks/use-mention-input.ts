"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { profileService } from "@/services/profile";
import { User } from "@/types/auth";

interface UseMentionInputOptions {
  initialContent?: string;
}

interface MentionState {
  query: string;
  startIndex: number;
}

export function useMentionInput(options: UseMentionInputOptions = {}) {
  const [content, setContentRaw] = useState(options.initialContent ?? "");
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMentions, setShowMentions] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectMention = useCallback(
    (text: string, cursorPos: number): MentionState | null => {
      if (cursorPos === 0) return null;

      let i = cursorPos - 1;
      while (i >= 0) {
        const char = text[i];
        if (char === "@") {
          if (i === 0 || /\s/.test(text[i - 1])) {
            const query = text.slice(i + 1, cursorPos);
            if (!/\s/.test(query)) {
              return { query, startIndex: i };
            }
          }
          return null;
        }
        if (/\s/.test(char)) return null;
        i--;
      }
      return null;
    },
    []
  );

  const setContent = useCallback(
    (value: string) => {
      setContentRaw(value);

      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;

        const cursorPos = el.selectionStart ?? value.length;
        const mention = detectMention(value, cursorPos);

        if (mention) {
          setMentionState(mention);
          setSelectedIndex(0);
          setShowMentions(true);
        } else {
          setMentionState(null);
          setShowMentions(false);
          setMentionResults([]);
        }
      }, 0);
    },
    [detectMention]
  );

  // Debounced user search
  useEffect(() => {
    if (!showMentions || !mentionState) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (mentionState.query.length === 0) {
        setMentionResults([]);
        return;
      }
      const results = await profileService.searchUsers(mentionState.query);
      setMentionResults(results);
      setSelectedIndex(0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [showMentions, mentionState]);

  // Place cursor after mention insertion — use rAF to run after React finishes reconciling
  const setCursorPosition = useCallback((pos: number) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }, []);

  const selectMention = useCallback(
    (user: User) => {
      if (!mentionState) return;

      const before = content.slice(0, mentionState.startIndex);
      const after = content.slice(
        mentionState.startIndex + 1 + mentionState.query.length
      );
      const inserted = `@${user.username} `;
      const newContent = `${before}${inserted}${after}`;
      const cursorPos = before.length + inserted.length;

      setContentRaw(newContent);
      setMentionState(null);
      setShowMentions(false);
      setMentionResults([]);

      setCursorPosition(cursorPos);
    },
    [content, mentionState, setCursorPosition]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showMentions || !mentionResults || mentionResults.length === 0)
        return false;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < mentionResults.length - 1 ? prev + 1 : 0
          );
          return true;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : mentionResults.length - 1
          );
          return true;

        case "Enter":
        case "Tab":
          e.preventDefault();
          selectMention(mentionResults[selectedIndex]);
          return true;

        case "Escape":
          e.preventDefault();
          setShowMentions(false);
          setMentionState(null);
          setMentionResults([]);
          return true;

        default:
          return false;
      }
    },
    [showMentions, mentionResults, selectedIndex, selectMention]
  );

  const dismissMentions = useCallback(() => {
    setShowMentions(false);
    setMentionState(null);
    setMentionResults([]);
  }, []);

  return {
    content,
    setContent,
    mentionResults,
    showMentions,
    selectedIndex,
    handleKeyDown,
    selectMention,
    dismissMentions,
    inputRef,
  };
}
