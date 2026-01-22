export interface MarketIndexData {
  id: string;
  name: string;
  currentValue: number;
  change: number;
  changePercent: number;
  totalVolume: number;
  totalValue: number;
  status: 'open' | 'closed';
  counts: {
    up: number;
    ceiling: number;
    reference: number;
    down: number;
    floor: number;
  };
  chartData: {
    time: string;
    value: number;
    volume: number;
  }[];
  color: 'up' | 'down' | 'ref';
}
