'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import ResizableImage from 'tiptap-extension-resize-image';
import Youtube from '@tiptap/extension-youtube';
import { Spotify } from '@/components/editor/extensions/Spotify';
import { useState, useRef } from 'react';
import './editor.css';

export default function TestEditorV2() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing here...',
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        inline: false,
        width: '100%',
        HTMLAttributes: {
          class: 'youtube-video',
        },
      }),
      Spotify.configure({
        HTMLAttributes: {
          style: 'border-radius:12px',
        },
      }),
    ],
    content: '',
    editable: true,
    onUpdate: () => {
      setSaveStatus('unsaved');
      setTimeout(() => {
        setSaveStatus('saving');
        setTimeout(() => {
          setSaveStatus('saved');
        }, 300);
      }, 500);
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const readLengthMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', boxSizing: 'border-box' }}>
      {/* Container with max dimensions from Figma but responsive height */}
      <div style={{
        width: '1440px',
        maxWidth: '100%',
        height: '100%',
        maxHeight: '1024px',
        background: 'transparent',
        //border: '1px solid #e5e7eb',
        border: 'none',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Inner padding: 12px all sides, with dark background */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '40px 12px 0',
          height: '100%',
          boxSizing: 'border-box',
          background: '#2c2d30',
          borderRadius: '8px',
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1)',
        }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {/* Title Section - centered with word count below */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px 16px',
            flexShrink: 0,
          }}>
            <h1 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0,
            }}>
              Untitled piece
            </h1>
            <p style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '14px',
              color: '#bbbbbb',
              margin: 0,
            }}>
              <span style={{ fontWeight: 'bold' }}>{wordCount}</span> words • <span style={{ fontWeight: 'bold' }}>{readLengthMin}</span> min read
            </p>
          </div>

          {/* Toolbar: 48px height, 0.5px bottom border */}
          <div style={{
            height: '48px',
            borderBottom: '0.5px solid #cccccc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            flexShrink: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
          }}>
            {/* Bold */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('bold') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('bold')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('bold')) e.currentTarget.style.background = 'transparent'; }}
              title="Bold"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>B</span>
            </button>

            {/* Italic */}
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('italic') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('italic')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('italic')) e.currentTarget.style.background = 'transparent'; }}
              title="Italic"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', fontStyle: 'italic', color: '#fff' }}>I</span>
            </button>

            {/* Underline */}
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('underline') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('underline')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('underline')) e.currentTarget.style.background = 'transparent'; }}
              title="Underline"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', textDecoration: 'underline', color: '#fff' }}>U</span>
            </button>

            {/* Strikethrough */}
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('strike') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('strike')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('strike')) e.currentTarget.style.background = 'transparent'; }}
              title="Strikethrough"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', textDecoration: 'line-through', color: '#fff' }}>S</span>
            </button>

            {/* H1 */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('heading', { level: 1 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 1 })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 1 })) e.currentTarget.style.background = 'transparent'; }}
              title="Heading 1"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', color: '#fff' }}>H1</span>
            </button>

            {/* H2 */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('heading', { level: 2 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 2 })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 2 })) e.currentTarget.style.background = 'transparent'; }}
              title="Heading 2"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', color: '#fff' }}>H2</span>
            </button>

            {/* H3 */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('heading', { level: 3 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 3 })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 3 })) e.currentTarget.style.background = 'transparent'; }}
              title="Heading 3"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', color: '#fff' }}>H3</span>
            </button>

            {/* Bullet List */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('bulletList') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('bulletList')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('bulletList')) e.currentTarget.style.background = 'transparent'; }}
              title="Bullet List"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', color: '#fff' }}>•</span>
            </button>

            {/* Numbered List */}
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('orderedList') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('orderedList')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('orderedList')) e.currentTarget.style.background = 'transparent'; }}
              title="Numbered List"
            >
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '14px', color: '#fff' }}>1.</span>
            </button>

            {/* Align Left */}
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive({ textAlign: 'left' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'left' })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'left' })) e.currentTarget.style.background = 'transparent'; }}
              title="Align Left"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 19h18v-2H3v2zm0-4h12v-2H3v2zm0-6v2h18V9H3zm0-4v2h12V5H3z" fill="#fff"/>
              </svg>
            </button>

            {/* Align Center */}
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive({ textAlign: 'center' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'center' })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'center' })) e.currentTarget.style.background = 'transparent'; }}
              title="Align Center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 19h18v-2H3v2zm4-4h10v-2H7v2zM3 9v2h18V9H3zm4-4v2h10V5H7z" fill="#fff"/>
              </svg>
            </button>

            {/* Align Right */}
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive({ textAlign: 'right' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'right' })) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'right' })) e.currentTarget.style.background = 'transparent'; }}
              title="Align Right"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 19h18v-2H3v2zm6-4h12v-2H9v2zM3 9v2h18V9H3zm6-4v2h12V5H9z" fill="#fff"/>
              </svg>
            </button>

            {/* Link */}
            <button
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: editor.isActive('link') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!editor.isActive('link')) e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { if (!editor.isActive('link')) e.currentTarget.style.background = 'transparent'; }}
              title="Add Link"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2z" fill="#fff"/>
                <path d="M8 11h8v2H8z" fill="#fff"/>
              </svg>
            </button>

            {/* Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="Add Image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#fff"/>
              </svg>
            </button>

            {/* YouTube */}
            <button
              onClick={() => {
                const url = window.prompt('Enter YouTube URL:');
                if (url) {
                  editor.commands.setYoutubeVideo({ src: url });
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="Add YouTube Video"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </button>

            {/* Spotify */}
            <button
              onClick={() => {
                const url = window.prompt('Enter Spotify URL:');
                if (url) {
                  editor.commands.setSpotifyEmbed({ src: url });
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="Add Spotify Embed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </button>
          </div>

          {/* Editor Area: 64px horizontal padding, 48px vertical padding - flexible height with scroll */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '0px 12px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'left',
            minHeight: 0, // Important for flex child to be scrollable
          }}>
            <div className="tiptap-editor">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Status Bar: 40px height - stays at bottom */}
          <div style={{
            height: '40px',
            borderTop: '0.5px solid #cccccc',
            display: 'flex',
            alignItems: 'center',
            padding: '8px 32px',
            flexShrink: 0,
          }}>
            {/* Save status - left side only */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '8px',
                background: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'saving' ? '#eab308' : '#9ca3af',
                animation: saveStatus === 'saving' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-playfair), serif',
                fontSize: '14px',
                color: '#bbbbbb',
              }}>
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
