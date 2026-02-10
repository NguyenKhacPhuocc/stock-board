# Stock Board - Project Overview

## 📋 Tổng quan dự án

**Stock Board** là một ứng dụng web fullstack theo dõi thị trường chứng khoán Việt Nam theo thời gian thực (real-time). Dự án sử dụng WebSocket để nhận dữ liệu từ BSC (Bảo Việt Securities) và hiển thị thông tin cổ phiếu, chỉ số thị trường cho các sàn giao dịch HOSE, HNX, UPCOM.

## 🏗️ Kiến trúc tổng thể

```
stock-board/
├── back-end/          # Node.js + Express + Socket.io server
├── front-end/         # React + TypeScript + Vite client
└── docker-compose.yml # Docker orchestration
```

### Tech Stack

**Backend:**
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **WebSocket:** Socket.io v4 (server) + socket.io-client v2 (BSC relay)
- **Authentication:** JWT (jsonwebtoken)
- **API Client:** Axios

**Frontend:**
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **WebSocket:** Socket.io-client v2
- **UI Components:** Lucide React (icons)
- **Charts:** ApexCharts + React-ApexCharts
- **Internationalization:** React-Intl
- **Styling:** SASS/SCSS
- **Notifications:** React-Toastify
- **Utilities:** dayjs, classnames, clsx

**DevOps:**
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (frontend production)

---

## 🔧 Backend Architecture

### Entry Point: `server.ts`

```typescript
// Khởi động server với các bước:
1. Load symbol-exchange mapping từ BSC API
2. Initialize Socket.io server
3. Start HTTP server trên port 3000
```

### Core Components

#### 1. **WebSocket Server** (`websocket/socket.ts`)

- **Middleware:** JWT authentication (optional - cho phép anonymous connections)
- **Events:**
  - `subscribe`: Client đăng ký nhận dữ liệu từ một sàn giao dịch (HOSE/HNX/UPCOM)
  - `unsubscribe`: Client hủy đăng ký
  - `disconnect`: Cleanup khi client ngắt kết nối
  
- **Rooms:** Sử dụng Socket.io rooms để phân phối dữ liệu theo sàn (`e:HOSE`, `e:HNX`, `e:UPCOM`)

- **Data Flow:**
  ```
  BSC WebSocket → bscFeed → marketService → Socket.io Server → Clients
  ```

#### 2. **BSC Feed Service** (`feeds/bsc.feed.ts`)

Kết nối đến BSC WebSocket API để nhận dữ liệu thị trường real-time.

**Features:**
- Auto-reconnect với exponential backoff
- Subscribe/unsubscribe động theo exchanges
- Hỗ trợ cả stock data (`i`) và index data (`idx`)

**Connection Config:**
```typescript
URL: wss://priceapi.bsc.com.vn
Path: /market/socket.io
Transports: websocket, polling
```

**Channels:**
- `e:HOSE`, `e:HNX`, `e:UPCOM` - Dữ liệu cổ phiếu
- `idx:HOSE`, `idx:HNX`, `idx:UPCOM` - Chỉ số sàn

#### 3. **Market Service** (`services/market.service.ts`)

EventEmitter xử lý và phân phối dữ liệu thị trường.

**Responsibilities:**
- Load symbol-exchange mapping từ BSC API
- Cache dữ liệu market snapshot
- Group và emit dữ liệu theo exchange
- Quản lý index data riêng biệt

**Events:**
- `i` - Stock data updates (batched by exchange)
- `idx` - Index data updates

#### 4. **Subscription Manager** (`websocket/subscriptionManager.ts`)

Quản lý subscriptions của clients và tự động subscribe/unsubscribe BSC feed.

**Logic:**
- Track số lượng clients subscribe mỗi exchange
- Chỉ subscribe BSC khi có ít nhất 1 client quan tâm
- Auto-unsubscribe BSC khi không còn client nào

#### 5. **Authentication** (`routes/auth.route.ts`)

REST API endpoints cho authentication (JWT-based).

---

## 🎨 Frontend Architecture

### Entry Point Flow

```
main.tsx → AppProvider → App → RouterProvider → Pages
```

### State Management (Redux Toolkit)

**Store Structure:**
```typescript
{
  app: {
    locale: 'vi' | 'en'  // Internationalization
  },
  market: {
    stocks: Map<symbol, StockData>,
    indices: Map<exchange, IndexData>,
    // ... other market state
  },
  auth: {
    // Authentication state
  }
}
```

### Core Features

#### 1. **WebSocket Client** (`features/market/marketWs.ts`)

**Key Features:**
- **Singleton Socket:** Shared socket instance across all components
- **BroadcastChannel:** Sync subscriptions across multiple browser tabs
- **Ref-counting:** Chỉ subscribe/unsubscribe khi cần thiết
- **Auto-reconnect:** Built-in với Socket.io client

**Hook Usage:**
```typescript
const useMarketWebSocket = (exchange: ExchangeType) => {
  // Auto subscribe/unsubscribe khi component mount/unmount
  // Dispatch Redux actions khi nhận data
}
```

**Multi-tab Coordination:**
- Sử dụng `BroadcastChannel` để đồng bộ subscription count
- Tránh duplicate subscriptions từ nhiều tabs
- Chỉ unsubscribe khi tất cả tabs đều không cần data

#### 2. **Market Slice** (`features/market/marketSlice.ts`)

Redux slice quản lý market data state.

**Actions:**
- `batchUpdateStocks` - Update nhiều stocks cùng lúc
- `updateIndexData` - Update index data
- `setSelectedExchange` - Switch sàn giao dịch

**Selectors:** (`marketSelectors.ts`)
- Memoized selectors với Reselect
- Filter, sort, transform data hiệu quả

#### 3. **Market API** (`features/market/marketApi.ts`)

RTK Query API definitions cho REST endpoints (nếu có).

#### 4. **Routing** (`routes/index.tsx`)

```
/ → redirect to /market
/market → MarketPage (main trading board)
/login → LoginPage
* → 404 Not Found
```

#### 5. **Internationalization**

- **Languages:** Vietnamese (vi), English (en)
- **Library:** React-Intl
- **Messages:** Stored in `locales/` directory
- **Persistence:** Locale saved to localStorage

---

## 🔄 Data Flow

### Real-time Market Data Flow

```
BSC WebSocket Server
        ↓
[bsc.feed.ts] BSC Feed Client
        ↓
[market.service.ts] Process & Group by Exchange
        ↓
[socket.ts] Socket.io Server
        ↓ (emit to rooms)
Frontend Socket.io Client
        ↓
[marketWs.ts] useMarketWebSocket hook
        ↓
Redux Store (marketSlice)
        ↓
React Components (re-render)
```

### Subscription Flow

```
Component mounts with exchange="HOSE"
        ↓
useMarketWebSocket("HOSE")
        ↓
Check subscription count via BroadcastChannel
        ↓
socket.emit("subscribe", { exchange: "HOSE" })
        ↓
Backend: socket.join("e:HOSE")
        ↓
Backend: subscriptionManager.subscribeToExchange()
        ↓
Backend: bscFeed.subscribeToExchanges(["HOSE"])
        ↓
BSC WebSocket: Subscribe to "e:HOSE", "idx:HOSE"
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd back-end
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# PORT=3000
# FRONTEND_URL=http://localhost:5173
# JWT_SECRET=your_secret_key
# BSC_SOCKET_URL=wss://priceapi.bsc.com.vn
# BSC_API_URL=https://priceapi.bsc.com.vn

# Run development server
npm run dev
```

### Frontend Setup

```bash
cd front-end
npm install

# Create .env file
cp .env.example .env

# Edit .env
# VITE_SOCKET_URL=http://localhost:3000
# VITE_API_URL=http://localhost:3000/api

# Run development server
npm run dev
```

### Docker Setup

```bash
# Run both frontend and backend
docker-compose up --build

# Access:
# Frontend: http://localhost
# Backend: http://localhost:3000
```

---

## 📁 Project Structure

### Backend Structure

```
back-end/src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── constants/
│   └── exchanges.ts          # HOSE, HNX, UPCOM constants
├── controllers/              # Request handlers
├── feeds/
│   └── bsc.feed.ts          # BSC WebSocket client
├── routes/
│   ├── index.route.ts       # Route aggregator
│   └── auth.route.ts        # Auth endpoints
├── services/
│   └── market.service.ts    # Market data processing
├── types/
│   └── market.types.ts      # TypeScript type definitions
├── utils/
│   └── jwt.ts               # JWT utilities
└── websocket/
    ├── socket.ts            # Socket.io server
    └── subscriptionManager.ts # Subscription tracking
```

### Frontend Structure

```
front-end/src/
├── main.tsx                 # App entry point
├── App.tsx                  # Root component
├── provider.tsx             # Redux + Intl providers
├── app/
│   ├── store.ts            # Redux store configuration
│   ├── hooks.ts            # Typed Redux hooks
│   ├── appSlice.ts         # App-level state (locale)
│   └── i18n.ts             # i18n configuration
├── components/
│   └── layout/             # Layout components
├── features/
│   ├── auth/               # Authentication feature
│   │   ├── authSlice.ts
│   │   ├── authApi.ts
│   │   └── authAction.ts
│   └── market/             # Market data feature
│       ├── marketSlice.ts      # Redux slice
│       ├── marketWs.ts         # WebSocket hook
│       ├── marketApi.ts        # API definitions
│       ├── marketSelectors.ts  # Memoized selectors
│       ├── marketTypes.ts      # Type definitions
│       ├── marketUtils.ts      # Utility functions
│       ├── fieldMapping.ts     # BSC field mappings
│       ├── components/         # Market UI components
│       └── hooks/              # Custom hooks
├── pages/
│   ├── login/
│   │   └── LoginPage.tsx
│   └── market/
│       └── MarketPage.tsx
├── routes/
│   └── index.tsx           # Route definitions
├── services/
│   └── websocket.ts        # WebSocket utilities
├── locales/
│   ├── vi.json             # Vietnamese translations
│   └── en.json             # English translations
├── styles/
│   └── index.scss          # Global styles
└── types/                  # Global type definitions
```

---

## 🔐 Authentication

- **Method:** JWT (JSON Web Tokens)
- **Storage:** localStorage (`accessToken`)
- **Flow:**
  1. User login → Backend validates → Returns JWT
  2. Frontend stores JWT in localStorage
  3. JWT sent in WebSocket handshake (`auth.token`)
  4. Backend middleware validates (optional - allows anonymous)

---

## 🌐 Supported Exchanges

- **HOSE** - Ho Chi Minh Stock Exchange (Sàn HOSE)
- **HNX** - Hanoi Stock Exchange (Sàn HNX)
- **UPCOM** - Unlisted Public Company Market (Sàn UPCOM)

---

## 📊 Market Data Types

### Stock Data (`i` event)
- Symbol (SB)
- Price data (ceiling, floor, reference, last price)
- Volume data
- Bid/Ask data
- Trading statistics

### Index Data (`idx` event)
- Exchange code (MC)
- Index value
- Change, % change
- Volume, value

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
BSC_SOCKET_URL=wss://priceapi.bsc.com.vn
BSC_API_URL=https://priceapi.bsc.com.vn
```

**Frontend (.env):**
```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
```

---

## 🐛 Debugging Tips

### Backend Logs
- `[BSC Feed]` - BSC WebSocket connection logs
- `[MarketService]` - Data processing logs
- `[Socket Server]` - Client connection logs

### Frontend Logs
- `[MarketWS]` - WebSocket subscription logs
- Redux DevTools - State changes

### Common Issues

1. **WebSocket not connecting:**
   - Check CORS configuration
   - Verify SOCKET_URL environment variable
   - Check backend is running

2. **No data received:**
   - Verify BSC WebSocket connection
   - Check subscription events in browser console
   - Ensure symbol-exchange mapping loaded

3. **Multiple subscriptions:**
   - Check BroadcastChannel is working
   - Verify ref-counting logic in marketWs.ts

---

## 📝 Code Style

### Coding Standards
- **Language:** TypeScript (strict mode)
- **Linting:** ESLint
- **Comments:** English only (per user rules)
- **Icons:** No icons in code comments

### Best Practices
- Follow production code patterns
- Analyze file structure before modifications
- Use typed Redux hooks (`useAppDispatch`, `useAppSelector`)
- Memoize selectors with Reselect
- Handle WebSocket reconnection gracefully

---

## 🚢 Deployment

### Docker Production Build

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

**Backend:**
```bash
cd back-end
npm run build
npm start
```

**Frontend:**
```bash
cd front-end
npm run build
# Serve dist/ folder with Nginx or other web server
```

---

## 📚 Additional Resources

- **Socket.io Documentation:** https://socket.io/docs/v4/
- **Redux Toolkit:** https://redux-toolkit.js.org/
- **React Router v7:** https://reactrouter.com/
- **Vite:** https://vitejs.dev/

---

## 👥 Contributing

1. Analyze existing code structure
2. Follow TypeScript best practices
3. Write comments in English
4. Test WebSocket connections thoroughly
5. Ensure multi-tab coordination works

---

## 📄 License

[Add your license information here]

---

**Last Updated:** 2026-02-09
