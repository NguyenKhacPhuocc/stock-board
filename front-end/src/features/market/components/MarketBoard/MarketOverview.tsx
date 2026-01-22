import MarketIndexCard from "./MarketIndexCard";
import { MOCK_MARKET_INDICES } from "@/features/market/mockMarketData";

export default function MarketOverview() {
  return (
    <>
      {MOCK_MARKET_INDICES.map(index => (
        <MarketIndexCard key={index.id} indexData={index} />
      ))}
    </>
  );
}