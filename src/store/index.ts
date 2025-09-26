import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import serviceAuthReducer from './slices/serviceAuthSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    serviceAuth: serviceAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 