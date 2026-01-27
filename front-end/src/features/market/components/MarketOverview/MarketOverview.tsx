import MarketIndexCard from "./MarketIndexCard";
import { MOCK_MARKET_INDICES } from "@/features/market/mockMarketData";

interface MarketOverviewProps {
  selectedExchange?: string;
  onExchangeChange?: (exchange: 'HOSE' | 'HNX' | 'UPCOM') => void;
}

export default function MarketOverview(_props: MarketOverviewProps) {
  return (
    <>
      {MOCK_MARKET_INDICES.map(index => (
        <MarketIndexCard key={index.id} indexData={index} />
      ))}
    </>
  );
}