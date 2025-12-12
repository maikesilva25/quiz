// Utilitário para garantir URLs únicas de imagens (evitar cache)
export const getUniqueImageUrl = (url: string, userId?: string): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const uniqueId = userId || 'default';
  return `${url}${separator}_t=${timestamp}&_u=${uniqueId}`;
};

