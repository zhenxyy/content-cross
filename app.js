(function() {
  'use strict';

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const sourceText = $('sourceText');
  const sourcePlatform = $('sourcePlatform');
  const transformBtn = $('transformBtn');
  const resultsSection = $('resultsSection');
  const resultsContainer = $('resultsContainer');
  const historyContainer = $('historyContainer');
  const charCount = $('charCount');
  const clearBtn = $('clearBtn');
  const clearHistoryBtn = $('clearHistoryBtn');
  const collapseAllBtn = $('collapseAllBtn');
  const targetSelectors = $('targetSelectors');
  const themeToggle = $('themeToggle');
  const templateBtn = $('templateBtn');
  const selectAllTargets = $('selectAllTargets');
  const deselectAllTargets = $('deselectAllTargets');
  const apiKeyInput = $('apiKeyInput');
  const saveKeyBtn = $('saveKeyBtn');
  const toggleKeyVis = $('toggleKeyVis');
  const engineToggle = $('engineToggle');
  const engineLabel = $('engineLabel');
  const modelSelect = $('modelSelect');

  /* ========== 字数统计 ========== */
  sourceText.addEventListener('input', () => {
    const len = sourceText.value.length;
    charCount.textContent = len + ' 字';
  });

  /* ========== 暗色模式 ========== */
  function initTheme() {
    const saved = localStorage.getItem('cc_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️ 亮色';
    }
  }
  initTheme();

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('cc_theme', 'light');
      themeToggle.textContent = '🌙 夜间';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cc_theme', 'dark');
      themeToggle.textContent = '☀️ 亮色';
    }
  });

  /* ========== 示例模板 ========== */
  templateBtn.addEventListener('click', () => {
    const platform = sourcePlatform.value;
    const template = TEMPLATES[platform];
    if (template) {
      sourceText.value = template;
      charCount.textContent = template.length + ' 字';
      sourceText.focus();
    }
  });

  /* ========== 全选/取消目标平台 ========== */
  selectAllTargets.addEventListener('click', () => {
    targetSelectors.querySelectorAll('input').forEach(cb => cb.checked = true);
  });
  deselectAllTargets.addEventListener('click', () => {
    targetSelectors.querySelectorAll('input').forEach(cb => cb.checked = false);
  });

  /* ========== API Key 管理 ========== */
  function loadApiKey() {
    const saved = localStorage.getItem('cc_deepseek_key');
    if (saved) {
      apiKeyInput.value = saved;
    }
  }
  loadApiKey();

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('cc_deepseek_key', key);
      showToast('✅ API Key 已保存（本地存储）');
    } else {
      localStorage.removeItem('cc_deepseek_key');
      showToast('已清除 API Key');
    }
  });

  toggleKeyVis.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleKeyVis.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleKeyVis.textContent = '👁️';
    }
  });

  /* ========== 引擎模式切换 ========== */
  engineToggle.addEventListener('change', () => {
    engineLabel.textContent = engineToggle.checked ? '🤖 AI 模式' : '📐 规则模式';
  });

  /* ========== 清空输入 ========== */
  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    charCount.textContent = '0 字';
    sourceText.focus();
  });

  /* ========== 获取选中的目标平台 ========== */
  function getSelectedTargets() {
    return Array.from(targetSelectors.querySelectorAll('input:checked')).map(el => el.value);
  }

  /* ========== 转换主逻辑 ========== */
  function runTransform() {
    const text = sourceText.value.trim();
    if (!text) {
      sourceText.focus();
      sourceText.style.border = '2px solid #ff6b6b';
      setTimeout(() => sourceText.style.border = 'none', 800);
      return;
    }

    const from = sourcePlatform.value;
    const targets = getSelectedTargets();
    if (targets.length === 0) {
      alert('请至少选择一个目标平台');
      return;
    }

    // 检查 AI 模式
    const useAI = engineToggle.checked;
    const apiKey = apiKeyInput.value.trim();

    if (useAI && !apiKey) {
      if (!confirm('AI 模式需要 DeepSeek API Key，未填写时将使用规则模式。是否继续？')) {
        transformBtn.disabled = false;
        transformBtn.innerHTML = '⚡ 一键转换';
        return;
      }
    }

    // 加载状态
    transformBtn.disabled = true;
    transformBtn.innerHTML = '<span class="spinner"></span> 转换中…';

    if (useAI && apiKey) {
      // AI 模式
      const model = modelSelect.value;
      let completed = 0;
      let results = [];

      targets.forEach(async (to) => {
        try {
          const output = await aiTransform(text, from, to, apiKey, model);
          results.push({ from, to, output });
        } catch (e) {
          results.push({ from, to, output: `[AI 改写失败，使用规则转换]\n${e.message}\n\n---\n${transform(text, from, to)}` });
        }
        completed++;
        if (completed === targets.length) {
          finishTransform(results, text);
        }
      });
    } else {
      // 规则模式
      let results = [];
      targets.forEach(to => {
        const output = transform(text, from, to);
        results.push({ from, to, output });
      });
      setTimeout(() => finishTransform(results, text), 200);
    }
  }

  transformBtn.addEventListener('click', runTransform);

  /* ========== 转换完成处理 ========== */
  function finishTransform(results, text) {
    // 保存历史
    const from = sourcePlatform.value;
    const targets = getSelectedTargets();
    saveToHistory(text, from, targets);

    // 渲染结果
    renderResults(results, text);

    // 恢复按钮
    transformBtn.disabled = false;
    transformBtn.innerHTML = '⚡ 一键转换';
  }

  // Ctrl+Enter 快捷键
  sourceText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runTransform();
    }
  });

  /* ========== 渲染结果 ========== */
  function renderResults(results, originalText) {
    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = '';

    // 原文预览
    const originalDiv = document.createElement('div');
    originalDiv.className = 'result-item';
    originalDiv.innerHTML = `
      <div class="result-header" data-target="original">
        <span class="platform-tag">📄 原文预览</span>
        <span style="font-size:12px;color:#9ca3af">${originalText.length} 字</span>
      </div>
      <div class="result-body">${escapeHtml(originalText.slice(0, 200))}${originalText.length > 200 ? '……' : ''}</div>
    `;
    resultsContainer.appendChild(originalDiv);

    // 各平台结果
    results.forEach((r, idx) => {
      const platformName = PLATFORM_NAMES[r.to];
      const icon = PLATFORM_ICONS[r.to];
      const item = document.createElement('div');
      item.className = 'result-item';

      const header = document.createElement('div');
      header.className = 'result-header';
      header.dataset.target = `result-${idx}`;
      header.innerHTML = `
        <span class="platform-tag">
          <span class="platform-badge ${r.to}">${icon} ${platformName}</span>
          <span style="font-size:12px;color:#9ca3af">${r.output.length} 字</span>
        </span>
        <span class="result-actions">
          <button class="btn btn-sm copy-btn" data-text="${escapeAttr(r.output)}">📋 复制</button>
          <button class="btn btn-sm queue-add-btn" data-platform="${r.to}" data-content="${escapeAttr(r.output)}">📋 加入清单</button>
          <button class="btn btn-sm toggle-btn" data-target="result-${idx}">${idx === 0 ? '折叠' : '展开'}</button>
        </span>
      `;

      const body = document.createElement('div');
      body.className = `result-body${idx !== 0 ? ' collapsed' : ''}`;
      body.id = `result-${idx}`;
      body.textContent = r.output;

      item.appendChild(header);
      item.appendChild(body);
      resultsContainer.appendChild(item);
    });

    // 滚动到结果区
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 绑定事件（含加入清单按钮）
    bindResultEvents();
    bindQueueAddButtons();
    updateCollapseAllBtn();
  }

  /* ========== 结果区交互 ========== */
  function bindResultEvents() {
    // 折叠/展开
    resultsContainer.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const targetId = this.dataset.target;
        const body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('collapsed');
          this.textContent = body.classList.contains('collapsed') ? '展开' : '折叠';
        }
        updateCollapseAllBtn();
      });
    });

    // 点击 header 切换
    resultsContainer.querySelectorAll('.result-header').forEach(header => {
      header.addEventListener('click', function(e) {
        if (e.target.closest('.result-actions')) return;
        const targetId = this.dataset.target;
        if (targetId === 'original') return;
        const body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('collapsed');
          const btn = this.querySelector('.toggle-btn');
          if (btn) btn.textContent = body.classList.contains('collapsed') ? '展开' : '折叠';
        }
        updateCollapseAllBtn();
      });
    });

    // 复制
    resultsContainer.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const text = this.dataset.text;
        navigator.clipboard.writeText(text).then(() => {
          showToast('✅ 已复制到剪贴板');
        }).catch(() => {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast('✅ 已复制到剪贴板');
        });
      });
    });
  }

  function updateCollapseAllBtn() {
    const allBodies = resultsContainer.querySelectorAll('.result-body:not(#original-preview)');
    const collapsed = Array.from(allBodies).filter(b => b.classList.contains('collapsed'));
    collapseAllBtn.textContent = collapsed.length === allBodies.length - 1 ? '全部展开' : '全部折叠';
  }

  collapseAllBtn.addEventListener('click', function() {
    const isCollapse = this.textContent === '全部折叠';
    resultsContainer.querySelectorAll('.result-body').forEach(body => {
      if (body.id && body.id.startsWith('result-')) {
        body.classList.toggle('collapsed', !isCollapse);
        const header = body.parentElement.querySelector('.result-header');
        if (header) {
          const btn = header.querySelector('.toggle-btn');
          if (btn) btn.textContent = isCollapse ? '折叠' : '展开';
        }
      }
    });
    this.textContent = isCollapse ? '全部展开' : '全部折叠';
  });

  /* ========== Toast 提示 ========== */
  let toastTimer = null;

  function showToast(msg) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* ========== 历史记录 ========== */
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('cc_history') || '[]');
    } catch { return []; }
  }

  function saveToHistory(text, from, targets) {
    const history = getHistory();
    history.unshift({
      id: Date.now(),
      text: text.slice(0, 80),
      from,
      targets,
      ts: new Date().toLocaleString('zh-CN')
    });
    if (history.length > 20) history.length = 20;
    localStorage.setItem('cc_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    if (history.length === 0) {
      historyContainer.innerHTML = '<p class="empty-hint">还没有转换记录</p>';
      return;
    }
    historyContainer.innerHTML = history.map(h => `
      <div class="history-item" data-id="${h.id}">
        <span class="h-from">${PLATFORM_ICONS[h.from] || '📄'}</span>
        <span class="h-preview">${escapeHtml(h.text)}${h.text.length >= 80 ? '…' : ''}</span>
        <span class="h-meta">→ ${h.targets.map(t => PLATFORM_NAMES[t]).join('/')}</span>
        <span class="h-meta" style="margin-left:8px">${h.ts}</span>
      </div>
    `).join('');

    // 点击历史项：填充原文
    historyContainer.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        const history = getHistory();
        const item = history.find(h => h.id === id);
        if (item) {
          // 从存储中找回完整原文（当前只存了摘要）
          // 完整内容存在 localStorage 中
          const full = localStorage.getItem('cc_full_' + id) || item.text;
          sourceText.value = full;
          sourcePlatform.value = item.from;
          charCount.textContent = full.length + ' 字';
          sourceText.focus();
          // 勾选对应的目标平台
          targetSelectors.querySelectorAll('input').forEach(cb => {
            cb.checked = item.targets.includes(cb.value);
          });
          resultsSection.style.display = 'none';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('确定清空所有历史记录？')) {
      localStorage.removeItem('cc_history');
      // 清理完整内容
      const keys = Object.keys(localStorage);
      keys.filter(k => k.startsWith('cc_full_')).forEach(k => localStorage.removeItem(k));
      renderHistory();
    }
  });

  // 存储完整原文
  function saveFullText(id, text) {
    try {
      localStorage.setItem('cc_full_' + id, text);
    } catch {}
  }

  // 覆盖 saveToHistory 加入完整存储
  const _origSave = saveToHistory;
  saveToHistory = function(text, from, targets) {
    const history = getHistory();
    const id = Date.now();
    history.unshift({ id, text: text.slice(0, 80), from, targets, ts: new Date().toLocaleString('zh-CN') });
    if (history.length > 20) history.length = 20;
    localStorage.setItem('cc_history', JSON.stringify(history));
    saveFullText(id, text);
    renderHistory();
  };

  /* ========== 工具函数 ========== */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ========== 发布清单系统 ========== */
  function getQueue() {
    try { return JSON.parse(localStorage.getItem('cc_queue') || '[]'); }
    catch { return []; }
  }

  function saveQueue(q) {
    localStorage.setItem('cc_queue', JSON.stringify(q));
  }

  function generateTitle(content) {
    const firstLine = content.split('\n')[0].replace(/^[#\s*【\]]+/, '').trim();
    return firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine || '未命名内容';
  }

  function addToQueue(content, platform) {
    const q = getQueue();
    q.unshift({
      id: Date.now(),
      title: generateTitle(content),
      content: content,
      platform: platform,
      status: 'pending',
      createdAt: new Date().toISOString(),
      publishedAt: null,
      notes: ''
    });
    saveQueue(q);
    renderQueue();
    showToast('✅ 已加入发布日历');
  }

  function markPublished(id) {
    const q = getQueue();
    const item = q.find(i => i.id === id);
    if (item) {
      item.status = 'published';
      item.publishedAt = new Date().toISOString();
      saveQueue(q);
      renderQueue();
      showToast('✅ 标记为已发布');
    }
  }

  function markPending(id) {
    const q = getQueue();
    const item = q.find(i => i.id === id);
    if (item) {
      item.status = 'pending';
      item.publishedAt = null;
      saveQueue(q);
      renderQueue();
    }
  }

  function deleteQueueItem(id) {
    if (!confirm('确定删除这个条目？')) return;
    const q = getQueue().filter(i => i.id !== id);
    saveQueue(q);
    renderQueue();
  }

  function updateQueueNotes(id, notes) {
    const q = getQueue();
    const item = q.find(i => i.id === id);
    if (item) {
      item.notes = notes;
      saveQueue(q);
    }
  }

  let queueFilter = 'pending';

  function renderQueue(filter) {
    queueFilter = filter || queueFilter;
    const container = $('queueContainer');
    const stats = $('queueStats');
    const q = getQueue();

    const pendingCount = q.filter(i => i.status === 'pending').length;
    const pubCount = q.filter(i => i.status === 'published').length;
    stats.textContent = `待发布 ${pendingCount} · 已发布 ${pubCount}`;

    if (q.length === 0) {
      container.innerHTML = '<p class="queue-empty">还没有待发布的内容。转换结果出来后，点「📋 加入清单」保存到这里。</p>';
      return;
    }

    let html = `
      <div class="queue-tabs">
        <button class="queue-tab ${queueFilter === 'pending' ? 'active' : ''}" data-filter="pending">待发布 (${pendingCount})</button>
        <button class="queue-tab ${queueFilter === 'published' ? 'active' : ''}" data-filter="published">已发布 (${pubCount})</button>
        <button class="queue-tab ${queueFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${q.length})</button>
      </div>
    `;

    const items = queueFilter === 'all' ? q : q.filter(i => i.status === queueFilter);

    if (items.length === 0) {
      html += `<p class="queue-empty">${queueFilter === 'pending' ? '🎉 全部已发布！' : '暂无已发布内容'}</p>`;
      container.innerHTML = html;
      bindQueueTabs();
      return;
    }

    items.forEach(item => {
      const platformName = PLATFORM_NAMES[item.platform] || item.platform;
      const icon = PLATFORM_ICONS[item.platform] || '📄';
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN');
      html += `
        <div class="queue-item" data-id="${item.id}">
          <span class="qi-status ${item.status}"></span>
          <div class="qi-body">
            <div class="qi-title" data-id="${item.id}">${escapeHtml(item.title)}</div>
            <div class="qi-meta">
              <span>${icon} ${platformName}</span>
              <span>${date}</span>
              ${item.publishedAt ? '<span>✅ ' + new Date(item.publishedAt).toLocaleDateString('zh-CN') + '</span>' : ''}
            </div>
            <div class="qi-notes" data-id="${item.id}" contenteditable="true" data-placeholder="添加备注（可选）">${escapeHtml(item.notes || '')}</div>
          </div>
          <div class="qi-actions">
            ${item.status === 'pending'
              ? `<button class="btn btn-xs btn-publish" data-id="${item.id}">✅ 发布</button>`
              : `<button class="btn btn-xs btn-unpublish" data-id="${item.id}">↩️ 撤回</button>`
            }
            <button class="btn btn-xs btn-delete" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    bindQueueTabs();
    bindQueueEvents();
  }

  function bindQueueTabs() {
    $('queueContainer').querySelectorAll('.queue-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        renderQueue(this.dataset.filter);
      });
    });
  }

  function bindQueueEvents() {
    // Publish
    $('queueContainer').querySelectorAll('.btn-publish').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        markPublished(parseInt(this.dataset.id));
      });
    });

    // Unpublish
    $('queueContainer').querySelectorAll('.btn-unpublish').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        markPending(parseInt(this.dataset.id));
      });
    });

    // Delete
    $('queueContainer').querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteQueueItem(parseInt(this.dataset.id));
      });
    });

    // View detail
    $('queueContainer').querySelectorAll('.qi-title').forEach(el => {
      el.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        showQueueDetail(id);
      });
    });

    // Edit notes
    $('queueContainer').querySelectorAll('.qi-notes').forEach(el => {
      el.addEventListener('blur', function() {
        const id = parseInt(this.dataset.id);
        updateQueueNotes(id, this.textContent.trim());
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
      });
    });
  }

  function bindQueueAddButtons() {
    document.querySelectorAll('.queue-add-btn').forEach(btn => {
      // Remove old listener by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', function() {
        const content = this.dataset.content;
        const platform = this.dataset.platform;
        addToQueue(content, platform);
      });
    });
  }

  function showQueueDetail(id) {
    const q = getQueue();
    const item = q.find(i => i.id === id);
    if (!item) return;

    const overlay = document.createElement('div');
    overlay.className = 'queue-detail-overlay';
    overlay.innerHTML = `
      <div class="queue-detail-modal">
        <div class="qdm-header">
          <h3>${escapeHtml(item.title)}</h3>
          <button class="btn btn-sm qdm-close">✕</button>
        </div>
        <div class="qdm-body">${escapeHtml(item.content)}</div>
        <div class="qdm-footer">
          <button class="btn btn-sm copy-btn" data-text="${escapeAttr(item.content)}">📋 复制内容</button>
          <button class="btn btn-sm qdm-close">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.qdm-close').forEach(el => {
      el.addEventListener('click', () => overlay.remove());
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === this) overlay.remove();
    });

    // Copy inside modal
    overlay.querySelector('.copy-btn')?.addEventListener('click', function(e) {
      e.stopPropagation();
      const text = this.dataset.text;
      navigator.clipboard.writeText(text).then(() => showToast('✅ 已复制'));
    });
  }

  /* ========== 初始化 ========== */
  renderHistory();
  renderQueue();
  sourceText.focus();

})();
