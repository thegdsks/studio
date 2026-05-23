export interface CopywriterOutput {
  hero: {
    headline: string;
    sub: string;
  };
  features: Array<{
    title: string;
    body: string;
  }>; // exactly 3 features
  faq: Array<{
    q: string;
    a: string;
  }>; // exactly 5 FAQs
  cta: string;
}
