/**
 * dbpService Tests (IMPL-084)
 *
 * Verifies that the Deal Benefit Profile service sends requests
 * to the correct backend endpoints with the expected shapes.
 */

import { dbpService } from '../dbpService';
import type { DealBenefitProfile } from '../../types/dealBenefitProfile';

// Mock the api module
jest.mock('../api', () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: mockApi };
});

import api from '../api';
const mockApi = jest.mocked(api);

function createMinimalDbp(overrides: Partial<DealBenefitProfile> = {}): DealBenefitProfile {
  return {
    dealConduitId: 1,
    dealName: 'Test Deal',
    propertyState: 'CA',
    fundYear: 2024,
    projectCost: 100_000_000,
    grossEquity: 5_000_000,
    netEquity: 4_000_000,
    syndicationProceeds: 1_000_000,
    depreciationSchedule: [16_000_000],
    lihtcSchedule: [700_000],
    stateLihtcSchedule: [300_000],
    operatingCashFlow: [500_000],
    holdPeriod: 10,
    exitProceeds: 15_000_000,
    cumulativeDepreciation: 8_000_000,
    recaptureExposure: 2_000_000,
    projectedAppreciation: 5_000_000,
    capitalGainsTax: 1_190_000,
    ozEnabled: false,
    pisMonth: 6,
    pisYear: 2024,
    seniorDebtPct: 65,
    philDebtPct: 30,
    equityPct: 5,
    stateLihtcPath: 'direct_use',
    syndicationRate: 0.85,
    extractedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dbpService', () => {
  describe('save', () => {
    it('should POST to /deal-benefit-profiles/extract/{conduitId} with DBP body', async () => {
      const dbp = createMinimalDbp();
      const savedDbp = { ...dbp, id: 99 };
      mockApi.post.mockResolvedValue({ data: savedDbp });

      const result = await dbpService.save(42, dbp);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/deal-benefit-profiles/extract/42',
        dbp
      );
      expect(result.id).toBe(99);
    });
  });

  describe('getAll', () => {
    it('should GET /deal-benefit-profiles', async () => {
      const profiles = [createMinimalDbp({ id: 1 }), createMinimalDbp({ id: 2 })];
      mockApi.get.mockResolvedValue({ data: profiles });

      const result = await dbpService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/deal-benefit-profiles');
      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should GET /deal-benefit-profiles/{id}', async () => {
      const profile = createMinimalDbp({ id: 5 });
      mockApi.get.mockResolvedValue({ data: profile });

      const result = await dbpService.getById(5);

      expect(mockApi.get).toHaveBeenCalledWith('/deal-benefit-profiles/5');
      expect(result.id).toBe(5);
    });
  });

  describe('getView', () => {
    it('should GET /deal-benefit-profiles/{id}/view', async () => {
      const view = {
        profile: createMinimalDbp({ id: 5 }),
        sourceDealName: 'Original Deal',
        sourceConduitId: 42,
      };
      mockApi.get.mockResolvedValue({ data: view });

      const result = await dbpService.getView(5);

      expect(mockApi.get).toHaveBeenCalledWith('/deal-benefit-profiles/5/view');
      expect(result.sourceDealName).toBe('Original Deal');
      expect(result.sourceConduitId).toBe(42);
    });
  });

  describe('getByConduitId', () => {
    it('should GET /deal-benefit-profiles/conduit/{conduitId}', async () => {
      const profiles = [createMinimalDbp({ id: 1 })];
      mockApi.get.mockResolvedValue({ data: profiles });

      const result = await dbpService.getByConduitId(42);

      expect(mockApi.get).toHaveBeenCalledWith('/deal-benefit-profiles/conduit/42');
      expect(result).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should DELETE /deal-benefit-profiles/{id}', async () => {
      mockApi.delete.mockResolvedValue({});

      await dbpService.delete(5);

      expect(mockApi.delete).toHaveBeenCalledWith('/deal-benefit-profiles/5');
    });
  });

  describe('error handling', () => {
    it('should propagate network errors from save', async () => {
      const dbp = createMinimalDbp();
      mockApi.post.mockRejectedValue(new Error('Network Error'));

      await expect(dbpService.save(42, dbp)).rejects.toThrow('Network Error');
    });

    it('should propagate 404 errors from getById', async () => {
      const error = { response: { status: 404 } };
      mockApi.get.mockRejectedValue(error);

      await expect(dbpService.getById(999)).rejects.toEqual(error);
    });
  });
});
