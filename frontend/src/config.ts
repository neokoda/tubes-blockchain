export const IDRS_CONTRACT_ADDRESS = import.meta.env.VITE_IDRS_CONTRACT_ADDRESS;

export const IDRS_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function faucet(address to, uint256 amount) public",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export const INVOICE_LENDING_ADDRESS = import.meta.env.VITE_INVOICE_LENDING_ADDRESS;

export const INVOICE_LENDING_ABI = [
  "event LoanCreated(uint256 loanId, address borrower, uint256 amount, string invoiceNumber)",
  "event LoanVerified(uint256 loanId, bool isValid)",
  "event Funded(uint256 loanId, address investor, uint256 amount)",
  "event Disbursed(uint256 loanId, uint256 amount)",
  "event Repaid(uint256 loanId, uint256 amount)",
  "function nextLoanId() view returns (uint256)",
  "function token() view returns (address)",
  "function loans(uint256) view returns (uint256 id, address borrower, uint256 amountRequested, uint256 amountFunded, string ipfsHash, string invoiceNumber, uint256 interestRate, uint8 state, address[] investors)",
  "function createLoanRequest(uint256 _amount, uint256 _interest, string _ipfsHash, string _invoiceNumber) external",
  "function fundLoan(uint256 _loanId, uint256 _amount) external",
  "function withdrawFunds(uint256 _loanId) external",
  "function repayLoan(uint256 _loanId) external"
];