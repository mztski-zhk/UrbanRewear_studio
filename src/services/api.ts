// API Service for UrbanRewear
const BASE_URL = 'https://ur.mztski-zhk.cc/api/v1';

class ApiError extends Error {
  code: string;
  requestId?: string;
  status: number;
  detail?: string;
  context?: Record<string, unknown>;

  constructor(status: number, body: unknown) {
    const err = (body as { error?: { code?: string; message?: string; request_id?: string; detail?: string; context?: Record<string, unknown> } })?.error || {};
    super(err.message || 'Request failed');
    this.code = err.code || 'UNKNOWN';
    this.requestId = err.request_id;
    this.status = status;
    this.detail = err.detail;
    this.context = err.context;
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

// Auth
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

export interface SignupResponse {
  message: string;
  id: string;
}

export async function signup(data: SignupData): Promise<SignupResponse> {
  return request<SignupResponse>('/users/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// User Profile
export interface HomeAddress {
  address?: string;
  street?: string;
  city?: string;
  country_or_region?: string;
  state?: string;
  zip_code?: string;
  address2?: string | null;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  phone_num?: string;
  homeaddress?: HomeAddress;
  disabled: boolean;
}

export async function getProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>('/users/me', {}, token);
}

export async function updateProfile(uid: string, data: Partial<UserProfile>, token: string) {
  return request(`/users/${uid}`, { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function changePassword(uid: string, newPassword: string, token: string) {
  return request(`/users/${uid}`, {
    method: 'PUT',
    body: JSON.stringify({ new_password: newPassword }),
  }, token);
}

export async function deleteAccount(uid: string, token: string) {
  return request(`/users/${uid}`, { method: 'DELETE' }, token);
}

// Cloth Analysis
export interface ClothDetails {
  image?: string;
  is_cloth?: boolean;
  cloth_type: string;
  cloth_fabric: string;
  cloth_color?: string;
  is_dirty_or_damaged: boolean;
  damage_description?: string;
  suitable_for_redesign: boolean;
  suitable_for_upcycling: boolean;
}

export interface ClothCondition {
  file_id?: string;
  cloth_details: ClothDetails;
}

export async function analyzeCloth(
  userId: string,
  frontImage: File,
  backImage: File,
  token?: string | null,
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
  token?: string | null,
  useLocal = false,
  fileId?: string
): Promise<RedesignResult> {
  const formData = new FormData();
  formData.append('before_cloth_front', images.before_front);
  formData.append('before_cloth_back', images.before_back);
  if (images.after_front) formData.append('after_cloth_front', images.after_front);
  if (images.after_back) formData.append('after_cloth_back', images.after_back);
  const prefix = useLocal ? '/localcloth' : '/cloth';
  const queryString = useLocal && fileId ? `?file_id=${encodeURIComponent(fileId)}` : '';
  return request<RedesignResult>(`${prefix}/${userId}/redesign/${queryString}`, {
    method: 'PUT',
    body: formData,
  }, token);
}

// Objects
export interface ClothObject {
  id: string;
  user_id: string;
  file_available: string[];
  cloth_status: {
    type?: string;
    cloth_type?: string;
    cloth_fabric?: string;
    is_dirty_or_damaged?: boolean;
    damage_description?: string;
    suitable_for_redesign?: boolean;
    suitable_for_upcycling?: boolean;
  };
  created_at: string;
}

export interface UserObjectsResponse {
  objects: ClothObject[];
}

export async function getUserObjects(userId: string, token: string): Promise<UserObjectsResponse> {
  return request<UserObjectsResponse>(`/obj/${userId}`, {}, token);
}

// Search
export interface SearchResult {
  id: string;
  user_id: string;
  file_available: string[];
  cloth_status: {
    type?: string;
    cloth_type?: string;
    cloth_fabric?: string;
    is_dirty_or_damaged?: boolean;
    suitable_for_redesign?: boolean;
    suitable_for_upcycling?: boolean;
    color?: string;
  };
  relevance_rank?: number;
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

export async function searchSimple(query: string, token: string, limit = 20, offset = 0): Promise<SearchResponse> {
  return request<SearchResponse>('/search/simple', {
    method: 'POST',
    body: JSON.stringify({ query, limit, offset }),
  }, token);
}

export async function searchAdvanced(params: AdvancedSearchParams, token: string): Promise<SearchResponse> {
  return request<SearchResponse>('/search/advanced', {
    method: 'POST',
    body: JSON.stringify(params),
  }, token);
}

export interface HighlightedSearchResult extends SearchResult {
  fabric_highlight?: string;
}

export interface HighlightedSearchResponse {
  results: HighlightedSearchResult[];
  total_returned: number;
  query: string;
  limit: number;
  offset: number;
  has_more: boolean;
}

export async function searchHighlighted(query: string, token: string, limit = 20, offset = 0): Promise<HighlightedSearchResponse> {
  return request<HighlightedSearchResponse>('/search/highlighted', {
    method: 'POST',
    body: JSON.stringify({ query, limit, offset }),
  }, token);
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

export async function searchAutocomplete(q: string, token: string, limit = 10): Promise<AutocompleteResponse> {
  return request<AutocompleteResponse>(`/search/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`, {}, token);
}

export async function searchFuzzy(q: string, token: string, limit = 20): Promise<SearchResponse> {
  return request<SearchResponse>(`/search/fuzzy?q=${encodeURIComponent(q)}&limit=${limit}`, {}, token);
}

export async function searchQuick(q: string, token: string, limit = 20, publicOnly = false): Promise<SearchResponse> {
  return request<SearchResponse>(`/search/quick?q=${encodeURIComponent(q)}&limit=${limit}&public_only=${publicOnly}`, {}, token);
}

export interface SearchHealthResponse {
  status: string;
  service: string;
  features: string[];
}

export async function searchHealth(token: string): Promise<SearchHealthResponse> {
  return request<SearchHealthResponse>('/search/health', {}, token);
}

// Health
export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('https://ur.mztski-zhk.cc/api/v1/health');
  if (!res.ok) return { status: 'unreachable' };
  return res.json();
}

export { ApiError };
