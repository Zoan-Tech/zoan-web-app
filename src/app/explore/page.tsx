"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { ExploreBanner } from "@/components/explore/explore-banner";
import { PinnedAgents } from "@/components/explore/pinned-agents";
import { PairedAgents } from "@/components/explore/paired-agents";
import { ForYouSection } from "@/components/explore/for-you-section";
import { TrendingAgents } from "@/components/explore/trending-agents";
import { LiveFeed } from "@/components/explore/live-feed";
import { CaretLeftIcon } from "@phosphor-icons/react";

export default function ExplorePage() {
  const router = useRouter();

  return (
    <AppShell>
      <PageHeader>
        <div className="relative flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="mx-auto text-sm font-medium text-gray-900">Explore</span>
        </div>
      </PageHeader>

      <PageContent>
        <ExploreBanner />
        {/* <PinnedAgents /> */}
        <PairedAgents />
        {/* <ForYouSection /> */}
        <TrendingAgents />
        <LiveFeed />
      </PageContent>
    </AppShell>
  );
}
