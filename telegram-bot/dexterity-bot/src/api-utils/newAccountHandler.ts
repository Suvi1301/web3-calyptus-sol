const HeliusApiKey = "cc3c3e6b-0b57-4708-a4c6-d6c037debfc8";
const WebHookId = "689e570a-897a-45be-ad55-db63cc185765";

export const newAcccountSubscriptionHandler = async (newTrg: string) => {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/webhooks/${WebHookId}?api-key=${HeliusApiKey}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhookURL: "https://trades-webhook-2o4z.onrender.com/webhook",
          transactionTypes: ["Any"],
          accountAddresses: [newTrg],
          webhookType: "rawDevnet",
        }),
      },
    );

    const data = await response.json();
    console.log({ data });
  } catch (error) {
    console.error("Error: ", error);
  }
};
