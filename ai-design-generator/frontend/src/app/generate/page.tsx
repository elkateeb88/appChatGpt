'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { DesignPreview } from '@/components/design-preview';

export default function GeneratePage() {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Chat Section */}
        <div className="border-l h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">إنشاء تصميم جديد</h1>
            <p className="text-sm text-muted-foreground">
              أخبرني ماذا تريد وسأنشئ لك التصميم
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface onOutputGenerated={setOutputUrl} />
          </div>
        </div>

        {/* Preview Section */}
        <div className="h-full hidden lg:flex flex-col">
          <DesignPreview outputUrl={outputUrl} />
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {outputUrl && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4">
          <a
            href={outputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-primary text-primary-foreground text-center py-3 rounded-lg shadow-lg"
          >
            عرض التصميم
          </a>
        </div>
      )}
    </div>
  );
}
