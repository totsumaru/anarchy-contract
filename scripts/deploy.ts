import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const contract = await ethers.deployContract("Test");
  await contract.waitForDeployment();

  console.log(`NFT deployed to: ${contract.target}`);

  // contract.jsonに情報を出力
  // { "contract_address": "0x..." }
  fs.writeFileSync(
    "contract.json",
    JSON.stringify(
      {
        contract_address: contract.target,
      },
      null,
      2
    )
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
