import client from './client';

export const ROLES = [
  { id: 1, name: 'Administrator' },
  { id: 2, name: 'Business Owner' },
  { id: 3, name: 'Store Manager' },
  { id: 4, name: 'Sales Executive' },
];

export function roleName(roleId) {
  const found = ROLES.find((r) => r.id === Number(roleId));
  return found ? found.name : `Role ${roleId}`;
}

// POST /login expects OAuth2PasswordRequestForm — form-encoded body with
// `username` (the user's email) and `password`, NOT JSON.
// Response: { message, access_token, token_type, username, role_id }.
export async function login(email, password) {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const { data } = await client.post('/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return {
    token: data.access_token,
    username: data.username,
    roleId: data.role_id,
  };
}

// POST /register expects JSON: { username, email, password, role_id }.
// Response: { message, username, role }.
export async function register({ username, email, password, role_id }) {
  const { data } = await client.post('/register', { username, email, password, role_id });
  return data;
}

export async function getProfile() {
  const { data } = await client.get('/profile');
  return data.user || data;
}

export function dashboardRouteForRole(roleId) {
  const id = Number(roleId);
  if (id === 1) return '/admin-dashboard';
  if (id === 2) return '/owner-dashboard';
  if (id === 3) return '/manager-dashboard';
  if (id === 4) return '/sales-dashboard';
  return '/login';
}
