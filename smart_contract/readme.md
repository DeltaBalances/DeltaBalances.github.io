Contract `deltabalances.sol` is located in `./test`
Deployed on mainnet at [0x40a38911e470fc088beeb1a9480c2d69c847bcec](https://etherscan.io/address/0x40a38911e470fc088beeb1a9480c2d69c847bcec)

Last tested with `ganache-cli@6.9.1` and  `truffle@5.1.31`.

# Testing with Truffle

**Install**
Install the following to be able to run the tests
`npm install -g truffle` (Ethereum Development suite)
`npm install -g ganache-cli` (Virtual Ethereum node)


**Setup tests**
Before testing, start ganache (port 7545, as defined in truffle-config.js)
`ganache-cli -p 7545`

Build and deploy the virtual contracts
`truffle migrate`

**Run all tests**
`truffle test`
**Run a specific test file**
`truffle test ./test/filename.js`

