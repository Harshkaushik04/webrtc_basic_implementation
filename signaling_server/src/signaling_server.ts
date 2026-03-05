import WebSocket,{WebSocketServer} from "ws";

const wss = new WebSocketServer({port:8080});

wss.on("connection",function(ws:WebSocket){
    ws.on("message",(msg:WebSocket.RawData)=>{
        const json_message=JSON.parse(msg.toString());
    })
})