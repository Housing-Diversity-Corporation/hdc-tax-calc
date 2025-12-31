# HDC Calculator Conventions

## Monetary Value Units

**CRITICAL**: All monetary values in this codebase are stored in **MILLIONS OF DOLLARS**, not raw dollars.

### Why This Convention Exists

The UI inputs are designed for real estate developers working with multi-million dollar projects. Input fields display labels like "Project Cost ($M)" and users enter values like `100` meaning $100 million. This convention flows through the entire codebase:

- **Input**: User enters `100` in "Project Cost ($M)" field
- **State**: `projectCost = 100` (represents $100,000,000)
- **Calculations**: All math uses the million-dollar values
- **Output**: Display functions convert back to user-friendly formats

### Examples

| Variable Value | Actual Dollar Amount |
|----------------|---------------------|
| `projectCost: 100` | $100,000,000 |
| `landValue: 10` | $10,000,000 |
| `annualCredit: 3.04` | $3,040,000 |
| `yearOneNOI: 5.5` | $5,500,000 |
| `investorEquity: 25` | $25,000,000 |

### Display Formatting Functions

#### `formatCurrency(value: number): string`
Standard display formatter. Shows value as-is with dollar sign and decimal places.
- Input: `100` → Output: `"$100.00"` (meaning $100M)
- Use when: Displaying values in the standard "$XM" format

#### `formatFullDollars(value: number): string`
Converts from millions to full dollars with commas.
- Input: `3.04` → Output: `"$3,040,000"`
- Use when: User explicitly requests full dollar amounts (e.g., LIHTC credits)

### Code Examples

```typescript
// CORRECT: Values are in millions
const projectCost = 100;        // $100M
const landValue = 10;           // $10M
const lihtcBasis = projectCost - landValue; // 90 = $90M

// CORRECT: Display as millions
<span>{formatCurrency(projectCost)}</span>  // Shows "$100.00"

// CORRECT: Display as full dollars
<span>{formatFullDollars(annualCredit)}</span>  // Shows "$3,040,000"

// WRONG: Don't mix units!
const wrongBasis = projectCost * 1000000 - landValue;  // BUG!
```

### Adding New Monetary Fields

When adding new monetary fields:

1. **Document the unit** in JSDoc comments:
   ```typescript
   interface Props {
     /** Project cost in millions (e.g., 100 = $100M) */
     projectCost: number;
   }
   ```

2. **Use consistent naming** - no suffix means millions:
   ```typescript
   projectCost: number;      // In millions (standard)
   projectCostRaw?: number;  // Only if you need raw dollars (rare)
   ```

3. **Test with realistic values**:
   ```typescript
   // Test with million-scale values
   const mockProps = {
     projectCost: 100,        // $100M
     landValue: 10,           // $10M
     lihtcEligibleBasis: 90,  // $90M
   };
   ```

### Common Pitfalls

1. **Forgetting to multiply for full-dollar display**:
   ```typescript
   // WRONG - shows "$3" instead of "$3,000,000"
   <span>${Math.round(annualCredit)}</span>

   // CORRECT
   <span>{formatFullDollars(annualCredit)}</span>
   ```

2. **Inconsistent test data**:
   ```typescript
   // WRONG - mixing units
   projectCost: 100000000,  // This is $100 quadrillion!

   // CORRECT
   projectCost: 100,        // $100M
   ```

3. **Division confusion**:
   ```typescript
   // WRONG - value is already in millions
   const displayValue = projectCost / 1000000;

   // CORRECT - just use the value
   const displayValue = projectCost;
   ```

## Percentage Values

Percentages are stored as **whole numbers** (0-100), not decimals (0.0-1.0), unless the JSDoc specifically indicates otherwise.

| Variable Value | Meaning |
|----------------|---------|
| `investorEquityPct: 25` | 25% |
| `applicableFraction: 0.85` | 85% (note: this one uses decimal) |
| `creditRate: 0.04` | 4% (note: this one uses decimal) |

Always check the JSDoc comment for the specific field to understand its format.

## Related Documentation

- [Domain Specification](./domain-spec/) - Business logic and calculation rules
- [Implementation Notes](./implementation/) - Technical implementation details
