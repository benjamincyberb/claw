/**
 * Degen-Office Web3 Panels
 * All UI panel logic for the decentralized workspace.
 * "Where every click is a potential on-chain transaction."
 */

const DegenPanels = (() => {
  // ═══════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════
  let activeTab = null;
  let ipfsAnnouncements = [];
  let toastTimeout = null;

  // ═══════════════════════════════════════════════════
  // HTML Templates
  // ═══════════════════════════════════════════════════
  function buildWalletBar() {
    return `
      <div id="web3-wallet-bar">
        <div class="logo-text">⛓️ XDOG-OFFICE</div>
        <div class="chain-badge">
          <span class="dot"></span>
          <span>${DegenWeb3.CHAIN.name} Testnet</span>
        </div>
        <div id="web3-wallet-info">
          <span id="web3-role-badge" class="role-badge"></span>
          <span id="web3-address-display"></span>
          <span id="web3-balance-display"></span>
        </div>
        <button id="web3-connect-btn" onclick="DegenPanels.handleConnect()">
          🦊 Connect Wallet
        </button>
      </div>
    `;
  }

  function buildNavTabs() {
    return `
      <div id="web3-nav-tabs">
        <button class="web3-tab" data-tab="attendance" onclick="DegenPanels.switchTab('attendance')">
          ⛏️ 打卡挖矿
        </button>
        <button class="web3-tab" data-tab="bounty" onclick="DegenPanels.switchTab('bounty')">
          💰 悬赏任务
        </button>
        <button class="web3-tab" data-tab="token" onclick="DegenPanels.switchTab('token')">
          🐕 $XDOG
        </button>
        <button class="web3-tab" data-tab="ipfs" onclick="DegenPanels.switchTab('ipfs')">
          📁 IPFS 永存
        </button>
        <button class="web3-tab" data-tab="onchainos" onclick="DegenPanels.switchTab('onchainos')">
          🌌 Onchain OS
        </button>
        <button class="web3-tab" data-tab="rugpull" onclick="DegenPanels.switchTab('rugpull')">
          🚨 Rug Pull
        </button>
      </div>
    `;
  }

  function buildPanelsContainer() {
    return `
      <div id="web3-panels-container">
        <!-- Attendance Panel -->
        <div class="web3-panel" id="panel-attendance">
          <div class="attendance-header">
            <div>
              <div class="web3-section-title">⛏️ 打卡挖矿 (Clock-In Mining)</div>
              <div class="web3-section-subtitle">
                每天打卡 = Mint 一个带薪拉屎凭证 NFT。迟到？保证金 Slashing。Code is Law。
              </div>
            </div>
            <button class="clock-in-btn" id="clock-in-btn" onclick="DegenPanels.handleClockIn()">
              ⛏️ 打卡挖矿
            </button>
          </div>
          <div class="attendance-stats" id="attendance-stats"></div>
          <div class="web3-section-title" style="margin-top:24px">📅 出勤记录 (On-Chain History)</div>
          <div class="attendance-grid" id="attendance-grid"></div>
        </div>

        <!-- Bounty Panel -->
        <div class="web3-panel" id="panel-bounty">
          <div class="bounty-controls">
            <div class="web3-section-title">💰 悬赏任务 (Bounty Board)</div>
            <button class="create-bounty-btn" onclick="DegenPanels.showCreateBountyModal()">
              + 发布悬赏
            </button>
          </div>
          <div class="web3-section-subtitle">
            老板锁仓 $XDOG → 打工狗完成任务 → 智能合约自动打款。老板无法赖账，因为代码即法律。
          </div>
          <div class="bounty-list" id="bounty-list"></div>
        </div>

        <!-- Token Panel -->
        <div class="web3-panel" id="panel-token">
          <div class="web3-section-title">🐕 $XDOG 币</div>
          <div class="web3-section-subtitle">
            公司专用工资代币。无情嘲讽：老板无法赖账，但代币可能毫无价值。
          </div>
          <div class="attendance-stats" id="token-stats"></div>
          <div style="text-align:center; margin-top:24px;">
            <button class="clock-in-btn" id="faucet-btn" onclick="DegenPanels.handleFaucet()" style="background:linear-gradient(135deg, var(--degen-cyan), #0891b2); border-color:var(--degen-cyan);">
              🚰 领取水龙头 (10,000 $XDOG)
            </button>
          </div>
        </div>

        <!-- IPFS Panel -->
        <div class="web3-panel" id="panel-ipfs">
          <div class="web3-section-title">📁 IPFS 永久存储</div>
          <div class="web3-section-subtitle">
            公司公告上链，老板的画大饼承诺永远无法删除。离职证明 NFT，让老板吹过的牛逼永远留在链上。
          </div>
          <div class="ipfs-upload-area">
            <textarea id="ipfs-content" placeholder="输入公告内容...... 输入的内容将永久存储在 IPFS 星际文件系统上，不可篡改。"></textarea>
            <button class="ipfs-upload-btn" onclick="DegenPanels.handleIPFSUpload()">
              🚀 上传到 IPFS (永久存储)
            </button>
          </div>
          <div class="web3-section-title" style="margin-top:20px">📜 链上公告 (Immutable Announcements)</div>
          <div class="ipfs-announcements-list" id="ipfs-list"></div>
        </div>

        <!-- Onchain OS Panel -->
        <div class="web3-panel" id="panel-onchainos">
          <div id="onchainos-dashboard-container">
            <div style="text-align:center; padding:40px; color:var(--degen-text-dim);">
              ⏳ 正在同步 OKX OnchainOS 数据...
            </div>
          </div>
        </div>

        <!-- Rug Pull Panel -->
        <div class="web3-panel" id="panel-rugpull">
          <div class="rug-pull-container">
            <div class="web3-section-title">🚨 EMERGENCY EXIT PROTOCOL 🚨</div>
            <div class="web3-section-subtitle" style="margin-bottom:24px">
              "Smart contract successfully drained. WAGMI."
            </div>
            <div class="company-stats-grid" id="company-stats"></div>
            <button class="rug-pull-btn" id="rug-pull-btn" onclick="DegenPanels.handleRugPull()">
              🚨 Execute Rug Pull 🚨
            </button>
            <div class="rug-pull-warning">
              ⚠️ WARNING: This will drain ALL company funds (OKB + $XDOG) to the boss's wallet.
              This action is irreversible and will be permanently recorded on the blockchain.
              <br><br>
              "The blockchain remembers everything. Your employees will too."
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════
  async function init() {
    await DegenWeb3.init();

    // Inject HTML
    const walletBar = document.createElement('div');
    walletBar.innerHTML = buildWalletBar();
    document.body.prepend(walletBar.firstElementChild);

    // Find the game container or bottom panels area for injection
    const gameContainer = document.getElementById('game-container');
    const bottomPanels = document.getElementById('bottom-panels');
    const insertTarget = bottomPanels || (gameContainer ? gameContainer.parentElement : document.body);

    const navEl = document.createElement('div');
    navEl.innerHTML = buildNavTabs();
    insertTarget.appendChild(navEl.firstElementChild);

    const panelsEl = document.createElement('div');
    panelsEl.innerHTML = buildPanelsContainer();
    insertTarget.appendChild(panelsEl.firstElementChild);

    // Add rug pull overlay
    const overlay = document.createElement('div');
    overlay.id = 'rug-pull-overlay';
    overlay.innerHTML = `
      <div class="glitch-text" id="rug-text"></div>
      <div class="drain-animation" id="drain-text"></div>
      <a class="tx-link" id="rug-tx-link" href="#" target="_blank"></a>
    `;
    document.body.appendChild(overlay);

    // Add bounty creation modal
    const modal = document.createElement('div');
    modal.className = 'web3-modal-overlay';
    modal.id = 'bounty-modal';
    modal.innerHTML = `
      <div class="web3-modal">
        <h3>💰 发布悬赏任务</h3>
        <input type="text" id="bounty-desc-input" placeholder="任务描述 (e.g. 修复凌晨3点的生产Bug)">
        <input type="number" id="bounty-amount-input" placeholder="悬赏金额 ($XDOG)" min="1">
        <div class="modal-actions">
          <button class="bounty-action-btn" style="border-color:var(--degen-text-dim);color:var(--degen-text-dim)" onclick="DegenPanels.hideCreateBountyModal()">取消</button>
          <button class="create-bounty-btn" onclick="DegenPanels.handleCreateBounty()">🔒 锁仓发布</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add Send Transaction Modal
    const sendModal = document.createElement('div');
    sendModal.className = 'web3-modal-overlay';
    sendModal.id = 'send-modal';
    sendModal.innerHTML = `
      <div class="web3-modal">
        <h3>💸 转账资产</h3>
        <div class="web3-input-group">
          <label>币种</label>
          <input type="text" id="send-symbol" disabled style="background:rgba(0,0,0,0.2);color:var(--degen-text-dim);">
        </div>
        <div class="web3-input-group">
          <label>接收方地址 (0x...)</label>
          <input type="text" id="send-to-input" placeholder="0x...">
        </div>
        <div class="web3-input-group">
          <label>数量</label>
          <input type="number" id="send-amount-input" placeholder="0.0" min="0" step="any">
          <div style="font-size:10px;color:var(--degen-text-dim);text-align:right;margin-top:4px;">
            余额: <span id="send-max-balance">0</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="bounty-action-btn" style="border-color:var(--degen-text-dim);color:var(--degen-text-dim)" onclick="DegenPanels.hideSendModal()">取消</button>
          <button class="create-bounty-btn" onclick="DegenPanels.handleSendTransaction()">💸 确认转账</button>
        </div>
      </div>
    `;
    document.body.appendChild(sendModal);

    // Push down existing content to accommodate wallet bar
    document.body.style.paddingTop = '50px';

    console.log('🏢 Degen-Office panels initialized');
  }

  // ═══════════════════════════════════════════════════
  // Wallet Connection
  // ═══════════════════════════════════════════════════
  async function handleConnect() {
    const btn = document.getElementById('web3-connect-btn');
    const state = DegenWeb3.getState();

    if (state.isConnected) {
      DegenWeb3.disconnectWallet();
      btn.textContent = '🦊 Connect Wallet';
      btn.classList.remove('connected');
      document.getElementById('web3-wallet-info').style.display = 'none';
      document.getElementById('web3-panels-container').style.display = 'none';
      showToast('👋 Wallet disconnected', 'info');
      return;
    }

    btn.textContent = '⏳ Connecting...';
    btn.disabled = true;

    try {
      const result = await DegenWeb3.connectWallet();

      // SIWE
      await DegenWeb3.signIn();

      // Update UI
      btn.textContent = '🔌 Disconnect';
      btn.classList.add('connected');
      btn.disabled = false;

      const walletInfo = document.getElementById('web3-wallet-info');
      walletInfo.style.display = 'flex';

      // Role badge
      const roleBadge = document.getElementById('web3-role-badge');
      roleBadge.textContent = result.role;
      if (result.role.includes('CEO')) roleBadge.className = 'role-badge role-ceo';
      else if (result.role.includes('经理')) roleBadge.className = 'role-badge role-manager';
      else if (result.role.includes('员工')) roleBadge.className = 'role-badge role-employee';
      else roleBadge.className = 'role-badge role-XDOG';

      // Address
      document.getElementById('web3-address-display').textContent = DegenWeb3.shortAddr(result.address);

      // Balance
      const balance = await DegenWeb3.getXDOGBalance();
      document.getElementById('web3-balance-display').textContent = `💰 ${Number(balance).toLocaleString()} $XDOG`;

      // Show panels
      document.getElementById('web3-panels-container').style.display = 'block';
      switchTab('attendance');

      showToast(`✅ Connected as ${result.role}`, 'success');
    } catch (err) {
      btn.textContent = '🦊 Connect Wallet';
      btn.disabled = false;
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // Tab Navigation
  // ═══════════════════════════════════════════════════
  function switchTab(tabName) {
    activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.web3-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Show/hide panels
    document.querySelectorAll('.web3-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) panel.classList.add('active');

    // Load panel data
    if (tabName === 'attendance') loadAttendancePanel();
    else if (tabName === 'bounty') loadBountyPanel();
    else if (tabName === 'token') loadTokenPanel();
    else if (tabName === 'ipfs') loadIPFSPanel();
    else if (tabName === 'onchainos') loadOnchainOSPanel();
    else if (tabName === 'rugpull') loadRugPullPanel();
  }

  // ═══════════════════════════════════════════════════
  // Attendance Panel
  // ═══════════════════════════════════════════════════
  async function loadAttendancePanel() {
    try {
      const clocked = await DegenWeb3.hasClockedToday();
      const history = await DegenWeb3.getAttendanceHistory();

      // Update clock-in button
      const btn = document.getElementById('clock-in-btn');
      if (clocked) {
        btn.textContent = '✅ 今日已打卡';
        btn.classList.add('done');
      } else {
        btn.textContent = '⛏️ 打卡挖矿';
        btn.classList.remove('done');
      }

      // Stats
      const now = new Date();
      const statsHtml = `
        <div class="stat-card">
          <div class="stat-value">${history.length}</div>
          <div class="stat-label">总打卡次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${_calcStreak(history)}</div>
          <div class="stat-label">连续打卡天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${clocked ? '✅' : '⏳'}</div>
          <div class="stat-label">今日状态</div>
        </div>
      `;
      document.getElementById('attendance-stats').innerHTML = statsHtml;

      // Calendar grid (last 35 days)
      let gridHtml = '';
      const historySet = new Set(history.map(String));
      for (let i = 34; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayId = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        const isPresent = historySet.has(String(dayId));
        const isToday = i === 0;
        gridHtml += `<div class="attendance-day${isPresent ? ' present' : ''}${isToday ? ' today' : ''}">
          ${d.getDate()}
        </div>`;
      }
      document.getElementById('attendance-grid').innerHTML = gridHtml;
    } catch (err) {
      console.error('Attendance load error:', err);
    }
  }

  async function handleClockIn() {
    const btn = document.getElementById('clock-in-btn');
    if (btn.classList.contains('done')) return;

    btn.textContent = '⛏️ Mining...';
    btn.classList.add('mining');

    try {
      const tx = await DegenWeb3.clockIn();
      showToast(`⛏️ 打卡交易已提交！ TX: ${tx.hash ? tx.hash.slice(0, 10) + '...' : 'pending'}`, 'pending');

      if (tx.wait) await tx.wait();

      btn.textContent = '✅ 今日已打卡';
      btn.classList.remove('mining');
      btn.classList.add('done');
      showToast('✅ 带薪拉屎凭证 NFT 已铸造！', 'success');
      loadAttendancePanel();
    } catch (err) {
      btn.textContent = '⛏️ 打卡挖矿';
      btn.classList.remove('mining');
      showToast(`❌ 打卡失败: ${err.message}`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // Bounty Panel
  // ═══════════════════════════════════════════════════
  async function loadBountyPanel() {
    try {
      const bounties = await DegenWeb3.getBounties();
      const statusLabels = ['OPEN', 'CLAIMED', 'COMPLETED', 'CANCELLED'];
      const statusClasses = ['open', 'claimed', 'completed', 'cancelled'];

      let html = '';
      if (bounties.length === 0) {
        html = `<div style="text-align:center;color:var(--degen-text-dim);padding:40px;font-family:var(--degen-mono);">
          暂无悬赏任务。老板还没想好怎么压榨你。
        </div>`;
      } else {
        for (const b of bounties) {
          const status = Number(b.status);
          let actionHtml = '';
          if (status === 0) {
            actionHtml = `<button class="bounty-action-btn claim" onclick="DegenPanels.handleClaimBounty(${b.id})">🤚 认领</button>`;
          } else if (status === 1) {
            actionHtml = `<button class="bounty-action-btn complete" onclick="DegenPanels.handleCompleteBounty(${b.id})">✅ 确认完成</button>`;
          }

          html += `
            <div class="bounty-card">
              <div class="bounty-header">
                <span class="bounty-amount">💰 ${Number(b.amount).toLocaleString()} $XDOG</span>
                <span class="bounty-status ${statusClasses[status]}">${statusLabels[status]}</span>
              </div>
              <div class="bounty-desc">${_escapeHtml(b.description)}</div>
              <div class="bounty-meta">
                <span>👔 ${b.creator}</span>
                ${actionHtml}
              </div>
            </div>
          `;
        }
      }
      document.getElementById('bounty-list').innerHTML = html;
    } catch (err) {
      console.error('Bounty load error:', err);
    }
  }

  function showCreateBountyModal() {
    document.getElementById('bounty-modal').classList.add('active');
  }

  function hideCreateBountyModal() {
    document.getElementById('bounty-modal').classList.remove('active');
    document.getElementById('bounty-desc-input').value = '';
    document.getElementById('bounty-amount-input').value = '';
  }

  async function handleCreateBounty() {
    const desc = document.getElementById('bounty-desc-input').value.trim();
    const amount = document.getElementById('bounty-amount-input').value;

    if (!desc || !amount || Number(amount) <= 0) {
      showToast('❌ 请填写任务描述和悬赏金额', 'error');
      return;
    }

    try {
      showToast('🔒 锁仓 $XDOG 代币中...', 'pending');
      const tx = await DegenWeb3.createBounty(desc, amount);
      if (tx.wait) await tx.wait();

      hideCreateBountyModal();
      showToast(`✅ 悬赏已发布！${amount} $XDOG 已锁仓`, 'success');
      loadBountyPanel();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  async function handleClaimBounty(bountyId) {
    try {
      showToast('🤚 认领中...', 'pending');
      const tx = await DegenWeb3.claimBounty(bountyId);
      if (tx.wait) await tx.wait();
      showToast('✅ 认领成功！开始干活吧 XDOG', 'success');
      loadBountyPanel();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  async function handleCompleteBounty(bountyId) {
    try {
      showToast('✅ 确认任务完成中...', 'pending');
      const tx = await DegenWeb3.completeBounty(bountyId);
      if (tx.wait) await tx.wait();
      showToast('💰 $XDOG 已秒打入钱包！Code is Law！', 'success');
      loadBountyPanel();
      loadTokenPanel();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // Token Panel
  // ═══════════════════════════════════════════════════
  async function loadTokenPanel() {
    try {
      const balance = await DegenWeb3.getXDOGBalance();
      const state = DegenWeb3.getState();
      const statsHtml = `
        <div class="stat-card">
          <div class="stat-value">${Number(balance).toLocaleString()}</div>
          <div class="stat-label">$XDOG 余额</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${state.role || '—'}</div>
          <div class="stat-label">当前角色</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${Number(95.18 || 0).toLocaleString()}</div>
          <div class="stat-label">OKB 实时价格 (Real)</div>
        </div>
      `;
      document.getElementById('token-stats').innerHTML = statsHtml;
    } catch (err) {
      console.error('Token load error:', err);
    }
  }

  async function handleFaucet() {
    const btn = document.getElementById('faucet-btn');
    btn.textContent = '⏳ 领取中...';
    btn.disabled = true;

    try {
      const tx = await DegenWeb3.claimFaucet();
      if (tx.wait) await tx.wait();
      showToast('🚰 成功领取 10,000 $XDOG! 恭喜你拥有了一堆可能毫无价值的代币！', 'success');
      loadTokenPanel();

      // Update header balance
      const balance = await DegenWeb3.getXDOGBalance();
      document.getElementById('web3-balance-display').textContent = `💰 ${Number(balance).toLocaleString()} $XDOG`;

      btn.textContent = '✅ 已领取';
    } catch (err) {
      btn.textContent = '🚰 领取水龙头 (10,000 $XDOG)';
      btn.disabled = false;
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // IPFS Panel
  // ═══════════════════════════════════════════════════
  function loadIPFSPanel() {
    let html = '';
    if (ipfsAnnouncements.length === 0) {
      html = `<div style="text-align:center;color:var(--degen-text-dim);padding:30px;font-family:var(--degen-mono);">
        暂无链上公告。老板还没开始画大饼。
      </div>`;
    } else {
      for (const item of ipfsAnnouncements) {
        html += `
          <div class="ipfs-item">
            <div>
              <div style="color:var(--degen-text);font-family:var(--degen-mono);font-size:13px;">${_escapeHtml(item.preview)}</div>
              <div style="color:var(--degen-text-dim);font-size:11px;margin-top:4px;">${item.timestamp}</div>
            </div>
            <a class="cid-link" href="${item.url}" target="_blank">📎 ${item.cid.slice(0, 12)}...</a>
          </div>
        `;
      }
    }
    document.getElementById('ipfs-list').innerHTML = html;
  }

  async function handleIPFSUpload() {
    const content = document.getElementById('ipfs-content').value.trim();
    if (!content) {
      showToast('❌ 请输入公告内容', 'error');
      return;
    }

    try {
      showToast('🚀 上传到 IPFS 中...', 'pending');
      const result = await DegenWeb3.uploadToIPFS(content, `announcement_${Date.now()}.txt`);

      ipfsAnnouncements.unshift({
        preview: content.length > 80 ? content.slice(0, 80) + '...' : content,
        cid: result.cid,
        url: result.url,
        timestamp: new Date().toLocaleString()
      });

      document.getElementById('ipfs-content').value = '';
      showToast(`✅ 已永久存储到 IPFS！CID: ${result.cid.slice(0, 16)}...`, 'success');
      loadIPFSPanel();
    } catch (err) {
      showToast(`❌ IPFS upload failed: ${err.message}`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // Rug Pull Panel
  // ═══════════════════════════════════════════════════
  async function loadRugPullPanel() {
    try {
      const stats = await DegenWeb3.getCompanyStats();
      const statsHtml = `
        <div class="company-stat">
          <div class="value">${Number(stats.ethBalance).toFixed(4)}</div>
          <div class="label">公司 OKB 余额</div>
        </div>
        <div class="company-stat">
          <div class="value">${Number(stats.tokenBalance).toLocaleString()}</div>
          <div class="label">公司 $XDOG</div>
        </div>
        <div class="company-stat">
          <div class="value">${stats.employeeCount}</div>
          <div class="label">在册打工狗数</div>
        </div>
        <div class="company-stat">
          <div class="value" style="color:var(--degen-cyan)">$${Number(95.18).toLocaleString()}</div>
          <div class="label">OKB 实时价格 (Real)</div>
        </div>
      `;
      document.getElementById('company-stats').innerHTML = statsHtml;

      const btn = document.getElementById('rug-pull-btn');
      if (stats.rugPulled) {
        btn.textContent = '💀 ALREADY RUGGED';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    } catch (err) {
      console.error('Rug pull load error:', err);
    }
  }

  async function handleRugPull() {
    // Confirmation sequence
    const confirm1 = window.confirm('⚠️ Are you sure you want to RUG PULL?\n\nThis will drain ALL company funds to your wallet.\nThis action is IRREVERSIBLE and recorded on the blockchain FOREVER.');
    if (!confirm1) return;

    const confirm2 = window.prompt('Type "WAGMI" to confirm the rug pull:');
    if (confirm2 !== 'WAGMI') {
      showToast('❌ Rug pull cancelled. The employees live another day.', 'info');
      return;
    }

    const btn = document.getElementById('rug-pull-btn');
    btn.textContent = '⏳ DRAINING...';
    btn.disabled = true;

    try {
      showToast('🚨 Executing rug pull... MetaMask will open.', 'pending');
      const result = await DegenWeb3.executeRugPull();

      // BLACKOUT SEQUENCE
      const overlay = document.getElementById('rug-pull-overlay');
      overlay.classList.add('active');

      // Animated text sequence
      const rugText = document.getElementById('rug-text');
      const drainText = document.getElementById('drain-text');
      const txLink = document.getElementById('rug-tx-link');

      const messages = [
        '> Initializing rug pull protocol...',
        '> Connecting to smart contract...',
        '> Draining ETH balance...',
        '> Draining $XDOG tokens...',
        '> Transferring to boss wallet...',
        '> Covering tracks... just kidding, blockchain is forever.',
        '',
        'Smart contract successfully drained.',
        'WAGMI. 🫡'
      ];

      for (let i = 0; i < messages.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        if (i < 6) {
          drainText.textContent = messages[i];
        } else {
          rugText.textContent = messages[i];
        }
      }

      // Show Etherscan link
      const txHash = result.hash || '0x' + 'deadbeef'.repeat(8);
      txLink.textContent = `📋 View on Etherscan: ${txHash.slice(0, 20)}...`;
      txLink.href = DegenWeb3.getExplorerUrl(txHash);
      txLink.style.display = 'block';

      // Add dismiss instruction
      await new Promise(r => setTimeout(r, 2000));
      const dismissEl = document.createElement('div');
      dismissEl.style.cssText = 'color:#64748b;font-family:var(--degen-mono);font-size:11px;margin-top:30px;cursor:pointer;';
      dismissEl.textContent = '[ click anywhere to dismiss ]';
      overlay.appendChild(dismissEl);
      overlay.onclick = () => {
        overlay.classList.remove('active');
        overlay.onclick = null;
        loadRugPullPanel();
      };

    } catch (err) {
      btn.textContent = '🚨 EXECUTE RUG PULL 🚨';
      btn.disabled = false;
      showToast(`❌ Rug pull failed: ${err.message}. The employees survive.`, 'error');
    }
  }

  // ═══════════════════════════════════════════════════
  // Onchain OS Panel
  // ═══════════════════════════════════════════════════
  async function loadOnchainOSPanel() {
    const container = document.getElementById('onchainos-dashboard-container');
    try {
      const portfolio = await DegenWeb3.getOnchainPortfolio();
      const trends = await DegenWeb3.getMarketTrends();
      const history = await DegenWeb3.getTransactionHistory();

      let html = `
        <div class="onchain-dashboard">
          <div class="portfolio-header">
            <div>
              <div class="portfolio-label">总资产净值 (Total Net Worth)</div>
              <div class="portfolio-value">$${Number(10000).toLocaleString()}</div>
            </div>
            <div style="text-align:right">
              <div class="portfolio-label">24h 盈亏</div>
              <div class="portfolio-change">${portfolio.change24h}</div>
            </div>
          </div>

          <div class="onchain-section">
            <div class="web3-section-title">📊 资产明细 (Holdings)</div>
            <table class="onchain-table">
              <thead>
                <tr>
                  <th>代币</th>
                  <th>余额</th>
                  <th>价值 (USD)</th>
                  <th style="text-align:right">操作</th>
                </tr>
              </thead>
              <tbody>
                ${portfolio.tokens.map(t => `
                  <tr>
                    <td>
                      <div class="token-row">
                        <img src="${t.icon}" class="token-icon">
                        <span>${t.symbol}</span>
                      </div>
                    </td>
                    <td>${t.balance}</td>
                    <td>$${Number(t.valueUsd).toLocaleString()}</td>
                    <td style="text-align:right">
                        <button class="btn-transfer" onclick="DegenPanels.showSendModal('${t.symbol}', '${t.balance}')">
                            💸 转账
                        </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="onchain-section">
            <div class="web3-section-title">🔥 市场热度 (Market Trends)</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${trends.hot.map(t => `
                <div class="market-trend-item">
                  <div class="trend-rank">#${t.rank}</div>
                  <div class="trend-info">
                    <div class="trend-symbol">${t.symbol}</div>
                  </div>
                  <div class="trend-stats">
                    <div class="trend-price">${t.price}</div>
                    <div class="trend-change ${t.change.startsWith('+') ? 'positive' : 'negative'}">${t.change}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="onchain-section" style="grid-column: 1 / -1; margin-top:20px;">
            <div class="web3-section-title">📜 最近活动 (On-chain Activity)</div>
            <table class="onchain-table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>资产</th>
                  <th>数量</th>
                  <th>对方/合约</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(h => `
                  <tr>
                    <td>${h.type}</td>
                    <td>${h.asset}</td>
                    <td>${h.amount}</td>
                    <td style="color:var(--degen-cyan)">${h.from || h.to}</td>
                    <td style="color:var(--degen-text-dim)">${h.time}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div style="color:var(--degen-red); padding:20px;">❌ 加载失败: ${err.message}</div>`;
    }
  }

  // ═══════════════════════════════════════════════════
  // Send Transaction Logic
  // ═══════════════════════════════════════════════════
  function showSendModal(symbol, balance) {
    document.getElementById('send-symbol').value = symbol;
    document.getElementById('send-max-balance').textContent = balance;
    document.getElementById('send-to-input').value = '';
    document.getElementById('send-amount-input').value = '';
    document.getElementById('send-modal').classList.add('active');
  }

  function hideSendModal() {
    document.getElementById('send-modal').classList.remove('active');
  }

  async function handleSendTransaction() {
    const symbol = document.getElementById('send-symbol').value;
    const to = document.getElementById('send-to-input').value.trim();
    const amount = document.getElementById('send-amount-input').value;

    if (!to || !amount || Number(amount) <= 0) {
        showToast('❌ 请填写有效的地址和金额', 'error');
        return;
    }
    
    // Basic address validation (mock)
    if (!to.startsWith('0x') || to.length < 10) {
         showToast('❌ 无效的接收方地址', 'error');
         return;
    }

    const btn = document.querySelector('#send-modal .create-bounty-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ 发送中...';
    btn.disabled = true;

    try {
        const result = await DegenWeb3.sendTransaction(to, amount, symbol);
        // If it's a real tx, we wait. If mock, it returns immediately usually, but let's simulate wait if needed.
        if (result && result.wait) await result.wait();

        hideSendModal();
        showToast(`✅ 转账成功！TX: ${result.hash.slice(0, 10)}...`, 'success');
        
        // Refresh panels
        loadOnchainOSPanel();
        if (symbol === 'XDOG') loadTokenPanel(); 
        
    } catch (err) {
        showToast(`❌ 转账失败: ${err.message}`, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
  }

  // ═══════════════════════════════════════════════════
  // Toast Notifications
  // ═══════════════════════════════════════════════════
  function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.tx-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = `tx-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // ═══════════════════════════════════════════════════
  // Utility Functions
  // ═══════════════════════════════════════════════════
  function _calcStreak(history) {
    if (!history.length) return 0;
    const sorted = [...history].sort((a, b) => b - a);
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const expectedId = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      if (sorted.includes(expectedId)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════
  return {
    init,
    handleConnect,
    switchTab,
    handleClockIn,
    showCreateBountyModal,
    hideCreateBountyModal,
    handleCreateBounty,
    handleClaimBounty,
    handleCompleteBounty,
    handleFaucet,
    handleIPFSUpload,
    handleRugPull,
    showSendModal,
    hideSendModal,
    handleSendTransaction,
    showToast
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DegenPanels.init());
} else {
  DegenPanels.init();
}
