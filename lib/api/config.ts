export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV?.NEXT_PUBLIC_API_URL) {
    return (window as any).__ENV.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8080/api-fallback";
};
