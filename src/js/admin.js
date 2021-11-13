AdminApp = {
    matchData: null,
    selectedMatchId: 0,

    init: function() {
        AdminApp.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '.btn-admin-oracle', AdminApp.setOracle);    
        $(document).on('click', '.btn-admin-oracle-matches', AdminApp.setOracleMatchData);   
        $(document).on('click', '.btn-admin-setresult', AdminApp.setResult);   
        
      },

    setOracle: function() {
        bookieInstance.setOracleAddress(App.oracleInstance.address).then(function(result) {alert("Oracle is set.")});
      },
    
      setOracleMatchData: function() {
          var num = parseInt($('#admin_oracle_num').val());
        App.oracleInstance.setInitialMatches(num).then(function() {alert("Done")});
      },

      initMatches: function(matches) {
        AdminApp.matchData = matches;
        AdminApp.bindAdminMatchTable(matches);
      },

      bindAdminMatchTable: function(matches) {
        $('#admin-matches').bootstrapTable('destroy');
        if (matches == null || matches.length == 0)
            return;

        $('#admin-matches').bootstrapTable({
            data: matches,
            columns: [ {},{},{},{},  
                {
                field: 'match_id',
                title: 'Set Result',
                align: 'center',
                valign: 'middle',
                clickToSelect: false,
                    formatter : function(value,row,index) {
                        return '<button class=\'btn btn-primary \' matchId="'+matches[index].match_id+'" onclick=\'AdminApp.setResultForMatch('+matches[index].match_id+')\' data-bs-toggle="modal" data-bs-target="#adminSetResultModal">Set Result</button> ';
                    }
                }
            ]     
          });
        $("#admin-matches").bootstrapTable("hideLoading");
    },
    
    setResultForMatch: function(matchId) {
        AdminApp.selectedMatchId = parseInt(matchId);
        var match = AdminApp.findMatchData(matchId);
        var name = match.home_team_name + " (HOME) vs " + match.away_team_name + " (AWAY)";
        $("#admin_match_desc").text(name);
    },

    setResult: function() {
        var match = AdminApp.findMatchData(AdminApp.selectedMatchId);
        var sideId = 0;
        var selectedWinner = $('#admin_match_winner').find(":selected").val();
        if (selectedWinner == 1)
            sideId = match.home_team_id;
        else if (selectedWinner == 3)
            sideId = match.away_team_id;

        var finalScore = $('#admin_final_score').val();

        App.oracleInstance.setMatchResult(AdminApp.selectedMatchId, 2, parseInt(sideId), finalScore).then(function() {

            App.bookieInstance.matchCompleteHandlePayouts(AdminApp.selectedMatchId).then(function () {alert("Match Updated");});

        });
    },

    findMatchData: function(matchId) {
        for (var i = 0; i < AdminApp.matchData.length; i++)
        {
            if (AdminApp.matchData[i].match_id == matchId)
            {
                return AdminApp.matchData[i];
            }
        }
    },

      // loadTestData: function() {
      //   $.getJSON('../json/football_matches.json', function(data) {
      //       var output = "";
      //         for (var i = 0; i < data.data.length; i++) {
      //           var item = data.data[i];
      //           if (item.status == "notstarted")
      //           {
      //             output += ("addMatchDetails("+item.match_id+", \""+item.match_start.substring(0,10) + "\", "+item.home_team.team_id+", "+item.away_team.team_id+", \""+item.home_team.name+"\", \""+item.away_team.name+"\");\n");
      //           }
      //         }
      //         console.log(output);
      //       }
      //     );
      // },

    //   initOracle: function(matchData) {
    //     for (var i = 0; i < matchData.length; i++) {
    //       if (matchData[i].status != "notstarted")
    //         continue;
    //       var item = matchData[i];
    //       web3.eth.defaultAccount=web3.eth.accounts[0];
    //       var matchId = parseInt(item.match_id);
    //       var matchDate = item.match_start.substring(0, 10);
    //       var homeTeamId = parseInt(item.home_team.team_id);
    //       var awayTeamId = parseInt(item.away_team.team_id);
    //       var homeTeamName = item.home_team.name;
    //       var awayTeamName = item.away_team.name;
    
          
    //       //alert(matchId + " " + matchDate + " " + homeTeamId)
    
    //       // App.oracleInstance.addMatch(1, "", 1, 2, "", "").then(function(result) {alert(result)});
    //       App.oracleInstance.addMatch(matchId, 
    //                                   matchDate, 
    //                                   homeTeamId, 
    //                                   awayTeamId, 
    //                                   homeTeamName, 
    //                                   awayTeamName).then(function(result) {});
    //     }
    //   }
}