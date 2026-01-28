import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './websocket/socket'
import { marketService } from './services/market.service'

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Load symbol-exchange mapping before starting server
async function start() {
  console.log('Loading symbol-exchange mapping...')
  await marketService.loadSymbolExchangeMapping()
  
  // Initialize Socket.io and BSC Relay
  initSocket(server)

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
