import type { MarketIndexData } from "./marketTypes";

const generateChartData = (baseValue: number) => {
  const data = [];
  let current = baseValue;

  for (let i = 0; i <= 360; i++) {
    const h = Math.floor(i / 60) + 9;
    const m = i % 60;
    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    // Giờ nghỉ trưa: 11:31 - 12:59
    const isLunchBreak = i > 150 && i < 240;

    if (!isLunchBreak) {
      current += (Math.random() - 0.5) * (baseValue * 0.001);
    }

    data.push({
      time,
      value: parseFloat(current.toFixed(2)),
      volume: isLunchBreak ? 0 : Math.floor(Math.random() * 10000),
    });
  }
  return data;
};

export const MOCK_MARKET_INDICES: MarketIndexData[] = [
  {
    id: "vnindex",
    name: "VN-INDEX",
    currentValue: 1882.73,
    change: -2.71,
    changePercent: -0.14,
    totalVolume: 1058940345,
    totalValue: 33602979,
    status: "closed",
    color: "down",
    counts: {
      up: 238,
      ceiling: 15,
      reference: 52,
      down: 92,
      floor: 2
    },
    chartData: generateChartData(1885)
  },
  {
    id: "vn30",
    name: "VN30-INDEX",
    currentValue: 2082.35,
    change: 1.97,
    changePercent: 0.09,
    totalVolume: 429880980,
    totalValue: 19845106,
    status: "closed",
    color: "up",
    counts: {
      up: 16,
      ceiling: 1,
      reference: 3,
      down: 11,
      floor: 0
    },
    chartData: generateChartData(2080)
  },
  {
    id: "hnxindex",
    name: "HNX-INDEX",
    currentValue: 258.43,
    change: 5.77,
    changePercent: 2.28,
    totalVolume: 117314098,
    totalValue: 2530623,
    status: "closed",
    color: "up",
    counts: {
      up: 92,
      ceiling: 11,
      reference: 51,
      down: 71,
      floor: 4
    },
    chartData: generateChartData(252.66)
  },
  {
    id: "hnx30",
    name: "HNX30-INDEX",
    currentValue: 569.03,
    change: 7.32,
    changePercent: 1.3,
    totalVolume: 87680470,
    totalValue: 2188244,
    status: "closed",
    color: "up",
    counts: {
      up: 19,
      ceiling: 1,
      reference: 0,
      down: 11,
      floor: 0
    },
    chartData: generateChartData(561.71)
  },
  {
    id: "upcom",
    name: "UPCOM",
    currentValue: 127.17,
    change: 1.24,
    changePercent: 0.98,
    totalVolume: 59810168,
    totalValue: 958178,
    status: "closed",
    color: "up",
    counts: {
      up: 150,
      ceiling: 10,
      reference: 94,
      down: 92,
      floor: 6
    },
    chartData: generateChartData(125.93)
  }
];
