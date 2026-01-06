export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV?.NEXT_PUBLIC_API_URL) {
    return (window as any).__ENV.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
};
