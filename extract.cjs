const fs = require('fs');
const lines = fs.readFileSync('C:/Users/GBESSI/.gemini/antigravity-ide/brain/e4cb938b-ac44-4215-bf22-5ce4753463eb/.system_generated/logs/transcript_full.jsonl', 'utf-8').split('\n');
for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 695) {
      fs.writeFileSync('step695.txt', data.content);
      console.log('done');
      break;
    }
  } catch (e) {
    // ignore
  }
}
