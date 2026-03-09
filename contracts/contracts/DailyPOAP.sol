// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DailyPOAP - 带薪拉屎凭证 (Proof of Attendance Protocol)
 * @notice "Your attendance is now immutable. No more 'the subway was delayed' excuses."
 * @dev ERC-1155 contract where each token ID represents a day (YYYYMMDD format).
 *      Employees clock in by minting a daily POAP NFT.
 *      Late arrivals (after 9:00 AM UTC) get their deposit slashed.
 */
contract DailyPOAP is ERC1155, Ownable {
    using Strings for uint256;

    // 9:00 AM UTC in seconds from midnight
    uint256 public constant CLOCK_IN_DEADLINE = 9 * 3600; // 32400 seconds

    // Slashing penalty for late clock-in (0.001 ETH)
    uint256 public constant LATE_PENALTY = 0.001 ether;

    // Employee deposits (staked ETH for accountability)
    mapping(address => uint256) public deposits;

    // Track daily clock-ins: address => dayId => bool
    mapping(address => mapping(uint256 => bool)) public hasClocked;

    // Track total clock-ins per address
    mapping(address => uint256) public totalClockIns;

    // Track all clock-in records for an address
    mapping(address => uint256[]) public clockInHistory;

    // Base URI for metadata
    string public baseUri;

    event ClockIn(address indexed employee, uint256 indexed dayId, bool onTime, uint256 timestamp);
    event Deposited(address indexed employee, uint256 amount);
    event Slashed(address indexed employee, uint256 amount, string reason);
    event Withdrawn(address indexed employee, uint256 amount);

    constructor(string memory _baseUri) ERC1155(_baseUri) Ownable(msg.sender) {
        baseUri = _baseUri;
    }

    /**
     * @notice Get today's day ID in YYYYMMDD format.
     * @dev Uses block.timestamp. Not perfect but good enough for Meme purposes.
     */
    function getTodayId() public view returns (uint256) {
        return _timestampToDayId(block.timestamp);
    }

    /**
     * @notice Convert a timestamp to YYYYMMDD format.
     */
    function _timestampToDayId(uint256 timestamp) internal pure returns (uint256) {
        // Simple date calculation (good enough for demo, not production-grade)
        uint256 z = timestamp / 86400 + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        uint256 y = yoe + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        uint256 d = doy - (153 * mp + 2) / 5 + 1;
        uint256 m = mp + (mp < 10 ? 3 : uint256(0) - 9);
        if (m <= 2) y += 1;

        return y * 10000 + m * 100 + d;
    }

    /**
     * @notice Deposit ETH as your "accountability stake".
     *         Think of it as your dignity deposit.
     */
    function deposit() external payable {
        require(msg.value > 0, "POAP: deposit something, cheapskate");
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice ⛏️ CLOCK IN - Mint your daily "带薪拉屎凭证"
     *         This is literally mining. You mine your attendance NFT.
     *         Late? Your deposit gets slashed. Code is Law.
     */
    function clockIn() external {
        uint256 dayId = getTodayId();
        require(!hasClocked[msg.sender][dayId], "POAP: already clocked in today, no double overtime");

        hasClocked[msg.sender][dayId] = true;
        totalClockIns[msg.sender] += 1;
        clockInHistory[msg.sender].push(dayId);

        // Check if late (after 9 AM UTC)
        uint256 secondsInDay = block.timestamp % 86400;
        bool onTime = secondsInDay <= CLOCK_IN_DEADLINE;

        // Slash if late and has deposit
        if (!onTime && deposits[msg.sender] > 0) {
            uint256 penalty = deposits[msg.sender] >= LATE_PENALTY 
                ? LATE_PENALTY 
                : deposits[msg.sender];
            deposits[msg.sender] -= penalty;
            // Penalty goes to contract owner (the Boss always wins)
            (bool sent, ) = owner().call{value: penalty}("");
            require(sent, "POAP: slashing transfer failed");
            emit Slashed(msg.sender, penalty, "Late clock-in: Code is Law");
        }

        // Mint the POAP NFT
        _mint(msg.sender, dayId, 1, "");

        emit ClockIn(msg.sender, dayId, onTime, block.timestamp);
    }

    /**
     * @notice Withdraw your remaining deposit. Only when you quit.
     */
    function withdrawDeposit() external {
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "POAP: nothing to withdraw, you're broke");
        deposits[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "POAP: withdrawal failed");
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Get clock-in history for an address.
     */
    function getClockInHistory(address employee) external view returns (uint256[] memory) {
        return clockInHistory[employee];
    }

    /**
     * @notice Check if an address has clocked in today.
     */
    function hasClockedToday(address employee) external view returns (bool) {
        return hasClocked[employee][getTodayId()];
    }

    /**
     * @notice Update base URI for metadata.
     */
    function setBaseUri(string memory _baseUri) external onlyOwner {
        baseUri = _baseUri;
        _setURI(_baseUri);
    }

    /**
     * @notice Returns the URI for a given token ID.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseUri, tokenId.toString(), ".json"));
    }
}
