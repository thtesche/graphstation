import React from "react";

const LanguageSelector = ({ language, setLanguage }) => {
  return (
    <div
      className="language-selector"
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        padding: "2px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: "transparent",
          color: "var(--text-primary)",
          border: "none",
          padding: "0.35rem 0.75rem",
          fontSize: "0.8rem",
          fontWeight: "600",
          cursor: "pointer",
          outline: "none",
          fontFamily: "inherit",
        }}
      >
        <option value="de" style={{ background: "#1e293b", color: "white" }}>
          DE
        </option>
        <option value="en" style={{ background: "#1e293b", color: "white" }}>
          EN
        </option>
      </select>
    </div>
  );
};

export default LanguageSelector;
