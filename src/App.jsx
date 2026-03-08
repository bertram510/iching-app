import React, { useState, useEffect } from 'react';
import { getHexagramData } from './utils/divination';
import { generatePersonalizedReading } from './utils/ai';
import ichingData from './data/iching_wilhelm.js';
import { useLanguage } from './contexts/LanguageContext';

import Interpretation from './components/Interpretation';

function HexagramDisplay({ lines, isChanging, title }) {
  if (!lines || lines.length === 0) return null;
  return (
    <div className="hexagram-display">
      <h3 style={{color: 'var(--accent-gold)', marginBottom: '1rem', textAlign: 'center'}}>{title}</h3>
      <div className="hexagram-container">
        {lines.map((lineVal, idx) => {
          // Present hexagram uses 1 for Yang, 0 for Yin
          // Future hexagram uses 1 for Yang, 0 for Yin
          const isYang = lineVal === 1;
          const animationDelay = `${(lines.length - idx) * 0.15}s`;
          return (
            <div key={idx} className="hexagram-line" style={{animation: `fadeIn 0.5s ease-out ${animationDelay} both`}}>
              {isYang ? (
                <div className="line-solid" />
              ) : (
                <div className="line-broken">
                  <div className="line-broken-part" />
                  <div className="line-broken-part" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const { language, toggleLanguage, t } = useLanguage();

  const [tosses, setTosses] = useState([]);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aiReading, setAiReading] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const [quickMode, setQuickMode] = useState(false);
  const [tossState, setTossState] = useState(0); // 0: resting, 1: flipping, 2: landed
  const [currentCoins, setCurrentCoins] = useState([3, 3, 3]);

  // Handle API key changes
  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('geminiApiKey', val);
  };

  const handleTossStart = async () => {
    if (tosses.length >= 6 || tossState !== 0) return;
    
    // Generate 3 random coins (2 = Yin, 3 = Yang)
    const c1 = Math.random() < 0.5 ? 2 : 3;
    const c2 = Math.random() < 0.5 ? 2 : 3;
    const c3 = Math.random() < 0.5 ? 2 : 3;
    const sum = c1 + c2 + c3;
    
    if (quickMode) {
      processToss(sum);
    } else {
      setCurrentCoins([c1, c2, c3]);
      setTossState(1); // flipping
      setTimeout(() => {
        setTossState(2); // landed
        setTimeout(() => {
          setTossState(0); // back to rest
          processToss(sum);
        }, 800);
      }, 1200); // Wait for the longest flip animation to end
    }
  };

  const processToss = async (newLine) => {
    const newTosses = [...tosses, newLine];
    setTosses(newTosses);
    
    if (newTosses.length === 6) {
        // Calculate result
        const data = getHexagramData(newTosses);
        setResult(data);

        // Try generating AI reading automatically ONLY if they provided their own API key.
        // If they did not provide a key, they will click the manual button in the UI to use the proxy in order to control costs.
        if (apiKey && question) {
          setIsGenerating(true);
          try {
            // Reconstruct the binary string to find the hexagram text.
            // Our lines index 0 is bottom. The i-ching library `binary` property represents the lines from bottom to top, 
            // but the JSON dataset `binary` field is strictly Top-to-Bottom. Therefore we must reverse our array before matching.
            const topToBottom = [...data.presentBinary].reverse();
            const binaryString = topToBottom.join('');
            let match = null;
            for (const key in ichingData) {
              const dbBinary = String(ichingData[key].binary).padStart(6, '0');
              if (dbBinary === binaryString) {
                match = ichingData[key];
                break;
              }
            }

            if (match) {
              const reading = await generatePersonalizedReading(apiKey, question, match, language);
              setAiReading(reading);
            }
          } catch (err) {
            console.error(err);
            setAiReading("Failed to generate personalized reading. Please check your API key.");
          } finally {
            setIsGenerating(false);
          }
        }
      }
  };

  const handleReset = () => {
    setTosses([]);
    setResult(null);
    setQuestion('');
    setAiReading(null);
  };

  return (
    <div className="app-container">
      <header>
        <h1>{t('appTitle')}</h1>
        <p className="subtitle">{t('appSubtitle')}</p>
        <button 
          onClick={toggleLanguage}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--accent-gold)',
            color: 'var(--accent-gold)', padding: '0.4rem 0.8rem', borderRadius: '4px',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.3s'
          }}
        >
          {language === 'en' ? '中文' : 'ENG'}
        </button>
      </header>

      <main className="glass-panel">
        {!result ? (
          <div className="landing-view">
            <p className="landing-text">
              {language === 'en' ? 'Focus your mind on a single question or situation. When you are ready, toss the coins six times to generate your hexagram.' : '将心沉静，专注于您想要占问的事情。准备好后，连续抛掷六次硬币以生成卦象。'}
            </p>

            <div style={{width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
              <input 
                type="text" 
                placeholder={t('questionPlaceholder')}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                style={{
                  padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', 
                  background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.1rem',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <input 
                type="password" 
                placeholder={t('apiKeyPlaceholder')}
                value={apiKey}
                onChange={handleApiKeyChange}
                style={{
                  padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', 
                  background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                {language === 'en' ? 'Provide a free Gemini API key to receive a personalized AI interpretation tailored to your question. Keys are stored safely in your browser.' : '提供免费的 Gemini API 密钥，获取针对您问题的个性化 AI 解读。密钥安全地存储在您的浏览器中。'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                id="quickMode" 
                checked={quickMode} 
                onChange={(e) => setQuickMode(e.target.checked)} 
                style={{ cursor: 'pointer', accentColor: 'var(--accent-gold)' }}
              />
              <label htmlFor="quickMode" style={{ cursor: 'pointer' }}>
                {language === 'en' ? 'Quick Divination (Skip Animations)' : '快速占卜（跳过动画）'}
              </label>
            </div>

            <button className="btn-primary" onClick={handleTossStart} disabled={tossState !== 0} style={{marginTop: '1rem', opacity: tossState !== 0 ? 0.5 : 1}}>
              {tosses.length === 0 ? t('initiateBtn') : t('tossCoinsProgress', { tossCount: tosses.length + 1 })}
            </button>
            
            {tossState !== 0 && (
              <div className="coin-container">
                {currentCoins.map((val, idx) => (
                  <div key={idx} className="coin-wrapper">
                    <div className={`coin ${tossState === 1 ? `coin-flip-${idx + 1}` : ''}`}>
                      <div className="coin-hole"></div>
                      <div className={`coin-inner ${tossState === 1 ? 'coin-face-hidden' : 'coin-face-reveal'}`}>
                        {val === 3 ? (
                          <>
                            <span className="coin-char char-top">乾</span>
                            <span className="coin-char char-bottom">隆</span>
                            <span className="coin-char char-right">通</span>
                            <span className="coin-char char-left">宝</span>
                          </>
                        ) : (
                          <>
                            <span className="coin-char char-manchu-left">ᠪᠣᠣ</span>
                            <span className="coin-char char-manchu-right">ᠴᡳᡠᠸᠠᠨ</span>
                          </>
                        )}
                      </div>
                    </div>
                    {tossState === 2 && (
                      <div className="coin-label">
                        {language === 'en' ? (val === 3 ? 'YANG (3)' : 'YIN (2)') : (val === 3 ? '阳 (3)' : '阴 (2)')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tosses.length > 0 && (
              <div className="hexagram-container" style={{ marginTop: '2rem' }}>
                {tosses.map((val, idx) => (
                  <div key={idx} className="hexagram-line">
                    {(val === 7 || val === 9) ? <div className="line-solid" /> : <div className="line-broken"><div className="line-broken-part" /><div className="line-broken-part" /></div>}
                  </div>
                ))}
                {/* Empty placeholders for remaining lines */}
                {Array.from({length: 6 - tosses.length}).map((_, idx) => (
                  <div key={`empty-${idx}`} className="hexagram-line" style={{opacity: 0.1}}>
                    <div className="line-solid" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="result-view">
            <div style={{display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: '2rem'}}>
               <div style={{flex: 1, minWidth: '300px', margin: '0 1rem'}}>
                   <HexagramDisplay lines={result.presentBinary} title={t('presentHexagram')} />
                   <Interpretation hexagramData={result.presentBinary} title={t('presentHexagram')} language={language} t={t} isFuture={false} />
               </div>
               
               {result.isChanging && (
                 <div style={{flex: 1, minWidth: '300px', margin: '0 1rem'}}>
                     <HexagramDisplay lines={result.futureBinary} title={t('futureHexagram')} />
                     <Interpretation hexagramData={result.futureBinary} title={t('futureHexagram')} language={language} t={t} isFuture={true} />
                 </div>
               )}
            </div>

            {question && (
              <div style={{marginTop: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                <h3 style={{color: 'var(--accent-gold)', marginBottom: '1rem', fontFamily: 'var(--font-serif)', fontSize: '1.5rem'}}>
                  {language === 'en' ? `Your Question: "${question}"` : `您的问题："${question}"`}
                </h3>
                
                {isGenerating ? (
                  <div style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div className="spinner" style={{width: '20px', height: '20px', border: '2px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                    {t('aiGenerating')}
                  </div>
                ) : aiReading ? (
                  <div style={{lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap'}}>
                    {aiReading}
                  </div>
                ) : (
                  <div>
                    <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                      {language === 'en' 
                        ? 'Would you like a personalized AI interpretation of this hexagram for your question?' 
                        : '您希望获得针对此问题的个性化 AI 卦象解读吗？'}
                    </p>
                    <button 
                      className="btn-primary" 
                      onClick={async () => {
                        setIsGenerating(true);
                        try {
                           const topToBottom = [...result.presentBinary].reverse();
                           const binaryString = topToBottom.join('');
                           let match = null;
                           for (const key in ichingData) {
                             const dbBinary = String(ichingData[key].binary).padStart(6, '0');
                             if (dbBinary === binaryString) {
                               match = ichingData[key];
                               break;
                             }
                           }
                           if (match) {
                             // Pass the existing apiKey (which is empty string) to trigger the proxy
                             const reading = await generatePersonalizedReading(apiKey, question, match, language);
                             setAiReading(reading);
                           }
                        } catch (err) {
                           console.error(err);
                           setAiReading(language === 'en' 
                             ? "Failed to generate free reading. The server may be experiencing high load." 
                             : "生成免费解卦失败。服务器可能负载过高。");
                        } finally {
                           setIsGenerating(false);
                        }
                      }}
                      style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
                    >
                      {language === 'en' ? 'Get AI Reading' : '获取 AI 解卦'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div style={{textAlign: 'center', marginTop: '3rem'}}>
              <button className="btn-secondary" onClick={handleReset}>{t('consultAgainBtn')}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
