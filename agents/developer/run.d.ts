import { DeveloperOutput } from './schema.js';
export declare function runDeveloper(designerOutput: any, copywriterOutput: any, callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: {
        name: string;
        args: any;
    }) => void;
    onToolResult?: (result: any) => void;
}): Promise<DeveloperOutput>;
//# sourceMappingURL=run.d.ts.map