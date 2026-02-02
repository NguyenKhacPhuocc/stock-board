import MarketIndexCard from "./MarketIndexCard";
import { EXCHANGES } from "@/constants/exchanges";

export default function MarketOverview() {
  return (
    <>
      {EXCHANGES.map((exchange) => (
        <MarketIndexCard key={exchange} exchange={exchange} />
      ))}
    </>
  );
}