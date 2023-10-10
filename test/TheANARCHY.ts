import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const MAX_SUPPLY = 1850;
const MINT_PRICE = ethers.parseEther("0.05");
const MAX_MINT_PER_TX = 2;
const OWNER = "0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5";

// Deployします
// * `loadFixture`を使用してコールします
const deploy = async () => {
  const factory = await ethers.getContractFactory("Test");
  const [deployer, addr1, addr2] = await ethers.getSigners();

  const contract = await factory.deploy();

  return { contract, deployer, addr1, addr2 };
};

describe("Test", function () {
  describe("初期値を検証", () => {
    it("定数,変数の値を検証", async () => {
      const { contract, deployer } = await loadFixture(deploy);

      expect(await contract.owner()).to.equal(OWNER);
      expect(await contract.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await contract.MINT_PRICE()).to.equal(MINT_PRICE);
      expect(await contract.MAX_MINT_PER_TX()).to.equal(MAX_MINT_PER_TX);
      expect(await contract.OWNER()).to.equal(OWNER);

      expect(await contract.baseURI()).to.equal("");
      expect(await contract.notRevealedURI()).to.equal("");
      expect(await contract.extension()).to.equal(".json");
      expect(await contract.isRevealed()).to.equal(false);

      expect(await contract.phase()).to.equal(0); // Paused:0
    });
  });
});
