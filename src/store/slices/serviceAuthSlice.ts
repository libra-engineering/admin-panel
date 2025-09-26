import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ServiceUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

interface ServiceAuthState {
  user: ServiceUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ServiceAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing token
  error: null,
};

const serviceAuthSlice = createSlice({
  name: 'serviceAuth',
  initialState,
  reducers: {
    setServiceLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setServiceUser: (state, action: PayloadAction<{ token: string; user: ServiceUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    clearServiceUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setServiceError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { 
  setServiceLoading, 
  setServiceUser, 
  clearServiceUser, 
  setServiceError 
} = serviceAuthSlice.actions;

export default serviceAuthSlice.reducer; 