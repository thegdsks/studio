import { runDirector } from '../apps/backend/src/agents/director/run.js';
import type { Run } from '@studio/shared';
import * as dotenv from 'dotenv';
dotenv.config();

async function testDirector() {
  console.log("=========================================");
  console.log("🎬 Starting Director Agent Synthesis Test");
  console.log("=========================================");

  const idea = "a tool for dentists to manage referrals";

  // Build a realistic Run snapshot with the 9 worker agent outputs
  const mockRunSnapshot: Run = {
    run_id: "test-run-12345",
    idea: idea,
    startedAt: Date.now() - 60000,
    agents: {
      strategist: {
        id: 'strategist',
        name: 'Strategist',
        emoji: '🎯',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          positioning: "A referral management network for dentist practices that automates and tracks specialists patient transfers.",
          icp: "General dentists, oral surgeons, orthodontists, and dental office managers.",
          jtbd: "Safely and quickly send and track patient referrals and dental records without faxing or manual phone tags.",
          three_risks: [
            "Clinic staff onboarding inertia",
            "HIPAA patient privacy compliance",
            "Referral network liquidity"
          ]
        },
        tools: []
      },
      namer: {
        id: 'namer',
        name: 'Namer',
        emoji: '🪪',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          names: [
            { name: "ReferralDentist", domain: "referraldentist.com", available: true },
            { name: "DentiRefer", domain: "dentirefer.com", available: true },
            { name: "ToothRoute", domain: "toothroute.io", available: true }
          ]
        },
        tools: []
      },
      designer: {
        id: 'designer',
        name: 'Designer',
        emoji: '🎨',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
          exportedCode: "<div>ReferralDentist Landing Page</div>",
          logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
          palette: {
            primary: "#0f172a",
            secondary: "#6366f1",
            accent: "#38bdf8"
          }
        },
        tools: []
      },
      copywriter: {
        id: 'copywriter',
        name: 'Copywriter',
        emoji: '✍️',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          hero: {
            headline: "Dental referrals, simplified and secure.",
            sub: "Send patient files, track transfer status, and close the loop with dental specialists in one HIPAA-compliant portal."
          },
          features: [
            { title: "One-Click Referrals", body: "Send X-rays and files directly from your patient database." },
            { title: "Real-time Tracking", body: "Never guess if your patient booked their appointment with the specialist." }
          ],
          faq: [
            { q: "Is it HIPAA compliant?", a: "Yes, fully encrypted and HIPAA compliant." }
          ],
          cta: "Join the Referral Network"
        },
        tools: []
      },
      developer: {
        id: 'developer',
        name: 'Developer',
        emoji: '💻',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          liveUrl: "https://referraldentist-demo.vercel.app",
          deployedAt: "2026-05-23T12:55:00.000Z"
        },
        tools: []
      },
      marketer: {
        id: 'marketer',
        name: 'Marketer',
        emoji: '📣',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          tweet_thread: [
            "1/ Dentist referrals are stuck in the 1990s. Faxing patient records is slow and insecure. We built ReferralDentist to fix it.",
            "2/ Our platform makes it dead-simple to securely transfer files and track scheduling progress. Try it today!"
          ],
          producthunt: {
            tagline: "Secure referral network for dental practices",
            description: "Say goodbye to faxing. Securely coordinate oral health care transfers."
          },
          hn_show: "Show HN: ReferralDentist – HIPAA-compliant Dentist Referral Network",
          linkedin_post: "Happy to announce ReferralDentist. Seamlessly bridge dental specialists and general practitioners."
        },
        tools: []
      },
      growth: {
        id: 'growth',
        name: 'Growth',
        emoji: '🌱',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          prospects: [
            { name: "Dr. Robert Smith", role: "Orthodontist", company: "Smith Ortho", linkedin: "linkedin.com/robertsmith", why_fit: "High referral volume specialization", email_draft: "Hi Dr. Smith, wanted to introduce ReferralDentist..." }
          ]
        },
        tools: []
      },
      legal: {
        id: 'legal',
        name: 'Legal',
        emoji: '⚖️',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          terms_of_service: "# Terms of Service\n\nWelcome to ReferralDentist...",
          privacy_policy: "# Privacy Policy\n\nWe value your privacy...",
          liability_summary: "AI-generated documents. Review with legal counsel mandatory."
        },
        tools: []
      },
      analyst: {
        id: 'analyst',
        name: 'Analyst',
        emoji: '📊',
        status: 'done',
        streamedText: '',
        finalArtifact: {
          competitors: [
            { name: "DentistLink", url: "dentistlink.com", positioning: "Referrals tool", pricing: "Custom", strength: "Large existing network", weakness: "Complex enterprise UI" }
          ],
          market_gap: "No lightweight B2B referral portal designed specifically for private local practices.",
          recommendation: "Focus on GPs ease of use to drive bottom-up specialist adoption."
        },
        tools: []
      },
      director: {
        id: 'director',
        name: 'Director',
        emoji: '🎬',
        status: 'queued',
        streamedText: '',
        tools: []
      }
    }
  };

  try {
    console.log("🎬 Running Director Agent...");
    const directorOutput = await runDirector(mockRunSnapshot, {
      onChunk: (text) => process.stdout.write(text),
    });

    console.log("\n\n🏆 [Director Output Result]:");
    console.log(JSON.stringify(directorOutput, null, 2));

    console.log("=========================================");
    console.log("🎉 Director Agent Test Completed Successfully!");
    console.log("=========================================");
  } catch (err) {
    console.error("❌ Director execution failed:", err);
    process.exit(1);
  }
}

testDirector();
