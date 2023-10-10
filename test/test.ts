import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  MAX_SUPPLY,
  MINT_PRICE,
  MAX_MINT_PER_TX,
  OWNER,
  deployFixture,
  setupALFixture,
  setupPublicFixture,
  Phase,
  TeamAddress1,
  TeamAddress2,
  TeamAddress3,
} from "./common";

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
    expect(await contract.phase()).to.equal(Phase.Paused);
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

// ----------------------------------------------------------
// User functions
// ----------------------------------------------------------

describe("alMint", () => {
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
    const { contract, deployer, addr1 } = await loadFixture(setupALFixture);
    // 最大供給量+1 をaddr1のALに追加
    await contract.connect(deployer).setAllowList([addr1], [MAX_SUPPLY + 1]);

    // 最大供給量をmint -> OK
    await expect(
      contract.connect(addr1).alMint(MAX_SUPPLY, {
        value: ethers.parseEther((MAX_SUPPLY * MINT_PRICE).toString()),
      })
    ).not.to.be.reverted;

    // 1mint -> 最大供給量を超えているためERROR
    await expect(
      contract.connect(addr1).alMint(1, {
        value: ethers.parseEther(MINT_PRICE.toString()),
      })
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("合計でALの数を超えた場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupALFixture);

    // 2mint -> ALは2つあるためOK
    await expect(
      contract.connect(addr1).alMint(2, {
        value: ethers.parseEther((MINT_PRICE * 2).toString()),
      })
    ).not.to.be.reverted;

    // 1mint -> ALの上限を超えているためERROR
    await expect(
      contract.connect(addr1).alMint(1, {
        value: ethers.parseEther(MINT_PRICE.toString()),
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

  it("PhaseがPublicSaleの場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupALFixture);
    await contract.setPhasePublicSale();

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

describe("publicMint", () => {
  it("mintできる", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);

    await expect(
      contract.connect(addr1).publicMint(2, {
        value: ethers.parseEther((MINT_PRICE * 2).toString()),
      })
    )
      .to.emit(contract, "Transfer")
      .withArgs(ethers.ZeroAddress, addr1.address, 1);

    // mint後の供給量を確認します
    expect(await contract.totalSupply()).to.equal(2);
    expect(await contract.balanceOf(addr1.address)).to.equal(2);
  });

  it("ETHが不足している場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);

    await expect(
      contract.connect(addr1).publicMint(1, {
        value: 0,
      })
    ).to.be.reverted;
  });

  it("最大供給量を超える場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);

    const mintQuantity = MAX_SUPPLY + 1;
    await expect(
      contract.connect(addr1).publicMint(mintQuantity, {
        value: ethers.parseEther((mintQuantity * MINT_PRICE).toString()),
      })
    ).to.be.reverted;
  });

  it("PhaseがPausedの場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);
    await contract.setPhasePaused();

    await expect(
      contract.connect(addr1).publicMint(1, {
        value: ethers.parseEther(MINT_PRICE.toString()),
      })
    ).to.be.reverted;
  });

  it("PhaseがALSaleの場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);
    await contract.setPhaseALSale();

    await expect(
      contract.connect(addr1).publicMint(1, {
        value: ethers.parseEther(MINT_PRICE.toString()),
      })
    ).to.be.reverted;
  });

  it("mint数が0の場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);

    await expect(contract.connect(addr1).publicMint(0, { value: 0 })).to.be
      .reverted;
  });

  it("1Txのmint数を超えている場合はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);
    const mintQuantity = MAX_MINT_PER_TX + 1;

    await expect(
      contract.connect(addr1).publicMint(mintQuantity, {
        value: ethers.parseEther((mintQuantity * MINT_PRICE).toString()),
      })
    ).to.be.reverted;
  });
});

describe("tokenURI", () => {
  it("リビール前のURLが期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);
    const notRevealedURI = "https://example.com";

    // notRevealedURIを設定
    await contract.connect(deployer).setNotRevealedURI(notRevealedURI);

    expect(await contract.tokenURI(1)).to.equal(notRevealedURI);
    expect(await contract.tokenURI(2)).to.equal(notRevealedURI);
  });

  it("リビール後のURLが期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);
    const baseURI = "https://example.com/";

    // baseURIを設定
    await contract.connect(deployer).setBaseURI(baseURI);
    // mint
    await contract.connect(deployer).setPhasePublicSale();
    await contract.connect(deployer).airdropMint(deployer, 1);
    // reveal
    await contract.connect(deployer).setIsRevealed(true);

    expect(await contract.tokenURI(1)).to.equal(`${baseURI}1.json`);
  });
});

// ----------------------------------------------------------
// OPERATOR functions
// ----------------------------------------------------------

describe("airdropMint", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer, addr1 } = await loadFixture(deployFixture);

    // 最大供給量でMintします
    await expect(contract.connect(deployer).airdropMint(addr1, MAX_SUPPLY)).not
      .to.be.reverted;

    expect(await contract.totalSupply()).to.equal(MAX_SUPPLY);
    expect(await contract.balanceOf(addr1.address)).to.equal(MAX_SUPPLY);
  });

  it("最大供給量を超えた場合はエラーが返される", async () => {
    const { contract, deployer, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).airdropMint(addr1, MAX_SUPPLY + 1))
      .to.be.reverted;
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).airdropMint(addr1, 1)).to.be.reverted;
  });
});

describe("setBaseURI", () => {
  const mock = "https://example.com/";

  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setBaseURI(mock)).not.to.be
      .reverted;

    expect(await contract.baseURI()).to.equal(mock);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setBaseURI(mock)).to.be.reverted;
  });
});

describe("setNotRevealedURI", () => {
  const mock = "https://example.com";

  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setNotRevealedURI(mock)).not.to.be
      .reverted;

    expect(await contract.notRevealedURI()).to.equal(mock);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setNotRevealedURI(mock)).to.be
      .reverted;
  });
});

describe("setExtension", () => {
  const mock = ".json";

  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setExtension(mock)).not.to.be
      .reverted;

    expect(await contract.extension()).to.equal(mock);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setExtension(mock)).to.be.reverted;
  });
});

describe("setIsRevealed", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    // 最初はfalseであることを確認
    expect(await contract.isRevealed()).to.equal(false);

    await expect(contract.connect(deployer).setIsRevealed(true)).not.to.be
      .reverted;

    expect(await contract.isRevealed()).to.equal(true);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setIsRevealed(true)).to.be.reverted;
  });
});

describe("setPhasePaused", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setPhasePaused()).not.to.be
      .reverted;

    expect(await contract.phase()).to.equal(Phase.Paused);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setPhasePaused()).to.be.reverted;
  });
});

describe("setPhaseALSale", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setPhaseALSale()).not.to.be
      .reverted;

    expect(await contract.phase()).to.equal(Phase.ALSale);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setPhaseALSale()).to.be.reverted;
  });
});

describe("setPhasePublicSale", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setPhasePublicSale()).not.to.be
      .reverted;

    expect(await contract.phase()).to.equal(Phase.PublicSale);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setPhasePublicSale()).to.be.reverted;
  });
});

describe("setAllowList", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer, addr1, addr2 } = await loadFixture(
      deployFixture
    );

    await expect(
      contract
        .connect(deployer)
        .setAllowList([addr1.address, addr2.address], [2, 3])
    ).not.to.be.reverted;

    expect(await contract.allowList(addr1.address)).to.equal(2);
    expect(await contract.allowList(addr2.address)).to.equal(3);
    expect(await contract.allowListSum()).to.equal(5);
  });

  it("変更した場合に期待した値と一致する", async () => {
    const { contract, deployer, addr1, addr2 } = await loadFixture(
      deployFixture
    );

    // 初期値を設定
    await expect(
      contract
        .connect(deployer)
        .setAllowList([addr1.address, addr2.address], [2, 3])
    ).not.to.be.reverted;

    // 変更
    await expect(contract.connect(deployer).setAllowList([addr1.address], [0]))
      .not.to.be.reverted;

    expect(await contract.allowList(addr1.address)).to.equal(0);
    expect(await contract.allowList(addr2.address)).to.equal(3);
    expect(await contract.allowListSum()).to.equal(3);
  });

  // it("ガス代試算用に1000件登録します", async () => {
  //   const { contract, deployer, addr1 } = await loadFixture(deployFixture);

  //   // 1000件のアドレスと数量を準備
  //   const addresses = Array.from({ length: 1000 }).map(() => {
  //     const randomWallet = ethers.Wallet.createRandom();
  //     return randomWallet.address;
  //   });
  //   const quantities = new Array(1000).fill(2);

  //   // トランザクションを送信
  //   const tx = await contract
  //     .connect(deployer)
  //     .setAllowList(addresses, quantities);

  //   // トランザクションのレシートを取得
  //   const receipt = await tx.wait();

  //   // ガス使用量をログ出力
  //   console.log(`1000件登録したときのガス代: ${receipt?.gasUsed.toString()}`);

  //   await expect(tx).not.to.be.reverted;
  // });

  it("配列の長さが一致しない場合はエラーが返される", async () => {
    const { contract, deployer, addr1 } = await loadFixture(deployFixture);

    await expect(
      contract.connect(deployer).setAllowList([addr1.address], [2, 3])
    ).to.be.reverted;
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setAllowList([addr1.address], [2])).to
      .be.reverted;
  });
});

describe("setDefaultRoyalty", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(deployer).setDefaultRoyalty(addr1, 500)).not
      .to.be.reverted;

    expect(await contract.royaltyInfo(1, ethers.parseEther("0.1"))).to.eql([
      addr1.address,
      ethers.parseEther("0.005"),
    ]);
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(deployFixture);

    await expect(contract.connect(addr1).setDefaultRoyalty(addr1, 500)).to.be
      .reverted;
  });
});

describe("withdraw", () => {
  it("期待した値と一致する", async () => {
    const { contract, deployer, addr1 } = await loadFixture(setupPublicFixture);

    // 2mintします(0.1ETH)
    await contract.connect(addr1).publicMint(2, {
      value: ethers.parseEther((MINT_PRICE * 2).toString()),
    });

    // コントラクトの残高が0.1ETHであることを確認します
    expect(await ethers.provider.getBalance(contract.getAddress())).to.equal(
      ethers.parseEther("0.1")
    );

    await expect(contract.connect(deployer).withdraw()).not.to.be.reverted;

    expect(await ethers.provider.getBalance(TeamAddress1)).to.equal(
      ethers.parseEther("0.009")
    );
    expect(await ethers.provider.getBalance(TeamAddress2)).to.equal(
      ethers.parseEther("0.003")
    );
    expect(await ethers.provider.getBalance(TeamAddress3)).to.equal(
      ethers.parseEther("0.088")
    );
  });

  it("OPERATOR以外はエラーが返される", async () => {
    const { contract, addr1 } = await loadFixture(setupPublicFixture);

    await expect(contract.connect(addr1).withdraw()).to.be.reverted;
  });
});
