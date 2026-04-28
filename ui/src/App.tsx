import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AuthProvider from "./contexts/auth/AuthProvider"
import Login from "./components/Login"
import Menubar from "./components/Menubar"
import { UI_PATHS } from "./utils/urls"
import Home from "./components/Home"
import ModalProvider from "./contexts/modal/ModalProvider"
import Viewer from "./components/Viewer"

const THEME_STORAGE_KEY = "theme"
try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  document.body.dataset.theme = saved === "dark" ? "dark" : "light"
} catch {
  document.body.dataset.theme = "light"
}

export default function App() {
  return (
    <div className="relative flex h-screen w-screen flex-col text-[var(--text)]">
      <BrowserRouter>
        <AuthProvider>
          <ModalProvider>
            <Menubar>
              <Routes>
                <Route path="/" element={<Navigate to="/patient" replace />} />
                <Route path="/patient" element={<Home />} />
                <Route path={UI_PATHS.LOGIN} element={<Login />} />
                <Route path={UI_PATHS.PATIENT} element={<Home />} />
                <Route path={UI_PATHS.PATIENTS} element={<Home />} />
                <Route path={UI_PATHS.VIEWER} element={<Viewer />} />
              </Routes>
            </Menubar>
          </ModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}
