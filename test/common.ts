import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// ============================
// テストの共通処理です
// ============================

export const MAX_SUPPLY = 1850;
export const MINT_PRICE = 0.05;
export const MAX_MINT_PER_TX = 2;
export const OWNER = "0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5";

export const TeamAddress1 = "0xDb40277dd6B3d4f0971A982f9fE9Fd5D96905E0e";
export const TeamAddress2 = "0x4b3CCD7cE7C1Ca0B0277800cd938De64214d81F3";
export const TeamAddress3 = "0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5";

export enum Phase {
  Paused = 0,
  ALSale = 1,
  PublicSale = 2,
}

// deployします
export const deployFixture = async () => {
  const factory = await ethers.getContractFactory("Test");
  const [deployer, addr1, addr2] = await ethers.getSigners();

  const contract = await factory.deploy();

  return { contract, deployer, addr1, addr2 };
};

// ALMintの準備をします
//
// `addr1`に対して2つのALを登録します。
export const setupALFixture = async () => {
  const { contract, deployer, addr1, addr2 } = await loadFixture(deployFixture);
  // AL登録
  await contract.connect(deployer).setAllowList([addr1], [2]);
  // PhaseをALSaleに変更
  await contract.connect(deployer).setPhaseALSale();
  // mint前の供給量が0であることを確認します
  expect(await contract.totalSupply()).to.equal(0);

  return { contract, deployer, addr1, addr2 };
};

// publicMintの準備をします
export const setupPublicFixture = async () => {
  const { contract, deployer, addr1, addr2 } = await loadFixture(deployFixture);
  // PhaseをPublicSaleに変更
  await contract.connect(deployer).setPhasePublicSale();

  return { contract, deployer, addr1, addr2 };
};
