import styles from "./components/MarketBoard/MarketBoard.module.scss";

// Format price from absolute value to decimal (e.g., 7920 -> 7.92)
export const formatPrice = (val: any): string => {
    if (val === undefined || val === null || val === "" || Number(val) === 0) return "";
    const num = Number(val) / 1000;
    return num.toFixed(2);
};

// Format volume following HOSE standards
export const formatVol = (val: any): string => {
    if (val === undefined || val === null || val === "" || Number(val) === 0) return "";
    const raw = Number(val);
    if (raw < 1000) {
        return (raw / 10).toFixed(0);
    } else {
        const num = raw / 1000;
        return num.toLocaleString("vi-VN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
};

// Format percentage (converts ratio to percentage string)
export const formatPercent = (val: any): string => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val) * 100;
    if (Math.abs(num) < 0.001) return "0.00%";
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(1)}%`;
};

// Format absolute change (e.g., 60 -> +0.06)
export const formatChange = (val: any): string => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val) / 1000;
    if (Math.abs(num) < 0.0001) return "0.00";
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}`;
};

// Determine CSS class based on price comparison to reference/ceiling/floor
export const getColorClass = (
    price: number | undefined | null,
    ref: number,
    ceil: number,
    floor: number
): string => {
    if (!price || !ref) return styles.colorRef;
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

// Normalize data from REST API (long names) to WebSocket format (BSC short names)
export const normalizeBSCData = (item: any): any => {
    if (!item) return {};

    // API returns changePercent as a whole number (e.g., -2.25). 
    // WebSocket uses ratio (e.g., -0.0225). We normalize to ratio.
    const changePercent = item.changePercent !== undefined ? item.changePercent / 100 : undefined;

    return {
        ...item,
        SB: item.SB || item.symbol || item.id,
        RE: item.RE || item.reference || item.r,
        CL: item.CL || item.ceiling || item.c,
        FL: item.FL || item.floor || item.f,
        CP: item.CP || item.closePrice || item.p,
        CV: item.CV || item.closeVol || item.v,
        B1: item.B1 || item.bidPrice1,
        V1: item.V1 || item.bidVol1,
        B2: item.B2 || item.bidPrice2,
        V2: item.V2 || item.bidVol2,
        B3: item.B3 || item.bidPrice3,
        V3: item.V3 || item.bidVol3,
        S1: item.S1 || item.offerPrice1 || item.P1,
        U1: item.U1 || item.offerVol1 || item.Q1,
        S2: item.S2 || item.offerPrice2 || item.P2,
        U2: item.U2 || item.offerVol2 || item.Q2,
        S3: item.S3 || item.offerPrice3 || item.P3,
        U3: item.U3 || item.offerVol3 || item.Q3,
        CH: item.CH || item.change,
        CHP: item.CHP || changePercent || item.ratioChange || item.CR,
        HI: item.HI || item.high || item.h,
        LO: item.LO || item.low || item.l,
        AP: item.AP || item.averagePrice || item.ave,
        TT: item.TT || item.totalTrading || item.totalTradedQtty,
        TV: item.TV || item.totalTradingValue || item.totalTradedValue,
        OP: item.OP || item.open,
        FB: item.FB || item.foreignBuy,
        FS: item.FS || item.foreignSell,
    };
};
