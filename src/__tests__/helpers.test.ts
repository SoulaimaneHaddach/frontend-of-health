import { formatRating } from '../utils/helpers';

describe('Helper Functions', () => {
  describe('formatRating', () => {
    it('formats rating to one decimal place', () => {
      expect(formatRating(4.8)).toBe('4.8');
      expect(formatRating(5)).toBe('5.0');
      expect(formatRating(3.14159)).toBe('3.1');
    });

    it('returns em dash for undefined rating', () => {
      expect(formatRating(undefined)).toBe('—');
      expect(formatRating()).toBe('—');
    });

    it('handles zero rating', () => {
      expect(formatRating(0)).toBe('0.0');
    });

    it('handles negative ratings', () => {
      expect(formatRating(-1.5)).toBe('-1.5');
    });

    it('handles very small ratings', () => {
      expect(formatRating(0.1)).toBe('0.1');
      expect(formatRating(0.01)).toBe('0.0');
    });
  });
});
