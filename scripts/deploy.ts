import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const contract = await ethers.deployContract("Test");
  await contract.waitForDeployment();

  console.log(`NFT deployed to: ${contract.target}`);

  // 現在のネットワークを取得
  const network = await ethers.provider.getNetwork();
  const networkName = network.name; // 'goerli'や'eth'などのネットワーク名を取得

  // 既存のcontract.jsonを読み取る（存在しない場合は空のオブジェクトを使用）
  let existingData: Record<string, any> = {};
  if (fs.existsSync("contract.json")) {
    const rawData = fs.readFileSync("contract.json", "utf8");
    existingData = JSON.parse(rawData);
  }

  // 現在の日時をJSTで取得して、指定されたフォーマットに変換
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 9); // UTCからJSTに変換
  const jstDate = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(
    2,
    "0"
  )} ${String(currentDate.getHours()).padStart(2, "0")}:${String(
    currentDate.getMinutes()
  ).padStart(2, "0")}:${String(currentDate.getSeconds()).padStart(2, "0")}`;

  // ネットワークに基づいてデータを更新
  existingData[networkName] = {
    contract_address: contract.target,
    date: jstDate, // JSTの日時を指定されたフォーマットで追加
  };

  // contract.jsonに情報を出力
  fs.writeFileSync("contract.json", JSON.stringify(existingData, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
