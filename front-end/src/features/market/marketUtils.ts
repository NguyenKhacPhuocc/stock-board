import styles from "./components/MarketBoard/MarketBoard.module.scss";

/**
 * Format price from absolute value to decimal (e.g., BSC API: 8110 -> 8.11)
 */
export const formatPrice = (val: any): string => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    return (num / 1000).toFixed(2);
};

/**
 * Format volume (e.g., BSC API: 35600 -> 35.60)
 */
export const formatVol = (val: any): string => {
    if (val === undefined || val === null || val === "" || val === 0) return "";
    const num = Number(val);
    return (num / 1000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * Determine CSS class based on price comparison
 */
export const getColorClass = (
    price: number | undefined | null,
    ref: number,
    ceil: number,
    floor: number
): string => {
    if (price === undefined || price === null || !ref) return styles.colorRef;
    const p = Number(price);
    const r = Number(ref);
    const c = Number(ceil);
    const f = Number(floor);

    if (Math.abs(p - c) < 0.001) return styles.colorCeiling;
    if (Math.abs(p - f) < 0.001) return styles.colorFloor;
    if (p > r) return styles.colorUp;
    if (p < r) return styles.colorDown;
    return styles.colorRef;
};
