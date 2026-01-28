'use client';

import { Template, getTemplateImageUrl } from '@/lib/api';
import { Trash2, Layers, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';

interface TemplateCardProps {
  template: Template;
  onDelete?: (id: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const thumbnailUrl = getTemplateImageUrl(template.id);

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative">
        <img
          src={thumbnailUrl}
          alt={template.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="40">🖼</text></svg>';
          }}
        />

        {/* Delete button overlay */}
        {onDelete && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{template.name}</h3>

        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            {template.text_layers.length} نص
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            {template.image_layers.length} صورة
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {template.category && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {template.category}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {template.width}x{template.height}
          </span>
        </div>
      </div>
    </div>
  );
}
