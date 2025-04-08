const https = require('https');

module.exports = function(RED) {
    // Mapeo de formatos correctos para diferentes orígenes
    const ORIGIN_FORMAT = {
        'cloudflare': 'CloudFlare',
        'grafana': 'Grafana',
        'generic': 'Generic',
        'ifttt': 'IFTTT',
        'telegram': 'Telegram',
        'typeform': 'TypeForm'
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

        // On input, get webhook routes
        node.on('input', async function(msg) {
            try {
                // Get origin from payload
                const origin = msg.payload.origin;

                if (!origin || origin.trim() === '') {
                    throw new Error('Origin must be specified in msg.payload.origin');
                }

                // Format origin to match API expectations using the mapping or default format
                let formattedOrigin;
                const originLower = origin.trim().toLowerCase();
                
                if (ORIGIN_FORMAT[originLower]) {
                    formattedOrigin = ORIGIN_FORMAT[originLower];
                } else {
                    // Default formatting if not in our map
                    formattedOrigin = origin.trim().charAt(0).toUpperCase() + origin.trim().slice(1).toLowerCase();
                }

                // For debug purposes
                node.debug(`Using origin format: ${formattedOrigin}`);
                
                const path = `/webhk?origin=${encodeURIComponent(formattedOrigin)}`;

                // Make API request
                const options = {
                    hostname: 'whin2.p.rapidapi.com',
                    port: 443,
                    path: path,
                    method: 'GET',
                    headers: {
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
                    
                    req.end();
                });

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    throw new Error(`API request failed with status ${response.statusCode}`);
                }

                // Parse response
                try {
                    msg.payload = JSON.parse(response.data);
                } catch (e) {
                    msg.payload = response.data;
                }
                
                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: `Webhook routes retrieved for ${origin}`
                });
                
                node.send(msg);
            } catch (error) {
                node.status({
                    fill: 'red', 
                    shape: 'ring', 
                    text: error.message
                });
                node.error(error.message, msg);
            }
        });
    }

    RED.nodes.registerType("whin-listener", WhinListenerNode);
}; 