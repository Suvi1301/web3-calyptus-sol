import os
from typing import Dict, Any
from flask import Flask, request, jsonify
from dexteritysdk.dex.sdk_context import SDKContext
from dexteritysdk.dex.events import OrderFillEvent
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.api import Client
import requests
import json
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

app = Flask(__name__)

@app.route('/', methods=['GET'])
def status():
    return jsonify({'status': 'live'})

@app.route('/webhook', methods=['POST'])
def webhook():
    """
    Recieves transaction data, parses it, proccess it and then sends it to the trade api to get executed
    """


def handle_transaction(tr: Dict[str, Any]):
    """
    Checks the given transaction object for fill events and calls the Trading API if found.
    
    :param tr: A dictionary representing the transaction.
    """

def event_to_trade_data(event: OrderFillEvent) -> Dict[str, Any]:
    """
    Parses an OrderFillEvent into a Trade Object.
    
    :param event: The OrderFillEvent instance.
    :return: A Trade Object representing the fill event to send to the Trading API for execution.
    """

def proccess_trade(trade):
   url = os.environ.get('TRADING_API_URL', 'http://localhost:3000') + '/process-trade'
  
   headers = {'Content-Type': 'application/json'}
  
   data = json.dumps(trade)
  
   try:
       response = requests.post(url, headers=headers, data=data)
      
       print("Status Code:", response.status_code)
       print("Response:", response.json())
   except Exception as e:
       print(f"An error occurred: {e}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port="80")