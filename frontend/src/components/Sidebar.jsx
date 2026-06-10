import React from "react";

function Sidebar({ viewMode, setViewMode, t }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${viewMode === "group" ? "active" : ""}`}
          onClick={() => setViewMode("group")}
        >
          {t("grouped")}
        </button>
        <button
          className={`nav-item ${viewMode === "filter" ? "active" : ""}`}
          onClick={() => setViewMode("filter")}
        >
          {t("filter")}
        </button>
        <button
          className={`nav-item ${viewMode === "graph" ? "active" : ""}`}
          onClick={() => setViewMode("graph")}
        >
          {t("graph")}
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
