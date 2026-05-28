import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer, testGuide] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Test guide address:", testGuide.address);

  // Deploy NexteraXToken (needed for PlatformCore constructor, even if not used in registerGuide)
  const NexteraXToken = await ethers.getContractFactory("NexteraXToken");
  const nexteraXToken = await NexteraXToken.deploy(deployer.address);
  await nexteraXToken.waitForDeployment();
  const nexteraXTokenAddress = await nexteraXToken.getAddress();
  console.log("NexteraXToken deployed to:", nexteraXTokenAddress);

  // Deploy SoulboundNFT (needed for PlatformCore constructor)
  const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
  const soulboundNFT = await SoulboundNFT.deploy(deployer.address);
  await soulboundNFT.waitForDeployment();
  const soulboundNFTAddress = await soulboundNFT.getAddress();
  console.log("SoulboundNFT deployed to:", soulboundNFTAddress);

  // Deploy PlatformCore
  const PlatformCore = await ethers.getContractFactory("PlatformCore");
  const platformCore = await PlatformCore.deploy(deployer.address, soulboundNFTAddress, nexteraXTokenAddress);
  await platformCore.waitForDeployment();
  const platformCoreAddress = await platformCore.getAddress();
  console.log("PlatformCore deployed to:", platformCoreAddress);

  console.log("\nAttempting to register a guide...");

  try {
    // Connect PlatformCore with the testGuide's signer
    const platformCoreWithGuide = platformCore.connect(testGuide);

    const tx = await platformCoreWithGuide.registerGuide(
      "Test Guide Name",
      "Adventure Tours"
    );
    const receipt = await tx.wait();

    console.log("Guide registered successfully! Transaction hash:", receipt.hash);
    console.log("Guide address:", testGuide.address);

    const guideDetails = await platformCore.guides(testGuide.address);
    console.log("Guide details from contract:", guideDetails);

  } catch (error) {
    console.error("Failed to register guide locally:");
    console.error(error);
    // Hardhat will often provide a detailed revert reason in the error message
    if (error.reason) {
      console.error("Revert Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });









