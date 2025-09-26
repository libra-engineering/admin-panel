import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { setServiceUser, clearServiceUser, setServiceLoading, setServiceError } from "../store/slices/serviceAuthSlice";
import { SERVICE_API_URL } from "@/lib/constants";

interface ServiceAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const ServiceAuthContext = createContext<ServiceAuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: async () => {},
  logout: () => {},
  error: null,
});

export const useServiceAuth = () => {
  const context = useContext(ServiceAuthContext);
  if (!context) {
    throw new Error('useServiceAuth error');
  }
  return context;
};

export function ServiceAuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state: any) => state.serviceAuth);

  // Check for existing token on mount
  useEffect(() => {
    const checkExistingToken = () => {
      const token = localStorage.getItem('service_jwt_token');
      if (token) {
        // Verify token validity
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            // Token is valid, set authenticated state
            dispatch(setServiceUser({ token, user: payload }));
          } else {
            // Token expired, remove it
            localStorage.removeItem('service_jwt_token');
            dispatch(setServiceLoading(false));
          }
        } catch (error) {
          // Invalid token, remove it
          localStorage.removeItem('service_jwt_token');
          dispatch(setServiceLoading(false));
        }
      } else {
        // No token found
        dispatch(setServiceLoading(false));
      }
    };

    checkExistingToken();
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    try {
      dispatch(setServiceLoading(true));
      dispatch(setServiceError(null));

      const response = await fetch(`${SERVICE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token in localStorage
      localStorage.setItem('service_jwt_token', token);

      // Decode token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      dispatch(setServiceUser({ token, user: payload }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch(setServiceError(errorMessage));
      throw error;
    } finally {
      dispatch(setServiceLoading(false));
    }
  };

  const logout = () => {
    localStorage.removeItem('service_jwt_token');
    dispatch(clearServiceUser());
  };

  return (
    <ServiceAuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      login,
      logout,
      error,
    }}>
      {children}
    </ServiceAuthContext.Provider>
  );
} 