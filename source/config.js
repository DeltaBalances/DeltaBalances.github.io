// some big entries are in separate files
const exContracts = require('./config/contracts'); // DEX related smart contracts
const abi = require('./config/abi'); // common ABI definitions to parse transactions
const historyConf = require('./config/history'); // config values used for trade history
const addresses = require('./config/addresses'); // wallet adresses with a name label/idenitity
const instances = require('./config/contractInstances'); //uniswap, bancor instances

module.exports = {
  /* General config */
  homeURL: 'https://deltabalances.github.io',
  DeltaBalanceAddr: '0xbf320b8336b131e0270295c15478d91741f9fc11',

  //smart contracts
  exchangeContracts: exContracts,
  ABIs: abi,
  //history settings
  blockMonths: historyConf.blockMonths,
  history: historyConf.history,

  //attributes on tokens for exchanges that makes tokens show up as listed
  listedExchanges: ['ForkDelta', 'IDEX', 'DDEX', 'DDEX2', 'Binance', 'Radar', 'Kyber', 'OneInch'],

  /* token related variables, see backuptokens.js for a full token list */

  balanceTokens: [], //list of tokens used during balance loading, (appended at run-time)
  // 2 legacy token lists, still used in allowances.js
  tokens: [],
  customTokens: [],
  
  ethAddr: '0x0000000000000000000000000000000000000000', //address commonly used to indicate ETH as a token
  wrappedETH: {
    "0x0000000000000000000000000000000000000000": 1, // EtherDelta, IDEX, tokenStore, Decentrex  reserved for ETH
    "0xe495bcacaf29a0eb00fb67b86e9cd2a994dd55d8": 1, // 0x style ?, deprecated
    "0x2956356cd2a2bf3202f771f50d3d14a367b48070": 1, // 0x WETH v1 (deprecated)
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 1, // 0x WETH v2 (active)
    "0xecf8f87f810ecf450940c9f60066b4a7a501d6a7": 1, // WETH MKR 
    "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315": 1, // Bancor ether token 2
    "0xd76b5c2a23ef78368d8e34288b5b65d616b746ae": 1, // Bancor ether token 1
    "0xaa7427d8f17d87a28f5e1ba3adbb270badbe1011": 1, // ethfinex ETHW
    "0x50cb61afa3f023d17276dcfb35abf85c710d1cff": 1, // ethfinex ETHW
    "0x53b04999c1ff2d77fcdde98935bb936a67209e4c": 1, // Veil ETH
  },
  // currencies that take precedence to be the base pair in a trade found on the blockchain (e.g ETH<->BAT is shown as BAT-ETH)
  baseToken: {
    "0x6b175474e89094c44da98b954eedeac495271d0f": 1, // DAI stablecoin
    "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359": 2, // SAI (DAI) stablecoin
    "0xdac17f958d2ee523a2206206994597c13d831ec7": 3, // USDT 
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 4, // USDC
    "0x0000000000085d4780b73119b644ae5ecd22b376": 5, //TUSD v2
    "0x8dd5fbce2f6a956c3022ba3663759011dd51e73e": 6, // TUSD
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 7, // WBTC
    "0x8e870d67f660d95d5be530380d0ec0bd388289e1": 8, // PAX 
    "0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe": 9, // USDS
                                                    //ethfinex (diversifi) wrappers
    "0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f": 10, //daiw
    "0xd9ebebfdab08c643c5f2837632de920c70a56247": 11, //daiw
    "0x1a9b2d827f26b7d7c18fec4c1b27c1e8deeba26e": 12, //daiw
    "0x243318cb80785ab92f2c39543cb58958320e64b2": 13, //tusdw
    "0xeb52a95695ffa4cf411b804455287f0717884899": 14, //tusdw
    "0x69391cca2e38b845720c7deb694ec837877a8e53": 15, //usdcw
    "0x33d019eb137b853f0cdf555a5d5bd2749135ac31": 16, //usdtw

    "0xe41d2489571d322189246dafa5ebde1f4699f498": 17, // ZRX (fee in 0x sometimes as a zrx trade)
    "0x0027449bf0887ca3e431d263ffdefb244d95b555": 18, // NOT (airdrop coin openrelay)
    "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c": 19, // BNT (internal Bancor trades)
  },

  /* address variables */
  zrxRelayers: addresses.zrxRelayers,
  zrxTakers: addresses.zrxTakers,
  admins: addresses.admins,
  exchangeWallets: addresses.exchangeWallets,
  bancorConverters: instances.bancorConverters,
  uniswapContracts: instances.uniswapContracts,
  uniswapNewExTopic: '0x9d42cb017eb05bd8944ab536a8b35bc68085931dd5f4356489801453923953f9',
  uniswapContractsBlock: 10235031, //(uniswapV1) blocknumber up to which all newExchange events are saved (min 6627917)

  /* api related */
  etherscanAPIKey: 'CY1M8MIE5IJ87GKNGYF98PGQFIHVQ99V13',
  infuraKey: '87ee3513fad045acb1522ef7a30bd652',
  alchemyKey: 'ozV51x-gVqsq09qRjj7FQ-Y1sGJee62t',
  jsonRpcUrls: [ //public rpc providers by url
    "https://api.mycryptoapi.com/eth",
    //"https://main-rpc.linkpool.io"
  ],
  providerTimeout: 3000, // 3 sec
   // separate API keys for ethereum logs (history)
  historyUrls: [
    {name:"Infura.io - Fastest", url:'https://mainnet.infura.io/v3/a7ca261d0f724bac976dfdb263cb3866', maxRequestRange: 2500, concurrent: 10},
    {name:"Rivet.cloud - Alternative", url:'https://46c031f417ef4e4c81483a1e077c0ca2.eth.rpc.rivet.cloud/', maxRequestRange: 4000, concurrent: 5},
    {name:"Localhost:8545 - Advanced users", url:'http://localhost:8545', maxRequestRange: 2500, concurrent: 5}
  ],
  localNode: 'http://localhost:8545',
  socketURL: 'https://api.forkdelta.com', //forkdelta order/price api
};