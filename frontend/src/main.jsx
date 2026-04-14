import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StellarWalletProvider } from "./contexts/StellarWalletContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import "./index.css";
import App from "./App.jsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StellarWalletProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </StellarWalletProvider>
    </QueryClientProvider>
  </StrictMode>,
);
