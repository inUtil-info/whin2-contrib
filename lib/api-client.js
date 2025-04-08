const https = require('https');

class WhinApiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'whin2.p.rapidapi.com';
    }

    async makeRequest(path, method = 'GET', body = null) {
        const options = {
            hostname: this.baseUrl,
            port: 443,
            path,
            method,
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': this.baseUrl,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    // Log raw response for debugging
                    console.log('Raw response:', data);

                    // If response is empty, resolve with empty data
                    if (!data.trim()) {
                        resolve({
                            statusCode: res.statusCode,
                            data: null
                        });
                        return;
                    }

                    // Check if response looks like JSON
                    if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
                        try {
                            // Attempt to parse JSON
                            const parsedData = JSON.parse(data);
                            resolve({
                                statusCode: res.statusCode,
                                data: parsedData
                            });
                        } catch (e) {
                            // Fallback to plain text if JSON parsing fails
                            resolve({
                                statusCode: res.statusCode,
                                data: data,
                                isPlainText: true,
                                parseError: e.message
                            });
                        }
                    } else {
                        // Treat as plain text response
                        resolve({
                            statusCode: res.statusCode,
                            data: data,
                            isPlainText: true
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request error:', error);
                reject(error);
            });
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }
}

module.exports = WhinApiClient; 