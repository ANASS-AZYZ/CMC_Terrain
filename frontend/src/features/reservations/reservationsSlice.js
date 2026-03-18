import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  items: [],
  loading: false,
}

export const fetchReservations = createAsyncThunk('reservations/fetch', async () => {
  const { data } = await api.get('/reservations')
  return data
})

export const createReservation = createAsyncThunk('reservations/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/reservations', payload)
    return data
  } catch (error) {
    const apiError = error?.response?.data
    const firstFieldErrors = apiError?.errors ? Object.values(apiError.errors)[0] : null
    const firstMessage = Array.isArray(firstFieldErrors) ? firstFieldErrors[0] : null

    return rejectWithValue(firstMessage || apiError?.message || 'Reservation failed')
  }
})

export const updateReservation = createAsyncThunk('reservations/update', async ({ id, payload }) => {
  const { data } = await api.put(`/reservations/${id}`, payload)
  return data
})

export const deleteReservation = createAsyncThunk('reservations/delete', async (id) => {
  await api.delete(`/reservations/${id}`)
  return id
})

export const updateReservationStatus = createAsyncThunk('reservations/updateStatus', async ({ id, status }) => {
  const { data } = await api.patch(`/reservations/${id}/status`, { status })
  return data
})

export const cancelOwnReservation = createAsyncThunk('reservations/cancelOwn', async (id) => {
  const { data } = await api.patch(`/reservations/${id}/cancel-self`)
  return data
})

export const addReservationPlayer = createAsyncThunk('reservations/addPlayer', async ({ reservationId, studentId }) => {
  try {
    const { data } = await api.post(`/reservations/${reservationId}/players`, {
      student_id: studentId,
    })
    return data
  } catch (error) {
    const fieldError = error?.response?.data?.errors?.student_id?.[0]
    const message = error?.response?.data?.message
    throw new Error(fieldError || message || 'Impossible d\'ajouter ce stagiaire.')
  }
})

export const removeReservationPlayer = createAsyncThunk('reservations/removePlayer', async ({ reservationId, playerId }) => {
  await api.delete(`/reservations/${reservationId}/players/${playerId}`)
  return { reservationId, playerId }
})

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.items = state.items.map((reservation) => (reservation.id === action.payload.id ? action.payload : reservation))
      })
      .addCase(updateReservationStatus.fulfilled, (state, action) => {
        state.items = state.items.map((reservation) => (reservation.id === action.payload.id ? action.payload : reservation))
      })
      .addCase(cancelOwnReservation.fulfilled, (state, action) => {
        state.items = state.items.map((reservation) => (reservation.id === action.payload.id ? action.payload : reservation))
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.items = state.items.filter((reservation) => reservation.id !== action.payload)
      })
      .addCase(addReservationPlayer.fulfilled, (state) => {
        state.loading = false
      })
  },
})

export default reservationsSlice.reducer
