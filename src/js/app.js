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
      
      $.getJSON('BeTheBookie.json', function(data) {
        // Get the necessary contract artifact file and instantiate it with @truffle/contract
        
        var BeTheBookieABIArtifact = data;
        App.contracts.BeTheBookie = TruffleContract(BeTheBookieABIArtifact);
        
        // Set the provider for our contract
        App.contracts.BeTheBookie.setProvider(App.web3Provider);
      
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

    var bookieInstance;

      web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      
      var account = accounts[0];
      App.contracts.BeTheBookie.deployed().then(function(instance) {
        bookieInstance = instance;
        
        var matchId = $('#bk_lq_match').find(":selected").val();
        var playerId = $('#bk_lq_player').find(":selected").val();
        var odds = parseInt(parseFloat($('#bk_lq_odds').val()) * 100); //convert to INT
        var amount = parseFloat($('#bk_lq_quantity').val());
        var weiAmount = amount * 1000000000000000000; //convert to WEI
        
        // Execute adopt as a transaction by sending account
        return bookieInstance.addLiquidity(matchId, playerId, odds, {from: account, value:weiAmount});
          }).then(function(result) {
            
          }).catch(function(err) {
            console.log(err.message);
            $("#txStatus").text(err.message);
            return;
          });


        }); 
    },

    placeBet: function(event) {

      event.preventDefault();
  
      var betInstance;
  
        web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        
        var account = accounts[0];
        
        App.contracts.BeTheBookie.deployed().then(function(instance) {
          betInstance = instance;
  
          // Execute adopt as a transaction by sending account
          return betInstance.placeBet(1, {from: account, value:1000000000000000000});
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
    
        var betInstance;
    
          web3.eth.getAccounts(function(error, accounts) {
          if (error) {
            console.log(error);
          }
          
          var account = accounts[0];
          
          App.contracts.BeTheBookie.deployed().then(function(instance) {
            betInstance = instance;
    
            // Execute adopt as a transaction by sending account
            return betInstance.setResult(1, 2, {from: account, value:0});
              }).then(function(result) {
               alert("success");
              }).catch(function(err) {
                console.log(err.message);
                $("#txStatus").text(err.message);
              });
            }); 

        },

        refundLiquidity: function(event) {
          
          event.preventDefault();
      
          var bookieInstance;
      
            web3.eth.getAccounts(function(error, accounts) {
            if (error) {
              console.log(error);
            }
            
            var account = accounts[0];
            
            App.contracts.BeTheBookie.deployed().then(function(instance) {
              bookieInstance = instance;
      
              // Execute adopt as a transaction by sending account
              return bookieInstance.refundLiquidity(1, {from: account, value:0});
                }).then(function(result) {
                 alert("success");
                }).catch(function(err) {
                  console.log(err.message);
                  $("#txStatus").text(err.message);
                });
              }); 
          },

          loadLiquidity: function() {
                  
            var bookieInstance;
        
            web3.eth.getAccounts(function(error, accounts) {
              if (error) {
                console.log(error);
              }
                
              var account = accounts[0];

              App.contracts.BeTheBookie.deployed().then(function(instance) {
                bookieInstance = instance;

                return bookieInstance.betPools.call(0);
                }).then(function(result) {
                 alert(result[5]);
                }).catch(function(err) {
                  console.log(err.message);
                  $("#txStatus").text(err.message);
                });
            
            }); 

          }

};

$(function() {
  $(window).load(function() {
    App.init();

    $.getJSON('../json/matches.json', function(data) {
          
          $('#bookie-matches').bootstrapTable({
            data: data.Matches
          });
          $("#bookie-matches").bootstrapTable("hideLoading");
      }
    );

    //App.loadLiquidity();

  });
});
