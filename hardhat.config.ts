import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { config as dotenvConfig } from "dotenv";

// .envを読み込み
dotenvConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  gasReporter: {
    currency: "JPY",
    gasPrice: 21,
  },
  networks: {
    // eth: {
    //   url: process.env.RPC_URL_ETH,
    //   accounts: [process.env.WALLET_SECRET_KEY!],
    // },
    goerli: {
      url: process.env.RPC_URL_GOERLI,
      accounts: [process.env.TEST_WALLET_SECRET_KEY!],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};

export default config;
