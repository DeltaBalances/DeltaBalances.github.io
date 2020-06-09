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
    '0xForwarder2': { addr: '0x5468a1dc173652ee28d249c271fa9933144746b1', name: '0x Instant', supportedDex: true },
    '0xForwarder3': { addr: '0x76481caa104b5f6bccb540dae4cefaf1c398ebea', name: '0x Instant', supportedDex: true },
    '0xForwarder4': { addr: '0xdc4587cb17d2a1829512e2cfec621f8066290e6a', name: '0x Instant', supportedDex: true },
    //0x v2.1 bugfix release
    '0x2.1': { addr: '0x080bf510fcbf18b91105470639e9561022937712', name: '0x Exchange 2.1', supportedDex: true },
    '0xProxy4': { addr: '0x95e6f48254609a6ee006f7d493c8e5fb97094cef', name: '0x ERC20 Proxy', supportedDex: true },
    '0xProxy5': { addr: '0xefc70a1b18c432bdc64b596838b4d138f6bc6cad', name: '0x ERC721 Proxy', supportedDex: false },
    '0xProxy6': { addr: '0xef701d5389ae74503d633396c4d654eabedc9d78', name: '0x MAP Proxy', supportedDex: false },
    //0x protocol v3
    '0x3Test': { addr: '0xb27f1db0a7e473304a5a06e54bdf035f671400c0', name: '0x v3 test', supportedDex: true },
    '0x3': { addr: '0x61935cbdd02287b511119ddb11aeb42f1593b7ef', name: '0x Exchange 3', supportedDex: true },
    '0xForwarder5': { addr: '0xa3ac9844514b96bb502627ca9dceb57c4be289e3', name: '0x Instant', supportedDex: true },
    '0xForwarder6': { addr: '0x5ff2c495055d4f6284f317a9c2edb7045497b14f', name: '0x Instant', supportedDex: true },
    '0xCoordinator': { addr: '0x38a795580d0f687e399913a00ddef6a17612c722', name: '0x Coordinator', supportedDex: true },

    DDEX: { addr: '0x2cb4b49c0d6e9db2164d94ce48853bf77c4d883e', name: 'DDEX Hydro 1.0', supportedDex: true },
    DDEX2: { addr: '0xe2a0bfe759e2a4444442da5064ec549616fff101', name: 'DDEX Hydro 1.1', supportedDex: true },
    DDEXproxy: { addr: '0x74622073a4821dbfd046e9aa2ccf691341a076e1', name: 'DDEX Hydro', supportedDex: false },

    'OpenSea': { addr:'0x7be8076f4ea4a4ad08075c2508e481d6c946d12b', name: 'OpenSea', supportedDex: false },

    // ethfinex v1, 0x v1 clone
    Ethfinex: { addr: '0xdcdb42c9a256690bd153a7b409751adfc8dd5851', name: 'Ethfinex', supportedDex: true },
    EthfinexProxy: { addr: '0x7e03d2b8edc3585ecd8a5807661fff0830a0b603', name: 'Ethfinex Proxy', supportedDex: true },
    EthfinexOtc: { addr: '0xbaea5bc6568dcb1f1c5aa24223a47333a6b3a8f5', name: 'Ethfinex OTC', supportedDex: false },
    EthfinexOtc2: { addr: '0x93dc6a333a99c0ede1cd346ccf079ea8451013db', name: 'Ethfinex OTC', supportedDex: false },
    EthfinexOtc3: { addr: '0xd924bdd6fa7fd3d0eb1337853a814a4263dcbfe8', name: 'DiversiFi OTC', supportedDex: false }, 

    OasisDex: { addr: '0x14fbca95be7e99c15cc2996c6c9d841e54b79425', name: 'OasisDex', supportedDex: true },
    OasisDex2: { addr: '0xb7ac09c2c0217b07d7c103029b4918a2c401eecb', name: 'OasisDex', supportedDex: true },
    OasisDex3: { addr: '0x39755357759ce0d7f32dc8dc45414cca409ae24e', name: 'Oasis (Eth2Dai)', supportedDex: true },
    OasisDex4: { addr: '0x794e6e91555438afc3ccf1c5076a74f42133d08d', name: 'OasisDex', supportedDex: true },
    OasisDexOld: { addr: '0x3aa927a97594c3ab7d7bf0d47c71c3877d1de4a1', name: 'OasisDex (OLD)', supportedDex: true },
    OasisDexOld2: { addr: '0x83ce340889c15a3b4d38cfcd1fc93e5d8497691f', name: 'OasisDex (OLD2)', supportedDex: true },
    OasisDexOld3: { addr: '0xa1b5eedc73a978d181d1ea322ba20f0474bb2a25', name: 'OasisDex (OLD3)', supportedDex: false },
    // oasis fork? 0x42a438d94a869051bbab67bd42e2e02351d92815

    //Oasisdirect proxy creator
    OasisDirect: { addr: '0x793ebbe21607e4f04788f89c7a9b97320773ec59', name: 'OasisDirect', supportedDex: true },
    //0x279594b6843014376a422ebb26a6eab7a30e36f0 Oasisdirect only 2 txs

    AirSwap: { addr: '0x8fd3121013a07c57f0d69646e86e7a4880b467b7', name: 'AirSwap', supportedDex: true },
    AirSwapTrader : { addr: '0x9af9c0cf3cd15e0afe63930fbf20941c89f3ff98', name: 'AirSwap OTC', supportedDex: false},
    AirSwap2: { addr: '0x54d2690e97e477a4b33f40d6e4afdd4832c07c57', name: 'AirSwap', supportedDex: false },
    AirSwap3: { addr: '0x4572f2554421bd64bef1c22c8a81840e8d496bea', name: 'AirSwap', supportedDex: false },
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
    Kyber3: { addr: '0x65bf64ff5f51272f729bdcd7acfb00677ced86cd', name: 'Kyber Network', supportedDex: true },

    BancorX: { addr: '0xda96eb2fa67642c171650c428f93abdfb8a63a2d', name: 'BancorX', supportedDex: true },
    UniswapFactory: { addr: '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95', name: 'Uniswap Factor', supportedDex: false },
    /* 
    Uniswap & Bancor (convertor, quickconvertor) 
    These use too many unique contracts to list here.
    They are detected by function input and emitted events 
    */
    


    Enclaves: { addr: '0xbf45f4280cfbe7c2d2515a7d984b8c71c15e82b7', name: 'EnclavesDex', supportedDex: true },
    Enclaves2: { addr: '0xed06d46ffb309128c4458a270c99c824dc127f5d', name: 'EnclavesDex', supportedDex: false },
    // enclaves copy 0x8fb1a19844a76c2ddac7eed8ddec8a55f2e75f7c
    Ethen: { addr: '0xf4c27b8b002389864ac214cb13bfeef4cc5c4e8d', name: 'ETHEN', supportedDex: true },
    Ethex: { addr: '0xb746aed479f18287dc8fc202fe06f25f1a0a60ae', name: 'ETHEX', supportedDex: true },
    Singularx: { addr: '0x9a2d163ab40f88c625fd475e807bbc3556566f80', name: 'SingularX', supportedDex: true },
    EtherC: { addr: '0xd8d48e52f39ab2d169c8b562c53589e6c71ac4d3', name: 'EtherC', supportedDex: true },

    /* exchange aggregators */
    EasyTrade: { addr: '0x9ae4ed3bf7a3a529afbc126b4541c0d636d455f6', name: 'EasyTrade', supportedDex: true },
    EasyTrade2: { addr: '0x0c577fbf29f8797d9d29a33de59001b872a1d4dc', name: 'EasyTrade', supportedDex: true },
    //tokenstore instant
    InstantTrade: { addr: '0xe17dbb844ba602e189889d941d1297184ce63664', name: 'TS InstantTrade', supportedDex: true },
    InstantTrade2: { addr: '0xdc36cbe88efd1b4ef5cdcdbe74f0b28cd1e23d12', name: 'TS InstantTrade', supportedDex: true }, 
    InstantTrade3: { addr: '0xbad7653bc486c44fbeafa23fded6b3f3112d321c', name: 'TS InstantTrade', supportedDex: true },


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
    Totle6: { addr: '0x77208a6000691e440026bed1b178ef4661d37426', name: 'Totle', supportedDex: false },
    ParaSwap3: { addr: '0xf92c1ad75005e6436b4ee84e88cb23ed8a290988', name: 'ParaSwap v3', supportedDex: false },
    DexAG: { addr: '0xd3bed3a8e3e6b24b740ead108ba776e0ad298588', name: 'DEX.AG v1', supportedDex: false },
    DexAG2: { addr: '0x932348df588923ba3f1fd50593b22c4e2a287919', name: 'DEX.AG v2', supportedDex: false },
    DexAG3: { addr: '0xa540fb50288cc31639305b1675c70763c334953b', name: 'DEX.AG v3', supportedDex: false },
    DexAGProxy: { addr: '0x745daa146934b27e3f0b6bff1a6e36b9b90fb131', name: 'DEX.AG', supportedDex: false },
    Oneinch: { addr: '0x11111254369792b2Ca5d084aB5eEA397cA8fa48B', name: '1inch', supportedDex: false },
    Oneinch2: { addr: '0x111111254b08ceeee8ad6ca827de9952d2a46781', name: '1inch', supportedDex: false },
    
    //onesplit aggregated swap
    OneSplit1: { addr: '0x111112549cfedf7822eb11fbd8fd485d8a10f93f', name: '1Split', supportedDex: false },
    OneSplit2: { addr: '0x0000000f8ef4be2b7aed6724e893c1b674b9682d', name: '1Split', supportedDex: false },
    OneSplit3: { addr: '0x000005edbbc1f258302add96b5e20d3442e5dd89', name: '1Split', supportedDex: false },
    OneSplit4: { addr: '0x083fc10ce7e97cafbae0fe332a9c4384c5f54e45', name: '1Split', supportedDex: false },
    OneSplit5: { addr: '0x0000000006adbd7c01bc0738cdbfc3932600ad63', name: '1Split', supportedDex: false },
    OneSplit6: { addr: '0xe4c577bdec9ce0f6c54f2f82aed5b1913b71ae2f', name: '1Split', supportedDex: false },
    //1split unknown
   /* 0x00000000016697fa9a9c8e2889e28d3d9816a078
    0x52dd74d511753b464867d831f78dfcbf05d255d7
    0xee6f35e91bc558a2bd360eff094026e017327a16
    0xe00b75a94b444de64b308aa3d7a08b99d1ea1fb4
    0xb2137a03446065c412888fd8c24358f65e96bce7*/


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
    SeedDex3: { addr: '0xcf25ebd54120cf2e4137fab0a91a7f7403a5debf', name: 'SeedDex', supportedDex: true },
    SwitchDex: { addr: '0xc3c12a9e63e466a3ba99e07f3ef1f38b8b81ae1b', name: 'SwitchDex', supportedDex: true },
    GiantDex: { addr: '0x7e21c13cac00528f5217f8c0c06706a91afe4a48', name: 'GiantDex', supportedDex: true },
    EtheRoox: { addr: '0xbca13cbebff557143e8ad089192380e9c9a58c70', name: 'EtheRoox', supportedDex: true },
    FakeED: { addr: '0x60394f71266901a5930bb4e90db5dd26b77f8dad', name: 'Fake EtherDelta', supportedDex: true },
    Marketplace: { addr: '0x2f13fa06c0efd2a5c4cf2175a0467084672e648b', name: 'Marketplace', supportedDex: true },
    Bloxxor: { addr: '0xb92c5f4f3a13bb14467fe0c25a4c569aa20e1df8', name: 'Bloxxor', supportedDex: true },
    Bitcratic1: { addr: '0x232ba9f3b3643ab28d28ed7ee18600708d60e5fe', name: 'Bitcratic (old)', supportedDex: true },
    Bitcratic2: { addr: '0x3c020e014069df790d4f4e63fd297ba4e1c8e51f', name: 'Bitcratic', supportedDex: true },
    Swatx: { addr: '0x513c07e83237124e08672be4c8d481246d6f03f2', name: 'SWATX', supportedDex: true },
    Swatx2: { addr: '0xa674dce2a28251af521656219cb7ce71d0846642', name: 'SWATX', supportedDex: true },
    CryptloDex: { addr: '0xcf5d889e2336d0f35f6121718f6c25e0650d4b25', name: 'CryptloDex', supportedDex: true},
    UnknownED: { addr: '0x4d55f76ce2dbbae7b48661bef9bd144ce0c9091b', name: 'Unknown', supportedDex: true },
    Afrodex: { addr: '0xe8fff15bb5e14095bfdfa8bb85d83cc900c23c56', name: 'Afrodex', supportedDex: true },
    EDex: { addr: '0x4fbcfa90ac5a1f7f70b7ecc6dc1589bbe6904b02', name: 'EDex', supportedDex: true },
    EDex2: { addr: '0x301487766dcf283592b11b5988e5c4e4630dfbe5', name: 'EDex', supportedDex: true },
    AlgoDEX: { addr: '0x4bc78f6619991b029b867b6d88d39c196332aba3', name: 'AlgoDEX', supportedDex: true }, 
    Decentrex2: { addr: '0x5e9a063dbc650944bdc824bd1c3b3196a5f1f582', name: 'Decentrex?', supportedDex: true }, 
    GaintDex: { addr: '0x0d5eae179709e92b3bff65731158e8291c49eafb', name: 'GaintDex', supportedDex: true }, 
    TokenLab: { addr: '0xb078c6c920bd68d3cdc9ab9e544b5bf0f45ead4e', name: 'TokenLab', supportedDex: true }, 
    BeanDex: { addr: '0xfa1c8488517e678cf87635371da135279b8e3501', name: 'BeanDex', supportedDex: true }, 
    Cryptex: { addr: '0x98ca85c59dee34dbc26667eac04f13e39f5f765a', name: 'Cryptex', supportedDex: true }, 
    Pex: { addr: '0xcc152ba543a3942a07e488a29702ca1cb40ea7e6', name: 'PEX', supportedDex: false }, 
    // ed clone 0x3115b83af820875cc1128f987eda32150f056d71


    /* exchanges with no parsing support yet */
    R1: { addr: '0x7b45a572ea991887a01fd919c05edf1cac79c311', name: 'R1 Protocol', supportedDex: false }, //bithumb R1 protocol?
    // old R1? 0xE18898c76a39ba4Cd46a544b87ebe1166fbe7052
    BithumbDex: { addr: '0xc7c9b856d33651cc2bcd9e0099efa85f59f78302', name: 'BithumbDex', supportedDex: false },     //bithumb dex R1
    Martle: { addr: '0x551d56781e0cd16ac2c61a03e6537844a41c7709', name: 'Martle instant', supportedDex: false },
    Switcheo: { addr: '0xba3ed686cc32ffa8664628b1e96d8022e40543de', name: 'Switcheo', supportedDex: true }, //partial
    Switcheo2: { addr: '0x7ee7ca6e75de79e618e88bdf80d0b1db136b22d0', name: 'Switcheo v2', supportedDex: false },
    DutchX: { addr: '0x039fb002d21c1c5eeb400612aef3d64d49eb0d94', name: 'DutchX', supportedDex: false },
    DutchXProxy: { addr: '0xaf1745c0f8117384dfa5fff40f824057c70f2ed3', name: 'DutchX', supportedDex: false },
    Ethermium: { addr: '0xa5cc679a3528956e8032df4f03756c077c1ee3f4', name: 'Ethermium', supportedDex: false },
    Wedex: { addr: '0x7d3d221a8d8abdd868e8e88811ffaf033e68e108', name: 'WEDEX beta1', supportedDex: false },
    Wedex2: { addr: '0xd97d09f3bd931a14382ac60f156c1285a56bb51b', name: 'WEDEX beta2', supportedDex: false },
    Tokenlon: { addr: '0xdc6c91b569c98f9f6f74d90f9beff99fdaf4248b', name: 'Tokenlon', supportedDex: false },
    Miime: { addr: '0x7a6425c9b3f5521bfa5d71df710a2fb80508319b', name: 'Miime', supportedDex: false },
    DdexMargin: { addr: '0x241e82c79452f51fbfc89fac6d912e021db1a3b7', name: 'DDEX Margin', supportedDex: false },
    DefiSaver: { addr: '0x865b41584a22f8345fca4b71c42a1e7abcd67ecb', name: 'DefiSaver MCD', supportedDex: false },
    SportCrypt: { addr: '0x37304b0ab297f13f5520c523102797121182fb5b', name: 'SportCrypt', supportedDex: false },

    /* small exchanges, no input/event parsing yet */
    Eidoo3: { addr: '0x560d5afc42ad137dece2277fd75001c165cb9a22', name: 'Eidoo v3', supportedDex: false },
    Eidoo2: { addr: '0x560d5afc42ad137dece2277fd75001c165cb9a22', name: 'Eidoo v2', supportedDex: false },
    Eidoo1: { addr: '0xdf72b12a5f7f5a02e9949c475a8d90694d10f198', name: 'Eidoo v1', supportedDex: false },
    Dexy: { addr: '0x54b0de285c15d27b0daa687bcbf40cea68b2807f', name: 'Dexy', supportedDex: false },
    Dexy2: { addr: '0x9d160e257f1dff52ec81d5a4e7326dd82e144177', name: 'Dexy', supportedDex: false },
    Dubiex: { addr: '0x7c21d723af0f4594d4f8821aa16bc27c8ea6cec7', name: 'DUBIex', supportedDex: false },
    Radex: { addr: '0x9462eeb9124c99731cc7617348b3937a8f00b11f', name: 'Radex', supportedDex: false },
    Joyso: { addr: '0x04f062809b244e37e7fdc21d9409469c989c2342', name: 'Joyso', supportedDex: false },
    DexTop1:  { addr: '0xdd7283ea985a030c66e85ed63e9dde4f5eab56d5', name: 'DEx.top v1', supportedDex: false },
    DexTop2: { addr: '0x7600977eb9effa627d6bd0da2e5be35e11566341', name: 'DEx.top v2', supportedDex: false },
    BitEye: { addr: '0x39fbd1140cd1fc298f00c3ea64b3591de94c67e7', name: 'BitEye', supportedDex: false },
    BitEye2: { addr: '0x9e2f2dd1e3641f389673f89dc316bb00b01cd83a', name: 'BitEye', supportedDex: false },
    AXNET: { addr: '0xacf999bfa9347e8ebe6816ed30bf44b127233177', name: 'AXNET', supportedDex: false },
    WeiDex: { addr: '0xccd7ce9ec004bfbd5711245f917d6109813a909c', name: 'WeiDex', supportedDex: false },
    DexBlue: { addr: '0x257586004f6828a01ba4a874d3cfd0757029f32a', name: 'dex.blue (old)', supportedDex: false },
    DexBlue2: { addr: '0x000000000000541e251335090ac5b47176af4f7e', name: 'dex.blue', supportedDex: true },
    AllBit: { addr: '0xdc1882f350b42ac9a23508996254b1915c78b204', name: 'AllBit', supportedDex: false },
    AllBit2: { addr: '0xff6b1cdfd2d3e37977d7938aa06b6d89d6675e27', name: 'AllBit', supportedDex: false },
    Saturn: { addr: '0x13f64609bf1ef46f6515f8cd3115433a93a00dc6', name: 'Saturn Network', supportedDex: false },
    Saturn2: { addr: '0x1f0d1de1558582ad6f13763f477119a1455502af', name: 'Saturn Network', supportedDex: false },
    Saturn3: { addr: '0xaa5bbd5a177a588b9f213505ca3740b444dbd586', name: 'Saturn Network', supportedDex: false },
    Loopring: { addr: '0x8d8812b72d1e4ffcec158d25f56748b7d67c1e78', name: 'LoopRing v1', supportedDex: false },
    Loopring3: { addr: '0xc2d1e8fb0c10810bb888231e7b85118042846105', name: 'LoopRing v3', supportedDex: false },
    Loopring4: { addr: '0x944644ea989ec64c2ab9ef341d383cef586a5777', name: 'LoopRing', supportedDex: false },
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
    Dinngo2: { addr: '0x268be5667d4e5bd036bd608d0601ef1441604429', name: 'Dinngo', supportedDex: false },
    DappDex: { addr: '0xec3d7968b0d3fff0a074668e08eb56c5e6d38b21', name: 'DappDex', supportedDex: false },
    MCDEX: { addr: '0xfe3a6567a25d74b3a7f10ed49631502806ed1a17', name: 'MCDEX', supportedDex: false },
    Coinected: { addr: '0xdf00412a54951e0ff42267427c3f17fa792a14a0', name: 'Coinected', supportedDex: false },
    McAfeeSwap: { addr: '0x47653de428ff814cc2b78e7a4b569c1aec4add7c', name: 'McAffeeSwap', supportedDex: false },
    DMEX1: { addr: '0x0c74f22130c985fa02e7105d6095fb782e9eb08c', name: 'DMEX', supportedDex: false },
    DMEX2: { addr: '0x33d6461a9dba4c234fc01bc4a2df59bf26720e66', name: 'DMEX', supportedDex: false },
    Atomex: { addr: '0xe9c251cbb4881f9e056e40135e7d3ea9a7d037df', name: 'Atomex', supportedDex: false },
    ERCOTC: { addr: '0x2b3a44a25e62943f5bc2b44b27e6d7734dd14427', name: 'ERCOTC', supportedDex: false },
    DEXIO: { addr: '0xababb61a9f837aad53ed4320221737fc6e9dc84b', name: 'Dex.io', supportedDex: false },
    Uniswapex: { addr: '0xbd2a43799b83d9d0ff56b85d4c140bce3d1d1c6c', name: 'UniswapEx', supportedDex: false },
    ParaSwap1: { addr: '0x6b158039b9678b7452f311deb12dd08c579dad26', name: 'ParaSwap v1', supportedDex: false },
    ParaSwap2: { addr: '0x72338b82800400f5488eca2b5a37270ba3b7a111', name: 'ParaSwap v2', supportedDex: false },
    Kulap1: { addr: '0xcee7eea7e58434997a59049f7da4d0ad46f1f141', name: 'KulapDex', supportedDex: false },
    Kulap2: { addr: '0x3f7a7fe9b5304042d179deadf2521ea12d97a5c7', name: 'KulapDex', supportedDex: false },
    TrexDex: { addr: '0x2fca5f257895b8bcede0c0d06141b718ec9a3041', name: 'TrexDex', supportedDex: false },
    Tokedo: { addr: '0xc3dc5b72cba5922b95ebc81606b2581e577feca0', name: 'Tokedo', supportedDex: false },

    Counter: { addr: '0xc0deee11aa091189fff0713353c43c7c8cae7881', name: 'Counter', supportedDex: false },
    Counter2: { addr: '0x1234567896326230a28ee368825d11fe6571be4a', name: 'Counter', supportedDex: false },
    Counter3: { addr: '0x12345678979f29ebc99e00bdc5693ddea564ca80', name: 'Counter', supportedDex: false },

    /*curvefi swap 0xe5FdBab9Ad428bBB469Dee4CB6608C0a8895CbA5 token 0xdbe281e17540da5305eb2aefb8cef70e6db1a0a9
    swap 0x2e60cf74d81ac34eb21eeff58db4d385920ef419 token 0x3740fb63ab7a09891d7c0d4299442A551D06F5fD
    abi https://github.com/curvefi/curve-contract/blob/compounded-0.2.2/deployed/2020-01-03_mainnet/swap.abi
    */

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
    Bilink2: { addr: '0xaea870ca4ad2ee820050124a7580e78176d9c806', name: 'Bilink', supportedDex: false }, //loan
    Bilink3: { addr: '0x4acbad9064c1a248ff73b1855613c16d9f5894b4', name: 'Bilink', supportedDex: false }, // exchange, trades
    Bilink4: { addr: '0x611ce695290729805e138c9c14dbddf132e76de3', name: 'Bilink', supportedDex: false }, // data
    Bilink5: { addr: '0xc75fa06f6002b458468d9e484d13bf522030d4ae', name: 'Bilink', supportedDex: false }, // balance


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