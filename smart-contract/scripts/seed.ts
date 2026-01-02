import { ethers } from "hardhat";

async function main() {
  const [owner, umkm, investorA, investorB, oracle] = await ethers.getSigners();

  const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LENDING_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const token = await ethers.getContractAt("IDRToken", TOKEN_ADDRESS);
  const lending = await ethers.getContractAt("InvoiceLending", LENDING_ADDRESS);

  const loanAmt = ethers.parseEther("100000000");
  const duration = 30 * 24 * 60 * 60;

  console.log("📝 Creating loan request...");
  await lending.connect(umkm).createLoanRequest(
    loanAmt,
    1000,
    duration,
    "QmDummyIPFS",
    "DUMMY-INV-002"
  );

  const nextId = await lending.nextLoanId();
  const loanId = nextId - 1n;
  console.log("🆕 New Loan ID:", loanId.toString());

  console.log("🔍 Verifying loan with oracle...");
  await lending.connect(oracle).verifyLoan(loanId, true);
  console.log("✅ Loan verified - status should be OPEN");

  const loanAfterVerify = await lending.loans(loanId);
  console.log("📊 Loan state after verify:", loanAfterVerify.state.toString());

  console.log("💰 Funding investorA with tokens...");
  await token.faucet(investorA.address, ethers.parseEther("50000000"));

  console.log("✅ Approving tokens...");
  await token.connect(investorA).approve(LENDING_ADDRESS, ethers.parseEther("40000000"));

  console.log("💸 Funding loan with 40M...");
  await lending.connect(investorA).fundLoan(loanId, ethers.parseEther("40000000"));

  const finalLoan = await lending.loans(loanId);
  console.log("📊 Final loan state:", finalLoan.state.toString());
  console.log("✅ Loan created - 40M funded, 60M remaining");
}

main().catch(console.error);