import { describe, it, expect } from 'vitest';
import { createApiResponse, createApiError } from '../base';

describe('API Base Service', () => {
  it('should create successful API response', () => {
    const data = { id: '1', name: 'test' };
    const response = createApiResponse(data);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.error).toBe(null);
  });

  it('should create error API response', () => {
    const errorMsg = 'Something went wrong';
    const response = createApiError(errorMsg);

    expect(response.success).toBe(false);
    expect(response.data).toBe(null);
    expect(response.error.message).toBe(errorMsg);
  });
});