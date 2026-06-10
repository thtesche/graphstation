import { useState } from 'react';
import { setCookie, deleteCookie, getCookie } from '../utils/cookies';

export const useAuth = (apiBase = "/api") => {
  const [authData, setAuthData] = useState({
    sid: getCookie("sid"),
    synotoken: getCookie("synotoken"),
  });
  const [loginForm, setLoginForm] = useState({
    account: "",
    password: "",
    otp: "",
  });
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const response = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: loginForm.account,
          passwd: loginForm.password,
          otp_code: loginForm.otp,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const { sid, synotoken } = result.data;
        setCookie("sid", sid, 14);
        setCookie("synotoken", synotoken, 14);
        setAuthData({ sid, synotoken });
      } else {
        setLoginError(
          `Login fehlgeschlagen: Code ${result.error?.code || "Unbekannt"}`,
        );
      }
    } catch (err) {
      setLoginError(`Netzwerkfehler: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = (onLogoutCallback) => {
    deleteCookie("sid");
    deleteCookie("synotoken");
    setAuthData({ sid: null, synotoken: null });
    if (onLogoutCallback) {
      onLogoutCallback();
    }
  };

  const handleUserClick = () => {
    if (import.meta.env.VITE_DEV_MODE === "true") {
      const sid = getCookie("sid") || "";
      const synotoken = getCookie("synotoken") || "";
      const textToCopy = `sid: ${sid}\nsynotoken: ${synotoken}`;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          console.log("Dev credentials copied to clipboard");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
    }
  };

  return {
    authData,
    setAuthData,
    loginForm,
    setLoginForm,
    loginError,
    setLoginError,
    isLoggingIn,
    user,
    setUser,
    handleLogin,
    handleLogout,
    handleUserClick,
  };
};
