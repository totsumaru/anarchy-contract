# `The ANARCHY` Contract

The ANARCHY のコントラクトです。

FEは別プロジェクトで作成します。

## hardhatコマンド

テスト

```shell
npx hardhat test
```

デプロイ

```shell
npx hardhat run --network goerli scripts/deploy.ts
```

EtherscanのVerify

```shell
npx hardhat clean
npx hardhat verify ${ADDRESS} --network goerli

# 失敗する場合は以下のコマンドを試す
npx hardhat compile --force
```