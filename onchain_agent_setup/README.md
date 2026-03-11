# Onchain Agent Setup Guide

This folder contains the configuration files needed to integrate Star Office UI with OnchainOS.

## 1. Configure Tools

Add the contents of `onchain_tools.json` to your Agent's configuration file (e.g., `claude_desktop_config.json` or OnchainOS plugin settings).

**Important**: 
- The `mine_XDOG` tool is already configured with the contract address: `0x0cc24c51bf89c00c5affbfcf5e856c25ecbdb48e`.
- You need to replace `PLEASE_REPLACE_WITH_BOUNTY_ESCROW_ADDRESS` with your deployed `BountyEscrow` contract address.

## 2. Set System Prompt

Copy the content of `system_prompt.md` and add it to your Agent's system prompt or custom instructions.

## 3. Verify Integration

Once configured, try asking your Agent:
- "Help me mine some XDOG coins."
- "Check my balance."
