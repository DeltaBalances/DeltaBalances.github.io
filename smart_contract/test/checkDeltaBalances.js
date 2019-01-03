var DeltaBalances = artifacts.require("DeltaBalances");

var Token1 = artifacts.require("ERC20");            // regular ERC20
var Token2 = artifacts.require("BadERC20");         // erc20 with revert inside balanceOf() and allowance()
var Token3 = artifacts.require("AltERC20");         // erc20 that implements balanceOf/allowance as public mapping
var Token4 = artifacts.require("KillERC20");        // erc20 that can be selfdestructed
var Token5 = artifacts.require("IncompleteERC20");  // erc20 that doesn't implement balanceOf() and allowance()
var Token6 = artifacts.require("TokenBBBasic");

var Exchange = artifacts.require('DummyExchange');

// test whether DeltaBalances.sol can get the token balances and deposited balances correctly
// should not throw errors on bad/invalid/selfdestructed ERC20 contracts
contract("DeltaBalances Balances", function (accounts) {

    const ether = "0x0000000000000000000000000000000000000000";
    let deltaBalances;
    let exchange;

    let tokens = [];
    let brokenToken;
    let altToken;
    let killToken;
    let incompleteToken;
    let weirdToken;

    let deployer = accounts[0];


    const initTokenAmount = 1000000000000;

    before(async function () {
        deltaBalances = await DeltaBalances.deployed();

        // deploy a dummy exchange and some tokens
        exchange = await Exchange.new({ from: deployer });
        tokens[0] = await Token1.new(initTokenAmount, "Token1", 18, "T1", { from: deployer });
        tokens[1] = await Token1.new(initTokenAmount, "Token2", 0, "T2", { from: deployer });
        tokens[2] = await Token1.new(initTokenAmount, "Token3", 6, "T3", { from: deployer });

        // erc20 contract that reverts on balanceOf
        brokenToken = await Token2.new(initTokenAmount, "Broken", 18, "B", { from: deployer });
        // erc20 contract that has a balanceOf mapping instead of function
        altToken = await Token3.new(initTokenAmount, "Alt", 18, "A", { from: deployer });
        // erc20 contract that can be selfdestructed
        killToken = await Token4.new(initTokenAmount, "Kill", 18, "K", { from: deployer });
        await killToken.kill();
        //erc20 contract that doesn't implement balanceOf and allowance
        incompleteToken = await Token5.new(initTokenAmount, "Incomp", 18, "I", { from: deployer });
        //incompatible token that returns a succesful result of 0 bytes on allowance calls
        weirdToken = await Token6.new({ from: deployer });

        let tokenAmounts = [395836495, 3453245, 564245465];

        // Give the accounts some amount of each token
        for (let i = 1; i < 2; i++) {
            for (let j = 0; j < tokens.length; j++) {
                await tokens[j].transfer(accounts[i], tokenAmounts[j], { from: deployer });
            }
        }

    });

    it("Check ERC20 token balances", async function () {
        for (let i = 1; i < 2; i++) {
            let tokenBalances = [];
            let tokenAddresses = [];

            //check tokens balance in their own contract
            for (let j = 0; j < tokens.length; j++) {
                tokenBalances[j] = await tokens[j].balanceOf(accounts[i]);
                tokenAddresses[j] = tokens[j].address;
            }
            let etherBalance = await web3.eth.getBalance(accounts[i]);
            tokenAddresses.push(ether);

            //check token balance batched with deltabalances
            let balances = await deltaBalances.tokenBalances(accounts[i], tokenAddresses);

            assert(balances && balances.length == (tokenBalances.length + 1), 'correct balances result format');

            assert.equal(String(etherBalance), String(balances[tokens.length]), "Ether balance correct");
            for (let j = 0; j < tokens.length; j++) {
                assert.equal(String(tokenBalances[j]), String(balances[j]), "Token " + j + " balance correct");
            }
        }
    });

    it("tokenBalances does not fail on non-contract address", async function () {
        // accounts[2] and [3] are not a smart contract
        let balances = await deltaBalances.tokenBalances(accounts[0], [accounts[2], accounts[3]]);
        assert(balances && balances.length == 2, 'correct allowances result format');
        assert.equal(String(balances[0]), "0", "Non-contract address returns 0");
        assert.equal(String(balances[1]), "0", "Non-contract address returns 0");
    });

    it("tokenBalances does not fail on non-token contracts", async function () {
        // exchange and deltabalances are a contract but not ERC20, incompleteToken is not valid erc20
        let balances = await deltaBalances.tokenBalances(accounts[0], [exchange.address, deltaBalances.address, incompleteToken.address]);
        assert(balances && balances.length == 3, 'correct allowances result format');
        assert.equal(String(balances[0]), "0", "Non-contract address returns 0");
        assert.equal(String(balances[1]), "0", "Non-contract address returns 0");
        assert.equal(String(balances[2]), "0", "Non-contract address returns 0");
    });

    it("tokenBalances does not fail selfdestructed contracts", async function () {
        // KillToken is selfdestructed, balanceOf should fail
        try {
            let balance = await killToken.balanceOf(accounts[0]);
            assert(false, "KillToken balanceOf should error");
        } catch (e) {
        }

        //this should return 0 instead of error
        let balances = await deltaBalances.tokenBalances(accounts[0], [killToken.address]);
        assert(balances && balances.length == 1, 'correct allowances result format');
        assert.equal(String(balances[0]), "0", "Selfdestructed returns 0");
    });

    it("tokenBalances does not fail on broken token", async function () {
        //BadToken does a revert inside balanceOf(), try should fail
        try {
            let balance = await brokenToken.balanceOf(accounts[0]);
            assert(false, "BadToken balanceOf is broken");
        } catch (e) {
        }

        // deltabalances should return 0 instead of throw an error
        let balances = await deltaBalances.tokenBalances(accounts[0], [brokenToken.address]);
        assert(balances.length == 1, "Correct result size");
        assert.equal(String(balances[0]), "0", "Broken token returns 0");
    });

    it("tokenBalances handles balanceOf mapping", async function () {
        /* altToken implements:
              mapping (address => uint256) public balanceOf; //creates a getter automatically
            Instead of
               function balanceOf(address _owner) public view returns (uint256 balance)
        */

        // get balanceof on token
        let balance = await altToken.balanceOf(accounts[0]);
        // get balanceof through deltabalances
        let balances = await deltaBalances.tokenBalances(accounts[0], [altToken.address]);
        assert(balances && balances.length == 1, 'correct allowances result format');
        assert.equal(String(balances[0]), String(balance), "Token with balanceOf mapping works");
    });



    it("Check ERC20 deposited balances", async function () {
        for (let i = 1; i < 2; i++) {
            let tokenBalances = [];
            let depositedBalances = [];
            let tokenAddresses = [];
            let divisor = web3.utils.toBN('2');

            //deposit some of each token into the exchange
            for (let j = 0; j < tokens.length; j++) {
                tokenBalances[j] = await tokens[j].balanceOf(accounts[i]);
                let amount = tokenBalances[j].div(divisor);
                tokenAddresses[j] = tokens[j].address;
                await tokens[j].approve(exchange.address, amount, { from: accounts[i] });
                await exchange.depositToken(tokens[j].address, amount, { from: accounts[i] });
                depositedBalances[j] = await exchange.balanceOf(tokens[j].address, accounts[i]);
            }
            //deposit ETH into the exchange
            tokenAddresses.push(ether);
            let etherBalance = await web3.eth.getBalance(accounts[i]);
            etherBalance = web3.utils.toBN(etherBalance);
            await exchange.deposit({ value: etherBalance.div(divisor), from: accounts[i] });
            let depositedEther = await exchange.balanceOf(ether, accounts[i]);

            //get deposited balances
            let balances = await deltaBalances.depositedBalances(exchange.address, accounts[i], tokenAddresses);

            assert.equal((tokens.length + 1), balances.length, 'correct balances result format');

            //balances match?
            assert.equal(String(balances[tokens.length]), String(depositedEther), "Ether deposited balance correct");
            for (let j = 0; j < tokens.length; j++) {
                assert.equal(String(balances[j]), String(depositedBalances[j]), "Token " + j + " deposited balance correct");
            }

            // test generic variant with function selectors

            //get deposited balances for 'getBalance(token, user)'
            let balances2 = await deltaBalances.depositedBalancesGeneric(exchange.address, "0xd4fac45d", accounts[i], tokenAddresses, false);
            for (let j = 0; j < tokens.length; j++) {
                assert.equal(String(balances[j]), String(balances2[j]), "Token " + j + "Generic balance correct");
            }

            //get deposited balances for 'tokens(user, token)'
            let balances3 = await deltaBalances.depositedBalancesGeneric(exchange.address, "0x508493bc", accounts[i], tokenAddresses, true);
            for (let j = 0; j < tokens.length; j++) {
                assert.equal(String(balances[j]), String(balances3[j]), "Token " + j + "Generic balance2 correct");
            }
        }
    });


    it("depositedBalances fails on invalid exchange contract", async function () {

        // depositedBalances does not escape whether exchange is a contract or implements balanceOf(token,user)
        try {
            let balances = await deltaBalances.depositedBalances(tokens[0].address, accounts[0], [tokens[0].address, ether, tokens[1].address]);
            assert(false, "Bad exchange contract should fail");
        } catch (e) {
        }

        try {
            let balances = await deltaBalances.depositedBalances(ether, accounts[0], [tokens[0].address, ether, tokens[1].address]);
            assert(false, "Bad exchange contract should fail (2)");
        } catch (e) {
        }

    });


    it("Check ERC20 token allowances", async function () {
        for (let i = 1; i < 2; i++) {
            let tokenAllowances = [];
            //check tokens allowances in their own contract
            for (let j = 0; j < tokens.length; j++) {
                await tokens[j].approve(exchange.address, 100000, { from: accounts[i] });
                tokenAllowances[j] = await tokens[j].allowance(accounts[i], exchange.address);
            }
            let addresses = tokens.map((x) => x.address);
            //check token allowances batched with deltabalances
            let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[i], addresses);
            assert(allowances && allowances.length == tokenAllowances.length, 'correct allowances result format');
            for (let j = 0; j < tokens.length; j++) {
                assert.equal(String(tokenAllowances[j]), String(allowances[j]), "Token " + j + " allowance correct");
            }
        }
    });


    it("Allowance does not fail on non-contract address", async function () {
        // don't fail on non contract address like ether 0x00
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[0], [ether, accounts[0]]);
        assert(allowances && allowances.length == 2, 'correct allowances result format');

        assert.equal("0", String(allowances[0]), "Non-Token allowance correct");
        assert.equal("0", String(allowances[1]), "Non-Token allowance correct");
    });

    it("Allowance does not fail on non-token contract", async function () {
        // don't fail on contracts that aren't (valid) token contracts
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[0], [exchange.address, deltaBalances.address, incompleteToken.address]);
        assert(allowances && allowances.length == 3, 'correct allowances result format');

        assert.equal("0", String(allowances[0]), "Non-Token allowance correct");
        assert.equal("0", String(allowances[1]), "Non-Token allowance correct");
        assert.equal("0", String(allowances[2]), "Non-Token allowance correct");
    });

    it("Allowance does not fail selfdestructed contracts", async function () {
        // KillToken is selfdestructed, allowance should fail
        try {
            let allowance = await killToken.allowance(accounts[0], exchange.address);
            assert(false, "KillToken allowance() should error");
        } catch (e) {
        }

        //this should return 0 instead of error
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[0], [killToken.address]);
        assert(allowances.length == 1, "Correct result size");
        assert.equal(String(allowances[0]), "0", "Selfdestructed returns 0");
    });

    it("Allowance does not fail on broken token", async function () {
        //brokenToken does a revert inside allowance(), try should fail
        try {
            let allowance = await brokenToken.allowance(accounts[0], exchange.address);
            assert(false, "brokenToken allowance() should error");
        } catch (e) {
        }

        //this should return 0 instead of error
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[0], [brokenToken.address]);
        assert(allowances.length == 1, "Correct result size");
        assert.equal(String(allowances[0]), "0", "Broken token returns 0");
    });

    it("Allowance does not fail on broken token2", async function () {
        //brokenToken does a revert inside allowance(), try should fail
        try {
            let allowance = await weirdToken.allowance(accounts[0], exchange.address);
            assert(false, "brokenToken allowance() should error");
        } catch (e) {
        }
        //this should return 0 instead of error
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[0], [weirdToken.address]);
        assert(allowances.length == 1, "Correct result size");
        assert.equal(String(allowances[0]), "0", "Broken token returns 0");
    });

    it("Allowance handles allowance mapping", async function () {
        /* altToken implements:
              mapping (address => mapping (address => uint256)) public allowance; //creates a getter automatically
            Instead of
              function allowance(address _owner, address _spender) public view returns (uint256 remaining)
        */

        await altToken.approve(exchange.address, 12, { from: accounts[2] });
        let allowance = await altToken.allowance(accounts[2], exchange.address);


        // get allowance through deltabalances
        let allowances = await deltaBalances.tokenAllowances(exchange.address, accounts[2], [altToken.address]);

        assert.equal(String(allowances[0]), String(allowance), "Token with allowance mapping works");
    });
}); 