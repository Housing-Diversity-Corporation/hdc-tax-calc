# HDC Calculator Development Roadmap

## Recent Improvements (September 2025)

### ✅ Completed
1. **Fixed Year 1 Tax Benefit Double-Counting**
   - Removed duplicate display in InvestorCashFlowSection
   - Corrected total returns calculation

2. **S-Curve Lease-Up Improvements**
   - Changed from midpoint (15.9%) to monthly average (~31%) for Year 1
   - More realistic occupancy progression during lease-up

3. **Interest Reserve Optimization**
   - Now sized to actual shortfall considering S-curve NOI
   - Reduced from ~$6.7M to ~$2.75M (40-50% reduction)
   - Fixed philanthropic debt current pay logic

4. **Exit Proceeds Catch-Up Logic**
   - HDC now properly receives catch-up for deferred fees
   - Clear tracking of deferred tax benefit fees
   - Transparent display in HDC cash flow section

5. **Cash Flow Table Transparency**
   - Added OZ Year 5 Tax Payment column
   - Shows all components affecting total cash flow
   - Clear explanatory notes for complex items

6. **Documentation Updates**
   - Updated HDC_CALCULATION_LOGIC.md with all changes
   - Cleaned up obsolete test files (40 removed)
   - Added detailed comments for S-curve and interest reserve logic

---

## Short-Term Enhancements (Q4 2025)

### High Priority
1. **Fix Remaining Test Failures**
   - Update 86 failing tests to match new calculation logic
   - Create new tests for S-curve occupancy
   - Add tests for catch-up logic at exit

2. **Outside Investor Sub-Debt Visibility**
   - Add column showing outside investor payments in cash flow table
   - Track PIK accumulation separately
   - Show impact on DSCR management

3. **Enhanced Error Handling**
   - Add validation for impossible parameter combinations
   - Provide clear error messages for edge cases
   - Prevent negative interest reserves

### Medium Priority
1. **Performance Optimization**
   - Cache complex calculations
   - Optimize S-curve calculations for large models
   - Reduce re-renders in UI components

2. **Export Functionality**
   - Enhanced PDF reports with all new columns
   - Excel export with formulas intact
   - CSV export for data analysis

---

## Long-Term Enhancements (2026+)

### Advanced IRR Calculations
1. **Monthly IRR Implementation**
   - Switch from annual to monthly cash flow periods
   - More accurate time value calculations
   - Better handling of intra-year timing

2. **Fractional Year Adjustments**
   - Model tax benefit delays within annual IRR
   - Split benefits across years based on timing
   - Approximate monthly precision with annual periods

### Financial Modeling Enhancements
1. **Variable Rate Modeling**
   - Support for floating rate debt
   - Interest rate sensitivity analysis
   - Rate cap/floor modeling

2. **Scenario Analysis**
   - Multiple scenario comparison
   - Monte Carlo simulations
   - Sensitivity analysis dashboard

3. **Advanced Waterfall Features**
   - Multiple promote tiers
   - Clawback provisions
   - GP catch-up variations

### Tax Strategy Enhancements
1. **State-Specific Tax Modeling**
   - Non-conforming state handling
   - State-by-state tax optimization
   - Multi-state investor scenarios

2. **Advanced Depreciation Strategies**
   - Component depreciation modeling
   - Cost segregation study integration
   - Section 179 deduction handling

3. **Partnership Structure Optimization**
   - Multiple entity structures
   - Preferred returns modeling
   - Special allocations handling

### User Experience Improvements
1. **Guided Setup Wizard**
   - Step-by-step configuration
   - Template library expansion
   - Industry-specific presets

2. **Advanced Visualizations**
   - Interactive cash flow diagrams
   - Animated S-curve visualization
   - Real-time sensitivity charts

3. **Collaboration Features**
   - Multi-user scenarios
   - Version control for configurations
   - Commenting and annotations

---

## Technical Debt & Infrastructure

### Code Quality
1. **Test Coverage**
   - Achieve 90%+ test coverage
   - Add integration tests
   - Performance benchmarking

2. **Code Refactoring**
   - Split large calculation functions
   - Improve type safety
   - Reduce coupling between components

3. **Documentation**
   - API documentation
   - Video tutorials
   - Interactive examples

### Architecture Improvements
1. **Calculation Engine Separation**
   - Extract calculation logic to separate package
   - Create REST API for calculations
   - Enable server-side processing option

2. **State Management**
   - Migrate to more efficient state management
   - Implement undo/redo functionality
   - Add configuration versioning

---

## Notes

- Priority may shift based on user feedback and business requirements
- Each enhancement should maintain backward compatibility
- All changes require comprehensive testing before deployment
- Documentation must be updated with each feature addition

Last Updated: September 2025