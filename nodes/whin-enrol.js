const https = require('https');

module.exports = function(RED) {
    function WhinEnrolNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.name = config.name;
        node.whinConfig = RED.nodes.getNode(config.auth);

        if (!node.whinConfig) {
            node.error("Authentication node not configured");
            return;
        }

        // Store QR data for UI access
        node.qrData = null;
        
        // Expose endpoint for UI to get QR code
        RED.httpAdmin.get("/whin-enrol/:id/qr", function(req, res) {
            const node = RED.nodes.getNode(req.params.id);
            if (node && node.qrData) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ qrData: node.qrData }));
            } else {
                res.status(404).send("QR code not available");
            }
        });

        node.on('input', async function(msg) {
            try {
                // Make API request to get QR code
                const options = {
                    hostname: 'whin2.p.rapidapi.com',
                    port: 443,
                    path: '/getqr',
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': node.whinConfig.apikey,
                        'X-RapidAPI-Host': 'whin2.p.rapidapi.com'
                    }
                };

                const response = await new Promise((resolve, reject) => {
                    const req = https.request(options, (res) => {
                        // Use Buffer to handle binary data
                        const chunks = [];
                        res.on('data', chunk => chunks.push(chunk));
                        res.on('end', () => {
                            const buffer = Buffer.concat(chunks);
                            resolve({
                                statusCode: res.statusCode,
                                data: buffer.toString('base64')  // Convert binary data to base64
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

                // Store QR data for UI access (now properly converted to base64)
                node.qrData = response.data;
                
                // Send QR data to output
                msg.payload = {
                    qrString: response.data,
                    qrImage: `data:image/png;base64,${response.data}`
                };
                
                // Update node status with a link that can be clicked in the editor
                const statusText = `QR ready [${new Date().toLocaleTimeString()}]`;
                node.status({
                    fill: 'green', 
                    shape: 'dot', 
                    text: statusText
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

    RED.nodes.registerType("whin-enrol", WhinEnrolNode);
}; 