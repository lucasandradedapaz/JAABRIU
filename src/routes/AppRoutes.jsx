import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Chamados from "../pages/Chamados/Chamados";
import NovoChamado from "../pages/Chamados/NovoChamado";
import DetalhesChamado from "../pages/Chamados/DetalhesChamado";
import Historico from "../pages/Historico/Historico";
import Profile from "../pages/Profile/Profile";
import Usuarios from "../pages/Usuarios/Usuarios";
import Relatorios from "../pages/Relatorios/Relatorios";
import NotFound from "../pages/NotFound/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pública */}
        <Route path="/" element={<Login />} />

        {/* privadas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN", "TECNICO"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chamados"
          element={
            <ProtectedRoute>
              <Chamados />
            </ProtectedRoute>
          }
        />

        <Route
          path="/novo-chamado"
          element={
            <ProtectedRoute>
              <NovoChamado />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chamados/:id"
          element={
            <ProtectedRoute>
              <DetalhesChamado />
            </ProtectedRoute>
          }
        />

        <Route
          path="/historico"
          element={
            <ProtectedRoute roles={["ADMIN", "TECNICO"]}>
              <Historico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* só admin */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <Relatorios />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
