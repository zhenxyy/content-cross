/**
 * ContentCross — AI 引擎（DeepSeek API）
 * 替换规则转换为大模型驱动的智能改写
 */

const DEEPSEEK_BASE = 'https://api.deepseek.com';

// 各平台改写系统提示词
function getSystemPrompt(from, to) {
  const fromName = PLATFORM_NAMES[from];
  const toName = PLATFORM_NAMES[to];

  const styleGuides = {
    xiaohongshu: `你是资深小红书内容专家。
改写要求：
- 短段落（每段 1-3 句）
- 大量使用 emoji，每段至少 1 个
- 口语化、亲切感（"姐妹们"、"谁懂啊"）
- 第一人称分享体验
- 结尾加 3-5 个 #标签
- 整体活泼、种草感强`,
    wechat: `你是资深公众号主笔。
改写要求：
- 结构清晰，可以用 ## 分节
- 正式但易懂的语言
- 适当使用引用、加粗强调
- 段落较长，逻辑连贯
- 结尾可以加引导语（点赞/在看/关注）
- 少用 emoji，保持专业感`,
    douyin: `你是爆款抖音脚本编剧。
改写要求：
- 【开头 3 秒钩子】必须吸睛
- 短句、口语化，像在说话
- 适当用 🔥 ⚡ 💥 等视觉符号
- 每句话独立成行，节奏快
- 结尾加互动引导（点赞/评论/关注）
- 整体要有"听完就想行动"的冲动`,
    zhihu: `你是知乎高赞答主。
改写要求：
- 开头直接给结论
- 逻辑严密，段落分明
- 可以用 **加粗** 强调重点
- 数据/案例支撑观点
- 结尾带总结
- 风格理性、可信`,
    bilibili: `你是 B站 知名 UP 主。
改写要求：
- 开场打招呼（"大家好啊"）
- 口语化、轻松、有梗
- 适当用 🤣 😅 💀 等弹幕文化 emoji
- 可以自嘲、玩梗
- 结尾求三连
- 像在跟朋友聊天`
  };

  // 同平台优化
  if (from === to) {
    return `你是${toName}内容优化专家。请优化以下内容，保持${toName}平台风格，提升可读性和传播力。不要改变核心信息和整体长度。`;
  }

  return `你是一位专业的跨平台内容改写专家。
请将以下${fromName}风格的内容，改写成适合发布在${toName}上的版本。

${styleGuides[to] || '请保持原文核心信息，用适合该平台的风格改写。'}

要求：
1. 保留原文的核心信息和观点
2. 不要添加原文没有的事实性内容
3. 输出纯文字，不要用代码块包裹
4. 长度与原文明细相当或略短（除非原文太短）`;
}

/**
 * 调用 DeepSeek API 进行改写
 * @param {string} text - 原文
 * @param {string} from - 来源平台 key
 * @param {string} to - 目标平台 key
 * @param {string} apiKey - DeepSeek API Key
 * @param {string} model - 模型名
 * @returns {Promise<string>} 改写后的内容
 */
async function aiTransform(text, from, to, apiKey, model = 'deepseek-chat') {
  const systemPrompt = getSystemPrompt(from, to);

  const response = await fetch(DEEPSEEK_BASE + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `原文：\n\n${text}` }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 错误 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
