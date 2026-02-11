"use client";

import { useParams } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  return <ProfileView userId={userId} />;
}
