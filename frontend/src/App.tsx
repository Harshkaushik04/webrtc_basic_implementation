import { Route,Routes } from "react-router-dom";
import { MainCall } from "./Pages/MainCall";
import { WebSocketContextProvider } from "./context/WebSocketContextProvider";
import { RTCPeerConnectionContextProvider } from "./context/RTCPeerConnectionContextProvider";

export default function App() {
  return (<WebSocketContextProvider><RTCPeerConnectionContextProvider>
  <Routes>
    <Route element={<MainCall/>} path="/"/>
  </Routes>
  </RTCPeerConnectionContextProvider></WebSocketContextProvider>)
}