# Multi-Tab WebSocket Strategy - Deep Dive

## 🤔 Câu hỏi 1: Unmount là gì? Khi nào xảy ra?

### Unmount trong React

**Unmount** = Component bị remove khỏi DOM tree

### ❌ Unmount KHÔNG xảy ra khi:
- ✅ Chuyển sang tab khác của browser (switch tab)
- ✅ Minimize browser window
- ✅ Scroll page
- ✅ Click vào element khác trong cùng page

### ✅ Unmount XẢY RA khi:
- ❌ Navigate sang page khác (React Router navigation)
- ❌ Component bị remove bởi conditional rendering
- ❌ Close/refresh browser tab
- ❌ Parent component unmount

### Ví dụ thực tế

```typescript
// MarketPage.tsx
function MarketPage() {
  const [selectedExchange, setSelectedExchange] = useState('HOSE');
  
  // useMarketWebSocket hook được gọi ở đây
  useMarketWebSocket(selectedExchange);
  
  return (
    <div>
      <button onClick={() => setSelectedExchange('HNX')}>
        Switch to HNX
      </button>
      {/* Market data display */}
    </div>
  );
}
```

**Khi user click "Switch to HNX":**
- ❌ Component KHÔNG unmount
- ✅ `selectedExchange` state thay đổi từ 'HOSE' → 'HNX'
- ✅ useEffect trong `useMarketWebSocket` re-run với exchange mới
- ✅ Cleanup function chạy (unsubscribe HOSE nếu cần)
- ✅ Subscribe HNX

**Khi user navigate từ /market → /login:**
- ✅ MarketPage component UNMOUNT hoàn toàn
- ✅ Cleanup function chạy
- ✅ Unsubscribe tất cả

**Khi user switch browser tab (Tab 1 → Tab 2):**
- ❌ Component KHÔNG unmount
- ✅ Component vẫn còn trong memory
- ✅ WebSocket connection vẫn active
- ✅ Vẫn nhận messages (nhưng UI không visible)

---

## 🏗️ So sánh 2 Approaches: Shared Socket vs Multiple Sockets

### Approach 1: Shared Socket (Current Implementation) ⭐ RECOMMENDED

```typescript
// Tab 1 và Tab 2 dùng CHUNG 1 socket connection
let socketInstance: Socket | null = null;

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, SOCKET_CONFIG);
  }
  return socketInstance; // Same instance for all tabs
};
```

**Architecture:**
```
Browser Tab 1 (HOSE)  ┐
                      ├──→ Shared Socket Instance ──→ Backend Server
Browser Tab 2 (HNX)   ┘
```

#### ✅ Ưu điểm:

1. **Hiệu quả tài nguyên**
   - Chỉ 1 WebSocket connection cho tất cả tabs
   - Tiết kiệm bandwidth
   - Giảm load cho server

2. **Đơn giản hơn**
   - Không cần quản lý multiple connections
   - Không lo conflict giữa các connections

3. **Consistent state**
   - Tất cả tabs nhận cùng data
   - Không bị out-of-sync

4. **Production-ready**
   - Đây là cách các sàn lớn làm (SSI, VPS, TCBS)
   - Proven architecture

#### ❌ Nhược điểm:

1. **Phức tạp trong subscription management**
   - Cần BroadcastChannel để sync giữa tabs
   - Cần reference counting
   - Race condition có thể xảy ra

2. **Single point of failure**
   - Nếu socket die → tất cả tabs bị ảnh hưởng

---

### Approach 2: Multiple Sockets (One per Tab)

```typescript
// Mỗi tab tạo socket riêng
function useMarketWebSocket(exchange: ExchangeType) {
  const [socket] = useState(() => io(SOCKET_URL, SOCKET_CONFIG));
  
  useEffect(() => {
    socket.emit('subscribe', { exchange });
    return () => {
      socket.emit('unsubscribe', { exchange });
    };
  }, [exchange]);
}
```

**Architecture:**
```
Browser Tab 1 (HOSE) ──→ Socket 1 ──→ Backend Server
Browser Tab 2 (HNX)  ──→ Socket 2 ──→ Backend Server
```

#### ✅ Ưu điểm:

1. **Đơn giản hơn trong code**
   - Không cần BroadcastChannel
   - Không cần reference counting
   - Mỗi tab độc lập

2. **Isolation**
   - Tab 1 crash không ảnh hưởng Tab 2
   - Dễ debug

#### ❌ Nhược điểm:

1. **Lãng phí tài nguyên** 🔴
   - 2 tabs = 2 connections = 2x bandwidth
   - 10 tabs = 10 connections = server overload
   - Mobile data sẽ tốn nhiều

2. **Backend phải handle duplicate subscriptions**
   ```
   Tab 1: subscribe HOSE
   Tab 2: subscribe HOSE
   → Server phải gửi HOSE data 2 lần (duplicate)
   ```

3. **Không scale**
   - User mở 10 tabs → 10 connections
   - Server có thể rate-limit hoặc block

4. **Không production-ready**
   - Không có sàn lớn nào làm vậy
   - Không hiệu quả

---

## 🎯 Ví dụ chi tiết: Shared Socket Approach

### Scenario 1: User mở 2 tabs xem 2 sàn khác nhau

```
Initial State:
- Tab 1: Closed
- Tab 2: Closed
- Socket: Not created
- Subscriptions: []

Step 1: User mở Tab 1, vào /market (default HOSE)
─────────────────────────────────────────────────
Tab 1:
  - Component mount
  - getSocket() → Tạo socket mới (lần đầu)
  - subscriptionCount.set('HOSE', 1)
  - BroadcastChannel.postMessage({ type: 'subscribe:add', exchange: 'HOSE' })
  - socket.emit('subscribe', { exchange: 'HOSE' })

Backend:
  - Nhận subscribe HOSE
  - socket.join('e:HOSE')
  - bscFeed.subscribeToExchanges(['HOSE'])

Result:
  - Socket: Connected
  - Subscriptions: ['HOSE']
  - subscriptionCount: { HOSE: 1 }

Step 2: User mở Tab 2 (new tab), vào /market (default HOSE)
─────────────────────────────────────────────────
Tab 2:
  - Component mount
  - getSocket() → Trả về socket đã tồn tại (KHÔNG tạo mới)
  - subscriptionCount.get('HOSE') = 1 (từ Tab 1)
  - subscriptionCount.set('HOSE', 2)
  - BroadcastChannel.postMessage({ type: 'subscribe:add', exchange: 'HOSE' })
  - socket.emit('subscribe', { exchange: 'HOSE' })

Backend:
  - Nhận subscribe HOSE (lần 2)
  - Check: socket đã join 'e:HOSE' rồi → Skip (idempotent)
  - bscFeed: Đã subscribe HOSE rồi → Skip

Tab 1 (listening to BroadcastChannel):
  - Nhận message { type: 'subscribe:add', exchange: 'HOSE' }
  - subscriptionCount.set('HOSE', 2)

Result:
  - Socket: Same connection
  - Subscriptions: ['HOSE'] (không duplicate)
  - subscriptionCount: { HOSE: 2 }
  - ✅ Cả 2 tabs đều nhận HOSE data từ cùng 1 socket

Step 3: User ở Tab 2, click chuyển sang HNX
─────────────────────────────────────────────────
Tab 2:
  - exchange state thay đổi: 'HOSE' → 'HNX'
  - useEffect cleanup chạy (unsubscribe HOSE)
  
  Cleanup logic:
    - subscriptionCount.get('HOSE') = 2
    - newCount = 2 - 1 = 1
    - subscriptionCount.set('HOSE', 1)
    - BroadcastChannel.postMessage({ type: 'subscribe:remove', exchange: 'HOSE' })
    - Check: newCount > 0 → KHÔNG emit unsubscribe (vì Tab 1 vẫn cần)
    - ✅ Skip socket.emit('unsubscribe', { exchange: 'HOSE' })
  
  Subscribe HNX:
    - subscriptionCount.set('HNX', 1)
    - BroadcastChannel.postMessage({ type: 'subscribe:add', exchange: 'HNX' })
    - socket.emit('subscribe', { exchange: 'HNX' })

Backend:
  - Nhận subscribe HNX
  - socket.join('e:HNX')
  - bscFeed.subscribeToExchanges(['HOSE', 'HNX']) ← Giờ sub cả 2

Tab 1 (listening to BroadcastChannel):
  - Nhận message { type: 'subscribe:remove', exchange: 'HOSE' }
  - subscriptionCount.set('HOSE', 1)
  - Nhận message { type: 'subscribe:add', exchange: 'HNX' }
  - subscriptionCount.set('HNX', 1)

Result:
  - Socket: Same connection
  - Subscriptions: ['HOSE', 'HNX']
  - subscriptionCount: { HOSE: 1, HNX: 1 }
  - ✅ Tab 1 nhận HOSE data
  - ✅ Tab 2 nhận HNX data
  - ✅ Backend chỉ subscribe 2 sàn (không duplicate)

Step 4: User đóng Tab 1
─────────────────────────────────────────────────
Tab 1:
  - Component unmount
  - useEffect cleanup chạy
  
  Cleanup logic:
    - subscriptionCount.get('HOSE') = 1
    - newCount = 1 - 1 = 0
    - subscriptionCount.delete('HOSE')
    - BroadcastChannel.postMessage({ type: 'subscribe:remove', exchange: 'HOSE' })
    - Check: newCount === 0 → ✅ Emit unsubscribe
    - socket.emit('unsubscribe', { exchange: 'HOSE' })

Backend:
  - Nhận unsubscribe HOSE
  - socket.leave('e:HOSE')
  - bscFeed.subscribeToExchanges(['HNX']) ← Chỉ còn HNX

Tab 2 (listening to BroadcastChannel):
  - Nhận message { type: 'subscribe:remove', exchange: 'HOSE' }
  - subscriptionCount.delete('HOSE')

Result:
  - Socket: Still connected (Tab 2 vẫn dùng)
  - Subscriptions: ['HNX']
  - subscriptionCount: { HNX: 1 }
  - ✅ Tab 2 vẫn nhận HNX data bình thường
```

---

### Scenario 2: User mở 2 tabs cùng xem HOSE

```
Step 1: Tab 1 mở, xem HOSE
─────────────────────────────────────────────────
Result:
  - subscriptionCount: { HOSE: 1 }
  - Backend subscriptions: ['HOSE']

Step 2: Tab 2 mở, xem HOSE
─────────────────────────────────────────────────
Tab 2:
  - getSocket() → Trả về socket đã có
  - subscriptionCount.set('HOSE', 2)
  - socket.emit('subscribe', { exchange: 'HOSE' })

Backend:
  - Nhận subscribe HOSE
  - Check: Đã join 'e:HOSE' → Skip (idempotent)
  - ✅ KHÔNG subscribe lại BSC

Result:
  - subscriptionCount: { HOSE: 2 }
  - Backend subscriptions: ['HOSE'] (không duplicate)
  - ✅ Cả 2 tabs nhận cùng HOSE data
  - ✅ Backend chỉ subscribe BSC 1 lần

Step 3: Tab 1 chuyển sang HNX
─────────────────────────────────────────────────
Tab 1:
  - Unsubscribe HOSE:
    - subscriptionCount: HOSE = 2 - 1 = 1
    - Check: count > 0 → ✅ KHÔNG emit unsubscribe
  - Subscribe HNX:
    - subscriptionCount.set('HNX', 1)
    - socket.emit('subscribe', { exchange: 'HNX' })

Result:
  - subscriptionCount: { HOSE: 1, HNX: 1 }
  - Backend subscriptions: ['HOSE', 'HNX']
  - ✅ Tab 1 nhận HNX
  - ✅ Tab 2 vẫn nhận HOSE (không bị ảnh hưởng)
```

---

## 🏆 Kết luận: Approach nào Production hơn?

### 🥇 Winner: Shared Socket (Current Implementation)

**Lý do:**

1. **Hiệu quả tài nguyên**
   ```
   Shared Socket:    1 connection cho 10 tabs
   Multiple Sockets: 10 connections cho 10 tabs
   
   Bandwidth saved: 90%
   Server load saved: 90%
   ```

2. **Scalability**
   - User có thể mở 50 tabs mà không ảnh hưởng server
   - Mobile data friendly

3. **Industry standard**
   - SSI, VPS, TCBS, Binance, Coinbase đều dùng shared socket
   - Proven architecture

4. **Cost-effective**
   - Giảm server cost (ít connections hơn)
   - Giảm bandwidth cost

### ⚠️ Trade-off phải chấp nhận:

1. **Code phức tạp hơn**
   - Cần BroadcastChannel
   - Cần reference counting
   - Cần handle race conditions

2. **Debugging khó hơn**
   - Phải track subscriptions across tabs
   - Cần logging tốt

**Nhưng:** Complexity này là **worth it** vì benefits lớn hơn nhiều.

---

## 🔧 Cải tiến cho Current Implementation

### Issue hiện tại: Race Condition

```typescript
// Tab 1 và Tab 2 subscribe HOSE cùng lúc
// BroadcastChannel messages có thể đến không đúng thứ tự

Tab 1: subscriptionCount.set('HOSE', 1)
Tab 2: subscriptionCount.set('HOSE', 1) ← Sai! Phải là 2

// Vì Tab 2 chưa nhận được message từ Tab 1
```

### Solution: Atomic Operations

```typescript
// Option 1: Server-side subscription tracking (RECOMMENDED)
// Backend track subscriptions, frontend chỉ emit subscribe/unsubscribe

// Option 2: Use SharedWorker (more complex)
// SharedWorker maintains single source of truth

// Option 3: Add sequence numbers to BroadcastChannel messages
interface BroadcastMessage {
  type: 'subscribe:add' | 'subscribe:remove';
  exchange: ExchangeType;
  timestamp: number;
  tabId: string;
}

// Process messages in order by timestamp
```

---

## 📊 Performance Comparison

| Metric | Shared Socket | Multiple Sockets |
|--------|---------------|------------------|
| Connections (10 tabs) | 1 | 10 |
| Bandwidth usage | 100% | 1000% |
| Server CPU | Low | High |
| Memory (client) | Low | Medium |
| Code complexity | Medium | Low |
| Production-ready | ✅ Yes | ❌ No |
| Used by major exchanges | ✅ Yes | ❌ No |

---

## 🎯 Recommendation

**Giữ nguyên Shared Socket approach**, nhưng cải tiến:

1. ✅ Add connection state management
2. ✅ Add server-side subscription tracking (để tránh race condition)
3. ✅ Add better error handling
4. ✅ Add monitoring

**KHÔNG nên** chuyển sang Multiple Sockets vì:
- ❌ Không scale
- ❌ Lãng phí tài nguyên
- ❌ Không ai làm vậy trong production

---

**Last Updated:** 2026-02-09
