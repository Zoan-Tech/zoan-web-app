"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePairingState } from "@/hooks/usePairing";
import { PairingFlow } from "@/components/explore/pairing-flow";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeftIcon } from "@phosphor-icons/react";

export default function PairingPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pairingState, isLoading, error } = usePairingState(agentId);

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["agents", "installed"] });
    router.push("/explore");
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !pairingState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-sm text-red-500">Failed to load pairing flow</p>
        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 text-sm text-gray-500"
        >
          <ArrowLeftIcon size={16} />
          Go back
        </button>
      </div>
    );
  }

  return (
    <PairingFlow
      agentId={agentId}
      pairingState={pairingState}
      onComplete={handleComplete}
    />
  );
}
