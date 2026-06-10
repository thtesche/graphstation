import React from "react";
import LanguageSelector from "./LanguageSelector";

function LoginForm({
  language,
  changeLanguage,
  loginForm,
  setLoginForm,
  loginError,
  isLoggingIn,
  handleLogin,
  t,
}) {
  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "2rem",
          zIndex: 10,
        }}
      >
        <LanguageSelector language={language} setLanguage={changeLanguage} />
      </div>
      <div
        className="login-card"
        style={{
          background: "#1e293b",
          padding: "2rem",
          borderRadius: "8px",
          width: "300px",
          border: "1px solid #334155",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          {t("nasLogin")}
        </h2>
        {loginError && (
          <div
            style={{
              color: "#ef4444",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {loginError}
          </div>
        )}
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            type="text"
            placeholder={t("account")}
            value={loginForm.account}
            onChange={(e) =>
              setLoginForm({ ...loginForm, account: e.target.value })
            }
            required
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "white",
            }}
          />
          <input
            type="password"
            placeholder={t("password")}
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            required
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "white",
            }}
          />
          <input
            type="text"
            placeholder={t("otp")}
            value={loginForm.otp}
            onChange={(e) =>
              setLoginForm({ ...loginForm, otp: e.target.value })
            }
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "white",
            }}
          />
          <button
            type="submit"
            disabled={isLoggingIn}
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: "bold",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
            }}
          >
            {isLoggingIn ? t("loggingIn") : t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
