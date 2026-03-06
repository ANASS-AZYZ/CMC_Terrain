import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  items: [],
  loading: false,
}

export const fetchMonitors = createAsyncThunk('monitors/fetch', async () => {
  const { data } = await api.get('/monitors')
  return data
})

export const createMonitor = createAsyncThunk('monitors/create', async (payload) => {
  try {
    const { data } = await api.post('/monitors', payload)
    return data
  } catch (error) {
    const fieldError = error?.response?.data?.errors
    const firstField = fieldError ? Object.keys(fieldError)[0] : null
    const fieldMessage = firstField ? fieldError[firstField]?.[0] : null
    const message = fieldMessage || error?.response?.data?.message || 'Failed to create monitor.'
    throw new Error(message)
  }
})

export const updateMonitor = createAsyncThunk('monitors/update', async ({ id, payload }) => {
  try {
    const { data } = await api.put(`/monitors/${id}`, payload)
    return data
  } catch (error) {
    const fieldError = error?.response?.data?.errors
    const firstField = fieldError ? Object.keys(fieldError)[0] : null
    const fieldMessage = firstField ? fieldError[firstField]?.[0] : null
    const message = fieldMessage || error?.response?.data?.message || 'Failed to update monitor.'
    throw new Error(message)
  }
})

export const deleteMonitor = createAsyncThunk('monitors/delete', async (id) => {
  try {
    await api.delete(`/monitors/${id}`)
    return id
  } catch (error) {
    const message = error?.response?.data?.message || 'Failed to delete monitor.'
    throw new Error(message)
  }
})

const monitorsSlice = createSlice({
  name: 'monitors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonitors.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMonitors.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchMonitors.rejected, (state) => {
        state.loading = false
      })
      .addCase(createMonitor.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateMonitor.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id)
        if (idx >= 0) {
          state.items[idx] = action.payload
        }
      })
      .addCase(deleteMonitor.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
  },
})

export default monitorsSlice.reducer
