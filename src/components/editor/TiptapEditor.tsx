'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Spotify } from './extensions/Spotify';
import { useEffect, useCallback, useState } from 'react';
import EditorToolbar from './EditorToolbar';

interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => Promise<void> | void;
  placeholder?: string;
  editable?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export default function TiptapEditor({
  content,
  onUpdate,
  placeholder = 'Start writing...',
  editable = true,
  autoSave = false,
  autoSaveDelay = 500,
}: TiptapEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
      }),
      Spotify,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      if (autoSave) {
        // Clear existing timeout
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // Set status to unsaved
        setSaveStatus('unsaved');

        // Set new timeout for auto-save
        const timeout = setTimeout(async () => {
          setSaveStatus('saving');

          try {
            await onUpdate(html);
            setSaveStatus('saved');

            // Auto-hide "Saved" status after 2 seconds
            setTimeout(() => {
              setSaveStatus('saved');
            }, 2000);
          } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('unsaved');
          }
        }, autoSaveDelay);

        setSaveTimeout(timeout);
      } else {
        onUpdate(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  // Update editor content when prop changes (e.g., loading different piece)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Update save status from parent
  const updateSaveStatus = useCallback((status: 'saved' | 'saving' | 'unsaved') => {
    setSaveStatus(status);
  }, []);

  // Expose updateSaveStatus to parent via ref (could use forwardRef)
  useEffect(() => {
    if (editor) {
      (editor as any).updateSaveStatus = updateSaveStatus;
    }
  }, [editor, updateSaveStatus]);

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();

  return (
    <div className="relative border rounded-lg overflow-hidden bg-white">
      {editable && <EditorToolbar editor={editor} />}

      <EditorContent editor={editor} />

      {/* Editor stats and status bar */}
      <div className="sticky bottom-0 bg-white border-t px-8 py-2 flex justify-between items-center text-sm text-gray-500">
        <div>
          <span>{wordCount} words</span>
        </div>

        {autoSave && (
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
