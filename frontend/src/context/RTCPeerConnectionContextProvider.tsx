import { createContext } from "react"
import type { ReactNode } from "react";
import { useRef } from "react";

interface Props{
    children:ReactNode
}

export const RTCPeerConnectionContext = createContext<RTCPeerConnection|null>(null); 

export function RTCPeerConnectionContextProvider({children}:Props){
    const peerConnectionRef = useRef<RTCPeerConnection|null>(null);
    // could have used useEffect() here tho this is preffered since we want peerConnection object to be formed before ui renders and not after
    if(!peerConnectionRef.current){
        peerConnectionRef.current = new RTCPeerConnection({
            iceServers:[
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        })
    }
    return <RTCPeerConnectionContext.Provider value={peerConnectionRef.current}>
        {children}
    </RTCPeerConnectionContext.Provider>
}