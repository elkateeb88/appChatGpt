'use client';

import { Download, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';

interface DesignPreviewProps {
  outputUrl: string | null;
}

export function DesignPreview({ outputUrl }: DesignPreviewProps) {
  const handleDownload = async () => {
    if (!outputUrl) return;

    try {
      const response = await fetch(outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">معاينة التصميم</h2>
        {outputUrl && (
          <Button onClick={handleDownload} size="sm">
            <Download className="h-4 w-4 ml-2" />
            تحميل PNG
          </Button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-muted/50">
        {outputUrl ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={outputUrl}
              alt="Generated design"
              className="max-w-full max-h-[calc(100vh-20rem)] object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>التصميم سيظهر هنا</p>
            <p className="text-sm mt-1">أرسل رسالة لإنشاء تصميم جديد</p>
          </div>
        )}
      </div>
    </div>
  );
}
