const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv');
dotenv.config();
const mnemonic = process.env.MNEMONIC;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 7545
    },
    rinkeby: {
      provider: () => new HDWalletProvider("passphrase", "url"),
      network_id: "4",
      gas: 5500000
    }
  }
};
