export interface MarketerOutput {
  tweet_thread: string[]; // exactly 5-7 elements
  producthunt: {
    tagline: string;
    description: string;
  };
  hn_show: string;
  linkedin_post: string;
}
