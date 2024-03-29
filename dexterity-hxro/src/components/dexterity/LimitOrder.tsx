import React, { FC, useState, useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useManifest,
  useTrader,
  useProduct,
} from "contexts/DexterityProviders";
import { notify } from "../../utils/notifications";
import { PublicKey } from "@solana/web3.js";
import Button from "../Button";
import { useNetworkConfiguration } from "contexts/NetworkConfigurationProvider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { dexterity } from "utils/dexterityTypes";

export const PlaceLimitOrder: FC = () => {
  const { publicKey } = useWallet();
  const { manifest } = useManifest();
  const { trader } = useTrader();
  const { selectedProduct } = useProduct();
  const [price, setPrice] = useState<number | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"Long" | "Short" | "None">("None");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const { networkConfiguration } = useNetworkConfiguration();
  const network = networkConfiguration as WalletAdapterNetwork;

  const callbacks = {
    onGettingBlockHashFn: () => {},
    onGotBlockHashFn: () => {},
    onConfirm: (txn: string) =>
      notify({
        type: "success",
        message: "Order Placed Successfully!",
        txid: txn,
      }),
  };

  const handlePlaceOrder = useCallback(async () => {
    if (!price || !size || !publicKey || !manifest || !selectedProduct) return;

    const priceFraction = dexterity.Fractional.New(price, 0);
    const sizeFraction = dexterity.Fractional.New(
      size * 10 ** selectedProduct.exponent,
      selectedProduct.exponent,
    );
    const referralTrg =
      network === "devnet"
        ? process.env.NEXT_PUBLIC_REFERRER_TRG_DEVNET!
        : process.env.NEXT_PUBLIC_REFERRER_TRG_MAINNET!;
    const referralFee = process.env.NEXT_PUBLIC_REFERRER_BPS;

    try {
      setIsLoading(true);

      // Get new order instruction
      const orderIx = trader.getNewOrderIx(
        selectedProduct.index,
        orderType === "Short" ? false : true,
        priceFraction,
        sizeFraction,
        false,
        referralTrg ? new PublicKey(referralTrg) : null,
        referralFee ? Number(referralFee) : null,
        null,
        null,
      );

      // Get Products array
      const products = Array.from(
        dexterity.Manifest.GetProductsOfMPG(trader.mpg),
      );

      // Get Update Products Mark Prices instruction
      const updateMarkIx = trader.getUpdateMarkPricesIx(products);

      // Submit the bundled instruction
      // (updateMarkIx has to be first in the array)
      await trader.sendTx([updateMarkIx, orderIx], null);

      setIsSuccess(true);
    } catch (error: any) {
      setIsSuccess(false);
      notify({
        type: "error",
        message: "Placing order failed!",
        description: error?.message,
      });
      console.error(error);
    } finally {
      notify({
        type: "success",
        message: `Limit ${orderType} Order Placed Successfully!`,
      });
      setIsLoading(false);
    }
  }, [price, size, orderType, publicKey, manifest, trader, selectedProduct]);

  const isFormValid = useMemo(
    () => price !== null && size !== null && orderType !== "None",
    [price, size, orderType],
  );

  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-white p-4">
      <h1 className="mb-4 text-2xl">Place a Limit Order</h1>

      <div className="flex w-full flex-col items-center">
        <label htmlFor="priceInput" className="mb-1 text-xl font-semibold">
          Price
        </label>
        <input
          id="priceInput"
          type="number"
          placeholder="Price"
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          className="mb-4 w-full rounded-md border border-gray-300 p-2 text-xl text-black"
          aria-label="Enter the price for the order"
        />
      </div>

      <div className="flex w-full flex-col items-center">
        <label htmlFor="sizeInput" className="mb-1 text-xl font-semibold">
          Size
        </label>
        <input
          id="sizeInput"
          type="number"
          placeholder="Size"
          onChange={(e) => setSize(parseFloat(e.target.value))}
          className="mb-4 w-full rounded-md border border-gray-300 p-2 text-xl text-black"
          aria-label="Enter the size for the order"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div
          className={`p-2 pl-8 pr-8 ${orderType === "Long" ? "bg-[#80ff7d]" : "bg-gray-200"}`}
        >
          <label
            className="text-xl font-semibold text-white"
            htmlFor="isLongCheckbox"
          >
            <input
              id="isLongCheckbox"
              type="checkbox"
              className="hidden"
              checked={orderType === "Long"}
              onChange={() =>
                setOrderType(orderType === "Long" ? "None" : "Long")
              }
            />
            Long
          </label>
        </div>
        <div
          className={`p-2 pl-8 pr-8 ${orderType === "Short" ? "bg-[#ff80f2]" : "bg-gray-200"}`}
        >
          <label
            className="text-xl font-semibold text-white"
            htmlFor="isShortCheckbox"
          >
            <input
              id="isShortCheckbox"
              type="checkbox"
              className="hidden"
              checked={orderType === "Short"}
              onChange={() =>
                setOrderType(orderType === "Short" ? "None" : "Short")
              }
            />
            Short
          </label>
        </div>
      </div>

      <Button
        text="🛒 Place Limit Order"
        onClick={handlePlaceOrder}
        disabled={!isFormValid}
        className={
          isFormValid
            ? "mt-4 bg-gradient-to-br from-[#80ff7d] to-[#80ff7d] text-black hover:from-white hover:to-purple-300"
            : ""
        }
        status={isSuccess ? "success" : "failed"}
      />
    </div>
  );
};
