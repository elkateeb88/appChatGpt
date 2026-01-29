'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { uploadTemplate } from '@/lib/api';

interface UploadZoneProps {
  onUploadSuccess?: () => void;
  onClose?: () => void;
}

export function UploadZone({ onUploadSuccess, onClose }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const psdFile = acceptedFiles[0];
      setFile(psdFile);
      // Set default name from filename
      setName(psdFile.name.replace('.psd', ''));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/vnd.adobe.photoshop': ['.psd'],
      'application/x-photoshop': ['.psd'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !name) {
      setError('الرجاء اختيار ملف وإدخال اسم');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      await uploadTemplate(file, name, category || undefined, tagList.length > 0 ? tagList : undefined);

      onUploadSuccess?.();
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'فشل رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">رفع Template جديد</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        {file ? (
          <p className="font-medium">{file.name}</p>
        ) : (
          <>
            <p className="font-medium">اسحب ملف PSD هنا</p>
            <p className="text-sm text-muted-foreground mt-1">أو اضغط للاختيار</p>
          </>
        )}
      </div>

      {/* Form */}
      {file && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">الاسم</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم التصميم"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">التصنيف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">اختر تصنيف...</option>
              <option value="post">Post (1080x1080)</option>
              <option value="story">Story (1080x1920)</option>
              <option value="cover">Cover</option>
              <option value="banner">Banner</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">الوسوم</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="عرض, خصم, قهوة (مفصولة بفواصل)"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                إلغاء
              </Button>
            )}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الرفع...
                </>
              ) : (
                'رفع'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
