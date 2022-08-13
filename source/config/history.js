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
    { m: "Jan 2019", blockFrom: 6988615, blockTo: 7156137 },
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
    { m: "Jan 2020", blockFrom: 9193266, blockTo: 9393154 },
    { m: "Feb 2020", blockFrom: 9393154, blockTo: 9581792 },
    { m: "Mar 2020", blockFrom: 9581792, blockTo: 9782602 },
    { m: "Apr 2020", blockFrom: 9782602, blockTo: 9976964 },
    { m: "May 2020", blockFrom: 9976964, blockTo: 10176690 },
    { m: "Jun 2020", blockFrom: 10176690, blockTo: 10370274 },
    { m: "Jul 2020", blockFrom: 10370274, blockTo: 10570485 },
    { m: "Aug 2020", blockFrom: 10570485, blockTo: 10771925 },
    { m: "Sep 2020", blockFrom: 10771925, blockTo: 10966874 },
    { m: "Oct 2020", blockFrom: 10966874, blockTo: 11167817 },
    { m: "Nov 2020", blockFrom: 11167817, blockTo: 11363270 },
    { m: "Dec 2020", blockFrom: 11363270, blockTo: 11565019 },
    { m: "Jan 2021", blockFrom: 11565019, blockTo: 11766939 },
    { m: "Feb 2021", blockFrom: 11766939, blockTo: 11948960 },
    { m: "Mar 2021", blockFrom: 11948960, blockTo: 12150511 },
    { m: "Apr 2021", blockFrom: 12150511, blockTo: 12344945 },
    { m: "May 2021", blockFrom: 12344945, blockTo: 12545219 },
    { m: "Jun 2021", blockFrom: 12545219, blockTo: 12738509 },
    { m: "Jul 2021", blockFrom: 12738509, blockTo: 12936340 },
    { m: "Aug 2021", blockFrom: 12936340, blockTo: 13136427 },
    { m: "Sep 2021", blockFrom: 13136427, blockTo: 13330090 },
    { m: "Oct 2021", blockFrom: 13330090, blockTo: 13527859 },
    { m: "Nov 2021", blockFrom: 13527859, blockTo: 13717847 },
    { m: "Dec 2021", blockFrom: 13717847, blockTo: 13916166 },
    { m: "Jan 2022", blockFrom: 13916166, blockTo: 14116761 },
    { m: "Feb 2022", blockFrom: 14116761, blockTo: 14297759 },
    { m: "Mar 2022", blockFrom: 14297759, blockTo: 14497034 },
    { m: "Apr 2022", blockFrom: 14497034, blockTo: 14688630 },
    { m: "May 2022", blockFrom: 14688630, blockTo: 14881677 },
    { m: "Jun 2022", blockFrom: 14881677, blockTo: 15053226 },
    { m: "Jul 2022", blockFrom: 15053226, blockTo: 15253306 },
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
      makerTransfer: false, // do maker trades give an erc20 transfer event
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
      makerTransfer: false,
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
      makerTransfer: false,
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
      makerTransfer: true,
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
        makerTransfer: true,
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
      makerTransfer: true,
    },
    '0x Protocol v3': {
      contract: '0x3',
      minBlock: 8952139,
      tradeTopic: '0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5',
      withdrawTopic: undefined,
      depositTopic: undefined,
      createTx: '0xd92b82dc8c3e0e6bdc4fccd7ad27bd5eafea00ed80034fc53a97105df135698c',
      userIndexed: false, // only if maker
      showExchange: true,
      hideFees: false,
      hideOpponent: false,
      makerTransfer: true,
    },
    OasisDex: {
      contract: ['OasisDex', 'OasisDex2','OasisDex3','OasisDex4','OasisDex5', 'OasisDexOld', 'OasisDexOld2'],
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
      makerTransfer: true,
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
      makerTransfer: false,
    },
    Kyber: {
      contract: ['Kyber', 'Kyber2Proxy'], //kyber v2-3 emit events on the proxy
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
      makerTransfer: false,
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
      makerTransfer: false,
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
      makerTransfer: false,
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
      makerTransfer: true,
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
      makerTransfer: false,
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
      makerTransfer: false,
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
      makerTransfer: false,
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
      makerTransfer: true,
    },
  },
};