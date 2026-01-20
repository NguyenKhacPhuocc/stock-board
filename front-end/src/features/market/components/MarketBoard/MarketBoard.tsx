import MarketHeader from './MarketHeader';

export default function MarketBoard() {
  return (
    <div className="market-board">
      <h2>Bảng giá chứng khoán</h2>
      <MarketHeader />
      {/* Table content goes here */}
      <div className="market-table-content">
        Dữ liệu bảng giá sẽ hiển thị ở đây
      </div>
    </div>
  );
}
