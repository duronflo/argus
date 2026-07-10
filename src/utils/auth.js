const COOKIE_NAME = 'argus_auth';
const COOKIE_DAYS = 100;

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function isAuthenticated(value) {
  return getCookie(COOKIE_NAME) === value;
}

export function authenticate(value) {
  setCookie(COOKIE_NAME, value, COOKIE_DAYS);
}

export function logout() {
  deleteCookie(COOKIE_NAME);
}
