"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircleIcon, XIcon } from "@phosphor-icons/react";
import { Media } from "@/types/feed";
import { cn } from "@/lib/utils";

// --- Preview modal (handles both image and video) ---

function MediaPreviewModal({
  media,
  onClose,
}: {
  media: Media | null;
  onClose: () => void;
}) {
  if (!media) return null;
  const isVideo = media.type.startsWith("video/");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        onClick={onClose}
      >
        <XIcon className="h-5 w-5" />
      </button>
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <Image
            src={media.url}
            alt="Media preview"
            width={1200}
            height={1200}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            unoptimized
          />
        )}
      </div>
    </div>
  );
}

// --- Single media item ---

function MediaItem({
  media,
  className,
  onClick,
}: {
  media: Media;
  className?: string;
  onClick: () => void;
}) {
  const isVideo = media.type.startsWith("video/");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {isVideo ? (
        <>
          <video
            src={media.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayCircleIcon
              className="h-12 w-12 text-white drop-shadow-lg"
              weight="fill"
            />
          </div>
        </>
      ) : (
        <Image
          src={media.url}
          alt="Post media"
          fill
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  );
}

// --- Media grid (X-style layouts) ---

interface MediaGridProps {
  medias: Media[];
  className?: string;
}

export function MediaGrid({ medias, className }: MediaGridProps) {
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  if (!medias || medias.length === 0) return null;

  const count = Math.min(medias.length, 4);
  const extra = medias.length - 4;
  const items = medias.slice(0, count);

  return (
    <>
      <div className={cn("mt-3 overflow-hidden rounded-2xl", className)}>
        {/* 1 image — full width, 16:9 */}
        {count === 1 && (
          <div className="relative aspect-video w-full">
            <MediaItem
              media={items[0]}
              className="absolute inset-0 rounded-2xl"
              onClick={() => setPreviewMedia(items[0])}
            />
          </div>
        )}

        {/* 2 images — side by side */}
        {count === 2 && (
          <div className="flex h-52 gap-0.5">
            {items.map((m, i) => (
              <div key={i} className="relative flex-1">
                <MediaItem
                  media={m}
                  className={cn(
                    "absolute inset-0",
                    i === 0 ? "rounded-l-2xl" : "rounded-r-2xl"
                  )}
                  onClick={() => setPreviewMedia(m)}
                />
              </div>
            ))}
          </div>
        )}

        {/* 3 images — left tall, right two stacked */}
        {count === 3 && (
          <div className="flex h-64 gap-0.5">
            <div className="relative flex-1">
              <MediaItem
                media={items[0]}
                className="absolute inset-0 rounded-l-2xl"
                onClick={() => setPreviewMedia(items[0])}
              />
            </div>
            <div className="flex w-[49%] flex-col gap-0.5">
              {items.slice(1).map((m, i) => (
                <div key={i} className="relative flex-1">
                  <MediaItem
                    media={m}
                    className={cn(
                      "absolute inset-0",
                      i === 0 ? "rounded-tr-2xl" : "rounded-br-2xl"
                    )}
                    onClick={() => setPreviewMedia(m)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 images — 2×2 grid */}
        {count === 4 && (
          <div className="grid h-64 grid-cols-2 gap-0.5">
            {items.map((m, i) => (
              <div key={i} className="relative">
                <MediaItem
                  media={m}
                  className={cn(
                    "absolute inset-0",
                    i === 0 && "rounded-tl-2xl",
                    i === 1 && "rounded-tr-2xl",
                    i === 2 && "rounded-bl-2xl",
                    i === 3 && "rounded-br-2xl"
                  )}
                  onClick={() => setPreviewMedia(m)}
                />
                {/* +N overlay on the last tile when there are extras */}
                {i === 3 && extra > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-br-2xl bg-black/50">
                    <span className="text-2xl font-bold text-white">+{extra}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <MediaPreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </>
  );
}
