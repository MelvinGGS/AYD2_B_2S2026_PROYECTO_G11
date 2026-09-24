import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sgologic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const userObj = await loginUser(email, password);
    setUser(userObj);
    localStorage.setItem('sgologic_user', JSON.stringify(userObj));
    return userObj;
  };

  const register = async (userData) => {
    const userObj = await registerUser(userData);
    setUser(userObj);
    localStorage.setItem('sgologic_user', JSON.stringify(userObj));
    return userObj;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sgologic_user');
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('sgologic_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
