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
    if (!address) {
      toast.error("Please connect your wallet first!");
      return;
    }

    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const network = await providerInstance.getNetwork();
      
      if (network.chainId !== 31337n) {
        toast.error(`Wrong network! You're on chain ${network.chainId}. Please switch to Hardhat Local (Chain ID: 31337)`);
        return;
      }
      
      if (!ethers.isAddress(IDRS_CONTRACT_ADDRESS)) {
        toast.error("Invalid contract address in config!");
        return;
      }

      const signer = await providerInstance.getSigner();
      
      const contract = new ethers.Contract(
        IDRS_CONTRACT_ADDRESS,
        IDRS_ABI,
        signer
      );

      const code = await providerInstance.getCode(IDRS_CONTRACT_ADDRESS);
      if (code === "0x") {
        toast.error("Contract not deployed at this address! Did you deploy the contracts?");
        return;
      }

      const amountInWei = ethers.parseUnits(amountStr, 18);

      toast.loading("Minting IDRS Tokens...", { id: "minting" });

      const tx = await contract.faucet(address, amountInWei);
      
      toast.loading("Waiting for confirmation...", { id: "minting" });
      
      const receipt = await tx.wait();
      toast.dismiss("minting");
      toast.success(`Successfully minted ${amountStr} IDRS!`);

      await fetchTokenBalance(address);
      
    } catch (error: any) {
      if (error.code === "ACTION_REJECTED") {
        toast.dismiss("minting");
        toast.error("Transaction rejected by user");
      } else if (error.code === "NETWORK_ERROR") {
        toast.dismiss("minting");
        toast.error("Network error. Is Hardhat node running?");
      } else if (error.code === "CALL_EXCEPTION") {
        toast.dismiss("minting");
        toast.error(`Contract error: ${error.reason || "Unknown error"}`);
      } else if (error.message?.includes("insufficient funds")) {
        toast.dismiss("minting");
        toast.error("Insufficient ETH for gas fees");
      } else {
        toast.dismiss("minting");
        toast.error(`Minting failed: ${error.message || "Unknown error"}`);
      }
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