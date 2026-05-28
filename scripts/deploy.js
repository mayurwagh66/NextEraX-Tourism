// Deployment script for NexteraX contracts
import pkg from "hardhat"; // Import default export
const { ethers } = pkg; // Destructure ethers from the default export

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Manage nonces explicitly to avoid gapped-nonce errors
  let nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");

  // Deploy NexteraXToken
  const NexteraXToken = await ethers.getContractFactory("NexteraXToken");
  const nexteraXToken = await NexteraXToken.deploy(deployer.address, { nonce: nextNonce++ });
  await nexteraXToken.waitForDeployment();

  console.log("NexteraXToken deployed to:", await nexteraXToken.getAddress());

  // Deploy SoulboundNFT
  const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
  const soulboundNFT = await SoulboundNFT.deploy(deployer.address, { nonce: nextNonce++ });
  await soulboundNFT.waitForDeployment();

  console.log("SoulboundNFT deployed to:", await soulboundNFT.getAddress());

  // Deploy PlatformCore
  const PlatformCore = await ethers.getContractFactory("PlatformCore");
  const platformCore = await PlatformCore.deploy(deployer.address, await soulboundNFT.getAddress(), { nonce: nextNonce++ });
  await platformCore.waitForDeployment();

  console.log("PlatformCore deployed to:", await platformCore.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });