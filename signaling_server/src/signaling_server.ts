import WebSocket,{WebSocketServer} from "ws";
import express from "express"
import cors from "cors"
import * as CustomSchemas from "./schemas.js"
import * as CustomTypes from "./types.js"
import {createServer} from "http"

let wsToUsername=new Map<WebSocket,string>();
let usernameToWs=new Map<string,WebSocket>();
let roomCodeToUsernames=new Map<string,string[]>();
let usernameToRoomCode=new Map<string,string>();

const app=express()
app.use(cors({
    origin:"*"
}));
app.use(express.json());
const server = createServer(app);
const wss = new WebSocketServer({server});

function printMapStringStringList(mpp:Map<string,string[]>){
    for(const [key,value] of mpp){
        console.log(key,":",value);
    }
}
setInterval(() => printMapStringStringList(roomCodeToUsernames), 2000)
wss.on("connection",function(ws:WebSocket){
    ws.on("message",(msg:WebSocket.RawData)=>{
        const json_message:CustomTypes.frontendType=JSON.parse(msg.toString());
        if(json_message.type=="make-user"){
            console.log("ws [make-user]");
            wsToUsername.set(ws,json_message.username);
            usernameToWs.set(json_message.username,ws);
        }
        else if(json_message.type=="new-ice-candidate" || json_message.type=="video-answer" || json_message.type=="video-offer"){
            console.log(`ws [${json_message.type}]`)
            if(!wsToUsername.has(ws)) console.log("this ws doesnt isnt registered in wsToUsername");
            else{
                //@ts-ignore
                const username:string = wsToUsername.get(ws);
                const roomCode:string|undefined = usernameToRoomCode.get(username);
                if(!roomCode) throw new Error("user not registered in usernameToRoomCode map");
                const usernames:string[]|undefined = roomCodeToUsernames.get(roomCode);
                if(!usernames) throw new Error("roomCode not registered in roomCodeToUsernames");
                for(const alt_username of usernames){
                    if(alt_username!=username){
                        const alt_ws:WebSocket|undefined=usernameToWs.get(alt_username);
                        if(!alt_ws) throw new Error(`${alt_username} not registered in usernameToWs`);
                        alt_ws.send(JSON.stringify(json_message));
                    }
                }
            }
        }
    })
    ws.on("close",()=>{
        const username:string|undefined=wsToUsername.get(ws);
        if(username){
            console.log(`${username} disconnected`);
        }
        else console.log("user disconnected");
        if(username){
            const roomCode:string|undefined=usernameToRoomCode.get(username);
            if(usernameToWs.has(username)){
                usernameToWs.delete(username);
            }
            if(roomCode){
                usernameToRoomCode.delete(username);
                if(roomCodeToUsernames.has(roomCode)){
                    const usernames:string[]|undefined=roomCodeToUsernames.get(roomCode);
                    if(usernames){
                        const index:number=usernames.indexOf(username);
                        if(index>-1) usernames.splice(index,1);
                    }
                }
            }
            wsToUsername.delete(ws);
        }

    })
})

app.post("/make-user",async(req,res)=>{
    console.log("http [make-user]")
    const makeUserReqCheck = CustomSchemas.makeUserRequestSchema.safeParse(req.body);
    if(!makeUserReqCheck.success){ //since this application is not meant to scale, i am not adding "approved" and "error" keys inside sent response
        console.log("make-user request schema wrong")
    }
    const reqBody:CustomTypes.makeUserRequestType=req.body;
    const username:string=reqBody.username;
    const roomCode:string=reqBody.roomCode;
    if(usernameToRoomCode.has(username)){
        res.send({
            type:"make-user",
            success:"no",
            role:"nothing",
            targetUsername:"nothing",
            error:"duplicate username in usernameToRoomCode"
        });
    }
    else if(roomCodeToUsernames.has(roomCode)){
        //@ts-ignore
        if(roomCodeToUsernames.get(roomCode).length>=2){
            res.send({
                type:"make-user",
                success:"no",
                role:"nothing",
                targetUsername:"nothing",
                error:"room is already full"
            });
        }
        //@ts-ignore
        else if(roomCodeToUsernames.get(roomCode).length==0){
            roomCodeToUsernames.set(roomCode,[username]);
            usernameToRoomCode.set(username,roomCode);
            res.send({
                type:"make-user",
                success:"yes",
                role:"callee",
                targetUsername:"nothing"
            })
        }
        else{
            //@ts-ignore
            const prev:string[] = roomCodeToUsernames.get(roomCode);
            roomCodeToUsernames.set(roomCode,[...prev,username]);
            usernameToRoomCode.set(username,roomCode);
            res.send({
                type:"make-user",
                success:"yes",
                role:"caller",
                targetUsername:prev[0]
            });
        }
    }
    else{
        usernameToRoomCode.set(username,roomCode);
        roomCodeToUsernames.set(roomCode,[username]);
        res.send({
            type:"make-user",
            success:"yes",
            role:"callee",
            targetUsername:"nothing"
        })
    }
})

server.listen(3000,()=>{
    console.log("http and ws server are running at port 3000\n")
});