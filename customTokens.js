
/* 
Offline backup of unlisted tokens in etherdelta
filtered from:
https://api.ethplorer.io/getAddressInfo/0x8d12a197cb00d4747a1fe03395095ce2a5cc6819?apiKey=freekey 
30-07-2017 
*/
let offlineCustomTokens = [
  {
	"addr": "0x48c80f1f4d53d5951e5d5438b54cba84f29f32a5",
    "name": "REPOLD",
	"longname": "REP frozen contract",
	"decimals": 18,
  }, 
  {
    "addr": "0xf77089f2f00fca83501705b711cbb10a0de77628",
    "name": "BMC",
    "longname": "BTCMACROECON",
    "decimals": "8"
  },
  {
    "addr": "0x949bed886c739f1a3273629b3320db0c5024c719",
    "name": "AMIS",
    "longname": "AMIS",
    "decimals": "9"
  },
  {
    "addr": "0x45e42d659d9f9466cd5df622506033145a9b89bc",
    "name": "NxC",
    "longname": "Nexium",
    "decimals": "3"
  },
  {
    "addr": "0x8fff600f5c5f0bb03f345fd60f09a3537845de0a",
    "name": "SIM",
    "longname": "SIM",
    "decimals": 0
  },
  {
    "addr": "0xffafc4297a1337220d3c197fb497e501a509ff41",
    "name": "V",
    "longname": "Veritas",
    "decimals": "2"
  },
  {
    "addr": "0x059d4329078dca62c521779c0ce98eb9329349e6",
    "name": "TIG",
    "longname": "SAVEtheTIGERS",
    "decimals": "18"
  },
  {
    "addr": "0x584aa8297edfcb7d8853a426bb0f5252c4af9437",
    "name": "R$",
    "longname": "RARE",
    "decimals": "8"
  },
  {
    "addr": "0xcced5b8288086be8c38e23567e684c3740be4d48",
    "name": "RLT",
    "longname": "Roulette Token",
    "decimals": "10"
  },
  {
    "addr": "0x270fb3bd1ad2678476d556b39053a5d148b91b69",
    "name": "ZTH",
    "longname": "ZETH",
    "decimals": "2"
  },
  {
    "addr": "0x22a3b451d60a72388a37c97bc517e44ad76a50f7",
    "name": "XBTY",
    "longname": "Bounty",
    "decimals": "18"
  },
  {
    "addr": "0xba54621876dfca50d15705201a5c3b12949b2a79",
    "name": "URHOC",
    "longname": "URHOC",
    "decimals": "8"
  },
  {
    "addr": "0x32906f1a620d283d9e5ac1081d448d6a92c9b967",
    "name": "GPS",
    "longname": "Gaps",
    "decimals": "4"
  },
  {
    "addr": "0x0cd93baa52272e11b63aca243e671990daa76234",
    "name": "KISS",
    "longname": "Kisses",
    "decimals": "1"
  },
  {
    "addr": "0x96e5f704b57e52a1c332bbf19775bbb4f297ffac",
    "name": "PEP",
    "longname": "PEPERIUM",
    "decimals": "8"
  },
  {
    "addr": "0x95907077585b09068a0d8d1185aab872ec1836c0",
    "name": "TWR",
    "longname": "TAOWARARE",
    "decimals": "8"
  },
  {
    "addr": "0xbc209b23c427dc548ef261d4a3e5c4bb1490aab5",
    "name": "RPBAN",
    "longname": "RPBANHAMMER",
    "decimals": "8"
  },

  {
    "addr": "0x108c05cac356d93b351375434101cfd3e14f7e44",
    "name": "BEN",
    "longname": "Token of Szczepan Bentyn",
    "decimals": "4"
  },
  {
    "addr": "0x891d10976d86c5b5a351051acb9ccd689ae13da7",
    "name": "GIVE",
    "longname": "Altruism",
    "decimals": "4"
  },
  {
    "addr": "0xfb18b6f4484bcbe7ae0f8a06e1e3985a71614a3e",
    "name": "USD",
    "longname": "Universal Secure D0llar",
    "decimals": 0
  },
  {
    "addr": "0x4ffc3a02783e419dbc2ab71b953ede1d72350937",
    "name": "BILLY",
    "longname": "Billy Coin",
    "decimals": "4"
  },
  {
    "addr": "0x23f91a54af690e9d2b20c043827ba66648826c28",
    "name": "1000",
    "longname": "One Thousand Coin",
    "decimals": "8"
  },
  {
    "addr": "0xa54ddc7b3cce7fc8b1e3fa0256d0db80d2c10970",
    "name": "NDC",
    "longname": "NEVERDIE",
    "decimals": "18"
  },
  {
    "addr": "0x5ddab66da218fb05dfeda07f1afc4ea0738ee234",
    "name": "RARE",
    "longname": "RARE",
    "decimals": "8"
  },
  {
    "addr": "0x45af37792fac5613cdc84dfc39265f1a8d70b97b",
    "name": "GRS",
    "longname": "Lukasz Grass Token",
    "decimals": "4"
  },
  {
    "addr": "0x51690bb0f11298824903d7f1bf8416a0b23baaa5",
    "name": "DasCoin",
    "longname": "DasCoin NetLeaders",
    "decimals": "4"
  },
  {
    "addr": "0xf4e6e25a02acdf21ce7d8e7c2345ed7c2159cba2",
    "name": "MIR",
    "longname": "MirkoCoin",
    "decimals": "4"
  },
  {
    "addr": "0xb63b606ac810a52cca15e44bb630fd42d8d1d83d",
    "name": "MCO",
    "longname": "Monaco",
    "decimals": "8"
  },
  {
    "addr": "0x08d32b0da63e2c3bcf8019c9c5d849d7a9d791e6",
    "name": "٨",
    "longname": "Dentacoin",
    "decimals": 0
  },
  {
    "addr": "0x7d0d8b80e304bc7d5afda8d91e431dd2523ee439",
    "name": "GUCP",
    "longname": "GOLD UNION COIN PLUS",
    "decimals": "2"
  },
  {
    "addr": "0xb228668bc6f79be14f42e5985c1853307550fd27",
    "name": "SHET",
    "longname": "Excreteum",
    "decimals": "8"
  },
  {
    "addr": "0x91bc206f0a1ffbc399b4a20a41324ed1dad2b718",
    "name": "BSH",
    "longname": "Bullshit",
    "decimals": 18
  },
  {
    "addr": "0x8fb97dc96558199ffb549a35a231b97a19fdc912",
    "name": "AHT",
    "longname": "Ahoolee Token",
    "decimals": "18"
  },
  {
    "addr": "0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098",
    "name": "SAN",
    "longname": "SANtiment network token",
    "decimals": "18"
  },
  {
    "addr": "0xa4382a945d116f3511728ce2fa79af77d90a353e",
    "name": "GOY",
    "longname": "JewCoin",
    "decimals": "18"
  },
  {
    "addr": "0x805cefaf11df46d609fa34a7723d289b180fe4fa",
    "name": "NTRY",
    "longname": "Notary Platform Token",
    "decimals": "18"
  },
  {
    "addr": "0xa0fff7cf3507ff6d019caaac6a7b7ed9e69ad536",
    "name": "ROBBERY",
    "longname": "You giving me your money.",
    "decimals": "18"
  },
  {
    "addr": "0x0c04d4f331da8df75f9e2e271e3f3f1494c66c36",
    "name": "PRSP",
    "longname": "Prosper",
    "decimals": "9"
  },
  {
    "addr": "0x65391a542942510b10c1689d874b62620de28d3e",
    "name": "LAMBO",
    "longname": "Lambo Token",
    "decimals": "18"
  },
  {
    "addr": "0x5af2be193a6abca9c8817001f45744777db30756",
    "name": "BQX",
    "longname": "Bitquence",
    "decimals": "8"
  },
  {
    "addr": "0x2fe6ab85ebbf7776fee46d191ee4cea322cecf51",
    "name": "CDT",
    "longname": "CoinDash Token",
    "decimals": "18"
  },
  {
    "addr": "0x9e77d5a1251b6f7d456722a6eac6d2d5980bd891",
    "name": "BRAT",
    "longname": "BRAT RED",
    "decimals": "8"
  },
  {
    "addr": "0x2bf17cf1215cc5fb16c3c0e2ed49603eead1664e",
    "name": "WILK",
    "longname": "WilkCoin",
    "decimals": "8"
  },
  {
    "addr": "0xe463d10ec6b4ff6a3e5be41144956116ca30d4c3",
    "name": "7YPE",
    "longname": "7ype Coins",
    "decimals": 0
  },
  {
    "addr": "0x38a8b3d64212e01d285b78ea99dfb5b477e58cec",
    "name": "KBC",
    "longname": "KabutoCoin",
    "decimals": "8"
  },
  {
    "addr": "0x39957a6624cabde2114c36e6dd8cf4930236a3da",
    "name": "300",
    "longname": "300 Token",
    "decimals": "18"
  },
  {
    "addr": "0x226bb599a12c826476e3a771454697ea52e9e220",
    "name": "PRO",
    "longname": "Propy",
    "decimals": "8"
  },
  {
    "addr": "0x9329020b260a7e09a6271e0b719a2fe4bd96fa03",
    "name": "Venus",
    "longname": "VenusCoin",
    "decimals": 0
  },
  {
    "addr": "0xbb9bc244d798123fde783fcc1c72d3bb8c189413",
    "name": "DAO",
    "longname": "The DAO",
    "decimals": 16
  },
  {
    "addr": "0x77ace05b1a35dacf2536f7a4ca340bae268b7020",
    "name": "CDT",
    "longname": "CoinDash Token",
    "decimals": "18"
  },
  {
    "addr": "0x9ded5aa16b119095728770b37985a8b887a7a6fd",
    "name": "SPG",
    "longname": "Szpregel",
    "decimals": "3"
  },
  {
    "addr": "0xecf8f87f810ecf450940c9f60066b4a7a501d6a7",
    "name": "WETH",
    "longname": "Wrapped ETH",
    "decimals": 18
  },
  {
    "addr": "0xc2e8595bf77533e5e9c16d30fa6379f5bbc9ed96",
    "name": "HotelShares",
    "longname": "IPOcoinHotelShares",
    "decimals": "6"
  },
  {
    "addr": "0xf4616ecab980a817791008cb88e516e0a156296f",
    "name": "MIX",
    "longname": "MixenCoin",
    "decimals": "5"
  },
  {
    "addr": "0xb6cf43b24c69b37536181ce2bc0797df3afa0ac1",
    "name": "IDX",
    "longname": " Indexer",
    "decimals": "2"
  },
  {
    "addr": "0x177d39ac676ed1c67a2b268ad7f1e58826e5b0af",
    "name": "CDT",
    "longname": "CoinDash Token",
    "decimals": "18"
  },
  {
    "addr": "0x5afda18caba69fe3af5e6d56e42e1c9f92c40d77",
    "name": "MCD",
    "longname": "MealCoinDinnerful",
    "decimals": "18"
  },
  {
    "addr": "0xbc7de10afe530843e71dfb2e3872405191e8d14a",
    "name": "SHOUC",
    "longname": "SHOUCAIR",
    "decimals": "18"
  },
  {
    "addr": "0x1e4f36321a79ba92765930cc9c59586d2330fcf6",
    "name": "DSKT",
    "longname": "Dashiky Token",
    "decimals": "2"
  },
  {
    "addr": "0xd6a81d7a8b4d1cc947138d9e4aca5d3cde33a170",
    "name": "CREDOICO",
    "longname": "Credo ICO Token",
    "decimals": "18"
  },
  {
    "addr": "0x4a0703d1d250ceff2912c78844f35cd7e764c577",
    "name": "SQ1",
    "longname": "SmartQuotes",
    "decimals": 0
  },
  {
    "addr": "0x4e0603e2a27a30480e5e3a4fe548e29ef12f64be",
    "name": "CREDO",
    "longname": "Credo Token",
    "decimals": "18"
  },
  {
    "addr": "0xb0555906a304c5670be1c20be3d7f326df751234",
    "name": "DADY",
    "longname": "Dashiky Day Token",
    "decimals": 0
  },
  {
    "addr": "0x920f2ac67f973a7670674682ba5bb9061dbf18d9",
    "name": "DSTR",
    "longname": "DSTR Community",
    "decimals": "2"
  },
  {
    "addr": "0x3ba02d651116dfedfb996700fee13137305714b4",
    "name": "eDOGE",
    "longname": "EtherDOGE",
    "decimals": "4"
  },
  {
    "addr": "0x1b0742ee324c7474bec70ae2ca2d172c3a3ae11e",
    "name": "RARE",
    "longname": "RareCoin",
    "decimals": "18"
  },
  {
    "addr": "0xd1570eaedd6bb902ced7f7f1b394c16daea38454",
    "name": "RARE2",
    "longname": "RareCoin2",
    "decimals": "18"
  },
  {
    "addr": "0xa0fcbe081090e586b09907f225c105d435e196a5",
    "name": "VAPE",
    "longname": "VAPEbits",
    "decimals": "18"
  },
  {
    "addr": "0x5dbd040b40168a351178f7dfae57f41418262bc5",
    "name": "FUT",
    "longname": "FUTURO",
    "decimals": "4"
  },
  {
    "addr": "0xac3da587eac229c9896d919abc235ca4fd7f72c1",
    "name": "TGT",
    "longname": "Target Coin",
    "decimals": "1"
  }
];