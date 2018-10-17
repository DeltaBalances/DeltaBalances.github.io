const DeltaBalances = artifacts.require("DeltaBalances");

module.exports = function(deployer) {
	deployer.deploy(DeltaBalances); 
};