const WhinApiClient = require('../lib/api-client');

module.exports = function(RED) {
    function WhinGroupNode(config) {
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

        node.on('input', async function(msg) {
            try {
                // Simplified message validation
                if (!msg.payload || typeof msg.payload !== 'object') {
                    throw new Error('Invalid message payload');
                }

                // Require group ID for group messages
                if (!msg.gid) {
                    throw new Error('Group ID (msg.gid) is required');
                }

                // Prepare payload with group ID
                const groupPayload = {
                    ...msg.payload,
                    gid: msg.gid
                };

                // Make API request using api-client
                const response = await apiClient.makeRequest('/group', 'POST', groupPayload);

                // Check response status
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                // Update message with response data
                msg.payload = response.data || response;
                
                // Set success status
                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: 'Group message sent'
                });

                // Send the message
                node.send(msg);

            } catch (error) {
                // Handle errors
                node.status({
                    fill: 'red', 
                    shape: 'ring', 
                    text: error.message
                });
                node.error(error.message, msg);
            }
        });
    }

    RED.nodes.registerType("whin-group", WhinGroupNode);
}; 