import { useProduct, useTrader } from "contexts/DexterityProviders";
import { FC, useEffect } from "react";
import { formatPubKey, handleCopy } from "utils/util";
import { notify } from "utils/notifications";

export const DefaultInfo: FC = () => {
  const { mpgPubkey, selectedProduct } = useProduct();

  useEffect(() => {}, [mpgPubkey, selectedProduct]);

  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-semibold">Default Values</h2>
      <div className="flex w-full flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-x-6 md:space-y-0">
        <div className="flex flex-row items-center space-x-2">
          <span className="text-lg font-semibold">Mpg PubKey:</span>
          <div>
            <span className="text-base text-gray-600">
              {formatPubKey(mpgPubkey)}
            </span>
            <span
              className="ml-5 cursor-pointer"
              onClick={() => {
                handleCopy(mpgPubkey, "Mpg Pubkey");
              }}
            >
              📋
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center space-x-2">
          <span className="text-lg font-semibold">Product:</span>
          <span className="text-base text-gray-600">
            {selectedProduct.name}
          </span>
        </div>
        <div className="flex flex-row items-center space-x-2">
          <span className="text-lg font-semibold">Min. Trade Size:</span>
          <span className="text-base text-gray-600">
            {selectedProduct.minSize}
          </span>
        </div>
      </div>
    </div>
  );
};
