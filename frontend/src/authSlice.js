import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { currentUser: null },
  reducers: {
    login(state, action) { state.currentUser = action.payload; },
    logout(state) { state.currentUser = null; },
    updateUser(state, action) {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
