import requests
import json

def test_webhook(transaction):
   url = 'http://localhost:80/webhook'
  
   headers = {'Content-Type': 'application/json'}
  
   data = json.dumps(transaction)
  
   try:
       response = requests.post(url, headers=headers, data=data)
      
       print("Status Code:", response.status_code)
       print("Response:", response.json())
   except Exception as e:
       print(f"An error occurred: {e}")


transaction = [
    {
    "blockTime": 1709209480,
    "meta": {
      "computeUnitsConsumed": 102324,
      "err": None,
      "fee": 8500,
      "innerInstructions": [
        {
          "index": 3,
          "instructions": [
            {
              "accounts": [
                6,
                8,
                3,
                4,
                7,
                14,
                2,
                3,
                8
              ],
              "data": "eJ3vVttksFLT2oboTbGWQUxY83jYBv4fky6iWH7J89DAhgfBirTcEYUEePaSw66hcgJjhLm9AsDqkEZi4TK3fx5ratdkWq7gb3Rkz",
              "programIdIndex": 10,
              "stackHeight": 2
            },
            {
              "accounts": [
                1,
                5,
                11,
                0
              ],
              "data": "2V99RAii29nP",
              "programIdIndex": 12,
              "stackHeight": 2
            }
          ]
        }
      ],
      "loadedAddresses": {
        "readonly": [],
        "writable": []
      },
      "logMessages": [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL invoke [1]",
        "Program log: Instruction: ConsumeOrderbookEvents",
        "Program 5u8mLVnUSQNSbKdZPNGTfWHGwV5uJh9by5Fa6jb6BP6h invoke [2]",
        "Program log: Instruction: Publish",
        "Program 5u8mLVnUSQNSbKdZPNGTfWHGwV5uJh9by5Fa6jb6BP6h consumed 12879 of 1371678 compute units",
        "Program 5u8mLVnUSQNSbKdZPNGTfWHGwV5uJh9by5Fa6jb6BP6h success",
        "Program log: lz4:8G04RzBEMkdkdU1NT2EzQU1qUlJoMzVoZkd1YTdTTERMN0lNL3VxWHNsT2FMQ3kyWDF2QmxmcGsxVFQweFZVMFF0VUVWU1VDQWdJQ0F1MDJIQ010cTcrcFdrWWFKUE5WdThpMUdqVnZDOE1BY3J1UFRxVkgvRE90Ti8vZi8vAgAQQQEAUExqL0FRCQAGAgBCd3VzTA4A7009LHdBbEhDNEw4bTdLpQAtcEFlazRZQmdbAFBEQzZ3cwkAgEFBRDBuREFNCgDwIUIyMmMrS2o5Z0lackdmamQ3SjJTL0lNN2VqZjZvL2VlWUc1YjlKanI5aWZIZmYvM8QAMS8vdzsAkEkvd0VBdTFrRQ4ADwIAEA8xARdBak9BQbQAAwIAm05EN0FRQUdYZzYBCgIAQ2d1TWMSAD89PSzqAWIPuQADA5UAAAIABSwBUEFBQUU9",
        "Program DchhQ6g8LyRCM5mnao1MAg3g9twfqBbDmUWgpQpFfn1b invoke [2]",
        "Program log: Instruction: Consume Events",
        "Program log: Number of events consumed: 3",
        "Program DchhQ6g8LyRCM5mnao1MAg3g9twfqBbDmUWgpQpFfn1b consumed 2557 of 1302323 compute units",
        "Program DchhQ6g8LyRCM5mnao1MAg3g9twfqBbDmUWgpQpFfn1b success",
        "Program log: sequence: 286216",
        "Program FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL consumed 101818 of 1399550 compute units",
        "Program FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL success"
      ],
      "postBalances": [
        5803600107735,
        2227200,
        448669440,
        57795840,
        59911680,
        1128932880,
        1002852480,
        1002240,
        93264000,
        1,
        1141440,
        0,
        1141440,
        1141440,
        0,
        2449920
      ],
      "postTokenBalances": [],
      "preBalances": [
        5803600116235,
        2227200,
        448669440,
        57795840,
        59911680,
        1128932880,
        1002852480,
        1002240,
        93264000,
        1,
        1141440,
        0,
        1141440,
        1141440,
        0,
        2449920
      ],
      "preTokenBalances": [],
      "rewards": [],
      "status": {
        "Ok": None
      }
    },
    "slot": 281995166,
    "transaction": {
      "message": {
        "accountKeys": [
          "EyeYzc5qx7DiW5xt451eQHn5RLeagUEDX2SapDXu62Gy",
          "2BzdomJqSeQiMMjwSRWV379x5JP7gpvzXhb4NBTbAej1",
          "49nhg9sMyGMkhTFD25vCzKqdwHnPDnp6zoBKg4gCEYoT",
          "68qsch6j4tBkewnYzoumWfsm2bvQv73nGKHTj1qcy2uu",
          "9g22ajzxAcvJMXoxeisU8RhaWwcRoNrzPeTgN3eSgz8d",
          "AYnfvKfQv95nYD7ZkSE9c5nrZSUAe8xYex7apfoRHA6k",
          "BRWNCEzQTm8kvEXHsVVY9jpb1VLbpv9B8mkF43nMLCtu",
          "CfnmFJgYiX8wpoiZbRZVevj8ZZguNLwZ4TZgViPETZhC",
          "FmTbUCrshWdawiw7GxRxPhmwpzHH3hwrbaeka3wnRP7n",
          "ComputeBudget111111111111111111111111111111",
          "5u8mLVnUSQNSbKdZPNGTfWHGwV5uJh9by5Fa6jb6BP6h",
          "CNFqecZdCqbLb8ZcnDZtgtjRXmG7LhFhXFQNd4H1bkxT",
          "DchhQ6g8LyRCM5mnao1MAg3g9twfqBbDmUWgpQpFfn1b",
          "FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL",
          "FYpkZXMvQHRR2HDUMwPgC93kDAkFECAfQD9F9gtVjBX1",
          "HPTwrfGHTE84GPXhnmuQ14g8wMLvXVJkBDv4wvq7Mey4"
        ],
        "header": {
          "numReadonlySignedAccounts": 0,
          "numReadonlyUnsignedAccounts": 7,
          "numRequiredSignatures": 1
        },
        "instructions": [
          {
            "accounts": [],
            "data": "3nFMDjzgvRHh",
            "programIdIndex": 9,
            "stackHeight": None
          },
          {
            "accounts": [],
            "data": "7YXqSw",
            "programIdIndex": 9,
            "stackHeight": None
          },
          {
            "accounts": [],
            "data": "K1FDJ7",
            "programIdIndex": 9,
            "stackHeight": None
          },
          {
            "accounts": [
              12,
              6,
              15,
              11,
              1,
              5,
              0,
              10,
              4,
              7,
              14,
              2,
              3,
              8
            ],
            "data": "FuxCdZ5e83g19QukE7hf67",
            "programIdIndex": 13,
            "stackHeight": None
          }
        ],
        "recentBlockhash": "H5fjmbYKSDffPyFJodcxCHQSKD3Y24jwNZTD7pB2xX5w"
      },
      "signatures": [
        "NqEf3DaRmh6kkoR4RoDfQbsj66epda8rqDkEuCr2GgEouMnAYyyYyjK1CX8oXb417V8zLubRz3A4xJ2tvBCgxVd"
      ]
    },
    "version": "legacy"
  }
]

test_webhook(transaction)