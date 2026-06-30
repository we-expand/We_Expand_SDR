export function apiUrl(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
