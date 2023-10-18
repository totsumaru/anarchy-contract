import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// ============================
// テストの共通処理です
// ============================

export const MAX_SUPPLY = 1850;
export const MINT_PRICE = 0.05;
export const MAX_MINT_PER_TX = 2;
export const OWNER = "0x9282cBb5FC35db6Ce9412bC829aC4a7e7bf8c768";

export const TeamAddress1 = "0x4b3CCD7cE7C1Ca0B0277800cd938De64214d81F3";
export const TeamAddress2 = "0x227080310686D083e9ab589d739767C8cdfD4cb1";
export const TeamAddress3 = "0x9282cBb5FC35db6Ce9412bC829aC4a7e7bf8c768";

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
