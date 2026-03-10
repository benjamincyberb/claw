// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BountyEscrow - 智能合约悬赏系统
 * @notice "Your boss can't stiff you anymore. Code is Law. 
 *          But the tokens might still be worthless."
 * @dev Task bounty system where $XDOGE tokens are locked in escrow.
 *      Boss creates bounty → Worker claims → Completion triggers payout.
 */
contract BountyEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BountyStatus { Open, Claimed, Completed, Cancelled }

    struct Bounty {
        uint256 id;
        address creator;
        address worker;
        uint256 amount;
        string description;
        BountyStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    IERC20 public immutable xDogeCoin;
    uint256 public nextBountyId;
    
    mapping(uint256 => Bounty) public bounties;
    uint256[] public bountyIds;

    // Track bounties by creator and worker
    mapping(address => uint256[]) public creatorBounties;
    mapping(address => uint256[]) public workerBounties;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 amount, string description);
    event BountyClaimed(uint256 indexed bountyId, address indexed worker);
    event BountyCompleted(uint256 indexed bountyId, address indexed worker, uint256 amount);
    event BountyCancelled(uint256 indexed bountyId, address indexed creator, uint256 refundAmount);

    constructor(address _xDogeCoin) Ownable(msg.sender) {
        xDogeCoin = IERC20(_xDogeCoin);
    }

    /**
     * @notice Create a new bounty and lock $XDOGE tokens in escrow.
     *         "Put your money where your mouth is, boss."
     * @param description Task description (e.g., "Fix the prod bug at 3 AM")
     * @param amount Amount of $XDOGE to lock as reward
     */
    function createBounty(string calldata description, uint256 amount) external nonReentrant {
        require(amount > 0, "Bounty: reward must be > 0, we're not slaves");
        require(bytes(description).length > 0, "Bounty: describe the task, boss");

        // Transfer tokens from creator to this contract (escrow)
        xDogeCoin.safeTransferFrom(msg.sender, address(this), amount);

        uint256 bountyId = nextBountyId++;
        bounties[bountyId] = Bounty({
            id: bountyId,
            creator: msg.sender,
            worker: address(0),
            amount: amount,
            description: description,
            status: BountyStatus.Open,
            createdAt: block.timestamp,
            completedAt: 0
        });
        bountyIds.push(bountyId);
        creatorBounties[msg.sender].push(bountyId);

        emit BountyCreated(bountyId, msg.sender, amount, description);
    }

    /**
     * @notice Claim an open bounty. "I'll take on the suffering."
     * @param bountyId The bounty to claim
     */
    function claimBounty(uint256 bountyId) external {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Open, "Bounty: not open, someone beat you to the misery");
        require(b.creator != msg.sender, "Bounty: can't claim your own bounty, nice try boss");

        b.status = BountyStatus.Claimed;
        b.worker = msg.sender;
        workerBounties[msg.sender].push(bountyId);

        emit BountyClaimed(bountyId, msg.sender);
    }

    /**
     * @notice Complete a bounty and release tokens to the worker.
     *         Only the bounty creator (boss) can approve completion.
     *         "Code is Law: payment is instant. Unlike your last employer."
     * @param bountyId The bounty to complete
     */
    function completeBounty(uint256 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Claimed, "Bounty: not claimed yet");
        require(b.creator == msg.sender || owner() == msg.sender, "Bounty: only creator or admin can approve");

        b.status = BountyStatus.Completed;
        b.completedAt = block.timestamp;

        // Transfer tokens from escrow to worker. Instant. No 30-day payment terms.
        xDogeCoin.safeTransfer(b.worker, b.amount);

        emit BountyCompleted(bountyId, b.worker, b.amount);
    }

    /**
     * @notice Cancel an open bounty and refund tokens.
     *         Can only cancel if no one has claimed it yet.
     * @param bountyId The bounty to cancel
     */
    function cancelBounty(uint256 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Open, "Bounty: can only cancel open bounties");
        require(b.creator == msg.sender, "Bounty: only creator can cancel");

        b.status = BountyStatus.Cancelled;

        // Refund tokens to creator
        xDogeCoin.safeTransfer(b.creator, b.amount);

        emit BountyCancelled(bountyId, b.creator, b.amount);
    }

    /**
     * @notice Get total number of bounties.
     */
    function getBountyCount() external view returns (uint256) {
        return nextBountyId;
    }

    /**
     * @notice Get all bounty IDs.
     */
    function getAllBountyIds() external view returns (uint256[] memory) {
        return bountyIds;
    }

    /**
     * @notice Get bounties created by an address.
     */
    function getCreatorBounties(address creator) external view returns (uint256[] memory) {
        return creatorBounties[creator];
    }

    /**
     * @notice Get bounties claimed by a worker.
     */
    function getWorkerBounties(address worker) external view returns (uint256[] memory) {
        return workerBounties[worker];
    }

    /**
     * @notice Get bounty details.
     */
    function getBounty(uint256 bountyId) external view returns (
        address creator,
        address worker,
        uint256 amount,
        string memory description,
        BountyStatus status,
        uint256 createdAt,
        uint256 completedAt
    ) {
        Bounty storage b = bounties[bountyId];
        return (b.creator, b.worker, b.amount, b.description, b.status, b.createdAt, b.completedAt);
    }
}
