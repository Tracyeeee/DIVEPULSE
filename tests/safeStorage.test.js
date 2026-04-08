/**
 * safeStorage 工具函数测试
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { 
  safeJSONParse, 
  safeGetItem, 
  safeSetItem, 
  safeRemoveItem,
  safeFind,
  safeFilter,
  safePushUnique,
  safeRemove,
  safeParseInt,
  safeSlice
} from '../src/utils/safeStorage';

describe('safeJSONParse', () => {
  test('应正确解析有效 JSON', () => {
    expect(safeJSONParse('{"name":"test"}')).toEqual({ name: 'test' });
    expect(safeJSONParse('[1,2,3]')).toEqual([1, 2, 3]);
  });

  test('应返回默认值对于无效 JSON', () => {
    expect(safeJSONParse('{invalid}')).toBe(null);
    expect(safeJSONParse('{invalid}', [])).toEqual([]);
    expect(safeJSONParse(null, 'default')).toBe('default');
  });

  test('应处理空字符串', () => {
    expect(safeJSONParse('')).toBe(null);
    expect(safeJSONParse('  ')).toBe(null);
  });
});

describe('safeGetItem / safeSetItem / safeRemoveItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('应正确设置和获取值', () => {
    safeSetItem('test', { name: 'test' });
    expect(safeGetItem('test')).toEqual({ name: 'test' });
  });

  test('应返回默认值当键不存在', () => {
    expect(safeGetItem('nonexistent')).toBe(null);
    expect(safeGetItem('nonexistent', [])).toEqual([]);
  });

  test('应正确删除键', () => {
    safeSetItem('test', 'value');
    safeRemoveItem('test');
    expect(safeGetItem('test')).toBe(null);
  });

  test('应处理损坏的 JSON 数据', () => {
    localStorage.setItem('corrupted', '{invalid}');
    expect(safeGetItem('corrupted')).toBe(null);
    expect(safeGetItem('corrupted', 'fallback')).toBe('fallback');
  });
});

describe('safeFind / safeFilter', () => {
  const arr = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }];

  test('safeFind 应正确查找', () => {
    expect(safeFind(arr, item => item.id === 2)).toEqual({ id: 2, name: 'b' });
    expect(safeFind(arr, item => item.id === 99)).toBe(undefined);
  });

  test('safeFind 应处理非数组输入', () => {
    expect(safeFind(null, () => true)).toBe(undefined);
    expect(safeFind(undefined, () => true)).toBe(undefined);
  });

  test('safeFilter 应正确过滤', () => {
    expect(safeFilter(arr, item => item.id > 1)).toEqual([
      { id: 2, name: 'b' },
      { id: 3, name: 'c' }
    ]);
  });

  test('safeFilter 应处理非数组输入', () => {
    expect(safeFilter(null, () => true)).toEqual([]);
    expect(safeFilter(undefined, () => true)).toEqual([]);
  });
});

describe('safePushUnique / safeRemove', () => {
  test('safePushUnique 应添加唯一元素', () => {
    expect(safePushUnique([1, 2], 3)).toEqual([1, 2, 3]);
    expect(safePushUnique([1, 2], 2)).toEqual([1, 2]); // 已存在，不添加
  });

  test('safePushUnique 应处理非数组输入', () => {
    expect(safePushUnique(null, 1)).toEqual([1]);
    expect(safePushUnique(undefined, 1)).toEqual([1]);
  });

  test('safeRemove 应移除元素', () => {
    expect(safeRemove([1, 2, 3], 2)).toEqual([1, 3]);
    expect(safeRemove([1, 2, 3], 99)).toEqual([1, 2, 3]); // 不存在
  });
});

describe('safeParseInt', () => {
  test('应正确解析数字', () => {
    expect(safeParseInt('123')).toBe(123);
    expect(safeParseInt(456)).toBe(456);
    expect(safeParseInt('abc')).toBe(0);
    expect(safeParseInt('abc', 10)).toBe(10);
  });

  test('应处理范围限制', () => {
    expect(safeParseInt('100', 0, { min: 0, max: 50 })).toBe(50);
    expect(safeParseInt('-10', 0, { min: 0 })).toBe(0);
  });
});

describe('safeSlice', () => {
  test('应正确截断字符串', () => {
    expect(safeSlice('hello', 3)).toBe('hel');
    expect(safeSlice('hello', 10)).toBe('hello');
  });

  test('应处理非字符串输入', () => {
    expect(safeSlice(null, 5)).toBe('');
    expect(safeSlice(123, 5)).toBe('');
  });
});
