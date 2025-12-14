import { ethers } from "hardhat";

async function main() {
  console.log("=== 🚀 MULAI SIMULASI CHAINVOICE (Stable V2) ===");

  const [admin, umkm, investorA, investorB, oracle] = await ethers.getSigners();
  console.log(`- UMKM: ${umkm.address}`);
  console.log(`- Oracle: ${oracle.address}`);

  const token = await ethers.deployContract("IDRToken");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ Token IDRS Deployed: ${tokenAddress}`);

  const lending = await ethers.deployContract("InvoiceLending", [tokenAddress, oracle.address]);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log(`✅ Lending App Deployed: ${lendingAddress}`);

  await token.faucet(investorA.address, ethers.parseEther("100000000"));
  await token.faucet(investorB.address, ethers.parseEther("50000000"));
  await token.faucet(umkm.address, ethers.parseEther("10000000"));
  console.log("💰 Modal Distributed");

  console.log("\n--- [Step 1] UMKM Mengajukan Pinjaman ---");
  const loanAmt = ethers.parseEther("100000000");
  await lending.connect(umkm).createLoanRequest(loanAmt, 10, "QmHashIPFS_Dummy");
  console.log("📝 Loan Created");

  console.log("\n--- [Step 2] Oracle Verifikasi ---");
  await lending.connect(oracle).verifyLoan(1, true);
  console.log("🔍 Verified (OPEN)");

  console.log("\n--- [Step 3] Crowdfunding ---");
  await token.connect(investorA).approve(lendingAddress, ethers.parseEther("70000000"));
  await lending.connect(investorA).fundLoan(1, ethers.parseEther("70000000"));
  console.log("💸 Investor A: 70 Juta");

  await token.connect(investorB).approve(lendingAddress, ethers.parseEther("30000000"));
  await lending.connect(investorB).fundLoan(1, ethers.parseEther("30000000"));
  console.log("💸 Investor B: 30 Juta");

  console.log("\n--- [Step 4] Pencairan ---");
  const awal = await token.balanceOf(umkm.address);
  await lending.connect(umkm).withdrawFunds(1);
  const akhir = await token.balanceOf(umkm.address);
  console.log(`🎉 Dana Cair: ${ethers.formatEther(akhir - awal)} IDRS`);

  console.log("\n--- [Step 5] Pelunasan ---");
  await token.faucet(umkm.address, ethers.parseEther("110000000")); 
  await token.connect(umkm).approve(lendingAddress, ethers.parseEther("110000000"));
  await lending.connect(umkm).repayLoan(1);
  console.log("🤝 Hutang Lunas!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});