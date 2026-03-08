import React from 'react';
import ichingDataEn from '../data/iching_wilhelm.js';
import ichingDataZh from '../data/iching_zh.js';

function Interpretation({ hexagramData, title, language, t, isFuture }) {
  // Our hexagramData has index 0 as bottom. 
  // We need top-to-bottom to match the JSON dataset mapping.
  const topToBottom = [...hexagramData].reverse();
  const binaryString = topToBottom.join('');
  
  const ichingData = language === 'zh' ? ichingDataZh : ichingDataEn;
  
  let match = null;
  for (const key in ichingData) {
    if (!ichingData[key]) continue;
    
    const dbBinary = String(ichingData[key].binary).padStart(6, '0');
    if (dbBinary === binaryString) {
      match = ichingData[key];
      break;
    }
  }

  if (!match) {
    return (
      <div className="interpretation-card">
        <h3>{title}</h3>
        <p>No matching hexagram found for {binaryString}</p>
      </div>
    );
  }

  return (
    <div className="interpretation-card" style={{marginTop: '2rem', padding: '1.5rem', borderTop: '1px solid var(--border-color)'}}>
      <h2 style={{color: 'var(--accent-gold)', marginBottom: '0.5rem'}}>
        {match.hex}. {match.english} {language === 'en' ? `(${match.pinyin})` : ''} {match.hex_font}
      </h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic'}}>
        {language === 'en' 
          ? `${match.wilhelm_above.symbolic} above, ${match.wilhelm_below.symbolic} below`
          : `上${match.wilhelm_above.symbolic}，下${match.wilhelm_below.symbolic}`
        }
      </p>

      <div style={{marginBottom: '2rem'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)'}}>{t('judgment')}</h4>
        <p style={{lineHeight: 1.6, whiteSpace: 'pre-wrap'}}>{match.wilhelm_judgment?.text}</p>
      </div>
      
      <div style={{marginBottom: '2rem'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)'}}>{t('image')}</h4>
        <p style={{lineHeight: 1.6, whiteSpace: 'pre-wrap'}}>{match.wilhelm_image?.text}</p>
      </div>
      
      {/* If this is the present hexagram, show the changing lines if any */}
      {/* For simplicity we'll let App handle which changing lines to show, or just show them here if passed down */}
    </div>
  );
}

export default Interpretation;
