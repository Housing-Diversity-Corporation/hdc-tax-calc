# SDD Strategic Context Template v1.0

## Purpose

Every Task Spec should include a Strategic Context section that connects technical implementation to HDC's business objectives, investor value proposition, and institutional validation strategy. This ensures Claude Code understands not just *what* to build, but *why* it matters.

---

## Template Structure

Add this section to every Task Spec, immediately after the Context/Overview:

### Investor Value Proposition
[How does this feature translate to investor conversations?]
- What problem does it solve for the investor?
- How does it affect projected returns or tax benefits?
- Which investor profiles benefit most?

### Institutional Validation
[How does this support validation with professional partners?]
- Sidley Austin (legal/tax opinion)
- Novogradac (CPA validation, OZ expertise)
- Enterprise Community Partners (precedent transactions)
- Other institutional validators

### OZ 2.0 Positioning
[How does this advance HDC's position in the post-OBBBA landscape?]
- Tax credit-like execution differentiation
- Competitive advantage vs. traditional OZ funds
- Scalability implications

### Regulatory Foundation
[What regulatory sources drive this feature?]
- IRC sections (§168(k), §1400Z-2, etc.)
- Authoritative sources (Tax Foundation, Novogradac, IRS guidance)
- State-specific considerations

### Future Evolution
[How might this feature evolve as the platform matures?]
- Phase 1 (current): What we're building now
- Phase 2 (post-validation): How it expands once proven
- Phase 3 (scale): Long-term vision

---

## Why This Matters

### For Claude Code
CC needs context to make good implementation decisions. When CC understands that Oregon vs. New Jersey isn't just a data difference but a *sales conversation difference*, it will:
- Write clearer error messages
- Design more intuitive helper functions
- Flag edge cases that matter to investors

### For Validation
Specs with Strategic Context create an audit trail showing:
- Business rationale for each feature
- Regulatory basis for calculations
- Connection to institutional partner requirements

### For Future Development
When new team members (human or AI) join the project, Strategic Context explains:
- Why decisions were made
- What constraints existed
- How features connect to HDC's mission

---

## Integration with VALIDATION_PROTOCOL.md

Add to validation checklist:
- [ ] Strategic Context section completed
- [ ] Investor value proposition clearly stated
- [ ] Regulatory sources cited
- [ ] Institutional validation connection documented

---

## Quick Reference: Key Strategic Themes

Use these when writing Strategic Context sections:

**HDC's Core Innovation:**
"Tax credit-like execution of OZ funds" - 5% equity concentration with 100% bonus depreciation creates tax benefit economics that mirror LIHTC syndication, but permanent under OBBBA without allocation caps.

**The 95% Leverage Model:**
Philanthropic debt partnerships (Amazon HEF, Ballmer Group) enable 95% LTC at below-market rates, creating lower debt service than traditional 70% LTC at market rates.

**Why RE Economics Matter Less Over Time:**
As the model proves out, tax losses alone can make projects pencil, reducing dependency on philanthropic debt and opening scalability without Ballmer Group's upside expectations.

**Target Investor Profile:**
Real Estate Professionals and passive income generators in high-tax conforming states (OR, NJ, CT) where combined federal-state benefits can exceed 50%.

---

**Document Version:** v1.0
**Last Updated:** November 29, 2025
**Next Review:** Post-Vegas (Q1 2026)
