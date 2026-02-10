# Connection State Management - Explained

## 🤔 Connection State Management là gì?

**Connection State Management** = Theo dõi và quản lý trạng thái kết nối WebSocket, để:
1. **Biết** socket đang ở trạng thái nào (connected, disconnected, reconnecting, etc.)
2. **Hiển thị** cho user biết data có đang live hay không
3. **Xử lý** các hành động phù hợp với từng trạng thái

---

## ❌ Vấn đề hiện tại trong code

### Code hiện tại:

```typescript
// marketWs.ts - Line 159
socket.emit("subscribe", { exchange: next });
```

**Vấn đề:**
- ❓ Socket có đang connected không?
- ❓ Nếu đang reconnecting thì sao?
- ❓ Nếu disconnected thì subscribe request có đến server không?
- ❓ User có biết data đang live hay stale không?

**Hậu quả:**
```
Scenario: User đang xem giá cổ phiếu VNM
1. Mạng bị mất (WiFi disconnect)
2. Socket disconnect (nhưng code không track)
3. User vẫn thấy giá cũ trên màn hình
4. User nghĩ giá đang live → Đặt lệnh mua
5. ❌ Lệnh fail vì giá đã thay đổi (user bị lỗ)
```

---

## ✅ Solution: Connection State Management

### 1. Định nghĩa các trạng thái

```typescript
enum ConnectionState {
  DISCONNECTED = 'disconnected',    // Chưa kết nối hoặc đã ngắt
  CONNECTING = 'connecting',        // Đang kết nối lần đầu
  CONNECTED = 'connected',          // Đã kết nối, data live
  RECONNECTING = 'reconnecting',    // Mất kết nối, đang reconnect
  ERROR = 'error'                   // Lỗi không thể kết nối
}
```

### 2. Track state trong Redux

```typescript
// marketSlice.ts
interface MarketState {
  connectionState: ConnectionState;
  lastConnectedAt: number | null;
  reconnectAttempts: number;
  // ... other state
}
```

### 3. Update state khi socket events xảy ra

```typescript
// marketWs.ts
socket.on('connect', () => {
  dispatch(setConnectionState(ConnectionState.CONNECTED));
  dispatch(setLastConnectedAt(Date.now()));
  dispatch(setReconnectAttempts(0));
});

socket.on('disconnect', (reason) => {
  dispatch(setConnectionState(ConnectionState.DISCONNECTED));
  logger.error('Socket disconnected', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  dispatch(setConnectionState(ConnectionState.RECONNECTING));
  dispatch(setReconnectAttempts(attemptNumber));
});

socket.on('reconnect_failed', () => {
  dispatch(setConnectionState(ConnectionState.ERROR));
});
```

### 4. Hiển thị cho user

```typescript
// ConnectionStatusBadge.tsx
function ConnectionStatusBadge() {
  const connectionState = useAppSelector(state => state.market.connectionState);
  
  const config = {
    [ConnectionState.CONNECTED]: {
      icon: '🟢',
      text: 'Live',
      color: 'green'
    },
    [ConnectionState.RECONNECTING]: {
      icon: '🟡',
      text: 'Reconnecting...',
      color: 'yellow'
    },
    [ConnectionState.DISCONNECTED]: {
      icon: '🔴',
      text: 'Disconnected',
      color: 'red'
    },
    [ConnectionState.ERROR]: {
      icon: '❌',
      text: 'Connection Error',
      color: 'red'
    }
  };
  
  const { icon, text, color } = config[connectionState];
  
  return (
    <div className={`status-badge ${color}`}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
```

### 5. Xử lý logic dựa trên state

```typescript
// marketWs.ts
useEffect(() => {
  const socket = getSocket();
  
  // Chỉ subscribe khi CONNECTED
  if (connectionState === ConnectionState.CONNECTED) {
    socket.emit('subscribe', { exchange: next });
  } else {
    // Queue subscription để subscribe lại khi reconnect
    pendingSubscriptions.add(next);
  }
}, [exchange, connectionState]);

// Khi reconnect thành công
socket.on('connect', () => {
  dispatch(setConnectionState(ConnectionState.CONNECTED));
  
  // Re-subscribe tất cả pending subscriptions
  pendingSubscriptions.forEach(exchange => {
    socket.emit('subscribe', { exchange });
  });
  pendingSubscriptions.clear();
});
```

---

## 🎯 Ví dụ thực tế: Các sàn lớn làm như thế nào?

### SSI Securities

```
┌─────────────────────────────────────┐
│ SSI Trading Platform                │
│                                     │
│  🟢 Live  │  HOSE  │  VNM: 89,500  │ ← Connection status
│                                     │
│  [Mua] [Bán]                        │
└─────────────────────────────────────┘

Khi mất mạng:
┌─────────────────────────────────────┐
│ SSI Trading Platform                │
│                                     │
│  🔴 Mất kết nối  │  HOSE            │ ← Warning
│                                     │
│  ⚠️ Giá hiển thị có thể không chính │
│  xác. Đang kết nối lại...           │
│                                     │
│  [Mua] [Bán] ← Disabled             │
└─────────────────────────────────────┘
```

### VPS SmartOne

```
┌─────────────────────────────────────┐
│ VPS SmartOne                        │
│                                     │
│  🟡 Đang kết nối lại... (Lần 2/5)   │ ← Reconnect progress
│                                     │
│  VNM: 89,500 (15:30:45)             │ ← Timestamp của giá
│                                     │
└─────────────────────────────────────┘
```

### TCBS

```
┌─────────────────────────────────────┐
│ TCBS                                │
│                                     │
│  🟢 Kết nối ổn định  │  Ping: 45ms  │ ← Latency info
│                                     │
│  VNM: 89,500                        │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 State Transition Diagram

```
                    ┌─────────────┐
                    │ DISCONNECTED│
                    └──────┬──────┘
                           │
                    socket.connect()
                           │
                           ▼
                    ┌─────────────┐
              ┌────▶│ CONNECTING  │
              │     └──────┬──────┘
              │            │
              │     'connect' event
              │            │
              │            ▼
              │     ┌─────────────┐
              │     │  CONNECTED  │◀────┐
              │     └──────┬──────┘     │
              │            │            │
              │    'disconnect' event   │
              │            │            │
              │            ▼            │
              │     ┌─────────────┐    │
              └─────│RECONNECTING │    │
    reconnect_failed└──────┬──────┘    │
                           │           │
                  'reconnect' event    │
                           │           │
                           └───────────┘
                           
    Max retries exceeded
           │
           ▼
    ┌─────────────┐
    │    ERROR    │
    └─────────────┘
```

---

## 🔧 Implementation Example

### Step 1: Add types

```typescript
// marketTypes.ts
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface ConnectionInfo {
  state: ConnectionState;
  lastConnectedAt: number | null;
  reconnectAttempts: number;
  latency: number | null; // ping time in ms
}
```

### Step 2: Update Redux slice

```typescript
// marketSlice.ts
interface MarketState {
  connection: ConnectionInfo;
  stocks: Map<string, StockData>;
  // ... other state
}

const initialState: MarketState = {
  connection: {
    state: ConnectionState.DISCONNECTED,
    lastConnectedAt: null,
    reconnectAttempts: 0,
    latency: null
  },
  // ...
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.connection.state = action.payload;
    },
    setLastConnectedAt: (state, action: PayloadAction<number>) => {
      state.connection.lastConnectedAt = action.payload;
    },
    setReconnectAttempts: (state, action: PayloadAction<number>) => {
      state.connection.reconnectAttempts = action.payload;
    },
    setLatency: (state, action: PayloadAction<number>) => {
      state.connection.latency = action.payload;
    },
    // ... other reducers
  }
});
```

### Step 3: Track state in WebSocket hook

```typescript
// marketWs.ts
export const useMarketWebSocket = (exchange: ExchangeType): void => {
  const dispatch = useAppDispatch();
  const connectionState = useAppSelector(state => state.market.connection.state);
  
  // Track connection events
  useEffect(() => {
    const socket = getSocket();
    
    const onConnect = () => {
      logger.debug('Socket connected');
      dispatch(setConnectionState(ConnectionState.CONNECTED));
      dispatch(setLastConnectedAt(Date.now()));
      dispatch(setReconnectAttempts(0));
      
      // Re-subscribe after reconnect
      if (currentExchangeRef.current) {
        socket.emit('subscribe', { exchange: currentExchangeRef.current });
      }
    };
    
    const onDisconnect = (reason: string) => {
      logger.error('Socket disconnected', reason);
      dispatch(setConnectionState(ConnectionState.DISCONNECTED));
    };
    
    const onReconnectAttempt = (attemptNumber: number) => {
      logger.debug('Reconnect attempt', attemptNumber);
      dispatch(setConnectionState(ConnectionState.RECONNECTING));
      dispatch(setReconnectAttempts(attemptNumber));
    };
    
    const onReconnectFailed = () => {
      logger.error('Reconnect failed');
      dispatch(setConnectionState(ConnectionState.ERROR));
    };
    
    const onConnectError = (error: Error) => {
      logger.error('Connection error', error);
      dispatch(setConnectionState(ConnectionState.ERROR));
    };
    
    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect_failed', onReconnectFailed);
    socket.on('connect_error', onConnectError);
    
    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect_failed', onReconnectFailed);
      socket.off('connect_error', onConnectError);
    };
  }, [dispatch]);
  
  // Subscribe logic with state check
  useEffect(() => {
    const socket = getSocket();
    if (!exchange) return;
    
    const next = exchange.toUpperCase() as ExchangeType;
    
    // Only subscribe if connected
    if (connectionState === ConnectionState.CONNECTED) {
      socket.emit('subscribe', { exchange: next });
      logger.debug('subscribed', next);
    } else {
      logger.debug('Queued subscription (not connected)', next);
      // Will auto-subscribe when reconnect
    }
    
    currentExchangeRef.current = next;
  }, [exchange, connectionState]);
};
```

### Step 4: UI Component

```typescript
// ConnectionStatus.tsx
import { useAppSelector } from '@/app/hooks';
import { ConnectionState } from '@/features/market/marketTypes';

export function ConnectionStatus() {
  const { state, reconnectAttempts, latency } = useAppSelector(
    state => state.market.connection
  );
  
  if (state === ConnectionState.CONNECTED) {
    return (
      <div className="connection-status connected">
        <span className="indicator">🟢</span>
        <span className="text">Live</span>
        {latency && <span className="latency">{latency}ms</span>}
      </div>
    );
  }
  
  if (state === ConnectionState.RECONNECTING) {
    return (
      <div className="connection-status reconnecting">
        <span className="indicator">🟡</span>
        <span className="text">
          Reconnecting... ({reconnectAttempts}/5)
        </span>
      </div>
    );
  }
  
  if (state === ConnectionState.DISCONNECTED) {
    return (
      <div className="connection-status disconnected">
        <span className="indicator">🔴</span>
        <span className="text">Disconnected</span>
      </div>
    );
  }
  
  if (state === ConnectionState.ERROR) {
    return (
      <div className="connection-status error">
        <span className="indicator">❌</span>
        <span className="text">Connection Error</span>
        <button onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }
  
  return null;
}
```

---

## 🎨 UI Examples

### Minimal (Top bar)

```tsx
<header>
  <Logo />
  <ConnectionStatus /> {/* 🟢 Live */}
  <UserMenu />
</header>
```

### Detailed (Trading page)

```tsx
<div className="market-header">
  <h1>HOSE</h1>
  <ConnectionStatus />
  
  {connectionState !== ConnectionState.CONNECTED && (
    <Alert variant="warning">
      ⚠️ Giá hiển thị có thể không chính xác. 
      Đang kết nối lại...
    </Alert>
  )}
</div>
```

### With timestamp

```tsx
<div className="stock-price">
  <span className="price">89,500</span>
  <span className="time">
    {connectionState === ConnectionState.CONNECTED 
      ? 'Live' 
      : `Last update: ${formatTime(lastConnectedAt)}`
    }
  </span>
</div>
```

---

## 📈 Benefits

### 1. User Trust
- ✅ User biết data có đang live
- ✅ Không bị mislead bởi stale data
- ✅ Tăng confidence khi trading

### 2. Better UX
- ✅ Show loading state khi reconnecting
- ✅ Disable trading buttons khi disconnected
- ✅ Clear error messages

### 3. Debugging
- ✅ Track connection issues
- ✅ Monitor reconnect frequency
- ✅ Detect network problems

### 4. Compliance
- ✅ Regulatory requirement (phải báo user khi data không live)
- ✅ Risk management (prevent trading on stale data)

---

## 🚀 Next Steps

1. **Add heartbeat** - Detect stale connections faster
2. **Add latency tracking** - Show ping time to user
3. **Add offline detection** - Use navigator.onLine
4. **Add metrics** - Track connection quality

---

**Last Updated:** 2026-02-09
