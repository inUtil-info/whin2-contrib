module.exports = function(RED) {
    function WhinConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.apikey = this.credentials.apikey;
    }

    RED.nodes.registerType("whin-config", WhinConfigNode, {
        credentials: {
            apikey: { type: "password" }
        }
    });
} 