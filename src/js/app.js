App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        try {
          // Request account access
          await window.ethereum.enable();
        } catch (error) {
          // User denied account access...
          console.error("User denied account access")
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
      
      $.getJSON('BetManager.json', function(data) {
        // Get the necessary contract artifact file and instantiate it with @truffle/contract
        var BetManagerArtifact = data;
        App.contracts.BetManager = TruffleContract(BetManagerArtifact);
      
        // Set the provider for our contract
        App.contracts.BetManager.setProvider(App.web3Provider);
      
      });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-liquid', App.addLiquidity);
    $(document).on('click', '.btn-bet', App.placeBet);
    $(document).on('click', '.btn-result', App.setResult);
    $(document).on('click', '.btn-refund', App.refundLiquidity);
  },

  addLiquidity: function(event) {

    event.preventDefault();

    var betManagerInstance;

      web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      
      var account = accounts[0];
      
      App.contracts.BetManager.deployed().then(function(instance) {
        betManagerInstance = instance;

        // Execute adopt as a transaction by sending account
        return betManagerInstance.addLiquidity(1, 1, 150, {from: account, value:1000000000000000000});
          }).then(function(result) {
           alert("success");
          }).catch(function(err) {
            console.log(err.message);
            $("#txStatus").text(err.message);
          });
        }); 
    },

    placeBet: function(event) {

      event.preventDefault();
  
      var betManagerInstance;
  
        web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        
        var account = accounts[0];
        
        App.contracts.BetManager.deployed().then(function(instance) {
          betManagerInstance = instance;
  
          // Execute adopt as a transaction by sending account
          return betManagerInstance.placeBet(1, {from: account, value:1000000000000000000});
            }).then(function(result) {
             alert("success");
            }).catch(function(err) {
              console.log(err.message);
              $("#txStatus").text(err.message);
            });
          }); 
      },

      setResult: function(event) {

        event.preventDefault();
    
        var betManagerInstance;
    
          web3.eth.getAccounts(function(error, accounts) {
          if (error) {
            console.log(error);
          }
          
          var account = accounts[0];
          
          App.contracts.BetManager.deployed().then(function(instance) {
            betManagerInstance = instance;
    
            // Execute adopt as a transaction by sending account
            return betManagerInstance.setResult(1, 2, {from: account, value:0});
              }).then(function(result) {
               alert("success");
              }).catch(function(err) {
                console.log(err.message);
                $("#txStatus").text(err.message);
              });
            }); 

        },

        refundLiquidity: function(event) {
          alert("refund");
          event.preventDefault();
      
          var betManagerInstance;
      
            web3.eth.getAccounts(function(error, accounts) {
            if (error) {
              console.log(error);
            }
            
            var account = accounts[0];
            
            App.contracts.BetManager.deployed().then(function(instance) {
              betManagerInstance = instance;
      
              // Execute adopt as a transaction by sending account
              return betManagerInstance.refundLiquidity(1, {from: account, value:0});
                }).then(function(result) {
                 alert("success");
                }).catch(function(err) {
                  console.log(err.message);
                  $("#txStatus").text(err.message);
                });
              }); 
          },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
