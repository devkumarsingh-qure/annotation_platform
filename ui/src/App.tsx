import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import AuthProvider from "./contexts/auth/AuthProvider"
import Login from "./components/Login"
import Menubar from "./components/Menubar"
import Home from "./components/Home"
import ModalProvider from "./contexts/modal/ModalProvider"
import Projects from "./components/Home/Projects"
import ProjectsList from "./components/Home/Projects/ProjectsList"
import ProjectShell from "./components/Home/Projects/ProjectShell"
import ProjectUsersRoute from "./components/Home/Projects/ProjectUsersRoute"
import ProjectUsersTab from "./components/Home/Projects/ProjectUsersTab"
import ProjectUserDetailTab from "./components/Home/Projects/ProjectUserDetailTab"
import ProjectPatientsTab from "./components/Home/Projects/ProjectPatientsTab"
import ProjectDefaultRedirect from "./components/Home/Projects/ProjectDefaultRedirect"
import Patients from "./components/Home/Patients"
import Users from "./components/Home/Users"
import ViewerComponent from "./components/Viewer"

const THEME_STORAGE_KEY = "theme"
try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  document.body.dataset.theme = saved === "dark" ? "dark" : "light"
} catch {
  document.body.dataset.theme = "light"
}

function AppToastContainer() {
  return (
    <ToastContainer
      className="app-toaster"
      toastClassName="app-toast"
      position="top-right"
      autoClose={4500}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={5}
      icon={({ type }) => {
        const base =
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold leading-none"
        if (type === "success") {
          return (
            <span
              className={`${base} border-[color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color-mix(in_srgb,var(--success)_14%,var(--surface-soft))] text-[var(--success)]`}
              aria-hidden
            >
              ✓
            </span>
          )
        }
        if (type === "error") {
          return (
            <span
              className={`${base} border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface-soft))] text-[var(--danger)]`}
              aria-hidden
            >
              !
            </span>
          )
        }
        return (
          <span
            className={`${base} border-[color-mix(in_srgb,var(--warning)_40%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface-soft))] text-[var(--warning)]`}
            aria-hidden
          >
            ‼
          </span>
        )
      }}
    />
  )
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
                <Route path="/" element={<Home />}>
                  <Route path="projects" element={<Projects />}>
                    <Route index element={<ProjectsList />} />
                    <Route path=":projectId" element={<ProjectShell />}>
                      <Route index element={<ProjectDefaultRedirect />} />
                      <Route path="users" element={<ProjectUsersRoute />}>
                        <Route index element={<ProjectUsersTab />} />
                        <Route path=":userId" element={<ProjectUserDetailTab />} />
                      </Route>
                      <Route path="patients" element={<ProjectPatientsTab />} />
                    </Route>
                  </Route>
                  <Route path="patients" element={<Patients />}>
                    <Route path=":patientId" element={<Patients />} />
                  </Route>
                  <Route path="users" element={<Users />}>
                    <Route path=":userId" element={<Users />} />
                  </Route>
                </Route>
                <Route path="viewer/">
                  <Route path=":patientId/studies/:studyId/series/:seriesId/">
                    <Route index element={<ViewerComponent />} />
                  </Route>
                </Route>
              </Routes>
            </Menubar>
          </ModalProvider>
        </AuthProvider>
        <AppToastContainer />
      </BrowserRouter>
    </div >
  )
}
