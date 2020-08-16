
//use @ethersproject to create a trimmed ethers.js with only the needed modules, reduces build size
// can be replaced by the original Ethers package for compatibility;

// Temporarily includes an ethersV4 decoder in 'legacy' to get around some decoding issues in v5.

// const Ethers = require('ethers'); 
const Ethers = {
  utils: {
    getAddress: require('@ethersproject/address/lib/index.js').getAddress,
    parseBytes32String: require('@ethersproject/strings/lib/bytes32.js').parseBytes32String,
    defaultAbiCoder: require('@ethersproject/abi/lib/abi-coder.js').defaultAbiCoder,
    Fragment: require('@ethersproject/abi/lib/fragments.js').Fragment,
    id: require('@ethersproject/hash/lib/index.js').id,
  },
  Contract: require('@ethersproject/contracts/lib/index.js').Contract,
  getDefaultProvider: require('@ethersproject/providers/lib/index.js').getDefaultProvider,
  //providers: require('@ethersproject/providers/lib/index.js'),
  
  
  legacy: {
    utils: {
      defaultAbiCoder: require("ethersLegacy/utils/abi-coder.js").defaultAbiCoder
    }
  }
};


module.exports = Ethers;
