import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  items: [],
  loading: false,
}

export const fetchTerrains = createAsyncThunk('terrains/fetch', async () => {
  const { data } = await api.get('/terrains')
  return data
})

export const createTerrain = createAsyncThunk('terrains/create', async (payload) => {
  const { data } = await api.post('/terrains', payload)
  return data
})

export const updateTerrain = createAsyncThunk('terrains/update', async ({ id, payload }) => {
  if (payload instanceof FormData) {
    payload.append('_method', 'PUT')
    const { data } = await api.post(`/terrains/${id}`, payload)
    return data
  }

  const { data } = await api.put(`/terrains/${id}`, payload)
  return data
})

export const deleteTerrain = createAsyncThunk('terrains/delete', async (id) => {
  await api.delete(`/terrains/${id}`)
  return id
})

const terrainsSlice = createSlice({
  name: 'terrains',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerrains.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTerrains.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(createTerrain.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateTerrain.fulfilled, (state, action) => {
        state.items = state.items.map((terrain) => (terrain.id === action.payload.id ? action.payload : terrain))
      })
      .addCase(deleteTerrain.fulfilled, (state, action) => {
        state.items = state.items.filter((terrain) => terrain.id !== action.payload)
      })
  },
})

export default terrainsSlice.reducer
