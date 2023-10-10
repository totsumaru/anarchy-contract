import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, ContractDeployTransaction } from "ethers";

const MAX_SUPPLY = 1850;
const MINT_PRICE = 0.05;
const MAX_MINT_PER_TX = 2;
const OWNER = "0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5";

// deployします
const deployFixture = async () => {
  const factory = await ethers.getContractFactory("Test");
  const [deployer, addr1, addr2] = await ethers.getSigners();

  const contract = await factory.deploy();

  return { contract, deployer, addr1, addr2 };
};

describe("Test", function () {
  describe("constructor", () => {
    it("定数,変数が期待した初期値と一致する", async () => {
      const { contract } = await loadFixture(deployFixture);

      expect(await contract.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await contract.MINT_PRICE()).to.equal(
        ethers.parseEther(MINT_PRICE.toString())
      );
      expect(await contract.MAX_MINT_PER_TX()).to.equal(MAX_MINT_PER_TX);
      expect(await contract.OWNER()).to.equal(OWNER);

      expect(await contract.extension()).to.equal(".json");
      expect(await contract.notRevealedURI()).to.equal("");
      expect(await contract.baseURI()).to.equal("");
      expect(await contract.isRevealed()).to.equal(false);
      expect(await contract.phase()).to.equal(0); // Paused:0
    });

    it("constructorで設定した値を検証", async () => {
      const { contract, deployer, addr1 } = await loadFixture(deployFixture);
      const operatorRole = await contract.OPERATOR_ROLE();
      // Ownable
      expect(await contract.owner()).to.equal(OWNER);
      // AccessControle
      expect(await contract.hasRole(operatorRole, OWNER)).to.equal(true);
      expect(await contract.hasRole(operatorRole, deployer)).to.equal(true);
      expect(await contract.hasRole(operatorRole, addr1)).to.equal(false);
      // ERC2981
      expect(await contract.royaltyInfo(1, ethers.parseEther("0.1"))).to.eql([
        OWNER,
        ethers.parseEther("0.01"),
      ]);
    });
  });

  describe("alMint", () => {
    // ALMintの準備をします
    //
    // `addr1`に対して2つのALを登録します。
    const setupALFixture = async () => {
      const { contract, deployer, addr1, addr2 } = await loadFixture(
        deployFixture
      );
      // AL登録
      await contract.connect(deployer).setAllowList([addr1], [2]);
      // PhaseをALSaleに変更
      await contract.connect(deployer).setPhaseALSale();
      // mint前の供給量が0であることを確認します
      expect(await contract.totalSupply()).to.equal(0);

      return { contract, deployer, addr1, addr2 };
    };

    it("ALに登録されていればMintできる", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);

      await expect(
        contract.connect(addr1).alMint(2, {
          value: ethers.parseEther((MINT_PRICE * 2).toString()),
        })
      )
        .to.emit(contract, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);

      // mint後の供給量を確認します
      expect(await contract.totalSupply()).to.equal(2);
      expect(await contract.balanceOf(addr1.address)).to.equal(2);
    });

    it("ALの上限を超えなければ複数Mintできる", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);

      // 1枚ずつ2回mint
      for (let i = 0; i < 2; i++) {
        await expect(
          contract.connect(addr1).alMint(1, {
            value: ethers.parseEther(MINT_PRICE.toString()),
          })
        ).not.to.reverted;
      }

      // mint後の供給量を確認します
      expect(await contract.totalSupply()).to.equal(2);
      expect(await contract.balanceOf(addr1.address)).to.equal(2);
    });

    it("ETHが不足している場合はエラーが返される", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);
      await expect(
        contract.connect(addr1).alMint(1, {
          value: 0,
        })
      ).to.be.reverted;
    });

    it("最大供給量を超える場合はエラーが返される", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);
      // setupで2mintされている状態で、MAX_SUPPLYのmintを実行
      await expect(
        contract.connect(addr1).alMint(MAX_SUPPLY, {
          value: ethers.parseEther((MAX_SUPPLY * MINT_PRICE).toString()),
        })
      ).to.be.reverted;
    });

    it("PhaseがPausedの場合はエラーが返される", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);
      await contract.setPhasePaused();

      await expect(
        contract.connect(addr1).alMint(MAX_SUPPLY, {
          value: ethers.parseEther((MAX_SUPPLY * MINT_PRICE).toString()),
        })
      ).to.be.revertedWith("Wrong phase");
    });

    it("mint数が0のときはエラーが返される", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);
      await expect(contract.connect(addr1).alMint(0, { value: 0 })).to.be
        .reverted;
    });

    it("ALの数を超えている場合はエラーが返される", async () => {
      const { contract, addr1 } = await loadFixture(setupALFixture);
      await expect(
        contract.connect(addr1).alMint(3, {
          value: ethers.parseEther((3 * MINT_PRICE).toString()),
        })
      ).to.be.reverted;
    });

    it("ALに登録されていない場合はエラーが返される", async () => {
      const { contract, addr2 } = await loadFixture(setupALFixture);
      await expect(
        contract.connect(addr2).alMint(1, {
          value: ethers.parseEther(MINT_PRICE.toString()),
        })
      ).to.be.reverted;
    });
  });
});
