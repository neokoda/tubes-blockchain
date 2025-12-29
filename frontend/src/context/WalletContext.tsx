import { ethers } from "ethers";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { IDRS_ABI, IDRS_CONTRACT_ADDRESS } from "../config";

interface WalletContextType {
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: string | null;
  refreshBalance: () => Promise<void>;
  mintToken: (amount: string) => Promise<void>;
  provider: ethers.BrowserProvider | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const fetchTokenBalance = useCallback(async (addr: string) => {
    if (typeof window.ethereum !== "undefined" && addr) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        if (!ethers.isAddress(IDRS_CONTRACT_ADDRESS)) {
          console.warn("Invalid Contract Address in config.ts");
          return;
        }

        const contract = new ethers.Contract(
          IDRS_CONTRACT_ADDRESS,
          IDRS_ABI,
          provider
        );

        const rawBalance = await contract.balanceOf(addr);
        const formattedBalance = ethers.formatUnits(rawBalance, 18);
        setBalance(formattedBalance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setBalance("0");
      }
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          setProvider(providerInstance);

          const accounts = await providerInstance.listAccounts();
          if (accounts.length > 0) {
            const currentAddress = accounts[0].address;
            setAddress(currentAddress);
            await fetchTokenBalance(currentAddress);

            const network = await providerInstance.getNetwork();
            setChainId(network.chainId.toString());
          }

          window.ethereum.on("accountsChanged", (accounts: string[]) => {
            if (accounts.length === 0) {
              disconnectWallet();
            } else {
              setAddress(accounts[0]);
              fetchTokenBalance(accounts[0]);
            }
          });

          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [fetchTokenBalance]);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not found! Please install it.");
      return;
    }

    setIsConnecting(true);
    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);

      const accounts = await providerInstance.send("eth_requestAccounts", []);

      const currentAddress = accounts[0];
      setAddress(currentAddress);
      await fetchTokenBalance(currentAddress);

      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error("Failed to connect wallet: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance("0");
    setChainId(null);
    setProvider(null);

    toast.info("Wallet disconnected");
  };

  const mintToken = async (amountStr: string) => {
    console.log("🚀 === MINT TOKEN DEBUG START ===");
    console.log("📍 Contract Address:", IDRS_CONTRACT_ADDRESS);
    console.log("📍 Your Address:", address);
    console.log("💰 Amount to Mint:", amountStr);
    
    if (!address) {
      console.error("❌ No address connected!");
      toast.error("Please connect your wallet first!");
      return;
    }

    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const network = await providerInstance.getNetwork();
      
      console.log("🌐 Current Network:");
      console.log("   - Chain ID:", network.chainId.toString());
      console.log("   - Chain Name:", network.name);
      console.log("   - Expected: 31337 (Hardhat Local)");
      
      // Check if on correct network
      if (network.chainId !== 31337n) {
        const errorMsg = `Wrong network! You're on chain ${network.chainId}. Please switch to Hardhat Local (Chain ID: 31337)`;
        console.error("❌", errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      console.log("✅ Network check passed!");
      
      if (!ethers.isAddress(IDRS_CONTRACT_ADDRESS)) {
        console.error("❌ Invalid contract address:", IDRS_CONTRACT_ADDRESS);
        toast.error("Invalid contract address in config!");
        return;
      }
      console.log("✅ Contract address is valid");

      const signer = await providerInstance.getSigner();
      console.log("✅ Signer obtained:", await signer.getAddress());
      
      const contract = new ethers.Contract(
        IDRS_CONTRACT_ADDRESS,
        IDRS_ABI,
        signer
      );
      console.log("✅ Contract instance created");

      const code = await providerInstance.getCode(IDRS_CONTRACT_ADDRESS);
      if (code === "0x") {
        console.error("❌ No contract found at address:", IDRS_CONTRACT_ADDRESS);
        toast.error("Contract not deployed at this address! Did you deploy the contracts?");
        return;
      }
      console.log("✅ Contract exists at address");

      const amountInWei = ethers.parseUnits(amountStr, 18);
      console.log("💸 Amount in Wei:", amountInWei.toString());

      toast.loading("Minting IDRS Tokens...", { id: "minting" });

      console.log("📤 Calling faucet function...");
      console.log("   - To:", address);
      console.log("   - Amount:", amountInWei.toString());

      const tx = await contract.faucet(address, amountInWei);
      console.log("✅ Transaction sent!");
      console.log("   - Hash:", tx.hash);
      
      toast.loading("Waiting for confirmation...", { id: "minting" });
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed!");
      console.log("   - Block:", receipt.blockNumber);
      console.log("   - Gas Used:", receipt.gasUsed.toString());

      toast.dismiss("minting");
      toast.success(`Successfully minted ${amountStr} IDRS!`);

      console.log("🔄 Refreshing balance...");
      await fetchTokenBalance(address);
      console.log("✅ Balance refreshed");
      
      console.log("🎉 === MINT TOKEN SUCCESS ===");
    } catch (error: any) {
      console.error("❌ === MINT TOKEN ERROR ===");
      console.error("Error Type:", error.constructor.name);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      console.error("Full Error:", error);
      
      if (error.code === "ACTION_REJECTED") {
        console.error("❌ User rejected transaction");
        toast.dismiss("minting");
        toast.error("Transaction rejected by user");
      } else if (error.code === "NETWORK_ERROR") {
        console.error("❌ Network error - is Hardhat node running?");
        toast.dismiss("minting");
        toast.error("Network error. Is Hardhat node running?");
      } else if (error.code === "CALL_EXCEPTION") {
        console.error("❌ Contract call failed");
        console.error("Reason:", error.reason);
        toast.dismiss("minting");
        toast.error(`Contract error: ${error.reason || "Unknown error"}`);
      } else if (error.message?.includes("insufficient funds")) {
        console.error("❌ Insufficient ETH for gas");
        toast.dismiss("minting");
        toast.error("Insufficient ETH for gas fees");
      } else {
        console.error("❌ Unknown error");
        toast.dismiss("minting");
        toast.error(`Minting failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("=== END ERROR LOG ===");
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected: !!address,
        isConnecting,
        connectWallet,
        disconnectWallet,
        chainId,
        refreshBalance: () =>
          address ? fetchTokenBalance(address) : Promise.resolve(),
        mintToken,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}