import { BrowserRouter, Route,Routes } from "react-router-dom";
import { MainCall } from "./Pages/MainCall";
import { Landing } from "./Pages/Landing";
import { WebSocketContextProvider } from "./context/WebSocketContextProvider";
import { RTCPeerConnectionContextProvider } from "./context/RTCPeerConnectionContextProvider";

export default function App() {
  return (
  <BrowserRouter>
  <WebSocketContextProvider><RTCPeerConnectionContextProvider>
  <Routes>
    <Route element={<Landing/>} path="/"/>
    <Route element={<MainCall/>} path="/MainCall"/>
  </Routes>
  </RTCPeerConnectionContextProvider></WebSocketContextProvider>
  </BrowserRouter>)
}