import { HIGHLIGHT_TIMEOUT } from "@/constants/exchanges";
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

    // Reset highlight state to ensure re-render on every update
    setIsFlashing(false);

    // Start flash animation in next frame
    requestAnimationFrame(() => {
      setIsFlashing(true);
    });

    // Turn off highlight after 2000ms (HIGHLIGHT_TIMEOUT)
    flashTimeoutRef.current = setTimeout(() => {
      setIsFlashing(false);
    }, HIGHLIGHT_TIMEOUT);

    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, triggerDeps);

  return isFlashing;
}
