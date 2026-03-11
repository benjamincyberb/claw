const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying Degen-Office contracts...");
    console.log("📍 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("---");

    // 1. Deploy XDOGCoin ($XDOG)
    console.log("📦 Deploying XDOGCoin ($XDOG)...");
    const XDOGCoin = await ethers.getContractFactory("XDOGCoin");
    const XDOGCoin = await XDOGCoin.deploy();
    await XDOGCoin.waitForDeployment();
    const XDOGAddress = await XDOGCoin.getAddress();
    console.log("✅ XDOGCoin deployed to:", XDOGAddress);

    // 2. Deploy DailyPOAP
    console.log("📦 Deploying DailyPOAP...");
    const DailyPOAP = await ethers.getContractFactory("DailyPOAP");
    const dailyPOAP = await DailyPOAP.deploy("https://degen-office.meme/poap/");
    await dailyPOAP.waitForDeployment();
    const poapAddress = await dailyPOAP.getAddress();
    console.log("✅ DailyPOAP deployed to:", poapAddress);

    // 3. Deploy BountyEscrow
    console.log("📦 Deploying BountyEscrow...");
    const BountyEscrow = await ethers.getContractFactory("BountyEscrow");
    const bountyEscrow = await BountyEscrow.deploy(XDOGAddress);
    await bountyEscrow.waitForDeployment();
    const bountyAddress = await bountyEscrow.getAddress();
    console.log("✅ BountyEscrow deployed to:", bountyAddress);

    // 4. Deploy DegenOffice
    // Using zero addresses for NFT contracts (can be updated later via setNFTContracts)
    console.log("📦 Deploying DegenOffice...");
    const DegenOffice = await ethers.getContractFactory("DegenOffice");
    const degenOffice = await DegenOffice.deploy(
        XDOGAddress,
        ethers.ZeroAddress, // BAYC testnet (set later)
        ethers.ZeroAddress  // Pudgy testnet (set later)
    );
    await degenOffice.waitForDeployment();
    const officeAddress = await degenOffice.getAddress();
    console.log("✅ DegenOffice deployed to:", officeAddress);

    // Save deployed addresses
    const addresses = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        contracts: {
            XDOGCoin: XDOGAddress,
            DailyPOAP: poapAddress,
            BountyEscrow: bountyAddress,
            DegenOffice: officeAddress
        }
    };

    const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
    console.log("\n📄 Addresses saved to deployed-addresses.json");

    console.log("\n🎉 Degen-Office deployment complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("XDOGCoin:    ", XDOGAddress);
    console.log("DailyPOAP:    ", poapAddress);
    console.log("BountyEscrow: ", bountyAddress);
    console.log("DegenOffice:  ", officeAddress);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
