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
          function isjson (m)
            {
            if (typeof m === 'object' && !Array.isArray(m) && m !== null) return true
            else return false
            }   
          function isvalid(m)
            {
            if (!isjson(m)) return false;
            if (!('text' in m ||'location' in m || 'image' in m || 'contacts' in m || 'video' in m || 'audio' in m)) return false;
            return true;
            }
                           
          node.on('input', function (msg) {	            
                  const postData = JSON.stringify(msg.payload);
                  var options = {
                    hostname: 'whin2.p.rapidapi.com',
                    port: 443,
                    path: '/send',
                    method: 'POST',
                    headers: {
                        "content-type": "application/json",
                            "X-RapidAPI-Key": node.authconf.apikey,
                            "X-RapidAPI-Host": "whin2.p.rapidapi.com",
                          "Content-Type": "application/json",
                          "useQueryString":true
                        }
                    };

                  if ('gid' in msg) //it is a group request
                  {
                    options.path = '/send2group?gid='+msg.gid;
                  }

                  if (isvalid(msg.payload))
                  {
                  const req = https.request(options, (res) => {	
                  res.setEncoding('utf8');  
                  res.on('data', (d) => {
                    msg.payload = {"Response": d};     
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
                  }

                  else 
                  {
                   msg.payload = {'Error':"Malformed message. WHIN did not deliver your message."};
                   node.send(msg)
                  }
                      
                  });
          }     

      function WhinReceive(config){
            const WebSocket = require('ws');
            let socket = null;
            let token = ""
            let baseurl = "wss://wss.inutil.info/ws";
            let path = "";
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
            node.on('close', function() {
                socket.close();// tidy up any state
            });
          
            function konekt(wsurl) 
            {
            socket = new WebSocket(wsurl);
            socket.onopen = function(e) {
                node.status({fill:"green",shape:"dot",text:"Listening to whatsapp"});
                const datos = token.split("_");
                datos.shift();
                const subscription = datos.shift();
                const rapiduser = datos.join("-");
                let datosstr = JSON.stringify(
                    {
                        'rapiduser':rapiduser,
                        'subscription':subscription
                    }
                )
                socket.send(datosstr);
                setInterval(function() {            
                    socket.send(datosstr);
                }, 30000);   // Interval set to 30 seconds
                };
            socket.onmessage = function(event) {
                var msg={};
                try {
                    msg.payload = JSON.parse(event.data);
                    }
                    catch(e)
                     {
                     msg.payload = event.data;
                     }   
                //msg will only be sent if payload is not null
                if (!!msg.payload) node.send(msg);  
                };
            socket.onclose = function(event) {
                node.status({ fill: "red", shape: "dot", text: "Disconnected" })
                if (event.wasClean) {
                node.warn(`[WHIN] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                //  && event.code!=1005 (this is the closing code when .close() is called without parameters    
                //konekt(baseurl+path);
                } else {
                      // e.g. server process killed or network down
                      // event.code is usually 1006 in this case
                node.warn('[WHIN] Connection died');
                konekt(baseurl+path);
                
                }
            };
            socket.onerror = function(error) {
            node.warn(`[WHIN-Error] ${error.message}`);
            };
            }

            function getToken(apikey)
            {
            var resp = "";
            const https = require('https');
            const options = {
                hostname: 'whin2.p.rapidapi.com',
                port: 443,
                path: '/wskchk',
                method: 'GET',
                headers: {
                    "content-type": "application/json",
                        "X-RapidAPI-Key": apikey,
                        "X-RapidAPI-Host": "whin2.p.rapidapi.com",
                      "Content-Type": "application/json"
                    }
                };
            const req = https.request(options, (res) => {	
                res.setEncoding('utf8');  
                res.on('data', (d) => {
                    token = d;
                    path = "?token="+d;
                    //node.warn("path = "+path);
                    konekt(baseurl+path);           
                    })
                })
                req.on('error', (e) => {
                    return "ERROR";
                    })
            req.end();
            }; 
            const key=node.authconf.apikey;
            getToken(key)
          }

    RED.nodes.registerType("whin_send", WhinSend);
    RED.nodes.registerType("whin_receive", WhinReceive);
    RED.nodes.registerType("whin_config", WhinConfig);
  }
