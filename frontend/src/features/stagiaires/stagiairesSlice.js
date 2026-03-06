import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  items: [],
  loading: false,
}

export const fetchStagiaires = createAsyncThunk('stagiaires/fetch', async () => {
  const { data } = await api.get('/stagiaires')
  return data
})

export const createStagiaire = createAsyncThunk('stagiaires/create', async (payload) => {
  const { data } = await api.post('/stagiaires', payload)
  return data
})

export const updateStagiaire = createAsyncThunk('stagiaires/update', async ({ id, payload }) => {
  const { data } = await api.put(`/stagiaires/${id}`, payload)
  return data
})

export const deleteStagiaire = createAsyncThunk('stagiaires/delete', async (id) => {
  await api.delete(`/stagiaires/${id}`)
  return id
})

const stagiairesSlice = createSlice({
  name: 'stagiaires',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStagiaires.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchStagiaires.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(createStagiaire.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateStagiaire.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id)
        if (idx >= 0) {
          state.items[idx] = action.payload
        }
      })
      .addCase(deleteStagiaire.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
  },
})

export default stagiairesSlice.reducer
