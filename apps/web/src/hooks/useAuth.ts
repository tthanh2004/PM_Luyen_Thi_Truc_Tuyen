import { useState } from 'react';

export function useAuth() {
  // Lấy token lần đầu từ localStorage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });

  function saveToken(newToken: string) {
    setToken(newToken);
    localStorage.setItem('accessToken', newToken);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('accessToken');
  }

  return {
    token,
    saveToken,
    logout,
    isLoggedIn: !!token,
  };
}
