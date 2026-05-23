export declare function spawnManagedAgent(opts: {
    agentName: string;
    systemPrompt: string;
    userMessage: string;
    tools?: any[];
    model?: string;
    onChunk: (text: string) => void;
    onToolCall: (call: {
        name: string;
        args: any;
    }) => void;
    onToolResult: (result: any) => void;
    timeoutMs?: number;
}): Promise<{
    output: string;
    structured?: any;
    toolCalls: any[];
}>;
//# sourceMappingURL=managedAgent.d.ts.map