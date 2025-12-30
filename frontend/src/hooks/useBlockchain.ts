// useBlockchain.ts
import { ethers } from "ethers";
import { useEffect, useState } from "react";

const LENDING_CONTRACT_ADDRESS = import.meta.env.VITE_INVOICE_LENDING_ADDRESS;
const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_IDRS_CONTRACT_ADDRESS;

const LENDING_ABI = [
    "function nextLoanId() view returns (uint256)",
    "function loans(uint256) view returns (uint256 id, address borrower, uint256 amountRequested, uint256 amountFunded, string ipfsHash, string invoiceNumber, uint256 interestRate, uint8 state)",
    "function fundLoan(uint256 _loanId, uint256 _amount) external",
    "function createLoanRequest(uint256 _amount, uint256 _interest, string memory _ipfsHash, string memory _invoiceNumber) external",
    "function withdrawFunds(uint256 _loanId) external",
    "function repayLoan(uint256 _loanId) external",
    "function getInvestors(uint256 _loanId) view returns (address[])",
    "event LoanCreated(uint256 loanId, address borrower, uint256 amount, string invoiceNumber)",
    "event Funded(uint256 loanId, address investor, uint256 amount)",
    "event Disbursed(uint256 loanId, uint256 amount)",
    "event Repaid(uint256 loanId, uint256 amount)"
  ];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function faucet(address to, uint256 amount) external"
];

export const useBlockchain = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [lendingContract, setLendingContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
      
      checkConnection(prov);
    }
  }, []);

  const checkConnection = async (prov: ethers.BrowserProvider) => {
    try {
      const accounts = await prov.listAccounts();
      if (accounts.length > 0) {
        const sign = await prov.getSigner();
        const addr = await sign.getAddress();
        
        setSigner(sign);
        setAccount(addr);
        setIsConnected(true);

        const lending = new ethers.Contract(LENDING_CONTRACT_ADDRESS, LENDING_ABI, sign);
        const token = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, sign);
        
        setLendingContract(lending);
        setTokenContract(token);

      }
    } catch (error) {
      console.log("No existing connection");
    }
  };

  const connectWallet = async () => {
    try {
      if (!provider) throw new Error("No provider found");
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const sign = await provider.getSigner();
      const addr = await sign.getAddress();
      
      setSigner(sign);
      setAccount(addr);
      setIsConnected(true);

      const lending = new ethers.Contract(LENDING_CONTRACT_ADDRESS, LENDING_ABI, sign);
      const token = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, sign);
      
      setLendingContract(lending);
      setTokenContract(token);

      return addr;
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setSigner(null);
    setAccount("");
    setIsConnected(false);
    setLendingContract(null);
    setTokenContract(null);
  };

  const fetchLoans = async () => {
    try {
      if (!provider) throw new Error("No provider");
  
      const readOnlyContract = new ethers.Contract(
        LENDING_CONTRACT_ADDRESS,
        LENDING_ABI,
        provider
      );
  
      const loanCounter = await readOnlyContract.nextLoanId();
      
      const loans = [];
  
      for (let id = 1; id < Number(loanCounter); id++) {
        try {
          const loan = await readOnlyContract.loans(id);
          
          if (loan.borrower === ethers.ZeroAddress) {
            continue;
          }
  
          let investors: string[] = [];
          try {
            investors = await readOnlyContract.getInvestors(id);
          } catch (e) {
            console.log(`Could not fetch investors for loan ${id}`);
          }
  
          const statusMap = ["pending", "open", "active", "closed"];
          
          loans.push({
            id: id.toString(),
            borrowerAddress: loan.borrower,
            amount: parseFloat(ethers.formatEther(loan.amountRequested)),
            fundedAmount: parseFloat(ethers.formatEther(loan.amountFunded)),
            interestRate: Number(loan.interestRate),
            duration: 30,
            status: statusMap[Number(loan.state)],
            ipfsHash: loan.ipfsHash,
            invoiceNumber: loan.invoiceNumber,
            investors: investors
          });
        } catch (error) {
          console.error(`❌ Error fetching loan ${id}:`, error);
        }
      }
      return loans;
    } catch (error) {
      console.error("❌ Error fetching loans:", error);
      return [];
    }
  };

  const fundLoan = async (loanId: string, amount: number) => {
    try {
      if (!lendingContract || !tokenContract || !signer) {
        throw new Error("Wallet not connected");
      }

      const amountWei = ethers.parseEther(amount.toString());
      const allowance = await tokenContract.allowance(account, LENDING_CONTRACT_ADDRESS);
      
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(LENDING_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
      }

      const fundTx = await lendingContract.fundLoan(loanId, amountWei);
      const receipt = await fundTx.wait();
      
      return receipt;
    } catch (error) {
      console.error("Funding error:", error);
      throw error;
    }
  };

  const createLoan = async (amount: number, interestRate: number, ipfsHash: string, invoiceNumber: string) => {
    try {
      if (!lendingContract || !signer) {
        throw new Error("Wallet not connected");
      }

      const amountWei = ethers.parseEther(amount.toString());
      const tx = await lendingContract.createLoanRequest(
        amountWei,
        interestRate,
        ipfsHash,
        invoiceNumber
      );
      
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Create loan error:", error);
      throw error;
    }
  };

  const withdrawFunds = async (loanId: string) => {
    try {
      if (!lendingContract || !signer) {
        throw new Error("Wallet not connected");
      }

      const tx = await lendingContract.withdrawFunds(loanId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Withdrawal error:", error);
      throw error;
    }
  };

  const repayLoan = async (loanId: string) => {
    try {
      if (!lendingContract || !tokenContract || !signer) {
        throw new Error("Wallet not connected");
      }

      const loan = await lendingContract.loans(loanId);
      const totalRepayment = loan.amountRequested + 
        (loan.amountRequested * BigInt(loan.interestRate) / BigInt(100));

      const approveTx = await tokenContract.approve(LENDING_CONTRACT_ADDRESS, totalRepayment);
      await approveTx.wait();

      const tx = await lendingContract.repayLoan(loanId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Repayment error:", error);
      throw error;
    }
  };

  const getTokenBalance = async (address: string) => {
    try {
      if (!tokenContract) throw new Error("Token contract not initialized");
      
      const balance = await tokenContract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error("Balance error:", error);
      return 0;
    }
  };

  const claimFaucet = async (amount: number = 10000000) => {
    try {
      if (!tokenContract || !account) {
        throw new Error("Wallet not connected");
      }

      const network = await provider?.getNetwork();
      if (network?.chainId !== 31337n) {
        throw new Error(`Wrong network! You're on chain ${network?.chainId}, but need to be on Hardhat Local (31337)`);
      }

      const amountWei = ethers.parseEther(amount.toString());
      const tx = await tokenContract.faucet(account, amountWei);
      const receipt = await tx.wait();
      
      return receipt;
    } catch (error: any) {
      console.error("Faucet claim error:", error);
      throw error;
    }
  };

  return {
    provider,
    signer,
    account,
    isConnected,
    lendingContract,
    tokenContract,
    connectWallet,
    disconnectWallet,
    fetchLoans,
    fundLoan,
    createLoan,
    withdrawFunds,
    repayLoan,
    getTokenBalance,
    claimFaucet
  };
};