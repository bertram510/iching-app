import React, { createContext, useState, useContext, useEffect } from 'react';

export const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "I Ching Divination",
    appSubtitle: "The Ancient Oracle",
    questionPlaceholder: "What is your question? (Optional)",
    apiKeyPlaceholder: "Gemini API Key (Optional)",
    initiateBtn: "Initiate Divination",
    tossCoinsBtn: "Toss Coins",
    tossCoinsProgress: "Toss Coins ({tossCount}/6)",
    tossingBtn: "Tossing...",
    calculatingBtn: "Calculating...",
    consultAgainBtn: "Consult Again",
    presentHexagram: "Present Hexagram",
    futureHexagram: "Future Hexagram",
    changingLines: "Changing Lines",
    changingLine: "Line",
    judgment: "The Judgment",
    image: "The Image",
    aiInterpretationTitle: "AI Interpretation",
    aiGenerating: "Consulting the Oracle...",
    aiError: "Failed to generate personalized reading. Please check your API key.",
    lineUnchanging: "(Unchanging)",
  },
  zh: {
    appTitle: "易经占卜",
    appSubtitle: "古老的智慧神谕",
    questionPlaceholder: "请输入您的心中所问（选填）",
    apiKeyPlaceholder: "Gemini API 密钥（选填）",
    initiateBtn: "开始起卦",
    tossCoinsBtn: "掷硬币",
    tossCoinsProgress: "掷硬币 ({tossCount}/6)",
    tossingBtn: "正在掷...",
    calculatingBtn: "正在推演...",
    consultAgainBtn: "重新占卜",
    presentHexagram: "本卦",
    futureHexagram: "之卦",
    changingLines: "变爻",
    changingLine: "爻",
    judgment: "卦辞",
    image: "象辞",
    aiInterpretationTitle: "AI 解读",
    aiGenerating: "神谕解读中...",
    aiError: "生成个性化解读失败。请检查您的 API 密钥。",
    lineUnchanging: "(静爻)",
  }
};

export const LanguageProvider = ({ children }) => {
  // Check local storage or default to english
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('iching_locale');
    if (saved && (saved === 'en' || saved === 'zh')) return saved;
    // Auto-detect browser language
    if (navigator.language.startsWith('zh')) return 'zh';
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('iching_locale', language);
    // Update document title and html lang attribute
    document.documentElement.lang = language;
    document.title = translations[language].appTitle + " | " + translations[language].appSubtitle;
  }, [language]);

  const t = (key, params = {}) => {
    let str = translations[language][key] || key;
    // Simple interpolation for params like {tossCount}
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
