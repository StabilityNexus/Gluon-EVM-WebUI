// Deployment ABI for the factory with immutable beta parameters.
export const ImmutableBetaFactoryABI = [
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
      },
      {
        "internalType": "uint256",
        "name": "initialReserveParam",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "betaPhi0Param",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "betaPhi1Param",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "decayPerSecondWadParam",
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
  }
] as const
