module.exports = function (RED) { 
    function WhinConfig(n) {
      RED.nodes.createNode(this, n);
      this.phone = n.phone;
      this.apikey = n.apikey;
      }  
      function WhinNode(config) {
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
                              msg.payload = d;    
                          node.send(msg);
                          })
                        })
                    req.on('error', (e) => {
                      //msg.payload = "ERROR";
                             msg.payload = e;
                      node.send(msg);
                        })
                          req.write(postData);
                          req.end()	;
                  });
          }      
    RED.nodes.registerType("whin-send", WhinNode);
    RED.nodes.registerType("whin-config", WhinConfig);
  }
