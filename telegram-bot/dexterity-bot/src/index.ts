require("dotenv").config();
import { Wallet } from "@coral-xyz/anchor";
import dexterity from "@hxronetwork/dexterity-ts";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  handleCancelSubscription,
  handleNewSubscription,
} from "./api-utils/subscriptionHandler";
import { tradeHandler } from "./api-utils/tradeHandler";

const AppState = new Map<string, any>();

export const app = async () => {
  const PRIVATE_KEY = env.PRIVATE_KEY;
  const keypair = Keypair.fromSecretKey(new Uint8Array(PRIVATE_KEY));
  const wallet = new Wallet(keypair);

  const rpc = `https://devnet-rpc.shyft.to?api_key=UKj6NdXcBwMrJtqA`;

  const manifest = await dexterity.getManifest(rpc, true, wallet);

  const trg = new PublicKey("CG7BmZh3PJR1oS7iYzd2D8Ca9g7itG5TYcZPUYqeZwXs");
  const trader = new dexterity.Trader(manifest, trg);

  const server = Bun.serve({
    async fetch(req, server) {
      const url = new URL(req.url);
      const { pathname, searchParams } = url;

      let response: Response | undefined = new Response(
        JSON.stringify({ status: 200 }),
      );

      switch (pathname) {
        case "/process-trade":
          break;
        case "/new-subscription":
          response = await handleNewSubscription(
            trader,
            manifest,
            searchParams.get("trg"),
            AppState,
          );
          break;
        case "/cancel-subscription":
          response = await handleCancelSubscription(AppState);
          break;
        default:
          break;
      }

      if (!response) return new Response(JSON.stringify({ status: 200 }));
      return response;
    },
  });
  console.log(`${server.url}`);
};
