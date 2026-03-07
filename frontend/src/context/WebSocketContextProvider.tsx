import { createContext, useEffect, useRef } from "react";
import { useState } from "react";
import type {ReactNode} from "react";

interface Props{
    children:ReactNode;
}
export const WebSocketContext=createContext<WebSocket|null>(null);
export function WebSocketContextProvider({children}:Props){
    const socketRef = useRef<WebSocket|null>(null);
    if(!socketRef.current){
        socketRef.current = new WebSocket("wss://localhost:8080");
    }
    useEffect(()=>{
        return ()=>{
            socketRef.current?.close();
        }
    },[socketRef.current])
    return <WebSocketContext.Provider value={socketRef.current}>
        {children}
    </WebSocketContext.Provider>
}