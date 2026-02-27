"use client";

import React from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import { Mention } from "@/types/feed";

const MENTION_PREFIX = "@@mention@@";

function buildMarkdownWithMentions(
  content: string,
  mentions?: Mention[]
): string {
  if (!mentions || mentions.length === 0) return content;

  const sorted = [...mentions].sort((a, b) => b.start - a.start);
  let result = content;

  sorted.forEach((mention) => {
    const mentionText = content.slice(mention.start, mention.end);
    result =
      result.slice(0, mention.start) +
      `[${mentionText}](${MENTION_PREFIX}${mention.user_id})` +
      result.slice(mention.end);
  });

  return result;
}

export function renderContentWithMentions(
  content: string,
  mentions?: Mention[]
): React.ReactNode {
  const raw = buildMarkdownWithMentions(content, mentions);
  // Ensure literal \n sequences become real newlines for markdown parsing
  const markdown = raw.replace(/\\n/g, "\n");

  return (
    <div className="wrap-break-word min-w-0">
    <Markdown
      components={{
        a({ href, children }) {
          if (href?.startsWith(MENTION_PREFIX)) {
            const userId = href.slice(MENTION_PREFIX.length);
            return (
              <Link
                href={`/profile/${userId}`}
                className="text-[#27CEC5] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#27CEC5] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </a>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>;
        },
        ol({ children }) {
          return (
            <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>
          );
        },
        li({ children }) {
          return <li className="mb-0.5">{children}</li>;
        },
        code({ children, className }) {
          const isBlock = className?.startsWith("language-");
          if (isBlock) {
            return (
              <pre className="overflow-x-auto rounded-md bg-white/10 p-3 my-2 text-xs">
                <code className={className}>{children}</code>
              </pre>
            );
          }
          return (
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </Markdown>
    </div>
  );
}
