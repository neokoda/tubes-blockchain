export const IDRS_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const IDRS_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  "function transfer(address to, uint amount) returns (bool)",
  "function faucet(address to, uint256 amount) public",
];