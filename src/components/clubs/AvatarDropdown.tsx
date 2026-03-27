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
      label: "Profile",
      onClick: () => handleProfileClick(user.id),
    },
    {
      type: "action",
      label: "Settings",
      onClick: () => router.push("/settings"),
    },
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
          borderWidth={1}
        />
      }
      items={items}
      align="right"
    />
  );
}
