App = {
  web3Provider: null,
  contracts: {},
  oneETH: 1000000000000000000,
  bookieInstance: null,
  oracleInstance: null,
  openBookiePositions:null,
  selectedLiquidityId: 0,

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
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      }
      web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
      
    $.getJSON('./SoccerOracle.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      
      var SoccerOracleABIArtifact = data;
      App.contracts.SoccerOracle = TruffleContract(SoccerOracleABIArtifact);
      
      // Set the provider for our contract
      App.contracts.SoccerOracle.setProvider(App.web3Provider);
    
      App.contracts.SoccerOracle.deployed().then(function(instance) {
        App.oracleInstance = instance;
        
      });
    });

      $.getJSON('./BeTheBookie.json', function(data) {
        // Get the necessary contract artifact file and instantiate it with @truffle/contract
        
        var BeTheBookieABIArtifact = data;
        App.contracts.BeTheBookie = TruffleContract(BeTheBookieABIArtifact);
        
        // Set the provider for our contract
        App.contracts.BeTheBookie.setProvider(App.web3Provider);
      
        App.contracts.BeTheBookie.deployed().then(function(instance) {
          bookieInstance = instance;
          BookieApp.bookieInstance = instance;
          PunditApp.bookieInstance = instance;
          web3.eth.defaultAccount=web3.eth.accounts[0];

          //only the owner can access this tab
          bookieInstance.isOwner().then(function(result) {
              if (!result) {
                $('#management-tab').addClass('disabled');
              }
          });

          App.loadAvailableMatches();
          
        });

      });

      

    return App.bindEvents();
  },

  bindEvents: function() {
       
  },

  

  loadAvailableMatches: function() {
     var matchIds = [];
     var matches = [];

     $.getJSON('../json/football_matches.json', function(jsonData) {
        App.oracleInstance.getAvailableMatches().then(function (data) {
          matchIds = data;
          for (var i = 0; i < jsonData.data.length; i++)
          {
            var item = jsonData.data[i];
            if (item.status != "notstarted")
              continue;

              var match = {}
                  
              match ["match_id"] = parseInt(item.match_id);
              match ["match_date"] = item.match_start.substring(0, 10);
              match ["home_team_id"] = parseInt(item.home_team.team_id);
              match ["away_team_id"] = parseInt(item.away_team.team_id);
              match ["home_team_name"] = item.home_team.name;
              match ["away_team_name"] = item.away_team.name;
              match ["available"] = false;

              for (var j = 0; j < matchIds.length; j++) {
                if (matchIds[j] == parseInt(item.match_id))
                {
                  match ["available"] = true;
                  break;
                }
              }

              matches.push(match);
          }

          BookieApp.initMatches(matches);
          PunditApp.initMatches(matches);
          AdminApp.initMatches(matches);
          BookieApp.loadBets();
          BookieApp.loadLiquidity();
          PunditApp.loadMyBets();
        });

      });

      

     App.oracleInstance.getAvailableMatches().then(function (data) {
        
          matchIds = data;
          for (var i = 0; i < matchIds.length; i++)
          {
           App.oracleInstance.getMatch(parseInt(matchIds[i])).then(function (result)
             {
              var match = {}
                
              match ["match_id"] = parseInt(result[0]);
              match ["match_date"] = result[1];
              match ["home_team_id"] = parseInt(result[2]);
              match ["away_team_id"] = parseInt(result[3]);
              match ["home_team_name"] = result[4];
              match ["away_team_name"] = result[5];
  
              matches.push(match);
  
              if (matches.length == matchIds.length)
              {
                BookieApp.initMatches(matches);
                PunditApp.initMatches(matches);
                AdminApp.initMatches(matches);
                BookieApp.loadBets();
                BookieApp.loadLiquidity();
                PunditApp.loadMyBets();
              }
             });
          }
     });
     
    //  App.oracleInstance.getAvailableMatches().then(function (data) {
    //    matchIds = data;

 
            
    
    //       }
    //     );
    //    }

    //   });
  },

  

};

$(function() {
  $(window).load(function() {

    App.init();
    AdminApp.init();
    BookieApp.init();
    PunditApp.init();

    $.getJSON('../json/football_teams.json', function(data) {
      BookieApp.initTeams(data.Teams);
      PunditApp.initTeams(data.Teams);
    });

  });
});
