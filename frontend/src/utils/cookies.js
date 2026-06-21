export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; max-age=0; path=/`;
}
