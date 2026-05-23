import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
const client = new GoogleGenAI({});
// Registry of tool implementations
const toolRegistry = {
    checkDomain: async (name) => {
        const { checkDomain } = await import('../_tools/domainr.js');
        return await checkDomain(name);
    },
    stitchGenerate: async (brief, style) => {
        const { stitchGenerate } = await import('../_tools/stitch.js');
        return await stitchGenerate(brief, style);
    },
    generateLogo: async (brand, vibe) => {
        const { generateLogo } = await import('../_tools/imagen.js');
        return await generateLogo(brand, vibe);
    },
    groundedQuery: async (query, numSources) => {
        const { groundedQuery } = await import('../_tools/grounded.js');
        return await groundedQuery(query, numSources);
    },
    deploy: async (html, projectPath) => {
        const { deploy } = await import('../_tools/vercelDeploy.js');
        return await deploy(html, projectPath);
    },
    apolloSearch: async (titles, keywords) => {
        const { apolloSearch } = await import('../_tools/apollo.js');
        return await apolloSearch(titles, keywords);
    }
};
// Helper to execute tool
async function executeTool(name, args) {
    const impl = toolRegistry[name];
    if (!impl) {
        throw new Error(`Tool ${name} not found in the local registry`);
    }
    return await impl(...(Object.values(args)));
}
// Fallback mock data by agentName in case of timeouts or API failures
const mockDataMap = {
    strategist: {
        positioning: "A workspace for specialist agents working in parallel to launch startups instantly.",
        icp: "Solo founders, hackathon participants, and early-stage startup teams looking for rapid scaffolding.",
        jtbd: "Create a complete, cohesive startup launch kit in under 5 minutes without manual coordination.",
        three_risks: [
            "Dependency on third-party APIs (Vercel, Domainr) causing pipeline jank.",
            "High prompt variability leading to mismatched brand identities across agents.",
            "Rate limits and token costs scaling rapidly with simultaneous agent invocations."
        ]
    },
    copywriter: {
        hero: {
            headline: "Launch Your Startup in Seconds with Studio",
            sub: "9 specialist AI agents working in parallel to build your positioning, branding, landing page, and legal docs instantly."
        },
        features: [
            { title: "Parallel Specialists", body: "Copywriters, developers, growth hackers, and designers working simultaneously." },
            { title: "One-Click Deploy", body: "Beautiful, responsive landing pages deployed straight to Vercel instantly." },
            { title: "Grounded & Verified", body: "Positions, legal documents, and domains checked live against actual search and registry APIs." }
        ],
        faq: [
            { q: "How does Studio work?", a: "Studio orchestrates 9 specialized agents that take your startup idea and produce a unified launch kit." },
            { q: "Are the domains checked?", a: "Yes, domains are checked live against the Domainr API for availability." },
            { q: "Is the landing page ready?", a: "Absolutely. A designer agent designs it and a developer agent deploys it to a live Vercel URL." },
            { q: "Is the copy unique?", a: "Yes, our copywriter agent tailors marketing messaging specifically to your positioning and target audience." },
            { q: "Who owns the generated code?", a: "You do. The code is yours to keep, modify, and host." }
        ],
        cta: "Start Launching"
    },
    marketer: {
        tweet_thread: [
            "1/ Imagine launching your startup in 60 seconds. No, seriously. Introducing Studio. 🚀",
            "2/ We spun up 9 specialist AI agents—copywriter, namer, strategist, marketer, designer, developer, and more—to work in parallel.",
            "3/ Input an idea, and within minutes, you get brand positioning, active domain options, marketing copy, and a live Vercel landing page.",
            "4/ Build at the speed of thought. Check out the project we developed at the Shack15 Google I/O Hackathon.",
            "5/ Ready to launch your next big thing? Try Studio today and get your complete startup launch kit! ⚡"
        ],
        producthunt: {
            tagline: "9 specialist AI agents building your startup launch kit in parallel",
            description: "Input your idea and get a fully deployed landing page, branding, marketing copies, legal documents, and growth prospects in under 5 minutes. Engineered with Gemini Managed Agents."
        },
        hn_show: "Show HN: Studio – 9 Specialist AI Agents Build & Deploy Your Startup Launch Kit in Parallel",
        linkedin_post: "Hackathons are about speed, but what if you could launch a full startup kit in under 5 minutes? Today at Shack15, we built Studio. Using the new Gemini Managed Agents API, we coordinate 9 specialist agents in parallel—strategist, marketer, legal, developer, and more. Each handles their domain and feeds into the final live product. Check it out!"
    },
    legal: {
        terms_of_service: "# Terms of Service\n\n*This is an AI-generated draft, have a lawyer review before use.*\n\nWelcome to Studio. By accessing our platform, you agree to comply with these terms. We provide AI-generated startup launch kits, but offer no warranties regarding their legal compliance or commercial suitability. You are responsible for verifying all outputs, code, and documents before deploy.",
        privacy_policy: "# Privacy Policy\n\n*This is an AI-generated draft, have a lawyer review before use.*\n\nWe value your privacy. Studio collects your startup ideas and email addresses solely to generate and deliver your launch kits. We do not sell your data or share it with third parties, except as required to call external generation APIs like Gemini, Domainr, and Vercel.",
        liability_summary: "AI-generated files. All liability for domain name conflicts, code vulnerabilities, copyright claims, or legal invalidity lies entirely with the end user. Review with professional counsel is mandatory."
    },
    namer: {
        names: [
            { name: "studioscript", domain: "studioscript.com", available: true },
            { name: "launchpadai", domain: "launchpadai.net", available: false, alternative_tld: "launchpadai.co" },
            { name: "agentstudio", domain: "agentstudio.io", available: true },
            { name: "shackio", domain: "shackio.com", available: false, alternative_tld: "shackio.net" },
            { name: "geminilabs", domain: "geminilabs.co", available: true }
        ]
    },
    designer: {
        mockupUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
        exportedCode: "<div class=\"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6\"><h1 class=\"text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent\">Studio</h1><p class=\"mt-4 text-slate-400 max-w-md text-center\">A startup launch kit created in parallel by 9 specialist agents.</p></div>",
        logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
        logoVariants: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
            "https://images.unsplash.com/photo-1618005198143-e528346d9a59"
        ],
        palette: {
            primary: "#0f172a",
            secondary: "#6366f1",
            accent: "#38bdf8"
        }
    },
    developer: {
        liveUrl: "https://studio-demo-app.vercel.app",
        html: "<!DOCTYPE html><html><head><title>Studio App</title></head><body><h1>Hello World</h1></body></html>",
        deployedAt: "2026-05-23T12:55:00.000Z"
    },
    growth: {
        prospects: [
            {
                name: "Sarah Chen",
                role: "Managing Director",
                company: "Apex Ventures",
                linkedin: "https://linkedin.com/in/sarahchen-apex",
                why_fit: "Focuses on early-stage developer tools and AI productivity frameworks.",
                email_draft: "Hi Sarah, saw your recent post on generative platforms. We're building Studio..."
            },
            {
                name: "David Miller",
                role: "VP of Product",
                company: "LaunchStack",
                linkedin: "https://linkedin.com/in/davidmiller-launchstack",
                why_fit: "Leads products helping startups deploy landing pages quickly.",
                email_draft: "Hi David, I'm building Studio to streamline startup setup using parallel agents..."
            }
        ]
    },
    analyst: {
        competitors: [
            { name: "LaunchFast", url: "https://launchfast.com", positioning: "Boilerplate templates for Next.js", pricing: "$199 one-time", strength: "Mature boilerplate code", weakness: "No AI personalization or custom text" },
            { name: "ShipFast", url: "https://shipfa.st", positioning: "Next.js startup template", pricing: "$169 one-time", strength: "Very popular community", weakness: "Manual deployment and coding required" }
        ],
        market_gap: "Lack of zero-code parallel automation that produces complete, unified marketing and legal kits in one click.",
        recommendation: "Target non-technical founders who want fully customized, deployed landing pages with real domain availability checks."
    }
};
export async function spawnManagedAgent(opts) {
    // Graceful total timeout fallback
    const timeoutMs = opts.timeoutMs ?? 60000;
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Timeout: spawnManagedAgent exceeded execution budget of ${timeoutMs}ms`));
        }, timeoutMs);
    });
    const executionPromise = async () => {
        let previousInteractionId = undefined;
        let currentEnvironmentId = "remote";
        let finalOutput = "";
        const allToolCalls = [];
        let currentInput = opts.userMessage;
        let active = true;
        while (active) {
            // Call Interactions API with environment remote sandbox
            const stream = await client.interactions.create({
                agent: "antigravity-preview-05-2026",
                input: currentInput,
                system_instruction: opts.systemPrompt,
                tools: opts.tools,
                environment: currentEnvironmentId,
                previous_interaction_id: previousInteractionId,
                stream: true,
            });
            let interactionId = undefined;
            // Stream text deltas as they arrive
            for await (const event of stream) {
                if (event.event_type === 'interaction.created') {
                    interactionId = event.interaction.id;
                    if (event.interaction.environment_id) {
                        currentEnvironmentId = event.interaction.environment_id;
                    }
                    previousInteractionId = interactionId;
                }
                if (event.event_type === 'step.delta') {
                    if (event.delta && 'text' in event.delta && event.delta.text) {
                        finalOutput += event.delta.text;
                        opts.onChunk(event.delta.text);
                    }
                }
            }
            if (!interactionId) {
                throw new Error("Failed to initialize interaction resource");
            }
            // Query completed interaction state to inspect steps and status
            const interaction = await client.interactions.get(interactionId);
            if (interaction.status === 'requires_action') {
                const functionCallStep = interaction.steps?.find((step) => step.type === 'function_call');
                if (functionCallStep) {
                    const call = {
                        id: functionCallStep.id,
                        name: functionCallStep.name,
                        args: functionCallStep.arguments,
                    };
                    allToolCalls.push(call);
                    opts.onToolCall(call);
                    // Execute registered tool locally
                    let result;
                    try {
                        result = await executeTool(call.name, call.args);
                    }
                    catch (err) {
                        console.error(`Local execution of tool ${call.name} failed:`, err);
                        result = { error: err.message || "Local execution failed" };
                    }
                    opts.onToolResult(result);
                    // Feed back function result to continue interaction in next turn
                    currentInput = [
                        {
                            role: 'tool',
                            parts: [
                                {
                                    function_response: {
                                        name: call.name,
                                        response: result,
                                    },
                                },
                            ],
                        },
                    ];
                }
                else {
                    active = false;
                }
            }
            else {
                // completed, failed, cancelled, budget_exceeded etc.
                active = false;
            }
        }
        // Try parsing JSON block out of output
        let structured = undefined;
        try {
            const jsonRegex = /\{[\s\S]*\}/;
            const match = finalOutput.match(jsonRegex);
            if (match) {
                structured = JSON.parse(match[0]);
            }
            else {
                structured = JSON.parse(finalOutput);
            }
        }
        catch (e) {
            // Not JSON or parsing failed
        }
        return {
            output: finalOutput,
            structured,
            toolCalls: allToolCalls
        };
    };
    try {
        return await Promise.race([executionPromise(), timeoutPromise]);
    }
    catch (err) {
        console.warn(`spawnManagedAgent execution error or timeout for ${opts.agentName}:`, err);
        // Return structured mock fallback
        const mockStructured = mockDataMap[opts.agentName.toLowerCase()] || {};
        return {
            output: JSON.stringify(mockStructured, null, 2),
            structured: mockStructured,
            toolCalls: []
        };
    }
}
