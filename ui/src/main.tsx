import { createRoot } from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App";

if (import.meta.env.DEV) {
  import("eruda").then((eruda) => {
    eruda.default.init();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
