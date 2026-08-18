export interface SponsorBrief {
  audience?: string;
  tone?: string;
  rules?: string;
  required_terms?: string[];
  forbidden_terms?: string[];
  [key: string]: unknown;
}

export interface ComplianceResult {
  compliant: boolean;
  missing: string[];
  violations: string[];
}

export function checkSponsorCompliance(
  text: string,
  sponsorBrief?: SponsorBrief | null,
): ComplianceResult {
  const normalizedText = text.toLowerCase();

  const requiredTerms = Array.isArray(sponsorBrief?.required_terms)
    ? sponsorBrief.required_terms.map((term) => String(term).trim().toLowerCase()).filter(Boolean)
    : [];

  const forbiddenTerms = Array.isArray(sponsorBrief?.forbidden_terms)
    ? sponsorBrief.forbidden_terms.map((term) => String(term).trim().toLowerCase()).filter(Boolean)
    : [];

  const missing = requiredTerms.filter((term) => !normalizedText.includes(term));
  const violations = forbiddenTerms.filter((term) => normalizedText.includes(term));

  return {
    compliant: missing.length === 0 && violations.length === 0,
    missing,
    violations,
  };
}
