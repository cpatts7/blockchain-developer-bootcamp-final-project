var BeTheBookie = artifacts.require("./BeTheBookie.sol");
var SoccerOracle = artifacts.require("./SoccerOracle.sol");

module.exports = function(deployer) {
  deployer.deploy(BeTheBookie);
  deployer.deploy(SoccerOracle);
};
