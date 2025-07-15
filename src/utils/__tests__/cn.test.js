import { describe, it, expect } from 'vitest';
import { cn } from '../cn.js';

describe('cn utility function', () => {
  describe('Basic functionality', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle single class name', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should filter out falsy values', () => {
      expect(cn('class1', null, 'class2', undefined, 'class3', false, '')).toBe('class1 class2 class3');
    });
  });

  describe('Conditional classes', () => {
    it('should handle conditional classes with objects', () => {
      expect(cn({
        'active': true,
        'disabled': false,
        'highlighted': true
      })).toBe('active highlighted');
    });

    it('should handle mixed string and object inputs', () => {
      expect(cn('base-class', {
        'active': true,
        'disabled': false
      }, 'another-class')).toBe('base-class active another-class');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']], 'class4')).toBe('class1 class2 class3 class4');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complex mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        {
          'conditional-true': true,
          'conditional-false': false
        },
        null,
        undefined,
        'final'
      );
      expect(result).toBe('base array1 array2 conditional-true final');
    });

    it('should handle dynamic class generation', () => {
      const isActive = true;
      const isDisabled = false;
      const variant = 'primary';
      
      const result = cn(
        'btn',
        `btn-${variant}`,
        {
          'btn-active': isActive,
          'btn-disabled': isDisabled
        }
      );
      
      expect(result).toBe('btn btn-primary btn-active');
    });

    it('should handle Tailwind CSS classes', () => {
      const result = cn(
        'px-4 py-2',
        'bg-blue-500 hover:bg-blue-600',
        {
          'text-white': true,
          'opacity-50': false
        }
      );
      
      expect(result).toBe('px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white');
    });
  });

  describe('Edge cases', () => {
    it('should handle duplicate class names', () => {
      expect(cn('class1', 'class2', 'class1')).toBe('class1 class2 class1');
    });

    it('should handle whitespace in class names', () => {
      expect(cn('  class1  ', '  class2  ')).toBe('class1 class2');
    });

    it('should handle numbers as class names', () => {
      expect(cn('class', 123, 'another')).toBe('class 123 another');
    });

    it('should handle empty strings and whitespace', () => {
      expect(cn('', '   ', 'valid-class', '')).toBe('valid-class');
    });
  });

  describe('Performance considerations', () => {
    it('should handle large number of classes efficiently', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      
      expect(result.split(' ')).toHaveLength(100);
      expect(result).toContain('class-0');
      expect(result).toContain('class-99');
    });

    it('should handle deeply nested structures', () => {
      const deepArray = [
        'level1',
        ['level2', ['level3', ['level4', 'level5']]]
      ];
      
      const result = cn(deepArray);
      expect(result).toBe('level1 level2 level3 level4 level5');
    });
  });

  describe('Type safety and validation', () => {
    it('should handle boolean values correctly', () => {
      expect(cn(true && 'truthy-class', false && 'falsy-class')).toBe('truthy-class');
    });

    it('should handle function results', () => {
      const getClass = (condition) => condition ? 'dynamic-class' : null;
      expect(cn('base', getClass(true), getClass(false))).toBe('base dynamic-class');
    });

    it('should handle template literals', () => {
      const variant = 'primary';
      const size = 'lg';
      expect(cn(`btn-${variant}`, `size-${size}`)).toBe('btn-primary size-lg');
    });
  });
});
