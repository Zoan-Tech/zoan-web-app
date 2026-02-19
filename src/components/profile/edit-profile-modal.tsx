"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { profileService, UpdateProfileRequest } from "@/services/profile";
import { User } from "@/types/auth";
import { useAuthStore } from "@/stores/auth";
import { queryKeys } from "@/lib/query-keys";
import { CameraIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Image from "next/image";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: User;
  onUpdated: (user: User) => void;
}

export function EditProfileModal({
  open,
  onClose,
  profile,
  onUpdated,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { user: currentUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: UpdateProfileRequest = {};

      if (displayName !== (profile.display_name || "")) updates.display_name = displayName;
      if (bio !== (profile.bio || "")) updates.bio = bio;
      if (location !== (profile.location || "")) updates.location = location;
      if (website !== (profile.website || "")) updates.website = website;
      if (avatarFile) updates.avatar = avatarFile;
      if (bannerFile) updates.banner = bannerFile;

      if (Object.keys(updates).length > 0) {
        const updatedUser = await profileService.updateProfile(updates);
        setUser(updatedUser);
        onUpdated(updatedUser);
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.userPosts.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.post.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.commentReplies.all });
        toast.success("Profile updated");
      }

      onClose();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="sm:max-w-lg">
      <div className="space-y-5">
        {/* Banner */}
        <div className="relative -mx-6 -mt-6">
          <div
            className="relative h-28 cursor-pointer overflow-hidden rounded-t-2xl bg-linear-to-r from-[#27CEC5] to-[#20b5ad]"
            onClick={() => bannerInputRef.current?.click()}
          >
            {(bannerPreview || profile.banner_url) && (
              <Image
                src={bannerPreview || profile.banner_url!}
                alt="Banner"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <CameraIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />

          {/* Avatar overlay */}
          <div className="absolute -bottom-10 left-4">
            <div
              className="relative cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white">
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <UserAvatar
                  user={currentUser ?? profile}
                  size="xl"
                  className="border-4 border-white"
                  showProfile={false}
                />
              )}
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                <CameraIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Spacer for avatar overflow */}
        <div className="pt-6" />

        {/* Name (read-only) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Name
          </label>
          <textarea
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Write display name"
            maxLength={160}
            rows={1}
            className="w-full resize-none rounded border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#27CEC5] focus:ring-1 focus:ring-[#27CEC5]"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write bio"
            maxLength={160}
            rows={3}
            className="w-full resize-none rounded border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#27CEC5] focus:ring-1 focus:ring-[#27CEC5]"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {bio.length}/160
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className="w-full rounded border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#27CEC5] focus:ring-1 focus:ring-[#27CEC5]"
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Link
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Add link"
            className="w-full rounded border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#27CEC5] focus:ring-1 focus:ring-[#27CEC5]"
          />
        </div>

        {/* Done button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded bg-primary py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Done"}
        </button>
      </div>
    </Modal>
  );
}
