module.exports = {
  networks: {
    local: {
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 3500000
    }
  }
};
