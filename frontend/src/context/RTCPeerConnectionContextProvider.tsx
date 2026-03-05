import { createContext } from "react"
import type { ReactNode } from "react";

interface Props{
    children:ReactNode
}

export const RTCPeerConnectionContext = createContext<RTCPeerConnection|null>(null); 

export function RTCPeerConnectionContextProvider({children}:Props){
    const peerConnection = new RTCPeerConnection({
        iceServers:[
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    })
    return <RTCPeerConnectionContext.Provider value={peerConnection}>
        {children}
    </RTCPeerConnectionContext.Provider>
}