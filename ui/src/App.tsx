import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AuthProvider from "./contexts/auth/AuthProvider"
import Login from "./components/Login"
import Menubar from "./components/Menubar"
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
    <div className="relative flex h-screen w-screen flex-col text-[var(--text)] font-mono">
      <BrowserRouter>
        <AuthProvider>
          <ModalProvider>
            <Menubar>
              <Routes>
                <Route path={"login/"} element={<Login />} />
                <Route index element={<Navigate to="worklist/" replace />} />
                <Route path="worklist/">
                  <Route index element={<Home />} />
                  <Route path=":patient_id/" element={<Home />} />
                </Route>
                <Route path="viewer/">
                  <Route path=":patient_id/studies/:study_id/series/:series_id/">
                    <Route index element={<Viewer />} />
                  </Route>
                </Route>
              </Routes>
            </Menubar>
          </ModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </div >
  )
}
