// Map compressed BSC data fields to internal model based on ddd.json
export const mapBSCData = (item: any): any => {
    if (!item) return {};

    const symbol = item.SB || item.symbol || item.id || item.Id;
    if (!symbol) return item;

    const result: any = {
        symbol: symbol,
        reference: item.RE !== undefined ? item.RE : (item.r !== undefined ? item.r : item.reference),
        ceiling: item.CL !== undefined ? item.CL : (item.c !== undefined ? item.c : item.ceiling),
        floor: item.FL !== undefined ? item.FL : (item.f !== undefined ? item.f : item.floor),
        closePrice: item.CP !== undefined ? item.CP : (item.p !== undefined ? item.p : item.closePrice),
        closeVol: item.CV !== undefined ? item.CV : (item.v !== undefined ? item.v : (item.closeVol || item.CQ)),

        bidPrice1: item.B1 !== undefined ? item.B1 : item.bidPrice1,
        bidVol1: item.V1 !== undefined ? item.V1 : item.bidVol1,
        bidPrice2: item.B2 !== undefined ? item.B2 : item.bidPrice2,
        bidVol2: item.V2 !== undefined ? item.V2 : item.bidVol2,
        bidPrice3: item.B3 !== undefined ? item.B3 : item.bidPrice3,
        bidVol3: item.V3 !== undefined ? item.V3 : item.bidVol3,

        offerPrice1: item.S1 !== undefined ? item.S1 : (item.P1 !== undefined ? item.P1 : item.offerPrice1),
        offerVol1: item.U1 !== undefined ? item.U1 : (item.Q1 !== undefined ? item.Q1 : item.offerVol1),
        offerPrice2: item.S2 !== undefined ? item.S2 : (item.P2 !== undefined ? item.P2 : item.offerPrice2),
        offerVol2: item.U2 !== undefined ? item.U2 : (item.Q2 !== undefined ? item.Q2 : item.offerVol2),
        offerPrice3: item.S3 !== undefined ? item.S3 : (item.P3 !== undefined ? item.P3 : item.offerPrice3),
        offerVol3: item.U3 !== undefined ? item.U3 : (item.Q3 !== undefined ? item.Q3 : item.offerVol3),

        totalTradedQtty: item.TT !== undefined ? item.TT : item.totalTradedQtty,
        totalTradedValue: item.TV !== undefined ? item.TV : item.totalTradedValue,
        change: item.CH !== undefined ? item.CH : item.change,
        ratioChange: item.CHP !== undefined ? item.CHP : (item.CR !== undefined ? item.CR : item.ratioChange),
        high: item.HI !== undefined ? item.HI : (item.h !== undefined ? item.h : (item.high || item.h)),
        low: item.LO !== undefined ? item.LO : (item.l !== undefined ? item.l : (item.low || item.l)),
        averagePrice: item.AP !== undefined ? item.AP : (item.ave !== undefined ? item.ave : item.averagePrice),
        open: item.OP !== undefined ? item.OP : item.open,
    };

    // Calculate reliable change and ratioChange
    if (result.closePrice && result.closePrice > 0 && result.reference) {
        result.change = result.closePrice - result.reference;
        result.ratioChange = (result.closePrice - result.reference) / result.reference;
    }

    return result;
};
