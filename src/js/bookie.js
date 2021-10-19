BookieApp = {
    
    oneETH: 1000000000000000000,
    bookieInstance: null,
    openBookiePositions:null,
    selectedLiquidityId: 0,
    matchData: null,
  
    init: function() {
        BookieApp.bindEvents();
      },

    bindEvents: function() {
      $(document).on('click', '.btn-edit-odds', BookieApp.bookieEditOdds);
      $(document).on('click', '.btn-liquid', BookieApp.addLiquidity);
    },
  
    addLiquidity: function(event) {
  
        event.preventDefault();
        var account = web3.eth.accounts[0];
  
        var matchId = $('#bk_lq_match').find(":selected").val();
        var playerId = $('#bk_lq_player').find(":selected").val();
        var odds = parseInt(parseFloat($('#bk_lq_odds').val()) * 100); //convert to INT
        var amount = parseFloat($('#bk_lq_quantity').val());
        var weiAmount = amount * BookieApp.oneETH; //convert to WEI
        BookieApp.bookieInstance.addLiquidity(matchId, playerId, odds, {from: account, value:weiAmount}).then(function(id) {
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
            
            $('#bookie-bets').bootstrapTable('destroy');

            if (ids == null || ids.length == 0)  
            return;
            
            for (var i = 0; i < ids.length; i++)
            {
                BookieApp.bookieInstance.getBetById(parseInt(ids[i])).then(function (bet) {
                var item = {}
                
                item ["id"] = bet[0];
                item ["bookieCollateral"] = bet[2]/BookieApp.oneETH;
                item ["punditCollateral"] = bet[3]/BookieApp.oneETH;

                var dt=eval(bet[8]*1000);
                var myDate = new Date(dt);
                item ["createdTime"] = myDate.toLocaleString();

                bets.push(item);

                if (bets.length == ids.length) {
                        $('#bookie-bets').bootstrapTable({
                            data: bets
                        });
                        $("#bookie-bets").bootstrapTable("hideLoading");
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

                for (var j = 0; j < BookieApp.matchData.length; j++)
                {
                    if (BookieApp.matchData[j].id == lq[1])
                    {
                        if (lq[2] == BookieApp.matchData[j].player1_id)
                            item ["playerName"] = BookieApp.matchData[j].player1;
                        else
                            item ["playerName"] = BookieApp.matchData[j].player2;

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
                columns: [ {},{},{},{},{},  
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
        }
  
  };
