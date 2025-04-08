const WhinApiClient = require('../lib/api-client');

module.exports = function(RED) {
    function WhinWebhookNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.name = config.name;
        node.url = config.url;
        node.whinConfig = RED.nodes.getNode(config.auth);

        if (!node.whinConfig) {
            node.error("Authentication node not configured");
            return;
        }

        // Create API client instance
        const apiClient = new WhinApiClient(node.whinConfig.apikey);

        // Method to set webhook URL
        node.setWebhookUrl = async function(url) {
            try {
                const response = await apiClient.makeRequest('/seturl', 'POST', { url: url });

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: 'Webhook URL set'
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

        // Method to show current webhook URL
        node.showWebhookUrl = async function() {
            try {
                const response = await apiClient.makeRequest('/showurl', 'GET');

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: 'Webhook URL retrieved'
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

        // Method to delete webhook URL
        node.deleteWebhookUrl = async function() {
            try {
                const response = await apiClient.makeRequest('/delurl', 'GET');

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: 'Webhook URL deleted'
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

        // On input, handle different actions
        node.on('input', async function(msg) {
            try {
                // Determine action based on input
                if (msg.payload && msg.payload.action) {
                    switch(msg.payload.action) {
                        case 'set':
                            // Set webhook URL
                            const webhookUrl = msg.payload.url || node.url;
                            if (!webhookUrl) {
                                throw new Error('No webhook URL provided');
                            }
                            msg.payload = await node.setWebhookUrl(webhookUrl);
                            break;
                        
                        case 'show':
                            // Show current webhook URL
                            msg.payload = await node.showWebhookUrl();
                            break;
                        
                        case 'delete':
                            // Delete current webhook URL
                            msg.payload = await node.deleteWebhookUrl();
                            break;
                        
                        default:
                            throw new Error('Invalid action. Use "set", "show", or "delete".');
                    }
                } else {
                    // Default to set URL if no specific action
                    const webhookUrl = msg.payload.url || node.url;
                    if (!webhookUrl) {
                        throw new Error('No webhook URL provided');
                    }
                    msg.payload = await node.setWebhookUrl(webhookUrl);
                }

                node.send(msg);
            } catch (error) {
                node.error(error.message, msg);
            }
        });
    }

    RED.nodes.registerType("whin-webhook", WhinWebhookNode);
}; 