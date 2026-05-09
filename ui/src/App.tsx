import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AuthProvider from "./contexts/auth/AuthProvider";
// import CookieNoticeBar from "./components/CookieNoticeBar";
import Login from "./components/Login";
import Menubar from "./components/Menubar";
import Home from "./components/Home";
import ModalProvider from "./contexts/modal/ModalProvider";
import DeviceProvider from "./contexts/device/DeviceProvider";
import Projects from "./components/Home/Projects";
import ViewerComponent from "./components/Viewer";
import Project from "./components/Home/Projects/Project/index";
import ProjectMembers from "./components/Home/Projects/Project/ProjectMembers";
import ProjectPatients from "./components/Home/Projects/Project/ProjectPatients/index";
import Users from "./components/Home/Users";
import UserDetails from "./components/Home/Users/UserDetails";
import Patients from "./components/Home/Patients";
import Patient from "./components/Home/Patients/Patient";
import ProjectMember from "./components/Home/Projects/Project/ProjectMembers/ProjectMember/index";
import About from "./components/Home/About";
import { UI_PATHS } from "./utils/urls";
import FloatingActions from "./components/FloatingActions";

const THEME_STORAGE_KEY = "theme";
try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  document.body.dataset.theme = saved === "dark" ? "dark" : "light";
} catch {
  document.body.dataset.theme = "light";
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
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold leading-none";
        if (type === "success") {
          return (
            <span
              className={`${base} border-[color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color-mix(in_srgb,var(--success)_14%,var(--surface-soft))] text-[var(--success)]`}
              aria-hidden
            >
              ✓
            </span>
          );
        }
        if (type === "error") {
          return (
            <span
              className={`${base} border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface-soft))] text-[var(--danger)]`}
              aria-hidden
            >
              !
            </span>
          );
        }
        return (
          <span
            className={`${base} border-[color-mix(in_srgb,var(--warning)_40%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface-soft))] text-[var(--warning)]`}
            aria-hidden
          >
            ‼
          </span>
        );
      }}
    />
  );
}

export default function App() {
  return (
    <div className="relative flex h-dvh w-full max-w-full flex-col overflow-hidden text-[var(--text)] font-mono">
      <BrowserRouter>
        {/* <CookieNoticeBar /> */}
        <DeviceProvider>
          <AuthProvider>
            <ModalProvider>
              <Menubar>
                <Routes>
                  <Route path={"login/"} element={<Login />} />
                  <Route path="/" element={<Home />}>
                    <Route
                      index
                      element={<Navigate to={UI_PATHS.PROJECTS()} replace />}
                    />
                    <Route path="projects" element={<Projects />}></Route>
                    <Route path="projects/:projectId" element={<Project />} />
                    <Route
                      path="projects/:projectId/members"
                      element={<ProjectMembers />}
                    />
                    <Route
                      path="projects/:projectId/patients"
                      element={<ProjectPatients />}
                    />

                    <Route path="users" element={<Users />} />
                    <Route path="users/:userId" element={<UserDetails />} />

                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:patientId" element={<Patient />} />
                    <Route path="about" element={<About />} />
                    <Route
                      path="projects/:projectId/users/:userId/patients"
                      element={<ProjectMember />}
                    />
                  </Route>
                  <Route path="viewer/">
                    <Route path=":patientId">
                      <Route index element={<ViewerComponent />} />
                    </Route>
                  </Route>
                </Routes>
              </Menubar>
              <FloatingActions />
            </ModalProvider>
          </AuthProvider>
        </DeviceProvider>
        <AppToastContainer />
      </BrowserRouter>
    </div>
  );
}
