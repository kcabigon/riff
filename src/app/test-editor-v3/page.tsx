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
import { useState, useRef, useEffect } from 'react';
import './editor.css';

export default function TestEditorV3() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [title, setTitle] = useState('Untitled piece');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea when title changes or window resizes
  useEffect(() => {
    const resizeTextarea = () => {
      if (titleRef.current) {
        // Reset height to auto to get the correct scrollHeight
        titleRef.current.style.height = 'auto';
        // Set to scrollHeight to fit content
        titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(resizeTextarea);

    window.addEventListener('resize', resizeTextarea);

    return () => window.removeEventListener('resize', resizeTextarea);
  }, [title]);

  // Auto-save title after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate auto-save for title change
      setSaveStatus('saving');
      setTimeout(() => {
        setSaveStatus('saved');
      }, 300);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, [title]);

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const readLengthMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#2c2d30',
      padding: '32px 16px 0',
      boxSizing: 'border-box',
    }}>
      {/* Canvas: max-width 880px container with all editor sections */}
      <div style={{
        width: '100%',
        maxWidth: '880px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexGrow: 1,
        minHeight: 0, // Important for flex children to scroll
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {/* Toolbar: Sticky at top with horizontal scroll */}
        <div style={{
          height: '48px',
          borderBottom: '0.5px solid #cccccc',
          position: 'sticky',
          top: 0,
          background: '#2c2d30',
          zIndex: 10,
          flexShrink: 0,
          padding: '8px 16px'
        }}>
          <div className="toolbar-container" style={{
            display: 'flex',
            gap: '8px',
            height: '48px',
            alignItems: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '8px 16px',
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
                border: '0.5px solid transparent',
                background: editor.isActive('bold') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('bold')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('bold')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('italic') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('italic')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('italic')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('underline') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('underline')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('underline')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('strike') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('strike')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('strike')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('heading', { level: 1 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 1 })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 1 })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('heading', { level: 2 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 2 })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 2 })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('heading', { level: 3 }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('heading', { level: 3 })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('heading', { level: 3 })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('bulletList') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('bulletList')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('bulletList')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('orderedList') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('orderedList')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('orderedList')) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive({ textAlign: 'left' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'left' })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'left' })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive({ textAlign: 'center' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'center' })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'center' })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive({ textAlign: 'right' }) ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive({ textAlign: 'right' })) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive({ textAlign: 'right' })) e.currentTarget.style.border = '0.5px solid transparent'; }}
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
                border: '0.5px solid transparent',
                background: editor.isActive('link') ? '#e5e7eb' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!editor.isActive('link')) e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { if (!editor.isActive('link')) e.currentTarget.style.border = '0.5px solid transparent'; }}
              title="Link"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#fff"/>
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
                border: '0.5px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = '0.5px solid transparent'; }}
              title="Image"
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
                  editor.chain().focus().setYoutubeVideo({ src: url }).run();
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: '0.5px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = '0.5px solid transparent'; }}
              title="YouTube"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" fill="#fff"/>
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
                border: '0.5px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.border = '0.5px solid #ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = '0.5px solid transparent'; }}
              title="Spotify"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.73 14.4c-.15.25-.42.35-.68.25-1.87-1.15-4.22-1.41-6.99-.77-.27.06-.54-.09-.6-.36-.06-.27.09-.54.36-.6 3.04-.7 5.67-.4 7.73.89.26.15.35.42.18.59zm.97-2.16c-.19.3-.58.4-.88.21-2.14-1.32-5.41-1.7-7.95-.93-.32.1-.66-.08-.76-.4-.1-.32.08-.66.4-.76 2.91-.88 6.55-.45 8.97 1.06.3.19.4.58.22.82zm.08-2.24c-2.57-1.53-6.81-1.67-9.26-.92-.39.12-.8-.11-.92-.5-.12-.39.11-.8.5-.92 2.81-.86 7.51-.7 10.51 1.06.36.21.48.68.27 1.04-.21.36-.68.48-1.1.24z" fill="#fff"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Editor: Flexible height with vertical scroll */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Important for flex child to be scrollable
          overflowY: 'auto',
        }}>
          {/* Title Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px 16px',
          }}>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled piece"
              style={{
                fontFamily: 'var(--font-playfair), serif',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                textAlign: 'center',
                width: '100%',
                maxWidth: '100%',
                padding: 0,
                resize: 'none',
                overflow: 'hidden',
                lineHeight: '1.2',
                minHeight: '38px',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                boxSizing: 'border-box',
              }}
            />
            <p style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '14px',
              color: '#bbbbbb',
              margin: 0,
            }}>
              <span style={{ fontWeight: 'bold' }}>{wordCount}</span> words • <span style={{ fontWeight: 'bold' }}>{readLengthMin}</span> min read
            </p>
          </div>

          {/* Editor Content */}
          <div style={{
            padding: '0 16px 24px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div className="tiptap-editor">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Status Bar: Sticky at bottom */}
        <div style={{
          height: '40px',
          borderTop: '0.5px solid #cccccc',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 32px',
          position: 'sticky',
          bottom: 0,
          background: '#2c2d30',
          zIndex: 10,
          flexShrink: 0,
        }}>
          {/* Save status */}
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
  );
}
