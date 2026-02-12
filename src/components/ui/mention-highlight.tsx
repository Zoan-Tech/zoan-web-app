"use client";

import React from "react";

interface MentionHighlightProps {
  content: string;
  className?: string;
  placeholder?: string;
}

/**
 * Renders text with @mentions highlighted in teal/bold.
 * Used as a backdrop behind a transparent textarea/input to simulate
 * styled text editing.
 */
export function MentionHighlight({ content, className = "", placeholder }: MentionHighlightProps) {
  const parts = parseMentions(content);

  return (
    <div aria-hidden className={className}>
      {content.length === 0 && placeholder ? (
        <span className="text-gray-400">{placeholder}</span>
      ) : (
        <>
          {parts.map((part, i) =>
            part.isMention ? (
              <span key={i} className="text-[#27CEC5]">
                {part.text}
              </span>
            ) : (
              <React.Fragment key={i}>{part.text}</React.Fragment>
            )
          )}
          {content.endsWith("\n") && <br />}
        </>
      )}
    </div>
  );
}

interface TextPart {
  text: string;
  isMention: boolean;
}

function parseMentions(content: string): TextPart[] {
  const parts: TextPart[] = [];
  // Match @username patterns: @ preceded by start-of-string or whitespace,
  // followed by word characters (letters, digits, underscores)
  const regex = /(^|(?<=\s))@\w+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: content.slice(lastIndex, match.index), isMention: false });
    }
    parts.push({ text: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), isMention: false });
  }

  return parts;
}
