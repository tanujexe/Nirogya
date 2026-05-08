import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    // Only redirect if we are not already on login/register to avoid loops
    if (!['/login', '/register', '/'].includes(window.location.pathname)) {
      window.location.href = "/login";
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data.data;
      
      // Merge token from localStorage if it's not returned by getMe
      const storedData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...userData, token: storedData.token };
      
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error("Session validation failed:", error);
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        // We have a token in local storage, verify it with the server
        await refreshUser();
      }
      setLoading(false);
    };

    initializeAuth();
  }, [refreshUser]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const userData = response.data.data;
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error.response?.data?.message || error.message || "Login failed";
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const response = await authAPI.register(payload);
      const userData = response.data.data;
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        refreshUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};