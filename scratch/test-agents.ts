import { runStrategist } from '../agents/strategist/run.js';
import { runCopywriter } from '../agents/copywriter/run.js';
import { runMarketer } from '../agents/marketer/run.js';
import { runLegal } from '../agents/legal/run.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testLaunchKit() {
  console.log("=========================================");
  console.log("🚀 Starting Studio Launch Kit Generation");
  console.log("=========================================");

  const idea = "A web platform that uses managed AI agents to coordinate and generate a startup launch kit in parallel (landing page, domain check, legal docs, marketing copies) in under 5 minutes.";
  const brandName = "StudioAI";
  const businessType = "B2B SaaS / Generative Productivity Platform";

  console.log(`\n💡 Startup Idea: "${idea}"\n`);

  try {
    // 1. Run Strategist
    console.log("🧠 [1/4] Running Strategist Agent (Google Search Grounded)...");
    const strategistOutput = await runStrategist(idea, {
      onChunk: (text) => process.stdout.write(text),
      onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Model called: ${call.name} with args:`, call.args),
      onToolResult: (result) => console.log(`✅ [Tool Result] received:`, JSON.stringify(result).substring(0, 100) + "...")
    });

    console.log("\n\n📊 [Strategist Result]:");
    console.log(JSON.stringify(strategistOutput, null, 2));

    // 2. Run Copywriter
    console.log("\n✍️ [2/4] Running Copywriter Agent (Plain API)...");
    const copywriterOutput = await runCopywriter({
      brandName,
      positioning: strategistOutput.positioning,
      icp: strategistOutput.icp
    });

    console.log("\n📝 [Copywriter Result]:");
    console.log(JSON.stringify(copywriterOutput, null, 2));

    // 3. Run Marketer
    console.log("\n📈 [3/4] Running Marketer Agent (Plain API)...");
    const marketerOutput = await runMarketer({
      brandName,
      positioning: strategistOutput.positioning,
      copywriterOutput
    });

    console.log("\n📣 [Marketer Result]:");
    console.log(JSON.stringify(marketerOutput, null, 2));

    // 4. Run Legal
    console.log("\n⚖️ [4/4] Running Legal Agent (Plain API)...");
    const legalOutput = await runLegal({
      brandName,
      businessType
    });

    console.log("\n📜 [Legal Result]:");
    console.log(JSON.stringify(legalOutput, null, 2));

    console.log("\n=========================================");
    console.log("🎉 Studio Launch Kit Generation SUCCESS!");
    console.log("=========================================");

  } catch (err) {
    console.error("\n❌ Execution failed:", err);
  }
}

testLaunchKit();
