import { ethers } from "hardhat";

async function main() {
  const LENDING_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

  const lending = await ethers.getContractAt("InvoiceLending", LENDING_CONTRACT_ADDRESS);
  console.log(`\n📡 Reading from: ${LENDING_CONTRACT_ADDRESS}...`);

  let id = 1;
  let looping = true;

  console.log("\n================ DAFTAR PINJAMAN ================");

  while (looping) {
    try {
      const loan = await lending.loans(id);

      if (loan.borrower === "0x0000000000000000000000000000000000000000") {
        looping = false;
        break; 
      }

      const amountReq = ethers.formatEther(loan.amountRequested);
      const amountFund = ethers.formatEther(loan.amountFunded);
      const statusMap = ["PENDING", "OPEN", "ACTIVE", "CLOSED"];
      const statusText = statusMap[Number(loan.state)];

      console.log(`\n🆔 LOAN ID: ${id}`);
      console.log(`   👤 Borrower: ${loan.borrower}`);
      console.log(`   💰 Request : ${amountReq} IDRS`);
      console.log(`   📊 Status  : ${statusText} (${loan.state})`);
      
      id++; 
    } catch (error) {
      looping = false;
    }
  }

  console.log("\n=================== SELESAI ===================");
  console.log(`Total ditemukan: ${id - 1} pinjaman.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});