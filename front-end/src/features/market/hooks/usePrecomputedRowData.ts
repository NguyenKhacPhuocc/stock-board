import { useRef, useEffect, useState } from "react";


// Hook để quản lý flash animation cho một cell
export function useFlashAnimation(compareValue: unknown, triggerDeps: unknown[] = [compareValue]) {
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const prevValueRef = useRef<unknown>(undefined);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstEffectRef = useRef(true);

  useEffect(() => {
    if (isFirstEffectRef.current) {
      prevValueRef.current = compareValue;
      isFirstEffectRef.current = false;
      return;
    }

    if (compareValue === prevValueRef.current) {
      return;
    }

    prevValueRef.current = compareValue;

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    // Start flash in next frame
    requestAnimationFrame(() => setIsFlashing(true));

    flashTimeoutRef.current = setTimeout(() => {
      setIsFlashing(false);
    }, 1000);

    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, triggerDeps);

  return isFlashing;
}
