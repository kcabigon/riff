"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/shared/Avatar";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";

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
  const { createDraft } = useDraftCreation();

  const items: DropdownItem[] = [
    {
      type: "action",
      label: "+ New Draft",
      onClick: () => createDraft(),
    },
    { type: "divider" },
    {
      type: "action",
      label: "My Writing",
      onClick: () => router.push("/my/writing"),
    },
    {
      type: "action",
      label: "My Profile",
      onClick: () => handleProfileClick(user.id),
    },
    {
      type: "action",
      label: "My Account",
      onClick: () => router.push("/settings"),
    },
    { type: "divider" },
    {
      type: "action",
      label: "Log out",
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ];

  return (
    <Dropdown
      trigger={
        <Avatar
          user={user}
          size={40}
          showBorder={true}
          borderColor="#FFFFFF"
          borderWidth={2}
        />
      }
      items={items}
      align="right"
    />
  );
}
