import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollProgress } from './useScrollProgress';

describe('useScrollProgress', () => {
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
        // Mock scroll and height properties
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1500, writable: true });
    });

    afterEach(() => {
        window.innerHeight = originalInnerHeight;
        vi.clearAllMocks();
    });

    it('should initialize with 0 progress', () => {
        const { result } = renderHook(() => useScrollProgress());
        expect(result.current.scrollProgress).toBe(0);
    });

    it('should update progress on scroll', () => {
        const { result } = renderHook(() => useScrollProgress());

        act(() => {
            // Scroll to middle (1500 - 500 = 1000 max scroll, 500 scrollY = 0.5)
            window.scrollY = 500;
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.scrollProgress).toBe(0.5);

        act(() => {
            // Scroll to bottom
            window.scrollY = 1000;
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.scrollProgress).toBe(1);
    });

    it('should handle zero scrollable height', () => {
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 500, writable: true });
        const { result } = renderHook(() => useScrollProgress());

        act(() => {
            window.scrollY = 100;
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.scrollProgress).toBe(0);
    });
});
