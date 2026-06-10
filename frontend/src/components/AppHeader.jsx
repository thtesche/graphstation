import React from 'react';
import LanguageSelector from './LanguageSelector';

const AppHeader = ({ 
  title, 
  stats, 
  thumbnailSize, 
  setThumbnailSize, 
  language, 
  changeLanguage, 
  user, 
  handleUserClick, 
  handleLogout,
  t
}) => {
  return (
    <header className="app-header">
      <h1>{title}</h1>
      <div className="header-controls">
        <div
          className="stats-info"
          style={{
            marginRight: "1rem",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
          }}
        >
          Nodes: {stats.nodes} | Links: {stats.links}
        </div>

        <div
          className="size-selector-chips"
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "2px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {["sm", "m", "xl"].map((size) => (
            <button
              key={size}
              onClick={() => setThumbnailSize(size)}
              style={{
                background:
                  thumbnailSize === size
                    ? "var(--accent-color)"
                    : "transparent",
                color:
                  thumbnailSize === size
                    ? "var(--bg-color)"
                    : "var(--text-secondary)",
                border: "none",
                borderRadius: "6px",
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <LanguageSelector
          language={language}
          setLanguage={changeLanguage}
        />

        <div
          className="user-info"
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <span
            onClick={handleUserClick}
            style={{
              cursor:
                import.meta.env.VITE_DEV_MODE === "true"
                  ? "pointer"
                  : "default",
              textDecoration:
                import.meta.env.VITE_DEV_MODE === "true"
                  ? "underline dotted rgba(255, 255, 255, 0.3)"
                  : "none",
            }}
            title={
              import.meta.env.VITE_DEV_MODE === "true"
                ? "Copy dev auth to clipboard"
                : ""
            }
          >
            {user ? (
              <span>{t("hello", user)}</span>
            ) : (
              <span>{t("guest")}</span>
            )}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

