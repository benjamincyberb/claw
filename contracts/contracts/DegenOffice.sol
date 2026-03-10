// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title DegenOffice - 去中心化办公室总控合约
 * @notice "Welcome to the future of work. Where your boss is a smart contract,
 *          and the exit strategy is built into the codebase."
 * @dev Main office controller handling:
 *      - NFT-gated role-based access (RBAC via BAYC/Pudgy balanceOf)
 *      - Company fund management
 *      - The legendary Rug Pull™ feature
 */
contract DegenOffice is Ownable {

    // Role definitions
    enum Role { 
        XDoge,      // 🐕 底层 XDoge (Liquidity Provider) - balance = 0
        Employee,   // 👔 普通员工 - has some ETH
        Manager,    // 🎩 经理 - has NFTs but not premium
        CEO         // 🦍 CEO / 董事会 - has BAYC or Pudgy
    }

    // NFT contract addresses for role gating (X Layer testnet versions)
    address public baycContract;   // Bored Ape Yacht Club (or testnet equivalent)
    address public pudgyContract;  // Pudgy Penguins (or testnet equivalent)

    // Company fund
    uint256 public totalFunding;
    
    // Track employees
    mapping(address => bool) public isRegistered;
    address[] public employees;

    // The $XDOGE token
    IERC20 public xDogeCoin;

    // Rug pull status
    bool public hasRugPulled;

    event EmployeeRegistered(address indexed employee, Role role);
    event FundDeposited(address indexed from, uint256 amount);
    event RugPullExecuted(address indexed boss, uint256 ethAmount, uint256 tokenAmount, string message);
    event NFTContractsUpdated(address bayc, address pudgy);

    constructor(
        address _xDogeCoin,
        address _baycContract,
        address _pudgyContract
    ) Ownable(msg.sender) {
        xDogeCoin = IERC20(_xDogeCoin);
        baycContract = _baycContract;
        pudgyContract = _pudgyContract;
    }

    /**
     * @notice Determine a wallet's role based on their assets.
     *         "In Web3, your net worth IS your title."
     * @param wallet The address to check
     * @return role The assigned role
     */
    function getRole(address wallet) public view returns (Role) {
        // Check for BAYC or Pudgy NFTs → CEO
        if (baycContract != address(0)) {
            try IERC721(baycContract).balanceOf(wallet) returns (uint256 balance) {
                if (balance > 0) return Role.CEO;
            } catch {}
        }
        if (pudgyContract != address(0)) {
            try IERC721(pudgyContract).balanceOf(wallet) returns (uint256 balance) {
                if (balance > 0) return Role.CEO;
            } catch {}
        }

        // Check $XDOGE balance for manager status
        uint256 tokenBalance = 0;
        try xDogeCoin.balanceOf(wallet) returns (uint256 bal) {
            tokenBalance = bal;
        } catch {}

        if (tokenBalance >= 50_000 * 1e18) return Role.Manager;
        
        // Check ETH balance
        if (wallet.balance > 0 || tokenBalance > 0) return Role.Employee;
        
        // No assets = XDoge
        return Role.XDoge;
    }

    /**
     * @notice Get role name as string for frontend display.
     */
    function getRoleName(address wallet) external view returns (string memory) {
        Role role = getRole(wallet);
        if (role == Role.CEO) return unicode"🦍 CEO / 董事会";
        if (role == Role.Manager) return unicode"🎩 经理";
        if (role == Role.Employee) return unicode"👔 员工";
        return unicode"🐕 底层 XDoge (Liquidity Provider)";
    }

    /**
     * @notice Register as an employee. Your wallet IS your employee ID.
     */
    function register() external {
        require(!isRegistered[msg.sender], "Office: already registered, no double employment");
        isRegistered[msg.sender] = true;
        employees.push(msg.sender);
        emit EmployeeRegistered(msg.sender, getRole(msg.sender));
    }

    /**
     * @notice Deposit ETH into company fund. "Company team building budget."
     */
    function depositFund() external payable {
        require(msg.value > 0, "Office: deposit something");
        totalFunding += msg.value;
        emit FundDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Update NFT contract addresses (for testnet flexibility).
     */
    function setNFTContracts(address _bayc, address _pudgy) external onlyOwner {
        baycContract = _bayc;
        pudgyContract = _pudgy;
        emit NFTContractsUpdated(_bayc, _pudgy);
    }

    /**
     * @notice 🚨 EXECUTE RUG PULL 🚨
     *         "Smart contract successfully drained. WAGMI."
     *         
     *         Drains all ETH and $XDOGE from the contract to the owner.
     *         This is the nuclear option. The blockchain remembers everything.
     *         
     *         Only the owner (boss) can execute this.
     *         Can only be executed once (even villains have standards).
     */
    function rugPull() external onlyOwner {
        require(!hasRugPulled, "Office: already rug pulled, can't rug twice");
        hasRugPulled = true;

        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = xDogeCoin.balanceOf(address(this));

        // Drain ETH
        if (ethBalance > 0) {
            (bool sent, ) = owner().call{value: ethBalance}("");
            require(sent, "Office: ETH drain failed");
        }

        // Drain tokens
        if (tokenBalance > 0) {
            xDogeCoin.transfer(owner(), tokenBalance);
        }

        totalFunding = 0;

        emit RugPullExecuted(
            owner(), 
            ethBalance, 
            tokenBalance, 
            "Smart contract successfully drained. WAGMI."
        );
    }

    /**
     * @notice Get company stats for the dashboard.
     */
    function getCompanyStats() external view returns (
        uint256 ethBalance,
        uint256 tokenBalance,
        uint256 employeeCount,
        bool rugPulled
    ) {
        return (
            address(this).balance,
            xDogeCoin.balanceOf(address(this)),
            employees.length,
            hasRugPulled
        );
    }

    /**
     * @notice Get all registered employee addresses.
     */
    function getEmployees() external view returns (address[] memory) {
        return employees;
    }

    // Accept ETH deposits
    receive() external payable {
        totalFunding += msg.value;
        emit FundDeposited(msg.sender, msg.value);
    }
}
