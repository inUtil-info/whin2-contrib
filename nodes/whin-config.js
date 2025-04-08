const WhinApiClient = require('../lib/api-client');

module.exports = function(RED) {
    function WhinConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.apikey = this.credentials.apikey;
        
        if (this.apikey) {
            this.client = new WhinApiClient(this.apikey);
        }
    }

    RED.nodes.registerType("whin-config", WhinConfigNode, {
        credentials: {
            apikey: { type: "password" }
        }
    });
} 