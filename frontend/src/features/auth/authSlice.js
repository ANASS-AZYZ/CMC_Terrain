import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/client'

const initialState = {
  token: localStorage.getItem('sb_token'),
  user: JSON.parse(localStorage.getItem('sb_user') || 'null'),
  loading: false,
  error: null,
}

export const loginThunk = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/login', payload)
    return data
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Login failed. Check credentials and portal.')
  }
})

export const meThunk = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/me')
    return data.user
  } catch {
    return rejectWithValue('Session expired')
  }
})

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await api.post('/logout')
})

export const updatePasswordThunk = createAsyncThunk('auth/updatePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/me/password', payload)
    return data.message
  } catch {
    return rejectWithValue('Current password is incorrect or new password is invalid.')
  }
})

export const updateProfileThunk = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/me', payload)
    return data
  } catch {
    return rejectWithValue('Impossible de modifier les informations du profil.')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('sb_token', action.payload.token)
        localStorage.setItem('sb_user', JSON.stringify(action.payload.user))
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Login failed'
      })
      .addCase(meThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(meThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        localStorage.setItem('sb_user', JSON.stringify(action.payload))
      })
      .addCase(meThunk.rejected, (state) => {
        state.loading = false
        state.token = null
        state.user = null
        localStorage.removeItem('sb_token')
        localStorage.removeItem('sb_user')
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null
        state.user = null
        localStorage.removeItem('sb_token')
        localStorage.removeItem('sb_user')
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        localStorage.setItem('sb_user', JSON.stringify(action.payload.user))
      })
  },
})

export default authSlice.reducer
