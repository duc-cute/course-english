import { createSlice } from "@reduxjs/toolkit";
import { registerUser } from "./userActions";

type UserState = {
  currentUser: unknown;
  token: string | null;
  error: string | null;
  loading: boolean;
};

const initialState: UserState = {
  currentUser: null,
  token: null,
  error: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.error = null;
    },
    setLoading: (state, action: { payload: boolean }) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Đăng ký thất bại";
      });
  },
});

export const { logout, setLoading } = userSlice.actions;
export default userSlice.reducer;
