import { GrowthOutput } from './schema.js';
export declare function runGrowth(opts: {
    brandName: string;
    positioning: string;
    idea: string;
    callbacks?: {
        onChunk?: (text: string) => void;
        onToolCall?: (call: {
            name: string;
            args: any;
        }) => void;
        onToolResult?: (result: any) => void;
    };
}): Promise<GrowthOutput>;
//# sourceMappingURL=run.d.ts.map