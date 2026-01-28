'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateCard } from '@/components/template-card';
import { UploadZone } from '@/components/upload-zone';
import {
  Template,
  getTemplates,
  deleteTemplate,
  getCategories,
} from '@/lib/api';

export default function LibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setTemplates(response.templates);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التصميم؟')) return;

    try {
      await deleteTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">مكتبة التصاميم</h1>
          <p className="text-muted-foreground mt-1">
            {total} تصميم في المكتبة
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4 ml-2" />
          رفع جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            الكل
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">لا توجد تصاميم</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ برفع ملفات PSD لإنشاء مكتبتك
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 ml-2" />
            رفع أول تصميم
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <UploadZone
            onUploadSuccess={() => {
              setShowUpload(false);
              fetchTemplates();
              fetchCategories();
            }}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}
    </div>
  );
}
