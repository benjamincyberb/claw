const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Degen-Office Smart Contracts", function () {

    let niuMaCoin, dailyPOAP, bountyEscrow, degenOffice;
    let owner, employee1, employee2;

    beforeEach(async function () {
        [owner, employee1, employee2] = await ethers.getSigners();

        // Deploy NiuMaCoin
        const NiuMaCoin = await ethers.getContractFactory("NiuMaCoin");
        niuMaCoin = await NiuMaCoin.deploy();
        await niuMaCoin.waitForDeployment();

        // Deploy DailyPOAP
        const DailyPOAP = await ethers.getContractFactory("DailyPOAP");
        dailyPOAP = await DailyPOAP.deploy("https://degen-office.meme/poap/");
        await dailyPOAP.waitForDeployment();

        // Deploy BountyEscrow
        const BountyEscrow = await ethers.getContractFactory("BountyEscrow");
        bountyEscrow = await BountyEscrow.deploy(await niuMaCoin.getAddress());
        await bountyEscrow.waitForDeployment();

        // Deploy DegenOffice
        const DegenOffice = await ethers.getContractFactory("DegenOffice");
        degenOffice = await DegenOffice.deploy(
            await niuMaCoin.getAddress(),
            ethers.ZeroAddress,
            ethers.ZeroAddress
        );
        await degenOffice.waitForDeployment();
    });

    describe("NiuMaCoin ($NIUMA)", function () {
        it("should have correct name and symbol", async function () {
            expect(await niuMaCoin.name()).to.equal("NiuMa Coin");
            expect(await niuMaCoin.symbol()).to.equal("NIUMA");
        });

        it("should mint initial supply to deployer", async function () {
            const balance = await niuMaCoin.balanceOf(owner.address);
            expect(balance).to.equal(ethers.parseEther("100000000"));
        });

        it("should allow faucet claim once", async function () {
            await niuMaCoin.connect(employee1).faucet();
            const balance = await niuMaCoin.balanceOf(employee1.address);
            expect(balance).to.equal(ethers.parseEther("10000"));
        });

        it("should reject double faucet claim", async function () {
            await niuMaCoin.connect(employee1).faucet();
            await expect(
                niuMaCoin.connect(employee1).faucet()
            ).to.be.revertedWith("NIUMA: already claimed, no double-dipping");
        });

        it("should allow owner to mint", async function () {
            await niuMaCoin.mint(employee1.address, ethers.parseEther("1000"));
            const balance = await niuMaCoin.balanceOf(employee1.address);
            expect(balance).to.equal(ethers.parseEther("1000"));
        });

        it("should reject non-owner minting", async function () {
            await expect(
                niuMaCoin.connect(employee1).mint(employee1.address, ethers.parseEther("1000"))
            ).to.be.reverted;
        });
    });

    describe("DailyPOAP (Attendance)", function () {
        it("should allow clock-in and mint POAP", async function () {
            await dailyPOAP.connect(employee1).clockIn();
            const dayId = await dailyPOAP.getTodayId();
            const balance = await dailyPOAP.balanceOf(employee1.address, dayId);
            expect(balance).to.equal(1);
        });

        it("should prevent double clock-in", async function () {
            await dailyPOAP.connect(employee1).clockIn();
            await expect(
                dailyPOAP.connect(employee1).clockIn()
            ).to.be.revertedWith("POAP: already clocked in today, no double overtime");
        });

        it("should track clock-in count", async function () {
            await dailyPOAP.connect(employee1).clockIn();
            expect(await dailyPOAP.totalClockIns(employee1.address)).to.equal(1);
        });

        it("should allow deposit and withdrawal", async function () {
            await dailyPOAP.connect(employee1).deposit({ value: ethers.parseEther("0.01") });
            expect(await dailyPOAP.deposits(employee1.address)).to.equal(ethers.parseEther("0.01"));

            await dailyPOAP.connect(employee1).withdrawDeposit();
            expect(await dailyPOAP.deposits(employee1.address)).to.equal(0);
        });
    });

    describe("BountyEscrow (Task System)", function () {
        const BOUNTY_AMOUNT = ethers.parseEther("1000");

        beforeEach(async function () {
            // Approve bounty escrow to spend owner's tokens
            await niuMaCoin.approve(await bountyEscrow.getAddress(), ethers.parseEther("10000000"));
        });

        it("should create a bounty with locked tokens", async function () {
            await bountyEscrow.createBounty("Fix the prod bug at 3 AM", BOUNTY_AMOUNT);
            const bounty = await bountyEscrow.getBounty(0);
            expect(bounty.creator).to.equal(owner.address);
            expect(bounty.amount).to.equal(BOUNTY_AMOUNT);
            expect(bounty.status).to.equal(0); // Open
        });

        it("should allow claiming and completing a bounty", async function () {
            await bountyEscrow.createBounty("Write unit tests (lol)", BOUNTY_AMOUNT);

            // Employee claims
            await bountyEscrow.connect(employee1).claimBounty(0);
            let bounty = await bountyEscrow.getBounty(0);
            expect(bounty.worker).to.equal(employee1.address);
            expect(bounty.status).to.equal(1); // Claimed

            // Owner completes
            const balanceBefore = await niuMaCoin.balanceOf(employee1.address);
            await bountyEscrow.completeBounty(0);
            const balanceAfter = await niuMaCoin.balanceOf(employee1.address);
            expect(balanceAfter - balanceBefore).to.equal(BOUNTY_AMOUNT);
        });

        it("should allow cancelling an open bounty", async function () {
            await bountyEscrow.createBounty("Optional: add dark mode", BOUNTY_AMOUNT);
            const balanceBefore = await niuMaCoin.balanceOf(owner.address);
            await bountyEscrow.cancelBounty(0);
            const balanceAfter = await niuMaCoin.balanceOf(owner.address);
            expect(balanceAfter - balanceBefore).to.equal(BOUNTY_AMOUNT);
        });

        it("should reject self-claiming", async function () {
            await bountyEscrow.createBounty("Self-serve bounty", BOUNTY_AMOUNT);
            await expect(
                bountyEscrow.claimBounty(0)
            ).to.be.revertedWith("Bounty: can't claim your own bounty, nice try boss");
        });
    });

    describe("DegenOffice (Main Controller)", function () {
        it("should register employee", async function () {
            await degenOffice.connect(employee1).register();
            expect(await degenOffice.isRegistered(employee1.address)).to.be.true;
        });

        it("should reject double registration", async function () {
            await degenOffice.connect(employee1).register();
            await expect(
                degenOffice.connect(employee1).register()
            ).to.be.revertedWith("Office: already registered, no double employment");
        });

        it("should assign Employee role to funded wallet", async function () {
            // employee1 has ETH from hardhat default
            const roleName = await degenOffice.getRoleName(employee1.address);
            expect(roleName).to.include("员工");
        });

        it("should accept ETH deposits to company fund", async function () {
            await degenOffice.depositFund({ value: ethers.parseEther("1.0") });
            expect(await degenOffice.totalFunding()).to.equal(ethers.parseEther("1.0"));
        });

        it("should execute rug pull", async function () {
            // Fund the contract
            await degenOffice.depositFund({ value: ethers.parseEther("1.0") });

            const balanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await degenOffice.rugPull();
            const receipt = await tx.wait();
            const balanceAfter = await ethers.provider.getBalance(owner.address);

            expect(await degenOffice.hasRugPulled()).to.be.true;
            // Owner should have received the ETH (minus gas)
            expect(balanceAfter).to.be.gt(balanceBefore - ethers.parseEther("0.01"));
        });

        it("should reject double rug pull", async function () {
            await degenOffice.rugPull();
            await expect(
                degenOffice.rugPull()
            ).to.be.revertedWith("Office: already rug pulled, can't rug twice");
        });

        it("should reject rug pull from non-owner", async function () {
            await expect(
                degenOffice.connect(employee1).rugPull()
            ).to.be.reverted;
        });
    });
});
