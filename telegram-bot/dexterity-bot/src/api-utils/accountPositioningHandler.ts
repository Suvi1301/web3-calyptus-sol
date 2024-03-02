import dexterity, { Trader } from "@hxronetwork/dexterity-ts";
import { TransactionInstruction } from "@solana/web3.js";

// orchestrates the process of aligning the users account positions
// with those of a copied trader based on a calculated positioning ratio.
export const accountPositioningHandler = async (
  AppState: Map<string, any>,
  copiedTrader: Trader,
  trader: Trader,
) => {
  const [traderInfo, copiedTraderInfo] = [
    await tradeInfoHandler(trader),
    await tradeInfoHandler(copiedTrader),
  ];

  const positioningRatio =
    Math.floor(
      (copiedTraderInfo.portfolioValue / traderInfo.portfolioValue) * 1000,
    ) / 1000;

  AppState.set("positioningRatio", positioningRatio);

  console.log(`Positioning Ratio: ${positioningRatio}`);

  return await copyInitialAccountHandler(
    trader,
    traderInfo.positions,
    copiedTraderInfo.positions,
    positioningRatio,
  );
};

// fetches and returns a trader’s current positions and portfolio value.
const tradeInfoHandler = async (trader: Trader) => {
  await trader.update();

  const positions = trader.getPositions();
  const portfolioValue = trader.getPortfolioValue().toDecimal();

  return { positions, portfolioValue };
};

// plays a critical role in aligning the account’s positions with those
// of a copied trader. It achieves this by generating new orders based
// on the existing positions of both the original and copied traders
//  and the calculated positioning ratio
const copyInitialAccountHandler = async (
  trader: Trader,
  traderPositions: Map<any, any>,
  copiedTraderPositions: Map<any, any>,
  positioningRatio: number,
) => {
  const newOrders = [];

  // iterates over the positions of the copied trader to adjust the original trader’s positions accordingly.
  // It calculates the new size for each position, taking into account the positioning ratio and any
  //  existing positions the trader might already have in the same product.
  for (const [product, copierPosition] of copiedTraderPositions) {
    const copierSize = copierPosition.toDecimal();
    if (Math.abs(copierSize) == 0) continue;

    const traderPosition = traderPositions.get(product);
    const traderSize = traderPosition ? traderPosition.toDecimal() : 0;

    let adjustedSize = copierSize * positioningRatio;
    if (traderSize !== 0) {
      adjustedSize -= traderSize;
    }

    const isBid = adjustedSize > 0;
    console.log(
      `Adjusting position:\n -Product: ${product.trim()}\n -New Size: ${Math.abs(adjustedSize).toFixed(1)}\n -Side = ${isBid ? "bid" : "ask"}`,
    );

    newOrders.push({
      isBid,
      size: Math.abs(adjustedSize),
      product: product.trim(),
    });

    traderPositions.delete(product);
  }

  // After adjusting for the copied trader’s positions, any remaining positions in the original trader’s
  //  account that were not addressed in the first loop are handled in this section. This ensures that all
  // positions are properly adjusted or closed out as needed.
  for (const [product, position] of traderPositions) {
    const size = position.toDecimal();
    if (Math.abs(size) > 0) {
      newOrders.push({
        isBid: size < 0,
        size: Math.abs(size),
        product: product.trim(),
      });
    }
  }

  // Before placing new orders, the function fetches product details, calls trade.connect and
  // trader.fetchAddressLookupTableAccount to update the trader state and cancels all existing
  // orders from the traders account to prepare for the new positioning strategy.
  const newOrderIxs: TransactionInstruction[] = [];
  const productMap = new Map<string, any>(
    Array.from(trader.getProducts()).map(([product, details]) => [
      product.trim(),
      details,
    ]),
  );

  await trader.connect(NaN, NaN);
  await trader.fetchAddressLookupTableAccount();

  for (const [name, { index }] of Array.from(productMap)) {
    await trader.cancelAllOrders([name.trim()], true, undefined, 5);
  }

  // Generating and Placing New Orders
  for (const newOrder of newOrders) {
    const productDetails = productMap.get(newOrder.product);
    if (!productDetails) continue;

    // Fetch price
    const response = await fetch(
      `https://dexterity.hxro.com/mark_prices?product=${newOrder.product}`,
    );
    const data = (await response.json()) as any;
    if (!data.mark_prices || data.mark_prices.length === 0) continue;
    // Get price from response
    let price = Number(data.mark_prices[0].mark_price);

    // Add or subtract slippage based on trade side
    price = newOrder.isBid ? price + price * 0.05 : price - price * 0.05;

    const priceFractional = dexterity.Fractional.New(
      Math.floor(price * 1000),
      3,
    );

    const sizeFractional = dexterity.Fractional.New(
      Math.floor(newOrder.size * 10),
      1,
    );

    newOrderIxs.push(
      trader.getNewOrderIx(
        productDetails.index,
        newOrder.isBid,
        priceFractional,
        sizeFractional,
        0,
      ),
    );
  }

  // Submitting the Transaction
  if (newOrderIxs.length > 0) {
    const updateMarkPricesIx = trader.getUpdateMarkPricesIx();
    return await trader.sendV0Tx([updateMarkPricesIx, ...newOrderIxs]);
  } else {
    return undefined;
  }
};
