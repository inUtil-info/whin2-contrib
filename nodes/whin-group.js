const https = require('https');

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

                // Make API request
                const options = {
                    hostname: 'whin2.p.rapidapi.com',
                    port: 443,
                    path: '/group',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': node.whinConfig.apikey,
                        'X-RapidAPI-Host': 'whin2.p.rapidapi.com'
                    }
                };

                const response = await new Promise((resolve, reject) => {
                    const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            resolve({
                                statusCode: res.statusCode,
                                data: data
                            });
                        });
                    });

                    req.on('error', (error) => {
                        reject(error);
                    });
                    
                    req.write(JSON.stringify(groupPayload));
                    req.end();
                });

                // Check response status
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                // Process response
                try {
                    // Try to parse as JSON
                    msg.payload = JSON.parse(response.data);
                } catch (e) {
                    // If not valid JSON, return as raw response
                    msg.payload = response.data;
                }
                
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