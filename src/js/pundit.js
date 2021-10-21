PunditApp = {
    
    oneETH: 1000000000000000000,
    bookieInstance: null,
    openPunditPositions:null,
    availablePositions:null,
    matchData: null,
    selectedLiquidityId: 0,

    init: function() {
        PunditApp.bindEvents();
      },

    bindEvents: function() {
        
        $(document).on('click', '.btn-place-bet', PunditApp.placeBet);
        
        
    },

    changeMatch: function() {
        PunditApp.loadAvailableBets();
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

    loadAvailableBets: function() {
        var matchId = parseInt($('#bk_pundit_match').find(":selected").val());
        PunditApp.bookieInstance.getMatchLiquidity(matchId).then(function (ids) {
            PunditApp.displayAvailableBets(ids);
        });
    },

    displayAvailableBets: async function(ids) {
        return;
        
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

            for (var j = 0; j < PunditApp.matchData.length; j++)
            {
                if (PunditApp.matchData[j].id == lq[1])
                {
                    if (lq[2] == PunditApp.matchData[j].player1_id)
                        item ["playerName"] = PunditApp.matchData[j].player1;
                    else
                        item ["playerName"] = PunditApp.matchData[j].player2;

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
            columns: [ {},{},{},{},{},  
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
            PunditApp.bookieInstance.getBetById(parseInt(ids[i])).then(function (bet) {
            var item = {}
            
            item ["id"] = bet[0];
            item ["bookieCollateral"] = bet[2]/PunditApp.oneETH;
            item ["punditCollateral"] = bet[3]/PunditApp.oneETH;

            var dt=eval(bet[8]*1000);
            var myDate = new Date(dt);
            item ["createdTime"] = myDate.toLocaleString();

            bets.push(item);

            if (bets.length == ids.length) {
                    $('#pundit-mybets').bootstrapTable({
                        data: bets
                    });
                    $("#pundit-mybets").bootstrapTable("hideLoading");
                }
            });
        }
    },



}