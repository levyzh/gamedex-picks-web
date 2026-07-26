import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// no BrowserRouter here, unlike the main app. picks is one screen — logged
// out or logged in — so there are no routes to keep in the address bar yet.
// add it back the day there's a second page.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
