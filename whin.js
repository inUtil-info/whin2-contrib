module.exports = function (RED) { 
    function WhinConfig(n) {
      RED.nodes.createNode(this, n);
      this.phone = n.phone;
      this.apikey = n.apikey;
      }  
      function WhinSend(config) {
          var https = require('https');
          RED.nodes.createNode(this, config);
          const node = this;
          const resetStatus = () => node.status({});
          const raiseError = (text, msg) => {
              node.status({ fill: "red", shape: "dot", text: text });
              node.error(text, msg);
          };
          node.name = config.name;
          node.authconf = RED.nodes.getNode(config.auth);
          resetStatus();	
          const options = {
                  hostname: 'whin2.p.rapidapi.com',
                  port: 443,
                  path: '/send',
                  method: 'POST',
                  headers: {
                      "content-type": "application/json",
                          "X-RapidAPI-Key": node.authconf.apikey,
                          "X-RapidAPI-Host": "whin2.p.rapidapi.com",
                        "Content-Type": "application/json"
                      }
                  };
          node.on('input', function (msg) {	
                  const postData = JSON.stringify(msg.payload);
                      const req = https.request(options, (res) => {	
                      res.setEncoding('utf8');  
                          res.on('data', (d) => {
                          //    msg.payload = d;    
                          node.send(msg);
                          })
                        })
                    req.on('error', (e) => {
                      //msg.payload = "ERROR";
                      msg.payload = {"ERROR":e}
                      // msg.payload = e;
                      node.send(msg);
                        })
                          req.write(postData);
                          req.end()	;
                  });
          } 
          
      function WhinReceive(config){
            const WebSocket = require('ws');
            let socket = null;
            RED.nodes.createNode(this, config);
            const node = this;
            const resetStatus = () => node.status({});    
            const raiseError = (text, msg) => {
                node.status({ fill: "red", shape: "dot", text: text });
                node.error(text, msg);
                };
            node.name = config.name;
            node.authconf = RED.nodes.getNode(config.auth);
            resetStatus();
            function konekt() {socket = new WebSocket("wss://api.inutil.info/wh2/ws");}
            konekt();
            const apikey=node.authconf.apikey;
            socket.onopen = function(e) {
                node.status({fill:"green",shape:"dot",text:"Listening to whatsapp"});;
                socket.send({"mykey":apikey});
                };
        
            socket.onclose = function(event) {
                node.status({fill:"red",shape:"dot",text:"disconnected"});    
                if (event.wasClean) {
                    node.warn((`[WHIN] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                    } else {
                      // e.g. server process killed or network down
                      // event.code is usually 1006 in this case
                      node.warn(('[WHIN] Connection died');
                      konekt();
                    }
                  };    
            socket.onmessage = function(event) {
                node.send(event.data);
                };
          }
    RED.nodes.registerType("whin-send", WhinSend);
    RED.nodes.registerType("whin-receive", WhinReceive);
    RED.nodes.registerType("whin-config", WhinConfig);
  }
