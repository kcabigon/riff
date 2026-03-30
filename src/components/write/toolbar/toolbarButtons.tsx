import React from "react";
import { Editor } from "@tiptap/react";
import { TextLabel } from "./ToolbarButton";

export interface ToolbarButtonConfig {
  key: string;
  title: string;
  isActive: (editor: Editor) => boolean;
  action: (
    editor: Editor,
    fileInputRef?: React.RefObject<HTMLInputElement | null>
  ) => void;
  icon: (isActive: boolean) => React.ReactNode;
}

export const formattingButtons: ToolbarButtonConfig[] = [
  {
    key: "bold",
    title: "Bold",
    isActive: (editor) => editor.isActive("bold"),
    action: (editor) => editor.chain().focus().toggleBold().run(),
    icon: () => <TextLabel text="B" bold />,
  },
  {
    key: "italic",
    title: "Italic",
    isActive: (editor) => editor.isActive("italic"),
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    icon: () => <TextLabel text="I" italic />,
  },
  {
    key: "underline",
    title: "Underline",
    isActive: (editor) => editor.isActive("underline"),
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
    icon: () => <TextLabel text="U" underline />,
  },
  {
    key: "strike",
    title: "Strikethrough",
    isActive: (editor) => editor.isActive("strike"),
    action: (editor) => editor.chain().focus().toggleStrike().run(),
    icon: () => <TextLabel text="S" strikethrough />,
  },
  {
    key: "h1",
    title: "Heading 1",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    icon: () => <TextLabel text="H1" />,
  },
  {
    key: "h2",
    title: "Heading 2",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    icon: () => <TextLabel text="H2" />,
  },
  {
    key: "h3",
    title: "Heading 3",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    icon: () => <TextLabel text="H3" />,
  },
  {
    key: "bulletList",
    title: "Bullet List",
    isActive: (editor) => editor.isActive("bulletList"),
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    icon: () => <TextLabel text={"\u2022"} />,
  },
  {
    key: "orderedList",
    title: "Numbered List",
    isActive: (editor) => editor.isActive("orderedList"),
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    icon: () => <TextLabel text="1." />,
  },
  {
    key: "alignLeft",
    title: "Align Left",
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    action: (editor) => editor.chain().focus().setTextAlign("left").run(),
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 19h18v-2H3v2zm0-4h12v-2H3v2zm0-6v2h18V9H3zm0-4v2h12V5H3z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    key: "alignCenter",
    title: "Align Center",
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    action: (editor) => editor.chain().focus().setTextAlign("center").run(),
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 19h18v-2H3v2zm4-4h10v-2H7v2zM3 9v2h18V9H3zm4-4v2h10V5H7z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    key: "alignRight",
    title: "Align Right",
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    action: (editor) => editor.chain().focus().setTextAlign("right").run(),
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 19h18v-2H3v2zm6-4h12v-2H9v2zM3 9v2h18V9H3zm6-4v2h12V5H9z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    key: "link",
    title: "Link",
    isActive: (editor) => editor.isActive("link"),
    action: (editor) => {
      const url = window.prompt("Enter URL:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
          fill="#fff"
        />
      </svg>
    ),
  },
];

export const insertButtons: ToolbarButtonConfig[] = [
  {
    key: "image",
    title: "Image",
    isActive: () => false,
    action: (_editor, fileInputRef) => fileInputRef?.current?.click(),
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    key: "youtube",
    title: "YouTube",
    isActive: () => false,
    action: (editor) => {
      const url = window.prompt("Enter YouTube URL:");
      if (url) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      }
    },
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    key: "spotify",
    title: "Spotify",
    isActive: () => false,
    action: (editor) => {
      const url = window.prompt("Enter Spotify URL:");
      if (url) {
        editor.commands.setSpotifyEmbed({ src: url });
      }
    },
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.73 14.4c-.15.25-.42.35-.68.25-1.87-1.15-4.22-1.41-6.99-.77-.27.06-.54-.09-.6-.36-.06-.27.09-.54.36-.6 3.04-.7 5.67-.4 7.73.89.26.15.35.42.18.59zm.97-2.16c-.19.3-.58.4-.88.21-2.14-1.32-5.41-1.7-7.95-.93-.32.1-.66-.08-.76-.4-.1-.32.08-.66.4-.76 2.91-.88 6.55-.45 8.97 1.06.3.19.4.58.22.82zm.08-2.24c-2.57-1.53-6.81-1.67-9.26-.92-.39.12-.8-.11-.92-.5-.12-.39.11-.8.5-.92 2.81-.86 7.51-.7 10.51 1.06.36.21.48.68.27 1.04-.21.36-.68.48-1.1.24z"
          fill="#fff"
        />
      </svg>
    ),
  },
];
