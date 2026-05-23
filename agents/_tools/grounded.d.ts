export interface GroundedResult {
    summary: string;
    sources: Array<{
        title: string;
        url: string;
    }>;
}
export declare function groundedQuery(query: string, numSources?: number): Promise<GroundedResult>;
//# sourceMappingURL=grounded.d.ts.map