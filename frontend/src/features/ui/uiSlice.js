import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: localStorage.getItem('sb_theme') ?? 'light',
  language: localStorage.getItem('sb_lang') ?? 'fr',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload
      localStorage.setItem('sb_theme', action.payload)
    },
    setLanguage(state, action) {
      state.language = action.payload
      localStorage.setItem('sb_lang', action.payload)
    },
  },
})

export const { setTheme, setLanguage } = uiSlice.actions
export default uiSlice.reducer
