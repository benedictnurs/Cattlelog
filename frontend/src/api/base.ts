export const API_BASE_URL: string = (() => {
  const url = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!url) {
    const msg = "VITE_API_BASE_URL is not set. Define it in your .env files.";
    console.error(msg);
    throw new Error(msg);
  }
  return url;
})();

export const API_ALL_COURSES_URL: string = (() => {
  const url = import.meta.env.VITE_API_ALL_COURSES_URL as string | undefined;
  if (!url) {
    const msg =
      "VITE_API_ALL_COURSES_URL is not set. Define it in your .env files.";
    console.error(msg);
    throw new Error(msg);
  }
  return url;
})();
