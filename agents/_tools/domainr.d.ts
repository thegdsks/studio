export interface DomainCheckResult {
    name: string;
    domain: string;
    available: boolean;
    alternative_tld?: string;
}
export declare function checkDomain(name: string): Promise<DomainCheckResult>;
//# sourceMappingURL=domainr.d.ts.map