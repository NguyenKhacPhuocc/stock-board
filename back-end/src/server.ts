import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './websocket/socket'

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.io and BSC Relay
initSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
