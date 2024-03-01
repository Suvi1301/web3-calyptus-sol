import React, { FC, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useManifest,
  useTrader,
  useProduct,
} from "contexts/DexterityProviders";
import { notify } from "../../utils/notifications";
import { PublicKey } from "@solana/web3.js";
import { dexterity } from "utils/dexterityTypes";

export const FundingTrader: FC = () => {
  const { publicKey } = useWallet();
  const { manifest } = useManifest();
  const { trader } = useTrader();
  const { selectedProduct } = useProduct();
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [depositStatus, setDepositStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [withdrawStatus, setWithdrawStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");

  const handleDeposit = useCallback(async () => {
    if (!amount || !publicKey || !manifest) return;
    try {
      // Deposit
    } catch (error: any) {
      setDepositStatus("failed");
      notify({
        type: "error",
        message: "Deposit failed!",
        description: error?.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, publicKey, manifest, trader, selectedProduct]);

  const handleWithdraw = useCallback(async () => {
    if (!amount || !publicKey || !manifest) return;
    try {
      // Withdraw
    } catch (error: any) {
      setWithdrawStatus("failed");
      notify({
        type: "error",
        message: "Withdrawal failed!",
        description: error?.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, publicKey, manifest, trader, selectedProduct]);

  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-white p-4">
      <h1 className="mb-4 text-2xl">Funding Trader Account</h1>

      <div className="mb-6 mt-20 flex w-full flex-col items-center">
        <label htmlFor="amountInput" className="mb-1 text-xl font-semibold">
          Amount
        </label>
        <input
          id="amountInput"
          type="number"
          placeholder="Amount"
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          className="w-full rounded-md border border-gray-300 p-2 text-xl text-black"
          aria-label="Enter the amount for deposit or withdraw"
        />
      </div>

      <div className="mt-12 flex w-full justify-center space-x-4">
        <button
          onClick={handleDeposit}
          className={`text-md w-30 btn group m-2 ${amount !== null ? "bg-gradient-to-br  from-[#80ff7d] to-[#80ff7d] text-black hover:from-white hover:to-purple-300" : "cursor-not-allowed bg-gray-300"}`}
          disabled={amount === null || isLoading}
        >
          {isLoading && depositStatus === "processing"
            ? "Processing..."
            : depositStatus === "success"
              ? "Success!"
              : depositStatus === "failed"
                ? "Failed!"
                : "🏦 Deposit"}
        </button>

        <button
          onClick={handleWithdraw}
          className={`text-md w-30 btn group m-2 ${amount !== null ? "bg-gradient-to-br from-[#ff80f2] to-[#ff80f2] text-black hover:from-white hover:to-purple-300" : "cursor-not-allowed bg-gray-300"}`}
          disabled={amount === null || isLoading}
        >
          {isLoading && withdrawStatus === "processing"
            ? "Processing..."
            : withdrawStatus === "success"
              ? "Success!"
              : withdrawStatus === "failed"
                ? "Failed!"
                : "💸 Withdraw"}
        </button>
      </div>
    </div>
  );
};
