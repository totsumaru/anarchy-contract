import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { config as dotenvConfig } from "dotenv";
import { version } from "hardhat";

// .envを読み込み
dotenvConfig();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "JPY",
    gasPrice: 10,
    gasPriceApi:
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  networks: {
    // eth: {
    //   url: process.env.RPC_URL_ETH,
    //   accounts: [process.env.WALLET_SECRET_KEY!],
    // },
    goerli: {
      url: process.env.RPC_URL_GOERLI,
      accounts: [process.env.TEST_WALLET_SECRET_KEY!],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
