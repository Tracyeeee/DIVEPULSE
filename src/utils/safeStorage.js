/**
 * 安全工具函数
 * 提供容错的 localStorage 操作和数据处理
 */

/**
 * 安全解析 JSON
 * @param {string|null} data - 待解析的数据
 * @param {*} fallback - 解析失败时的默认值
 * @returns {*} 解析后的数据或默认值
 */
export const safeJSONParse = (data, fallback = null) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.warn('[safeJSONParse] JSON parse error:', e.message);
    return fallback;
  }
};

/**
 * 安全读取 localStorage
 * @param {string} key - 存储键名
 * @param {*} fallback - 默认值
 * @returns {*} 读取的数据或默认值
 */
export const safeGetItem = (key, fallback = null) => {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return fallback;
    return safeJSONParse(data, fallback);
  } catch (e) {
    console.warn(`[safeGetItem] Error reading key "${key}":`, e.message);
    return fallback;
  }
};

/**
 * 安全写入 localStorage
 * @param {string} key - 存储键名
 * @param {*} value - 待存储的值
 * @returns {boolean} 是否成功
 */
export const safeSetItem = (key, value) => {
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, data);
    return true;
  } catch (e) {
    console.warn(`[safeSetItem] Error writing key "${key}":`, e.message);
    if (e.name === 'QuotaExceededError') {
      console.warn('[safeSetItem] Storage quota exceeded');
    }
    return false;
  }
};

/**
 * 安全删除 localStorage
 * @param {string} key - 存储键名
 */
export const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[safeRemoveItem] Error removing key "${key}":`, e.message);
  }
};

/**
 * 安全数组查找
 * @param {Array} arr - 数组
 * @param {Function} predicate - 查找条件
 * @param {*} fallback - 默认值
 * @returns {*} 查找结果或默认值
 */
export const safeFind = (arr, predicate, fallback = undefined) => {
  if (!Array.isArray(arr)) {
    console.warn('[safeFind] Input is not an array');
    return fallback;
  }
  try {
    return arr.find(predicate);
  } catch (e) {
    console.warn('[safeFind] Error during find:', e.message);
    return fallback;
  }
};

/**
 * 安全数组过滤
 * @param {Array} arr - 数组
 * @param {Function} predicate - 过滤条件
 * @returns {Array} 过滤结果或空数组
 */
export const safeFilter = (arr, predicate) => {
  if (!Array.isArray(arr)) {
    console.warn('[safeFilter] Input is not an array');
    return [];
  }
  try {
    return arr.filter(predicate);
  } catch (e) {
    console.warn('[safeFilter] Error during filter:', e.message);
    return [];
  }
};

/**
 * 安全数组操作（添加唯一元素）
 * @param {Array} arr - 原数组
 * @param {*} item - 待添加元素
 * @returns {Array} 新数组
 */
export const safePushUnique = (arr, item) => {
  if (!Array.isArray(arr)) {
    return [item];
  }
  if (arr.includes(item)) {
    return arr;
  }
  return [...arr, item];
};

/**
 * 安全数组操作（移除元素）
 * @param {Array} arr - 原数组
 * @param {*} item - 待移除元素
 * @returns {Array} 新数组
 */
export const safeRemove = (arr, item) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter(i => i !== item);
};

/**
 * 安全解析数字
 * @param {*} value - 待解析值
 * @param {number} fallback - 默认值
 * @param {Object} options - 选项 {min, max}
 * @returns {number} 解析后的数字
 */
export const safeParseInt = (value, fallback = 0, options = {}) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return fallback;
  
  const { min, max } = options;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
};

/**
 * 安全字符串截断
 * @param {string} str - 字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的字符串
 */
export const safeSlice = (str, maxLength) => {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLength);
};

/**
 * 防抖函数
 * @param {Function} fn - 待执行函数
 * @param {number} delay - 延迟毫秒
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
