import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

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
