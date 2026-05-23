/**
 * MarketerOutput: Produced by the Marketer agent.
 * The frontend renders each channel's content in dedicated tabs:
 * X thread, Product Hunt card, HN post, LinkedIn post,
 * email blast editor, posting schedule calendar, and replies kit.
 *
 * CANONICAL field names (old aliases removed):
 *   - `x_thread` replaces `tweet_thread` (removed)
 *   - `producthunt` stays as-is (the old `productHunt` alias is removed)
 *   - `hn_show` is now an object (was a plain string)
 */
export interface MarketerOutput {
  /**
   * X (formerly Twitter) thread. 5-7 posts.
   * Each element is one post. Rendered as a scrollable thread preview.
   */
  x_thread: string[];
  /** Product Hunt launch content. Rendered as a PH-style preview card. */
  producthunt: {
    /** Tagline under 60 characters. */
    tagline: string;
    /** Description under 260 characters. */
    description: string;
    /** Optional gallery image captions (3 max). */
    gallery_captions?: string[];
  };
  /** Hacker News Show HN post. Rendered as an HN-style preview. */
  hn_show: {
    /** HN post title including "Show HN:" prefix. Under 80 characters. */
    title: string;
    /** Post body: 2-4 paragraphs explaining what you built and why. Plain text. */
    body: string;
  };
  /** LinkedIn post. 150-300 words. Rendered in a LinkedIn-style post preview. */
  linkedin_post: string;

  /** Newsletter or cold-email blast. Rendered as an email preview pane. */
  email_blast: {
    /** Subject line under 60 characters. */
    subject: string;
    /** Email body. 100-200 words. Plain text, no HTML. */
    body: string;
  };
  /**
   * Suggested 5-day launch posting schedule.
   * Rendered as a calendar-style timeline. day 1 = launch day.
   */
  posting_schedule: Array<{
    /** Day number relative to launch (1-5). */
    day: number;
    /** Platform to post on. */
    platform: 'x' | 'linkedin' | 'producthunt' | 'hackernews' | 'email';
    /** Short description of what to post and any key instruction. Under 20 words. */
    what: string;
  }>;
  /**
   * Pre-written replies for community engagement.
   * Rendered as a copy-paste toolkit below the thread.
   */
  replies_kit: {
    /** 3 replies for positive or excited comments. */
    positive: string[];
    /** 3 replies for skeptical or challenging comments. */
    skeptical: string[];
  };
}
