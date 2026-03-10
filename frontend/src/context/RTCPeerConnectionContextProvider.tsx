import { createContext } from "react"
import type { ReactNode } from "react";
import { useRef,useState } from "react";

interface Props{
    children:ReactNode
}

export type RTCPeerConnectionContextType={
    myPeerConnections:React.RefObject<Map<string,RTCPeerConnection>>;
    remoteStreams:Map<string,MediaStream>,
    addRemoteStream:(username:string,stream:MediaStream)=>void,
    removeRemoteStream:(username:string)=>void
}

export const RTCPeerConnectionContext = createContext<RTCPeerConnectionContextType|null>(null); 

export function RTCPeerConnectionContextProvider({children}:Props){
    const myPeerConnections = useRef<Map<string,RTCPeerConnection>>(new Map<string,RTCPeerConnection>()); // target_username, my own RTCPeerConnection object with that user
    const [remoteStreams,setRemoteStreams] = useState<Map<string,MediaStream>>(new Map<string,MediaStream>());
    function addRemoteStream(username:string,stream:MediaStream){
        setRemoteStreams((prevRemoteStreams:Map<string,MediaStream>)=>{
            const prev:Map<string,MediaStream> = new Map<string,MediaStream>(prevRemoteStreams);
            prev.set(username,stream);
            return prev;
        })
    }
    function removeRemoteStream(username:string){
        setRemoteStreams((prevRemoteStreams:Map<string,MediaStream>)=>{
            const prev:Map<string,MediaStream> = new Map<string,MediaStream>(prevRemoteStreams);
            if(prev.has(username)) prev.delete(username);
            return prev;
        })
    }
    // could have used useEffect() here tho this is preffered since we want peerConnection object to be formed before ui renders and not after
    return <RTCPeerConnectionContext.Provider value={{
        myPeerConnections:myPeerConnections,
        remoteStreams:remoteStreams,
        addRemoteStream:addRemoteStream,
        removeRemoteStream:removeRemoteStream
    }}>
        {children}
    </RTCPeerConnectionContext.Provider>
}