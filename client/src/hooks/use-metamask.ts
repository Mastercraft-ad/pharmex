import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { useToast } from './use-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MetaMaskState {
  account: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState(prev => ({ ...prev, account: null, isConnected: false }));
      } else {
        setState(prev => ({ ...prev, account: accounts[0], isConnected: true }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState(prev => ({ ...prev, chainId }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask browser extension to continue.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, error: "MetaMask not installed" }));
      return null;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const account = accounts[0];
      const network = await provider.getNetwork();
      
      setState({
        account,
        chainId: network.chainId.toString(),
        isConnected: true,
        isConnecting: false,
        error: null,
      });

      return account;
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      let errorMessage = "Failed to connect wallet";
      
      if (error.code === 4001) {
        errorMessage = "Connection request rejected";
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending";
      }

      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: errorMessage 
      }));

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!window.ethereum || !state.account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return null;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      return signature;
    } catch (error: any) {
      console.error("Signature error:", error);
      let errorMessage = "Failed to sign message";
      
      if (error.code === 4001) {
        errorMessage = "Signature request rejected";
      }

      toast({
        title: "Signature Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [state.account, toast]);

  const disconnect = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    connectWallet,
    signMessage,
    disconnect,
  };
}
