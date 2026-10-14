import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sgologic_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const login = async (email, password) => {
    const userObj = await loginUser(email, password);
    try {
      localStorage.setItem('sgologic_user', JSON.stringify(userObj));
    } catch (e) {}
    setUser(userObj);
    return userObj;
  };

  const register = async (userData) => {
    const userObj = await registerUser(userData);
    try {
      localStorage.setItem('sgologic_user', JSON.stringify(userObj));
    } catch (e) {}
    setUser(userObj);
    return userObj;
  };

  const logout = () => {
    try {
      localStorage.removeItem('sgologic_user');
    } catch (e) {}
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('sgologic_user', JSON.stringify(merged));
      } catch (e) {}
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
