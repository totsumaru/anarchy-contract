# `The ANARCHY` Contract

The ANARCHY のコントラクトです。

FE は別プロジェクトで作成します。

## 販売概要

|              | 予定          | 備考                      |
| ------------ | ------------- | ------------------------- |
| リリース日   | 11/8          |                           |
| 価格         | 0.05ETH/枚    |                           |
| 販売枚数     | 1,850         | うち 50 枚は運営保有      |
| 販売方法     | AL セールのみ | 完売しない場合のみ Public |
| リビール     | あり          |                           |
| ストレージ   | Arweave       |                           |
| ロイヤリティ | 10%           |                           |
| 規格         | ERC721A       |                           |
| ギミック     | なし          |                           |

## hardhat コマンド

テスト

```shell
npx hardhat test
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
