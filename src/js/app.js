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

          //bookieInstance.setOracleAddress(App.oracleInstance.address).then(function(result) {alert(result)});
          //App.loadTestData();
          App.loadAvailableMatches();
          
          //PunditApp.loadMyBets();
          // $.getJSON('../json/football_matches.json', function(data) {
          //   App.initOracle(data.data);
          //   // BookieApp.initMatches(data.data);
          //   // PunditApp.initMatches(data.data);
          //   // 
          //   }
          // );

        });

      });

      

    return App.bindEvents();
  },

  bindEvents: function() {
       
  },

  

  loadAvailableMatches: function() {
     var matchIds = [];
     var matches = [];
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

  initOracle: function(matchData) {
    for (var i = 0; i < matchData.length; i++) {
      if (matchData[i].status != "notstarted")
        continue;
      var item = matchData[i];
      web3.eth.defaultAccount=web3.eth.accounts[0];
      var matchId = parseInt(item.match_id);
      var matchDate = item.match_start.substring(0, 10);
      var homeTeamId = parseInt(item.home_team.team_id);
      var awayTeamId = parseInt(item.away_team.team_id);
      var homeTeamName = item.home_team.name;
      var awayTeamName = item.away_team.name;

      
      //alert(matchId + " " + matchDate + " " + homeTeamId)

      // App.oracleInstance.addMatch(1, "", 1, 2, "", "").then(function(result) {alert(result)});
      App.oracleInstance.addMatch(matchId, 
                                  matchDate, 
                                  homeTeamId, 
                                  awayTeamId, 
                                  homeTeamName, 
                                  awayTeamName).then(function(result) {});
    }
  }

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
