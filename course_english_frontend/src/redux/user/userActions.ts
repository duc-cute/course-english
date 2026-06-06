import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRegister } from "../../shared/api/user";

export const registerUser = createAsyncThunk(
  "user/register",
  async (
    values: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiRegister(values);
      return res?.data;
    } catch (error) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || err.message || "Đăng ký thất bại");
    }
  },
);
