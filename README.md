# `The ANARCHY` Contract

The ANARCHY のコントラクトです。

FE は別プロジェクトで作成します。

## hardhat コマンド

テスト

```shell
npx hardhat test
```

ガス代の試算をしてテストを実行

```shell
REPORT_GAS=true npx hardhat test
```

デプロイ

```shell
npx hardhat run --network goerli scripts/deploy.ts
```

Etherscan の Verify

```shell
npx hardhat clean
npx hardhat verify ${ADDRESS} --network goerli

# 失敗する場合は以下のコマンドを試す
npx hardhat compile --force
```
