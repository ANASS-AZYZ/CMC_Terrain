import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import matchesReducer from '../features/matches/matchesSlice'
import reservationsReducer from '../features/reservations/reservationsSlice'
import stagiairesReducer from '../features/stagiaires/stagiairesSlice'
import terrainsReducer from '../features/terrains/terrainsSlice'
import uiReducer from '../features/ui/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    terrains: terrainsReducer,
    matches: matchesReducer,
    reservations: reservationsReducer,
    stagiaires: stagiairesReducer,
  },
})
