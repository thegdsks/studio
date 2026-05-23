/**
 * LegalOutput: Produced by the Legal agent.
 * The frontend renders each markdown document in a styled legal viewer
 * with a "Copy as Markdown" and "Download as .md" button.
 * The risk checklist renders as a color-coded severity table.
 *
 * CANONICAL field names (old aliases removed):
 *   - `terms_md` replaces `terms_of_service` (removed)
 *   - `privacy_md` replaces `privacy_policy` (removed)
 *   - `liability_md` replaces `liability_summary` (removed)
 */
export interface LegalOutput {
  /** Full Terms of Service in markdown. Must start with the AI-draft disclaimer. */
  terms_md: string;
  /** Full Privacy Policy in markdown. Must start with the AI-draft disclaimer. */
  privacy_md: string;
  /** One-paragraph liability summary in markdown. */
  liability_md: string;
  /** Short cookie disclosure section in markdown. Suitable for a website footer banner. */
  cookies_md: string;
  /**
   * 5-10 legal risks specific to this business type and jurisdiction.
   * Rendered as a color-coded severity table.
   */
  risk_checklist: Array<{
    /** Name of the risk, e.g. "HIPAA compliance for health data". */
    item: string;
    /** How serious this risk is if left unaddressed. */
    severity: 'low' | 'medium' | 'high';
    /** One concrete action the founder can take to mitigate this risk. */
    mitigation: string;
  }>;
  /**
   * One paragraph on default jurisdiction (Delaware C-Corp) and when
   * to consider alternatives. Rendered as an informational callout.
   */
  jurisdiction_note: string;
}
