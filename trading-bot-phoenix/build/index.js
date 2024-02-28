"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.execute = void 0;
require("dotenv").config();
const web3_js_1 = require("@solana/web3.js");
const phoenixSDK = __importStar(require("@ellipsis-labs/phoenix-sdk"));
// Maxium time an order is valid for
const ORDER_LIFETIME_IN_SECONDS = 7;
const execute = () => __awaiter(void 0, void 0, void 0, function* () {
    const REFRESH_FREQUENCY_MS = 5000; // 2 seconds
    const MAX_ITERATIONS = 2;
    const EDGE = 0.5; // Edge of £0.50
    let counter = 0;
    let traderKeyPair = getTraderKeyPair();
    const marketPubKey = new web3_js_1.PublicKey("4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg"); // SOL-USDC market public address from Phoenix
    // https://ellipsis-labs.gitbook.io/phoenix-dex/tRIkEFlLUzWK9uKO3W2V/getting-started/technical-overview/market-addresses
    const endpoint = "https://api.mainnet-beta.solana.com";
    const connection = new web3_js_1.Connection(endpoint);
    // Create a Phoenix Client
    const phoenixClient = yield phoenixSDK.Client.create(connection);
    // Get the market metadata for the market to trade on
    const marketState = phoenixClient.marketStates.get(marketPubKey.toString());
    requestSeatOnMarket(phoenixClient, connection, marketState, traderKeyPair, marketPubKey);
    do {
        // Before quoting, we cancel all outstanding orders
        try {
            cancelOutstandingOrders(phoenixClient, connection, traderKeyPair, marketPubKey);
        }
        catch (error) {
            continue;
        }
        try {
            // Get current SOL price from Coinbase
            const response = yield fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot");
            if (!response.ok)
                throw new Error(`HTTP Error! Status: ${response.status}`);
            const data = yield response.json();
            const price = parseFloat(data.data.amount);
            let bidPrice = price - EDGE;
            let askPrice = price + EDGE;
            console.log(`SOL price: ${price}`);
            console.log(`Placing bid (buy) order at ${bidPrice}`);
            console.log(`Placing ask (sell) order at ${askPrice}`);
            // Create Bid Limit order instruction
            const bidLimitOrderIx = createOrderInstruction(bidPrice, phoenixSDK.Side.Bid, phoenixClient, traderKeyPair, marketPubKey);
            // Create Ask Limit order instruction
            const askLimitOrderIx = createOrderInstruction(askPrice, phoenixSDK.Side.Ask, phoenixClient, traderKeyPair, marketPubKey);
            let instructions = [];
            if (counter < MAX_ITERATIONS) {
                instructions = [bidLimitOrderIx, askLimitOrderIx];
            }
            // If strategy has been executed for MAX_ITERATIONS, withdraw the funds from the exchange.
            if (counter == MAX_ITERATIONS) {
                const withdrawParams = {
                    quoteLotsToWithdraw: null,
                    baseLotsToWithdraw: null,
                };
                const placeWithdraw = phoenixClient.createWithdrawFundsInstruction({
                    withdrawFundsParams: withdrawParams,
                }, marketPubKey.toString(), traderKeyPair.publicKey);
                instructions.push(placeWithdraw);
            }
            // Send place orders/withdraw transaction
            try {
                const placeQuotesTx = new web3_js_1.Transaction().add(...instructions);
                const placeQuotesTxId = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, placeQuotesTx, [traderKeyPair], {
                    skipPreflight: true,
                    commitment: "confirmed",
                });
                console.log("Place quotes", bidPrice.toFixed(marketState === null || marketState === void 0 ? void 0 : marketState.getPriceDecimalPlaces()), "@", askPrice.toFixed(marketState === null || marketState === void 0 ? void 0 : marketState.getPriceDecimalPlaces()));
                console.log(`Tx link: https://solscan.io/tx/${placeQuotesTxId}`);
            }
            catch (error) {
                if (error instanceof Error &&
                    error.message.includes("429 Too Many Requests")) {
                    console.warn("Received 429 error. Retrying after backoff...");
                    yield new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
                    // Retry logic
                }
                else {
                    // Handle other errors
                    console.error("Error:", error);
                }
                console.log("Error: ", error);
                continue;
            }
            counter++;
            yield (0, exports.delay)(REFRESH_FREQUENCY_MS);
        }
        catch (error) {
            console.log(error);
        }
    } while (counter < MAX_ITERATIONS);
});
exports.execute = execute;
const delay = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};
exports.delay = delay;
function getTraderKeyPair() {
    if (!process.env.PRIVATE_KEY) {
        throw new Error("Missing PRIVATE_KEY in .env file");
    }
    let privateKeyArray;
    try {
        privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
    }
    catch (error) {
        throw new Error(`Error parsing PRIVATE_KEY. Reason: ${error}`);
    }
    return web3_js_1.Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
}
function requestSeatOnMarket(phoenixClient, connection, marketState, traderKeypair, marketPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const marketData = marketState === null || marketState === void 0 ? void 0 : marketState.data;
        if (!marketData) {
            throw new Error("Market data not found");
        }
        const setupNewMakerIxs = yield phoenixSDK.getMakerSetupInstructionsForMarket(connection, marketState, traderKeypair.publicKey);
        if (setupNewMakerIxs.length !== 0) {
            const setup = new web3_js_1.Transaction().add(...setupNewMakerIxs);
            const setupTxId = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, setup, [traderKeypair], {
                skipPreflight: true,
                commitment: "confirmed",
            });
            console.log(`Setup Tx Link: https://beta.solscan.io/tx/${setupTxId}`);
        }
        else {
            console.log("No setup required. Continuing...");
        }
    });
}
function cancelOutstandingOrders(phoenixClient, connection, traderKeyPair, marketPubKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const cancelAll = phoenixClient.createCancelAllOrdersInstruction(marketPubKey.toString(), traderKeyPair.publicKey);
        // Note we coule bundle this with the place order transaction below, but we choose to cancel
        // separately since getting the price could take a non-deterministic amount of time
        //
        try {
            const cancelTransaction = new web3_js_1.Transaction().add(cancelAll);
            const txid = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, cancelTransaction, [traderKeyPair], {
                skipPreflight: true,
                commitment: "confirmed",
            });
            console.log(`Cancel tx link: https://beta.solscan.io/tx/${txid}`);
        }
        catch (error) {
            console.log(`Error: ${error}`);
        }
    });
}
function createOrderInstruction(price, side, phoenixClient, traderKeyPair, marketPubKey) {
    const currentTime = Math.floor(Date.now() / 1000);
    const orderTemplate = {
        side: side, // Want to initialise a Bid/Ask order
        priceAsFloat: price,
        sizeInBaseUnits: 1, // Quantity for order. Always 1 for simplicity.
        selfTradeBehavior: phoenixSDK.SelfTradeBehavior.Abort, // Avoid order being matched if buyer and seller trader are same.
        clientOrderId: 1,
        useOnlyDepositedFunds: false,
        lastValidSlot: undefined,
        lastValidUnixTimestampInSeconds: currentTime + ORDER_LIFETIME_IN_SECONDS,
    };
    return phoenixClient.getLimitOrderInstructionfromTemplate(marketPubKey.toBase58(), traderKeyPair.publicKey, orderTemplate);
}
(0, exports.execute)();
