const WhinApiClient = require('../lib/api-client');

module.exports = function(RED) {
    // Mapeo de abreviaturas para diferentes orígenes
    const ORIGIN_ABBR = {
        'generic': 'gen',
        'grafana': 'gra',
        'cloudflare': 'cf',
        'ifttt': 'ifttt',
        'telegram': 'tg',
        'typeform': 'tf'
    };

    function WhinListenerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.name = config.name;
        node.whinConfig = RED.nodes.getNode(config.auth);

        if (!node.whinConfig) {
            node.error("Authentication node not configured");
            return;
        }

        // Create API client instance
        const apiClient = new WhinApiClient(node.whinConfig.apikey);

        // Method to get webhook routes for the specified origin
        node.getWebhookRoutes = async function(origin) {
            // Validate origin is not empty
            if (!origin || origin.trim() === '') {
                throw new Error('Origin must be specified in msg.payload.origin');
            }

            try {
                const response = await apiClient.makeRequest('/webhk', 'GET', { 
                    params: { 
                        origin: origin.trim()
                    },
                    headers: {
                        'x-rapidapi-host': 'whin2.p.rapidapi.com'
                    }
                });

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: `Webhook routes retrieved for ${origin}`
                });

                return response.data;
            } catch (error) {
                node.status({
                    fill: 'red', 
                    shape: 'ring', 
                    text: error.message
                });
                node.error(error.message);
                throw error;
            }
        };

        // On input, get webhook routes
        node.on('input', async function(msg) {
            try {
                // Get origin from payload
                const origin = msg.payload.origin;

                // Retrieve webhook routes
                msg.payload = await node.getWebhookRoutes(origin);
                node.send(msg);
            } catch (error) {
                node.error(error.message, msg);
            }
        });
    }

    RED.nodes.registerType("whin-listener", WhinListenerNode);
}; 