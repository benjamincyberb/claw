// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XDogeCoin ($XDOGE) - XDoge Coin
 * @notice The official salary token of Degen-Office.
 *         "Your labor is priceless, but your token might be worthless."
 * @dev ERC-20 token with faucet for testnet usage and owner minting for bounties.
 */
contract XDogeCoin is ERC20, Ownable {

    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e18;   // 10,000 tokens per claim
    uint256 public constant MAX_SUPPLY    = 1_000_000_000 * 1e18; // 1 billion total

    mapping(address => bool) public hasClaimed;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("XDoge Coin", "XDOGE") Ownable(msg.sender) {
        // Mint initial supply to deployer (the Boss)
        _mint(msg.sender, 100_000_000 * 1e18); // 100M to the boss
    }

    /**
     * @notice Mint tokens for bounty funding. Only the boss can do this.
     * @param to Recipient address
     * @param amount Amount to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "XDOGE: max supply exceeded, even the printer has limits");
        _mint(to, amount);
    }

    /**
     * @notice Free tokens! Because your boss won't give you a raise.
     *         Each address can claim once. 10,000 $NIUMA per claim.
     */
    function faucet() external {
        require(!hasClaimed[msg.sender], "XDOGE: already claimed, no double-dipping");
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "XDOGE: faucet dried up");
        
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Burn your own tokens. For when you realize they're worthless.
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
