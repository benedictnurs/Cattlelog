import { useEffect, useState } from "react";

export function useIsDesktop(threshold = 1024) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= threshold);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= threshold);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [threshold]);

  return isDesktop;
}
