import { StrategistOutput } from './schema.js';
export declare function runStrategist(idea: string, callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: {
        name: string;
        args: any;
    }) => void;
    onToolResult?: (result: any) => void;
}): Promise<StrategistOutput>;
//# sourceMappingURL=run.d.ts.map