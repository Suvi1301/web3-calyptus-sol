require("dotenv").config();

import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import * as phoenixSDK from "@ellipsis-labs/phoenix-sdk";

// Maxium time an order is valid for
const ORDER_LIFETIME_IN_SECONDS = 7;

export const execute = async () => {
  const REFRESH_FREQUENCY_MS = 5000; // 2 seconds
  const MAX_ITERATIONS = 2;
  const EDGE = 0.5; // Edge of £0.50

  let counter = 0;

  let traderKeyPair = getTraderKeyPair();

  const marketPubKey = new PublicKey(
    "4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg",
  ); // SOL-USDC market public address from Phoenix
  // https://ellipsis-labs.gitbook.io/phoenix-dex/tRIkEFlLUzWK9uKO3W2V/getting-started/technical-overview/market-addresses

  const endpoint = "https://api.mainnet-beta.solana.com";
  const connection = new Connection(endpoint);

  // Create a Phoenix Client
  const phoenixClient = await phoenixSDK.Client.create(connection);

  // Get the market metadata for the market to trade on
  const marketState = phoenixClient.marketStates.get(marketPubKey.toString());

  requestSeatOnMarket(
    phoenixClient,
    connection,
    marketState!,
    traderKeyPair,
    marketPubKey,
  );

  do {
    // Before quoting, we cancel all outstanding orders
    try {
      cancelOutstandingOrders(
        phoenixClient,
        connection,
        traderKeyPair,
        marketPubKey,
      );
    } catch (error) {
      continue;
    }

    try {
      // Get current SOL price from Coinbase
      const response = await fetch(
        "https://api.coinbase.com/v2/prices/SOL-USD/spot",
      );

      if (!response.ok)
        throw new Error(`HTTP Error! Status: ${response.status}`);

      const data: any = await response.json();
      const price = parseFloat(data.data.amount);

      let bidPrice = price - EDGE;
      let askPrice = price + EDGE;

      console.log(`SOL price: ${price}`);
      console.log(`Placing bid (buy) order at ${bidPrice}`);
      console.log(`Placing ask (sell) order at ${askPrice}`);

      // Create Bid Limit order instruction
      const bidLimitOrderIx = createOrderInstruction(
        bidPrice,
        phoenixSDK.Side.Bid,
        phoenixClient,
        traderKeyPair,
        marketPubKey,
      );

      // Create Ask Limit order instruction
      const askLimitOrderIx = createOrderInstruction(
        askPrice,
        phoenixSDK.Side.Ask,
        phoenixClient,
        traderKeyPair,
        marketPubKey,
      );

      let instructions: TransactionInstruction[] = [];
      if (counter < MAX_ITERATIONS) {
        instructions = [bidLimitOrderIx, askLimitOrderIx];
      }

      // If strategy has been executed for MAX_ITERATIONS, withdraw the funds from the exchange.
      if (counter == MAX_ITERATIONS) {
        const withdrawParams: phoenixSDK.WithdrawParams = {
          quoteLotsToWithdraw: null,
          baseLotsToWithdraw: null,
        };

        const placeWithdraw = phoenixClient.createWithdrawFundsInstruction(
          {
            withdrawFundsParams: withdrawParams,
          },
          marketPubKey.toString(),
          traderKeyPair.publicKey,
        );
        instructions.push(placeWithdraw);
      }

      // Send place orders/withdraw transaction
      try {
        const placeQuotesTx = new Transaction().add(...instructions);

        const placeQuotesTxId = await sendAndConfirmTransaction(
          connection,
          placeQuotesTx,
          [traderKeyPair],
          {
            skipPreflight: true,
            commitment: "confirmed",
          },
        );
        console.log(
          "Place quotes",
          bidPrice.toFixed(marketState?.getPriceDecimalPlaces()),
          "@",
          askPrice.toFixed(marketState?.getPriceDecimalPlaces()),
        );
        console.log(`Tx link: https://solscan.io/tx/${placeQuotesTxId}`);
      } catch (error) {
        console.log("Error: ", error);
        continue;
      }

      counter++;
      await delay(REFRESH_FREQUENCY_MS);
    } catch (error) {
      console.log(error);
    }
  } while (counter < MAX_ITERATIONS);
};

export const delay = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

function getTraderKeyPair(): Keypair {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env file");
  }

  let privateKeyArray;
  try {
    privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
  } catch (error) {
    throw new Error(`Error parsing PRIVATE_KEY. Reason: ${error}`);
  }

  return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
}

async function requestSeatOnMarket(
  phoenixClient: phoenixSDK.Client,
  connection: Connection,
  marketState: phoenixSDK.MarketState,
  traderKeypair: Keypair,
  marketPubkey: PublicKey,
) {
  const marketData = marketState?.data;

  if (!marketData) {
    throw new Error("Market data not found");
  }

  const setupNewMakerIxs = await phoenixSDK.getMakerSetupInstructionsForMarket(
    connection,
    marketState,
    traderKeypair.publicKey,
  );

  if (setupNewMakerIxs.length !== 0) {
    const setup = new Transaction().add(...setupNewMakerIxs);
    const setupTxId = await sendAndConfirmTransaction(
      connection,
      setup,
      [traderKeypair],
      {
        skipPreflight: true,
        commitment: "confirmed",
      },
    );
    console.log(`Setup Tx Link: https://beta.solscan.io/tx/${setupTxId}`);
  } else {
    console.log("No setup required. Continuing...");
  }
}

async function cancelOutstandingOrders(
  phoenixClient: phoenixSDK.Client,
  connection: Connection,
  traderKeyPair: Keypair,
  marketPubKey: PublicKey,
) {
  const cancelAll = phoenixClient.createCancelAllOrdersInstruction(
    marketPubKey.toString(),
    traderKeyPair.publicKey,
  );
  // Note we coule bundle this with the place order transaction below, but we choose to cancel
  // separately since getting the price could take a non-deterministic amount of time
  //
  try {
    const cancelTransaction = new Transaction().add(cancelAll);
    const txid = await sendAndConfirmTransaction(
      connection,
      cancelTransaction,
      [traderKeyPair],
      {
        skipPreflight: true,
        commitment: "confirmed",
      },
    );

    console.log(`Cancel tx link: https://beta.solscan.io/tx/${txid}`);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

function createOrderInstruction(
  price: number,
  side: phoenixSDK.Side,
  phoenixClient: phoenixSDK.Client,
  traderKeyPair: Keypair,
  marketPubKey: PublicKey,
): TransactionInstruction {
  const currentTime = Math.floor(Date.now() / 1000);

  const orderTemplate: phoenixSDK.LimitOrderTemplate = {
    side: side, // Want to initialise a Bid/Ask order
    priceAsFloat: price,
    sizeInBaseUnits: 1, // Quantity for order. Always 1 for simplicity.
    selfTradeBehavior: phoenixSDK.SelfTradeBehavior.Abort, // Avoid order being matched if buyer and seller trader are same.
    clientOrderId: 1,
    useOnlyDepositedFunds: false,
    lastValidSlot: undefined,
    lastValidUnixTimestampInSeconds: currentTime + ORDER_LIFETIME_IN_SECONDS,
  };

  return phoenixClient.getLimitOrderInstructionfromTemplate(
    marketPubKey.toBase58(),
    traderKeyPair.publicKey,
    orderTemplate,
  );
}

execute();
