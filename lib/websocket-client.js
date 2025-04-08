const WebSocket = require('ws');

class WhinWebSocketClient {
    constructor(config) {
        this.config = config;
        this.ws = null;
        this.reconnectTimer = null;
        this.pingInterval = null;
        this.baseUrl = "wss://wss.inutil.info/ws";
    }

    async connect(token) {
        if (this.ws) {
            this.ws.terminate();
        }

        const wsUrl = `${this.baseUrl}?token=${token}`;
        this.ws = new WebSocket(wsUrl);
        
        this.setupEventHandlers();
        this.setupPing();
    }

    setupEventHandlers() {
        this.ws.on('open', () => {
            if (this.config.onOpen) {
                this.config.onOpen();
            }
        });

        this.ws.on('message', (data) => {
            if (this.config.onMessage) {
                try {
                    const parsedData = JSON.parse(data);
                    this.config.onMessage(parsedData);
                } catch (e) {
                    this.config.onMessage(data.toString());
                }
            }
        });

        this.ws.on('close', (code, reason) => {
            if (this.config.onClose) {
                this.config.onClose(code, reason);
            }
        });

        this.ws.on('error', (error) => {
            if (this.config.onError) {
                this.config.onError(error);
            }
        });
    }

    setupPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

module.exports = WhinWebSocketClient; 