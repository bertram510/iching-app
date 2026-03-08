import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import wilhelmData from '../src/data/iching_wilhelm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very basic mapping for demonstration
const mockTranslations = {
  1: { english: '乾 (Qián)', symbolic: '天', judgment: '元亨利贞', image: '天行健，君子以自强不息。' },
  2: { english: '坤 (Kūn)', symbolic: '地', judgment: '元亨，利牝马之贞', image: '地势坤，君子以厚德载物。' },
  3: { english: '屯 (Zhūn)', symbolic: '水雷', judgment: '元亨利贞，勿用有攸往，利建侯', image: '云雷屯，君子以经纶。' },
  4: { english: '蒙 (Méng)', symbolic: '山水', judgment: '亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。', image: '山下出泉，蒙；君子以果行育德。' },
  40: { english: '解 (Xiè)', symbolic: '雷水', judgment: '利西南，无所往，其来复吉。有攸往，夙吉。', image: '雷雨作，解；君子以赦过宥罪。' },
};

function generateMockData() {
  const translatedData = {};
  
  for (const key in wilhelmData) {
    const original = wilhelmData[key];
    const mock = mockTranslations[original.hex] || {
      english: `卦 ${original.hex} (${original.pinyin})`,
      symbolic: '象征',
      judgment: '(中文) 卦辞占卦结果...',
      image: '(中文) 象辞含义...'
    };
    
    translatedData[key] = {
      ...original,
      english: mock.english,
      wilhelm_above: { ...original.wilhelm_above, symbolic: mock.symbolic },
      wilhelm_below: { ...original.wilhelm_below, symbolic: mock.symbolic },
      wilhelm_judgment: { ...original.wilhelm_judgment, text: mock.judgment },
      wilhelm_image: { ...original.wilhelm_image, text: mock.image },
    };
  }

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'iching_zh.js');
  const fileContent = `export default ${JSON.stringify(translatedData, null, 2)};\n`;
  
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Mock translation complete! Saved to ${outputPath}`);
}

generateMockData();
