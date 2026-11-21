import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const platformHost = "plataforma.littlebigcoders.com.br";
if (window.location.hostname === platformHost && ["", "#/"].includes(window.location.hash)) {
  window.history.replaceState(null, "", window.location.pathname + window.location.search + "#login");
} else if (window.location.hostname === "www.littlebigcoders.com.br" && window.location.hash === "#login") {
  window.location.replace(`https://${platformHost}/#login`);
}

const system = createSystem(defaultConfig, { theme: { tokens: { fonts: {
  body: { value: "'Open Sans', sans-serif" },
  heading: { value: "'Open Sans', sans-serif" },
} } } });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
