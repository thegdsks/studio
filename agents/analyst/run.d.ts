import { AnalystOutput } from './schema.js';
export declare function runAnalyst(idea: string, callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: {
        name: string;
        args: any;
    }) => void;
    onToolResult?: (result: any) => void;
}): Promise<AnalystOutput>;
//# sourceMappingURL=run.d.ts.map