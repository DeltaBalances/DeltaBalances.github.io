# [DeltaBalances.github.io](https://deltabalances.github.io)
A community tool to make Ethereum-based decentralized exchanges a little easier.
+ View all your ERC20 token balances in one place (including deposited balances)
+ Retrieve and export a history of all your DEX trades.
+ Look at the details of your transactions with decentralized exchanges.


DeltaBalances runs fully client side, powered by [Etherscan](https://etherscan.io) and [Infura](https://infura.io).

# Smart contract
Want to check a lot of token balances in your Dapp?
Try the DeltaBalances [smart contract](https://etherscan.io/address/0xbf320b8336b131e0270295c15478d91741f9fc11#code) 

Batch hundreds of tokens into a single web3 request:
+ Get the token balance for multiple tokens 
+ Get the deposited exchange balance for multiple tokens 
+ Get the token allowance for multiple tokens

Contract iterations:  
[V5](https://etherscan.io/address/0xbf320b8336b131e0270295c15478d91741f9fc11#code), [V4](https://etherscan.io/address/0x40a38911e470fc088beeb1a9480c2d69c847bcec#code), [V3](https://etherscan.io/address/0x3E25F0BA291F202188Ae9Bda3004A7B3a803599a#code), [V2](https://etherscan.io/address/0xf5f563D3A99152c18cE8b133232Fe34317F60FEF#code), [V1](https://etherscan.io/address/0x3150954EAE1a8a5e5EE1F1B8E8444Fe16EA9F94C#code)


# Exchange support
Supported Decentralized exchanges for each website feature.  

| Exchange | Deposited Tokens | Recent Tx| Tx Info| Trade History|
|----------|------------------|------------------|-----------------------------|------------------|
| 0x Instant (0x v2) | - | Yes| Yes| No |
| 0x Protocol v1 | - | Yes| Yes| Yes |
| 0x Protocol v2 | - | Yes| Yes| Yes |
| [AirSwap](https://airswap.io)| - | Yes |Yes |Yes|
| [Bancor](https://bancor.network)  | - | Yes| Yes | No|
| [DDEX hydro 1.0](https://ddex.io/)| - | Yes| Yes| Not yet |
| [DDEX hydro 1.1](https://ddex.io/)| - | Yes| Yes| Yes |
| Decentrex †| Yes| Yes| Yes| Yes |
| [Dexy †](https://app.dexy.exchange) |Yes| No| No | No|
| [EasyTrade](https://easytrade.io) |-| Yes| Yes | Yes|
| [Enclaves Dex](https://enclaves.io) | Yes | Yes| Yes | Yes|
| [Etfinex trustless v1 (v2<sup>*</sup>)](https://trustless.ethfinex.com) | - | Yes | Yes | Yes |
| [Eth2Dai](https://eth2dai.com/) |-|Yes| Yes | Yes|
| [ETHEN](https://ethen.market) |No|Yes|Yes|Yes|
| [EtherC](https://etherc.io) |Yes|Yes|Yes|Yes|
| [EtherDelta](https://etherdelta.com)| Yes| Yes| Yes| Yes | 
| [ETHEX](https://ethex.market)|-|Yes|Yes|Yes|
| [ForkDelta](https://forkDelta.app)| Yes| Yes| Yes| Yes | 
| [IDEX](https://idex.market)| Yes |Yes |Yes| No |
| [Joyso](https://joyso.io)|Yes| Not yet| Not yet | No|
| [Kyber Network](https://kyber.network) |-|Yes|Yes| Yes | Yes|
| [OasisDex](https://oasisdex.com) [OasisCommunity](https://oasiscommunity.github.io/dex/) |-|Yes| Yes | Yes|
| [OasisDirect](https://oasis.direct) |-|Yes| Yes | No|
| [SingularX](https://singularx.com)|Yes| Yes| Yes | Yes|
| [SwitchDex](https://switchdex.ag)|Yes| Yes| Yes | Not yet|
| [Switcheo](https://switcheo.exchange)|Yes| Partial (WIP)| Partial (WIP) | Not yet|
| [Token Store](https://token.store)| Yes| Yes| Yes| Yes |
| [Token store Instant-trade](https://token.store)| - | Yes| Yes | No|
| [Uniswap](https://uniswap.exchange)| - | Yes| Yes| Not yet|  

(† = Exchange is no longer active)  
<sup>*</sup> Ethfinex v2 uses 0x v2  

##### Requirements for support
Exchange contract features required per page.
+ **Token Balances**: Needs a contract with a public balance function with 1 or 2 parameters, like `balanceOf(.. , ..)`.
+ **Recent transactions**: Parses function input for transactions, needs published smart contract code.
+ **Trade history**: Parses trade events for transactions, needs published smart contract code.
+ **Transaction info**: Parses function input and emitted events for 1 transaction, needs published smart contract code.


##### 0x Protocol Relayers
Multiple exchanges that all use the same 0x Protocol smart contract (V1 or V2).
Popular relayers will be displayed by name, others will show up as `unknown 0x`.

Some of the many named relayers:  
[Radar Relay](https://radarrelay.com/), [DDEX (v1, 2018)](https://ddex.io/), [Paradex](https://paradex.io/),  [Ethfinex trustless v2](https://trustless.ethfinex.com), [OpenRelay](https://openrelay.xyz/), [Tokenlon](https://tokenlon.token.im/tokenlon)  
See `config/addresses.js` for the full list of named relayers.








