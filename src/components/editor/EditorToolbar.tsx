"use client";

import { Editor } from "@tiptap/react";
import { useRef } from "react";
import { uploadImage } from "@/lib/upload-image";

interface EditorToolbarProps {
  editor: Editor;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addYouTube = () => {
    const url = window.prompt("Enter YouTube URL:");
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const addSpotify = () => {
    const url = window.prompt("Enter Spotify URL (track, album, or playlist):");
    if (url) {
      editor.commands.setSpotifyEmbed({ src: url });
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border-b bg-gray-50 px-4 py-2 flex flex-wrap gap-1 sticky top-0 z-10">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Text formatting */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive("bold") ? "bg-gray-300 font-bold" : ""
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 italic ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 line-through ${
            editor.isActive("strike") ? "bg-gray-300" : ""
          }`}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`px-3 py-1 rounded hover:bg-gray-200 font-bold ${
            editor.isActive("heading", { level: 1 }) ? "bg-gray-300" : ""
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`px-3 py-1 rounded hover:bg-gray-200 font-bold ${
            editor.isActive("heading", { level: 2 }) ? "bg-gray-300" : ""
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`px-3 py-1 rounded hover:bg-gray-200 font-bold ${
            editor.isActive("heading", { level: 3 }) ? "bg-gray-300" : ""
          }`}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
          title="Numbered List"
        >
          1.
        </button>
      </div>

      {/* Alignment */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "left" }) ? "bg-gray-300" : ""
          }`}
          title="Align Left"
        >
          ⇤
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "center" }) ? "bg-gray-300" : ""
          }`}
          title="Align Center"
        >
          ⇥
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "right" }) ? "bg-gray-300" : ""
          }`}
          title="Align Right"
        >
          ⇥
        </button>
      </div>

      {/* Link */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={setLink}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive("link") ? "bg-gray-300" : ""
          }`}
          title="Add Link"
        >
          🔗
        </button>
      </div>

      {/* Media */}
      <div className="flex gap-1 border-r pr-2">
        <button
          onClick={addImage}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="Add Image"
        >
          🖼️
        </button>
        <button
          onClick={addYouTube}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="Add YouTube Video"
        >
          ▶️
        </button>
        <button
          onClick={addSpotify}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="Add Spotify Embed"
        >
          🎵
        </button>
      </div>

      {/* Delete selected media */}
      {(editor.isActive("image") ||
        editor.isActive("youtube") ||
        editor.isActive("spotify")) && (
        <div className="flex gap-1 border-r pr-2">
          <button
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className="px-3 py-1 rounded hover:bg-red-200 text-red-600"
            title="Delete Selected Media"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Additional formatting */}
      <div className="flex gap-1 border-l pl-2 ml-auto">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="Horizontal Rule"
        >
          ―
        </button>
      </div>
    </div>
  );
}
