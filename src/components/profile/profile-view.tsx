"use client";

import { useState } from "react";
import { useQuery as useQueryTanstack, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout";
import { PostCard } from "@/components/feed";
import { profileService, feedService } from "@/services";
import { bookmarkService } from "@/services/bookmark";
import { useAuthStore } from "@/stores/auth";
import { Post, FeedResponse } from "@/types/feed";
import { BookmarkCollection, BookmarkItem } from "@/types/bookmark";
import { formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useFollowUser } from "@/hooks/use-follow-user";
import { queryKeys } from "@/lib/query-keys";

import {
  CaretLeftIcon,
  CalendarIcon,
  LinkIcon,
  MapPinIcon,
  DotsThreeCircleIcon,
  SignOutIcon,
  FolderIcon,
  LockSimpleIcon,
  BookmarkSimpleIcon,
  PlusIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";

type Tab = "posts" | "polls" | "likes" | "bookmarks";

type BookmarkView =
  | { type: "grid" }
  | { type: "collection"; collection: BookmarkCollection }
  | { type: "quick" };

interface ProfileViewProps {
  userId?: string;
}

export function ProfileView({ userId }: ProfileViewProps) {
  const { user: currentUser, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { toggleFollow } = useFollowUser();

  const isOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id;

  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [bookmarkView, setBookmarkView] = useState<BookmarkView>({ type: "grid" });
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionPrivate, setNewCollectionPrivate] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useQueryTanstack({
    queryKey: queryKeys.profile.byUserId(targetUserId),
    queryFn: () => profileService.getProfile(targetUserId),
    enabled: !!targetUserId,
  });

  const { data: postsData, isLoading: isLoadingPosts, refetch: refetchPosts } = useQueryTanstack({
    queryKey: queryKeys.userPosts.byUserId(targetUserId!),
    queryFn: () => feedService.getUserPosts(targetUserId!),
    enabled: !!targetUserId && activeTab === "posts",
  });

  const { data: pollPostsData, isLoading: isLoadingPolls } = useQueryTanstack<FeedResponse>({
    queryKey: queryKeys.pollPosts.list(),
    queryFn: () => feedService.getPollPosts(),
    enabled: activeTab === "polls",
  });

  const { data: likedPostsData, isLoading: isLoadingLikes } = useQueryTanstack<FeedResponse>({
    queryKey: queryKeys.likedPosts.list(),
    queryFn: () => feedService.getLikedPosts(),
    enabled: activeTab === "likes",
  });

  const { data: collections, isLoading: isLoadingCollections } = useQueryTanstack({
    queryKey: queryKeys.bookmarkCollections.list(),
    queryFn: bookmarkService.getCollections,
    enabled: isOwnProfile && activeTab === "bookmarks" && bookmarkView.type === "grid",
  });

  const collectionId = bookmarkView.type === "collection" ? bookmarkView.collection.id : "";
  const { data: collectionPostsData, isLoading: isLoadingCollectionPosts } = useQueryTanstack<BookmarkItem[]>({
    queryKey: queryKeys.bookmarkCollections.posts(collectionId),
    queryFn: () => bookmarkService.getCollectionPosts(collectionId),
    enabled: bookmarkView.type === "collection",
  });

  const { data: quickSavesData, isLoading: isLoadingQuickSaves } = useQueryTanstack<BookmarkItem[]>({
    queryKey: queryKeys.bookmarkCollections.quickSaves(),
    queryFn: () => bookmarkService.getQuickSaves(),
    enabled: isOwnProfile && activeTab === "bookmarks" && bookmarkView.type === "quick",
  });

  const isFollowing = profile?.is_following ?? false;
  const followersCount = profile?.follower_count ?? 0;

  const handleFollow = async () => {
    if (!userId || !profile) return;
    await toggleFollow(userId, isFollowing, profile.username);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || isCreatingCollection) return;
    setIsCreatingCollection(true);
    try {
      await bookmarkService.createCollection({
        name: newCollectionName.trim(),
        is_private: newCollectionPrivate,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkCollections.list() });
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionPrivate(false);
    } finally {
      setIsCreatingCollection(false);
    }
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "posts", label: "Posts" },
    { key: "polls", label: "Polls" },
    { key: "likes", label: "Likes" },
    ...(isOwnProfile ? [{ key: "bookmarks" as Tab, label: "Bookmarks" }] : []),
  ];

  return (
    <AppShell>
      {/* Header */}
      <PageHeader>
        <div className="flex w-full items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="text-sm font-medium text-gray-900">Profile</span>
          {isOwnProfile ? (
            <DropdownMenu
              trigger={
                <DotsThreeCircleIcon className="h-5 w-5 text-gray-600 hover:text-gray-900" />
              }
              items={[
                {
                  label: "Log out",
                  icon: <SignOutIcon className="h-4 w-4" />,
                  onClick: handleLogout,
                  variant: "danger",
                },
              ]}
            />
          ) : (
            <div className="w-5" />
          )}
        </div>
      </PageHeader>

      <PageContent>
        {/* Banner */}
        <div className="relative h-36 overflow-hidden rounded-t-3xl bg-linear-to-r from-[#27CEC5] to-[#20b5ad] sm:h-48">
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
          {/* Avatar + Action Button */}
          <div className="relative mb-4 h-10 sm:h-12">
            <div className="absolute -top-8 left-0 sm:-top-10">
              <UserAvatar user={profile} size="xxl" className="border-4 border-white" showProfile={false} />
            </div>

            <div className="flex justify-end pt-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setBookmarkView({ type: "grid" });
              }}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-[#27CEC5] text-[#27CEC5]"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          isLoadingPosts ? (
            <LoadingSpinner size="md" />
          ) : postsData?.data && postsData.data.length > 0 ? (
            postsData.data.map((post: Post) => (
              <PostCard key={post.id} post={post} onDelete={() => refetchPosts()} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">No posts yet</div>
          )
        )}

        {activeTab === "polls" && (
          isLoadingPolls ? (
            <LoadingSpinner size="md" />
          ) : pollPostsData?.data && pollPostsData.data.length > 0 ? (
            pollPostsData.data.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">No polls yet</div>
          )
        )}

        {activeTab === "likes" && (
          isLoadingLikes ? (
            <LoadingSpinner size="md" />
          ) : likedPostsData?.data && likedPostsData.data.length > 0 ? (
            likedPostsData.data.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">No liked posts yet</div>
          )
        )}

        {activeTab === "bookmarks" && isOwnProfile && (
          <>
            {/* Drill-in: quick saves */}
            {bookmarkView.type === "quick" && (
              <>
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <button
                    onClick={() => setBookmarkView({ type: "grid" })}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <CaretLeftIcon className="h-4 w-4" weight="bold" />
                  </button>
                  <div className="flex items-center gap-2">
                    <BookmarkSimpleIcon className="h-4 w-4 text-[#27CEC5]" />
                    <span className="text-sm font-medium text-gray-900">Quick saves</span>
                  </div>
                </div>
                {isLoadingQuickSaves ? (
                  <LoadingSpinner size="md" />
                ) : quickSavesData && quickSavesData.length > 0 ? (
                  quickSavesData.map((item: BookmarkItem) => (
                    <PostCard key={item.id} post={item.post} />
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">No quick saves yet</div>
                )}
              </>
            )}

            {/* Drill-in: collection posts */}
            {bookmarkView.type === "collection" && (
              <>
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <button
                    onClick={() => setBookmarkView({ type: "grid" })}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <CaretLeftIcon className="h-4 w-4" weight="bold" />
                  </button>
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-[#27CEC5]" />
                    <span className="text-sm font-medium text-gray-900">{bookmarkView.collection.name}</span>
                    {bookmarkView.collection.is_private && (
                      <LockSimpleIcon className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                </div>
                {isLoadingCollectionPosts ? (
                  <LoadingSpinner size="md" />
                ) : collectionPostsData && collectionPostsData.length > 0 ? (
                  collectionPostsData.map((item: BookmarkItem) => (
                    <PostCard key={item.id} post={item.post} />
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">No posts in this collection</div>
                )}
              </>
            )}

            {/* Grid view */}
            {bookmarkView.type === "grid" && (
              isLoadingCollections ? (
                <LoadingSpinner size="md" />
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4">
                  {/* Quick saves card */}
                  <button
                    onClick={() => setBookmarkView({ type: "quick" })}
                    className="flex flex-col items-start gap-2 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8FAFA]">
                      <BookmarkSimpleIcon className="h-5 w-5 text-[#27CEC5]" />
                    </div>
                    <div className="w-full min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">Quick saves</p>
                      <p className="text-xs text-gray-400">Saved without collection</p>
                    </div>
                  </button>

                  {/* Create collection button */}
                  <button
                    onClick={() => setShowCreateCollection(true)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <PlusIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="w-full min-w-0">
                      <p className="truncate text-sm font-medium text-gray-500">New collection</p>
                    </div>
                  </button>

                  {/* Collection cards */}
                  {collections?.map((col: BookmarkCollection) => (
                    <button
                      key={col.id}
                      onClick={() => setBookmarkView({ type: "collection", collection: col })}
                      className="flex flex-col items-start gap-2 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8FAFA]">
                        <FolderIcon className="h-5 w-5 text-[#27CEC5]" />
                      </div>
                      <div className="w-full min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-sm font-medium text-gray-900">{col.name}</p>
                          {col.is_private && (
                            <LockSimpleIcon className="h-3 w-3 shrink-0 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{col.bookmark_count} saved</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </PageContent>

      {/* Create Collection Modal */}
      <Modal
        open={showCreateCollection}
        onClose={() => {
          setShowCreateCollection(false);
          setNewCollectionName("");
          setNewCollectionPrivate(false);
        }}
        title="New collection"
        maxWidth="sm:max-w-sm"
      >
        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateCollection();
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#27CEC5] focus:outline-none"
          />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={newCollectionPrivate}
              onChange={(e) => setNewCollectionPrivate(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Private collection</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
                setNewCollectionPrivate(false);
              }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || isCreatingCollection}
              className="flex-1 rounded-lg bg-[#27CEC5] py-2 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
            >
              {isCreatingCollection ? (
                <SpinnerGapIcon className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      {isOwnProfile && profile && (
        <EditProfileModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(targetUserId) });
          }}
        />
      )}
    </AppShell>
  );
}
