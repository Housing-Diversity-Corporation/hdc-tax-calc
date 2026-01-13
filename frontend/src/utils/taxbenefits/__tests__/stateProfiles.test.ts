/**
 * State Tax Profiles - Comprehensive Test Suite
 *
 * Validates data integrity and utility functions for all 56 jurisdictions.
 *
 * @module stateProfiles.test
 */

import {
  STATE_TAX_PROFILES,
  STATE_PROFILES_METADATA,
  getStateTaxProfile,
  getStateTaxRate,
  getStateOzConformity,
  getStateBonusDepreciation,
  getStateBonusConformityRate,
  hasStateLIHTC,
  getStateLIHTCProgram,
  getStateLIHTCSyndicationRate,
  getStateHDCTier,
  getCombinedLIHTCRate,
  doesNIITApply,
  hasStatePrevailingWage,
  getStatesByOzStatus,
  getStatesByHDCTier,
  getStatesWithStateLIHTC,
  getStatesWithFullOZConformity,
  getNoIncomeTaxStates,
  getTerritories,
  validateStateProfiles,
} from '../stateProfiles';

describe('State Tax Profiles - Data Integrity', () => {
  it('should have exactly 56 jurisdictions', () => {
    const count = Object.keys(STATE_TAX_PROFILES).length;
    expect(count).toBe(56);
  });

  it('should match metadata jurisdiction count', () => {
    const count = Object.keys(STATE_TAX_PROFILES).length;
    expect(count).toBe(STATE_PROFILES_METADATA.jurisdictionCount);
  });

  it('should have correct metadata version', () => {
    expect(STATE_PROFILES_METADATA.version).toBe('7.0');
  });

  it('should validate successfully', () => {
    const validation = validateStateProfiles();
    expect(validation.valid).toBe(true);
    expect(validation.count).toBe(56);
  });

  it('should have all required fields for each jurisdiction', () => {
    Object.values(STATE_TAX_PROFILES).forEach(profile => {
      expect(profile.code).toBeDefined();
      expect(profile.name).toBeDefined();
      expect(profile.type).toBeDefined();
      expect(profile.topRate).toBeDefined();
      expect(profile.ozConformity).toBeDefined();
      expect(profile.bonusDepreciation).toBeDefined();
      expect(profile.ozAuthority).toBeDefined();
      expect(profile.niitApplies).toBeDefined();
      expect(profile.lastUpdated).toBeDefined();
      expect(profile.taxYear).toBeDefined();
    });
  });

  it('should have valid state codes (2 letters)', () => {
    Object.keys(STATE_TAX_PROFILES).forEach(code => {
      expect(code).toMatch(/^[A-Z]{2}$/);
    });
  });
});

describe('State Tax Profiles - Individual State Tests', () => {
  describe('New York', () => {
    it('should have correct NY data', () => {
      const ny = getStateTaxProfile('NY');
      expect(ny).toBeDefined();
      expect(ny?.name).toBe('New York');
      expect(ny?.topRate).toBe(10.9);
      expect(ny?.ozConformity).toBe('none');
      expect(ny?.bonusDepreciation).toBe(0);
      expect(ny?.niitApplies).toBe(true);
    });

    it('should have NY State LIHTC program', () => {
      expect(hasStateLIHTC('NY')).toBe(true);
      const program = getStateLIHTCProgram('NY');
      expect(program?.program).toBe('SLIHC');
      expect(program?.type).toBe('standalone');
    });

    it('should have decoupling note', () => {
      const ny = getStateTaxProfile('NY');
      expect(ny?.specialRules).toContain('Decoupled');
    });
  });

  describe('Georgia', () => {
    it('should have correct GA data', () => {
      const ga = getStateTaxProfile('GA');
      expect(ga).toBeDefined();
      expect(ga?.name).toBe('Georgia');
      expect(ga?.topRate).toBe(5.75);
      expect(ga?.ozConformity).toBe('full-adopted');
      expect(ga?.bonusDepreciation).toBe(0);
    });

    it('should have 100% piggyback State LIHTC', () => {
      expect(hasStateLIHTC('GA')).toBe(true);
      const program = getStateLIHTCProgram('GA');
      expect(program?.type).toBe('piggyback');
      expect(program?.percent).toBe(100);
      expect(program?.transferability).toBe('bifurcated');
      expect(program?.syndicationRate).toBe(85);
    });

    it('should be HDC Tier 1', () => {
      expect(getStateHDCTier('GA')).toBe(1);
      expect(getCombinedLIHTCRate('GA')).toBe(46.6);
    });
  });

  describe('Oregon', () => {
    it('should have correct OR data', () => {
      const or = getStateTaxProfile('OR');
      expect(or).toBeDefined();
      expect(or?.name).toBe('Oregon');
      expect(or?.topRate).toBe(9.9);
      expect(or?.ozConformity).toBe('full-rolling');
    });

    it('should have 100% bonus depreciation (ONLY state)', () => {
      expect(getStateBonusDepreciation('OR')).toBe(100);
    });

    it('should have special rule note', () => {
      const or = getStateTaxProfile('OR');
      expect(or?.specialRules).toContain('ONLY state');
    });

    it('should NOT have State LIHTC', () => {
      expect(hasStateLIHTC('OR')).toBe(false);
      expect(getStateLIHTCProgram('OR')).toBeNull();
    });

    it('should be HDC Tier 2', () => {
      expect(getStateHDCTier('OR')).toBe(2);
    });
  });

  describe('California', () => {
    it('should have correct CA data', () => {
      const ca = getStateTaxProfile('CA');
      expect(ca).toBeDefined();
      expect(ca?.name).toBe('California');
      expect(ca?.topRate).toBe(13.3);
      expect(ca?.ozConformity).toBe('none');
    });

    it('should have certificated State LIHTC', () => {
      const program = getStateLIHTCProgram('CA');
      expect(program?.transferability).toBe('certificated');
      expect(program?.syndicationRate).toBe(90);
    });

    it('should have prevailing wage requirement', () => {
      expect(hasStatePrevailingWage('CA')).toBe(true);
      const program = getStateLIHTCProgram('CA');
      expect(program?.pw).toBe(true);
    });

    it('should be HDC Tier 3', () => {
      expect(getStateHDCTier('CA')).toBe(3);
    });
  });

  describe('Nebraska', () => {
    it('should have 100% piggyback with transferable mechanism', () => {
      const program = getStateLIHTCProgram('NE');
      expect(program?.type).toBe('piggyback');
      expect(program?.percent).toBe(100);
      expect(program?.transferability).toBe('transferable');
      expect(program?.syndicationRate).toBe(90);
    });

    it('should be HDC Tier 1', () => {
      expect(getStateHDCTier('NE')).toBe(1);
    });
  });

  describe('South Carolina', () => {
    it('should have 100% piggyback with allocated mechanism', () => {
      const program = getStateLIHTCProgram('SC');
      expect(program?.type).toBe('piggyback');
      expect(program?.percent).toBe(100);
      expect(program?.transferability).toBe('allocated');
      expect(program?.syndicationRate).toBe(80);
    });

    it('should be HDC Tier 1', () => {
      expect(getStateHDCTier('SC')).toBe(1);
    });
  });

  describe('Kansas', () => {
    it('should have sunset warning', () => {
      const program = getStateLIHTCProgram('KS');
      expect(program?.sunset).toBe(2028);
      const ks = getStateTaxProfile('KS');
      expect(ks?.specialRules).toContain('sunsets 2028');
    });

    it('should be HDC Tier 1 with warning', () => {
      expect(getStateHDCTier('KS')).toBe(1);
    });
  });

  describe('New Jersey', () => {
    it('should have grant-based STCS program', () => {
      const program = getStateLIHTCProgram('NJ');
      expect(program?.type).toBe('grant');
      expect(program?.transferability).toBe('grant');
      expect(program?.syndicationRate).toBe(100);
      expect(program?.pw).toBe(true);
    });

    it('should have PW warning', () => {
      expect(hasStatePrevailingWage('NJ')).toBe(true);
    });
  });

  describe('Texas (no income tax)', () => {
    it('should have zero tax rate', () => {
      expect(getStateTaxRate('TX')).toBe(0);
      const tx = getStateTaxProfile('TX');
      expect(tx?.ozConformity).toBe('no-cg-tax');
    });

    it('should NOT have State LIHTC', () => {
      expect(hasStateLIHTC('TX')).toBe(false);
    });
  });

  describe('Washington (special CG tax)', () => {
    it('should have special capital gains tax note', () => {
      const wa = getStateTaxProfile('WA');
      expect(wa?.specialRules).toContain('7% capital gains tax');
      expect(wa?.specialRules).toContain('$270K');
      expect(wa?.topRate).toBe(7); // IMPL-053: Updated to reflect 7% CG tax
      expect(wa?.ozConformity).toBe('none'); // IMPL-053: WA does not conform to OZ
    });
  });

  describe('Puerto Rico (territory)', () => {
    it('should be classified as territory', () => {
      const pr = getStateTaxProfile('PR');
      expect(pr?.type).toBe('territory');
    });

    it('should NOT have NIIT', () => {
      expect(doesNIITApply('PR')).toBe(false);
    });

    it('should have federal OZ access', () => {
      const pr = getStateTaxProfile('PR');
      expect(pr?.ozConformity).toBe('full-adopted');
      expect(pr?.specialRules).toContain('federal OZ benefits');
    });
  });

  describe('District of Columbia', () => {
    it('should be classified as district', () => {
      const dc = getStateTaxProfile('DC');
      expect(dc?.type).toBe('district');
    });

    it('should have supplement State LIHTC', () => {
      const program = getStateLIHTCProgram('DC');
      expect(program?.type).toBe('supplement');
      expect(program?.percent).toBe(25);
    });

    it('should be HDC Tier 2', () => {
      expect(getStateHDCTier('DC')).toBe(2);
    });
  });
});

describe('State Tax Profiles - Utility Functions', () => {
  describe('getStateTaxProfile', () => {
    it('should return profile for valid code', () => {
      const ny = getStateTaxProfile('NY');
      expect(ny).toBeDefined();
      expect(ny?.code).toBe('NY');
    });

    it('should return undefined for invalid code', () => {
      const invalid = getStateTaxProfile('ZZ');
      expect(invalid).toBeUndefined();
    });
  });

  describe('getStateTaxRate', () => {
    it('should return correct rates', () => {
      expect(getStateTaxRate('CA')).toBe(13.3);
      expect(getStateTaxRate('NY')).toBe(10.9);
      expect(getStateTaxRate('TX')).toBe(0);
    });

    it('should return 0 for invalid code', () => {
      expect(getStateTaxRate('ZZ')).toBe(0);
    });
  });

  describe('getStateOzConformity', () => {
    it('should return correct conformity types', () => {
      expect(getStateOzConformity('OR')).toBe('full-rolling');
      expect(getStateOzConformity('GA')).toBe('full-adopted');
      expect(getStateOzConformity('CA')).toBe('none');
      expect(getStateOzConformity('TX')).toBe('no-cg-tax');
    });

    it('should return null for invalid code', () => {
      expect(getStateOzConformity('ZZ')).toBeNull();
    });
  });

  describe('hasStateLIHTC', () => {
    it('should correctly identify states with LIHTC', () => {
      expect(hasStateLIHTC('GA')).toBe(true);
      expect(hasStateLIHTC('NE')).toBe(true);
      expect(hasStateLIHTC('CA')).toBe(true);
    });

    it('should correctly identify states without LIHTC', () => {
      expect(hasStateLIHTC('OR')).toBe(false);
      expect(hasStateLIHTC('TX')).toBe(false);
      expect(hasStateLIHTC('AL')).toBe(false);
    });
  });

  describe('getStateLIHTCSyndicationRate', () => {
    it('should return correct syndication rates', () => {
      expect(getStateLIHTCSyndicationRate('NE')).toBe(90); // transferable
      expect(getStateLIHTCSyndicationRate('GA')).toBe(85); // bifurcated
      expect(getStateLIHTCSyndicationRate('SC')).toBe(80); // allocated
      expect(getStateLIHTCSyndicationRate('NJ')).toBe(100); // grant
    });

    it('should return 0 for states without LIHTC', () => {
      expect(getStateLIHTCSyndicationRate('OR')).toBe(0);
      expect(getStateLIHTCSyndicationRate('TX')).toBe(0);
    });
  });

  describe('doesNIITApply', () => {
    it('should return true for states', () => {
      expect(doesNIITApply('NY')).toBe(true);
      expect(doesNIITApply('CA')).toBe(true);
    });

    it('should return false for territories', () => {
      expect(doesNIITApply('PR')).toBe(false);
      expect(doesNIITApply('VI')).toBe(false);
      expect(doesNIITApply('GU')).toBe(false);
      expect(doesNIITApply('MP')).toBe(false);
      expect(doesNIITApply('AS')).toBe(false);
    });
  });

  describe('hasStatePrevailingWage', () => {
    it('should identify states with PW', () => {
      expect(hasStatePrevailingWage('CA')).toBe(true);
      expect(hasStatePrevailingWage('NJ')).toBe(true);
    });

    it('should identify states without PW', () => {
      expect(hasStatePrevailingWage('GA')).toBe(false);
      expect(hasStatePrevailingWage('NE')).toBe(false);
    });
  });
});

describe('State Tax Profiles - Filtering Functions', () => {
  describe('getStatesByOzStatus', () => {
    it('should find full-rolling states', () => {
      const rolling = getStatesByOzStatus('full-rolling');
      expect(rolling.length).toBeGreaterThan(0);
      expect(rolling.some(s => s.code === 'OR')).toBe(true);
    });

    it('should find states with no OZ conformity', () => {
      const none = getStatesByOzStatus('none');
      expect(none.some(s => s.code === 'CA')).toBe(true);
      expect(none.some(s => s.code === 'NY')).toBe(true);
    });

    it('should find no-cg-tax states', () => {
      const noCG = getStatesByOzStatus('no-cg-tax');
      expect(noCG.some(s => s.code === 'TX')).toBe(true);
      expect(noCG.some(s => s.code === 'FL')).toBe(true);
    });
  });

  describe('getStatesByHDCTier', () => {
    it('should find Tier 1 states', () => {
      const tier1 = getStatesByHDCTier(1);
      expect(tier1.length).toBe(4); // GA, NE, SC, KS
      expect(tier1.some(s => s.code === 'GA')).toBe(true);
      expect(tier1.some(s => s.code === 'NE')).toBe(true);
      expect(tier1.some(s => s.code === 'SC')).toBe(true);
      expect(tier1.some(s => s.code === 'KS')).toBe(true);
    });

    it('should find Tier 2 states', () => {
      const tier2 = getStatesByHDCTier(2);
      expect(tier2.length).toBe(4); // OR, DC, MO, OH
      expect(tier2.some(s => s.code === 'OR')).toBe(true);
    });

    it('should find Tier 3 states', () => {
      const tier3 = getStatesByHDCTier(3);
      expect(tier3.length).toBe(3); // NJ, CA, CT
      expect(tier3.some(s => s.code === 'CA')).toBe(true);
    });
  });

  describe('getStatesWithStateLIHTC', () => {
    it('should find exactly 25 states with State LIHTC', () => {
      const withLIHTC = getStatesWithStateLIHTC();
      expect(withLIHTC.length).toBe(25);
    });

    it('should include all piggyback states', () => {
      const withLIHTC = getStatesWithStateLIHTC();
      const piggyback = withLIHTC.filter(s => s.stateLIHTC?.type === 'piggyback');
      expect(piggyback.length).toBe(5); // GA, NE, SC, KS, AR
    });
  });

  describe('getStatesWithFullOZConformity', () => {
    it('should find 37 jurisdictions with full OZ conformity', () => {
      const fullOZ = getStatesWithFullOZConformity();
      // 31 states + DC + 5 territories = 37 total
      expect(fullOZ.length).toBe(37);
    });

    it('should include both full-rolling and full-adopted', () => {
      const fullOZ = getStatesWithFullOZConformity();
      expect(fullOZ.some(s => s.code === 'OR' && s.ozConformity === 'full-rolling')).toBe(true);
      expect(fullOZ.some(s => s.code === 'GA' && s.ozConformity === 'full-adopted')).toBe(true);
    });
  });

  describe('getNoIncomeTaxStates', () => {
    it('should find 7-8 no-income-tax states', () => {
      const noTax = getNoIncomeTaxStates();
      expect(noTax.length).toBeGreaterThanOrEqual(7);
      expect(noTax.some(s => s.code === 'TX')).toBe(true);
      expect(noTax.some(s => s.code === 'FL')).toBe(true);
    });

    it('should NOT include territories', () => {
      const noTax = getNoIncomeTaxStates();
      expect(noTax.every(s => s.type === 'state')).toBe(true);
    });
  });

  describe('getTerritories', () => {
    it('should find exactly 5 territories', () => {
      const territories = getTerritories();
      expect(territories.length).toBe(5);
    });

    it('should include PR, VI, GU, MP, AS', () => {
      const territories = getTerritories();
      const codes = territories.map(t => t.code);
      expect(codes).toContain('PR');
      expect(codes).toContain('VI');
      expect(codes).toContain('GU');
      expect(codes).toContain('MP');
      expect(codes).toContain('AS');
    });

    it('territories should NOT have NIIT', () => {
      const territories = getTerritories();
      expect(territories.every(t => !t.niitApplies)).toBe(true);
    });
  });
});

describe('State Tax Profiles - Business Logic', () => {
  it('Oregon should be only state with 100% bonus depreciation', () => {
    const allStates = Object.values(STATE_TAX_PROFILES);
    const with100Bonus = allStates.filter(s => s.bonusDepreciation === 100);
    expect(with100Bonus.length).toBe(1);
    expect(with100Bonus[0].code).toBe('OR');
  });

  it('should have 11 HDC priority states total', () => {
    const tier1 = getStatesByHDCTier(1);
    const tier2 = getStatesByHDCTier(2);
    const tier3 = getStatesByHDCTier(3);
    const total = tier1.length + tier2.length + tier3.length;
    expect(total).toBe(11);
  });

  it('all states with State LIHTC should have valid syndication rates', () => {
    const withLIHTC = getStatesWithStateLIHTC();
    withLIHTC.forEach(state => {
      const rate = state.stateLIHTC?.syndicationRate;
      expect(rate).toBeDefined();
      expect(rate).toBeGreaterThanOrEqual(80);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  it('all territories should have federal OZ access', () => {
    const territories = getTerritories();
    territories.forEach(territory => {
      expect(territory.ozConformity).toBe('full-adopted');
    });
  });

  it('states with grant-based LIHTC should have 100% syndication', () => {
    const withLIHTC = getStatesWithStateLIHTC();
    const grants = withLIHTC.filter(s => s.stateLIHTC?.type === 'grant');
    grants.forEach(state => {
      expect(state.stateLIHTC?.syndicationRate).toBe(100);
    });
  });
});

/**
 * IMPL-041: State Bonus Depreciation Conformity Tests
 *
 * Tests the getStateBonusConformityRate() function that returns the
 * percentage (0.0-1.0) of federal bonus depreciation a state recognizes
 * for state income tax purposes.
 */
describe('State Bonus Depreciation Conformity - IMPL-041', () => {
  describe('getStateBonusConformityRate', () => {
    it('should return 0.3 (30%) for New Jersey', () => {
      expect(getStateBonusConformityRate('NJ')).toBe(0.3);
    });

    it('should return 0.0 (0%) for California', () => {
      expect(getStateBonusConformityRate('CA')).toBe(0.0);
    });

    it('should return 0.5 (50%) for New York', () => {
      expect(getStateBonusConformityRate('NY')).toBe(0.5);
    });

    it('should return 0.0 (0%) for Pennsylvania', () => {
      expect(getStateBonusConformityRate('PA')).toBe(0.0);
    });

    it('should return 0.0 (0%) for Illinois', () => {
      expect(getStateBonusConformityRate('IL')).toBe(0.0);
    });

    it('should return 1.0 (full conformity) for Oregon', () => {
      expect(getStateBonusConformityRate('OR')).toBe(1.0);
    });

    it('should return 1.0 (full conformity) for Georgia', () => {
      expect(getStateBonusConformityRate('GA')).toBe(1.0);
    });

    it('should return 1.0 (full conformity) for unlisted states', () => {
      // Test states not explicitly listed should default to full conformity
      expect(getStateBonusConformityRate('TX')).toBe(1.0);
      expect(getStateBonusConformityRate('FL')).toBe(1.0);
      expect(getStateBonusConformityRate('WA')).toBe(1.0);
    });

    it('should return 1.0 for undefined state code', () => {
      // Edge case: unknown state should default to full conformity
      expect(getStateBonusConformityRate('XX')).toBe(1.0);
    });
  });

  describe('Conformity Impact on Tax Benefit Calculation', () => {
    const FEDERAL_RATE = 0.37;
    const BONUS_DEPRECIATION = 1000000; // $1M for easy math

    it('should calculate higher tax benefit for conforming states', () => {
      const oregonRate = getStateTaxRate('OR'); // ~9.9%
      const oregonConformity = getStateBonusConformityRate('OR'); // 1.0

      // Full state benefit on bonus
      const oregonBonusBenefit = BONUS_DEPRECIATION * (FEDERAL_RATE + (oregonRate / 100) * oregonConformity);

      // Expected: ~46.9% of $1M = $469,000
      expect(oregonBonusBenefit).toBeGreaterThan(450000);
    });

    it('should calculate lower tax benefit for non-conforming states', () => {
      const caRate = getStateTaxRate('CA'); // ~13.3%
      const caConformity = getStateBonusConformityRate('CA'); // 0.0

      // No state benefit on bonus
      const caBonusBenefit = BONUS_DEPRECIATION * (FEDERAL_RATE + (caRate / 100) * caConformity);

      // Expected: 37% federal only = $370,000
      expect(caBonusBenefit).toBe(370000);
    });

    it('should calculate partial benefit for partial-conformity states (NJ)', () => {
      const njRate = getStateTaxRate('NJ'); // ~10.75%
      const njConformity = getStateBonusConformityRate('NJ'); // 0.3

      // 30% of state benefit on bonus
      const njBonusBenefit = BONUS_DEPRECIATION * (FEDERAL_RATE + (njRate / 100) * njConformity);

      // Expected: 37% + (10.75% × 0.3) = 40.225% = $402,250
      expect(njBonusBenefit).toBeCloseTo(402250, -1); // Within $10
    });

    it('should correctly split Year 1 tax benefit between bonus and MACRS', () => {
      const njRate = getStateTaxRate('NJ');
      const njConformity = getStateBonusConformityRate('NJ');

      const bonusDepreciation = 200000; // 20% of $1M
      const year1MACRS = 14545; // ~$400K/27.5/12*4.5 months

      // Bonus: federal-only adjusted
      const bonusTaxBenefit = bonusDepreciation * (FEDERAL_RATE + (njRate / 100) * njConformity);

      // MACRS: full state rate (all states accept straight-line)
      const macrsTaxBenefit = year1MACRS * (FEDERAL_RATE + njRate / 100);

      const totalYear1Benefit = bonusTaxBenefit + macrsTaxBenefit;

      // MACRS should use full rate
      expect(macrsTaxBenefit / year1MACRS).toBeCloseTo(FEDERAL_RATE + njRate / 100, 2);

      // Bonus should use reduced rate
      expect(bonusTaxBenefit / bonusDepreciation).toBeCloseTo(FEDERAL_RATE + (njRate / 100) * njConformity, 2);

      // Total should be less than if full conformity
      const fullConformityTotal = (bonusDepreciation + year1MACRS) * (FEDERAL_RATE + njRate / 100);
      expect(totalYear1Benefit).toBeLessThan(fullConformityTotal);
    });
  });
});
