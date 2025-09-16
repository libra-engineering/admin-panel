import { useAppDispatch } from "@/hooks/useAppDispatch"
import { BACKEND_API_URL } from "@/lib/constants"
import { clearUser, setUser } from "@/store/slices/authSlice"
import axios from "axios"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { Navigate } from "react-router-dom"


// Create authentication context
const AuthContext = createContext<{
    isAuthenticated: boolean
    isLoading: boolean
    checkAuth: () => Promise<void>
    logout: () => Promise<void>
}>({
    isAuthenticated: false,
    isLoading: true,
    checkAuth: async () => {},
    logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const dispatch = useAppDispatch()

    const checkAuth = async () => {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/auth/user`, {
                withCredentials: true,
            })

            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user))
                dispatch(setUser(response.data.user))
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
        } catch (error) {
            console.error('Failed to fetch user', error)
            setIsAuthenticated(false)
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await axios.get(`${BACKEND_API_URL}/auth/logout`, {
                withCredentials: true,
            })
            localStorage.removeItem('user')
            dispatch(clearUser())
            setIsAuthenticated(false)
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Protected Route component
export function ProtectedRoute({ children, requiredRoles }: { children: ReactNode, requiredRoles?: Array<'user' | 'admin' | 'superadmin'> }) {
    const { isAuthenticated, isLoading } = useAuth()
    const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) as { role?: 'user' | 'admin' | 'superadmin' } : null

    if (isLoading) {
        // Return a loading state or null to prevent flash
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }

    if (requiredRoles && requiredRoles.length > 0) {
        const role = storedUser?.role
        if (!role || !requiredRoles.includes(role)) {
            return <Navigate to="/login" />
        }
    }

    return <>{children}</>
}
