PunditApp = {
    
    oneETH: 1000000000000000000,
    bookieInstance: null,
    openPunditPositions:null,
    availablePositions:null,
    matchData: null,
    teamData: null,
    selectedLiquidityId: 0,

    init: function() {
        PunditApp.bindEvents();
      },

    bindEvents: function() {
        
        $(document).on('click', '.btn-place-bet', PunditApp.placeBet);
        
        $('#punditDateFilter').datepicker()      
        .on('changeDate', function(ev){
            PunditApp.filterMatchesTable();
        });
      
      $('#pundit_match_filter').on('change', function() {
        PunditApp.filterMatchesTable();
      });
        
    },

    initTeams: function(teams) {
        PunditApp.teamData = teams;
        for (var i = 0; i < teams.length; i++)
        {
            $('#pundit_match_filter')
            .append($('<option>', { value : teams[i].id })
            .text(teams[i].Name));
        }
    },

    initMatches: function(matches) {
        PunditApp.matchData = matches;
        PunditApp.loadAvailableBets(matches);
    },

    filterMatchesTable: function() {
        PunditApp.loadAvailableBets(PunditApp.matchData);
    },

    selectBet: function(id) {
        PunditApp.selectedLiquidityId = id;
    },

    placeBet: function() {

        var account = web3.eth.accounts[0];

        var liquidityId = PunditApp.selectedLiquidityId;
        var odds = 0;

        for (var i = 0; i < PunditApp.availablePositions.length; i++)
        {
            if (PunditApp.availablePositions[i].id == liquidityId)
            {
                odds = PunditApp.availablePositions[i].odds * 100;
                break;
            }
        }

        var weiAmount = parseFloat($('#bk_pundit_bet_amount').val()) * PunditApp.oneETH;

        PunditApp.bookieInstance.placeBet(liquidityId, odds, {from: account, value:weiAmount}).then(function(id) {
            PunditApp.loadMyBets();
        });
    },

    loadAvailableBets: function(matches) {
        
        PunditApp.bookieInstance.getMatchLiquidity(316029).then(function (ids) {
            PunditApp.displayAvailableBets(ids);
        });
    },

    displayAvailableBets: async function(ids) {
        
        var openData = [];
        var historicData = [];
        
        $('#pundit-liquidity').bootstrapTable('destroy');

        if (ids == null || ids.length == 0)  
        return;

        for (var i = 0; i < ids.length; i++)
        {
            PunditApp.bookieInstance.getLiquidityById(parseInt(ids[i])).then(function (lq) {
            var item = {}
            
            item ["id"] = lq[0];
            item ["matchId"] = lq[1];
            item ["sideId"] = lq[2];
            item ["remainingLiquidity"] = lq[3]/PunditApp.oneETH;
            item ["odds"] = lq[4]/100;
            item ["maxBet"] = item ["remainingLiquidity"] / (item ["odds"]-1);
            item ["maxPayout"] = (item ["maxBet"] * item ["odds"]);
            item ["closed"] = lq[5];
            item ["teamName"] = "DRAW";

            for (var j = 0; j < PunditApp.matchData.length; j++)
            {
                if (PunditApp.matchData[j].match_id == lq[1])
                {
                    item ["matchDetails"] = PunditApp.matchData[j].home_team.name + " vs " + PunditApp.matchData[j].away_team.name;
                    item ["match_start"] = PunditApp.matchData[j].match_start;

                    if (lq[2] == PunditApp.matchData[j].home_team.team_id)
                        item ["teamName"] = PunditApp.matchData[j].home_team.name;
                    else if (lq[2] == PunditApp.matchData[j].away_team.team_id)
                        item ["teamName"] = PunditApp.matchData[j].away_team.name;

                    break;
                }
            }

            if (lq[5] == true)
                historicData.push(item);
            else
                openData.push(item);

            if (openData.length + historicData.length == ids.length) {
                PunditApp.availablePositions = openData;
                PunditApp.updateBookieLiquidityTable(openData); 
                }
            });
        }
    },

    updateBookieLiquidityTable: function(data) {
        
        $(function() {
        $('#pundit-liquidity').bootstrapTable({
            data: data,
            columns: [ {},{},{},{},{},{},{},  
            {
            field: 'id',
            title: 'Place Bet',
            align: 'center',
            valign: 'middle',
            clickToSelect: false,
            formatter : function(value,row,index) {
                return '<button class=\'btn btn-primary \' liquidityId="'+data[index].id+'" onclick=\'PunditApp.selectBet('+data[index].id+')\' data-bs-toggle="modal" data-bs-target="#punditPlaceBetModal">Place Bet</button> ';
            }
            },
        ]               
        });

        $("#pundit-liquidity").bootstrapTable("hideLoading");
        });
    },

    loadMyBets: function() {
            var account = web3.eth.accounts[0];
            PunditApp.bookieInstance.getPunditBets(account).then(function (ids) {
            PunditApp.displayBets(ids);
        });
    },

    displayBets: function(ids) {
        var bets = [];
        
        $('#pundit-mybets').bootstrapTable('destroy');

        if (ids == null || ids.length == 0)  
        return;
        
        for (var i = 0; i < ids.length; i++)
        {
            // PunditApp.bookieInstance.getBetById(parseInt(ids[i])).then(function (bet) {
            //     PunditApp.bookieInstance.getLiquidityById(bet[1]).then(function(lq) {
            //         var item = {}
            
            //         item ["id"] = bet[0];
            //         item ["matchId"] = lq[1];
            //         item ["bookieCollateral"] = bet[2]/PunditApp.oneETH;
            //         item ["punditCollateral"] = bet[3]/PunditApp.oneETH;
        
            //         var dt=eval(bet[8]*1000);
            //         var myDate = new Date(dt);
            //         item ["createdTime"] = myDate.toLocaleString();
        
            //         bets.push(item);
        
            //         if (bets.length == ids.length) {
            //                 $('#pundit-mybets').bootstrapTable({
            //                     data: bets
            //                 });
            //                 $("#pundit-mybets").bootstrapTable("hideLoading");
            //             }
            //         });
            //     });
        }
    },



}