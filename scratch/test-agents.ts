import { runStrategist } from '../agents/strategist/run.js';
import { runNamer } from '../agents/namer/run.js';
import { runAnalyst } from '../agents/analyst/run.js';
import { runCopywriter } from '../agents/copywriter/run.js';
import { runDesigner } from '../agents/designer/run.js';
import { runLegal } from '../agents/legal/run.js';
import { runDeveloper } from '../agents/developer/run.js';
import { runMarketer } from '../agents/marketer/run.js';
import { runGrowth } from '../agents/growth/run.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testLaunchKit() {
  console.log("=========================================");
  console.log("🚀 Starting Studio Launch Kit Generation (9 Agents)");
  console.log("=========================================");

  const idea = "A web platform that uses managed AI agents to coordinate and generate a startup launch kit in parallel (landing page, domain check, legal docs, marketing copies) in under 5 minutes.";
  const vibe = "modern, sleek, professional B2B SaaS";
  const businessType = "B2B SaaS / Generative Productivity Platform";

  console.log(`\n💡 Startup Idea: "${idea}"\n`);

  try {
    // ---- WAVE 1 ----
    console.log("\n🧠 [1/9] Running Strategist Agent (Google Search Grounded)...");
    const strategistOutput = await runStrategist(idea, {
      onChunk: (text) => process.stdout.write(text),
      onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Strategist called: ${call.name} with args:`, call.args),
      onToolResult: (result) => console.log(`✅ [Tool Result] Strategist received:`, JSON.stringify(result).substring(0, 100) + "...")
    });
    console.log("\n📊 [Strategist Result]:", JSON.stringify(strategistOutput, null, 2));

    console.log("\n🪪 [2/9] Running Namer Agent (Domainr API)...");
    const namerOutput = await runNamer({ idea, vibe });
    console.log("📝 [Namer Result]:", JSON.stringify(namerOutput, null, 2));

    const brandName = namerOutput.names[0]?.name || "StudioAI";
    console.log(`\n🏷️  Selected Brand Name: "${brandName}"`);

    console.log("\n📊 [3/9] Running Analyst Agent (Google Search Grounded)...");
    const analystOutput = await runAnalyst(idea, {
      onChunk: (text) => process.stdout.write(text),
      onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Analyst called: ${call.name} with args:`, call.args),
      onToolResult: (result) => console.log(`✅ [Tool Result] Analyst received:`, JSON.stringify(result).substring(0, 100) + "...")
    });
    console.log("\n📈 [Analyst Result]:", JSON.stringify(analystOutput, null, 2));

    // ---- WAVE 2 ----
    console.log("\n✍️ [4/9] Running Copywriter Agent...");
    const copywriterOutput = await runCopywriter({
      brandName,
      positioning: strategistOutput.positioning,
      icp: strategistOutput.icp
    });
    console.log("📝 [Copywriter Result]:", JSON.stringify(copywriterOutput, null, 2));

    console.log("\n🎨 [5/9] Running Designer Agent (Imagen 3 & Stitch)...");
    const designerOutput = await runDesigner(brandName, strategistOutput.positioning, {
      onChunk: (text) => process.stdout.write(text),
      onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Designer called: ${call.name} with args:`, call.args),
      onToolResult: (result) => console.log(`✅ [Tool Result] Designer received:`, JSON.stringify(result).substring(0, 100) + "...")
    });
    console.log("\n🖌️ [Designer Result]:", JSON.stringify(designerOutput, null, 2));

    console.log("\n⚖️ [6/9] Running Legal Agent...");
    const legalOutput = await runLegal({
      brandName,
      businessType
    });
    console.log("📜 [Legal Result]:", JSON.stringify(legalOutput, null, 2));

    // ---- WAVE 3 ----
    console.log("\n💻 [7/9] Running Developer Agent (Vercel Deploy)...");
    const developerOutput = await runDeveloper(designerOutput, copywriterOutput, {
      onChunk: (text) => process.stdout.write(text),
      onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Developer called: ${call.name} with args:`, call.args),
      onToolResult: (result) => console.log(`✅ [Tool Result] Developer received:`, JSON.stringify(result).substring(0, 100) + "...")
    });
    console.log("\n🚀 [Developer Result]:", JSON.stringify(developerOutput, null, 2));

    console.log("\n📣 [8/9] Running Marketer Agent...");
    const marketerOutput = await runMarketer({
      brandName,
      positioning: strategistOutput.positioning,
      copywriterOutput
    });
    console.log("📢 [Marketer Result]:", JSON.stringify(marketerOutput, null, 2));

    console.log("\n🌱 [9/9] Running Growth Agent (Apollo API)...");
    const growthOutput = await runGrowth({
      brandName,
      positioning: strategistOutput.positioning,
      idea,
      callbacks: {
        onChunk: (text) => process.stdout.write(text),
        onToolCall: (call) => console.log(`\n🛠️  [Tool Call] Growth called: ${call.name} with args:`, call.args),
        onToolResult: (result) => console.log(`✅ [Tool Result] Growth received:`, JSON.stringify(result).substring(0, 100) + "...")
      }
    });
    console.log("\n🌿 [Growth Result]:", JSON.stringify(growthOutput, null, 2));

    console.log("\n=========================================");
    console.log("🎉 Studio Launch Kit Generation SUCCESS (All 9 Agents)!");
    console.log("=========================================");

  } catch (err) {
    console.error("\n❌ Execution failed:", err);
  }
}

testLaunchKit();
