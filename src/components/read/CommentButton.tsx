"use client";

import PrimaryButton from "@/components/PrimaryButton";
import { ComponentProps } from "react";

type CommentButtonProps = ComponentProps<typeof PrimaryButton>;

export default function CommentButton({ style, ...props }: CommentButtonProps) {
  return (
    <PrimaryButton
      size="sm"
      {...props}
      style={{
        height: "32px",
        padding: "4px 20px",
        fontSize: "13px",
        ...style,
      }}
    />
  );
}
