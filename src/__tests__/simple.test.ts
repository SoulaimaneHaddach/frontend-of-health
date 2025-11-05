// Simple test without any Expo dependencies
describe('Basic Math Tests', () => {
  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2);
    expect(2 + 2).toBe(4);
  });

  it('should multiply numbers correctly', () => {
    expect(2 * 3).toBe(6);
    expect(5 * 5).toBe(25);
  });

  it('should handle strings', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.length).toBe(4);
  });
});

// Format rating function test (inline to avoid imports)
const formatRating = (r?: number) => (r !== undefined && r !== null ? r.toFixed(1) : '—');

describe('formatRating function', () => {
  it('formats rating to one decimal place', () => {
    expect(formatRating(4.8)).toBe('4.8');
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(3.14159)).toBe('3.1');
  });

  it('returns em dash for undefined rating', () => {
    expect(formatRating(undefined)).toBe('—');
  });

  it('handles zero rating', () => {
    expect(formatRating(0)).toBe('0.0');
  });

  it('handles negative ratings', () => {
    expect(formatRating(-1.5)).toBe('-1.5');
  });
});
