import React from "react";
import Link from "next/link";
import { Mention } from "@/types/feed";

export function renderContentWithMentions(
  content: string,
  mentions?: Mention[]
): React.ReactNode {
  if (!mentions || mentions.length === 0) return content;

  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sorted.forEach((mention, i) => {
    if (mention.start > lastIndex) {
      parts.push(content.slice(lastIndex, mention.start));
    }
    parts.push(
      <Link
        key={i}
        href={`/profile/${mention.user_id}`}
        className="text-[#27CEC5] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {content.slice(mention.start, mention.end)}
      </Link>
    );
    lastIndex = mention.end;
  });

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}
