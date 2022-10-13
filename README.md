# Summary
Whin is a whatsapp gateway designed to support home-lab most frequent use cases for free; the back-end acts as a whatsapp shared gateway, the client side is a set of node-red nodes available at the editor Palette.

Since its first release we found some "Power users" that need more than the average home user to implement their use cases. If you are one of those, you can signup for one of the paid Tiers that support: special features, custom front-ends / clients, extremely high throughput, or even a dedicated tenant. 


## Install: 

To install whin, your first choice should be using node-red editor Palette. Find the repo: @inutil-labs/node-red-whin-whatsapp and install.

As an alt method: open a terminal, cd to the user modules directory (tipically ~/data/node_modules/), git clone this repository inside, cd into the folder created, and run this command:

    npm install @inutil-labs/node-red-whin-whatsapp


## Set-up whin:

You need to become a whin user to get your user credentials. There's a free Tier for home-Lab owners which will cover (hopefully) all your needs, so there's no intrinsic cost associated to use whin. If you click on this [link](https://www.youtube.com/watch?v=uOZ-oH4kP58) you can watch a step-by-step video showing how to get subscribed to whin **free Tier**.

If you don't like following videos, the back-end API documentation and how-to tutorials can be found [here](https://rapidapi.com/inutil-inutil-default/api/whin2/).

All whin nodes installed share a configuration node that stores your user credentials. Once you get subscribed an ApiKey will show up: copy it; then open the configuration node and paste it on the field named: *ApiKey*. That's all you need to do to start using whin.

A whin-config node looks like this when properly configured:

![Config](./icons/config-node.png)

### About the ApiKey:
The *ApiKey* field is expecting a string, numbers and letters with no spaces. If you get stucked, check this [video](https://www.youtube.com/watch?v=uOZ-oH4kP58) and see from where can you copy the key that you have to paste on the config node.
Note that the ApiKey value is linked with the phone number you used to sign-up. Consequently the messages sent from node-red will always be delivered by whin to the phone number linked with the ApiKey used. This is to prevent spam.

Each ApiKey is valid forever as long as you keep subscribed to whin; this remains true even if you are subscribed to the free plan.

### Infographic of the set-up:
This picture shows the overall process:
1. subscribe to the free tier and get an apikey.
2. send a sign-up message to link your phone number with the apikey.
3. config whin on node-red.

![whin-nodes](./icons/infographic-whin2.png)


## Whin Nodes:
When you install @inutil-labs/node-red-whin-whatsapp package, you will get several Nodes available on node-red Palette under the Network category: 
- whin-receive, 
- whin-send, 
- whin-confirm. 

These Nodes rely on a configuration Node called whin-config (not visible on the editor Palette).

### The Configuration Node (whin-config):
This node will be used to enter your credentials; the credentials will be available and shared among all whin nodes.
If you happen to have several phone numbers at home, you will need an ApiKey for each number and create a profile for each on the whin-config node.
This is the field that you need to complete to set up the whin-config node:

![config-node](./icons/config-node.png)


### Sender Node (whin-send):
This is the node we recomend you start using, right after you complete the config-node set-up. Just select the configuration you saved:
![sender-node](./icons/sender-node.png)

Wire an inject node to whin-send, choose the type of message you want to send (see all types and its schemas below), and you should receive the whatsapp on your client (web or app). Anything that comes in whin-send as data payload will be sent, and bear in mind the payload MUST be a JSON object with any of the valid schemas described below.

![sender-node2](./icons/send_flow.png)


### Listener Node (whin-receive):
Whin-receive node will allow you to send whatsapps to your node-red environment; any message you send from the whatsapp number linked to the ApiKey to whin, will be received by this node on node-red.
You might create your own syntax to trigger stuff in node-red from whatsapp. Switching on lights or music, disconnect the alarm, run a sales report, send a document and process it on node-red somehow... Sky is the limit.

The Listener can operate on two different modes: webhook mode and always-on mode.

#### Running on webhook mode:
This option is available for all users on all Tiers. You need to expose a webhook route, and tell whin back-end which is the route you wish the messages to be delivered.

#### Running on always-on mode:
This option is working for users on paid plans only. After adding this node to a flow, when you hit deploy on the node-red editor you will see that whin-receive shows a message saying: "connected to Whatsapp". No further configuration is needed.


### Confirmation Node (whin-confirm):
This node sends a request to get an active user confirmation; when answered, you will get the response as an output of the node. 
There's a max time to answer on whatsapp, if you reach the time without answering, the output payload will contain a time-out msg.

whin-confirm node will take two inputs: a question and a time period. The question goes on the msg.payload property and a time-to-live (ttl) in the msg.ttl property (this integer number is treated as time, expressed in miliseconds). These are the two inputs expected.

When the node is triggered, it will send you a whatsapp with the question you entered on the payload, and you will have a time to answer it (yes/no). 
If you click "Yes" on whatsapp, you will get a "YES" as output of the node.
If you click "No", you will get a "NO" on node-red output.
If you reach the ttl and provide no answer, the node will default to a "Time-out" message.

Each transaction is unique, meaning that you can only get one output after each trigger: YES, NO or Time-out

We like to think of it as the SMS / push-notifications you get from your bank these days, but answered with a simple button. The main use-case here is allowing you to "authorize" the execution of a flow branch that you don't want to run without manual intervention on node-red.

![confirm-node](./icons/confirm_inputs.jpg)

Be mindful that if there is a whin-receive node running in parallel, the response will flow through both listeners. In that case, you might notice a difference.
whin-confirm will output Yes, No, or TimeOut while your whin-receive node will receive whatever the answer is together with a 'unique request identifier'. That's the raw response.

There's plenty of use-cases where one wants to grant permission to a flow, like: door opening, a server restart based on some alert / timing. In plain english: You get the request, you authorise, decline or ignore it.

The backend controls the message expirity as well and, should you exahust the ttl, will respond directly in your phone and won't send the response back to node-red.

![confirm-node2](./icons/confirm_flow.jpg)


## Types of messages:
Whin will send / receive several types of messages, you can send:
- text messages.
- buttons.
- lists.
- vCards.
- locations.

You need to set the right payload schema so that the back-end understands the request you send, otherwise whin wont be able to route the message.

### Text message:
If you want to send a text, the msg.payload schema expected is a JSON object:

```json
{
  "text" : "this is a text sent from whin"
}
```
You will send a regular text message.

### List message:
If you want to send a list, the msg.payload schema expected is a JSON object:
```json
{
  "text": "This is a list",
  "footer": "nice footer, link: https://inutil.info",
  "title": "Amazing boldfaced list title",
  "buttonText": "Required, text on the button to view the list",
  [
    {
	"title": "Section 1",
	"rows": [
	    	{"title": "Option 1", "rowId": "option1"},
	    	{"title": "Option 2", "rowId": "option2", "description": "This is a description"}
		]
    },
   {
	"title": "Section 2",
	"rows": [
	    	{"title": "Option 3", "rowId": "option3"},
	    	{"title": "Option 4", "rowId": "option4", "description": "This is a description V2"}
		]
    },
  ]
}
```
This is how it looks the message that you will send:

![list](./icons/list.png)

### Buttons message:
If you want to send a set of buttons, the msg.payload schema expected is a JSON object:
```json
{
    "text": "This is a button message",
    "footer": "Hello World",
    "buttons": [
  		{"buttonId": "id1", "buttonText": {"displayText": "Button 1"}, "type": 1},
  		{"buttonId": "id2", "buttonText": {"displayText": "Button 2"}, "type": 1},
  		{"buttonId": "id3", "buttonText": {"displayText": "Button 3"}, "type": 1}
		],
    "headerType": 1
}
```
This is how it looks the message that you will send:

![button](./icons/button.png)



If you want to send a set of buttons with an image header, the msg.payload schema expected is a JSON object:
```json
{
    "image": {"url": 'https://inutil.info/img/portfolio/4.jpg'},
    "caption": "This is a button message with img",
    "footer": "Hello World",
    "buttons": [
  		{"buttonId": "id1", "buttonText": {"displayText": "Button 1"}, "type": 1},
  		{"buttonId": "id2", "buttonText": {"displayText": "Button 2"}, "type": 1},
  		{"buttonId": "id3", "buttonText": {"displayText": "Button 3"}, "type": 1}
		],
    "headerType": 4
}
```




### vCard message:
If you want to send a contact vCard, the msg.payload schema expected is a JSON object:
```
{ 
    "displayName": "whin", 
    "contacts": 
    	[{ 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + 'FN:whin bot\n' // full name
            + 'ORG:Inutil Labs;\n' // the organization of the contact
	    + 'TEL;type=CELL;type=VOICE;waid=34605797764:+34 605 797 764\n' // WhatsApp ID + phone number
            + 'END:VCARD' 
	}] 
}
```
This is how it looks the message that you will send:

![vCard](./icons/vcard.png)

### Location message:
If you want to send a Location, the msg.payload schema expected is a JSON object:

```json
{
  "location": { "degreesLatitude": 24.121231, "degreesLongitude": 4.019293 }
}
```
This is how it looks the message that you will send:


## Sample Flows:

We are including a very simple set of flows under the examples folder on this repo. Use the examples to understand how the different messages formats are. We strongly recommend you use them to bootstrap your own use cases so that you get familiar with them.

Or you can also import this flow and test them all at once.

    [{"id": "cf90d56d.79ba58","type": "comment","z": "78016605e351f287","name": "Text Message","info": "","x": 890,"y": 60,"wires": []},{"id":"254b3eb.401ea42","type": "inject","z": "78016605e351f287","name": "Start","props": [{"p": "payload"}],"repeat": "","crontab": "","once": false,"onceDelay": 0.1,"topic": "","payload": "","payloadType": "date","x": 890,"y": 100,"wires": [["11978f99.6a17d"]]},{"id": "11978f99.6a17d","type": "function","z": "78016605e351f287","name": "SetMessage","func": "msg.payload = \n  {\n  'text' : 'Hello from whin'  \n  }\nreturn msg;","outputs": 1,"noerr": 0,"initialize": "","finalize": "","libs": [],"x": 1080,"y": 100,        "wires": [["c1a2645eccea04a2"]]},{"id": "d6f47f62.648318","type": "comment",        "z": "78016605e351f287",        "name": "VCARD",        "info": "",        "x": 870,        "y": 360,        "wires": []    },    {        "id": "fbcf69bd.f4d3d8",        "type": "inject",        "z": "78016605e351f287",        "name": "Start",        "props": [            {                "p": "payload"            }        ],     "repeat": "",        "crontab": "",        "once": false,        "onceDelay": 0.1,        "topic": "",        "payload": "",        "payloadType": "date",        "x": 890,        "y": 400,        "wires": [            [                "79ed70bc.d159b"            ]        ]    },    {        "id": "79ed70bc.d159b","type": "function","z": "78016605e351f287","name": "SetMessage","func": "const vcard = 'BEGIN:VCARD\\n' // metadata of the contact card\n            + 'VERSION:3.0\\n' \n            + 'FN:Alsa k0de\\n' // full name\n            + 'ORG:Inutil Labs;\\n' // the organization of the contact\n            + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\\n' // WhatsApp ID + phone number\n            + 'END:VCARD'\n\n\nmsg.payload = { \n        contacts: { \n            displayName: 'Alsak0de', \n            contacts: [{ vcard }] \n        }}\nreturn msg;\n","outputs": 1,"noerr": 0,"initialize": "","finalize": "","libs": [],"x": 1080,"y": 400,"wires": [["c1a2645eccea04a2"]]},{"id": "9f60d55f.a054d",       "type": "comment",        "z": "78016605e351f287",        "name": "List",      "info": "",        "x": 870,        "y": 160,        "wires": []    },    {        "id": "b773a4dc.c1b88",        "type": "inject",        "z": "78016605e351f287",      "name": "Start",        "props": [            {                "p": "payload"            }        ],        "repeat": "",        "crontab": "",        "once": false,        "onceDelay": 0.1,        "topic": "",        "payload": "",        "payloadType": "date",        "x": 890,        "y": 200,        "wires": [            [                "893dbacb.e78468"            ]        ]    },    {        "id": "893dbacb.e78468",        "type": "function",        "z": "78016605e351f287",        "name": "SetMessage","func": "const sections = [\n    {\n\ttitle: \"Section 1\",\n\trows: [\n\t    {title: \"Option 1\", rowId: \"option1\"},\n\t    {title: \"Option 2\", rowId: \"option2\", description: \"This is a description\"}\n\t]\n    },\n   {\n\ttitle: \"Section 2\",\n\trows: [\n\t    {title: \"Option 3\", rowId: \"option3\"},\n\t    {title: \"Option 4\", rowId: \"option4\", description: \"This is a description V2\"}\n\t]\n    },\n]\n\nconst listMessage = {\n  'text': \"This is a list\",\n  'footer': \"nice footer, link: https://inutil.info\",\n  'title': \"Amazing boldfaced list title\",\n  'buttonText': \"Required, text on the button to view the list\",\n  sections\n}\n\n\nmsg.payload = listMessage;\nreturn msg;\n","outputs": 1,"noerr": 0,       "initialize": "",        "finalize": "",        "libs": [],        "x": 1080,        "y": 200,        "wires": [            [                "c1a2645eccea04a2"            ]        ]    },    {        "id": "282dfc0.fee7904",        "type": "comment",        "z": "78016605e351f287",        "name": "Buttons",        "info": "",        "x": 870,        "y": 260,        "wires": []    },    {        "id": "8b0ec2c0.88f7c",        "type": "inject",        "z": "78016605e351f287",        "name": "Start",        "props": [            {                "p": "payload"            }        ],        "repeat": "",        "crontab": "",        "once": false,        "onceDelay": 0.1,        "topic": "",        "payload": "",        "payloadType": "date",        "x": 890,        "y": 300,        "wires": [            [                "a80c681f.e941d"            ]        ]    },    {        "id": "a80c681f.e941d",        "type": "function",        "z": "78016605e351f287",        "name": "SetMessage",        "func": "const buttons = [\n  {'buttonId': 'id1', 'buttonText': {'displayText': 'Button 1'}, 'type': 1},\n  {'buttonId': 'id2', 'buttonText': {'displayText': 'Button 2'}, 'type': 1},\n  {'buttonId': 'id3', 'buttonText': {'displayText': 'Button 3'}, 'type': 1}\n]\n\nconst buttonMessage = {\n    'text': \"Hi it's button message\",\n    'footer': 'Hello World',\n    'buttons': buttons,\n    'headerType': 1\n}\n\n\nmsg.payload = buttonMessage;\nreturn msg;\n",        "outputs": 1,        "noerr": 0,        "initialize": "",        "finalize": "",        "libs": [],        "x": 1080,        "y": 300,        "wires": [            [                "c1a2645eccea04a2"            ]        ]    },    {        "id": "c1a2645eccea04a2",        "type": "whin-send",        "z": "78016605e351f287",        "name": "",        "auth": "10698f5ae088e44c",        "x": 1370,        "y": 240,        "wires": [            [                "e8d8ea3f64f747a6"            ]]},{"id": "e8d8ea3f64f747a6","type": "debug","z": "78016605e351f287","name": "debug 31","active": true,"tosidebar": true,"console": false,"tostatus": false,"complete": "false","statusVal": "","statusType": "auto","x": 1560,"y": 240,"wires": []},{"id": "10698f5ae088e44c","type": "whin-config","name": "whin","apikey": "your_api_goes_here"}]


## Demo videos:

![demo-video](https://i.imgur.com/e8rxz0P.gif)


Do you want more videos? check this playlist: 
https://www.youtube.com/playlist?list=PLY4sFY6dmLqxpt3SM5IagyMSdCAc6WNMP

## Error handling:
There are three types of errors that you can get when using the nodes:
  1. ApiKey invalid. This means that you did a mistake when you entered the ApiKey on the config node.
  2. The number of requests reached the limit. This means that you reached the limit on requests set on your Tier.
  3. To use this API, you need to subscribe first. Self-explanatory.

## Known bugs. Please make sure you're always on the latest release.
We tend to roll out new versions after deep testing, but you might find something not working as expected, please open an issue on the repo and we will follow up.
At the moment we are not aware of anything that could be considered as a bug.

## Security:
While we have not implemented military-class security, we have done our best to secure your data (both in transit and at rest). Should you need some answers with details please reach out and we will try to help you understand better the internals of whin. 

## Terms of use:
The service can be used free of charge. You will need to register at [rapidAPI.com](https://rapidapi.com/inutil-inutil-default/api/whin2/) to complete the set-up. 
We understand that the user sending the sign-up message wishes to use the service. The service is sending whatsapp messages ONLY to the number that was subscribed. We do not share the numbers using the service with anyone.

There is a rate limit associated with the Tier choosen when you subscribe. When the rate limit is reached, the gateway will not process messages until the next limit cycle starts (tipically the next day). You can always upgrade your Tier if you need higher limits. 

If you wish to stop using the service you need to unsubscribe; we do not remove (clean) users not using the service.
