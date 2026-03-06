import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './app/hooks'
import ProtectedRoute from './components/ProtectedRoute'
import ShellLayout from './components/ShellLayout'
import { meThunk } from './features/auth/authSlice'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import MatchesPage from './pages/MatchesPage'
import MonitorsPage from './pages/MonitorsPage'
import AdminProfilePage from './pages/AdminProfilePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPage from './pages/RegisterPage'
import ReservationsPage from './pages/ReservationsPage'
import ReservationFormPage from './pages/ReservationFormPage'
import StagiaireAvailabilityPage from './pages/StagiaireAvailabilityPage'
import StagiaireContactSupportPage from './pages/StagiaireContactSupportPage'
import StagiaireReserveTerrainPage from './pages/StagiaireReserveTerrainPage'
import StagiairesPage from './pages/StagiairesPage'
import TerrainFormPage from './pages/TerrainFormPage'
import TerrainsPage from './pages/TerrainsPage'

export default function App() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const theme = useAppSelector((state) => state.ui.theme)
  const language = useAppSelector((state) => state.ui.language)
  const { i18n } = useTranslation()

  useEffect(() => {
    if (token) {
      dispatch(meThunk())
    }
  }, [dispatch, token])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    i18n.changeLanguage(language)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n, language])

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/login_stagiaire" replace />} />
      <Route path="/login_stagiare" element={<Navigate to="/login_stagiaire" replace />} />
      <Route path="/login_stagiaire" element={<LoginPage forcedPortal="stagiaire" />} />
      <Route path="/login_admin" element={<LoginPage forcedPortal="admin" />} />
      <Route path="/login_monitor" element={<LoginPage forcedPortal="monitor" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <ShellLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/terrains/new"
          element={
            <ProtectedRoute role="admin">
              <TerrainFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/terrains/:terrainId/edit"
          element={
            <ProtectedRoute role="admin">
              <TerrainFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/terrains"
          element={
            <ProtectedRoute role="admin">
              <TerrainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matches"
          element={
            <ProtectedRoute role="admin">
              <MatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <ProtectedRoute role="admin">
              <ReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations/new"
          element={
            <ProtectedRoute role="admin">
              <ReservationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations/:reservationId/edit"
          element={
            <ProtectedRoute role="admin">
              <ReservationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stagiaires"
          element={
            <ProtectedRoute role="admin">
              <StagiairesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/monitors"
          element={
            <ProtectedRoute role="admin">
              <MonitorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute role="admin">
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stagiaire/home"
          element={
            <ProtectedRoute role="stagiaire">
              <StagiaireReserveTerrainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stagiaire/my-reservations"
          element={
            <ProtectedRoute role="stagiaire">
              <ReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stagiaire/terrains/:terrainId/availability"
          element={
            <ProtectedRoute role="stagiaire">
              <StagiaireAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stagiaire/contact-support"
          element={
            <ProtectedRoute role="stagiaire">
              <StagiaireContactSupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stagiaire/profile"
          element={
            <ProtectedRoute role="stagiaire">
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/stagiaire/reservations" element={<Navigate to="/stagiaire/home" replace />} />
        <Route
          path="/stagiaire/reservations/new"
          element={
            <ProtectedRoute role="stagiaire">
              <ReservationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor/reservations"
          element={
            <ProtectedRoute role="monitor">
              <ReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor/profile"
          element={
            <ProtectedRoute role="monitor">
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
