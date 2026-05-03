/**
 * Centralized API client for Hackbuddy backend (FastAPI).
 * All requests include the JWT token from localStorage.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('hackbuddy_token');
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {};
  const isFormData = body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    request<{ access_token: string; token_type: string }>('POST', '/auth/register', data, false),
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string }>('POST', '/auth/login', data, false),
  me: () => request<UserProfile>('GET', '/auth/me'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => request<UserProfile>('GET', '/users/me'),
  updateMe: (data: Partial<UserProfile>) => request<UserProfile>('PUT', '/users/me', data),
  getUser: (id: string) => request<UserProfile>('GET', `/users/${id}`),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UserProfile>('POST', '/users/me/avatar', fd);
  },
  uploadCover: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UserProfile>('POST', '/users/me/cover', fd);
  },
  searchUsers: (params: { skills?: string; experience?: string; college?: string }) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<UserProfile[]>('GET', `/users/?${qs}`);
  },
};

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teamsApi = {
  list: () => request<Team[]>('GET', '/teams/'),
  myTeams: () => request<Team[]>('GET', '/teams/my-teams'),
  get: (id: string) => request<Team>('GET', `/teams/${id}`),
  create: (data: Partial<Team>) => request<Team>('POST', '/teams/', data),
  update: (id: string, data: Partial<Team>) => request<Team>('PUT', `/teams/${id}`, data),
  delete: (id: string) => request('DELETE', `/teams/${id}`),
  requestJoin: (teamId: string) => request('POST', `/teams/${teamId}/request-join`),
  getJoinRequests: (teamId: string) => request<JoinRequest[]>('GET', `/teams/${teamId}/join-requests`),
  acceptRequest: (teamId: string, reqId: string) => request('POST', `/teams/${teamId}/join-requests/${reqId}/accept`),
  rejectRequest: (teamId: string, reqId: string) => request('POST', `/teams/${teamId}/join-requests/${reqId}/reject`),
  suggestMembers: (teamId: string) => request<UserProfile[]>('GET', `/teams/${teamId}/suggest-members`),
  inviteMember: (teamId: string, targetUserId: string) => request('POST', `/teams/${teamId}/invite`, { target_user_id: targetUserId }),
  acceptInvite: (teamId: string) => request('POST', `/teams/${teamId}/accept-invite`),
  leaveTeam: (teamId: string) => request<{ message: string }>('POST', `/teams/${teamId}/leave`),
};

// ─── Matches ──────────────────────────────────────────────────────────────────
export const matchesApi = {
  potential: () => request<UserProfile[]>('GET', '/matches/potential'),
  swipe: (target_user_id: string, action: 'like' | 'dislike') =>
    request<{ message: string; match: boolean }>('POST', '/matches/swipe', { target_user_id, action }),
  undo: (target_user_id: string) => request('DELETE', `/matches/undo/${target_user_id}`),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getMessages: (teamId: string, limit = 50, offset = 0) =>
    request<Message[]>('GET', `/chat/messages/${teamId}?limit=${limit}&offset=${offset}`),
  sendMessage: (data: { team_id: string; content: string }) =>
    request<Message>('POST', '/chat/messages', data),
};

// ─── Hackathons ───────────────────────────────────────────────────────────────
export const hackathonsApi = {
  list: () => request<Hackathon[]>('GET', '/hackathons/'),
  get: (id: string) => request<Hackathon>('GET', `/hackathons/${id}`),
  create: (data: Partial<Hackathon>) => request<Hackathon>('POST', '/hackathons/', data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getFlaggedMessages: () => request<Message[]>('GET', '/admin/flagged-messages'),
  getUsersWithWarnings: () => request<UserProfile[]>('GET', '/admin/users/warnings'),
  warnUser: (userId: string, reason: string) => request('POST', '/admin/users/warn', { user_id: userId, reason }),
  suspendUser: (userId: string, reason: string) => request('POST', '/admin/users/suspend', { user_id: userId, reason }),
  unsuspendUser: (userId: string) => request('POST', `/admin/users/${userId}/unsuspend`),
  deleteMessage: (msgId: string) => request('DELETE', `/admin/messages/${msgId}`),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  college?: string;
  bio?: string;
  skills?: string[];
  experience_level?: string;
  hackathon_interests?: string[];
  github_url?: string;
  linkedin_url?: string;
  avatar_url?: string;
  cover_url?: string;
  role?: string;
  warning_count?: number;
  is_suspended?: boolean;
  created_at?: string;
  matching_skills?: string[];
  match_score?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  hackathon_name?: string;
  required_skills?: string[];
  max_members: number;
  created_by: string;
  created_at?: string;
  member_count?: number;
  members?: { role: string; profiles: UserProfile }[];
}

export interface JoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at?: string;
  profiles?: UserProfile;
}

export interface Message {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  is_flagged?: boolean;
  flag_reason?: string;
  created_at?: string;
  sender_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: () => request<Notification[]>('GET', '/notifications/'),
  markAsRead: (id: string) => request<Notification>('PUT', `/notifications/${id}/read`),
  markAllAsRead: () => request<{ message: string }>('PUT', '/notifications/read-all'),
};

export interface FriendEntry {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  is_incoming: boolean;
  friend_profile?: {
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
  };
}

export const friendsApi = {
  list: () => request<FriendEntry[]>('GET', '/friends/'),
  pending: () => request<FriendRequest[]>('GET', '/friends/pending'),
  sendRequest: (userId: string) => request('POST', `/friends/request/${userId}`),
  accept: (requestId: string) => request('POST', `/friends/requests/${requestId}/accept`),
  reject: (requestId: string) => request('POST', `/friends/requests/${requestId}/reject`),
};

export interface Hackathon {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  banner_url?: string;
  prize_pool?: string;
  website_url?: string;
  organizer_id: string;
  is_active?: boolean;
  created_at?: string;
}
