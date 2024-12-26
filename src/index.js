import React from "react";
import ReactDOM from "react-dom/client"; // createRoot burada geliyor
import App from "./App";
import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root")); // Yeni API
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
