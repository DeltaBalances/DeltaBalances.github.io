module.exports = {
  // http://truffleframework.com/docs/advanced/configuration
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id,
	  gas: 6500000,
      gasPrice: 10,
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
