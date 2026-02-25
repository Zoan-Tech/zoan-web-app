"use client";

import { useState } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import { Poll } from "@/types/feed";
import { feedService } from "@/services/feed";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";

function getTimeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

interface PollDisplayProps {
  poll: Poll;
  onVote?: (updatedPoll: Poll) => void;
}

export function PollDisplay({ poll: initialPoll, onVote }: PollDisplayProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [isVoting, setIsVoting] = useState(false);

  const hasVoted = !!poll.voted_option_id;
  const showResults = hasVoted || poll.is_ended;
  const timeLeft = getTimeLeft(poll.ends_at);

  const handleVote = async (e: React.MouseEvent, optionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVoted || poll.is_ended || isVoting) return;

    setIsVoting(true);

    // Optimistic update
    const newTotalVotes = poll.total_votes + 1;
    const newOptions = poll.options.map((opt) => {
      const newCount = opt.id === optionId ? opt.vote_count + 1 : opt.vote_count;
      return {
        ...opt,
        vote_count: newCount,
        vote_percentage: Math.round((newCount / newTotalVotes) * 100),
      };
    });
    const optimistic: Poll = {
      ...poll,
      total_votes: newTotalVotes,
      voted_option_id: optionId,
      options: newOptions,
    };
    setPoll(optimistic);
    onVote?.(optimistic);

    try {
      await feedService.votePoll(poll.id, optionId);
    } catch {
      setPoll(initialPoll);
      onVote?.(initialPoll);
      toast.error("Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="p-3 space-y-2">
        {poll.options
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((option) => {
            const isVoted = option.id === poll.voted_option_id;

            if (!showResults) {
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => handleVote(e, option.id)}
                  disabled={isVoting}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-[#27CEC5] hover:bg-[#F0FFFE] disabled:opacity-60"
                >
                  {option.text}
                </button>
              );
            }

            return (
              <div
                key={option.id}
                className={cn(
                  "relative overflow-hidden rounded-lg border px-3 py-2",
                  isVoted ? "border-[#27CEC5]" : "border-gray-200"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-[width]",
                    isVoted ? "bg-[#E0FAF8]" : "bg-gray-100"
                  )}
                  style={{ width: `${option.vote_percentage}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isVoted && (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-[#27CEC5]" weight="bold" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        isVoted ? "font-medium text-gray-900" : "text-gray-700"
                      )}
                    >
                      {option.text}
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 text-sm font-medium text-gray-500">
                    {option.vote_percentage}%
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-3 text-xs text-gray-500">
        <span>{formatNumber(poll.total_votes)} {poll.total_votes === 1 ? "vote" : "votes"}</span>
        <span>·</span>
        <span className={poll.is_ended ? "text-gray-400" : ""}>{timeLeft}</span>
      </div>
    </div>
  );
}
