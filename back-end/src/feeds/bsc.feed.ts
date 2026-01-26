import ioClient from 'socket.io-client';
import { marketService } from '../services/market.service';

export class BSCFeed {
    private bscSocket: any;
    private readonly BSC_URL = 'wss://priceapi.bsc.com.vn';

    constructor() { }

    public connect() {
        console.log('[BSC Feed] Connecting to BSC...');

        this.bscSocket = ioClient(this.BSC_URL, {
            path: '/market/socket.io',
            transports: ['websocket'],
            query: {
                '__sails_io_sdk_version': '1.2.1',
                '__sails_io_sdk_platform': 'browser',
                '__sails_io_sdk_language': 'javascript',
                'EIO': '3'
            }
        });

        this.bscSocket.on('connect', () => {
            console.log('[BSC Feed] Connected to BSC successfully');

            // Subscribe to default indices on connect
            this.subscribe([
                'idx:HOSE', 'idx:30', 'idx:HNX', 'idx:HNX30', 'idx:UPCOM'
            ]);
        });

        this.bscSocket.on('reconnect', (attempt: number) => {
            console.log(`[BSC Feed] Reconnected to BSC after ${attempt} attempts`);
        });

        this.bscSocket.on('reconnect_attempt', () => {
            console.log('[BSC Feed] Attempting to reconnect to BSC...');
        });

        // Pass raw data to MarketService for state management
        this.bscSocket.on('i', (payload: any) => {
            marketService.onRawFeed(payload, 'i');
        });

        this.bscSocket.on('idx', (payload: any) => {
            marketService.onRawFeed(payload, 'idx');
        });

        this.bscSocket.on('disconnect', (reason: string) => {
            console.log('[BSC Feed] Disconnected from BSC:', reason);
        });

        this.bscSocket.on('connect_error', (error: any) => {
            console.error('[BSC Feed] Connection error:', error);
        });
    }

    /**
     * Dynamically subscribe to a list of symbols (e.g. ['i:FPT', 'idx:HOSE'])
     */
    public subscribe(args: string[]) {
        if (!this.bscSocket) return;

        const subscriptionData = {
            url: '/client/subscribe',
            method: 'get',
            headers: {},
            data: {
                op: 'subscribe',
                args: args
            }
        };

        console.log(`[BSC Feed] Sending subscription for ${args.length} items`);
        this.bscSocket.emit('get', subscriptionData);
    }

    public disconnect() {
        if (this.bscSocket) {
            this.bscSocket.disconnect();
        }
    }
}

export const bscFeed = new BSCFeed();
