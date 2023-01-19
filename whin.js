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
            if (!('text' in m ||'location' in m || 'image' in m || 'contacts' in m || 'video' in m || 'audio' in m || 'document' in m)) return false;
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
                    msg.payload = JSON.parse(d);     
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
                   msg.payload = {'Error':"Malformed message; a JSON was expected with the right scheme. Message could not be delivered"};
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
                node.buttonState=false;
                node.error(text, msg);
                };
            node.name = config.name;
            node.authconf = RED.nodes.getNode(config.auth);
            resetStatus();
            node.on('close', function() {
                socket.close();// tidy up any state
                node.buttonState=false;
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
                node.buttonState=false;
                node.status({ fill: "yellow", shape: "ring", text: "Click to reconnect" })                
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
            node.buttonState=false
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

            node.on('input', function (msg) {

                if (msg.payload == 'off' || msg.payload === false) {
    
                    if (typeof socket != "undefined") {
                     try 
                     {socket.close();                     
                     }
                     catch(e){}   
                    }
                    msg.payload = null;
                    node.send(msg);                 
                    node.status({ fill: "red", shape: "ring", text: "disconnected" });
                    node.buttonState=false;           
                } 
                else if (msg.payload == 'on' || msg.payload == true) {getToken(key)}
          });
        }

    function whingroupcommander (config)
    {
    var resp = "";
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
    
    node.on('input', async function (msg) {
        const options = {
        hostname: 'whin2.p.rapidapi.com',
        port: 443,
        path: '/grpcmd',
        method: 'POST',
        headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": node.authconf.apikey,
            "X-RapidAPI-Host": "whin2.p.rapidapi.com",
            "Content-Type": "application/json"
                    }
        };
        /*
        const err=0;
        var error=0;
        var gid = "";   
        if (typeof msg.mlist!='object') {msg.mlist=[]; error=2}
        function pdata() {
         switch(msg.wgcmd) {            
              case "create":
                postdata ={
                    'gname' : msg.gname ||  "whin-group",
                    'mlist' : msg.mlist || [],
                    'cmd' : "create"
                }
                node.warn("Accion create seleccionada");
                break;
              case "add":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "add",
                    'mlist' : msg.mlist || []
                    }
                break;
              case "remove":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "remove",
                    'mlist' : msg.mlist || []
                    }
                break;
              case "promote":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "promote",
                    'mlist' : msg.mlist || []
                    }
                break;
            case "demote":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "demote",
                    'mlist' : msg.mlist || []
                    }
                break;     
            case "leave":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "leave"
                    }
                break;
            case "getcode":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "getcode"
                    }
                break;
            case "rvkcode":
                if (!msg.gid) {error = 1; break}
                if (!(msg.gid.includes('@'))) {gid = msg.gid+"@g.us"} else {gid = msg.gid}
                postdata = {
                    'gid' : gid,
                    'cmd' : "rvkcode"
                    }
                break;              
              default:
                postdata={};
                // code block
            } 
          return postdata;
          }

        for (let i=0; i<msg.mlist.length;i++ )
        {
            node.warn("En el loop de control de error de mlist");
            if (!(msg.mlist[i].includes("@"))) {msg.mlist[i]=msg.mlist[i]+"@s.whatsapp.net"}
        }
        if (error==1) {msg.payload={"ERROR":"Invalid group identifier (gid)"}; node.send(msg)}
        else {} */
        const req = https.request(options, (res) => {	
            res.setEncoding('utf8');  
            res.on('data', (d) => {
            msg.payload = JSON.parse(d);     
            node.send(msg); })
            })       
            req.on('error', (e) => {
                    msg.payload = {"ERROR":e}
                    node.send(msg);
                      })
            req.write(JSON.stringify(msg));
            req.end()          
    })

    }

    RED.nodes.registerType("whin_send", WhinSend);
    RED.nodes.registerType("whin_receive", WhinReceive);
    RED.nodes.registerType("whin_group_commander", whingroupcommander)
    RED.nodes.registerType("whin_config", WhinConfig);
    RED.httpAdmin.post("/wrInject/:id", RED.auth.needsPermission("inject.write"), function (req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
          try {
            var state = (req.body.on == 'true');
            node.receive({ payload: state });
            res.sendStatus(200);
          } catch (err) {
            res.sendStatus(500);
            node.error(RED._("inject.failed", { error: err.toString() }));
          }
        } else {
          res.sendStatus(404);
        }
      });
  }
