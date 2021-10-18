App = {
  web3Provider: null,
  contracts: {},
  oneETH: 1000000000000000000,
  bookieInstance: null,
  openBookiePositions:null,

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
      
        App.contracts.BeTheBookie.deployed().then(function(instance) {
          bookieInstance = instance;
          App.loadLiquidity();
        });

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
      var account = web3.eth.accounts[0];

      var matchId = $('#bk_lq_match').find(":selected").val();
      var playerId = $('#bk_lq_player').find(":selected").val();
      var odds = parseInt(parseFloat($('#bk_lq_odds').val()) * 100); //convert to INT
      var amount = parseFloat($('#bk_lq_quantity').val());
      var weiAmount = amount * App.oneETH; //convert to WEI
      bookieInstance.addLiquidity(matchId, playerId, odds, {from: account, value:weiAmount}).then(function(id) {
        App.loadLiquidity();
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
          return betInstance.placeBet(1, {from: account, value:App.oneETH});
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
                  
            var account = web3.eth.accounts[0];
            bookieInstance.getBookieLiquidity(account).then(function (ids) {
              App.displayLiquidity(ids);
            });

          },

          displayLiquidity: async function(ids) {
            
            var openData = [];
            var historicData = [];

            $('#bookie-liquidity').bootstrapTable('destroy');

            if (ids == null || ids.length == 0)  
              return;
            
           
            for (var i = 0; i < ids.length; i++)
            {
              
              bookieInstance.getLiquidityById(parseInt(ids[i])).then(function (lq) {
                  var item = {}
                  
                  item ["id"] = lq[0];
                  item ["matchId"] = lq[1];
                  item ["sideId"] = lq[2];
                  item ["remainingLiquidity"] = lq[3]/App.oneETH;
                  item ["odds"] = lq[4]/100;
                  item ["closed"] = lq[5];

                  if (lq[5] == true)
                    historicData.push(item);
                  else
                    openData.push(item);

                  if (openData.length + historicData.length == ids.length) {
                      App.openBookiePositions = openData;
                      App.updateBookieLiquidityTable(openData); 
                  }
              });
            }

          },

          updateBookieLiquidityTable: function(data) {

            $(function() {
              $('#bookie-liquidity').bootstrapTable({
                data: data,
                columns: [ {},{},{},{},  
                {
                  field: 'id',
                  title: 'Adjust Odds',
                  align: 'center',
                  valign: 'middle',
                  clickToSelect: false,
                  formatter : function(value,row,index) {
                    return '<button class=\'btn btn-primary \' liquidityId="'+data[index].id+'" onclick=\'App.editLiquidityOdds('+data[index].id+')\'>Edit Odds</button> ';
                  }
                },
                {
                  field: 'id',
                  title: 'Cancel Position',
                  align: 'center',
                  valign: 'middle',
                  clickToSelect: false,
                  formatter : function(value,row,index) {
                    return '<button class=\'btn btn-primary \' liquidityId="'+data[index].id+'" onclick=\'App.cancelLiquidity('+data[index].id+')\'>Cancel</button> ';
                  }
                }
              ]               
              });

              $("#bookie-liquidity").bootstrapTable("hideLoading");
            });
          },

          editLiquidityOdds: function(liquidityId) {
            alert(liquidityId);
          },

          cancelLiquidity: function(liquidityId) {

            var account = web3.eth.accounts[0];
            bookieInstance.refundLiquidity(liquidityId, {from: account, value:0}).then(function () {
              App.loadLiquidity();
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

  });
});
