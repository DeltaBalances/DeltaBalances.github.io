require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/config.js":[function(require,module,exports){
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
  listedExchanges: ['ForkDelta', 'IDEX', 'DDEX', 'Binance', 'Radar', 'Kyber', 'TokenStore'],

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
    "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315": 1, // Bancor ether token
    "0xaa7427d8f17d87a28f5e1ba3adbb270badbe1011": 1, // ethfinex ETHW
    "0x50cb61afa3f023d17276dcfb35abf85c710d1cff": 1, // ethfinex ETHW
    "0x53b04999c1ff2d77fcdde98935bb936a67209e4c": 1, // Veil ETH
  },
  // currencies that take precedence to be the base pair in a trade found on the blockchain (e.g ETH<->BAT is shown as BAT-ETH)
  baseToken: {
    "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359": 1, // DAI stablecoin
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

  /* api related */
  etherscanAPIKey: 'YHBUWV6P5B5ITKMI91JIRZZYBP1CG1V65R',
  infuraURL: 'https://mainnet.infura.io/v3/1b000043e1a84c468747a6b75b4541c1',  // infura project for ethereum logs (history)
  web3URLs: {
    Infura: 'https://mainnet.infura.io/v3/a736fb84e7d74effb636f41305a0afd3', // infura project for web3 calls
    Cloudflare: 'https://cloudflare-eth.com',
    myCrypto: 'https://api.mycryptoapi.com/eth',
  },
  localNode: 'http://localhost:8545',
  socketURL: 'https://api.forkdelta.com', //forkdelta order/price api
};
},{"./config/abi":1,"./config/addresses":2,"./config/contractInstances":3,"./config/contracts":4,"./config/history":5}],1:[function(require,module,exports){
  //exchange & token contract ABIs (stripped from:constant functions,constructors,fallback)
module.exports = {
  DeltaBalances: [{constant:false,inputs:[],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:true,inputs:[],name:"admin",outputs:[{name:"",type:"address"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"exchange",type:"address"},{name:"user",type:"address"},{name:"tokens",type:"address[]"}],name:"depositedBalances",outputs:[{name:"balances",type:"uint256[]"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"exchange",type:"address"},{name:"selector",type:"bytes4"},{name:"user",type:"address"},{name:"tokens",type:"address[]"},{name:"userFirst",type:"bool"}],name:"depositedBalancesGeneric",outputs:[{name:"balances",type:"uint256[]"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"exchange",type:"address"},{name:"selector",type:"bytes4"},{name:"user",type:"address"}],name:"depositedEtherGeneric",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"functionSignature",type:"string"}],name:"getFunctionSelector",outputs:[{name:"",type:"bytes4"}],payable:false,stateMutability:"pure",type:"function"},{constant:true,inputs:[{name:"spenderContract",type:"address"},{name:"user",type:"address"},{name:"tokens",type:"address[]"}],name:"tokenAllowances",outputs:[{name:"allowances",type:"uint256[]"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"user",type:"address"},{name:"tokens",type:"address[]"}],name:"tokenBalances",outputs:[{name:"balances",type:"uint256[]"}],payable:false,stateMutability:"view",type:"function"}],
  
  // token interactions
  //Generic ERC721, list before erc20 because they overlap definitions
  Erc721: [{constant:true,inputs:[{name:"_tokenId",type:"uint256"}],name:"getApproved",outputs:[{name:"",type:"address"}],payable:false,stateMutability:"view",type:"function"},{constant:false,inputs:[{name:"_to",type:"address"},{name:"_tokenId",type:"uint256"}],name:"approve",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_from",type:"address"},{name:"_to",type:"address"},{name:"_tokenId",type:"uint256"}],name:"transferFrom",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_from",type:"address"},{name:"_to",type:"address"},{name:"_tokenId",type:"uint256"}],name:"safeTransferFrom",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:true,inputs:[{name:"_tokenId",type:"uint256"}],name:"ownerOf",outputs:[{name:"_owner",type:"address"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"_owner",type:"address"}],name:"balanceOf",outputs:[{name:"_balance",type:"uint256"}],payable:false,stateMutability:"view",type:"function"},{constant:false,inputs:[{name:"_operator",type:"address"},{name:"_approved",type:"bool"}],name:"setApprovalForAll",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_to",type:"address"},{name:"_tokenId",type:"uint256"}],name:"transfer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_from",type:"address"},{name:"_to",type:"address"},{name:"_tokenId",type:"uint256"},{name:"data",type:"bytes"}],name:"safeTransferFrom",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:true,inputs:[{name:"_owner",type:"address"},{name:"_operator",type:"address"}],name:"isApprovedForAll",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"view",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_from",type:"address"},{indexed:true,name:"_to",type:"address"},{indexed:false,name:"_tokenId",type:"uint256"}],name:"Transfer",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_owner",type:"address"},{indexed:true,name:"_approved",type:"address"},{indexed:false,name:"_tokenId",type:"uint256"}],name:"Approval",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_owner",type:"address"},{indexed:true,name:"_operator",type:"address"},{indexed:false,name:"_approved",type:"bool"}],name:"ApprovalForAll",type:"event"}],
  // Generic ERC20, uses WETH token to also capture ETH wrapping/unwrapping 
  Erc20: [{constant:false,inputs:[{name:"guy",type:"address"},{name:"wad",type:"uint256"}],name:"approve",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"src",type:"address"},{name:"dst",type:"address"},{name:"wad",type:"uint256"}],name:"transferFrom",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"wad",type:"uint256"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:true,inputs:[],name:"decimals",outputs:[{name:"",type:"uint8"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[{name:"",type:"address"}],name:"balanceOf",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"view",type:"function"},{constant:true,inputs:[],name:"symbol",outputs:[{name:"",type:"string"}],payable:false,stateMutability:"view",type:"function"},{constant:false,inputs:[{name:"dst",type:"address"},{name:"wad",type:"uint256"}],name:"transfer",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"deposit",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:true,inputs:[{name:"",type:"address"},{name:"",type:"address"}],name:"allowance",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"view",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"src",type:"address"},{indexed:true,name:"guy",type:"address"},{indexed:false,name:"wad",type:"uint256"}],name:"Approval",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"src",type:"address"},{indexed:true,name:"dst",type:"address"},{indexed:false,name:"wad",type:"uint256"}],name:"Transfer",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"dst",type:"address"},{indexed:false,name:"wad",type:"uint256"}],name:"Deposit",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"src",type:"address"},{indexed:false,name:"wad",type:"uint256"}],name:"Withdrawal",type:"event"}],
  //bancor ETH token for Issuance,Destruction
  Erc20Bancor: [{constant:false,inputs:[{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTo",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"deposit",outputs:[],payable:true,stateMutability:"payable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"_amount",type:"uint256"}],name:"Issuance",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_amount",type:"uint256"}],name:"Destruction",type:"event"}],
  //input for wrapping/unwrapping ethfinex wrappers
  EthfinexLockToken: [{constant:false,inputs:[{name:"_value",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"},{name:"signatureValidUntilBlock",type:"uint256"}],name:"withdraw",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_erc20old",type:"bool"}],name:"withdrawDifferentToken",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_value",type:"uint256"},{name:"_forTime",type:"uint256"}],name:"deposit",outputs:[{name:"success",type:"bool"}],payable:true,stateMutability:"payable",type:"function"}],
  //veil eth wrapper for depositAndApprove,withdrawAndTransfer
  VeilETH: [{constant:false,inputs:[{name:"_amount",type:"uint256"},{name:"_target",type:"address"}],name:"withdrawAndTransfer",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,"inputs":[{name:"_spender",type:"address"},{name:"_allowance",type:"uint256"}],name:"depositAndApprove",outputs:[{name:"",type:"bool"}],payable:true,stateMutability:"payable",type:"function"}],
  
  //exchanges
  EtherDelta: [{constant:false,inputs:[{name:"tokenGet",type:"address"},{name:"amountGet",type:"uint256"},{name:"tokenGive",type:"address"},{name:"amountGive",type:"uint256"},{name:"expires",type:"uint256"},{name:"nonce",type:"uint256"},{name:"user",type:"address"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"},{name:"amount",type:"uint256"}],name:"trade",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"tokenGet",type:"address"},{name:"amountGet",type:"uint256"},{name:"tokenGive",type:"address"},{name:"amountGive",type:"uint256"},{name:"expires",type:"uint256"},{name:"nonce",type:"uint256"}],name:"order",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"tokenGet",type:"address"},{name:"amountGet",type:"uint256"},{name:"tokenGive",type:"address"},{name:"amountGive",type:"uint256"},{name:"expires",type:"uint256"},{name:"nonce",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"cancelOrder",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"depositToken",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"feeMake_",type:"uint256"}],name:"changeFeeMake",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"feeRebate_",type:"uint256"}],name:"changeFeeRebate",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"feeAccount_",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"feeTake_",type:"uint256"}],name:"changeFeeTake",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,type:"function"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"user",type:"address"}],name:"Order",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"get",type:"address"},{indexed:false,name:"give",type:"address"}],name:"Trade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Deposit",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Withdraw",type:"event"}],
  TokenStore: [{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_user",type:"address"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"},{name:"_amount",type:"uint256"}],name:"trade",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"cancelOrder",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"depositToken",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_accountModifiers",type:"address"}],name:"changeAccountModifiers",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"},{name:"_user",type:"address"}],name:"depositTokenForUser",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_tradeTracker",type:"address"}],name:"changeTradeTracker",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_fee",type:"uint256"}],name:"changeFee",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_user",type:"address"}],name:"depositForUser",outputs:[],payable:true,type:"function"},{constant:false,inputs:[{name:"_feeAccount",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_tokens",type:"address[]"}],name:"migrateFunds",outputs:[],payable:false,type:"function"},{constant:false,inputs:[],name:"deposit",outputs:[],payable:true,type:"function"},{constant:false,inputs:[{name:"_deprecated",type:"bool"},{name:"_successor",type:"address"}],name:"deprecate",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,type:"function"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"get",type:"address"},{indexed:false,name:"give",type:"address"},{indexed:false,name:"nonce",type:"uint256"}],name:"Trade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Deposit",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Withdraw",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"}],name:"FundsMigrated",type:"event"}],
  Idex: [{constant:false,inputs:[{name:"assertion",type:"bool"}],name:"assert",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"setOwner",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"},{name:"user",type:"address"},{name:"nonce",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"},{name:"feeWithdrawal",type:"uint256"}],name:"adminWithdraw",outputs:[{name:"success",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"depositToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"admin",type:"address"},{name:"isAdmin",type:"bool"}],name:"setAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"getOwner",outputs:[{name:"out",type:"address"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"a",type:"uint256"},{name:"b",type:"uint256"}],name:"safeSub",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"user",type:"address"},{name:"nonce",type:"uint256"}],name:"invalidateOrdersBefore",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"a",type:"uint256"},{name:"b",type:"uint256"}],name:"safeMul",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"deposit",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"expiry",type:"uint256"}],name:"setInactivityReleasePeriod",outputs:[{name:"success",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"a",type:"uint256"},{name:"b",type:"uint256"}],name:"safeAdd",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tradeValues",type:"uint256[8]"},{name:"tradeAddresses",type:"address[4]"},{name:"v",type:"uint8[2]"},{name:"rs",type:"bytes32[4]"}],name:"trade",outputs:[{name:"success",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"withdraw",outputs:[{name:"success",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"previousOwner",type:"address"},{indexed:true,name:"newOwner",type:"address"}],name:"SetOwner",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenBuy",type:"address"},{indexed:false,name:"amountBuy",type:"uint256"},{indexed:false,name:"tokenSell",type:"address"},{indexed:false,name:"amountSell",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"}],name:"Order",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenBuy",type:"address"},{indexed:false,name:"amountBuy",type:"uint256"},{indexed:false,name:"tokenSell",type:"address"},{indexed:false,name:"amountSell",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenBuy",type:"address"},{indexed:false,name:"amountBuy",type:"uint256"},{indexed:false,name:"tokenSell",type:"address"},{indexed:false,name:"amountSell",type:"uint256"},{indexed:false,name:"get",type:"address"},{indexed:false,name:"give",type:"address"}],name:"Trade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Deposit",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Withdraw",type:"event"}],
  '0x': [{constant:false,inputs:[{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"fillTakerTokenAmount",type:"uint256"},{name:"shouldThrowOnInsufficientBalanceOrAllowance",type:"bool"},{name:"v",type:"uint8[]"},{name:"r",type:"bytes32[]"},{name:"s",type:"bytes32[]"}],name:"fillOrdersUpTo",outputs:[{name:"",type:"uint256"}],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5]"},{name:"orderValues",type:"uint256[6]"},{name:"cancelTakerTokenAmount",type:"uint256"}],name:"cancelOrder",outputs:[{name:"",type:"uint256"}],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"fillTakerTokenAmounts",type:"uint256[]"},{name:"v",type:"uint8[]"},{name:"r",type:"bytes32[]"},{name:"s",type:"bytes32[]"}],name:"batchFillOrKillOrders",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5]"},{name:"orderValues",type:"uint256[6]"},{name:"fillTakerTokenAmount",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"fillOrKillOrder",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"fillTakerTokenAmounts",type:"uint256[]"},{name:"shouldThrowOnInsufficientBalanceOrAllowance",type:"bool"},{name:"v",type:"uint8[]"},{name:"r",type:"bytes32[]"},{name:"s",type:"bytes32[]"}],name:"batchFillOrders",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"cancelTakerTokenAmounts",type:"uint256[]"}],name:"batchCancelOrders",outputs:[],payable:false,type:"function"},{constant:false,inputs:[{name:"orderAddresses",type:"address[5]"},{name:"orderValues",type:"uint256[6]"},{name:"fillTakerTokenAmount",type:"uint256"},{name:"shouldThrowOnInsufficientBalanceOrAllowance",type:"bool"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"fillOrder",outputs:[{name:"filledTakerTokenAmount",type:"uint256"}],payable:false,type:"function"},{anonymous:false,inputs:[{indexed:true,name:"maker",type:"address"},{indexed:false,name:"taker",type:"address"},{indexed:true,name:"feeRecipient",type:"address"},{indexed:false,name:"makerToken",type:"address"},{indexed:false,name:"takerToken",type:"address"},{indexed:false,name:"filledMakerTokenAmount",type:"uint256"},{indexed:false,name:"filledTakerTokenAmount",type:"uint256"},{indexed:false,name:"paidMakerFee",type:"uint256"},{indexed:false,name:"paidTakerFee",type:"uint256"},{indexed:true,name:"tokens",type:"bytes32"},{indexed:false,name:"orderHash",type:"bytes32"}],name:"LogFill",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"maker",type:"address"},{indexed:true,name:"feeRecipient",type:"address"},{indexed:false,name:"makerToken",type:"address"},{indexed:false,name:"takerToken",type:"address"},{indexed:false,name:"cancelledMakerTokenAmount",type:"uint256"},{indexed:false,name:"cancelledTakerTokenAmount",type:"uint256"},{indexed:true,name:"tokens",type:"bytes32"},{indexed:false,name:"orderHash",type:"bytes32"}],name:"LogCancel",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"errorId",type:"uint8"},{indexed:true,name:"orderHash",type:"bytes32"}],name:"LogError",type:"event"}],
  '0x2': [{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"takerAssetFillAmounts",type:"uint256[]"},{name:"signatures",type:"bytes[]"}],name:"batchFillOrders",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"hash",type:"bytes32"},{name:"signerAddress",type:"address"},{name:"signature",type:"bytes"}],name:"preSign",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"leftOrder",type:"tuple"},{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"rightOrder",type:"tuple"},{name:"leftSignature",type:"bytes"},{name:"rightSignature",type:"bytes"}],name:"matchOrders",outputs:[{components:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"left",type:"tuple"},{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"right",type:"tuple"},{name:"leftMakerAssetSpreadAmount",type:"uint256"}],name:"matchedFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"order",type:"tuple"},{name:"takerAssetFillAmount",type:"uint256"},{name:"signature",type:"bytes"}],name:"fillOrderNoThrow",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"fillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"}],name:"batchCancelOrders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"takerAssetFillAmounts",type:"uint256[]"},{name:"signatures",type:"bytes[]"}],name:"batchFillOrKillOrders",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"targetOrderEpoch",type:"uint256"}],name:"cancelOrdersUpTo",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"takerAssetFillAmounts",type:"uint256[]"},{name:"signatures",type:"bytes[]"}],name:"batchFillOrdersNoThrow",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"order",type:"tuple"},{name:"takerAssetFillAmount",type:"uint256"},{name:"signature",type:"bytes"}],name:"fillOrKillOrder",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"fillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"validatorAddress",type:"address"},{name:"approval",type:"bool"}],name:"setSignatureValidatorApproval",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"takerAssetFillAmount",type:"uint256"},{name:"signatures",type:"bytes[]"}],name:"marketSellOrders",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"makerAssetFillAmount",type:"uint256"},{name:"signatures",type:"bytes[]"}],name:"marketBuyOrdersNoThrow",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"order",type:"tuple"},{name:"takerAssetFillAmount",type:"uint256"},{name:"signature",type:"bytes"}],name:"fillOrder",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"fillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"salt",type:"uint256"},{name:"signerAddress",type:"address"},{name:"data",type:"bytes"},{name:"signature",type:"bytes"}],name:"executeTransaction",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"assetProxy",type:"address"}],name:"registerAssetProxy",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"order",type:"tuple"}],name:"cancelOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"takerAssetFillAmount",type:"uint256"},{name:"signatures",type:"bytes[]"}],name:"marketSellOrdersNoThrow",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"makerAssetFillAmount",type:"uint256"},{name:"signatures",type:"bytes[]"}],name:"marketBuyOrders",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"totalFillResults",type:"tuple"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"signerAddress",type:"address"},{indexed:true,name:"validatorAddress",type:"address"},{indexed:false,name:"approved",type:"bool"}],name:"SignatureValidatorApproval",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"makerAddress",type:"address"},{indexed:true,name:"feeRecipientAddress",type:"address"},{indexed:false,name:"takerAddress",type:"address"},{indexed:false,name:"senderAddress",type:"address"},{indexed:false,name:"makerAssetFilledAmount",type:"uint256"},{indexed:false,name:"takerAssetFilledAmount",type:"uint256"},{indexed:false,name:"makerFeePaid",type:"uint256"},{indexed:false,name:"takerFeePaid",type:"uint256"},{indexed:true,name:"orderHash",type:"bytes32"},{indexed:false,name:"makerAssetData",type:"bytes"},{indexed:false,name:"takerAssetData",type:"bytes"}],name:"Fill",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"makerAddress",type:"address"},{indexed:true,name:"feeRecipientAddress",type:"address"},{indexed:false,name:"senderAddress",type:"address"},{indexed:true,name:"orderHash",type:"bytes32"},{indexed:false,name:"makerAssetData",type:"bytes"},{indexed:false,name:"takerAssetData",type:"bytes"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"makerAddress",type:"address"},{indexed:true,name:"senderAddress",type:"address"},{indexed:false,name:"orderEpoch",type:"uint256"}],name:"CancelUpTo",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"bytes4"},{indexed:false,name:"assetProxy",type:"address"}],name:"AssetProxyRegistered",type:"event"}],
  '0xForwarder2': [{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"makerAssetFillAmount",type:"uint256"},{name:"signatures",type:"bytes[]"},{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"feeOrders",type:"tuple[]"},{name:"feeSignatures",type:"bytes[]"},{name:"feePercentage",type:"uint256"},{name:"feeRecipient",type:"address"}],name:"marketBuyOrdersWithEth",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"orderFillResults",type:"tuple"},{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"feeOrderFillResults",type:"tuple"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"assetData",type:"bytes"},{name:"amount",type:"uint256"}],name:"withdrawAsset",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"orders",type:"tuple[]"},{name:"signatures",type:"bytes[]"},{components:[{name:"makerAddress",type:"address"},{name:"takerAddress",type:"address"},{name:"feeRecipientAddress",type:"address"},{name:"senderAddress",type:"address"},{name:"makerAssetAmount",type:"uint256"},{name:"takerAssetAmount",type:"uint256"},{name:"makerFee",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"expirationTimeSeconds",type:"uint256"},{name:"salt",type:"uint256"},{name:"makerAssetData",type:"bytes"},{name:"takerAssetData",type:"bytes"}],name:"feeOrders",type:"tuple[]"},{name:"feeSignatures",type:"bytes[]"},{name:"feePercentage",type:"uint256"},{name:"feeRecipient",type:"address"}],name:"marketSellOrdersWithEth",outputs:[{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"orderFillResults",type:"tuple"},{components:[{name:"makerAssetFilledAmount",type:"uint256"},{name:"takerAssetFilledAmount",type:"uint256"},{name:"makerFeePaid",type:"uint256"},{name:"takerFeePaid",type:"uint256"}],name:"feeOrderFillResults",type:"tuple"}],payable:true,stateMutability:"payable",type:"function"}],
  //DDEX post 0x protocol (hydro 1.0 and hydro 1.1)
  DDEX: [{constant:false,inputs:[{name:"delegate",type:"address"}],name:"approveDelegate",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newConfig",type:"bytes32"}],name:"changeDiscountConfig",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"exitIncentiveSystem",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"renounceOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"trader",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"},{components:[{name:"config",type:"bytes32"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"signature",type:"tuple"}],name:"takerOrderParam",type:"tuple"},{components:[{name:"trader",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"},{components:[{name:"config",type:"bytes32"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"signature",type:"tuple"}],name:"makerOrderParams",type:"tuple[]"},{components:[{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"},{name:"relayer",type:"address"}],name:"orderAddressSet",type:"tuple"}],name:"matchOrders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"trader",type:"address"},{name:"relayer",type:"address"},{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"}],name:"order",type:"tuple"}],name:"cancelOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"joinIncentiveSystem",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"delegate",type:"address"}],name:"revokeDelegate",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"orderHash",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"baseToken",type:"address"},{indexed:false,name:"quoteToken",type:"address"},{indexed:false,name:"relayer",type:"address"},{indexed:false,name:"maker",type:"address"},{indexed:false,name:"taker",type:"address"},{indexed:false,name:"baseTokenAmount",type:"uint256"},{indexed:false,name:"quoteTokenAmount",type:"uint256"},{indexed:false,name:"makerFee",type:"uint256"},{indexed:false,name:"takerFee",type:"uint256"},{indexed:false,name:"makerGasFee",type:"uint256"},{indexed:false,name:"makerRebate",type:"uint256"},{indexed:false,name:"takerGasFee",type:"uint256"}],name:"Match",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"previousOwner",type:"address"},{indexed:true,name:"newOwner",type:"address"}],name:"OwnershipTransferred",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"relayer",type:"address"},{indexed:true,name:"delegate",type:"address"}],name:"RelayerApproveDelegate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"relayer",type:"address"},{indexed:true,name:"delegate",type:"address"}],name:"RelayerRevokeDelegate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"relayer",type:"address"}],name:"RelayerExit",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"relayer",type:"address"}],name:"RelayerJoin",type:"event"}],
  DDEX2: [{constant:false,inputs:[{name:"delegate",type:"address"}],name:"approveDelegate",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newConfig",type:"bytes32"}],name:"changeDiscountConfig",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"exitIncentiveSystem",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"trader",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"},{components:[{name:"config",type:"bytes32"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"signature",type:"tuple"}],name:"takerOrderParam",type:"tuple"},{components:[{name:"trader",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"},{components:[{name:"config",type:"bytes32"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"signature",type:"tuple"}],name:"makerOrderParams",type:"tuple[]"},{name:"baseTokenFilledAmounts",type:"uint256[]"},{components:[{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"},{name:"relayer",type:"address"}],name:"orderAddressSet",type:"tuple"}],name:"matchOrders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{components:[{name:"trader",type:"address"},{name:"relayer",type:"address"},{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"},{name:"baseTokenAmount",type:"uint256"},{name:"quoteTokenAmount",type:"uint256"},{name:"gasTokenAmount",type:"uint256"},{name:"data",type:"bytes32"}],name:"order",type:"tuple"}],name:"cancelOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"orderHash",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{components:[{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"},{name:"relayer",type:"address"}],indexed:false,name:"addressSet",type:"tuple"},{components:[{name:"maker",type:"address"},{name:"taker",type:"address"},{name:"buyer",type:"address"},{name:"makerFee",type:"uint256"},{name:"makerRebate",type:"uint256"},{name:"takerFee",type:"uint256"},{name:"makerGasFee",type:"uint256"},{name:"takerGasFee",type:"uint256"},{name:"baseTokenFilledAmount",type:"uint256"},{name:"quoteTokenFilledAmount",type:"uint256"}],indexed:false,name:"result",type:"tuple"}],name:"Match",type:"event"}],
  
  OasisDex: [{constant:false,inputs:[{name:"pay_gem",type:"address"},{name:"pay_amt",type:"uint256"},{name:"buy_gem",type:"address"},{name:"min_fill_amount",type:"uint256"}],name:"sellAllAmount",outputs:[{name:"fill_amt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"stop",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"pay_gem",type:"address"},{name:"buy_gem",type:"address"},{name:"pay_amt",type:"uint128"},{name:"buy_amt",type:"uint128"}],name:"make",outputs:[{name:"",type:"bytes32"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"owner_",type:"address"}],name:"setOwner",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"}],name:"addTokenPairWhitelist",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"baseToken",type:"address"},{name:"quoteToken",type:"address"}],name:"remTokenPairWhitelist",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"pay_amt",type:"uint256"},{name:"pay_gem",type:"address"},{name:"buy_amt",type:"uint256"},{name:"buy_gem",type:"address"},{name:"pos",type:"uint256"}],name:"offer",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"uint256"},{name:"pos",type:"uint256"}],name:"insert",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"matchingEnabled_",type:"bool"}],name:"setMatchingEnabled",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"uint256"}],name:"cancel",outputs:[{name:"success",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"uint256"}],name:"del_rank",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"bytes32"},{name:"maxTakeAmount",type:"uint128"}],name:"take",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id_",type:"bytes32"}],name:"bump",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"authority_",type:"address"}],name:"setAuthority",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"buy_gem",type:"address"},{name:"buy_amt",type:"uint256"},{name:"pay_gem",type:"address"},{name:"max_fill_amount",type:"uint256"}],name:"buyAllAmount",outputs:[{name:"fill_amt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"bytes32"}],name:"kill",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"pay_gem",type:"address"},{name:"dust",type:"uint256"}],name:"setMinSell",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"buyEnabled_",type:"bool"}],name:"setBuyEnabled",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"id",type:"uint256"},{name:"amount",type:"uint256"}],name:"buy",outputs:[{name:"",type:"bool"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"pay_amt",type:"uint256"},{name:"pay_gem",type:"address"},{name:"buy_amt",type:"uint256"},{name:"buy_gem",type:"address"},{name:"pos",type:"uint256"},{name:"rounding",type:"bool"}],name:"offer",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"pay_amt",type:"uint256"},{name:"pay_gem",type:"address"},{name:"buy_amt",type:"uint256"},{name:"buy_gem",type:"address"}],name:"offer",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:true,inputs:[{indexed:true,name:"sig",type:"bytes4"},{indexed:true,name:"guy",type:"address"},{indexed:true,name:"foo",type:"bytes32"},{indexed:true,name:"bar",type:"bytes32"},{indexed:false,name:"wad",type:"uint256"},{indexed:false,name:"fax",type:"bytes"}],name:"LogNote",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"uint256"}],name:"LogItemUpdate",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"pay_amt",type:"uint256"},{indexed:true,name:"pay_gem",type:"address"},{indexed:false,name:"buy_amt",type:"uint256"},{indexed:true,name:"buy_gem",type:"address"}],name:"LogTrade",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"id",type:"bytes32"},{indexed:true,name:"pair",type:"bytes32"},{indexed:true,name:"maker",type:"address"},{indexed:false,name:"pay_gem",type:"address"},{indexed:false,name:"buy_gem",type:"address"},{indexed:false,name:"pay_amt",type:"uint128"},{indexed:false,name:"buy_amt",type:"uint128"},{indexed:false,name:"timestamp",type:"uint64"}],name:"LogMake",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"id",type:"bytes32"},{indexed:true,name:"pair",type:"bytes32"},{indexed:true,name:"maker",type:"address"},{indexed:false,name:"pay_gem",type:"address"},{indexed:false,name:"buy_gem",type:"address"},{indexed:false,name:"pay_amt",type:"uint128"},{indexed:false,name:"buy_amt",type:"uint128"},{indexed:false,name:"timestamp",type:"uint64"}],name:"LogBump",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"bytes32"},{indexed:true,name:"pair",type:"bytes32"},{indexed:true,name:"maker",type:"address"},{indexed:false,name:"pay_gem",type:"address"},{indexed:false,name:"buy_gem",type:"address"},{indexed:true,name:"taker",type:"address"},{indexed:false,name:"take_amt",type:"uint128"},{indexed:false,name:"give_amt",type:"uint128"},{indexed:false,name:"timestamp",type:"uint64"}],name:"LogTake",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"id",type:"bytes32"},{indexed:true,name:"pair",type:"bytes32"},{indexed:true,name:"maker",type:"address"},{indexed:false,name:"pay_gem",type:"address"},{indexed:false,name:"buy_gem",type:"address"},{indexed:false,name:"pay_amt",type:"uint128"},{indexed:false,name:"buy_amt",type:"uint128"},{indexed:false,name:"timestamp",type:"uint64"}],name:"LogKill",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"authority",type:"address"}],name:"LogSetAuthority",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"owner",type:"address"}],name:"LogSetOwner",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"isEnabled",type:"bool"}],name:"LogBuyEnabled",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"pay_gem",type:"address"},{indexed:false,name:"min_amount",type:"uint256"}],name:"LogMinSell",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"isEnabled",type:"bool"}],name:"LogMatchingEnabled",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"uint256"}],name:"LogUnsortedOffer",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"uint256"}],name:"LogSortedOffer",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"baseToken",type:"address"},{indexed:false,name:"quoteToken",type:"address"}],name:"LogAddTokenPairWhitelist",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"baseToken",type:"address"},{indexed:false,name:"quoteToken",type:"address"}],name:"LogRemTokenPairWhitelist",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"keeper",type:"address"},{indexed:false,name:"id",type:"uint256"}],name:"LogInsert",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"keeper",type:"address"},{indexed:false,name:"id",type:"uint256"}],name:"LogDelete",type:"event"}],
  OasisDexOld3: [{constant:false,inputs:[{name:"id",type:"uint256"}],name:"cancel",outputs:[{name:"success",type:"bool"}],payable:false,type:"function"},{constant:false,inputs:[{name:"id",type:"uint256"},{name:"quantity",type:"uint256"}],name:"buy",outputs:[{name:"success",type:"bool"}],payable:false,type:"function"},{constant:false,inputs:[{name:"sell_how_much",type:"uint256"},{name:"sell_which_token",type:"address"},{name:"buy_how_much",type:"uint256"},{name:"buy_which_token",type:"address"}],name:"offer",outputs:[{name:"id",type:"uint256"}],payable:false,type:"function"},{anonymous:false,inputs:[{indexed:false,name:"id",type:"uint256"}],name:"ItemUpdate",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"sell_how_much",type:"uint256"},{indexed:true,name:"sell_which_token",type:"address"},{indexed:false,name:"buy_how_much",type:"uint256"},{indexed:true,name:"buy_which_token",type:"address"}],name:"Trade",type:"event"}],
  OasisDirect: [{constant:false,inputs:[{name:"otc",type:"address"},{name:"payToken",type:"address"},{name:"payAmt",type:"uint256"},{name:"wethToken",type:"address"},{name:"minBuyAmt",type:"uint256"}],name:"sellAllAmountBuyEth",outputs:[{name:"wethAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"otc",type:"address"},{name:"payToken",type:"address"},{name:"payAmt",type:"uint256"},{name:"buyToken",type:"address"},{name:"minBuyAmt",type:"uint256"}],name:"sellAllAmount",outputs:[{name:"buyAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"otc",type:"address"},{name:"buyToken",type:"address"},{name:"buyAmt",type:"uint256"},{name:"payToken",type:"address"},{name:"maxPayAmt",type:"uint256"}],name:"buyAllAmount",outputs:[{name:"payAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"wethAmt",type:"uint256"},{name:"payToken",type:"address"},{name:"maxPayAmt",type:"uint256"}],name:"createAndBuyAllAmountBuyEth",outputs:[{name:"proxy",type:"address"},{name:"payAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"payToken",type:"address"},{name:"payAmt",type:"uint256"},{name:"minBuyAmt",type:"uint256"}],name:"createAndSellAllAmountBuyEth",outputs:[{name:"proxy",type:"address"},{name:"wethAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"buyToken",type:"address"},{name:"buyAmt",type:"uint256"}],name:"createAndBuyAllAmountPayEth",outputs:[{name:"proxy",type:"address"},{name:"wethAmt",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"buyToken",type:"address"},{name:"minBuyAmt",type:"uint256"}],name:"createAndSellAllAmountPayEth",outputs:[{name:"proxy",type:"address"},{name:"buyAmt",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"buyToken",type:"address"},{name:"buyAmt",type:"uint256"},{name:"payToken",type:"address"},{name:"maxPayAmt",type:"uint256"}],name:"createAndBuyAllAmount",outputs:[{name:"proxy",type:"address"},{name:"payAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"otc",type:"address"},{name:"buyToken",type:"address"},{name:"buyAmt",type:"uint256"},{name:"wethToken",type:"address"}],name:"buyAllAmountPayEth",outputs:[{name:"wethAmt",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"factory",type:"address"},{name:"otc",type:"address"},{name:"payToken",type:"address"},{name:"payAmt",type:"uint256"},{name:"buyToken",type:"address"},{name:"minBuyAmt",type:"uint256"}],name:"createAndSellAllAmount",outputs:[{name:"proxy",type:"address"},{name:"buyAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"otc",type:"address"},{name:"wethToken",type:"address"},{name:"buyToken",type:"address"},{name:"minBuyAmt",type:"uint256"}],name:"sellAllAmountPayEth",outputs:[{name:"buyAmt",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"otc",type:"address"},{name:"wethToken",type:"address"},{name:"wethAmt",type:"uint256"},{name:"payToken",type:"address"},{name:"maxPayAmt",type:"uint256"}],name:"buyAllAmountBuyEth",outputs:[{name:"payAmt",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"}],
  //Proxy for delegatecalls to another OasisDirect
  OasisProxy: [{constant:false,inputs:[{name:"_target",type:"address"},{name:"_data",type:"bytes"}],name:"execute",outputs:[{name:"response",type:"bytes32"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_code",type:"bytes"},{name:"_data",type:"bytes"}],name:"execute",outputs:[{name:"target",type:"address"},{name:"response",type:"bytes32"}],payable:true,stateMutability:"payable",type:"function"}],

  AirSwap: [{constant:false,inputs:[{name:"makerAddress",type:"address"},{name:"makerAmount",type:"uint256"},{name:"makerToken",type:"address"},{name:"takerAddress",type:"address"},{name:"takerAmount",type:"uint256"},{name:"takerToken",type:"address"},{name:"expiration",type:"uint256"},{name:"nonce",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"fill",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"makerAddress",type:"address"},{name:"makerAmount",type:"uint256"},{name:"makerToken",type:"address"},{name:"takerAddress",type:"address"},{name:"takerAmount",type:"uint256"},{name:"takerToken",type:"address"},{name:"expiration",type:"uint256"},{name:"nonce",type:"uint256"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],name:"cancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"makerAddress",type:"address"},{indexed:false,name:"makerAmount",type:"uint256"},{indexed:true,name:"makerToken",type:"address"},{indexed:false,name:"takerAddress",type:"address"},{indexed:false,name:"takerAmount",type:"uint256"},{indexed:true,name:"takerToken",type:"address"},{indexed:false,name:"expiration",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"}],name:"Filled",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"makerAddress",type:"address"},{indexed:false,name:"makerAmount",type:"uint256"},{indexed:true,name:"makerToken",type:"address"},{indexed:false,name:"takerAddress",type:"address"},{indexed:false,name:"takerAmount",type:"uint256"},{indexed:true,name:"takerToken",type:"address"},{indexed:false,name:"expiration",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"}],name:"Canceled",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"code",type:"uint256"},{indexed:true,name:"makerAddress",type:"address"},{indexed:false,name:"makerAmount",type:"uint256"},{indexed:true,name:"makerToken",type:"address"},{indexed:false,name:"takerAddress",type:"address"},{indexed:false,name:"takerAmount",type:"uint256"},{indexed:true,name:"takerToken",type:"address"},{indexed:false,name:"expiration",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"}],name:"Failed",type:"event"}],
  Kyber: [{constant:false,inputs:[{name:"alerter",type:"address"}],name:"removeAlerter",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"reserve",type:"address"},{name:"src",type:"address"},{name:"dest",type:"address"},{name:"add",type:"bool"}],name:"listPairForReserve",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"},{name:"sendTo",type:"address"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newAlerter",type:"address"}],name:"addAlerter",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"field",type:"bytes32"},{name:"value",type:"uint256"}],name:"setInfo",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newAdmin",type:"address"}],name:"transferAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_enable",type:"bool"}],name:"setEnable",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"claimAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newAdmin",type:"address"}],name:"transferAdminQuickly",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOperator",type:"address"}],name:"addOperator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"reserve",type:"address"},{name:"add",type:"bool"}],name:"addReserve",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"operator",type:"address"}],name:"removeOperator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_whiteList",type:"address"},{name:"_expectedRate",type:"address"},{name:"_feeBurner",type:"address"},{name:"_maxGasPrice",type:"uint256"},{name:"_negligibleRateDiff",type:"uint256"}],name:"setParams",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"src",type:"address"},{name:"srcAmount",type:"uint256"},{name:"dest",type:"address"},{name:"destAddress",type:"address"},{name:"maxDestAmount",type:"uint256"},{name:"minConversionRate",type:"uint256"},{name:"walletId",type:"address"}],name:"trade",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"amount",type:"uint256"},{name:"sendTo",type:"address"}],name:"withdrawEther",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"sender",type:"address"},{indexed:false,name:"amount",type:"uint256"}],name:"EtherReceival",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"sender",type:"address"},{indexed:false,name:"src",type:"address"},{indexed:false,name:"dest",type:"address"},{indexed:false,name:"actualSrcAmount",type:"uint256"},{indexed:false,name:"actualDestAmount",type:"uint256"}],name:"ExecuteTrade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"reserve",type:"address"},{indexed:false,name:"add",type:"bool"}],name:"AddReserveToNetwork",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"reserve",type:"address"},{indexed:false,name:"src",type:"address"},{indexed:false,name:"dest",type:"address"},{indexed:false,name:"add",type:"bool"}],name:"ListReservePairs",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"sendTo",type:"address"}],name:"TokenWithdraw",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"sendTo",type:"address"}],name:"EtherWithdraw",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"pendingAdmin",type:"address"}],name:"TransferAdminPending",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newAdmin",type:"address"},{indexed:false,name:"previousAdmin",type:"address"}],name:"AdminClaimed",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newAlerter",type:"address"},{indexed:false,name:"isAdd",type:"bool"}],name:"AlerterAdded",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newOperator",type:"address"},{indexed:false,name:"isAdd",type:"bool"}],name:"OperatorAdded",type:"event"}],
  Kyber2: [{constant:false,inputs:[{name:"alerter",type:"address"}],name:"removeAlerter",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"src",type:"address"},{name:"srcAmount",type:"uint256"},{name:"dest",type:"address"},{name:"destAddress",type:"address"},{name:"maxDestAmount",type:"uint256"},{name:"minConversionRate",type:"uint256"},{name:"walletId",type:"address"},{name:"hint",type:"bytes"}],name:"tradeWithHint",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"srcAmount",type:"uint256"},{name:"minConversionRate",type:"uint256"}],name:"swapTokenToEther",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"},{name:"sendTo",type:"address"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newAlerter",type:"address"}],name:"addAlerter",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"src",type:"address"},{name:"srcAmount",type:"uint256"},{name:"dest",type:"address"},{name:"minConversionRate",type:"uint256"}],name:"swapTokenToToken",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newAdmin",type:"address"}],name:"transferAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"claimAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"minConversionRate",type:"uint256"}],name:"swapEtherToToken",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"newAdmin",type:"address"}],name:"transferAdminQuickly",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOperator",type:"address"}],name:"addOperator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_kyberNetworkContract",type:"address"}],name:"setKyberNetworkContract",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"operator",type:"address"}],name:"removeOperator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"src",type:"address"},{name:"srcAmount",type:"uint256"},{name:"dest",type:"address"},{name:"destAddress",type:"address"},{name:"maxDestAmount",type:"uint256"},{name:"minConversionRate",type:"uint256"},{name:"walletId",type:"address"}],name:"trade",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"amount",type:"uint256"},{name:"sendTo",type:"address"}],name:"withdrawEther",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"trader",type:"address"},{indexed:false,name:"src",type:"address"},{indexed:false,name:"dest",type:"address"},{indexed:false,name:"actualSrcAmount",type:"uint256"},{indexed:false,name:"actualDestAmount",type:"uint256"}],name:"ExecuteTrade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newNetworkContract",type:"address"},{indexed:false,name:"oldNetworkContract",type:"address"}],name:"KyberNetworkSet",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"sendTo",type:"address"}],name:"TokenWithdraw",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"sendTo",type:"address"}],name:"EtherWithdraw",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"pendingAdmin",type:"address"}],name:"TransferAdminPending",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newAdmin",type:"address"},{indexed:false,name:"previousAdmin",type:"address"}],name:"AdminClaimed",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newAlerter",type:"address"},{indexed:false,name:"isAdd",type:"bool"}],name:"AlerterAdded",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"newOperator",type:"address"},{indexed:false,name:"isAdd",type:"bool"}],name:"OperatorAdded",type:"event"}],
  BancorQuick: [{constant:false,inputs:[{name:"_token",type:"address"},{name:"_register",type:"bool"}],name:"registerEtherToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_signerAddress",type:"address"}],name:"setSignerAddress",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_block",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"claimAndConvertFor",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"claimAndConvert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"convertFor",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_gasPriceLimit",type:"address"}],name:"setGasPriceLimit",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_prevOwner",type:"address"},{indexed:true,name:"_newOwner",type:"address"}],name:"OwnerUpdate",type:"event"}],
  // bancor network is new generation bancor quick?
  BancorNetwork: [{constant:false,inputs:[{name:"_token",type:"address"},{name:"_register",type:"bool"}],name:"registerEtherToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_signerAddress",type:"address"}],name:"setSignerAddress",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_block",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_block",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized2",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"claimAndConvertFor",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_paths",type:"address[]"},{name:"_pathStartIndex",type:"uint256[]"},{name:"_amounts",type:"uint256[]"},{name:"_minReturns",type:"uint256[]"},{name:"_for",type:"address"}],name:"convertForMultiple",outputs:[{name:"",type:"uint256[]"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"claimAndConvert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"convertFor",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_gasPriceLimit",type:"address"}],name:"setGasPriceLimit",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_registry",type:"address"}],name:"setContractRegistry",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_prevOwner",type:"address"},{indexed:true,name:"_newOwner",type:"address"}],name:"OwnerUpdate",type:"event"}],
  //regular bancor covertors
  Bancor: [{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"},{name:"_virtualBalance",type:"uint256"}],name:"updateConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableConversions",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_extensions",type:"address"}],name:"setExtensions",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"}],name:"addConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawFromToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"clearQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_disable",type:"bool"}],name:"disableConnectorPurchases",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"change",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_sellAmount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"sell",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableTokenTransfers",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_depositAmount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"buy",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"}],name:"setQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newManager",type:"address"}],name:"transferManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_conversionFee",type:"uint32"}],name:"setConversionFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"quickConvert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_fromToken",type:"address"},{indexed:true,name:"_toToken",type:"address"},{indexed:true,name:"_trader",type:"address"},{indexed:false,name:"_amount",type:"uint256"},{indexed:false,name:"_return",type:"uint256"},{indexed:false,name:"_currentPriceN",type:"uint256"},{indexed:false,name:"_currentPriceD",type:"uint256"}],name:"Conversion",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_prevFee",type:"uint32"},{indexed:false,name:"_newFee",type:"uint32"}],name:"ConversionFeeUpdate",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_prevManager",type:"address"},{indexed:false,name:"_newManager",type:"address"}],name:"ManagerUpdate",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_prevOwner",type:"address"},{indexed:false,name:"_newOwner",type:"address"}],name:"OwnerUpdate",type:"event"}],
  // bancor version with different 'conversion' event including conversionFee
  Bancor2: [{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"},{name:"_virtualBalance",type:"uint256"}],name:"updateConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_block",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"quickConvertPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableConversions",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_extensions",type:"address"}],name:"setExtensions",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convertInternal",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"}],name:"addConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawFromToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"clearQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_disable",type:"bool"}],name:"disableConnectorPurchases",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"change",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableTokenTransfers",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"}],name:"setQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newManager",type:"address"}],name:"transferManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_conversionFee",type:"uint32"}],name:"setConversionFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"quickConvert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_fromToken",type:"address"},{indexed:true,name:"_toToken",type:"address"},{indexed:true,name:"_trader",type:"address"},{indexed:false,name:"_amount",type:"uint256"},{indexed:false,name:"_return",type:"uint256"},{indexed:false,name:"_conversionFee",type:"int256"},{indexed:false,name:"_currentPriceN",type:"uint256"},{indexed:false,name:"_currentPriceD",type:"uint256"}],name:"Conversion",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_prevFee",type:"uint32"},{indexed:false,name:"_newFee",type:"uint32"}],name:"ConversionFeeUpdate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_prevManager",type:"address"},{indexed:true,name:"_newManager",type:"address"}],name:"ManagerUpdate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_prevOwner",type:"address"},{indexed:true,name:"_newOwner",type:"address"}],name:"OwnerUpdate",type:"event"}],
  // bancor v3 changed event
  Bancor3: [{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"},{name:"_virtualBalance",type:"uint256"}],name:"updateConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_block",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"quickConvertPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableConversions",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convertInternal",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptTokenOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_weight",type:"uint32"},{name:"_enableVirtualBalance",type:"bool"}],name:"addConnector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawFromToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_whitelist",type:"address"}],name:"setConversionWhitelist",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"clearQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_connectorToken",type:"address"},{name:"_disable",type:"bool"}],name:"disableConnectorPurchases",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"change",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromToken",type:"address"},{name:"_toToken",type:"address"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_disable",type:"bool"}],name:"disableTokenTransfers",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_registry",type:"address"}],name:"setRegistry",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"acceptManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"}],name:"setQuickBuyPath",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newManager",type:"address"}],name:"transferManagement",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_conversionFee",type:"uint32"}],name:"setConversionFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"quickConvert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_fromToken",type:"address"},{indexed:true,name:"_toToken",type:"address"},{indexed:true,name:"_trader",type:"address"},{indexed:false,name:"_amount",type:"uint256"},{indexed:false,name:"_return",type:"uint256"},{indexed:false,name:"_conversionFee",type:"int256"}],name:"Conversion",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_connectorToken",type:"address"},{indexed:false,name:"_tokenSupply",type:"uint256"},{indexed:false,name:"_connectorBalance",type:"uint256"},{indexed:false,name:"_connectorWeight",type:"uint32"}],name:"PriceDataUpdate",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_prevFee",type:"uint32"},{indexed:false,name:"_newFee",type:"uint32"}],name:"ConversionFeeUpdate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_prevManager",type:"address"},{indexed:true,name:"_newManager",type:"address"}],name:"ManagerUpdate",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_prevOwner",type:"address"},{indexed:true,name:"_newOwner",type:"address"}],name:"OwnerUpdate",type:"event"}],
  // bancor with v3 functions & crosschain xConvert
  Bancor4: [{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_block",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_toBlockchain",type:"bytes32"},{name:"_to",type:"bytes32"},{name:"_conversionId",type:"uint256"},{name:"_block",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"xConvertPrioritized",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_block",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized2",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[],name:"acceptOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_registry",type:"address"}],name:"setRegistry",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"claimAndConvertFor",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"},{name:"_customVal",type:"uint256"},{name:"_block",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"convertForPrioritized3",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_toBlockchain",type:"bytes32"},{name:"_to",type:"bytes32"},{name:"_conversionId",type:"uint256"}],name:"xConvert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"claimAndConvert",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"},{name:"_for",type:"address"}],name:"convertFor",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_path",type:"address[]"},{name:"_amount",type:"uint256"},{name:"_minReturn",type:"uint256"}],name:"convert",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"}],
  BancorX: [{constant:false,inputs:[{name:"_toBlockchain",type:"bytes32"},{name:"_to",type:"bytes32"},{name:"_amount",type:"uint256"},{name:"_id",type:"uint256"}],name:"xTransfer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_toBlockchain",type:"bytes32"},{name:"_to",type:"bytes32"},{name:"_amount",type:"uint256"}],name:"xTransfer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawTokens",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_fromBlockchain",type:"bytes32"},{name:"_txId",type:"uint256"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"},{name:"_xTransferId",type:"uint256"}],name:"reportTx",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"_from",type:"address"},{indexed:false,name:"_amount",type:"uint256"}],name:"TokensLock",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_to",type:"address"},{indexed:false,name:"_amount",type:"uint256"}],name:"TokensRelease",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_from",type:"address"},{indexed:false,name:"_toBlockchain",type:"bytes32"},{indexed:true,name:"_to",type:"bytes32"},{indexed:false,name:"_amount",type:"uint256"},{indexed:false,name:"_id",type:"uint256"}],name:"XTransfer",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"_reporter",type:"address"},{indexed:false,name:"_fromBlockchain",type:"bytes32"},{indexed:false,name:"_txId",type:"uint256"},{indexed:false,name:"_to",type:"address"},{indexed:false,name:"_amount",type:"uint256"},{indexed:false,name:"_xTransferId",type:"uint256"}],name:"TxReport",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_to",type:"address"},{indexed:false,name:"_id",type:"uint256"}],name:"XTransferComplete",type:"event"}],

  Enclaves: [{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_user",type:"address"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"},{name:"_amount",type:"uint256"},{name:"_withdraw",type:"bool"}],name:"tradeEtherDelta",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"}],name:"order",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_useEIP712",type:"bool"}],name:"setUseEIP712",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"cancelOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_tradeABIHash",type:"bytes32"}],name:"setTradeABIHash",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"depositToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_value",type:"uint256"},{name:"_feeToken",type:"address"},{name:"_feeValue",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_user",type:"address"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"withdrawPreSigned",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"depositBoth",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_freezeTrading",type:"bool"}],name:"changeFreezeTrading",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeAccount",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeTake",type:"uint256"}],name:"changeFeeTake",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_admin",type:"address"}],name:"changeAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_tokenAmount",type:"uint256"},{name:"_ethAmount",type:"uint256"}],name:"withdrawBoth",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_user",type:"address"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"},{name:"_amount",type:"uint256"},{name:"_withdraw",type:"bool"}],name:"trade",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeAmountThreshold",type:"uint256"}],name:"changeFeeAmountThreshold",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"deposit",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[],name:"setEtherDeltaFees",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_withdrawABIHash",type:"bytes32"}],name:"setWithdrawABIHash",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_tokens",type:"address[]"},{name:"_amounts",type:"uint256[]"}],name:"withdrawTokenMulti",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:true,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:true,name:"user",type:"address"}],name:"Order",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:true,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:true,name:"user",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:true,name:"get",type:"address"},{indexed:true,name:"give",type:"address"},{indexed:false,name:"exchange",type:"uint8"}],name:"Trade",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"token",type:"address"},{indexed:true,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Deposit",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"token",type:"address"},{indexed:true,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"balance",type:"uint256"}],name:"Withdraw",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"feeToken",type:"address"},{indexed:false,name:"feeValue",type:"uint256"},{indexed:true,name:"feeReceiver",type:"address"}],name:"WithdrawPreSigned",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"dex",type:"address"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"}],name:"Rebalance",type:"event"}],
  Enclaves2: [{constant:false,inputs:[{name:"_proposedImplementation",type:"address"}],name:"proposeUpgrade",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"upgrade",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"_implementation",type:"address"}],name:"Upgraded",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"_proposedImplementation",type:"address"},{indexed:false,name:"_proposedTimestamp",type:"uint256"}],name:"UpgradedProposed",type:"event"}],
  Ethen: [{constant:false,inputs:[{name:"_makeFee",type:"uint256"}],name:"setMakeFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_coeff",type:"uint8"},{name:"_duration",type:"uint128"}],name:"buyPack",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_takeFee",type:"uint256"}],name:"setTakeFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_coeff",type:"uint8"},{name:"_duration",type:"uint128"}],name:"delPack",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_nums",type:"uint256[]"},{name:"_addrs",type:"address[]"},{name:"_rss",type:"bytes32[]"}],name:"trade",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"depositToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_amount",type:"uint256"}],name:"withdrawEther",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"unpause",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_order",type:"uint8"},{name:"_token",type:"address"},{name:"_nonce",type:"uint256"},{name:"_price",type:"uint256"},{name:"_amount",type:"uint256"},{name:"_expire",type:"uint256"},{name:"_v",type:"uint256"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"cancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_expireDelay",type:"uint256"}],name:"setExpireDelay",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_addr",type:"address"}],name:"setSigner",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"pause",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"depositEther",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_addr",type:"address"}],name:"setFeeCollector",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_coeff",type:"uint8"},{name:"_expire",type:"uint128"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"setCoeff",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_coeff",type:"uint8"},{name:"_duration",type:"uint128"},{name:"_price",type:"uint256"}],name:"addPack",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"makeFee",type:"uint256"}],name:"NewMakeFee",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"takeFee",type:"uint256"}],name:"NewTakeFee",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"},{indexed:false,name:"coeff",type:"uint8"},{indexed:false,name:"expire",type:"uint128"},{indexed:false,name:"price",type:"uint256"}],name:"NewFeeCoeff",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"total",type:"uint256"}],name:"DepositEther",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"total",type:"uint256"}],name:"WithdrawEther",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"total",type:"uint256"}],name:"DepositToken",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"user",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"total",type:"uint256"}],name:"WithdrawToken",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"order",type:"uint8"},{indexed:false,name:"owner",type:"address"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"price",type:"uint256"},{indexed:false,name:"amount",type:"uint256"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderOwner",type:"address"},{indexed:false,name:"orderNonce",type:"uint256"},{indexed:false,name:"orderPrice",type:"uint256"},{indexed:false,name:"tradeTokens",type:"uint256"},{indexed:false,name:"orderFilled",type:"uint256"},{indexed:false,name:"orderOwnerFinalTokens",type:"uint256"},{indexed:false,name:"orderOwnerFinalEther",type:"uint256"},{indexed:false,name:"fees",type:"uint256"}],name:"Order",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"trader",type:"address"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"trade",type:"uint256"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"traderFinalTokens",type:"uint256"},{indexed:false,name:"traderFinalEther",type:"uint256"}],name:"Trade",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"owner",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"shouldHaveAmount",type:"uint256"},{indexed:false,name:"actualAmount",type:"uint256"}],name:"NotEnoughTokens",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"owner",type:"address"},{indexed:false,name:"shouldHaveAmount",type:"uint256"},{indexed:false,name:"actualAmount",type:"uint256"}],name:"NotEnoughEther",type:"event"},{anonymous:false,inputs:[],name:"Pause",type:"event"},{anonymous:false,inputs:[],name:"Unpause",type:"event"}],
  //  Dexy:[{constant:false,inputs:[{name:"",type:"address"},{name:"from",type:"address"},{name:"",type:"address"},{name:"amount",type:"uint256"},{name:"",type:"bytes"},{name:"",type:"bytes"}],name:"tokensReceived",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"}],name:"setERC777",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"}],name:"withdrawOverflow",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"deposit",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"spender",type:"address"}],name:"removeSpender",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"}],name:"unsetERC777",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"from",type:"address"},{name:"value",type:"uint256"},{name:"",type:"bytes"}],name:"tokenFallback",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"spender",type:"address"}],name:"approve",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"spender",type:"address"}],name:"addSpender",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"from",type:"address"},{name:"to",type:"address"},{name:"amount",type:"uint256"}],name:"transfer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"spender",type:"address"}],name:"unapprove",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"}],name:"Deposited",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"}],name:"Withdrawn",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"spender",type:"address"}],name:"Approved",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"spender",type:"address"}],name:"Unapproved",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"spender",type:"address"}],name:"AddedSpender",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"spender",type:"address"}],name:"RemovedSpender",type:"event"}],
  //  Dexy2:[{constant:false,inputs:[{name:"addresses",type:"address[3]"},{name:"values",type:"uint256[4]"},{name:"signature",type:"bytes"},{name:"maxFillAmount",type:"uint256"}],name:"trade",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_takerFee",type:"uint256"}],name:"setFees",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeAccount",type:"address"}],name:"setFeeAccount",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"subscribe",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"addresses",type:"address[3]"},{name:"values",type:"uint256[4]"}],name:"cancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"addresses",type:"address[2]"},{name:"values",type:"uint256[4]"}],name:"order",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"amount",type:"uint256"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"unsubscribe",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"}],name:"Subscribed",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"}],name:"Unsubscribed",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"hash",type:"bytes32"}],name:"Cancelled",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"hash",type:"bytes32"},{indexed:false,name:"makerToken",type:"address"},{indexed:false,name:"makerTokenAmount",type:"uint256"},{indexed:false,name:"takerToken",type:"address"},{indexed:false,name:"takerTokenAmount",type:"uint256"},{indexed:false,name:"maker",type:"address"},{indexed:false,name:"taker",type:"address"}],name:"Traded",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"maker",type:"address"},{indexed:false,name:"makerToken",type:"address"},{indexed:false,name:"takerToken",type:"address"},{indexed:false,name:"makerTokenAmount",type:"uint256"},{indexed:false,name:"takerTokenAmount",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"}],name:"Ordered",type:"event"}],
  Ethex: [{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"},{name:"weiAmount",type:"uint256"},{name:"seller",type:"address"}],name:"takeSellOrder",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"makeFee_",type:"uint256"}],name:"changeMakeFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"}],name:"makeBuyOrder",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"},{name:"weiAmount",type:"uint256"}],name:"cancelAllBuyOrders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"},{name:"weiAmount",type:"uint256"}],name:"makeSellOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"feeAccount_",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"},{name:"weiAmount",type:"uint256"},{name:"totalTokens",type:"uint256"},{name:"buyer",type:"address"}],name:"takeBuyOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"admin_",type:"address"}],name:"changeAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_lastFreeBlock",type:"uint256"}],name:"changeLastFreeBlock",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"etxAddress_",type:"address"}],name:"changeETXAddress",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokenAmount",type:"uint256"},{name:"weiAmount",type:"uint256"}],name:"cancelAllSellOrders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"takeFee_",type:"uint256"}],name:"changeTakeFee",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:true,name:"buyer",type:"address"}],name:"MakeBuyOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:true,name:"seller",type:"address"}],name:"MakeSellOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:true,name:"buyer",type:"address"}],name:"CancelBuyOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:true,name:"seller",type:"address"}],name:"CancelSellOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:false,name:"totalTransactionTokens",type:"uint256"},{indexed:true,name:"buyer",type:"address"},{indexed:true,name:"seller",type:"address"}],name:"TakeBuyOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"orderHash",type:"bytes32"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"tokenAmount",type:"uint256"},{indexed:false,name:"weiAmount",type:"uint256"},{indexed:false,name:"totalTransactionWei",type:"uint256"},{indexed:true,name:"buyer",type:"address"},{indexed:true,name:"seller",type:"address"}],name:"TakeSellOrder",type:"event"}],
  //EtherC only the functions different from ED/TokenStore
  Etherc: [{constant:false,inputs:[{name:"_tradeTracker",type:"address"}],name:"changeTradeTracker",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeModifiers",type:"address"}],name:"changeFeeModifiers",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeMake",type:"uint256"}],name:"changeFeeMake",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeAccount",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_feeTake",type:"uint256"}],name:"changeFeeTake",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"withdrawToken",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"expires",type:"uint256"},{indexed:false,name:"nonce",type:"uint256"},{indexed:false,name:"maker",type:"address"},{indexed:false,name:"v",type:"uint8"},{indexed:false,name:"r",type:"bytes32"},{indexed:false,name:"s",type:"bytes32"},{indexed:false,name:"orderHash",type:"bytes32"},{indexed:false,name:"amountFilled",type:"uint256"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"tokenGet",type:"address"},{indexed:false,name:"amountGet",type:"uint256"},{indexed:false,name:"tokenGive",type:"address"},{indexed:false,name:"amountGive",type:"uint256"},{indexed:false,name:"maker",type:"address"},{indexed:false,name:"taker",type:"address"},{indexed:false,name:"orderHash",type:"bytes32"}],name:"Trade",type:"event"}],
  EasyTrade: [{constant:false,inputs:[{name:"amount",type:"uint256"}],name:"withdrawFees",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"feeAccount_",type:"address"}],name:"changeFeeAccount",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"admin_",type:"address"}],name:"changeAdmin",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokensTotal",type:"uint256"},{name:"ethersTotal",type:"uint256"},{name:"exchanges",type:"uint8[]"},{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"exchangeFees",type:"uint256[]"},{name:"v",type:"uint8[]"},{name:"r",type:"bytes32[]"},{name:"s",type:"bytes32[]"}],name:"createSellOrder",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"amount",type:"uint256"}],name:"withdrawZRX",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"token",type:"address"},{name:"tokensTotal",type:"uint256"},{name:"exchanges",type:"uint8[]"},{name:"orderAddresses",type:"address[5][]"},{name:"orderValues",type:"uint256[6][]"},{name:"exchangeFees",type:"uint256[]"},{name:"v",type:"uint8[]"},{name:"r",type:"bytes32[]"},{name:"s",type:"bytes32[]"}],name:"createBuyOrder",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"serviceFee_",type:"uint256"}],name:"changeFeePercentage",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"account",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"tokens",type:"uint256"},{indexed:false,name:"ethers",type:"uint256"},{indexed:false,name:"tokensSold",type:"uint256"},{indexed:false,name:"ethersObtained",type:"uint256"},{indexed:false,name:"tokensRefunded",type:"uint256"}],name:"FillSellOrder",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"account",type:"address"},{indexed:false,name:"token",type:"address"},{indexed:false,name:"tokens",type:"uint256"},{indexed:false,name:"ethers",type:"uint256"},{indexed:false,name:"tokensObtained",type:"uint256"},{indexed:false,name:"ethersSpent",type:"uint256"},{indexed:false,name:"ethersRefunded",type:"uint256"}],name:"FillBuyOrder",type:"event"}],
  EasyTrade2: [{constant:false,inputs:[{name:"enabled",type:"bool"}],name:"changeTradingEnabled",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tradeable",type:"address"},{name:"volume",type:"uint256"},{name:"ordersData",type:"bytes"},{name:"destinationAddr",type:"address"},{name:"affiliate",type:"address"}],name:"buy",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_feeWallet",type:"address"}],name:"changeFeeWallet",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tradeable",type:"address"},{name:"volume",type:"uint256"},{name:"volumeEth",type:"uint256"},{name:"ordersData",type:"bytes"},{name:"destinationAddr",type:"address"},{name:"affiliate",type:"address"}],name:"sell",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_traders",type:"address"}],name:"changeTraders",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:false,name:"account",type:"address"},{indexed:false,name:"destinationAddr",type:"address"},{indexed:false,name:"traedeable",type:"address"},{indexed:false,name:"volume",type:"uint256"},{indexed:false,name:"volumeEth",type:"uint256"},{indexed:false,name:"volumeEffective",type:"uint256"},{indexed:false,name:"volumeEthEffective",type:"uint256"}],name:"Sell",type:"event"},{anonymous:false,inputs:[{indexed:false,name:"account",type:"address"},{indexed:false,name:"destinationAddr",type:"address"},{indexed:false,name:"traedeable",type:"address"},{indexed:false,name:"volume",type:"uint256"},{indexed:false,name:"volumeEth",type:"uint256"},{indexed:false,name:"volumeEffective",type:"uint256"},{indexed:false,name:"volumeEthEffective",type:"uint256"}],name:"Buy",type:"event"}],
  InstantTrade: [{constant:false,inputs:[{name:"_tokenGet",type:"address"},{name:"_amountGet",type:"uint256"},{name:"_tokenGive",type:"address"},{name:"_amountGive",type:"uint256"},{name:"_expires",type:"uint256"},{name:"_nonce",type:"uint256"},{name:"_user",type:"address"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"},{name:"_amount",type:"uint256"},{name:"_store",type:"address"}],name:"instantTrade",outputs:[],payable:true,stateMutability:"payable",type:"function"}],
  Switcheo: [{constant:false,inputs:[{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"announceWithdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_spender",type:"address"}],name:"approveSpender",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_delay",type:"uint32"}],name:"setCancelAnnounceDelay",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_user",type:"address"},{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"depositERC20",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_withdrawer",type:"address"},{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"slowWithdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_spender",type:"address"}],name:"rescindApproval",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_offerHash",type:"bytes32"}],name:"announceCancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"claimOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_state",type:"uint8"}],name:"setState",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_withdrawer",type:"address"},{name:"_token",type:"address"},{name:"_amount",type:"uint256"},{name:"_feeAsset",type:"address"},{name:"_feeAmount",type:"uint256"},{name:"_nonce",type:"uint64"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"withdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_delay",type:"uint32"}],name:"setWithdrawAnnounceDelay",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_from",type:"address"},{name:"_to",type:"address"},{name:"_amount",type:"uint256"},{name:"_token",type:"address"},{name:"_decreaseReason",type:"uint8"},{name:"_increaseReason",type:"uint8"}],name:"spendFrom",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"renounceOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_offerHash",type:"bytes32"},{name:"_expectedAvailableAmount",type:"uint256"},{name:"_feeAsset",type:"address"},{name:"_feeAmount",type:"uint256"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"cancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_filler",type:"address"},{name:"_offerHash",type:"bytes32"},{name:"_amountToTake",type:"uint256"},{name:"_feeAsset",type:"address"},{name:"_feeAmount",type:"uint256"},{name:"_nonce",type:"uint64"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"fillOffer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_maker",type:"address"},{name:"_offerAsset",type:"address"},{name:"_wantAsset",type:"address"},{name:"_offerAmount",type:"uint256"},{name:"_wantAmount",type:"uint256"},{name:"_feeAsset",type:"address"},{name:"_feeAmount",type:"uint256"},{name:"_nonce",type:"uint64"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"makeOffer",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_spender",type:"address"}],name:"removeSpender",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_coordinator",type:"address"}],name:"setCoordinator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_offerHash",type:"bytes32"}],name:"slowCancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_offerHash",type:"bytes32"},{name:"_expectedAvailableAmount",type:"uint256"}],name:"fastCancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_offerHash",type:"bytes32"},{name:"_expectedAvailableAmount",type:"uint256"}],name:"emergencyCancel",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[],name:"depositEther",outputs:[],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"_operator",type:"address"}],name:"setOperator",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_filler",type:"address"},{name:"_offerHashes",type:"bytes32[]"},{name:"_amountsToTake",type:"uint256[]"},{name:"_feeAsset",type:"address"},{name:"_feeAmount",type:"uint256"},{name:"_nonce",type:"uint64"},{name:"_v",type:"uint8"},{name:"_r",type:"bytes32"},{name:"_s",type:"bytes32"}],name:"fillOffers",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_withdrawer",type:"address"},{name:"_token",type:"address"},{name:"_amount",type:"uint256"}],name:"emergencyWithdraw",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"_spender",type:"address"}],name:"addSpender",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"newOwner",type:"address"}],name:"transferOwnership",outputs:[],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"maker",type:"address"},{indexed:true,name:"offerHash",type:"bytes32"}],name:"Make",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"filler",type:"address"},{indexed:true,name:"offerHash",type:"bytes32"},{indexed:false,name:"amountFilled",type:"uint256"},{indexed:false,name:"amountTaken",type:"uint256"},{indexed:true,name:"maker",type:"address"}],name:"Fill",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"maker",type:"address"},{indexed:true,name:"offerHash",type:"bytes32"}],name:"Cancel",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:true,name:"reason",type:"uint8"}],name:"BalanceIncrease",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:true,name:"reason",type:"uint8"}],name:"BalanceDecrease",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"token",type:"address"},{indexed:false,name:"amount",type:"uint256"},{indexed:false,name:"canWithdrawAt",type:"uint256"}],name:"WithdrawAnnounce",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"offerHash",type:"bytes32"},{indexed:false,name:"canCancelAt",type:"uint256"}],name:"CancelAnnounce",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"spender",type:"address"}],name:"SpenderApprove",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"user",type:"address"},{indexed:true,name:"spender",type:"address"}],name:"SpenderRescind",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"previousOwner",type:"address"}],name:"OwnershipRenounced",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"previousOwner",type:"address"},{indexed:true,name:"newOwner",type:"address"}],name:"OwnershipTransferred",type:"event"}],
  Uniswap: [{constant:false,inputs:[{name:"eth_bought",type:"uint256"},{name:"max_tokens",type:"uint256"},{name:"deadline",type:"uint256"}],name:"tokenToEthSwapOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"}],name:"ethToTokenTransferOutput",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"min_liquidity",type:"uint256"},{name:"max_tokens",type:"uint256"},{name:"deadline",type:"uint256"}],name:"addLiquidity",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"deadline",type:"uint256"}],name:"ethToTokenSwapOutput",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_eth",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"}],name:"tokenToEthTransferInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_eth",type:"uint256"},{name:"deadline",type:"uint256"}],name:"tokenToEthSwapInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"max_tokens_sold",type:"uint256"},{name:"max_eth_sold",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"},{name:"exchange_addr",type:"address"}],name:"tokenToExchangeTransferOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"max_tokens_sold",type:"uint256"},{name:"max_eth_sold",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"},{name:"token_addr",type:"address"}],name:"tokenToTokenTransferOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"min_tokens",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"}],name:"ethToTokenTransferInput",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"max_tokens_sold",type:"uint256"},{name:"max_eth_sold",type:"uint256"},{name:"deadline",type:"uint256"},{name:"token_addr",type:"address"}],name:"tokenToTokenSwapOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_tokens_bought",type:"uint256"},{name:"min_eth_bought",type:"uint256"},{name:"deadline",type:"uint256"},{name:"exchange_addr",type:"address"}],name:"tokenToExchangeSwapInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"eth_bought",type:"uint256"},{name:"max_tokens",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"}],name:"tokenToEthTransferOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_tokens_bought",type:"uint256"},{name:"min_eth_bought",type:"uint256"},{name:"deadline",type:"uint256"},{name:"token_addr",type:"address"}],name:"tokenToTokenSwapInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_bought",type:"uint256"},{name:"max_tokens_sold",type:"uint256"},{name:"max_eth_sold",type:"uint256"},{name:"deadline",type:"uint256"},{name:"exchange_addr",type:"address"}],name:"tokenToExchangeSwapOutput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_tokens_bought",type:"uint256"},{name:"min_eth_bought",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"},{name:"exchange_addr",type:"address"}],name:"tokenToExchangeTransferInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"min_tokens",type:"uint256"},{name:"deadline",type:"uint256"}],name:"ethToTokenSwapInput",outputs:[{name:"",type:"uint256"}],payable:true,stateMutability:"payable",type:"function"},{constant:false,inputs:[{name:"tokens_sold",type:"uint256"},{name:"min_tokens_bought",type:"uint256"},{name:"min_eth_bought",type:"uint256"},{name:"deadline",type:"uint256"},{name:"recipient",type:"address"},{name:"token_addr",type:"address"}],name:"tokenToTokenTransferInput",outputs:[{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{constant:false,inputs:[{name:"amount",type:"uint256"},{name:"min_eth",type:"uint256"},{name:"min_tokens",type:"uint256"},{name:"deadline",type:"uint256"}],name:"removeLiquidity",outputs:[{name:"",type:"uint256"},{name:"",type:"uint256"}],payable:false,stateMutability:"nonpayable",type:"function"},{anonymous:false,inputs:[{indexed:true,name:"buyer",type:"address"},{indexed:true,name:"eth_sold",type:"uint256"},{indexed:true,name:"tokens_bought",type:"uint256"}],name:"TokenPurchase",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"buyer",type:"address"},{indexed:true,name:"tokens_sold",type:"uint256"},{indexed:true,name:"eth_bought",type:"uint256"}],name:"EthPurchase",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"provider",type:"address"},{indexed:true,name:"eth_amount",type:"uint256"},{indexed:true,name:"token_amount",type:"uint256"}],name:"AddLiquidity",type:"event"},{anonymous:false,inputs:[{indexed:true,name:"provider",type:"address"},{indexed:true,name:"eth_amount",type:"uint256"},{indexed:true,name:"token_amount",type:"uint256"}],name:"RemoveLiquidity",type:"event"}],
};
},{}],2:[function(require,module,exports){
module.exports = {
  // List of addresses with a name or label attached

  // feeRecipients for 0x relayers,  https://github.com/0xProject/0x-relayer-registry/blob/master/relayers.json
  zrxRelayers: {
    '0xa258b39954cef5cb142fd567a46cddb31a670124': "RadarRelay",
    '0xeb71bad396acaa128aeadbc7dbd59ca32263de01': "IDT",
    '0xe269e891a2ec8585a378882ffa531141205e92e9': 'DDEX',
    '0x6f7ae872e995f98fcd2a7d3ba17b7ddfb884305f': 'Tokenlon',
    '0xb9e29984fe50602e7a619662ebed4f90d93824c7': 'Tokenlon',
    '0x55890b06f0877a01bb5349d93b202961f8e27a9b': 'Shark Relay',
    '0x5e150a33ffa97a8d22f59c77ae5487b089ef62e9': 'TokenJar',
    '0x5dd835a893734b8d556eccf87800b76dda5aedc5': 'BambooRelay',
    '0xc22d5b2951db72b44cfb8089bb8cd374a3c354ea': 'OpenRelay',
    '0x89db81c2dc4adaf10a93705b69289d479d576635': 'OpenRelay',
    '0x4524baa98f9a3b9dec57caae7633936ef96bd708': 'LedgerDex',
    '0x7219612be7036d1bfa933e16ca1246008f38c5fe': 'The Ocean',
    '0x0e8ba001a821f3ce0734763d008c9d7c957f5852': 'Amadeus',
    '0xab8199eba802e7e6634d4389bf23999b7ae6b253': '3xchange',
    '0x66a836664adc7c525c0cc4527dee8619d4faf669': 'BoxSwap',
    '0x013ec57d1237e7727f818b1a35e3506f754304e4': 'GUDecks',
    '0xd9c3ed92520a2f3076a9bd5ea9d4a2c2a0cf6457': 'GUDecks',
    '0xb0d7398d779ee9ffc727d2d5b045a5b441da8233': 'Emoon',
    '0x5620413261751d93978c6e752f6c351d10e75238': 'Lake Project',
    '0xa9274fda6d91a063f6aa0cfb172d6eb3b61ecf89': 'MetaMorph',
    '0x4a821aa1affbf7ee89a245bf750d1d7374e77409': 'Tokenmom',
    '0x853da5cecc1ea601ab978c2001565a0377a7dca6': 'Fordex',
    '0x2a5f5f36c20d7e56358db78bbfac0bace25c1198': 'EtherBlockchain',
    '0x8752d14a086cee9b8c108611ba9aefe04042c9f9': 'MARKET protocol',
    '0x0d056bb17ad4df5593b93a1efc29cb35ba4aa38d': 'TokenTrove',

    '0x8124071f810d533ff63de61d0c98db99eeb99d64': 'STAR BIT',
    '0x0681e844593a051e2882ec897ecd5444efe19ff2': 'STAR BIT',
    '0xc370d2a5920344aa6b7d8d11250e3e861434cbdd': 'STAR BIT',

    "0x58a5959a6c528c5d5e03f7b9e5102350e24005f1": 'Erc Dex',
    "0xa71deef328b2c40d0e6525cd248ae749e9208dbb": 'Erc Dex',
    "0x5bf2c11b0aa0c752c6de6fed48dd56fed2a4286d": 'Erc Dex',
    "0x1dd43bbe2264234bccfbb88aadbde331d87719ee": 'Erc Dex',
    "0x3b4ce2ea700ff327c3b4fe624f328c4106fd2885": 'Erc Dex',
    "0x3fa5f23d42847e49d242496ffe2a3c8fda66706c": 'Erc Dex',
    "0x173a2467cece1f752eb8416e337d0f0b58cad795": 'Erc Dex',
    "0x58a5959a6c528c5d5e03f7b9e5102350e24005f1": 'Erc Dex',
    "0x7df569a165bee41ca74374c76bd888ea02dcc4a8": 'Erc Dex',
    "0x3d974ce554fec1acd8d034f13b6640b300689a37": 'Erc Dex',
    "0xbd069e7ad0b7366ed1f0559dd8fe3e8efc0c4a72": 'Erc Dex',
    "0x4411c446756f8ed22343e8fbe8d24607027daffd": 'Erc Dex',
    "0xee2d43b8e4b57477acc2f4def265fe2887865ac0": 'Erc Dex',
    "0x8bf0785306eb675e38b742f59a7fcf05fccdf2b7": 'Erc Dex',
    "0x1956f5afa5d21000145e6cd2fa8ce3f52fa40875": 'Erc Dex',
    "0xa5b8d094f8364a9771c7a2287ee13efa08f847a4": 'Erc Dex',
    "0xc95bf3d3b4d6619119f3a8e29ec1d73ee801b9df": 'Erc Dex',
    "0x28f5cf7044f509af67f473c18b1f5f4f97fb4ce9": 'Erc Dex',
    "0xd592cfa56f4c443fb27008329d67ed7d4edb59c0": 'Erc Dex',

    // non zrx
    '0x61b9898c9b60a159fc91ae8026563cd226b7a0c1': 'Ethfinex', //0x clone contract
    '0x49497a4d914ae91d34ce80030fe620687bf333fd': 'DDEX', // DDEX hydro
  },
  // admin taker addresses for 0x relayers
  zrxTakers: {
    '0x6af9ec649821c2213dc488c36e3e3e999c3d7934': 'Tokenlon', 
    '0x4a821aa1affbf7ee89a245bf750d1d7374e77409': 'Tokenmom',
    '0xdf1bc6498338135de5ffdbcb98817d81e2665912': 'Veil',
    '0x4969358e80cdc3d74477d7447bffa3b2e2acbe92': 'Paradex',
    '0xd2045edc40199019e221d71c0913343f7908d0d5': 'Paradex',
    '0x853da5cecc1ea601ab978c2001565a0377a7dca6': 'ForDex',
    '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44': 'Erc Dex', //indirect execution
    '0xe269e891a2ec8585a378882ffa531141205e92e9': 'DDEX', //v1 
    '0xb04239b53806ab31141e6cd47c63fb3480cac908': 'Gods Unchained',
  },
  // other addresses associated with DEX admins
  admins: {
    '0xceceaa8edc0830c7cec497e33bb3a3c28dd55a32': 'IDEX Admin',
    '0xa7a7899d944fe658c4b0a1803bab2f490bd3849e': 'IDEX Admin',
    '0xe269e891a2ec8585a378882ffa531141205e92e9': 'DDEX Admin', //0x v1
    '0x49497a4d914ae91d34ce80030fe620687bf333fd': 'DDEX Admin', // Hydro ex
    '0x61b9898c9b60a159fc91ae8026563cd226b7a0c1': 'Ethfinex Admin',
    '0x1f8cdd31345faa00bbdf946fa257b7feb706b535': 'Switcheo Admin',
    '0x457804851eaf090dad4871f9609010c6868d99d4': 'BithumbDex Admin',
    '0xdb0a49ebed788cd412744a4f9f1ce8d16d019b2e': 'Totle Admin',
    '0x583d03451406d179182efc742a1d811a9e34c36b': 'Totle Admin',
    '0x571037cc2748c340e3c6d9c7af589c6d65806618': 'Switcheo Admin',
    '0x8ecf87fc9d7336cc0052d40abf806fb1af2ea81c': 'DINNGO Admin',
  },
  // known (centralized) exchange wallets, (personal experience + https://etherscan.io/accounts/1?&l=Exchange )
  exchangeWallets: {
    '0xf73c3c65bde10bf26c2e1763104e609a41702efe': 'Bibox',
    '0xd4dcd2459bb78d7a645aa7e196857d421b10d93f': 'BigOne',
    '0xa30d8157911ef23c46c0eb71889efe6a648a41f7': 'BigOne',
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
    '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance',
    '0x564286362092d8e7936f0549571a803b203aaced': 'Binance',
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': 'Binance',
    '0x00799bbc833d5b168f0410312d2a8fd9e0e3079c': 'Binance',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8': 'Binance',
    '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Binance',
    '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': 'Bitfinex',
    '0x7727e5113d1d161373623e5f49fd568b4f543a9e': 'Bitfinex',
    '0x4fdd5eb2fb260149a3903859043e962ab89d8ed4': 'Bitfinex',
    '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'Bitfinex',
    '0x7180eb39a6264938fdb3effd7341c4727c382153': 'Bitfinex',
    '0xcafb10ee663f465f9d10588ac44ed20ed608c11e': 'Bitfinex',
    '0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98': 'Bittrex',
    '0xe94b04a0fed112f3664e45adb2b8915693dd5ff3': 'Bittrex',
    '0x96fc4553a00c117c5b0bed950dd625d1c16dc894': 'Changelly',
    '0x9539e0b14021a43cde41d9d45dc34969be9c7cb0': 'CoinBene',
    '0x0d6b5a54f940bf3d52e438cab785981aaefdf40c':'COSS',
    '0xd1560b3984b7481cd9a8f40435a53c860187174d':'COSS',
    '0x5baeac0a0417a05733884852aa068b706967e790': 'Cryptopia',
    '0x0d0707963952f2fba59dd06f2b425ace40b492fe': 'Gate.io',
    '0x7793cd85c11a924478d358d49b05b37e91b5810f': 'Gate.io',
    '0x1c4b70a3968436b9a0a9cf5205c787eb81bb558c': 'Gate.io',
    '0xd24400ae8bfebb18ca49be86258a3c749cf46853': 'Gemini',
    '0x6fc82a5fe25a5cdb58bc74600a40a69c065263f8': 'Gemini',
    '0x59a5208b32e627891c389ebafc644145224006e8': 'HitBTC',
    '0x9c67e141c0472115aa1b98bd0088418be68fd249': 'HitBTC',
    '0xa12431d0b9db640034b0cdfceef9cce161e62be4': 'HitBTC',
    '0xab5c66752a9e8167967685f1450532fb96d5d24f': 'Huobi',
    '0xe93381fb4c4f14bda253907b18fad305d799241a': 'Huobi',
    '0xfa4b5be3f2f84f56703c42eb22142744e95a2c58': 'Huobi',
    '0x46705dfff24256421a05d056c29e81bdc09723b8': 'Huobi',
    '0x1b93129f05cc2e840135aab154223c75097b69bf': 'Huobi',
    '0xeb6d43fe241fb2320b5a3c9be9cdfd4dd8226451': 'Huobi',
    '0x956e0dbecc0e873d34a5e39b25f364b2ca036730': 'Huobi',
    '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': 'Huobi',
    '0xfdb16996831753d5331ff813c29a93c76834a0ad': 'Huobi',
    '0xeee28d484628d41a82d01e21d12e2e78d69920da': 'Huobi',
    '0x5c985e89dde482efe97ea9f1950ad149eb73829b': 'Huobi',
    '0xdc76cd25977e0a5ae17155770273ad58648900d3': 'Huobi',
    '0xadb2b42f6bd96f5c65920b9ac88619dce4166f94': 'Huobi',
    '0xa8660c8ffd6d578f657b72c0c811284aef0b735e': 'Huobi',
    '0x1062a747393198f70f71ec65a582423dba7e5ab3': 'Huobi',
    '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
    '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': 'Kraken',
    '0xe853c56864a2ebe4576a807d26fdc4a0ada51919': 'Kraken',
    '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': 'Kraken',
    '0xfa52274dd61e1643d2205169732f29114bc240b3': 'Kraken',
    '0x2b5634c42055806a59e9107ed44d43c426e58258': 'KuCoin',
    '0xe03c23519e18d64f144d2800e30e81b0065c48b5': 'Mercatox',
    '0x5e575279bf9f4acf0a130c186861454247394c06': 'Liqui',
    '0x8271b2e8cbe29396e9563229030c89679b9470db': 'Liqui',
    '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'Okex',
    '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': 'Okex',
    '0x32be343b94f860124dc4fee278fdcbd38c102d88': 'Poloniex',
    '0xb794f5ea0ba39494ce839613fffba74279579268': 'Poloniex',
    '0xab11204cfeaccffa63c2d23aef2ea9accdb0a0d5': 'Poloniex',
    '0x209c4784ab1e8183cf58ca33cb740efbf3fc18ef': 'Poloniex',
    '0xb794f5ea0ba39494ce839613fffba74279579268': 'Poloniex',
    '0x027beefcbad782faf69fad12dee97ed894c68549': 'QuadrigaCX',
    '0xb6aac3b56ff818496b747ea57fcbe42a9aae6218': 'QuadrigaCX',
    '0x70faa28a6b8d6829a4b1e649d26ec9a2a39ba413': 'ShapeShift',
    '0x120a270bbc009644e35f0bb6ab13f95b8199c4ad': 'ShapeShift',
    '0x9e6316f44baeeee5d41a1070516cc5fa47baf227': 'ShapeShift',
    '0xd3273eba07248020bf98a8b560ec1576a612102f': 'ShapeShift',
    '0x3b0bc51ab9de1e5b7b6e34e5b960285805c41736': 'ShapeShift',
    '0x563b377a956c80d77a7c613a9343699ad6123911': 'ShapeShift',
    '0xeed16856d551569d134530ee3967ec79995e2051': 'ShapeShift',
    '0x390de26d772d2e2005c6d1d24afc902bae37a4bb': 'Upbit',
    '0xf5bec430576ff1b82e44ddb5a1c93f6f9d0884f3': 'Yobit',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'Centre USDC',


    // other service addresses that can be useful to be named.
    '0x13032deb2d37556cf49301f713e9d7e1d1a8b169': 'Kyber-Uniswap', //kyber uniswap reserve

    //'0x0286f920f893513c7ec9fe35ba0a4760229a243e': 'SingularFund',
    '0x09678741bd50c3e74301f38fbd0136307099ae5d': 'Local Ethereum',
    '0x867ffb5a3871b500f65bdfafe0136f9667deae06': 'Local Ethereum',

    // Maker DAI cdp system, mark as exchange for now
    '0x448a5065aebb8e423f0896e6c5d525c040f59af3': 'Maker CDP',
    '0xbda109309f9fafa6dd6a9cb9f1df4085b27ee8ef': 'Maker CDP',
    '0x9b0f70df76165442ca6092939132bbaea77f2d7a': 'Maker CDP',
    '0x9b0ccf7c8994e19f39b2b4cf708e0a7df65fa8a3': 'Maker CDP',
    '0x059550a1ca3c46a2adb803e9e3ea4585a34f004a': 'dYdX',
    '0x36bf21c8e661b21e6166e4385f574941fdc6caff': 'dYdX',
    '0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e': 'dYdX',
    '0xa8b39829ce2246f89b31c013b8cde15506fb9a76': 'dYdX',

    '0x3a306a399085f3460bbcb5b77015ab33806a10d5': 'InstaDapp',

    '0x5a4ade4f3e934a0885f42884f7077261c3f4f66f': 'Synthetix',

    '0x3baa64a4401bbe18865547e916a9be8e6dd89a5a': 'Request',

    '0xc692453625023c6e03fec04158ea31ab4de2650a': 'LocalCoin Dex 1',
    '0x37c4bcaba4bcf3a605414236b8b108f160eb45a6': 'LocalCoin Dex 2',
    '0x8d1c1571367a148e92d6ac83494b1bdf3b497d07': 'LocalCoin Dex 3',

    // saturn network aidrop
    '0x25f17d6cb23cc85bfa6c5e9b8f1d5226f5927cbc': 'Airdrop',
  },
};
},{}],3:[function(require,module,exports){

// instances of exchange contracts that use many instances instead of 1 main contract
module.exports = {
    uniswapContracts:{
        /* work in progress
        uniswap exchange contracts  exchange_addr :token_addr
        Official token list:
          https://github.com/Uniswap/uniswap-frontend/blob/production/src/contexts/Tokens.js
       */
        "0x0045d5d2cac7688f7fc36313e69fb5350958936c":"0xa0872ee815b8dd0f6937386fd77134720d953581",
        "0x006b6e89ee1531cfe5b6d32da0d80cc30506a339":"0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e",
        "0x017d2735eb562d0ad9abc2a91801f4ca96f6bfa9":"0x3db6ba6ab6f95efed1a6e794cad492faaabf294d",
        "0x0182865fa09594e4b27496889cbf0bbc818813c6":"0x30765406d51091ed78ff13c107731daf3be5ef16",
        "0x041692af7f62906cee089b77fa0e59adb63f750c":"0x9138e38a0316e25459b376e987dd270b626709b8",
        "0x042dbbdc27f75d277c3d99efe327db21bc4fde75":"0xd46ba6d942050d489dbd938a2c909a5d5039a161",
        "0x059ad96e38f027ccd127567dc09b164762bcd695":"0x6251583e7d997df3604bc73b9779196e94a090ce",
        "0x060a0d4539623b6aa28d9fc39b9d6622ad495f41":"0x4e15361fd6b4bb609fa63c81a2be19d873717870",
        "0x066198694b1db74d67007d19a7c4f2fc3a061075":"0x1d462414fe14cf489c7a21cac78509f4bf8cd7c0",
        "0x069c97dba948175d10af4b2414969e0b88d44669":"0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206",
        "0x071002d8f0e5e210e510c68504e435c4a425df8b":"0xf5ed2dc77f0d1ea7f106ecbd1850e406adc41b51",
        "0x077d52b047735976dfda76fef74d4d988ac25196":"0x960b236a07cf122663c4303350609a66a7b288c0",
        "0x084f002671a5f03d5498b1e5fb15fc0cfee9a470":"0x6fb3e0a217407efff7ca062d46c26e5d60a14d69",
        "0x08850bd3ce3a8f6b64d724c3dabdbf6f4f8561fc":"0x4dadf81edf74e9b1a9ad1f364d51a176be48f0ac",
        "0x09cabec1ead1c0ba254b09efb3ee13841712be14":"0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
        "0x09f448c70c99124024cd9e8dcae6c2f51c0896db":"0xdf2c7238198ad8b389666574f2d8bc411a4b7428",
        "0x0b5ce6f7cbe0627aa8ad2e7e69ed554c0fe79162":"0xa44e5137293e855b1b7bc7e2c6f8cd796ffcb037",
        "0x0ce13e66bef17801c9f19fb763be2dd2f391d7c2":"0xb26631c6dda06ad89b93c71400d25692de89c068",
        "0x0d2e1a84638bd1b6c0c260c758c39451d4587be1":"0x45804880de22913dafe09f4980848ece6ecbaf78",
        "0x0e6a53b13688018a3df8c69f99afb19a3068d04f":"0x107c4504cd79c5d2696ea0030a8dd4e92601b82e",
        "0x104f5ac4fdf92fd4668a08ac2e305b5bcf3de215":"0x108c05cac356d93b351375434101cfd3e14f7e44",
        "0x112558c05b1e7f28daa98e48c8d7e0ced2f496c8":"0x189c05c3c191015c694032e1b09c190d5db3fb50",
        "0x122327fd43b2c66dd9e4b6c91c8f071e217558ef":"0x2c537e5624e4af88a7ae4060c022609376c8d0eb",
        "0x164c93580839f40609ce0250dd4c98a25da175de":"0x949bed886c739f1a3273629b3320db0c5024c719",
        "0x174dfb6e6e78c95678580b553eee7f282b28c795":"0x86c8bf8532aa2601151c9dbbf4e4c4804e042571",
        "0x17e5bf07d696eaf0d14caa4b44ff8a1e17b34de3":"0x8f3470a7388c05ee4e7af3d01d8c722b0ff52374",
        "0x17edf686c2449ae8dbb52ac3cef105ca50baee53":"0x26a6f4a6867a71be998b80eaabf67ff87d1e59d6",
        "0x17f11fca7a66e8049484ae0a74e0013c5719ec77":"0x2f141ce366a2462f02cea3d12cf93e4dca49e4fd",
        "0x198da2b510e297605641f38b64e668675d778c6f":"0xf09209cc5eae846ee2cc4a493e7b962ca7bcfbbb",
        "0x19cb61fe00ea29fc77d79eaeaebc94023bf7c67b":"0x64fab8aff039ed05259d1c2af729b70c8002c661",
        "0x1aec8f11a7e78dc22477e91ed924fab46e3a88fd":"0x744d70fdbe2ba4cf95131626614a1763df805b9e",
        "0x1c116d67e0bf0cf5cb0ad5a74a041d26e89271e7":"0xb9ef770b6a5e12e45983c5d80545258aa38f3b78",
        "0x1c6c712b1f4a7c263b1dbd8f97fb447c945d3b9a":"0x41e5560054824ea6b0732e656e3ad64e20e94e45",
        "0x1e0fbdaf60e1195a46e2af40a1c7b84460a13444":"0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc",
        "0x20149f1672175c7118bdbf966bfb6a02bf733810":"0x0aef06dcccc531e581f0440059e6ffcc206039ee",
        "0x2135d193bf81abbead93906166f2be32b2492c04":"0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
        "0x21b8a991a203a440c83450564fdefa3db10a5004":"0xd4c435f5b09f855c3317c8524cb1f586e42795fa",
        "0x225026d626e45fa662e6a71f679eff0cac3054f1":"0xa017ac5fac5941f95010b12570b812c974469c2c",
        "0x2263fd7c62914ab8ec2b5e7b00bc8371a6c0d221":"0xea097a2b1db00627b2fa17460ad260c016016977",
        "0x22d8432cc7aa4f8712a655fc4cdfb1baec29fca9":"0x23b608675a2b2fb1890d3abbd85c5775c51691d5",
        "0x23228ec35e810569495bd0aa4d56e9fad759bb29":"0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
        "0x238ff2e978a7fbb59ee2636caad269a440cbd43f":"0x8377ee6d3545bc6ff1425ee3015dc648b149c7b2",
        "0x23c3041a18a528a57e26623259e5caa9fb160665":"0xff4f56c14b8b59f7d766988a0e0c582e46b7f8ab",
        "0x24fbcbc276854bd14f0e6e02fb7b740baa52ca26":"0x1c83501478f1320977047008496dacbd60bb15ef",
        "0x255e60c9d597dcaa66006a904ed36424f7b26286":"0xb8c77482e45f1f44de1745f52c74426c631bdd52",
        "0x262275a4989c96cc6ecde77eb2dda6e13d508c4e":"0x439ce375e3ee4dc203d71958beca3c0f417d65cb",
        "0x26cc0eab6cb650b0db4d0d0da8cb5bf69f4ad692":"0x543ff227f64aa17ea132bf9886cab5db55dcaddf",
        "0x27f99de8a71f09e9e567050192ce3005f0dcd0b3":"0xae31b85bfe62747d0836b82608b4830361a3d37a",
        "0x28991ac221054bee3a38ae9ad0fb3d0c3e45d0cf":"0xe50365f5d679cb98a1dd62d6f6e58e59321bcddf",
        "0x28d9353611c5a0d5a026a648c05e5d6523e41cbf":"0x09617f6fd6cf8a71278ec86e23bbab29c04353a7",
        "0x28fe20afbf3450f13b803a639e19a8b0c005a5f3":"0x081f67afa0ccf8c7b17540767bbe95df2ba8d97f",
        "0x2995b7f65cbc1b0ae8095eae314246508c49182a":"0x95daaab98046846bf4b2853e23cba236fa394a31",
        "0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667":"0x6b175474e89094c44da98b954eedeac495271d0f",
        "0x2a98460615481a456a1d763460167514dcd21f2c":"0x6671c24dd5b8e4ced34033991418e4bc0cca05af",
        "0x2afbcc0bb7a78bd4d9a63c24c13042212b37f665":"0xe7049114562c759d5e9d1d25783773ccd61c0a65",
        "0x2afc64cd5e64a32a363ea84b8cad1ce5239a1a3d":"0x006bea43baa3f7a6f765f14f10a1a1b08334ef45",
        "0x2bf5a5ba29e60682fc56b2fcf9ce07bef4f6196f":"0x1776e1f26f98b1a5df9cd347953a26dd3cb46671",
        "0x2c4bd064b998838076fa341a83d007fc2fa50957":"0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        "0x2e642b8d59b45a1d8c5aef716a84ff44ea665914":"0x0d8775f648430679a709e98d2b0cb6250d2887ef",
        "0x2f5b009d42917452f4f057b0998dfad4d84c7662":"0x4f7c5bd3f7d62a9c984e265d73a86f5515f3e92b",
        "0x30b16fc2b530dbf991e1b15ed953cc4585f0b27c":"0x722f2f3eac7e9597c73a593f7cf3de33fbfc3308",
        "0x329c9642efe33a62161dda6b4eb3821965191441":"0x87f56ee356b434187105b40f96b230f5283c0ab4",
        "0x32a29c4269dee1a9e87eb75d66da71591a7aee96":"0x4b4a70cae3f7c84e36ce9aa19abc98f85db7f058",
        "0x32ff139e48c05d636307f61e476bb395bd319b05":"0x89f10cead72d1ebf3e08a9378932c6f4f5a4c476",
        "0x34e89740adf97c3a9d3f63cc2ce4a914382c230b":"0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
        "0x37134075f5b5a0a94ac891c7b5ec5db5cfcf392c":"0xc12d099be31567add4e4e4d0d45691c3f58f5663",
        "0x380fdc8bb8722915076a09479d1bbc75e69c8be0":"0x2bf91c18cd4ae9c2f2858ef9fe518180f7b5096d",
        "0x38577ccec0ceffd178fd3be66e1c6f531bfa410e":"0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f",
        "0x394e524b47a3ab3d3327f7ff6629dc378c1494a3":"0x168296bb09e24a88805cb9c33356536b980d3fc5",
        "0x3958b4ec427f8fa24eb60f42821760e88d485f7f":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
        "0x3981932f5e17540d863868c5d7c4e617e1334acd":"0x23b75bc7aaf28e2d6628c3f424b3882f8f072a3c",
        "0x39b0f27c771ad4236422af5ddc600711eefd93a3":"0xd9e5a009ec07de76616d7361ed713ef434d71325",
        "0x39f70a026e6e2aac3453aeb8e563025afb542f9f":"0xc58c0fca06908e66540102356f2e91edcaeb8d81",
        "0x3c3351e44d32b36bf2af97de6f40b548b00cf654":"0x84f7c44b6fed1080f647e354d552595be2cc602f",
        "0x3f0c63da66457dedc2677bef6bbdd457ba7a3c0b":"0x3867ef780a3afcf1201ef4f2acc6a46e3bd1eb88",
        "0x3fb2f18065926ddb33e7571475c509541d15da0e":"0xb4efd85c19999d84251304bda99e90b92300bd93",
        "0x3fbc2275de71427aaebbe0e5e6bc13fe8f27fa9e":"0x02c4c78c462e32cca4a90bc499bf411fb7bc6afb",
        "0x417cb32bc991fbbdcae230c7c4771cc0d69daa6b":"0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0",
        "0x41e48af64f8ebf24194ce323b0760ee09bbb3ac4":"0xd89c37fd7c0fa3b107b7e4a8731dd3aaec488954",
        "0x4218710e520e01e3158d9bdb579002e983be176c":"0x9c3e7e016389661473ac64f4c37f5f7f2955e499",
        "0x43892992b0b102459e895b88601bb2c76736942c":"0x408e41876cccdc0f92210600ef50372656052a38",
        "0x4591482d0c9d0af061a42009ff1b3cd070396f87":"0x07d9e49ea402194bf48a8276dafb16e4ed633317",
        "0x45a2fdfed7f7a2c791fb1bdf6075b83fad821dde":"0xf5dce57282a584d2746faf1593d3121fcac444dc",
        "0x467fb51d54d7e51ee925f7f1a81ad5f2a0211169":"0x888666ca69e0f178ded6d75b5726cee99a87d698",
        "0x4740c758859d4651061cc9cdefdba92bdc3a845d":"0xacf5c0101cbbe8476e87c652e0bef33684cc94d6",
        "0x4785cedbd89c818d60988dc5979b029f3900b54b":"0x4805f9568bca23bef099c2a317346b42146384a1",
        "0x48b04d2a05b6b604d8d5223fd1984f191ded51af":"0x1985365e9f78359a9b6ad760e32412f4a445e862",
        "0x48b109a5981573d03e5becec76aa805b7640cd58":"0x98626e2c9231f03504273d55f397409defd4a093",
        "0x49c4f9bc14884f6210f28342ced592a633801a8b":"0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
        "0x4ac2ccebac7b96f1e66fbb7049c740a8ca8ef78d":"0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
        "0x4b17685b330307c751b47f33890c8398df4fe407":"0x12b19d3e2ccc14da04fae33e63652ce469b3f2fd",
        "0x4d2f5cfba55ae412221182d8475bc85799a5644b":"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "0x4da5c31ab38a496a2513843dab8721e9aeb876bf":"0xe7775a6e9bcf904eb39da2b68c5efb4f9360e08c",
        "0x4e0e28d426caf318747b8e05c8b0564a580e39a7":"0x919d0131fa5f77d99fbbbbace50bcb6e62332bf2",
        "0x4e395304655f0796bc3bc63709db72173b9ddf98":"0x42d6622dece394b54999fbd73d108123806f6a18",
        "0x4f0d6e2179938828cff93da40a8ba1df7519ca8c":"0x0cf0ee63788a0849fe5297f3407f701e122cc023",
        "0x4f30e682d0541eac91748bd38a648d759261b8f3":"0x8dd5fbce2f6a956c3022ba3663759011dd51e73e",
        "0x4ff7fa493559c40abd6d157a0bfc35df68d8d0ac":"0x09fe5f0236f0ea5d930197dce254d77b04128075",
        "0x5048b9d01097498fd72f3f14bc9bc74a5aac8fa7":"0x0000000000085d4780b73119b644ae5ecd22b376",
        "0x505c02b4aa1286375fbdf0c390ac0fe9209dcb05":"0x0000852600ceb001e08e00bc008be620d60031f2",
        "0x526353fbb4a37eddcebf63f96796a078d908f568":"0x8e3aeb75392ca824d55479cae07f7f0b765743dd",
        "0x52b9c94031dee81b2c36be736fa7f6b7ca7ad84e":"0x8a3cf860eca6d8e4579bfb052488e336e0fd9eae",
        "0x536956fab86774fb55cfaacf496bc25e4d2b435c":"0x3a9fff453d50d4ac52a6890647b823379ba36b9e",
        "0x5386c0e6b417138f09236f86aca243e6f5b05dd3":"0x7ca121b093e2fbd4bb9a894bd5ff487d16f1f83b",
        "0x53e31a941b76ef1b486e86aa39bcd5ae56829870":"0x47bc01597798dcd7506dcca36ac4302fc93a8cfb",
        "0x57c6e18ee62fc660575db273ffaab02436aad222":"0xf8e386eda857484f5a12e4b5daa9984e06e73705",
        "0x5982aa08c4d3103a3534055b5fb2aac88d61675c":"0xd26b63194f70e0939393d23d3a5b1ed6bde5f835",
        "0x5a67d8ea5c9bf381fe0da2862cec1ec90a5ca329":"0x824c0659f6940604506aa8fa829d13fde17fb900",
        "0x5d40522c20326f2ebcec2d371f250e352e3bed27":"0xd49ff13661451313ca1553fd6954bd1d9b6e02b9",
        "0x5d8888a212d033cff5f2e0ac24ad91a5495bad62":"0x3772f9716cf6d7a09ede3587738aa2af5577483a",
        "0x5e7907ac70b9a781365c72f2acee96710bda042e":"0x06f65b8cfcb13a9fe37d836fe9708da38ecb29b2",
        "0x601c32e0580d3aef9437db52d09f5a5d7e60ec22":"0x09cabec1ead1c0ba254b09efb3ee13841712be14",
        "0x60a87cc7fca7e53867facb79da73181b1bb4238b":"0x419d0d8bdd9af5e606ae2232ed285aff190e711b",
        "0x61792f290e5100fbbcbb2309f03a1bab869fb850":"0xc719d010b63e5bbf2c0551872cd5316ed26acd83",
        "0x62ccb0577aa63b8d72449b9fd13b3cdbcf3787d6":"0x74436ae1db59c62bbb3de88d268f7e058dce6d50",
        "0x6380ab7c66df788e30c5762f5884b9129d178b80":"0xa645264c5603e96c3b0b078cdab68733794b0a71",
        "0x63a91a8b6f6289aa93f18539d245ec49c6169cd7":"0xfec0cf7fe078a500abf15f1284958f22049c2c7e",
        "0x6469a4e75f37d9f8f4b1cee6bb3c1a1fe933e2a7":"0x3893b9422cd5d70a81edeffe3d5a1c6a978310bb",
        "0x657184e418d43a661a91d567182dc3d1a4179ec4":"0x0ed024d39d55e486573ee32e583bc37eb5a6271f",
        "0x68326300df49ec6387e75690857424c2ae111750":"0x737fa0372c8d001904ae6acaf0552d4015f9c947",
        "0x6886f9dcbdad3cb8c6684f2fe78de5318c177068":"0xfd107b473ab90e8fbd89872144a3dc92c40fa8c9",
        "0x69f276abd6456152d519d23086031da7c73f91b8":"0x57ab1e02fee23774580c119740129eac7081e9d3",
        "0x6b4540f5ee32ddd5616c792f713435e6ee4f24ab":"0x3883f5e181fccaf8410fa61e12b59bad963fb645",
        "0x6bfa119a191576ba26bc5e711432aca0cfda04de":"0x00000000441378008ea67f4284a57932b1c000a5",
        "0x6c3942b383bc3d0efd3f36efa1cbe7c8e12c8a2b":"0x06af07097c9eeb7fd685c692751d5c66db49c215",
        "0x6dd1d97e5817ca376e653a1e7326e0563d13ceeb":"0x910dfc18d6ea3d6a7124a6f8b5458f281060fa4c",
        "0x6f1c46e91ce29d430e31205ead148b0bee46b9fc":"0xb97048628db6b661d4c2aa833e95dbe1a905b280",
        "0x6fca96a679490ed8a80c7344799f1b090fd4c94d":"0x9709907cb2cf9e16df841f7b145b78c230d8205e",
        "0x700520b1e2ccc5bf5fa89a5f7b8fd9beba3f04b0":"0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca",
        "0x700e7869fa8ffd3117200e248979fef2b78f4a1c":"0x68aa3f232da9bdc2343465545794ef3eea5209bd",
        "0x701564aa6e26816147d4fa211a0779f1b774bb9b":"0xb6ed7644c69416d67b522e20bc294a9a9b405b31",
        "0x70876eadea28ac268564ad3a8b7313790b471436":"0x667088b212ce3d06a1b553a7221e1fd19000d9af",
        "0x70a97ec45d87a37cec6103658527ffb3df7802c7":"0x45ed02e374aef2e4b34c04e86ad9d45891d10751",
        "0x7174ef6b9cb528e954508264a9912da905977422":"0xb9bb08ab7e9fa0a1356bd4a39ec0ca267e03b0b3",
        "0x72208a7d8c11cb28c8e6d32e1a070015786c0823":"0x4cf488387f035ff08c371515562cba712f9015d4",
        "0x755160062e3e09d34af0a00ff8cab8500e81e0d7":"0xb9e7f8568e08d5659f5d29c4997173d84cdf2607",
        "0x755899f0540c3548b99e68c59adb0f15d2695188":"0x687bfc3e73f6af55f0ccca8450114d107e781a0e",
        "0x77e885fbc67b7c6ea2b889c96bbd78f9e647463b":"0x056017c55ae7ae32d12aef7c679df83a85ca75ff",
        "0x78bac62f2a4cd3a7cb7da2991affc7b11590f682":"0xfa3e941d1f6b7b10ed84a0c211bfa8aee907965e",
        "0x7a05354b796958e439b1780204a89f81094ea4b9":"0xb2af8d4d286e2087590f085ee7e8ccb05d3c7f29",
        "0x7b6e5278a14d5318571d65aced036d09c998c707":"0x0f7f961648ae6db43c75663ac7e5414eb79b5704",
        "0x7cdff5f7e1886767ae561ea0c2f926db3c25706d":"0x39550dc5919a990a5786fcdc1d5b7c392d362dde",
        "0x7d03cecb36820b4666f45e1b4ca2538724db271c":"0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6",
        "0x7d31fc38ddd7d6907f820f4268f1d8d5d5797826":"0xecf3958d0f82291ca1ff6c9bda8eb3c50ee41ce3",
        "0x7d839eb463b121790c99e0f017c21f0189dcc167":"0xa74476443119a942de498590fe1f2454d7d4ac0d",
        "0x7dc095a5cf7d6208cc680fa9866f80a53911041a":"0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27",
        "0x7ea7134ed6c41d9e35dae7e7e1ff0fcc406224ca":"0x01b3ec4aae1b8729529beb4965f27d008788b0eb",
        "0x7eb81c7a0b322d31c11064105e14dce6e852e8c1":"0x539efe69bcdd21a83efd9122571a64cc25e0282b",
        "0x7ef7191ab91ddb4d7cc347fbfa170355acbaf02d":"0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe",
        "0x80a393b2e1e4aa07862c24ad8ac14511c91bd562":"0xd2cc32cc34b0b975bf9b812061a1a040017972fc",
        "0x80f0f3e1482bab7fb6ed70185476f2fcdb596fa9":"0xd559f20296ff4895da39b5bd9add54b442596a61",
        "0x8138e39124c65d7fe6874b2f5c47d5fad2581060":"0x5c679a0a79d495affe049c02483519d51e37f32b",
        "0x817e391baf312dc5078cd7a98a7a0255ac63ca48":"0x7728dfef5abd468669eb7f9b48a7f70a501ed29d",
        "0x81eed7f1ecbd7fa9978fcc7584296fb0c215dc5c":"0x14094949152eddbfcd073717200da82fed8dc960",
        "0x82db9fc4956fa40efe1e35d881004612b5cb2cc2":"0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d",
        "0x85c1ef96960884f802789400160b21d9c7043520":"0xe5e7d48abbb999880ea0f6533068dfd3944f0e7e",
        "0x877104c369bb563f3a893fae861b4baf0cdd9d37":"0xc528c28fec0a90c083328bc45f587ee215760a0f",
        "0x87d80dbd37e551f58680b4217b23af6a752da83f":"0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
        "0x8809c63af18ec760547426a5c3e122e0a3efbf27":"0xb9625381f086e7b8512e4825f6af1117e9c84d43",
        "0x884715e2dce8757c9ee19739c366b2c7c65f05b1":"0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4",
        "0x88df13889e20efa93ff9a0c08f101f431bd9ddd7":"0x00006100f7090010005f1bd7ae6122c3c2cf0090",
        "0x8903842469f8790dad072b45bbce96cde9f3d7e6":"0xcdcfc0f66c522fd086a1b725ea3c0eeb9f9e8814",
        "0x8a8d7ad4b89d91983cd069c58c4aa9f2f4166298":"0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098",
        "0x8aa3cc2bf30cb47f290fd4e9b660bc3a685b9b3e":"0xad22f63404f7305e4713ccbd4f296f34770513f4",
        "0x8da198a049426bfcf1522b0dc52f84beda6e38ff":"0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
        "0x8de0d002dc83478f479dc31f76cb0a8aa7ccea17":"0xb4272071ecadd69d933adcd19ca99fe80664fc08",
        "0x917d8f35a10985add5d7d95770af8cabefb05eaa":"0x1ebda9b505ad2c6ccee86bfc18f58035dcfdc26a",
        "0x929507cd3d90ab11ec4822e9eb5a48eb3a178f19":"0x0000000000b3f879cb30fe243b4dfee438691c04",
        "0x93ff2c787c140c4ce21f01cc211fbdace274077f":"0xa15c7ebe1f07caf6bff097d8a589fb8ac49ae5b3",
        "0x95e4649f5209dd292caf1f087b8f1db3be24927f":"0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b",
        "0x95efaafe52e89992bfd4f33c96ad971fccdc31f6":"0x7b94a1281db0335c9efd68aca5c98b494d775c70",
        "0x9709ef0958b831865a97682d9ec08f897fe3b56f":"0x3597bfd533a99c9aa083587b074434e61eb0a258",
        "0x97dec872013f6b5fb443861090ad931542878126":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x9801d0e88222e9204025117bada94728885d1a28":"0x69c4bb240cf05d51eeab6985bab35527d04a8c64",
        "0x9881ad0c92d5a908d97df7f86626903ada1bfd29":"0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e",
        "0x99b849a022d60be539d2a130b89ff0bbae097d83":"0xc98449ef8a017cfd29aed8b21b9b26492978a898",
        "0x9a7a75e66b325a3bd46973b2b57c9b8d9d26a621":"0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
        "0x9ad2f1272e775ebec936fef4cfa44bd5b1c7c3a6":"0xb3ce281f0dee8c6f7af19b9664109c4030bec3fa",
        "0x9b7036f677a6e4832e9983efa0ce384130248398":"0x5e6364d4534f780ae053b93b45c8b8840e683eb7",
        "0x9c1a7862f08d19e86714750161f56e7c10a9503e":"0x6025fb154b7c30e13657d5304dafdb55b194e5dd",
        "0x9f8db6f625555230f549a9b1e2e314e0a3aaf68a":"0x4a42d2c580f83dce404acad18dab26db11a1750e",
        "0x9faa0cb10912de7ad1d86705c65de291a9088a61":"0x2dea20405c52fb477ecca8fe622661d316ac5400",
        "0xa0513d82f17c491dc6ab34efd89dc372bb180378":"0x3638c9e50437f00ae53a649697f288ba68888cc1",
        "0xa1c467dc897a36689dbbadcc212b212b4f526e49":"0x5bc7e5f0ab8b2e10d2d0a3f21739fce62459aef3",
        "0xa1ecdcca26150cf69090280ee2ee32347c238c7b":"0x0cbe2df57ca9191b64a7af3baa3f946fa7df2f25",
        "0xa248a46b97204b6f4d5b05ba824fbea46390d978":"0x2d184014b5658c453443aa87c8e9c4d57285620b",
        "0xa2881a90bf33f03e7a3f803765cd2ed5c8928dfb":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xa2e6b3ef205feaee475937c4883b24e6eb717eef":"0x6758b7d441a9739b98552b373703d8d3d14f9e62",
        "0xa539baaa3aca455c986bb1e25301cef936ce1b65":"0xbbbbca6a901c926f240b89eacb641d8aec7aeafd",
        "0xa55ba5d915a53e3c0514ff4e232eb50af12922ec":"0x5af2be193a6abca9c8817001f45744777db30756",
        "0xa59cc1618d144ccac2bfb46f61272cebf00d90d5":"0x985dd3d42de1e256d09e1c10f112bccb8015ad41",
        "0xa7298541e52f96d42382ecbe4f242cbcbc534d02":"0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac",
        "0xa809ef80c0abf701bd1b3b15749aa0a4179ec034":"0xf5b403abd806eff15b339909943e2c22ecbac54c",
        "0xa825cae02b310e9901b4776806ce25db520c8642":"0x607f4c5bb672230e8672085532f7e901544a7375",
        "0xa931f4eb165ac307fd7431b5ec6eadde53e14b0c":"0xec67005c4e498ec7f55e092bd1d35cbc47c91892",
        "0xaa3b3810c8aada6cbd2ce262699903ad7ae6a7ef":"0x0abdace70d3790235af448c88547603b945604ea",
        "0xaa9c9308bb6ef318bab918d1e4aebf284b02b680":"0x8d80de8a78198396329dfa769ad54d24bf90e7aa",
        "0xabe1e210f2c97ae4bc7b17f8daa2e8db993337f5":"0x595832f8fc6bf59c85c527fec3740a1b7a361269",
        "0xae76c84c9262cdb9abc0c2c8888e62db8e22a0bf":"0xe41d2489571d322189246dafa5ebde1f4699f498",
        "0xaec97872d14ac79e95fff18c169bfd183efc6962":"0xbeb9ef514a379b997e0798fdcc901ee474b6d9a1",
        "0xaf294be0577dc703bd7f5b96d34bc9cb110f1e2b":"0xe05d803fa0c5832fa2262465290abb25d6c2bfa3",
        "0xaf8937f0595c06e1e0cca741a8aedec088aafde0":"0xac4df2d98f14495263b9dfbc47451c46d8ab0a30",
        "0xb2744df7bfbb4802f44fd1b1fd9012502d4af704":"0x327682779bab2bf4d1337e8974ab9de8275a7ca8",
        "0xb580a2b495917b8577d9a612be068f591e8c20f9":"0x49aaa160506f7e07e6c3f6cd6316b6866025cdcb",
        "0xb5e96c3ad1ccc79e7ab13433471baf785bb4977e":"0x70861e862e1ac0c96f853c8231826e469ead37b1",
        "0xb684f9b231accdef385f06038395e27a4e3aa86b":"0xf3be20da25b31bd6ee4ce4496985b2064304c125",
        "0xb6cfbf322db47d39331e306005dc7e5e6549942b":"0xaaaf91d9b90df800df4f55c205fd6989c977e73a",
        "0xb7520a5f8c832c573d6bd0df955fc5c9b72400f7":"0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5",
        "0xb7836492f5850d9b61d6b71c73697c5b9676208d":"0x2e071d2966aa7d8decb1005885ba1977d6038a65",
        "0xb7cf1e1ea55572713feeec025d7cf56b3c6c6b6d":"0x24dcc881e7dd730546834452f21872d5cb4b5293",
        "0xb7f7269098f36b034c4e2118a40c53482872b87a":"0x00319f722bd546182cb2c701ca254146d3f084fc",
        "0xb800445dd982c1311523fd465ac44f55093b2b5b":"0x4470bb87d77b963a013db939be332f927f2b992e",
        "0xb878876e0627e362fd3d1afeebdf0bd69bba1911":"0x4a57e687b9126435a9b19e4a802113e266adebde",
        "0xb92de8b30584392af27726d5ce04ef3c4e5c9924":"0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf",
        "0xb944d13b2f4047fc7bd3f7013bcf01b115fb260d":"0x57ab1ec28d129707052df4df418d58a2d46d5f51",
        "0xb99a23b1a4585fc56d0ec3b76528c27cad427473":"0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
        "0xba2d17a783533f401d2b5efaac4a5675f46ee36d":"0x5e51f6841d2f188c42c7c33a6a5e77fb05cfbabe",
        "0xbaf5a8bdf81cfe2d34c0ced89236fe473183f2e8":"0xf16843c8ab59ae17f9481ec756a1ded049192af4",
        "0xbb7cf8a9d6b2aa7d98fb0bf3548a589a68ddb774":"0x94d6b4fb35fb08cb34aa716ab40049ec88002079",
        "0xbcdf538581f7167ec8228ec2c9b1cfc2f74788c7":"0x8f8221afbb33998d8584a2b05749ba73c37a938a",
        "0xbd04c3749506ce30eed93c06f93f18223c3ff5aa":"0x82f4ded9cec9b5750fbff5c2185aee35afc16587",
        "0xbd4479c98dc21563ba822c3c206d8339698e2dd4":"0x7b22938ca841aa392c93dbb7f4c42178e3d65e88",
        "0xbe26014bbdbdd3d35f93c80591ffaf08513621ed":"0x49ceb57714000f18f3749cf2d130e135f9c473a4",
        "0xbe33fdad6efd453594e8ece3c53fd0ae62b7cc74":"0xe9a95d175a5f4c9369f3b74222402eb1b837693b",
        "0xbe478403ac906d329fa8ebef1d3f9e0a48067d57":"0xa6a7fce4affe059548fc39ebbc74555952a6fb0d",
        "0xc040d51b07aea5d94a89bc21e8078b77366fc6c7":"0x8e870d67f660d95d5be530380d0ec0bd388289e1",
        "0xc0c59cde851bfcbdddd3377ec10ea54a18efb937":"0x4156d3342d5c385a87d264f90653733592000581",
        "0xc2a27366deb7530bd7f812c69d48b0215e397771":"0x7090a6e22c838469c9e67851d6489ba9c933a43f",
        "0xc3b03664126f2f192ec658e1c62798c9ebd0ff08":"0x7365877678c744b435ed03b1cac12ab407cba13a",
        "0xc3c028721f854bc75967cbe432fb0e221908baa1":"0x9e88613418cf03dca54d6a2cf6ad934a78c7a17a",
        "0xc462a2fd31c83f6ee220400d1506d9e9f1f4bb01":"0x27054b13b1b798b345b591a4d22e6562d47ea75a",
        "0xc4a1c45d5546029fd57128483ae65b56124bfa6a":"0x58b6a8a3302369daec383334672404ee733ab239",
        "0xc5d192f702cc7ce84355df9d41af14bde5024cc9":"0xf433089366899d83a9f26a773d59ec7ecf30355e",
        "0xc6581ce3a005e2801c1e0903281bbd318ec5b5c2":"0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
        "0xc7eb739e2651484daa1717433de1736a6529cfcc":"0x4a220e6096b25eadb88358cb44068a3248254675",
        "0xc8313c965c47d1e0b5cdcd757b210356ad0e400c":"0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0xc932eded711ceb421078bab6b44b558656bd7864":"0xeef338c585ee3cf674f717937f12e6f52accf5e1",
        "0xca5ce4f07e8591b497eb2e22d2b0c19b69173e61":"0x35352a97214942f5c6054923b8dbd5e4ff0434df",
        "0xcaa7e4656f6a2b59f5f99c745f91ab26d1210dce":"0x80fb784b7ed66730e8b1dbd9820afd29931aab03",
        "0xcbfda0aa2e471c02a39e6cec9b7f5cdfd91d83c6":"0x76a6baa20598b6d203d3eae6cc87e326bcb60e43",
        "0xcc36e05eeffac3eb61b696d0bb328f2b08389fb5":"0x846c66cf71c43f80403b51fe3906b3599d63336f",
        "0xccb98654cd486216fff273dd025246588e77cfc1":"0x957c30ab0426e0c93cd8241e2c60392d08c6ac8e",
        "0xccd5c9f160379510670f9acd73779dce7e6226b2":"0xd9a8cfe21c232d485065cb62a96866799d4645f7",
        "0xcdd6e09627d23368b770d9162807f181d061fb3e":"0x36774fbca6b17325947cb208f77b4871ac7b6217",
        "0xcfcc608f03c0cee86589e11224f24779212f0fe5":"0x236149288602c07b84387d0d75784d73f133142b",
        "0xd1a8c5ba35752e4b62c71c795a3f6481faa4d36e":"0xe34e1944e776f39b9252790a0527ebda647ae668",
        "0xd1f3e9b413f5c9fd56f044699c64ff710e7e5a9a":"0xd2d6158683aee4cc838067727209a0aaf4359de3",
        "0xd284aedc33522c85949576eca69414020d15ccb6":"0x0b1724cc9fda0186911ef6a75949e9c0d3f0f2f3",
        "0xd2bf46ac7cbf595879aaff5967a92ae7e999c308":"0x69657e421c993a65e31f571b4ce742fafb318bd4",
        "0xd4777e164c6c683e10593e08760b803d58529a8e":"0x6c6ee5e31d828de241282b9606c8e98ea48526e2",
        "0xd4a6ea5eabfd4048640724f62713ffb1e6292271":"0xc994a2deb02543db1f48688438b9903c4b305ce3",
        "0xd55c1ca9f5992a2e5e379dce49abf24294abe055":"0xe0b7927c4af23765cb51314a0e0521a9645f0e2a",
        "0xd62cc4154a8f865761c5b027ec33b4ab47cfa175":"0xf56fdae611b734005d71c03b7b8c966e45d1d768",
        "0xd7d070728c947645af47f8cd0731a4100695a503":"0x01fa555c97d7958fa6f771f3bbd5ccd508f81e22",
        "0xd883264737ed969d2696ee4b4caf529c2fc2a141":"0x056fd409e1d7a124bd7017459dfea2f387b6d5cd",
        "0xd91ff16ef92568fc27f466c3c5613e43313ab1dc":"0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
        "0xdd80ca8062c7ef90fca2547e6a2a126c596e611f":"0x80f222a749a2e18eb7f676d371f19ad7efeee3b7",
        "0xddd27201dc2f4a3a0afdcff8a807daf0b84c5dc9":"0x3a4b527dcd618ccea50adb32b3369117e5442a2f",
        "0xddee242662323a3cff3f9aa139ffa496ac3c73b0":"0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
        "0xdec31635e50acc89eeef6ec079766aaa7703ae3d":"0xc58c0fca06908e66540102356f2e91edcaeb8d81",
        "0xdf02ffeafdb79e564ae9fdac6545c5f4c2178400":"0x8eb24319393716668d768dcec29356ae9cffe285",
        "0xe0cce4518ea70d98231c47e5b977ba90cfcec615":"0x471daee6e481b2ab7d2f2f64b8f9b083daae29da",
        "0xe18256cd23efcdc4f95581e86f61ea1b09afd02a":"0x5adc961d6ac3f7062d2ea45fefb8d8167d44b190",
        "0xe1b7aec3639068b474bfbcb916580fc28a20717b":"0x8888889213dd4da823ebdd1e235b09590633c150",
        "0xe1e005d82922303ca9fb5cb6426c2eb07f8e5c84":"0xcd7d0042fdb92f3dde312aa61af084953aa914ee",
        "0xe2833ad850513faa973747e4495db1d0b0e038a0":"0xc9c0ff6344b4bfdee7ace21c4deddd6e43ecb454",
        "0xe2f548a3b898eca923bd61919f2635b071a7f95e":"0x23ccc43365d9dd3882eab88f43d515208f832430",
        "0xe31a245102fc1ae72f80c6969f6475e85c897bbe":"0x8713d26637cf49e1b6b4a7ce57106aabc9325343",
        "0xe3406e7d0155e0a83236ec25d34cd3d903036669":"0xd29f0b5b3f50b07fe9a9511f7d86f4f4bac3f8c4",
        "0xe499657190d515119077af5d64f44b6f850baea5":"0xbbd1706d16418bb136e1497a73d3af4164586da0",
        "0xe4f984870929bb4189ab43def9fc2f339244765e":"0x7c0f856ddb93dfb957eac4513c6a5249c395cae5",
        "0xe52d807ad934953315ccfe56f3b6425fcff04b2b":"0x4df47b4969b2911c966506e3592c41389493953b",
        "0xe52dceab9c8892eca29b0a0869257d7ad26268d2":"0xdf0960778c6e6597f197ed9a25f12f5d971da86c",
        "0xe69ea0f00b6d399a11030eb6d79e54c486c0e1d1":"0xdcef0710b10ad66bc2194b412fb37c65d4d0a965",
        "0xe6c198d27a5b71144b40cfa2362ae3166728e0c8":"0x737f98ac8ca59f2c68ad658e3c3d8c8963e40a4c",
        "0xe749f1a9d5f9055f0b784b586818833b9679949c":"0x330839ef82d34801bd96e75a4ee778ac56fa1ed8",
        "0xe79fe64771d5351b936eeac6222682c3d878063e":"0xfe5f141bf94fe84bc28ded0ab966c16b17490657",
        "0xe8bc0a210aaf86dab4dd600faca5cfe492e2e084":"0x8ae4bf2c33a8e667de34b54938b0ccd03eb8cc06",
        "0xe8e45431b93215566ba923a7e611b7342ea954df":"0x6810e776880c02933d47db1b9fc05908e5386b96",
        "0xe9078a97eef2bb502a9f792169f9c03626649248":"0x4d8fc1453a0f359e99c9675954e656d80d996fbf",
        "0xe94c4dc3a75fad623391a68b4fbdd4b3c9b3eeb4":"0xfa6f7881e52fdf912c4a285d78a3141b089ce859",
        "0xe9a5bbe41dc63d555e06746b047d624e3343ea52":"0x4575f41308ec1483f3d399aa9a2826d74da13deb",
        "0xe9cf7887b93150d4f2da7dfc6d502b216438f244":"0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb",
        "0xea3a62838477082d8f2106c43796d636dc78d8a4":"0xb683d83a532e2cb7dfa5275eed3698436371cc9f",
        "0xeb765bc156de3249b491d2db7aba3450fbcf9c5b":"0x4cbdd06fcc050c7e0bd77478ed0fe4ea5eec651c",
        "0xebd8aa50b26bfa63007d61eba777a9dde7e43c64":"0x9469d013805bffb7d3debe5e7839237e535ec483",
        "0xed9d5aa6124a3310b80a2468c67763627653887d":"0x23d80c4ee8fb55d4183dd9329296e176dc7464e1",
        "0xedc485266aa0ebe9ccbfc1f255bb5ffea1f9e3cc":"0xb63b606ac810a52cca15e44bb630fd42d8d1d83d",
        "0xf173214c720f58e03e194085b1db28b50acdeead":"0x514910771af9ca656af840dff83e8264ecf986ca",
        "0xf43b2329130cfd87b322e49b96681e09f1ef172f":"0xe477292f1b3268687a29376116b0ed27a9c76170",
        "0xf506828b166de88ca2edb2a98d960abba0d2402a":"0x93ed3fbe21207ec2e8f2d3c3de6e058cb73bc04d",
        "0xf50bac10faf905e95ffdc9f35b75ee67117dad2a":"0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea",
        "0xf53bbfbff01c50f2d42d542b09637dca97935ff7":"0xd56dac73a4d6766464b38ec6d91eb45ce7457c44",
        "0xf5bb20e73c59e0f643ae4bcd89d761ebdec83b73":"0x78a73b6cbc5d183ce56e786f6e905cadec63547b",
        "0xf6a0e98be0153e64b34693ba62c10009c697c95a":"0xeac034b66aa7538a551a5fcec85e37592233c109",
        "0xf79cb3bea83bd502737586a6e8b133c378fd1ff2":"0x4946fcea7c692606e8908002e55a582af44ac121",
        "0xf7b5a4b934658025390ff69db302bc7f2ac4a542":"0x26e75307fc0c021472feb8f727839531f112f317",
        "0xf996d7d9bacb9217ca64bbce1b1cd72e0e886be6":"0x00000100f2a2bd000715001920eb70d229700085",
        "0xfaddccf91009c6383bc7b75c7f19a2c8be2f75ef":"0x2515905dd027cc38f139feda8e7e6945c7f9d07a",
        "0xfe3f05c7da9fe53591fab3f920798a67a95747ed":"0xa66daa57432024023db65477ba87d4e7f5f95213",
        "0xffcf45b540e6c9f094ae656d2e34ad11cdfdb187":"0x3212b29e33587a00fb1c83346f5dbfa69a458923",
    },
    //some of the many bancor converter contracts, address not necessary to find trades, but makes reading things easier
    bancorConverters:[ 
        '0xf20b9e713a33f61fa38792d2afaf1cd30339126a',
        '0x3839416bd0095d97be9b354cbfb0f6807d4d609e',
        '0x2b9eab2098e4a363a114aa6934f5c3cdea8149a3',
        '0xc02d4bd00f642d2821e4279c810dd7b6e49264f8',
        '0xe9800c0b73a71be61d49a61fa3b2320ee524fb3d',
        '0x238b7e54dfee4d8e98b8d1a78ab40dd94349bcfd',
        '0xaf6a5b0998ff41355f3b4fe1ab96d89bd2c487d3',
        '0x2d56d1904bb750675c0a55ca7339f971f48d9dda',
        '0x587044b74004e3d5ef2d453b7f8d198d9e4cb558',
        '0x8c2036ce61648fcddffb06d6d11fe0b479ed63fe',
        '0x967f1c667fc490ddd2fb941e3a461223c03d40e9',
        '0x4a5cb62e27120a5a2b113198a69a2b12069ad146',
        '0x58b249b613ce917b6ccc2f66787856ef39f4f0b6',
        '0x07cff9c779702a57a4da4b15ef9a0af58e9472d3',
        '0xb19710f3bdb4df4c781b9dc3cd62979921878280',
        '0x8606704880234178125b2d44cbbe190ccdbde015',
        '0xbb9859dca5b269e787e9dd6042db46b07515fc4b',
        '0x46ffcdc6d8e6ed69f124d944bbfe0ac74f8fcf7f',
        '0x2dad2c84f6c3957ef4b83a5df6f1339dfd9e6080',
        '0x1f4baef92123335fbb6db8781cc28d2cf4a85800',
        '0xedcc9346d266c78364f21b1aca88641be7ca73e1',
        '0x71168843b49e305e4d53de158683903ef261b37f',
        '0x7172c5b24bdce3b93a78c53ef1ece011b0472c1b',
        '0xde6a1e3702c31ae9e13ec316fce463278c8962d3',
        '0x02b5e0c10862c8d24585c00282bde99d09831a6c',
        '0x0c41f4e6339e9c8635062f39d976789dbd832b09',
        '0xf4327c919854cb099ac574a22f5fba901e2025c4',
        '0x83e240d1cbc6ec7f394cd6ba5ed01b7fcdf44ed5',
        '0xdd9b82c59aa260b2a834ec67c472f43b40a2e6f1',
        '0x645a3f2fa86be27a4d9a3cc93a73f27b33df766f',
        '0xf3ed5b15618494ddbd0a57b3bca8b2686ac0bc04',
        '0x94c654fef85b8b0a982909a6ca45b66bb2384236',
        '0x58c46d06cfdcf9ca2cb590d7b79b12ffa8adce04',
        '0xa0db892affca7ec5ba3cea5d03fc0bc53db34036',
        '0xfa968bc2e4768d431ffec4ee64307f8152e1c9f1',
        '0xec532c82ad94b196b908e6ef86c9ac69811dfd56',
        '0x8fd5bfbc2f61a450400ae275e64d1e171c05b639',
        '0xc18166e01970be040d8c7761cdd1c3372ae1edf0',
        '0xe88d6d63389d5c91e6348e379913f330739ad2c4',
        '0xd0c1bdb51514f144f11169140d408c26bd89f9e5',
        '0x2769eb86e3acdda921c4f36cfe6cad035d95d31b',
        '0x8658863984d116d4b3a0a5af45979eceac8a62f1',
        '0x7bac8115f3789f4d7a3bfe241eb1bcb4d7f71665',
        '0xaa8cec9cbd7d051ba86d9deff1ec0775bd4b13c5',
        '0x751b934e7496e437503d74d0679a45e49c0b7071',
        '0xd3a3bace3d61f6f5d16a9b415d51813cd2ea3887',
        '0xba2be1cd1f00470c21385b7cbed6211aefac0172',
        '0x66906318f947e519da5e6a0f8c88ddd1610d3621',
        '0x11614c5f1eb215ecffe657da56d3dd12df395dc8',
        '0x2ac0e433c3c9ad816db79852d6f933b0b117aefe',
        '0x9c3a65ef4dae8655d7725ada3dd7711cfcc19ef5',
        '0xc31db08240a11df6a4c159ff4e6d69f484fc3828',
        '0x599485dc0f3d8b308b973b2db5cd44bae46d31c4',
        '0x4b19e0bd92ac4e3d4ac69bc9f90c8602fe2bf306',
        '0x6b431a7a99780819473722161ee9145e5649c5e2',
        '0xd64ac0a8f157df9762f8fae9e650a0f99b039629',
        '0x287565333c9cafd57ad7241ccb1d29de976bb5f8',
        '0x8fff721412503c85cffef6982f2b39339481bca9',
        '0x0f1c029c5d7f626f6820bfe0f6a7b2ac48746ddf',
        '0x9a3487c0d300c4d3a7b3ff38d7a18c53c66f1c49',
        '0xcde79f10b689a716029d0edb54de78b1bbc14957',
        '0x1c35e1157f85527569134d84af72a96f2fb8fd3a',
        '0x72844ab8b5f59c0251bcce6ef5f2be92d7528c1a',
        '0x3b42239a8bc2f07bb16b17578fe44ff2422c16f6',
        '0xc7151af2e9d1a702a61fcb655e2334bfee5b5faf',
        '0x315b9696cd3c83bb3e082f5c7f612cd2126f90d1',
        '0x99f357f722ec3e456af0eb530c1c14a3251305ad',
        '0xbe1daf05bf9e054b3e28b7e9c318819ef5dacb58',
        '0x32d4fb837f41955b81556f74dadb2c5b8a0d0989',
        '0x7e4b0abad3407b87a381c1c05af78d7ad42975e7',
        '0xdf76e7e26f6ee937f09a3f17f1d7047c0f928e12',
        '0x37c88474b5d6c593bbd2e4ce16635c08f8215b1e',
        '0xbf7f4e20473ed510cd7cdd0c1a5036a2791ff1bc',
        '0x20d23c7a4b2ea38f9dc885bd25b1bc8c2601d44d',
        '0x079cf5c7b29067708bf653fbb93d7f619d9287a9',
        '0x69e37aba9b520a204bb0baebd76b0ac1a2390b37',
        '0x25d4aef414ea092fbcbd83fd30e89e15cf820d0a',
        '0x4f88dfc8e1d7ba696db158656457797cfbdfb844',
        '0xc6aacdf2cb021515009098025a0ece472608918e',
        '0xc04b5a4556d00bca8eac5f5acca31981a6597409',
        '0x6411a822850dcfe2fae215248e47de77b1738bea',
        '0x7322e84e522407d026ccb86f688281222cbc8874',
        '0xa8ace92ea2d9174f75208ee44495f459e0491a96',
        '0x952eb7dc904f6f8b6b0bc6c5c99d45143e743cd7',
        '0xfe75413e059eecf6eb2b92f06456276e8596862b',
        '0x4f138e1ceec7b33dfa4f3051594ec016a08c7513',
        '0x2c2d1113dd9f40fad1b04cf23af9da84c37efcf3',
        '0x635c9c9940d512bf5cb455706a28f9c7174d307f',
        '0xdb9272880400e0ae8e522994f6a959122d94c7b7',
        '0x9f547e89078b24d0e2269ba08eb411102e98ca14',
        '0xd7169672b25271d379cc2c022dfe0ceebb3f006f',
        '0x5ae1217f932fe1acdc8a34229044444920a13db8',
        '0x0fec04a7526f601a1019edcd5d5b003101c46a0c',
        '0x7dfebdd6902f3df5a0f247d18f7895116f640bd1',
        '0x60dfa58865b9cce905cf570d6e2bfa7899ce0b2b',
        '0x8e7fc617e87b39bd5fe1767a95afa53d2c79f147',
        '0x2f3cdf19a7ed0352f96440dac92a6d2959719c07',
        '0x73f73391e5f56ce371a61fc3e18200a73d44cf6f',
        '0x8bb76c5ae6b7d6bd1678510edd06444acdf8f72b',
        '0xcbc7e6dccfaaf6ed2e8346ceda633f77247eb84c',
        '0x8b30e174bddb3c0376e666afb8a4196e2f53182d',
        '0xb5a5a031d8b8577871384be6055b2ea29fac064c',
        '0xc9788f6fe9c5808a106f10cb6844618cbeddd1c0',
        '0x39a23012c065e0a93a6e268717c8b0f25f0430e9',
        '0x810c99c5de0a673e4bc86090f9bfe96a6d1b49a7',
        '0x8b56ef96c1cc67dac0a57ccea197a2ef1568ad33',
        '0x91ba23a1dcc91ce023660c98434ba611addaa173',
        '0xc11cce040583640001f5a7e945dfd82f662cc0ae',
        '0xce1e2b5ffe4d441abafd136768f24867101dfa50',
        '0x0960465fe4bb1c2fd822235e7ca826d648c3fb34',
        '0x13ddae7f499474791d78902b4fa8c32a418ba3ad',
        '0x2ce573c05c9b8f6ef1a476cc40250972f1f3d63c',
        '0x3167cc146d228c6977dcbada380df926b39865b1',
        '0xe27cf7324e6377bddc48db6bac642839ffa9bb36',
        '0x3b0116363e435d9e4ef24eca6282a21b7cc662df',
        '0x3f7ba8b8f663fddb47568cca30eac7aed3d2f1a3',
        '0xb018af916ed0116404537d1238b18988d652733a',
        '0xff8d1014da6382f4c07461fbd5f3bed733b229f1',
        '0xdbd2291c8719003717fcab6c7888f1e8c392b85b',
        '0x73314db8f62312e6a1fb365c3a98599119a91c74',
        '0xe0569fd1c3f0affd7e08131a16c06f3381c9355a',
        '0xf346a9884bf8f858848268fb9d8ab31dae4b323f',
        '0xb85e52268cbf57b97ae15136aa65d4f567b8107c',
        '0xe53730216bafc67e12d371047fa9f18fa4cfd93c',
        '0x5039d9b575bd5722d310af6d2fc11e053c6d03da',
        '0xc85e1c39a08a8bc385644f16f068156a329e7867',
        '0x5142127a6703f5fc80bf11b7b57ff68998f218e4',
        '0xf0521bc69f0e6e21e03cf0f15efe28af0cc3acce',
        '0x34e4e501dfa903c7c1c7b7f82a56b870838b5274',
        '0xa7a402266ceea0652ea8eafd919d619d16bee134',
        '0xfd9e980adb3d1f9e9ff515aff99e454ad839bdfa',
        '0x4ccd6c8da3e35f60c3328388d46f64f1be49b41f',
        '0x9a914cee02c69e37e4ca51c46967e4ffacb95cc5',
        '0x42d2c774b30f53b81a1468f894d8405cdff07b83',
        '0xa0776ec5aaffc81268c47e5ca3365f92dd035b74',
        '0x593a70c88a14188f05636f9173a63128540a5890',
        '0xe103038c907625be740aa467cf597c7e89d5c5ad',
        '0xbafc0bf857ae9b8feaed937ac90e44d90a487c72',
        '0x3e3acb9cfebab0e3652c87bcb923184bb6408a51',
        '0x2666c5656460b12b4013b5e68514b76cf47e7611',
        '0x0a9ed23490cf8f89e750bbc3e28f96502bb45491',
        '0xf166d91c417c89444c601c95b171a23acbd10b93',
        '0x5552b2460ba2e899ada7c8369dcf09042ff14308',
        '0xe65c7e27c1c086f26ce0daa986c3d9c24ef3c2d8',
        '0x8c73126b85f59d85aa61391579b4c2710dd70f96',
        '0xe86d3a9bada1b7adcc32abde0522861b1dc7973a',
        '0x5fd2edfd49d0c88321ba644dda91fa16a2fe3a9c',
        '0x6e0e57ef7cbecd23162ebedccc3ac8e25d200487',
        '0x8cfcd76160a695303ec6f8dfacaa347fd6ae6f6f',
        '0xd361339550cd8b3e9446bbb12aea337785a7aea4',
        '0x3524bf63a3c97ed21f13f7621d14d2fe486d994c',
        '0x3d937ed623ef7ff3a61c55aebe32789fe443cf13',
        '0xd6c1942f34554aa6c85c8ea1d820e30ad8c2e43d',
        '0x8ca94b91be0b35f404d5af515cf448131b02ed37',
        '0x60c866423679fd30c1c7a7e16ed5142e9632a860',
        '0x6a4ebd8ce47b1362ea809d93f1beb744c4ffd7ee',
        '0x0cfbed1bd80bd8a740f24ec5fca8e8d1a9f87052',
        '0x98b069022c1304e95df0f060dcc186b6e25f2412',
        '0x14609cca8a69c734f7ba6dca3f723c4fbbeb6b43',
        '0x38ef8fd7cfd46d615ebf7788bc7225906b58406f',
        '0x2723a5af933ff0a3522a301015544be366e6ee31',
        '0xc3a60d674712019611fd68febb45a89ba766c8ef',
        '0xee5f5354f261383e67a45a65307e636bfda2d100',
        '0x9b10206f236669f4f40e8e9806de9ab1813d3f65',
        '0xb952ccbc1893c4dd1701bde249e62fc3ed357967',
        '0x82c970c55711dc5f33aa40fee6614fbb857ceb83',
        '0x7768a2e685da843a7dcf9a0f09b4d03d8d7fb6c4',
        '0xb3ad443ad4ec366127a634fae67453b0babc3f67',
        '0xc44330a585c3408392afb85b7018178bd4bae219',
        '0x2b2ed53e664d3616a20347cc0ff8940521784d47',
        '0xf458fd28e012e4a36f744384acc244d7bc38bb96',
        '0x445556b7215349b205997aaaf6c6dfa258eb029d',
        '0x32131848edc60e032abf0369241d34ec969ebf90',
        '0x38a3fc625df834dd34e8ede60e10cd3024a6650e',
        '0xe18e79a0e53fd57aea0e748c8d8da54b85a68d51',
        '0x123e3506bc08c14b15f1a967e27c26b108557db2',
        '0x015040eb85ac97f1532d4d45e309e16d07c0c164',
        '0x5ce5dc8107539907ce5f663ac71a93ccdd84a0be',
        '0x9bd60265d6e894dbbbba55eb76c6c9dd09efb22e',
        '0xce194c194cda85d93557867c2e88dc9f5bcd01f1',
        '0x1d9d9670351d7a05c19ed7c06d3085dcbef68264',
        '0x620266bf3b1675646173f9b8d7b5ed92c0805400',
        '0xb2bc3b9558a22a73edd531c590593f5e4e3370a7',
        '0x1c533d00b6463bdb609555e906cee92bd8e5f313',
        '0x07d30104ba4d9eb4a845db1142bf9aa1f5a93d97',
        '0xecc17838dcc6ed1be59c7b3aadc015c7299c72ec',
        '0x51907923c3280c24b6b69b0d217ea34cabde684d',
        '0x211d59b3ce1b8f6fc37df1055a603394cdd3a4e4',
        '0xdacc53bb6dbb17029f17e408ae9e07e13b8af563',
        '0xd016ab46ec8fd9ccc19103db74b3cca72e68ea62',
        '0x8a048742ae8f533cc8680b0098701bf9557f25da',
        '0x8ea7865cdf06ed8bfaf3826fdd34ecb6d596d612',
        '0xfec548e321d1776867821bd8697e147eda5e8f20',
        '0x8646a2dbf9585b0e76811bc338706d702ed68203',
        '0xdcb059d5d596e15cf7256b406e1d5991dee7ec70',
        '0x4f70eaf75e7d31cea17248476fc98947b31d4d3a',
        '0xb5621cf12d88f3711836a062f23bf6d3965d7f09',
        '0x6dc4a22c8b5e208a75a86b89c65273e361eaac6a',
        '0xe06418962803dc41a36fd6c677dfab68a954d066',
        '0x3f400c81c3c13ece47ec02b612d5643f92dd6aeb',
        '0x30fdf2c840aab738bccba53d9787bffa8ba27005',
        '0x4c789df2c1e21bb17c5ab24ed95d6abeb114726b',
        '0xc99209bbc3ce73b610f5f17cd01a0d1244abbc8d',
        '0x5e7fd9521a17c38f3f69a02e3f45f8df7763c224',
    ],
};
},{}],4:[function(require,module,exports){
module.exports = {
    // .supportedDex toggles whether recent.js parses them as Exchanges
    EtherDelta: { addr: '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819', name: 'EtherDelta', supportedDex: true },
    EtherDelta2: { addr: '0x373c55c277b866a69dc047cad488154ab9759466', name: 'EtherDelta-OLD', supportedDex: true },
    EtherDelta3: { addr: '0x4aea7cf559f67cedcad07e12ae6bc00f07e8cf65', name: 'EtherDelta-OLD', supportedDex: true },
    EtherDelta4: { addr: '0x2136bbba2edca21afdddee838fff19ea70d10f03', name: 'EtherDelta-OLD', supportedDex: true },
    EtherDelta5: { addr: '0xc6b330df38d6ef288c953f1f2835723531073ce2', name: 'EtherDelta-OLD', supportedDex: true },
    TokenStore: { addr: '0x1ce7ae555139c5ef5a57cc8d814a867ee6ee33d8', name: 'Token Store', supportedDex: true },
    Idex: { addr: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', name: 'IDEX', supportedDex: true },
    Decentrex: { addr: '0xbf29685856fae1e228878dfb35b280c0adcc3b05', name: 'Decentrex', supportedDex: true },
    //0x protocol v1
    '0x': { addr: '0x12459c951127e0c374ff9105dda097662a027093', name: '0x Exchange', supportedDex: true },
    '0xProxy': { addr: '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4', name: '0x Proxy', supportedDex: true },
    '0xForwarder': { addr: '0x7afc2d5107af94c462a194d2c21b5bdd238709d6', name: '0x Instant', supportedDex: false },
    //0x protocol v2
    '0x2': { addr: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b', name: '0x Exchange2', supportedDex: true },
    '0xProxy2': { addr: '0x2240dab907db71e64d3e0dba4800c83b5c502d4e', name: '0x ERC20 Proxy', supportedDex: true },
    '0xProxy3': { addr: '0x208e41fb445f1bb1b6780d58356e81405f3e6127', name: '0x ERC721 Proxy', supportedDex: false },
    '0xForwarder2': { addr: '0x5468a1dc173652ee28d249c271fa9933144746b1', name: '0x Instant', supportedDex: false },
    '0xForwarder3': { addr: '0x76481caa104b5f6bccb540dae4cefaf1c398ebea', name: '0x Instant', supportedDex: false },
    '0xForwarder4': { addr: '0xdc4587cb17d2a1829512e2cfec621f8066290e6a', name: '0x Instant', supportedDex: false },
    //0x v2.1 bugfix release
    '0x2.1': { addr: '0x080bf510fcbf18b91105470639e9561022937712', name: '0x Exchange 2.1', supportedDex: true },
    '0xProxy4': { addr: '0x95e6f48254609a6ee006f7d493c8e5fb97094cef', name: '0x ERC20 Proxy', supportedDex: true },
    '0xProxy5': { addr: '0xefc70a1b18c432bdc64b596838b4d138f6bc6cad', name: '0x ERC721 Proxy', supportedDex: false },
    '0xProxy6': { addr: '0xef701d5389ae74503d633396c4d654eabedc9d78', name: '0x MAP Proxy', supportedDex: false },
    //0x protocol v3
    '0x3Test': { addr: '0xb27f1db0a7e473304a5a06e54bdf035f671400c0', name: '0x v3 test', supportedDex: false },
    '0x3': { addr: '0x61935cbdd02287b511119ddb11aeb42f1593b7ef', name: '0x Exchange 3', supportedDex: false },
    '0xForwarder5': { addr: '0xa3ac9844514b96bb502627ca9dceb57c4be289e3', name: '0x Instant', supportedDex: false },
    '0xForwarder6': { addr: '0x5ff2c495055d4f6284f317a9c2edb7045497b14f', name: '0x Instant', supportedDex: false },


    // ethfinex v1, 0x v1 clone
    Ethfinex: { addr: '0xdcdb42c9a256690bd153a7b409751adfc8dd5851', name: 'Ethfinex', supportedDex: true },
    EthfinexProxy: { addr: '0x7e03d2b8edc3585ecd8a5807661fff0830a0b603', name: 'Ethfinex Proxy', supportedDex: true },

    OasisDex: { addr: '0x14fbca95be7e99c15cc2996c6c9d841e54b79425', name: 'OasisDex', supportedDex: true },
    OasisDex2: { addr: '0xb7ac09c2c0217b07d7c103029b4918a2c401eecb', name: 'OasisDex', supportedDex: true },
    OasisDex3: { addr: '0x39755357759ce0d7f32dc8dc45414cca409ae24e', name: 'Oasis (Eth2Dai)', supportedDex: true },
    OasisDexOld: { addr: '0x3aa927a97594c3ab7d7bf0d47c71c3877d1de4a1', name: 'OasisDex (OLD)', supportedDex: true },
    OasisDexOld2: { addr: '0x83ce340889c15a3b4d38cfcd1fc93e5d8497691f', name: 'OasisDex (OLD2)', supportedDex: true },
    OasisDexOld3: { addr: '0xa1b5eedc73a978d181d1ea322ba20f0474bb2a25', name: 'OasisDex (OLD3)', supportedDex: false },

    //Oasisdirect proxy creator
    OasisDirect: { addr: '0x793ebbe21607e4f04788f89c7a9b97320773ec59', name: 'OasisDirect', supportedDex: true },
    //0x279594b6843014376a422ebb26a6eab7a30e36f0 Oasisdirect only 2 txs

    AirSwap: { addr: '0x8fd3121013a07c57f0d69646e86e7a4880b467b7', name: 'AirSwap', supportedDex: true },
    AirSwapTrader : { addr: '0x9af9c0cf3cd15e0afe63930fbf20941c89f3ff98', name: 'AirSwap OTC', supportedDex: false},
    Kyber: { addr: '0x964f35fae36d75b1e72770e244f6595b68508cf5', name: 'Kyber Network', supportedDex: true }, // contract disabled?
    KyberTest: { addr: '0xd2d21fdef0d054d2864ce328cc56d1238d6b239e', name: 'Kyber Test', supportedDex: true },

    Kyber2: { addr: '0x91a502c678605fbce581eae053319747482276b9', name: 'Kyber Network', supportedDex: true }, // Kyber v2?
    Kyber2Proxy: { addr: '0x818e6fecd516ecc3849daf6845e3ec868087b755', name: 'Kyber Network', supportedDex: true }, // kyber2 moved events to proxy?
    Kyber2_2: { addr: '0x706abce058db29eb36578c463cf295f180a1fe9c', name: 'Kyber Network', supportedDex: true },
    Kyber2_2Proxy: { addr: '0xc14f34233071543e979f6a79aa272b0ab1b4947d', name: 'Kyber Network', supportedDex: true },
    Kyber2_3: { addr: '0x44f854ea73eec7a10c9ff0e003d1ec076ac18197', name: 'Kyber Network', supportedDex: true },
    Kyber2_3Proxy: { addr: '0x3257073d3b80bae378db8dea32519938910d05cc', name: 'Kyber Network', supportedDex: true },
    Kyber2_4: { addr: '0xaa9fb0f5b12752af97afa9ffdad9a15902645dbf', name: 'Kyber Network', supportedDex: true },
    Kyber2_4Proxy: { addr: '0xd76d2888828aea74247c41157020dad54865e730', name: 'Kyber Network', supportedDex: true },

    Kyber2_5: { addr: '0x9ae49c0d7f8f9ef4b864e004fe86ac8294e20950', name: 'Kyber Network', supportedDex: true },

    BancorQuick: { addr: '0xcf1cc6ed5b653def7417e3fa93992c3ffe49139b', name: 'Bancor', supportedDex: false },
    BancorQuick2: { addr: '0xf87a7ec94884f44d9de33d36b73f42c7c0dd38b1', name: 'Bancor', supportedDex: false },
    // network is quick v3?
    BancorNetwork: { addr: '0xf20b9e713a33f61fa38792d2afaf1cd30339126a', name: 'Bancor', supportedDex: false },
    BancorX: { addr: '0xda96eb2fa67642c171650c428f93abdfb8a63a2d', name: 'BancorX', supportedDex: false },
    // bancor quick3? 0x111913ca1c1a8d4e3283213ba115bf6dcde07d6f
    Enclaves: { addr: '0xbf45f4280cfbe7c2d2515a7d984b8c71c15e82b7', name: 'EnclavesDex', supportedDex: true },
    Enclaves2: { addr: '0xed06d46ffb309128c4458a270c99c824dc127f5d', name: 'EnclavesDex', supportedDex: false },
    Ethen: { addr: '0xf4c27b8b002389864ac214cb13bfeef4cc5c4e8d', name: 'ETHEN', supportedDex: true },
    Ethex: { addr: '0xb746aed479f18287dc8fc202fe06f25f1a0a60ae', name: 'ETHEX', supportedDex: true },
    Singularx: { addr: '0x9a2d163ab40f88c625fd475e807bbc3556566f80', name: 'SingularX', supportedDex: true },
    EtherC: { addr: '0xd8d48e52f39ab2d169c8b562c53589e6c71ac4d3', name: 'EtherC', supportedDex: true },

    /* exchange aggregators */
    EasyTrade: { addr: '0x9ae4ed3bf7a3a529afbc126b4541c0d636d455f6', name: 'EasyTrade', supportedDex: true },
    EasyTrade2: { addr: '0x0c577fbf29f8797d9d29a33de59001b872a1d4dc', name: 'EasyTrade', supportedDex: true },
    //tokenstore instant
    InstantTrade: { addr: '0xe17dbb844ba602e189889d941d1297184ce63664', name: 'TS InstantTrade', supportedDex: true },


    /* exchange aggregators (no input parsing yet) */
    // totle primary contracts      //https://github.com/totleplatform/contracts
    Totle: { addr: '0xd94c60e2793ad587400d86e4d6fd9c874f0f79ef', name: 'Totle', supportedDex: false },
    Totle2: { addr: '0x99eca38b58ceeaf0fed5351df21d5b4c55995314', name: 'Totle', supportedDex: false },
    Totle3: { addr: '0x476a0a98beaae3e7e451ccd46e50fb465ae540bb', name: 'Totle', supportedDex: false },
    Totle4: { addr: '0xa674695d170b51e300624728fb920f3c01b0f5c3', name: 'Totle', supportedDex: false },
    Totle5: { addr: '0x98db9047e80260b407ffbc67543f9a010ef0fc6a', name: 'Totle-OLD', supportedDex: false }, // unknown abi
    TotleProxy: { addr: '0xad5aa494bcd729b8ea728f581aade049c4ec4e9d', name: 'Totle', supportedDex: false },
    TotleProxy2: { addr: '0x74758acfce059f503a7e6b0fc2c8737600f9f2c4', name: 'Totle', supportedDex: false },
    TotleProxy3: { addr: '0xad5aa494bcd729b8ea728f581aade049c4ec4e9d', name: 'Totle', supportedDex: false },
    ParaSwap: { addr: '0xf92c1ad75005e6436b4ee84e88cb23ed8a290988', name: 'ParaSwap', supportedDex: false },
    DexAG: { addr: '0xd3bed3a8e3e6b24b740ead108ba776e0ad298588', name: 'DEX.AG v1', supportedDex: false },
    DexAG2: { addr: '0x932348df588923ba3f1fd50593b22c4e2a287919', name: 'DEX.AG v2', supportedDex: false },
    DexAG3: { addr: '0xa540fb50288cc31639305b1675c70763c334953b', name: 'DEX.AG v3', supportedDex: false },



    /* small ED/FD clones, not in balance & history pages yet, input/events should parse */
    Bitox: { addr: '0xb5adb233f28c86cef693451b67e1f2d41da97d21', name: 'BITOX', supportedDex: true },
    Coinchange: { addr: '0x2f23228b905ceb4734eb42d9b42805296667c93b', name: 'Coinchangex', supportedDex: true },
    EtherNext: { addr: '0x499197314f9903a1ba9bed7ee54cd9eee5900e49', name: 'Ethernext', supportedDex: true },
    Swisscrypto: { addr: '0xbeeb655808e3bdb83b6998f09dfe1e0f2c66a9be', name: 'SwissCrypto', supportedDex: true },
    Ethmall: { addr: '0x2b44d68555899dbc1ab0892e7330476183dbc932', name: 'Ethmall', supportedDex: true },
    Ethernity: { addr: '0x18f0cd26c06449d967ca6aef8b5f9d8ee9fd7992', name: 'Ethernity', supportedDex: true },
    ExToke: { addr: '0x97c9e0eccc27efef7330e89a8c9414623ba2ee0f', name: 'ExToke', supportedDex: true },
    AZExchange: { addr: '0xba74368aa52ad58d08309f1f549aa63bab0c7e2a', name: 'AZExchange', supportedDex: true },
    EtherERC: { addr: '0x20ac542ea6b358066f2308c9805531be62747e90', name: 'EtherERC', supportedDex: true },
    Polaris: { addr: '0x25066b77ae6174d372a9fe2b1d7886a2be150e9b', name: 'PolarisDEX', supportedDex: true },
    TradexOne: { addr: '0xf61a285edf078536a410a5fbc28013f9660e54a8', name: 'TradexOne', supportedDex: true },
    LSCX: { addr: '0x3da70c70b9574ff185b31d70878a8e3094603c4c', name: 'LSCX Dex', supportedDex: true },
    Scam: { addr: '0x1cd442aff7cdd247420a4dc76b44111994f521c9', name: 'SCAM EtherDelta', supportedDex: true },
    nDEx: { addr: '0x51a2b1a38ec83b56009d5e28e6222dbb56c23c22', name: 'nDex market', supportedDex: true },
    SeedDex: { addr: '0x7e21c13cac00528f5217f8c0c06706a91afe4a48', name: 'SeedDex', supportedDex: true },
    SeedDex2: { addr: '0xd4cc0cda97ec567235b7019c655ec75cd361f712', name: 'SeedDex', supportedDex: true },
    SwitchDex: { addr: '0xc3c12a9e63e466a3ba99e07f3ef1f38b8b81ae1b', name: 'SwitchDex', supportedDex: true },
    GiantDex: { addr: '0x7e21c13cac00528f5217f8c0c06706a91afe4a48', name: 'GiantDex', supportedDex: true },
    EtheRoox: { addr: '0xbca13cbebff557143e8ad089192380e9c9a58c70', name: 'EtheRoox', supportedDex: true },
    Ampl: { addr: '0x232ba9f3b3643ab28d28ed7ee18600708d60e5fe', name: 'Amplbitcratic', supportedDex: true },
    FakeED: { addr: '0x60394f71266901a5930bb4e90db5dd26b77f8dad', name: 'Fake EtherDelta', supportedDex: true },
    Marketplace: { addr: '0x2f13fa06c0efd2a5c4cf2175a0467084672e648b', name: 'Marketplace', supportedDex: true },
    Bloxxor: { addr: '0xb92c5f4f3a13bb14467fe0c25a4c569aa20e1df8', name: 'Bloxxor', supportedDex: true },
    Bitcratic: { addr: '0x3c020e014069df790d4f4e63fd297ba4e1c8e51f', name: 'Bitcratic', supportedDex: true },
    Swatx: { addr: '0x513c07e83237124e08672be4c8d481246d6f03f2', name: 'SWATX', supportedDex: true },
    CryptloDex: { addr: '0xcf5d889e2336d0f35f6121718f6c25e0650d4b25', name: 'CryptloDex', supportedDex: true},
    UnknownED: { addr: '0x4d55f76ce2dbbae7b48661bef9bd144ce0c9091b', name: 'Unknown', supportedDex: true },
    Afrodex: { addr: '0xe8fff15bb5e14095bfdfa8bb85d83cc900c23c56', name: 'Afrodex', supportedDex: true },
    EDex: { addr: '0x4fbcfa90ac5a1f7f70b7ecc6dc1589bbe6904b02', name: 'EDex', supportedDex: true },
    AlgoDEX: { addr: '0x4bc78f6619991b029b867b6d88d39c196332aba3', name: 'AlgoDEX', supportedDex: true }, 

    /* exchanges with no parsing support yet */
    DDEX: { addr: '0x2cb4b49c0d6e9db2164d94ce48853bf77c4d883e', name: 'DDEX Hydro', supportedDex: false },
    DDEX2: { addr: '0xe2a0bfe759e2a4444442da5064ec549616fff101', name: 'DDEX Hydro 1.1', supportedDex: false },
    DDEXproxy: { addr: '0x74622073a4821dbfd046e9aa2ccf691341a076e1', name: 'DDEX Hydro', supportedDex: false },
    R1: { addr: '0x7b45a572ea991887a01fd919c05edf1cac79c311', name: 'R1 Protocol', supportedDex: false }, //bithumb R1 protocol?
    // old R1? 0xE18898c76a39ba4Cd46a544b87ebe1166fbe7052
    BithumbDex: { addr: '0xc7c9b856d33651cc2bcd9e0099efa85f59f78302', name: 'BithumbDex', supportedDex: false },     //bithumb dex R1
    Martle: { addr: '0x551d56781e0cd16ac2c61a03e6537844a41c7709', name: 'Martle instant', supportedDex: false },
    Switcheo: { addr: '0xba3ed686cc32ffa8664628b1e96d8022e40543de', name: 'Switcheo', supportedDex: true }, //partial
    Switcheo2: { addr: '0x7ee7ca6e75de79e618e88bdf80d0b1db136b22d0', name: 'Switcheo v2', supportedDex: false },
    DutchX: { addr: '0x039fb002d21c1c5eeb400612aef3d64d49eb0d94', name: 'DutchX', supportedDex: false },
    DutchXProxy: { addr: '0xaf1745c0f8117384dfa5fff40f824057c70f2ed3', name: 'DutchX', supportedDex: false },
    Ethermium: { addr: '0xa5cc679a3528956e8032df4f03756c077c1ee3f4', name: 'Ethermium', supportedDex: false },
    Wedex: { addr: '0x7d3d221a8d8abdd868e8e88811ffaf033e68e108', name: 'WEDEX beta', supportedDex: false },
    Tokenlon: { addr: '0xdc6c91b569c98f9f6f74d90f9beff99fdaf4248b', name: 'Tokenlon', supportedDex: false },
    Miime: { addr: '0x7a6425c9b3f5521bfa5d71df710a2fb80508319b', name: 'Miime', supportedDex: false },
    DdexMargin: { addr: '0x241e82c79452f51fbfc89fac6d912e021db1a3b7', name: 'DDEX Margin', supportedDex: false },
    DefiSaver: { addr: '0x865b41584a22f8345fca4b71c42a1e7abcd67ecb', name: 'DefiSaver MCD', supportedDex: false },
    // UniSwap (contract per token pair)

    /* small exchanges, no input/event parsing yet */
    Dexy: { addr: '0x54b0de285c15d27b0daa687bcbf40cea68b2807f', name: 'Dexy', supportedDex: false },
    Dexy2: { addr: '0x9d160e257f1dff52ec81d5a4e7326dd82e144177', name: 'Dexy', supportedDex: false },
    Dubiex: { addr: '0x7c21d723af0f4594d4f8821aa16bc27c8ea6cec7', name: 'DUBIex', supportedDex: false },
    Radex: { addr: '0x9462eeb9124c99731cc7617348b3937a8f00b11f', name: 'Radex', supportedDex: false },
    Joyso: { addr: '0x04f062809b244e37e7fdc21d9409469c989c2342', name: 'Joyso', supportedDex: false },
    DexTop: { addr: '0x7600977eb9effa627d6bd0da2e5be35e11566341', name: 'DEx.top', supportedDex: false },
    BitEye: { addr: '0x39fbd1140cd1fc298f00c3ea64b3591de94c67e7', name: 'BitEye', supportedDex: false },
    BitEye2: { addr: '0x9e2f2dd1e3641f389673f89dc316bb00b01cd83a', name: 'BitEye', supportedDex: false },
    AXNET: { addr: '0xacf999bfa9347e8ebe6816ed30bf44b127233177', name: 'AXNET', supportedDex: false },
    WeiDex: { addr: '0xccd7ce9ec004bfbd5711245f917d6109813a909c', name: 'WeiDex', supportedDex: false },
    DexBlue: { addr: '0x257586004f6828a01ba4a874d3cfd0757029f32a', name: 'dexBlue (old)', supportedDex: false },
    DexBlue2: { addr: '0x000000000000541e251335090ac5b47176af4f7e', name: 'dexBlue', supportedDex: false },
    AllBit: { addr: '0xdc1882f350b42ac9a23508996254b1915c78b204', name: 'AllBit', supportedDex: false },
    AllBit2: { addr: '0xff6b1cdfd2d3e37977d7938aa06b6d89d6675e27', name: 'AllBit', supportedDex: false },
    Saturn: { addr: '0x13f64609bf1ef46f6515f8cd3115433a93a00dc6', name: 'Saturn Network', supportedDex: false },
    Loopring: { addr: '0x8d8812b72d1e4ffcec158d25f56748b7d67c1e78', name: 'LoopRing v1', supportedDex: false },
    Loopring3: { addr: '0xc2d1e8fb0c10810bb888231e7b85118042846105', name: 'LoopRing v3', supportedDex: false },
    Aiwallet: { addr: '0x3dbf4ee7ed88157cda8b2c1578861cea1a1230f1', name: 'Aiwallet', supportedDex: false },
    AmisDex: { addr: '0x2cc69caaaaa6114ddf48f4ddb2adb9c5d5d3e048', name: 'AmisDex', supportedDex: false },
    Verify1: { addr: '0x48bf5e13a1ee8bd4385c182904b3abf73e042675', name: '0xVerify', supportedDex: false },
    Verify2: { addr: '0x1c307a39511c16f74783fcd0091a921ec29a0b51', name: '0xVerify', supportedDex: false },
    Orderbook: { addr: '0xb3ec0d352c7935dd2663eafab4c99be6508df9af', name: 'orderbook.io', supportedDex: false },
    DexFarm: { addr: '0xa78fa0825b46b38c8679c3ea7e493d90cd6bc834', name: 'Dex Farm', supportedDex: false },
    DexBrokerage: { addr: '0x41a5b8aa081dcd69ace566061d5b6adcb92cae1c', name: 'DexBrokerage', supportedDex: true }, // everything beside trade parses (idex-like)
    WandX: { addr: '0xf9570f0332776abc55e5fbdb35c82bb20b5ad00b', name: 'WandX', supportedDex: false },
    Blockonix: { addr: '0x80ea118992545f43a8592c812b1099e518097874', name: 'Blockonix', supportedDex: false },
    Blockonix2: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'Blockonix', supportedDex: false },
    CryptoKitty: { addr: '0xb1690c08e213a35ed9bab7b318de14420fb57d8c', name: 'CryptoKitties', supportedDex: false }, //auction
    Dinngo: { addr: '0xd494938d0524edadfc239adc2c233e50550fa152', name: 'Dinngo', supportedDex: false },
    DappDex: { addr: '0xec3d7968b0d3fff0a074668e08eb56c5e6d38b21', name: 'DappDex', supportedDex: false },
    MCDEX: { addr: '0xfe3a6567a25d74b3a7f10ed49631502806ed1a17', name: 'MCDEX', supportedDex: false },
    Coinected: { addr: '0xdf00412a54951e0ff42267427c3f17fa792a14a0', name: 'Coinected', supportedDex: false },
    McAfeeSwap: { addr: '0x47653de428ff814cc2b78e7a4b569c1aec4add7c', name: 'McAffeeSwap', supportedDex: false },
    DMEX1: { addr: '0x0c74f22130c985fa02e7105d6095fb782e9eb08c', name: 'DMEX', supportedDex: false },
    DMEX2: { addr: '0x33d6461a9dba4c234fc01bc4a2df59bf26720e66', name: 'DMEX', supportedDex: false },
    Atomex: { addr: '0xe9c251cbb4881f9e056e40135e7d3ea9a7d037df', name: 'Atomex', supportedDex: false },
    ERCOTC: { addr: '0x2b3a44a25e62943f5bc2b44b27e6d7734dd14427', name: 'ERCOTC', supportedDex: false },
    DEXIO: { addr: '0xababb61a9f837aad53ed4320221737fc6e9dc84b', name: 'Dex.io', supportedDex: false },

    Counter: { addr: '0xc0deee11aa091189fff0713353c43c7c8cae7881', name: 'Counter', supportedDex: false },
    Counter2: { addr: '0x1234567896326230a28ee368825d11fe6571be4a', name: 'Counter', supportedDex: false },
    Counter3: { addr: '0x12345678979f29ebc99e00bdc5693ddea564ca80', name: 'Counter', supportedDex: false },

    // hb dex 0xf5f310b4bc81917c39a73cfec2c1b36325437fea, 0x5907aecf617c5019d9b3b43a5d65e583ce0f48bf
    // cryptozodiac 0xf238f55ede5120915b36715b0fffe20ff57f8134

    // 0xverify 0x48bf5e13a1ee8bd4385c182904b3abf73e042675


    //leverj
    Leverj1: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'LeverJ', supportedDex: false },//registry
    Leverj2: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'LeverJ', supportedDex: false },//custodian
    Leverj3: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'LeverJ', supportedDex: false },//staking

    //compound.finance v1
    Compound1: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'Compound', supportedDex: false }, //market
    Compound2: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'Compound', supportedDex: false }, //oracle
    Compound3: { addr: '0x67b084e4654e1d62afa9694b6a626cec5c9ff2bd', name: 'Compound', supportedDex: false }, //interest

    //bilink
    Bilink1: { addr: '0xffd883e94f7a3700aaf81a411bd164ad27acc656', name: 'Bilink', supportedDex: false }, //loan
    Bilink1: { addr: '0xaea870ca4ad2ee820050124a7580e78176d9c806', name: 'Bilink', supportedDex: false }, //loan
    Bilink1: { addr: '0x4acbad9064c1a248ff73b1855613c16d9f5894b4', name: 'Bilink', supportedDex: false }, // exchange, trades
    Bilink1: { addr: '0x611ce695290729805e138c9c14dbddf132e76de3', name: 'Bilink', supportedDex: false }, // data
    Bilink1: { addr: '0xc75fa06f6002b458468d9e484d13bf522030d4ae', name: 'Bilink', supportedDex: false }, // balance


    // kernel? 0x740f8b58f5562c8379f2a8c2230c9be5c03ac3fc
    // nuo network https://github.com/NuoNetwork/contracts-v2
    
    //slowtrade 0x851b7f3ab81bd8df354f0d7640efcd7288553419 ??
    //slowtrade 0x039fb002d21c1c5eeb400612aef3d64d49eb0d94 ??


    //dether 0x9e282120e0820787085fd9914c6f36cc73631476 ??
    //dether 0x876617584678d5b9a6ef93eba92b408367d9457c ??

    //stixex 0x946bff9ee4f2486d4f061a05bf6f7bc40703769a

    //thor swap 0x2348174894e42b82db043d210051cec544653389

    //market protocol?

    /* unknown ed clones */
    // 0xd307c5686441fe6677e9251d1c1c469e0785e331
    // 0xa0e8bf2b304a9761cbbf82369182f748cbeae6b5
    // 0x4d55f76ce2dbbae7b48661bef9bd144ce0c9091b
    // 0xc86366cb075426223bca74059ae9dd3d68b5210a
    // 0xec65d776a9624e1186fabe988280b2f8e13bbf80
    // 0xccdabeaa4c1c54efab58484c791428b22083b432
    // 0xdb212bb6dd0c9cbc9fc0c5ffe88be35b81cbeb92

    //unknown kyber clone? 0xafbf0d08269a7eee8d587121f3b0616c8cef5077, 0x6326dd73e368c036d4c4997053a021cbc52c7367

    // fake 0x? 0x5fb2f392772a6cb5ac423ceb587b62898c06c8cf
    // 0x v2 ?? 0xec200345f7e2991bcead2d299902e1380f902dca
    //unverified bancor? 0xf0e5af5380edf5295279dd0d5b930d3b9408867d
    // ?? 0x634cf699a42940f0ded47a98ce8e36bc82683baf
};
},{}],5:[function(require,module,exports){
module.exports = {
  //First block on day 1 of month, UTC time  (feb 2017 is feb 9, etherdelta contract deployment date)
  blockMonths: [
    { m: "Feb 2017", blockFrom: 3154196, blockTo: 3269188 },
    { m: "Mar 2017", blockFrom: 3269188, blockTo: 3454529 },
    { m: "Apr 2017", blockFrom: 3454529, blockTo: 3629091 },
    { m: "May 2017", blockFrom: 3629091, blockTo: 3800776 },
    { m: "Jun 2017", blockFrom: 3800776, blockTo: 3955159 },
    { m: "Jul 2017", blockFrom: 3955159, blockTo: 4101695 },
    { m: "Aug 2017", blockFrom: 4101695, blockTo: 4225038 },
    { m: "Sep 2017", blockFrom: 4225038, blockTo: 4326061 },
    { m: "Oct 2017", blockFrom: 4326061, blockTo: 4467005 },
    { m: "Nov 2017", blockFrom: 4467005, blockTo: 4652926 },
    { m: "Dec 2017", blockFrom: 4652926, blockTo: 4832686 },
    { m: "Jan 2018", blockFrom: 4832686, blockTo: 5008422 },
    { m: "Feb 2018", blockFrom: 5008422, blockTo: 5174125 },
    { m: "Mar 2018", blockFrom: 5174125, blockTo: 5357795 },
    { m: "Apr 2018", blockFrom: 5357795, blockTo: 5534863 },
    { m: "May 2018", blockFrom: 5534863, blockTo: 5710964 },
    { m: "Jun 2018", blockFrom: 5710964, blockTo: 5883490 },
    { m: "Jul 2018", blockFrom: 5883490, blockTo: 6065980 },
    { m: "Aug 2018", blockFrom: 6065980, blockTo: 6249399 },
    { m: "Sep 2018", blockFrom: 6249399, blockTo: 6430273 },
    { m: "Oct 2018", blockFrom: 6430273, blockTo: 6620476 },
    { m: "Nov 2018", blockFrom: 6620476, blockTo: 6803256 },
    { m: "Dec 2018", blockFrom: 6803256, blockTo: 6988615 },
    { m: "Jan 2019", blockFrom: 6988615 ,blockTo: 7156137 },
    { m: "Feb 2019", blockFrom: 7156137, blockTo: 7280860 },
    { m: "Mar 2019", blockFrom: 7280860, blockTo: 7479257 },
    { m: "Apr 2019", blockFrom: 7479257, blockTo: 7671850 },
    { m: "May 2019", blockFrom: 7671850, blockTo: 7870425 },
    { m: "Jun 2019", blockFrom: 7870425, blockTo: 8062293 },
    { m: "Jul 2019", blockFrom: 8062293, blockTo: 8261512 },
    { m: "Aug 2019", blockFrom: 8261512, blockTo: 8461047 },
    { m: "Sep 2019", blockFrom: 8461047, blockTo: 8653171 },
    { m: "Oct 2019", blockFrom: 8653171, blockTo: 8849471 },
    { m: "Nov 2019", blockFrom: 8849471, blockTo: 9029510 },
    { m: "Dec 2019", blockFrom: 9029510, blockTo: 9193266 },
  ],
  // history settings per exchange
  history: {
    EtherDelta: {
      contract: 'EtherDelta', //contract variable in config.exchangeContracts
      minBlock: 3154197,
      tradeTopic: '0x6effdda786735d5033bfad5f53e5131abcced9e52be6c507b62d639685fbed6d',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0xc10fc67499a037b6c2f14ae0c63b659b05bd7b553378202f96e777dd4843130f',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    Decentrex: {
      contract: 'Decentrex',
      minBlock: 3767902,
      tradeTopic: '0x6effdda786735d5033bfad5f53e5131abcced9e52be6c507b62d639685fbed6d',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0x1b2ff86bbf91feb9ef7f5310dd258137e034d65f6e99ea432fa98a933a2ffecd',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    'Token store': {
      contract: 'TokenStore',
      minBlock: 4097029,
      tradeTopic: '0x3314c351c2a2a45771640a1442b843167a4da29bd543612311c031bbfb4ffa98',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0x386439acefbf00018b318f283a9ebc6185c483ff6738117243dba40fc1b42bb6',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    '0x Protocol v1': {
      contract: '0x',
      minBlock: 4145578,
      tradeTopic: '0x0d0b9391970d9a25552f37d436d2aae2925e2bfe1b2a923754bada030c498cb3',
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x4ba480054e660dd81dea5d9ffcdc12a355650762d6997f181c9fe2ec6fa96f6e',
      userIndexed: false, // only if maker
      showExchange: true,
      hideFees: false,
      hideOpponent: false,
    },
    Ethfinex: { //0x v1 clone
        contract: 'Ethfinex',
        minBlock: 6293901,
        tradeTopic: '0x0d0b9391970d9a25552f37d436d2aae2925e2bfe1b2a923754bada030c498cb3',
        withdrawTopic: undefined,
        depositTopic: undefined,
        createTx: '0x5a1fd20ae25f77649d04fdf1439feb555ec9de275b29a83f6c4b12ee2fb5480a',
        userIndexed: false, // only if maker
        showExchange: true,
        hideFees: false,
        hideOpponent: false,
      },
    '0x Protocol v2': {
      contract: ['0x2','0x2.1'],
      minBlock: 6271590,
      tradeTopic: '0x0bcc4c97732e47d9946f229edb95f5b6323f601300e4690de719993f3c371129',
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x4a03044699c2fbd256e21632a6d8fbfc27655ea711157fa8b2b917f0eb954cea',
      userIndexed: false, // only if maker
      showExchange: true,
      hideFees: false,
      hideOpponent: false,
    },
    OasisDex: {
      contract: ['OasisDex', 'OasisDex2','OasisDex3', 'OasisDexOld', 'OasisDexOld2'],
      minBlock: 3435757, //4262057, //4751582,
      tradeTopic: '0x3383e3357c77fd2e3a4b30deea81179bc70a795d053d14d5b7f2f01d0fd4596f', // LogTake
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x1f28edb2288fbd6b97886ea96d8066bde577a038a5aeb908400f32bc237b01ab',
      //'0xdc8a9aff20f869e63f1a71c9a40e13fc4a1284988b9988b0bdf0ccffc9a1bbbc', //'0xdfe4f91325cd74cce7d3f2d53cc0592af09ee74a58935523b404a02c1db9165f',
      userIndexed: false,
      showExchange: false,
      hideFees: true,
      hideOpponent: false,
    },
    AirSwap: {
      contract: 'AirSwap',
      minBlock: 4349701,
      tradeTopic: '0xe59c5e56d85b2124f5e7f82cb5fcc6d28a4a241a9bdd732704ac9d3b6bfc98ab', //Fill
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0xb5ddd56f449b623f1073535154356849deb8d37cf89140c9d6c07f14a04bc1a2',
      userIndexed: false,
      showExchange: false,
      hideFees: true,
      hideOpponent: false,
    },
    Kyber: {
      contract: ['Kyber', 'Kyber2Proxy'],
      minBlock: 5049196,
      tradeTopic: '0x1849bd6a030a1bca28b83437fd3de96f3d27a5d172fa7e9c78e7b61468928a39', // ExecuteTrade
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x4f76c7f8627440a0fdedd50866f17e1b6a99255479dc8dce6be800c86e8f6e54',
      userIndexed: true,
      userTopic: 1,
      showExchange: false,
      hideFees: true,
      hideOpponent: true,
    },
    Enclaves: {
      contract: 'Enclaves',
      minBlock: 5446248,
      tradeTopic: '0x7b6c917cd708d6f749ab415a0f1aa5ced6110d03141d28e5b75e216ecb4e79f7',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0x9f314254a972db7d6967d929c3e576240b2bbfb7b24ff5b38ca73f83cb49c072',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    ETHEN: {
      contract: 'Ethen',
      minBlock: 5354266,
      tradeTopic: [
        '0x165223f17116d321e4ef371cbdb122aa350ce59db46ff8f575874758c14a3ef0', // Ethen 1/2 'Order'
        '0xee7e85974085b8a74acdea8330a9e8c09680dccea6f6df360491edf22a27cc3b', // Ethen 2/2 'Trade'
      ],
      withdrawTopic: ['0xfd68f27313402be52d2f46b6d391b7b8657000a3062853a4be930f1281072a01', '0xa69fc39b702a6e8195370ae2252cc11b4445837cc4abe15ac39123f2f2d8770d'],
      depositTopic: ['0xbb01c612a93e37305a5f1f7b8ed63ea61211be444f722915b9dc827c0bdbffcc', '0x20d6bac8359f33d79581bfd2b0457cb189fda6d90fed287ddc9f2ba3eb124b67'],
      createTx: '0x9fc7d3e77c02fb00c537640114369ec5f1fbf748ac69a819c2d6dddbf08279b1',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    ETHEX: {
      contract: 'Ethex',
      minBlock: 5026534,
      tradeTopic: [
        '0x4a42a397fcad5d4d60ebf2e7cf663489e687e9c6d2d2cf518488fc78044815ba', // take sell
        '0x8de9ee05a363c847bda3ed15fc9011be60b55c7cf2e7c024c173859ed2d3760c', // take buy
      ],
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x7c50c240caa6aceb49d5d315bf959387f0d092b972185b000f1e4e77d4789d77',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    EasyTrade: {
      contract: ['EasyTrade', 'EasyTrade2'],
      minBlock: 5045834,
      tradeTopic: [
        '0x4c5de51a00fa52b3d883d5627b5d614583a2f5eec10c63c6efe8a6f1f68b11e3', // Buy (v2)
        '0x2182e4add8250752f872eda9b48eab6b84aa81f99ee69c557acfbf103828083c', // Sell (v2)
        '0xe26e8d84f7ed98fa72d63fa1c1214ede1ac33f01853fc7ecba14153893fc75f5', // FillSellOrder
        '0xa6ddcc9603775cbdbc6af5fc55608e5b392f9c04a446106e0fe78e12813640bd', // FillBuyOrder
      ],
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0x88c95f4369aba78edda75389faaa1d80c93e3a20f9b23da385ad221598151c5a',
      userIndexed: false,
      showExchange: false,
      hideFees: true,
      hideOpponent: true,
    },
    SingularX: {
      contract: 'Singularx',
      minBlock: 4504709,
      tradeTopic: '0x6effdda786735d5033bfad5f53e5131abcced9e52be6c507b62d639685fbed6d',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0x3693cdf7af88c0ccc01f32dddde09e2012afb598a0c6913cb7d730e0a04cfb3f',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    EtherC: {
      contract: 'EtherC',
      minBlock: 5474977,
      tradeTopic: '0x68381874bf7a1a19bfeecb18abbaa22f0fc7892cfec46e7dd4ea9b3688419d18',
      withdrawTopic: '0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567',
      depositTopic: '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
      createTx: '0x1d1e714a8ec7c0657e70822b8f83778779e3073c010324c9ff2271fb7e859d5c',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
    'DDEX Hydro': { // hydro 1.1 supported, 1.0 not yet (comments)
      contract: 'DDEX2', // 'DDEX',
      minBlock: 7346874, //6885289,
      tradeTopic: '0xd3ac06c3b34b93617ba2070b8b7a925029035b3f30fecd2d0fa8e5845724f310', //'0xdcc6682c66bde605a9e21caeb0cb8f1f6fbd5bbfb2250c3b8d1f43bb9b06df3f',
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0xfcd2b816509b5b352d9251ffd92f3bf4cfca4804b585c5bf6c3ac92d8aa941b4', //'0x7c25a87eb6363875110974c70d2695f4711343b4518396f07dd03429fef5fe02',
      userIndexed: false,
      showExchange: false,
      hideFees: false,
      hideOpponent: false,
    },
  },
};
},{}]},{},[]);
