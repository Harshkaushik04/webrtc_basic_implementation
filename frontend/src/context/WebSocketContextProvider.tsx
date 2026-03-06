import { createContext, useEffect, useRef } from "react";
import { useState } from "react";
import type {ReactNode} from "react";

interface Props{
    children:ReactNode;
}
export const webSocketContext=createContext<WebSocket|null>(null);
export function WebSocketContextProvider({children}:Props){
    const socketRef = useRef<WebSocket|null>(null);
    useEffect(()=>{
        const ws=new WebSocket("ws://localhost:8080");
        socketRef.current = ws;
        return ()=>{
            socketRef.current?.close();
        }
    },[socketRef.current])
    return <webSocketContext.Provider value={socketRef.current}>
        {children}
    </webSocketContext.Provider>
}