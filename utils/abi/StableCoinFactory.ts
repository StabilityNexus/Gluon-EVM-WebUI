export const StableCoinFactoryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyBaseName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyBaseSymbol",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyPegName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyPegSymbol",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyProtonName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyProtonSymbol",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyVaultName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBase",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCriticalReserveRatio",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFissionFee",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFusionFee",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidOracle",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidTreasury",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "reactor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "base",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "vaultName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "baseAssetName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "baseAssetSymbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "peggedAssetName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "peggedAssetSymbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "protonName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "protonSymbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "oracleAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fissionFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fusionFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "criticalReserveRatioWad",
        "type": "uint256"
      }
    ],
    "name": "ReactorDeployed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "deployedReactors",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "vaultNameParam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseAssetNameParam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseAssetSymbolParam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "peggedAssetNameParam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "peggedAssetSymbolParam",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "baseTokenParam",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "oracleParam",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "protonNameParam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "protonSymbolParam",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "treasuryParam",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "fissionFeeParam",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "fusionFeeParam",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "criticalReserveRatioWadParam",
        "type": "uint256"
      }
    ],
    "name": "deployReactor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllDeployedReactors",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedReactorsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "baseToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "reactorsByBase",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const
