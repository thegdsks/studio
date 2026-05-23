export interface ApolloProspect {
    name: string;
    role: string;
    company: string;
    linkedin: string;
    email?: string;
}
export declare function apolloSearch(titles: string[], keywords: string[]): Promise<ApolloProspect[]>;
//# sourceMappingURL=apollo.d.ts.map