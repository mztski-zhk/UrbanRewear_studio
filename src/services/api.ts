const BASE_URL = 'https://ur.mztski-zhk.cc/api/v1';

class ApiError extends Error {
  code: string;
  requestId?: string;
  status: number;

  constructor(status: number, body: any) {
    const err = body?.error || {};
    super(err.message || 'Request failed');
    this.code = err.code || 'UNKNOWN';
    this.requestId = err.request_id;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);

  return request<TokenResponse>('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

export interface SignupData {
  username: string;
  password: string;
  email: string;
  phone_num?: string;
  homeaddress?: Record<string, string>;
}

export async function signup(data: SignupData) {
  return request('/users/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── User Profile ────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  phone_num?: string;
  homeaddress?: Record<string, any>;
  disabled: boolean;
}

export async function getProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>('/users/me', {}, token);
}

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  phone_num?: string;
  homeaddress?: Record<string, string | null>;
}

export async function updateProfile(uid: string, data: ProfileUpdateData, token: string) {
  return request<{ message: string }>(`/users/${uid}`, { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function changePassword(uid: string, newPassword: string, token: string) {
  return request<{ message: string }>(`/users/${uid}`, {
    method: 'PUT',
    body: JSON.stringify({ new_password: newPassword }),
  }, token);
}

export async function deleteAccount(uid: string, token: string) {
  return request<{ message: string }>(`/users/${uid}`, { method: 'DELETE' }, token);
}

// ─── Cloth Analysis ──────────────────────────────────────────────────
export interface ClothCondition {
  file_id: string;
  condition: {
    cloth_details: {
      image: string;
      cloth_type: string;
      cloth_fabric: string;
      is_dirty_or_damaged: boolean;
      damage_description?: string;
      suitable_for_redesign: boolean;
      suitable_for_upcycling: boolean;
    };
  };
}

export async function analyzeCloth(
  userId: string,
  frontImage: File,
  backImage: File,
  token: string,
  useLocal = false
): Promise<ClothCondition> {
  const formData = new FormData();
  formData.append('cloth_front', frontImage);
  formData.append('cloth_back', backImage);
  const prefix = useLocal ? '/localcloth' : '/cloth';
  return request<ClothCondition>(`${prefix}/${userId}/conditions/`, {
    method: 'POST',
    body: formData,
  }, token);
}

export interface RedesignResult {
  file_id: string;
  after_file_id: string;
  redesign_analysis?: {
    cloth_details: {
      suitable_for_redesign: boolean;
      redesign_suggestions: string[];
    };
  };
}

export async function redesignCloth(
  userId: string,
  images: { before_front: File; before_back: File; after_front?: File; after_back?: File },
  token?: string,
  useLocal = false,
  fileId?: string
): Promise<RedesignResult> {
  const formData = new FormData();
  formData.append('before_cloth_front', images.before_front);
  formData.append('before_cloth_back', images.before_back);
  if (images.after_front) formData.append('after_cloth_front', images.after_front);
  if (images.after_back) formData.append('after_cloth_back', images.after_back);
  const prefix = useLocal ? '/localcloth' : '/cloth';
  const query = useLocal && fileId ? `?file_id=${encodeURIComponent(fileId)}` : '';
  return request<RedesignResult>(`${prefix}/${userId}/redesign/${query}`, {
    method: 'PUT',
    body: formData,
  }, token);
}

// ─── Objects ─────────────────────────────────────────────────────────
export interface ClothObject {
  id: string;
  user_id: string;
  file_available: string[];
  cloth_status: {
    type?: string;
    cloth_type: string;
    cloth_fabric: string;
    is_dirty_or_damaged: boolean;
    damage_description?: string;
    suitable_for_redesign: boolean;
    suitable_for_upcycling: boolean;
  };
  created_at: string;
}

export interface ObjectsResponse {
  objects: ClothObject[];
}

export async function getUserObjects(userId: string, token: string): Promise<ObjectsResponse> {
  return request<ObjectsResponse>(`/obj/${userId}`, {}, token);
}

// ─── Search ──────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  user_id: string;
  file_available: string[];
  cloth_status: {
    cloth_type?: string;
    cloth_fabric?: string;
    color?: string;
    is_dirty_or_damaged?: boolean;
    suitable_for_redesign?: boolean;
    suitable_for_upcycling?: boolean;
  };
  relevance_rank?: number;
  fabric_highlight?: string;
  created_at: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total_returned: number;
  query: string;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface AutocompleteSuggestion {
  suggestion: string;
  field_name: string;
  frequency: number;
  similarity_score: number;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  partial_query: string;
  total_returned: number;
}

export async function searchSimple(query: string, token: string, limit = 20, offset = 0): Promise<SearchResponse> {
  return request<SearchResponse>('/search/simple', {
    method: 'POST',
    body: JSON.stringify({ query, limit, offset }),
  }, token);
}

export interface AdvancedSearchParams {
  query: string;
  user_id?: string;
  is_public_only?: boolean;
  limit?: number;
  offset?: number;
  min_date?: string;
  max_date?: string;
  need_fix?: boolean;
  suitable_for_redesign?: boolean;
  suitable_for_upcycling?: boolean;
  fabric_types?: string[];
  cloth_types?: string[];
  colors?: string[];
}

export async function searchAdvanced(params: AdvancedSearchParams, token: string): Promise<SearchResponse> {
  return request<SearchResponse>('/search/advanced', {
    method: 'POST',
    body: JSON.stringify(params),
  }, token);
}

export async function searchHighlighted(query: string, token: string, limit = 20, offset = 0): Promise<SearchResponse> {
  return request<SearchResponse>('/search/highlighted', {
    method: 'POST',
    body: JSON.stringify({ query, limit, offset }),
  }, token);
}

export async function searchAutocomplete(q: string, token: string, limit = 10): Promise<AutocompleteResponse> {
  return request<AutocompleteResponse>(`/search/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`, {}, token);
}

export async function searchFuzzy(q: string, token: string, limit = 20): Promise<SearchResponse> {
  return request<SearchResponse>(`/search/fuzzy?q=${encodeURIComponent(q)}&limit=${limit}`, {}, token);
}

export async function searchQuick(q: string, token: string, limit = 20, publicOnly = false): Promise<SearchResponse> {
  return request<SearchResponse>(`/search/quick?q=${encodeURIComponent(q)}&limit=${limit}&public_only=${publicOnly}`, {}, token);
}

export async function searchHealth(token: string) {
  return request<{ status: string; service: string; features: string[] }>('/search/health', {}, token);
}

// ─── Health ──────────────────────────────────────────────────────────
export async function healthCheck(): Promise<{ status: string }> {
  return fetch('https://ur.mztski-zhk.cc/health')
    .then(res => res.json() as Promise<{ status: string }>)
    .catch(() => ({ status: 'unreachable' }));
}

export { ApiError };
