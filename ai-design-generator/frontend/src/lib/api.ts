const API_BASE = '/api';

export interface Template {
  id: string;
  name: string;
  filename: string;
  category: string | null;
  subcategory: string | null;
  width: number;
  height: number;
  text_layers: LayerInfo[];
  image_layers: LayerInfo[];
  thumbnail_path: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LayerInfo {
  name: string;
  content: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  layer_type: string;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  per_page: number;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  generation_id: string | null;
  output_url: string | null;
  template_used: { id: string; name: string } | null;
  status: string;
}

// Templates API
export async function getTemplates(params?: {
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<TemplateListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set('category', params.category);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE}/templates?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`${API_BASE}/templates/${id}`);
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
}

export async function uploadTemplate(
  file: File,
  name: string,
  category?: string,
  tags?: string[]
): Promise<Template> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (category) formData.append('category', category);
  if (tags) formData.append('tags', tags.join(','));

  const response = await fetch(`${API_BASE}/templates/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload template');
  }

  return response.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete template');
}

export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/templates/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  return data.categories;
}

// Chat API
export async function sendChatMessage(
  message: string,
  conversationId?: string,
  language: string = 'ar'
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      language,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }

  return response.json();
}

// Utility functions
export function getTemplateImageUrl(templateId: string): string {
  return `${API_BASE}/templates/${templateId}/thumbnail`;
}

export function getOutputUrl(filename: string): string {
  return `${API_BASE}/outputs/${filename}`;
}
