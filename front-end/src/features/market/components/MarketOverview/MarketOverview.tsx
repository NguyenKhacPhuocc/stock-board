import MarketIndexCard from "./MarketIndexCard";

const EXCHANGES = ["HOSE", "HNX", "UPCOM"] as const;

export default function MarketOverview() {
  return (
    <>
      {EXCHANGES.map((exchange) => (
        <MarketIndexCard key={exchange} exchange={exchange} />
      ))}
    </>
  );
}