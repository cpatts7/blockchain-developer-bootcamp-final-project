BookieApp = {
    
    oneETH: 1000000000000000000,
    bookieInstance: null,
    openBookiePositions:null,
    selectedLiquidityId: 0,
    selectedMatchId: 0,
    matchData: null,
    teamData: null,
    matchMap: null,

    init: function() {
        BookieApp.bindEvents();
      },

    bindEvents: function() {
      $(document).on('click', '.btn-add-position', BookieApp.addLiquidity);
      $(document).on('click', '.btn-edit-odds', BookieApp.bookieEditOdds);
      
      $('#dp3').datepicker()      
      .on('changeDate', function(ev){
            BookieApp.filterMatchesTable();
        });
      
      $('#bookie_match_filter').on('change', function() {
        BookieApp.filterMatchesTable();
      });
    },
  
    filterMatchesTable: function() {
        var selectedTeam = $('#bookie_match_filter').find(":selected").val();
        var matchDateText = $('#dp3').val();
        var matchDateFilter = "";
        if (matchDateText != "")
        {
            matchDate = new Date(matchDateText);
            matchDateFilter = matchDate.toISOString().slice(0,10);
        }

        if (selectedTeam == "" && matchDateFilter == "")
        {
            BookieApp.bindBookieMatchTable(BookieApp.matchData);
            return;
        }

        var filteredMatches = [];
        for (var i = 0; i < BookieApp.matchData.length; i++)
        {
            var match = BookieApp.matchData[i];

            if (selectedTeam != "" && matchDateFilter != "")
            {
                if ((match.home_team.team_id == selectedTeam || match.away_team.team_id == selectedTeam) && match.match_start.slice(0, 10) == matchDateFilter)
                    filteredMatches.push(match);
            }
            else if (matchDateFilter != "" && match.match_start.slice(0, 10) == matchDateFilter)
                filteredMatches.push(match);
            else if (selectedTeam != "" && (match.home_team.team_id == selectedTeam || match.away_team.team_id == selectedTeam))
                filteredMatches.push(match);
        }

        BookieApp.bindBookieMatchTable(filteredMatches);

    },

    addLiquidity: function(event) {
  
        event.preventDefault();
        var account = web3.eth.accounts[0];
        var match = BookieApp.findMatchData(BookieApp.selectedMatchId);
        var sideId = 0;
        var selectedWinner = $('#bk_lq_match_winner').find(":selected").val();
        if (selectedWinner == 1)
            sideId = match.home_team.team_id;
        else if (selectedWinner == 3)
            sideId = match.away_team.team_id;

        var odds = parseInt(parseFloat($('#bk_lq_odds').val()) * 100); //convert to INT
        var amount = parseFloat($('#bk_lq_quantity').val());
        var weiAmount = amount * BookieApp.oneETH; //convert to WEI
        BookieApp.bookieInstance.addLiquidity(BookieApp.selectedMatchId, sideId, odds, {from: account, value:weiAmount}).then(function(id) {
            BookieApp.loadLiquidity();
        });
          
      },
  
      loadBets: function() {
        var account = web3.eth.accounts[0];
        BookieApp.bookieInstance.getBookieBets(account).then(function (ids) {
            BookieApp.displayBets(ids);
        });

    },
  
        loadLiquidity: function() {
                
            var account = web3.eth.accounts[0];
            BookieApp.bookieInstance.getBookieLiquidity(account).then(function (ids) {
                BookieApp.displayLiquidity(ids);
            });

        },

        displayBets: function(ids) {
            var bets = [];
            var closedBets = [];
            
            $('#bookie-bets').bootstrapTable('destroy');
            $('#bookie-closedbets').bootstrapTable('destroy');

            if (ids == null || ids.length == 0)  
            return;
            
            for (var i = 0; i < ids.length; i++)
            {
                BookieApp.bookieInstance.getBetById(parseInt(ids[i])).then(function (bet) {
                var item = {}
                
                item ["id"] = bet[0];
                item ["bookieCollateral"] = bet[2]/BookieApp.oneETH;
                item ["punditCollateral"] = bet[3]/BookieApp.oneETH;
                item ["bookiePayout"] =  bet[4]/BookieApp.oneETH;;
                item ["punditPayout"] = bet[5]/BookieApp.oneETH;
                item ["feePaid"] = bet[6]/BookieApp.oneETH;

                if (bet[7] == 1)
                    item ["result"] = "Bookie Won";
                else if (bet[7] == 2)
                    item ["result"] = "Pundit Won";
                else if (bet[7] == 3)
                    item ["result"] = "VOID";

                var dt=eval(bet[8]*1000);
                var myDate = new Date(dt);
                item ["createdTime"] = myDate.toLocaleString();

                if (bet[9] == false)
                    bets.push(item);
                else
                    closedBets.push(item);

                if (bets.length + closedBets.length == ids.length) {
                        $('#bookie-bets').bootstrapTable({
                            data: bets
                        });
                        $("#bookie-bets").bootstrapTable("hideLoading");

                        $('#bookie-closedbets').bootstrapTable({
                            data: closedBets
                        });
                        $("#bookie-closedbets").bootstrapTable("hideLoading");
                    }
                });
            }
        },

        displayLiquidity: async function(ids) {
            
            var openData = [];
            var historicData = [];

            $('#bookie-liquidity').bootstrapTable('destroy');

            if (ids == null || ids.length == 0)  
            return;
            
            
            for (var i = 0; i < ids.length; i++)
            {
                BookieApp.bookieInstance.getLiquidityById(parseInt(ids[i])).then(function (lq) {
                var item = {}
                
                item ["id"] = lq[0];
                item ["matchId"] = lq[1];
                item ["sideId"] = lq[2];
                item ["remainingLiquidity"] = lq[3]/BookieApp.oneETH;
                item ["odds"] = lq[4]/100;
                item ["closed"] = lq[5];
                item ["teamName"] = "DRAW";

                for (var j = 0; j < BookieApp.matchData.length; j++)
                {
                    if (BookieApp.matchData[j].match_id == lq[1])
                    {
                        item ["matchDetails"] = BookieApp.matchData[j].home_team.name + " vs " + BookieApp.matchData[j].away_team.name;
                        item ["match_start"] = BookieApp.matchData[j].match_start;
                    }
                }
                

                for (var j = 0; j < BookieApp.teamData.length; j++)
                { 
                    if (lq[2] == BookieApp.teamData[j].id)
                    {
                        item ["teamName"] = BookieApp.teamData[j].Name;
                        break;
                    }
                    
                }
                

                if (lq[5] == true)
                    historicData.push(item);
                else
                    openData.push(item);

                if (openData.length + historicData.length == ids.length) {
                    BookieApp.openBookiePositions = openData;
                    BookieApp.updateBookieLiquidityTable(openData); 
                    }
                });
            }

        },

        updateBookieLiquidityTable: function(data) {

            $(function() {
            $('#bookie-liquidity').bootstrapTable({
                data: data,
                columns: [ {},{},{},{},{},{},{},  
                {
                field: 'id',
                title: 'Adjust Odds',
                align: 'center',
                valign: 'middle',
                clickToSelect: false,
                formatter : function(value,row,index) {
                    return '<button class=\'btn btn-primary \' liquidityId="'+data[index].id+'" onclick=\'BookieApp.editLiquidityOdds('+data[index].id+')\' data-bs-toggle="modal" data-bs-target="#bookieEditOddsModal">Edit Odds</button> ';
                }
                },
                {
                field: 'id',
                title: 'Cancel Position',
                align: 'center',
                valign: 'middle',
                clickToSelect: false,
                formatter : function(value,row,index) {
                    return '<button class=\'btn btn-primary \' liquidityId="'+data[index].id+'" onclick=\'BookieApp.cancelLiquidity('+data[index].id+')\'>Cancel</button> ';
                }
                }
            ]               
            });

            $("#bookie-liquidity").bootstrapTable("hideLoading");
            });
        },

        editLiquidityOdds: function(liquidityId) {
            BookieApp.selectedLiquidityId = liquidityId;
            $('#bk_lq_edit_odds').val("");
        },

        cancelLiquidity: function(liquidityId) {

            var account = web3.eth.accounts[0];
            BookieApp.bookieInstance.refundLiquidity(liquidityId, {from: account, value:0}).then(function () {
                BookieApp.loadLiquidity();
            });

        },

        bookieEditOdds: function() {
            var account = web3.eth.accounts[0];
            var odds = parseInt(parseFloat($('#bk_lq_edit_odds').val()) * 100);
            
            BookieApp.bookieInstance.adjustOdds(BookieApp.selectedLiquidityId, odds, {from: account, value:0}).then(function () {
                BookieApp.selectedLiquidityId = 0;
                BookieApp.loadLiquidity();
            });
        },

        initTeams: function(teams) {
            BookieApp.teamData = teams;
            for (var i = 0; i < teams.length; i++)
            {
                $('#bookie_match_filter')
                .append($('<option>', { value : teams[i].id })
                .text(teams[i].Name));
            }
        },

        initMatches: function(matches) {
            BookieApp.matchData = matches;
            BookieApp.bindBookieMatchTable(matches);
        },

        bindBookieMatchTable: function(matches) {
            $('#bookie-matches').bootstrapTable('destroy');
            if (matches == null || matches.length == 0)
                return;

            $('#bookie-matches').bootstrapTable({
                data: matches,
                columns: [ {},{},{},{},  
                    {
                    field: 'match_id',
                    title: 'Place Odds',
                    align: 'center',
                    valign: 'middle',
                    clickToSelect: false,
                        formatter : function(value,row,index) {
                            return '<button class=\'btn btn-primary \' matchId="'+matches[index].match_id+'" onclick=\'BookieApp.addMatchOdds('+matches[index].match_id+')\' data-bs-toggle="modal" data-bs-target="#bookieAddLiquidityModal">Place Odds</button> ';
                        }
                    }
                ]     
              });
            $("#bookie-matches").bootstrapTable("hideLoading");
        },

        addMatchOdds: function (matchId) {
            BookieApp.selectedMatchId = matchId;
            var match = BookieApp.findMatchData(matchId);
            var name = match.home_team.name + " (HOME) vs " + match.away_team.name + " (AWAY)";
            $("#bk_lq_match_desc").text(name);
        },

        findMatchData: function(matchId) {
            for (var i = 0; i < BookieApp.matchData.length; i++)
            {
                if (BookieApp.matchData[i].match_id == matchId)
                {
                    return BookieApp.matchData[i];
                }
            }
        },

        formatWEI: function(weiValue) {
            return  ethers.utils.formatEther(ethers.utils.bigNumberify(weiValue));
        }
  
  };
