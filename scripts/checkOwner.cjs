require('dotenv').config();
const ethers = require('ethers');

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.argv[2];
  if (!rpcUrl) {
    console.error('Missing SEPOLIA_RPC_URL in .env');
    process.exit(1);
  }
  if (!contractAddress) {
    console.error('Usage: node scripts/checkOwner.cjs <contractAddress>');
    process.exit(1);
  }

  const ProviderCtor = (ethers.providers && ethers.providers.JsonRpcProvider) || ethers.JsonRpcProvider;
  const provider = new ProviderCtor(rpcUrl);
  const abi = ["function owner() view returns (address)"];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const owner = await contract.owner();
  console.log('owner()', owner);
}

main().catch((e) => { console.error(e); process.exit(1); });
