import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    users: [
      { name: "Test User", email: "test@meetly.com", password: "12345678" },
    ],
    currentUser: null,
  },
  reducers: {
    addUser(state, action) {
      state.users.push(action.payload);
    },
    login(state, action) {
      state.currentUser = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
  },
});

export const { addUser, login, logout } = authSlice.actions;
export default authSlice.reducer;
