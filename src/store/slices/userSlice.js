import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: 'Guest',
  isAuthenticated: false
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      if (action.payload === null) {
        state.name = null;
      } else if (action.payload === undefined) {
        state.name = undefined;
      } else {
        state.name = action.payload.name;
      }
      state.isAuthenticated = true;
    },
    logout: state => {
      state.name = 'Guest';
      state.isAuthenticated = false;
    }
  }
});

export const { login, logout } = userSlice.actions;

export default userSlice.reducer;
