/* ============================================================
   Bluegrass Medicare — Shared Authentication Helper
   Include this file on every page that requires login:
   <script src="auth.js"></script>
   ============================================================ */

const AUTH_SUPABASE_URL = 'https://sfxcpayhnqvyanluzhge.supabase.co';
const AUTH_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeGNwYXlobnF2eWFubHV6aGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjg1MjMsImV4cCI6MjA5Mjk0NDUyM30._jUESsqL6JDDWYgZM9jZ13CqkjPXrgNK3ML3Wp2Mu2E';

const SESSION_KEY = 'bgm_session';
const INACTIVITY_LIMIT_MS = 15 * 60 * 60 * 1000; // 15 hours

function saveSession(authResponse) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    access_token: authResponse.access_token,
    refresh_token: authResponse.refresh_token,
    email: authResponse.user ? authResponse.user.email : '',
    last_activity: Date.now()
  }));
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function touchSession() {
  const s = getSession();
  if (s) {
    s.last_activity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }
}

/**
 * Call at the top of any protected page. Redirects to login.html if there's
 * no session or the session has been inactive longer than the allowed window.
 * Returns true if the session is valid (and refreshes the inactivity clock).
 */
function checkSession() {
  const s = getSession();
  if (!s || !s.access_token) {
    window.location.href = 'login.html';
    return false;
  }
  const elapsed = Date.now() - (s.last_activity || 0);
  if (elapsed > INACTIVITY_LIMIT_MS) {
    clearSession();
    window.location.href = 'login.html?expired=1';
    return false;
  }
  touchSession();
  return true;
}

/**
 * Attempts to log in with Supabase Auth. Throws an Error with a readable
 * message on failure. On success, stores the session and returns the raw
 * auth response.
 */
async function login(email, password) {
  const resp = await fetch(`${AUTH_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': AUTH_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || data.msg || 'Login failed. Check your email and password.');
  }
  saveSession(data);
  return data;
}

function logout() {
  clearSession();
  window.location.href = 'login.html';
}
