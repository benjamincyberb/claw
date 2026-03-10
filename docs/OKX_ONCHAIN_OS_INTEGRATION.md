# Star Office UI x OKX OnchainOS 集成文档

本文档介绍 **Star Office UI** 项目的核心功能，以及如何深度利用 **OKX OnchainOS** 赋能 AI Agent，实现全自动化的“链上办公”体验。

---

## 1. 项目概览

**Star Office UI** 是一个基于像素风的虚拟办公空间。在这个空间里，AI Agent 不再仅仅是聊天机器人，而是具备独立身份的“链上员工”。

### 核心特性
- **可视化办公**：Agent 根据当前任务状态（编写代码、研究、执行、同步）在办公室的不同区域移动。
- **状态主动推送**：通过 `office-agent-push.py` 脚本，Agent 的心跳和工作细节能实时同步到前端页面。
- **资产可视化**：结合链上合约，Agent 的头顶气泡和面板可以直接显示其赚取的 $XDOGE 收益。

---

## 2. 运用的 OKX OnchainOS 功能

我们深度集成了 [OKX OnchainOS](https://web3.okx.com/zh-hans/onchainos/dev-docs/home/run-your-first-ai-agent) 的核心能力，赋予 Agent “大脑”和“钱包”。

### 2.1 Tool Use (工具调用)
通过 OnchainOS，我们将复杂的智能合约函数封装为 Agent 的原生技能。
- ** mine_xdoge**：Agent 自动检测余额，并在金币不足时调用合约 `faucet` 领取启动资金（挖矿）。
- **create_bounty**：老板 Agent 可以通过自然语言直接在 `BountyEscrow` 合约上发布悬赏任务。
- **check_balance**：实时监控 Agent 钱包中的多链资产情况。

### 2.2 MCP 协议 (Model Context Protocol) 
我们采用了标准化协议接入，使得 Agent 能够：
- **无缝识别工具**：在 Claude 或 OpenClaw 环境下，AI 能够通过 MCP Server 的描述自动理解如何执行链上交易。
- **安全签名**：集成 OKX Wallet 的安全机制进行交易预览和签名确认。

### 2.3 Onchain Identity (链上身份)
Agent 的行为逻辑被植入了专门的 **System Prompt**，使其具备“职业素养”：
- **交易感知**：发起交易时自动切换状态为 `busy`。
- **进度公开**：交易成功后自动广播 Tx Hash。

### 2.4 Read & Analysis (数据读取与分析)
通过 OnchainOS 的数据查询工具，Agent 具备了“市场洞察力”和“财务审计”能力：
- **get_portfolio_value**：实时计算 Agent 钱包内所有资产的总价值（USD）。
- **get_token_balances**：详细列出持有的代币种类及数量。
- **get_market_trends**：根据交易量和涨幅识别热门代币，辅助 Agent 汇报市场行情。
- **get_transaction_history**：追踪近期的链上活动，实现自动化的“工作日志”记录。

---

## 3. 如何运行

1. **环境准备**：
   - 确保安装了 `python3` 及 `requests` 库。
   - 获取你的 `JOIN_KEY`。

2. **配置 Agent**：
   - 将 `onchain_agent_setup/onchain_tools.json` 中的工具定义导入到你的 OnchainOS MCP Server 中。
   - 使用 `onchain_agent_setup/system_prompt.md` 作为 Agent 的核心人格描述。

3. **启动推送**：
   ```bash
   # 填入 JOIN_KEY 和 AGENT_NAME 后运行
   python3 office-agent-push.py
   ```

---

## 4. 总结

通过 **Star Office UI** 的视觉反馈与 **OKX OnchainOS** 的链上执行能力相结合，我们实现了：
> **“对话即交易，工作即上链”**

Agent 现在可以自主地赚取代币、分发悬赏并协助您管理链上资产。
