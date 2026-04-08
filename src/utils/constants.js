/**
 * 潜水数据常量
 */

// 水流强度选项
export const FLOW_OPTIONS = [
  { value: 'None', label: '无' },
  { value: 'Light', label: '弱' },
  { value: 'Moderate', label: '中' },
  { value: 'Strong', label: '强' },
]

// 数据库值 → 中文显示映射
export const FLOW_LABELS = {
  'None': '无',
  'Light': '弱',
  'Moderate': '中',
  'Strong': '强',
}

// 预设潜水地点
export const LOCATION_SUGGESTIONS = [
  { name: '仙本那', country: 'MY', display: '马来西亚 - 仙本那' },
  { name: '四王群岛', country: 'ID', display: '印尼 - 四王群岛' },
  { name: '妈妈拍丝瓜岛', country: 'PH', display: '菲律宾 - 妈妈拍丝瓜岛' },
  { name: '红海', country: 'EG', display: '埃及 - 红海' },
  { name: '长滩岛', country: 'PH', display: '菲律宾 - 长滩岛' },
  { name: '斯米兰', country: 'TH', display: '泰国 - 斯米兰' },
  { name: '马尔代夫', country: 'MV', display: '马尔代夫' },
  { name: '帕劳', country: 'PW', display: '帕劳' },
  { name: '大堡礁', country: 'AU', display: '澳大利亚 - 大堡礁' },
  { name: '科隆', country: 'PH', display: '菲律宾 - 科隆' },
  { name: '薄荷岛', country: 'PH', display: '菲律宾 - 薄荷岛' },
  { name: '巴厘岛', country: 'ID', display: '印尼 - 巴厘岛' },
  { name: '冲绳', country: 'JP', display: '日本 - 冲绳' },
  { name: '刁曼岛', country: 'MY', display: '马来西亚 - 刁曼岛' },
]

// 预设物种标签
export const PRESET_TAGS = [
  '虎鲸',
  'Manta',
  '鲸鲨',
  '海龟',
  '鲨鱼',
  '杰克鱼风暴',
  '沙丁鱼球',
  '蝠鲼',
  '海豚',
  '沉船',
  '珊瑚',
  'Mola Mola',
  '儒艮',
  '拿破仑鱼',
  '狮子鱼',
]
