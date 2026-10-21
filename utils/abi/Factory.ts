export const FactoryABI = [
  {
    "type": "function",
    "name": "deployReactor",
    "inputs": [
      {
        "name": "vaultNameParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "baseAssetNameParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "baseAssetSymbolParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "peggedAssetNameParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "peggedAssetSymbolParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "baseTokenParam",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "oracleParam",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "protonNameParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "protonSymbolParam",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "devParam",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "devFeeParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "fissionFeeParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "fusionFeeParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "criticalReserveRatioWadParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "initialReserveRatioWadParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "initialReserveParam",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "betaPhi0Param",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "betaPhi1Param",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "decayPerSecondWadParam",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deployedReactors",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllDeployedReactors",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDeployedReactorsCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reactorsByBase",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ReactorDeployed",
    "inputs": [
      {
        "name": "reactor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "base",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "devFeeReceiver",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "vaultName",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "baseAssetName",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "baseAssetSymbol",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "peggedAssetName",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "peggedAssetSymbol",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "protonName",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "protonSymbol",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "oracleAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "fissionFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "fusionFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "criticalReserveRatioWad",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "initialReserve",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "dev",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "devFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "EmptyBaseName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyBaseSymbol",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyPegName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyPegSymbol",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyProtonName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyProtonSymbol",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyVaultName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBase",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCriticalReserveRatio",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidDev",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidDevFee",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidFissionFee",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidFusionFee",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInitialReserve",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidOracle",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const
