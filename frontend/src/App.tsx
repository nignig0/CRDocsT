import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
    return (
        <div className="container flex flex-col justify-center items-center p-10">
            <h1 className="m-5 text-5xl font-bold">CRDT Editor</h1>
            <textarea className="textarea w-[80%] h-[80vh]" />
        </div>
    );
}

export default App;
