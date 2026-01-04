import { ethers } from "hardhat";

async function main() {
  console.log("=== MULAI SIMULASI CHAINVOICE (Stable V2) ===");

  const [admin, umkm, investorA, investorB, oracle] = await ethers.getSigners();
  console.log(`- UMKM: ${umkm.address}`);
  console.log(`- Oracle: ${oracle.address}`);

  const token = await ethers.deployContract("IDRToken");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`Token IDRS Deployed: ${ethers.getAddress(tokenAddress)}`);

  const lending = await ethers.deployContract("InvoiceLending", [tokenAddress, oracle.address]);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log(`Lending App Deployed: ${lendingAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});