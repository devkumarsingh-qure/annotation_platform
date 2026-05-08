import { createRoot } from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App";

if (import.meta.env.DEV && "ontouchstart" in window) {
  import("eruda").then((eruda) => {
    eruda.default.init();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
