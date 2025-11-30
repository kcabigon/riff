'use client';

import { useState } from 'react';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Start writing your piece here...</p>');

  const handleUpdate = async (html: string) => {
    console.log('Content updated:', html);
    setContent(html);

    // Simulate auto-save to API
    // In production, this would call the /api/pieces/[id]/autosave endpoint
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tiptap Editor Test
          </h1>
          <p className="text-gray-600">
            Test the rich text editor with auto-save, formatting, and media embeds
          </p>
        </div>

        <TiptapEditor
          content={content}
          onUpdate={handleUpdate}
          placeholder="Start writing your masterpiece..."
          editable={true}
          autoSave={true}
          autoSaveDelay={1000}
        />

        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">HTML Output:</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
            {content}
          </pre>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">
            Features to Test:
          </h2>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Bold, Italic, Strikethrough formatting</li>
            <li>Headings (H1, H2, H3)</li>
            <li>Bullet and numbered lists</li>
            <li>Text alignment (left, center, right)</li>
            <li>Links (select text, click link button)</li>
            <li>Image upload (click image button)</li>
            <li>YouTube embeds (click YouTube button, paste URL)</li>
            <li>Spotify embeds (click Spotify button, paste track/album/playlist URL)</li>
            <li>Delete media (click on image/video/embed, then click trash icon)</li>
            <li>Horizontal rules</li>
            <li>Auto-save (watch the status indicator - it will show "Saving..." then "Saved")</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
