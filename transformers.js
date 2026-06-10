/**
 * ContentCross — 平台风格转换引擎
 * 规则基转换（无 AI API 依赖），后续可升级为 LLM 驱动
 */

const PLATFORM_NAMES = {
  xiaohongshu: '小红书',
  wechat: '公众号',
  douyin: '抖音脚本',
  zhihu: '知乎',
  bilibili: 'B站'
};

const PLATFORM_ICONS = {
  xiaohongshu: '📕',
  wechat: '💚',
  douyin: '🎵',
  zhihu: '💡',
  bilibili: '🟦'
};

const PLATFORM_EMOJIS = {
  xiaohongshu: ['✨', '💕', '🔥', '💯', '🌟', '👋', '😍', '🤩', '💪', '🎉', '👀', '🙌', '😭', '🥰', '❤️'],
  wechat: ['📌', '✅', '💡', '📊', '🎯', '📈', '🔍', '⭐', '📚', '💼'],
  douyin: ['🔥', '💥', '⚡', '🎯', '👆', '😱', '🤯', '💀', '👏', '🚀'],
  zhihu: ['📝', '🔍', '💭', '📊', '🎯', '💡', '📌', '✅'],
  bilibili: ['😂', '🤣', '😅', '💀', '👴', '🤔', '😎', '🔥', '🏆', '🎮']
};

const EMOJI = (p) => PLATFORM_EMOJIS[p][Math.floor(Math.random() * PLATFORM_EMOJIS[p].length)];

/* ==================== 拆解 & 分析原文 ==================== */

function analyzeText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const sentences = text.split(/[。！？!?\n]+/).filter(s => s.trim());
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const hasHashtags = text.includes('#');
  const hasEmoji = /[\u{1F000}-\u{1FFFF}]/u.test(text);

  // 提取可能的话题标签
  const hashtags = text.match(/#[^\s#]+/g) || [];

  return { lines, sentences, paragraphs, hasHashtags, hasEmoji, hashtags };
}

/* ==================== 各平台 → 目标平台 转换函数 ==================== */

// ---------- 来自小红书 ----------
function fromXiaohongshu(text, targetPlatform) {
  const a = analyzeText(text);
  const content = a.paragraphs.length > 0 ? a.paragraphs.join('\n\n') : text;

  switch (targetPlatform) {
    case 'wechat':
      // 小红书 → 公众号: 加正式感，加结构，去口语化
      return `📌 **导读**

${content.replace(/^(.*?)[\n]/, '**$1**\n\n')}

---

**正文**

${content}

---

💡 **总结**
- 以上内容整理自日常分享
- 希望对你有所启发
- 如果觉得有用，欢迎点赞 + 在看 👇

📎 相关阅读 · 持续更新中`;

    case 'douyin':
      // 小红书 → 抖音脚本: 加钩子，短句
      const hook = a.sentences[0] || text.slice(0, 30);
      return `【开头3秒钩子】
${hook}${EMOJI('douyin')}

【正文】
${a.sentences.slice(0, 4).map(s => `▸ ${s.trim()}`).join('\n')}

【结尾引导】
觉得有用的话，点赞收藏关注走一波 ${EMOJI('douyin')}
评论区说说你的看法 👇`;

    case 'zhihu':
      // 小红书 → 知乎: 加结构，去口语
      return `**问题：** 关于「${a.sentences[0]?.slice(0, 40) || '这个话题'}」的一些分享

---

**先说结论：**
${a.sentences.slice(0, 2).join('，')}。

---

**详细展开：**

${a.paragraphs.map((p, i) => `**${i + 1}.** ${p}`).join('\n\n')}

---

**总结：**

以上是我的一些经验，欢迎讨论和补充。${EMOJI('zhihu')}

---
赞同 ${Math.floor(Math.random() * 500 + 50)} · 评论 ${Math.floor(Math.random() * 100 + 10)} · 收藏 ${Math.floor(Math.random() * 200 + 20)}`;

    case 'bilibili':
      // 小红书 → B站
      return `大家好啊，我是你们的 UP 主 ${EMOJI('bilibili')}

今天来跟兄弟们聊聊这个话题：

${content}

【课代表总结】
${a.sentences.slice(0, 3).map((s, i) => `${i+1}. ${s.trim()}`).join('\n')}

如果对你有帮助，一键三连支持一下 ${EMOJI('bilibili')}
有什么想法评论区见！`;

    default:
      return text;
  }
}

// ---------- 来自公众号 ----------
function fromWechat(text, targetPlatform) {
  const a = analyzeText(text);
  // 去掉过于正式的标题和结尾
  const cleaned = text.replace(/^(📌|##|#|\*\*).*$/m, '').replace(/欢迎点赞.*$|如果觉得有用.*$|点击.*$|关注.*$/gm, '').trim();

  switch (targetPlatform) {
    case 'xiaohongshu':
      // 公众号 → 小红书: 化短，加emoji
      return `${cleaned.split('\n\n').slice(0, 5).map(p => {
        const lines = p.split('。').filter(s => s.trim());
        return lines.map(l => `${l.trim()}${EMOJI('xiaohongshu')}`).join('\n');
      }).join('\n\n')}

#经验分享 #实用干货 #每天学一点 #生活技巧`;

    case 'douyin':
      const firstPoint = cleaned.split(/[\n。]/)[0];
      return `【🔥 今天说个干货】${firstPoint}

${cleaned.split('。').filter(s => s.trim().length > 10).slice(0, 5).map(s => `▸ ${s.trim()}`).join('\n')}

👍 学到了就点个赞
💬 评论区留下你的看法
🔔 关注我，每天分享实用干货`;

    case 'zhihu':
      return `**本文约 ${text.length} 字，阅读约需 ${Math.ceil(text.length / 300)} 分钟**

---

${cleaned}

---

**编辑于 ${new Date().toLocaleDateString('zh-CN')} · 著作权归作者所有**`;

    case 'bilibili':
      return `呦，大家好！${EMOJI('bilibili')}

今天水一期干货视频，跟大家分享：

${cleaned.slice(0, 300)}

如果觉得有用，别忘了三连支持一下～
咱们下期再见！${EMOJI('bilibili')}`;

    default:
      return text;
  }
}

// ---------- 来自抖音脚本 ----------
function fromDouyin(text, targetPlatform) {
  const a = analyzeText(text);
  const cleaned = text.replace(/【.*?】|🔥|⚡|🎯|💥/g, '').trim();

  switch (targetPlatform) {
    case 'xiaohongshu':
      return `${cleaned.split(/[。！?]/).filter(s => s.trim().length > 5).slice(0, 8).map(s => `${s.trim()}${EMOJI('xiaohongshu')}`).join('\n')}

#干货分享 #实用技巧 #每天一个小知识 #生活百科`;

    case 'wechat':
      return `📌 **本期要点**

${a.sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}

---

**正文**

${cleaned}

---

如果觉得内容有帮助，欢迎分享给需要的朋友。`;

    case 'zhihu':
      return `**先说是不是，再说为什么。**

${cleaned}

---

**总结：** 以上就是这个问题的核心要点，希望对你有帮助。

---
赞同 ${Math.floor(Math.random() * 1000 + 100)} · 评论 ${Math.floor(Math.random() * 200 + 30)}`;

    case 'bilibili':
      return `兄弟们好！${EMOJI('bilibili')}

今天跟你们唠个有意思的：

${cleaned.slice(0, 150)}...

觉得有用的话，点赞投币收藏，谢谢爸爸们！${EMOJI('bilibili')}`;

    default:
      return text;
  }
}

// ---------- 来自知乎 ----------
function fromZhihu(text, targetPlatform) {
  const a = analyzeText(text);
  const cleaned = text.replace(/^赞同.*$|^编辑于.*$|^著作权.*$|^---+/gm, '').trim();
  const mainBody = cleaned.replace(/^#.*$|^\*\*.*?\*\*/m, '').trim();

  switch (targetPlatform) {
    case 'xiaohongshu':
      return `${mainBody.split('。').filter(s => s.trim().length > 8).slice(0, 8).map(s => `${s.trim()}${EMOJI('xiaohongshu')}`).join('\n')}

#知识分享 #干货 #经验总结 #日常分享`;

    case 'wechat':
      return `📚 **深度阅读**

${mainBody}

---

📎 参考资料 · 整理自个人经验`;

    case 'douyin':
      const zhHook = a.sentences[0] || mainBody.slice(0, 20);
      return `【3秒看结论】${zhHook}

${mainBody.split('。').filter(s => s.trim().length > 10).slice(0, 5).map(s => `▸ ${s.trim()}`).join('\n')}

💡 关注我，每天涨知识`;

    case 'bilibili':
      return `大家好啊 ${EMOJI('bilibili')}

今天看到个有意思的问题，来分享一下我的看法：

${mainBody.slice(0, 200)}...

觉得说得对的扣1，有不同意见的评论区见！${EMOJI('bilibili')}`;

    default:
      return text;
  }
}

// ---------- 来自B站 ----------
function fromBilibili(text, targetPlatform) {
  const a = analyzeText(text);
  const cleaned = text.replace(/^大家好啊|^兄弟们|^呦|^大家好|一键三连|三连支持|课代表/gi, '').trim();

  switch (targetPlatform) {
    case 'xiaohongshu':
      return `${cleaned.split(/[。！?]/).filter(s => s.trim().length > 5).slice(0, 8).map(s => `${s.trim()}${EMOJI('xiaohongshu')}`).join('\n')}

#日常分享 #生活记录 #实用推荐`;

    case 'wechat':
      return `📌 **本期分享**

${cleaned}

---

📎 以上是本篇全部内容，感谢阅读。`;

    case 'douyin':
      return `【本期看点】${a.sentences[0] || cleaned.slice(0, 20)}

${cleaned.split('。').filter(s => s.trim().length > 8).slice(0, 5).map(s => `▸ ${s.trim()}`).join('\n')}

👆 关注我，下期更精彩`;

    case 'zhihu':
      return `**分享一下我的看法：**

${cleaned}

---

**补充说明：** 以上仅代表个人观点，欢迎理性讨论。`;

    default:
      return text;
  }
}

/* ==================== 主路由 ==================== */

function transform(text, from, to) {
  if (!text.trim()) return '';

  const router = {
    xiaohongshu: fromXiaohongshu,
    wechat: fromWechat,
    douyin: fromDouyin,
    zhihu: fromZhihu,
    bilibili: fromBilibili
  };

  // 同一平台 → 格式化优化
  if (from === to) {
    return `【原文已按 ${PLATFORM_NAMES[from]} 风格优化】\n\n${text.trim()}`;
  }

  const fn = router[from];
  if (!fn) return text;

  try {
    return fn(text, to);
  } catch (e) {
    return `[转换出错] ${e.message}\n\n---\n${text}`;
  }
}
