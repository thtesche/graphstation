import { useState } from "react";
import { translations } from "../i18n";

const getInitialLanguage = () => {
  const stored = localStorage.getItem("language");
  if (stored === "de" || stored === "en") return stored;

  const browserLang = navigator.language || navigator.userLanguage || "";
  if (browserLang.toLowerCase().startsWith("de")) {
    return "de";
  }
  return "en";
};

export const useLanguage = () => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key, ...args) => {
    const entry = translations[language]?.[key] || translations["en"]?.[key];
    if (typeof entry === "function") return entry(...args);
    return entry || key;
  };

  return { language, changeLanguage, t };
};
