import WebSocket,{WebSocketServer} from "ws";
import express from "express"
import cors from "cors"
import * as CustomSchemas from "./schemas.js"
import * as CustomTypes from "./types.js"
import { success } from "zod";

let wsToUsername=new Map<WebSocket,string[]>();
let roomCodeToUsernames=new Map<string,string[]>();
let usernameToRoomCode=new Map<string,string>();

const app=express()
app.use(cors({
    origin:"http://localhost:5173"
}))
const wss = new WebSocketServer({port:8080});

wss.on("connection",function(ws:WebSocket){

    ws.on("message",(msg:WebSocket.RawData)=>{
        const json_message:CustomTypes.frontendType=JSON.parse(msg.toString());
    })
    ws.on("close",()=>{
        console.log("user disconnected");
    })
})

app.post("/make-user",async(req,res)=>{
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

app.listen(3000,()=>{
    console.log("http server started running at port 3000\n")
});