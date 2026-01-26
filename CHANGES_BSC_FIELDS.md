# Tóm tắt thay đổi: Sử dụng trực tiếp mã viết tắt từ BSC WebSocket

## Mục tiêu
Loại bỏ việc parse data từ format mã viết tắt của BSC sang tên dài để tăng hiệu suất. 
Data flow bây giờ: **BSC WS → Backend WS → Frontend → UI** (không có bước parse nào)

## Các thay đổi chính

### 1. Backend Changes

#### `back-end/src/services/market.service.ts`
- ❌ Removed: `mapBSCData()` import và usage
- ✅ Giữ nguyên raw BSC data format
- ✅ Sử dụng `SB` field làm key thay vì `symbol`

#### `back-end/src/utils/market.utils.ts`
- ⚠️ File này không còn được sử dụng (có thể xóa hoặc giữ lại cho mục đích khác)

### 2. Frontend Changes

#### `front-end/src/features/market/marketTypes.ts`
- ✅ Cập nhật `StockInstrument` interface để sử dụng BSC field names:
  - `SB` (Symbol) thay vì `symbol`
  - `RE` (Reference) thay vì `reference`
  - `CL` (Ceiling) thay vì `ceiling`
  - `FL` (Floor) thay vì `floor`
  - `B1, B2, B3` (Bid Price) thay vì `bidPrice1, bidPrice2, bidPrice3`
  - `V1, V2, V3` (Bid Volume) thay vì `bidVol1, bidVol2, bidVol3`
  - `S1, S2, S3` (Offer/Ask Price) thay vì `offerPrice1, offerPrice2, offerPrice3`
  - `U1, U2, U3` (Offer/Ask Volume) thay vì `offerVol1, offerVol2, offerVol3`
  - `CP` (Close Price) thay vì `closePrice`
  - `CV` (Close Volume) thay vì `closeVol`
  - `CH` (Change) thay vì `change`
  - `CHP` (Change Percent) thay vì `ratioChange`
  - `HI` (High) thay vì `high`
  - `LO` (Low) thay vì `low`
  - `AP` (Average Price) thay vì `averagePrice`
  - `TT` (Total Traded Quantity) thay vì `totalTradedQtty`
  - `OP` (Open) thay vì `open`
  - `FB` (Foreign Buy) thay vì `buyForeignVol`
  - `FS` (Foreign Sell) thay vì `sellForeignVol`

#### `front-end/src/features/market/marketUtils.ts`
- ❌ Removed: `mapBSCData()` function (không còn cần thiết)
- ✅ Giữ lại: `formatPrice()`, `formatVol()`, `formatPercent()`, `formatChange()`, `getColorClass()`

#### `front-end/src/features/market/marketSlice.ts`
- ❌ Removed: `mapBSCData()` import và usage
- ✅ Sử dụng `SB` field thay vì `symbol` trong entities
- ✅ Giữ nguyên raw BSC data từ API

#### `front-end/src/features/market/marketWs.ts`
- ❌ Removed: `mapBSCData()` import và usage
- ✅ Sử dụng `SB` field để tạo subscription symbols
- ✅ Filter data dựa trên `item.SB` thay vì `item.symbol`

#### `front-end/src/features/market/marketDataService.ts`
- ✅ Cập nhật để sử dụng BSC fields:
  - `u.SB` thay vì `u.symbol`
  - `CP` và `RE` để tính toán `CH` và `CHP`

#### `front-end/src/features/market/marketSelectors.ts`
- ✅ Cập nhật tất cả selectors để sử dụng `stock.SB` thay vì `stock.symbol`

#### `front-end/src/features/market/components/MarketBoard/MarketTable.tsx`
- ✅ Cập nhật StockRow để sử dụng `RE`, `CL`, `FL`, `CP`
- ✅ Cập nhật tất cả MarketCell props để sử dụng BSC field names:
  - `RE`, `CL`, `FL` cho reference/ceiling/floor
  - `B1-B3`, `V1-V3` cho bid prices/volumes
  - `S1-S3`, `U1-U3` cho offer prices/volumes
  - `CP`, `CV`, `CH`, `CHP` cho close price/volume/change
  - `TT`, `HI`, `AP`, `LO` cho summary fields

#### `front-end/src/features/market/components/MarketBoard/MarketCell.tsx`
- ✅ Cập nhật để sử dụng BSC fields:
  - `prev.RE` thay vì `prev.reference`
  - `data.CP` thay vì `data.closePrice`
  - `data.RE`, `data.CL`, `data.FL` cho color calculations

## Lợi ích

### 🚀 Hiệu suất
- **Không còn overhead** từ việc parse/map data
- **Giảm CPU usage** ở cả backend và frontend
- **Giảm memory allocation** (không tạo object mới khi parse)
- **Faster data flow** từ BSC → Backend → Frontend → UI

### 🎯 Đơn giản hóa
- **Ít code hơn** - loại bỏ các hàm `mapBSCData()`
- **Ít bug hơn** - không có lỗi mapping
- **Dễ maintain** - data structure nhất quán xuyên suốt

### 📊 Tương thích
- **100% tương thích** với BSC WebSocket API
- **Dễ dàng thêm fields mới** từ BSC mà không cần update mapping logic

## Breaking Changes
⚠️ Nếu có code khác đang sử dụng các field names cũ (symbol, reference, ceiling, etc.), cần cập nhật sang BSC field names mới (SB, RE, CL, etc.)

## Testing Checklist
- [ ] Backend nhận được raw data từ BSC và forward đúng format
- [ ] Frontend nhận được data từ backend WebSocket
- [ ] MarketTable hiển thị đúng data với các field BSC
- [ ] Real-time updates hoạt động bình thường
- [ ] Color coding (ceiling/floor/up/down) hoạt động đúng
- [ ] Flash animations khi data thay đổi
- [ ] Pin/unpin stocks hoạt động
- [ ] Filter by type (STOCK/WARRANT/ETF) hoạt động
- [ ] Search suggestions hoạt động với SB field
