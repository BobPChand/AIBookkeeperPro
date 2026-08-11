// Base44 entity API helper functions
const BASE_URL = 'https://6a336a00b083ccbe02ccfade.api.base44.com';

export interface EntityResponse {
  data: any[];
  has_more: boolean;
}

export const read_entities = async (entityName: string, params?: {
  limit?: number;
  skip?: number;
  query?: Record<string, any>;
  sort?: string;
  fields?: string[];
}): Promise<any[]> => {
  const url = new URL(`${BASE_URL}/entities/${entityName}`);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.skip) url.searchParams.set('skip', String(params.skip));
  if (params?.sort) url.searchParams.set('sort', params.sort);
  if (params?.fields) url.searchParams.set('fields', params.fields.join(','));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`Failed to read ${entityName}`);
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const create_entity = async (entityName: string, record: Record<string, any>): Promise<any> => {
  const response = await fetch(`${BASE_URL}/entities/${entityName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`Failed to create ${entityName}`);
  return response.json();
};

export const update_entity = async (entityName: string, id: string, data: Record<string, any>): Promise<any> => {
  const response = await fetch(`${BASE_URL}/entities/${entityName}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update ${entityName}`);
  return response.json();
};

export const delete_entity = async (entityName: string, id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/entities/${entityName}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Failed to delete ${entityName}`);
};
