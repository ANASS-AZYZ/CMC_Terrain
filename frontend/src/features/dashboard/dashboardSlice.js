import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  data: null,
  loading: false,
}

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  const { data } = await api.get('/dashboard')
  return data
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
  },
})

export default dashboardSlice.reducer
