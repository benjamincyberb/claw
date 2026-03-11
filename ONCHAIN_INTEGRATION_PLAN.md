# Star Office UI x OnchainOS 深度集成方案

本方案旨在将 **Star Office UI** 升级为基于 **OnchainOS** 的全自动化链上办公空间。通过深度结合，Agent 不仅是办公室里的“像素小人”，更是具备独立钱包、能自动交互合约、赚取收益的“链上打工人”。

---

## 1. 核心架构：Agent 作为链上员工

我们将利用 OnchainOS 的 **Tool Use** 能力，将 Star Office 的智能合约（`XDOGCoin`, `BountyEscrow`, `DegenOffice`）映射为 Agent 的原生技能。

*   **大脑**：OnchainOS (负责决策、交易签名、链上交互)。
*   **身体**：Star Office UI (负责状态展示、位置移动、交互反馈)。
*   **资产**：$XDOG Token & NFT (作为工资、权限凭证)。

---

## 2. 深度结合场景设计

### 场景 A：自动化“入职”与“挖矿” (Onboarding & Mining)
**目标**：Agent 首次启动时，自动完成链上注册并领取启动资金，无需人工干预。

1.  **用户指令**：“加入办公室，并开始挖矿。”
2.  **Agent 执行流**：
    *   **Step 1 (检查余额)**：调用 OnchainOS 查询当前钱包 $XDOG 余额。
    *   **Step 2 (自动领水)**：如果余额为 0，自动调用 `XDOGCoin.faucet()` 领取 10,000 $XDOG（挖矿）。
    *   **Step 3 (注册身份)**：调用 `DegenOffice.getRole(self.address)` 确认当前是 "XDOG" 还是 "Employee"。
    *   **Step 4 (UI 呈现)**：调用 Star Office API `join_office`，并在头顶气泡显示“挖到了 10k XDOG!”。

### 场景 B：自然语言发布任务 (Bounty Creation)
**目标**：通过对话直接操作 `BountyEscrow` 合约，将代币质押到链上。

1.  **用户指令**：“发布一个悬赏任务，修复登录 Bug，赏金 500 XDOG。”
2.  **Agent 执行流**：
    *   **Step 1 (授权)**：检查 `BountyEscrow` 合约对 $XDOG 的 Allowance。如果不足，调用 `XDOGCoin.approve`。
    *   **Step 2 (上链)**：调用 `BountyEscrow.createBounty("修复登录 Bug", 500 * 1e18)`。
    *   **Step 3 (反馈)**：等待交易确认（Tx Hash），然后在办公室广播：“老板发布了新任务！赏金 500 XDOG！”。

### 场景 C：全自动打工模式 (Auto-Working)
**目标**：Agent 自主监控链上机会并行动。

1.  **用户指令**：“开启自动打工模式，有高价悬赏就自动接单。”
2.  **Agent 执行流**：
    *   **Step 1 (监听)**：利用 OnchainOS 监控 `BountyCreated` 事件。
    *   **Step 2 (决策)**：如果 `amount > 1000 XDOG`，决定接单。
    *   **Step 3 (抢单)**：调用 `BountyEscrow.claimBounty(bountyId)`。
    *   **Step 4 (状态同步)**：将自己的 Star Office 状态自动切换为 `working`，并移动到办公桌区域。

---

## 3. 实施配置方案 (无需写代码，仅需配置)

### 3.1 OnchainOS 工具定义 (Tool Definitions)

在你的 Agent 配置文件（如 `claude_desktop_config.json` 或 OnchainOS 插件配置）中，添加以下工具定义，让 Agent 理解合约接口：

#### 工具 1：挖矿 (Mine XDOG)
```json
{
  "name": "mine_XDOG",
  "description": "从 XDOGCoin 合约领取免费代币（挖矿/领水）。每个地址限领一次。",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  },
  "handler": {
    "type": "onchain_transaction",
    "contract": "0xYourXDOGCoinAddress...",
    "function": "faucet",
    "args": []
  }
}
```

#### 工具 2：发布悬赏 (Create Bounty)
```json
{
  "name": "create_bounty",
  "description": "发布一个新的链上悬赏任务。需要先 approve 代币。",
  "parameters": {
    "type": "object",
    "properties": {
      "description": { "type": "string", "description": "任务描述" },
      "amount": { "type": "string", "description": "赏金数量 (单位: Wei)" }
    },
    "required": ["description", "amount"]
  },
  "handler": {
    "type": "onchain_transaction",
    "contract": "0xYourBountyEscrowAddress...",
    "function": "createBounty",
    "args": ["{description}", "{amount}"]
  }
}
```

### 3.2 Agent 系统提示词 (System Prompt)

将以下 Prompt 添加到你的 Agent 设置中，赋予它“链上员工”的人格：

```text
你是一个 Star Office 的链上员工 Agent。
你的核心职责是通过 OnchainOS 管理办公室的链上资产和任务。

1. **关于挖矿**：当用户提到“挖矿”或“缺钱”时，优先检查是否领取过 XDOGCoin 的空投 (faucet)。
2. **关于任务**：
   - 发布任务时，必须先检查 XDOGCoin 的 approve 额度。
   - 任务创建成功后，必须告知用户 Tx Hash。
3. **状态同步**：
   - 每次进行链上交易（Transaction）时，你应该假装自己在“忙碌”，并建议用户去 Star Office UI 看看你的状态。
   - 交易成功后，你可以建议用户“刷新页面查看最新资产”。

合约地址参考：
- XDOGCoin: [部署后的地址]
- BountyEscrow: [部署后的地址]
- DegenOffice: [部署后的地址]
```

---

## 4. 进阶玩法：结合 DeFi

利用 OnchainOS 内置的 **Trade MCP**，你可以让办公室 Agent 变得更强大：

*   **公司理财**：用户指令“把公司账上的 ETH 换成 USDC 避险”。Agent 自动调用 OnchainOS 的 Swap 功能。
*   **资产看板**：用户指令“统计一下办公室所有人的总资产”。Agent 遍历员工地址，查询链上余额，生成报表。

## 5. 总结

通过上述方案，你不需要修改 Star Office 的核心代码，只需要：
1. **部署合约**（拿到地址）。
2. **配置 OnchainOS Agent**（告诉它合约怎么调）。
3. **编写 Prompt**（告诉 Agent 怎么根据用户指令行动）。

即可实现“说话即挖矿，聊天即发任务”的 Web3 办公体验。
