export interface DomainOption {
  name: string;
  domain: string;
  available: boolean;
  alternative_tld?: string;
}

export interface NamerOutput {
  names: DomainOption[]; // exactly 5 options
}
