import { DesignerOutput } from './schema.js';
export declare function runDesigner(brandName: string, positioning: string, callbacks?: {
    onChunk?: (text: string) => void;
    onToolCall?: (call: {
        name: string;
        args: any;
    }) => void;
    onToolResult?: (result: any) => void;
}): Promise<DesignerOutput>;
//# sourceMappingURL=run.d.ts.map