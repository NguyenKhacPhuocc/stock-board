import { HIGHLIGHT_TIMEOUT } from "@/constants/exchanges";
import { useRef, useEffect, useState } from "react";


// Hook để quản lý flash animation cho một cell
export function useFlashAnimation(compareValue: unknown, triggerDeps: unknown[] = [compareValue]) {
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const prevValueRef = useRef<unknown>(undefined);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimestampRef = useRef<number>(0);
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

    // Mark flash timestamp
    const flashId = Date.now();
    flashTimestampRef.current = flashId;

    // Reset and start flash
    setIsFlashing(false);

    requestAnimationFrame(() => {
      if (flashTimestampRef.current === flashId) {
        setIsFlashing(true);
      }
    });

    // Turn off highlight after HIGHLIGHT_TIMEOUT
    flashTimeoutRef.current = setTimeout(() => {
      if (flashTimestampRef.current === flashId) {
        setIsFlashing(false);
      }
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
