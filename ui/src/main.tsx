import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const THEME_STORAGE_KEY = 'theme'
try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  document.body.dataset.theme = saved === 'dark' ? 'dark' : 'light'
} catch {
  document.body.dataset.theme = 'light'
}
import AuthProvider from "./contexts/AuthProvider"
import Login from "./components/Login"
import Menubar from "./components/Menubar"
import { UI_PATHS } from "./utils/urls"
import Home from "./components/Home"
import ModalProvider from "./contexts/ModalProvider"
import Viewer from "./components/Viewer"

createRoot(document.getElementById('root')!).render(
  <Entry />
)

function Entry() {
  return (
    <div className="relative flex h-screen w-screen flex-col text-[var(--text)]">
      <BrowserRouter>
        <AuthProvider>
          <ModalProvider>
            <Menubar>
              <Routes>
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