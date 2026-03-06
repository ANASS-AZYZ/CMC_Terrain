import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  items: [],
  loading: false,
}

export const fetchMatches = createAsyncThunk('matches/fetch', async () => {
  const { data } = await api.get('/matches')
  return data
})

export const createMatch = createAsyncThunk('matches/create', async (payload) => {
  const { data } = await api.post('/matches', payload)
  return data
})

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(createMatch.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
  },
})

export default matchesSlice.reducer
