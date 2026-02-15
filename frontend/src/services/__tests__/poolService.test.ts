/**
 * poolService Tests (IMPL-084)
 *
 * Verifies that the Investment Pool service sends requests
 * to the correct backend endpoints with the expected shapes.
 */

import { poolService } from '../poolService';

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('poolService', () => {
  describe('create', () => {
    it('should POST to /investment-pools with pool data', async () => {
      const pool = { id: 1, poolName: 'Fund I', status: 'modeling' as const };
      mockApi.post.mockResolvedValue({ data: pool });

      const result = await poolService.create('Fund I', 'First pool');

      expect(mockApi.post).toHaveBeenCalledWith('/investment-pools', {
        poolName: 'Fund I',
        description: 'First pool',
        status: 'modeling',
      });
      expect(result.poolName).toBe('Fund I');
    });
  });

  describe('getAll', () => {
    it('should GET /investment-pools', async () => {
      const pools = [
        { id: 1, poolName: 'Fund I', status: 'modeling' as const },
        { id: 2, poolName: 'Fund II', status: 'committed' as const },
      ];
      mockApi.get.mockResolvedValue({ data: pools });

      const result = await poolService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/investment-pools');
      expect(result).toHaveLength(2);
    });
  });

  describe('getWithDeals', () => {
    it('should GET /investment-pools/{id}/deals (not /investment-pools/{id})', async () => {
      const response = {
        pool: { id: 1, poolName: 'Fund I', status: 'modeling' as const },
        deals: [],
      };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await poolService.getWithDeals(1);

      expect(mockApi.get).toHaveBeenCalledWith('/investment-pools/1/deals');
      expect(result.pool.poolName).toBe('Fund I');
      expect(result.deals).toEqual([]);
    });
  });

  describe('update', () => {
    it('should PUT to /investment-pools/{id}', async () => {
      const pool = { id: 1, poolName: 'Updated Fund', status: 'committed' as const };
      mockApi.put.mockResolvedValue({ data: pool });

      const result = await poolService.update(1, { status: 'committed' });

      expect(mockApi.put).toHaveBeenCalledWith('/investment-pools/1', { status: 'committed' });
      expect(result.status).toBe('committed');
    });
  });

  describe('addDeal', () => {
    it('should POST to /investment-pools/{poolId}/deals/{dbpId} with no body', async () => {
      mockApi.post.mockResolvedValue({});

      await poolService.addDeal(1, 42);

      expect(mockApi.post).toHaveBeenCalledWith('/investment-pools/1/deals/42');
      // Verify no body was sent (only 1 argument to post)
      expect(mockApi.post).toHaveBeenCalledTimes(1);
      expect(mockApi.post.mock.calls[0]).toHaveLength(1);
    });
  });

  describe('removeDeal', () => {
    it('should DELETE /investment-pools/{poolId}/deals/{dbpId}', async () => {
      mockApi.delete.mockResolvedValue({});

      await poolService.removeDeal(1, 42);

      expect(mockApi.delete).toHaveBeenCalledWith('/investment-pools/1/deals/42');
    });
  });

  describe('delete', () => {
    it('should DELETE /investment-pools/{id}', async () => {
      mockApi.delete.mockResolvedValue({});

      await poolService.delete(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/investment-pools/1');
    });
  });

  describe('error handling', () => {
    it('should propagate 409 CONFLICT from addDeal (duplicate)', async () => {
      const error = { response: { status: 409 } };
      mockApi.post.mockRejectedValue(error);

      await expect(poolService.addDeal(1, 42)).rejects.toEqual(error);
    });
  });
});
