"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/shared/Avatar";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";

interface AvatarDropdownProps {
  user: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
}

export default function AvatarDropdown({ user }: AvatarDropdownProps) {
  const router = useRouter();
  const handleProfileClick = useProfileNavigation();

  const items: DropdownItem[] = [
    {
      type: "action",
      label: "My Riffs",
      onClick: () => router.push("/my-riffs"),
    },
    {
      type: "action",
      label: "My Profile",
      onClick: () => handleProfileClick(user.id),
    },
    {
      type: "action",
      label: "My Account",
      onClick: () => router.push("/account"),
    },
    {
      type: "action",
      label: "Log out",
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ];

  return (
    <Dropdown
      trigger={<Avatar user={user} size={40} borderColor="#FFFFFF" />}
      items={items}
      align="right"
    />
  );
}
