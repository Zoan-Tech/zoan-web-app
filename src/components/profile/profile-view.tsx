"use client";

import { useState } from "react";
import { useQuery as useQueryTanstack } from "@tanstack/react-query";
import { AppShell } from "@/components/layout";
import { PostCard } from "@/components/feed";
import { profileService, feedService } from "@/services";
import { useAuthStore } from "@/stores/auth";
import { Post } from "@/types/feed";
import { formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";

import {
  CaretLeftIcon,
  CalendarIcon,
  LinkIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";

interface ProfileViewProps {
  userId?: string;
}

export function ProfileView({ userId }: ProfileViewProps) {
  const { user: currentUser, logout } = useAuthStore();

  const isOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id;

  const router = useRouter();

  const [followOverride, setFollowOverride] = useState<{
    isFollowing: boolean;
    followersDelta: number;
  } | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQueryTanstack({
    queryKey: ["profile", targetUserId],
    queryFn: () => profileService.getProfile(targetUserId),
    enabled: !!targetUserId,
  });

  const { data: postsData, isLoading: isLoadingPosts } = useQueryTanstack({
    queryKey: ["userPosts", targetUserId],
    queryFn: () => feedService.getUserPosts(targetUserId!),
    enabled: !!targetUserId,
  });

  const isFollowing = followOverride?.isFollowing ?? profile?.is_following ?? false;
  const followersCount = (profile?.follower_count ?? 0) + (followOverride?.followersDelta ?? 0);

  const handleFollow = async () => {
    if (!profile) return;

    try {
      if (isFollowing) {
        await profileService.unfollowUser(profile.id);
        setFollowOverride({
          isFollowing: false,
          followersDelta: (followOverride?.followersDelta ?? 0) - 1,
        });
      } else {
        await profileService.followUser(profile.id);
        setFollowOverride({
          isFollowing: true,
          followersDelta: (followOverride?.followersDelta ?? 0) + 1,
        });
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoadingProfile) {
    return (
      <AppShell>
        <LoadingSpinner size="lg" fullScreen />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <PageHeader>
          <div className="flex w-full items-center">
            <button
              onClick={() => router.back()}
              className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
            >
              <CaretLeftIcon className="h-4 w-4" weight="bold" />
            </button>
            <span className="mx-auto text-sm font-medium text-gray-900">Profile</span>
          </div>
        </PageHeader>

        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <p className="text-lg text-gray-500">Profile not found</p>
          <Link href="/" className="text-[#27CEC5] hover:underline">
            Go back home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <PageHeader>
        <div className="flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="mx-auto text-sm font-medium text-gray-900">Profile</span>
        </div>
      </PageHeader>

      <PageContent>
        {/* Banner */}
        <div className="relative bg-gradient-to-r from-[#27CEC5] to-[#20b5ad] sm:h-48">
          {profile.banner_url && (
            <Image
              src={profile.banner_url}
              alt="Banner"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex items-end justify-between sm:-mt-16">
            <UserAvatar user={profile} size="xl" className="border-4 border-white" />

            {/* Action Button */}
            {isOwnProfile ? (
              <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isFollowing
                    ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Name & Username */}
          <div className="mb-3">
            <h2 className="flex items-center gap-1 text-xl font-bold text-gray-900">
              {profile.display_name}
              {profile.is_verified && <VerifiedBadge size="md" />}
            </h2>
            <p className="text-gray-500">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && <p className="mb-3 text-gray-700">{profile.bio}</p>}

          {/* Meta Info */}
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#27CEC5] hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span>
              <strong className="text-gray-900">
                {formatNumber(profile.following_count)}
              </strong>{" "}
              <span className="text-gray-500">Following</span>
            </span>
            <span>
              <strong className="text-gray-900">
                {formatNumber(followersCount)}
              </strong>{" "}
              <span className="text-gray-500">Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button className="flex-1 border-b-2 border-[#27CEC5] py-3 text-center font-medium text-[#27CEC5]">
            Posts
          </button>
          <button className="flex-1 py-3 text-center text-gray-500 hover:bg-gray-50">
            Replies
          </button>
          <button className="flex-1 py-3 text-center text-gray-500 hover:bg-gray-50">
            Likes
          </button>
        </div>

        {/* Posts */}
        {isLoadingPosts ? (
          <LoadingSpinner size="md" />
        ) : postsData?.data && postsData.data.length > 0 ? (
          postsData.data.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="py-12 text-center text-gray-500">No posts yet</div>
        )}
      </PageContent>
    </AppShell>
  );
}
