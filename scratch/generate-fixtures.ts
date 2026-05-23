import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getMockArtifact } from '../apps/backend/src/mockArtifacts.js';
import { AGENT_IDS, AGENT_REGISTRY, AgentId, Agent } from '../packages/shared/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDEAS = {
  dentist: 'a tool for dentists to manage referrals',
  gamedev: 'AI co-pilot for indie game devs',
  ceramic: 'marketplace for ceramic studio rentals'
};

const FIXTURE_DIR = path.join(__dirname, '../apps/backend/src/fixtures');
if (!fs.existsSync(FIXTURE_DIR)) {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
}

function generateFixture(key: keyof typeof IDEAS, idea: string) {
  const run_id = `fixture-${key}`;
  const agents = {} as Record<AgentId, Agent>;

  for (const id of AGENT_IDS) {
    const meta = AGENT_REGISTRY[id];
    const artifact = getMockArtifact(id, idea);
    
    agents[id] = {
      id,
      name: meta.name,
      emoji: meta.emoji,
      status: 'done',
      startedAt: Date.now() - 30000,
      finishedAt: Date.now(),
      streamedText: JSON.stringify(artifact, null, 2),
      finalArtifact: artifact,
      tools: id === 'strategist' || id === 'analyst' ? ['googleSearch'] : []
    };
  }

  const run = {
    run_id,
    idea,
    startedAt: Date.now() - 35000,
    finishedAt: Date.now(),
    agents
  };

  const filePath = path.join(FIXTURE_DIR, `${key === 'dentist' ? 'dentist-referral' : key === 'gamedev' ? 'indie-gamedev' : 'ceramic-studio'}-run.json`);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf8');
  console.log(`✅ Saved fixture to ${filePath}`);
}

for (const [key, idea] of Object.entries(IDEAS)) {
  generateFixture(key as keyof typeof IDEAS, idea);
}
