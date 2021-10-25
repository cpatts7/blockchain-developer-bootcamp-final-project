
const { catchRevert } = require("./exceptionsHelpers.js");
var BeTheBookie = artifacts.require("./BeTheBookie.sol");
var SoccerOracle = artifacts.require("./SoccerOracle.sol");

contract("BetManager", function (accounts) {
  const [contractOwner, chris, alice] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  //bet 1
  const bookiePaymentAmount1 = web3.utils.toWei('1', 'ether');
  const bookieAmount1 = web3.utils.toWei('1', 'ether');
  const odds1 = 150; //decimal equivalent to 1.5 odds. ie: Bet $100 = $50 return + your stake = $150 total return to pundit.

  beforeEach(async () => {
    instance = await BeTheBookie.new();
    oracle = await SoccerOracle.new();
    await oracle.addMatch(1, "2021-11-01", 1, 2, "A", "B", { from: contractOwner });
    await instance.setOracleAddress(oracle.address);
  });

  it("Is owned by owner", async () => {
    assert.equal(
      await instance.owner.call(),
      contractOwner,
      "owner is not correct",
    );
  });

  it("Bookie Add Liquidity", async () => {
    const tx = await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    const result = await instance.getLiquidityById.call(1);
    const ownedLiquidityResult = await instance.getBookieLiquidity(chris);
    assert.equal(
      result[1],
      1,
      "the matchId does not match the expected value",
    );
    assert.equal(
      result[2],
      1,
      "the sideId does not match the expected value",
    );
    assert.equal(
      result[3],
      bookiePaymentAmount1,
      "the remainingLiquidity does not match the expected value",
    );
    assert.equal(
      result[4],
      odds1,
      "the odds does not match the expected value",
    );
    assert.equal(
      result[5],
      false,
      "the closed does not match the expected value",
    );

    assert.equal(
      ownedLiquidityResult.length,
      1,
      "the ownedLiquidityResult does not match the expected value"
    )

    it("should emit a BookieProvidingLiquidity event when bookie lays a bet", async () => {
      let eventEmitted = false;
      
      if (tx.logs[0].event == "BookieProvidingLiquidity") {
        eventEmitted = true;
      }

      assert.equal(
        eventEmitted,
        true,
        "laying a bet should emit a BookieProvidingLiquidity event",
      );
    });

  });

  it("Bookie Adjust Odds", async () => {
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    const result1 = await instance.getLiquidityById.call(1);
    assert.equal(
      result1[4],
      150,
      "the odds do not match the expected value",
    );


    await instance.adjustOdds(1, 200, { from: chris });
    const result2 = await instance.getLiquidityById.call(1);

    assert.equal(
      result2[4],
      200,
      "the odds do not match the expected value",
    );
    

  });

  //on an evens odds bet. ie: 1:1 it is typical that a bookie will include a spread so they make money no matter what result occurs. 
  //In this case if lay odds 1.95 on both sides (1 ETH liquidity each side) they will lose 1 ETH on 1 result but make 1.05 ETH on the other which is a total of 2.05 ETH. 
  //They profit 0.05 ETH with no risk (assuming they sell both sides to pundits)
  it("Bookie Add Liquidity with 2.5% Spread", async () => {
    await instance.addLiquidity(1, 1, 195, { from: chris, value: bookiePaymentAmount1 });
    await instance.addLiquidity(1, 2, 195, { from: chris, value: bookiePaymentAmount1 });
    const betAmount = web3.utils.toWei('1.052631578947368', 'ether');
    const ownedLiquidityResult = await instance.getBookieLiquidity(chris);
    await instance.placeBet(1, 195, { from: alice, value: betAmount });
    await instance.placeBet(2, 195, { from: alice, value: betAmount });
    const result1 = await instance.getLiquidityById.call(1);
    const result2 = await instance.getLiquidityById.call(2);
    const matchResult = await instance.getMatchLiquidity.call(1);

    assert.equal(
      web3.utils.fromWei(result1[3]),
      0.0000000000000004,
      "the remainingLiquidity does not match the expected value",
    );
    assert.equal(
      web3.utils.fromWei(result2[3]),
      0.0000000000000004,
      "the remainingLiquidity does not match the expected value",
    );

    assert.equal(
      ownedLiquidityResult.length,
      2,
      "the ownedLiquidityResult does not match the expected value"
    )

    assert.equal(
      ownedLiquidityResult[0],
      1,
      "the ownedLiquidityResult does not match the expected value"
    )

    assert.equal(
      ownedLiquidityResult[1],
      2,
      "the ownedLiquidityResult does not match the expected value"
    )

    assert.equal(
      matchResult.length,
      2,
      "the matchResult does not match the expected value"
    )
  });

  it("Placing Bet", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const bookiePayout = web3.utils.toWei('0.5', 'ether');
    const contractBalance = web3.utils.toWei('2', 'ether');
    const remainingLiquidity = web3.utils.toWei('0.5', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    const tx1 = await instance.placeBet(1, odds1, { from: alice, value: betAmount });
    const result = await instance.getBetById.call(1);
    const liquidityObject = await instance.getLiquidityById.call(1);
    const balance = await instance.contractBalance.call();
    const bets = await instance.getActiveBetsByAddress({ from: alice});
    const matchBets = await instance.getMatchBets(1);

    assert.equal(
      result[1],
      1,
      "the liquidityId does not match the expected value",
    );

    assert.equal(
      result[2],
      bookiePayout,
      "the bookieCollateral does not match the expected value",
    );

    assert.equal(
      result[3],
      betAmount,
      "the punditCollateral does not match the expected value",
    );

    assert.equal(
      web3.utils.fromWei(balance),
      web3.utils.fromWei(contractBalance),
      "the contractBalance does not match the expected value",
    );

    assert.equal(
      web3.utils.fromWei(liquidityObject[3]),
      web3.utils.fromWei(remainingLiquidity),
      "the remainingLiquidity does not match the expected value",
    );
    assert.equal(
      liquidityObject[5],
      false,
      "the closed does not match the expected value",
    );

    assert.equal(
      bets.length,
      1,
      "the bets does not match the expected value"
    )

    assert.equal(
      matchBets.length,
      1,
      "the matchBets does not match the expected value"
    )

    it("should emit a BetPlaced event when bookie lays a bet", async () => {
      let eventEmitted = false;
      
      if (tx1.logs[0].event == "BetPlaced") {
        eventEmitted = true;
      }

      assert.equal(
        eventEmitted,
        true,
        "laying a bet should emit a BetPlaced event",
      );
    });
  });


  it("Placing 2 Bets", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, odds1, { from: alice, value: betAmount });
    const liquidity1 = await instance.getLiquidityById.call(1);
    assert.equal(
      liquidity1[5],
      false,
      "the closed does not match the expected value",
    );

    await instance.placeBet(1, odds1, { from: alice, value: betAmount });

    const liquidity2 = await instance.getLiquidityById.call(1);

    const bets = await instance.getActiveBetsByAddress({ from: alice});
    const bookieBets = await instance.getActiveBetsByAddress({ from: chris});

    assert.equal(
      liquidity2[5],
      true,
      "the closed does not match the expected value",
    );

    assert.equal(
      bookieBets.length,
      2,
      "the bookieBets.length does not match the expected value"
    )

    assert.equal(
      bets.length,
      2,
      "the bets.length does not match the expected value"
    )

    assert.equal(
      bets[0],
      2,
      "the bets[0] does not match the expected value"
    )

    assert.equal(
      bets[1],
      1,
      "the bets[1] does not match the expected value"
    )
    
  });

  it("Bookie Won", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, odds1, { from: alice, value: betAmount });
    await oracle.setMatchResult(1, 2, 2, "0-1");

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    const tx1 = await instance.matchCompleteHandlePayouts(1);

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getClosedBetById.call(1);

    let feeWasPaid = (bet[4] > 0);

    assert.equal(
      feeWasPaid,
      true,
      "the feeWasPaid should have been true",
    );

    assert.equal(
      bet[6],
      1,
      "the result does not match the expected value",
    );

    assert.equal(
      aliceBalance1,
      aliceBalance2,
      "the aliceBalance1 does not match aliceBalance2",
    );

    let balanceMatch1 = (chrisBalance1 == chrisBalance2);
      
    assert.equal(
      balanceMatch1,
      false,
      "the chrisBalance1 " + chrisBalance1 + " should not match chrisBalance2" + chrisBalance2,
    );

    let balanceMatch2 = (ownerBalance1 == ownerBalance2);
      
    assert.equal(
      balanceMatch2,
      false,
      "the ownerBalance1 " + ownerBalance1 + " should not match ownerBalance2" + ownerBalance2,
    );

    it("should emit a BetResult event when result is set", async () => {
      let eventEmitted = false;
      
      if (tx1.logs[0].event == "BetResult") {
        eventEmitted = true;
      }

      assert.equal(
        eventEmitted,
        true,
        "laying a bet should emit a BetResult event",
      );
    });
    
  });


  it("Pundit Won", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, 200, { from: chris, value: betAmount });
    await instance.placeBet(1, 200, { from: alice, value: betAmount });
    await oracle.setMatchResult(1, 2, 1, "1-0");

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    await instance.matchCompleteHandlePayouts(1);

    const closedBets = await instance.getInActiveBetsByAddress(alice);

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getClosedBetById.call(1);

    let feeWasPaid = (bet[4] > 0);

    assert.equal(
      closedBets.length,
      1,
      "the closedBets.length does not match the expected value"
    )

    assert.equal(
      feeWasPaid,
      true,
      "the feeWasPaid should have been true",
    );
    
    assert.equal(
      bet[6],
      2,
      "the result does not match the expected value",
    );

    let balanceMatch0 = (aliceBalance1 == aliceBalance2);
      
    assert.equal(
      balanceMatch0,
      false,
      "the aliceBalance1 " + aliceBalance1 + " should match aliceBalance2" + aliceBalance2,
    );

    let balanceMatch1 = (chrisBalance1 == chrisBalance2);
      
    assert.equal(
      balanceMatch1,
      true,
      "the chrisBalance1 " + chrisBalance1 + " should match chrisBalance2" + chrisBalance2,
    );

    let balanceMatch2 = (ownerBalance1 == ownerBalance2);
      
    assert.equal(
      balanceMatch2,
      false,
      "the ownerBalance1 " + ownerBalance1 + " should not match ownerBalance2" + ownerBalance2,
    );
    
  });

  it("Bet VOID", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, odds1, { from: alice, value: betAmount });
    await instance.setOracleAddress(oracle.address);
    await oracle.addMatch(1, "2021-11-01", 1, 2, "A", "B", { from: contractOwner });
    await oracle.setMatchResult(1, 1, 0, "0-0");

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    //await instance.setResult(1, 3, { from: contractOwner, value: 0 });
    await instance.matchCompleteHandlePayouts(1);

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getClosedBetById.call(1);

    let feeWasNotPaid = (bet[4] == 0);

    assert.equal(
      feeWasNotPaid,
      true,
      "the feeWasNotPaid should have been true",
    );
    
    assert.equal(
      bet[6],
      3,
      "the result does not match the expected value",
    );

    let balanceMatch0 = (aliceBalance1 < aliceBalance2);
      
    assert.equal(
      balanceMatch0,
      true,
      "the aliceBalance1 " + web3.utils.fromWei(aliceBalance1) + " should < aliceBalance2 " + web3.utils.fromWei(aliceBalance2),
    );

    let balanceMatch1 = (chrisBalance1 < chrisBalance2);
      
    assert.equal(
      balanceMatch1,
      true,
      "the chrisBalance1 " + web3.utils.fromWei(chrisBalance1) + " should < chrisBalance2 " + web3.utils.fromWei(chrisBalance2),
    );

    let balanceMatch2 = (ownerBalance1 > ownerBalance2);
      
    assert.equal(
      balanceMatch2,
      true,
      "the ownerBalance1 " + web3.utils.fromWei(ownerBalance1) + " should > ownerBalance2 " + web3.utils.fromWei(ownerBalance2),
    );
    
  });


  // it("Refund Liquidity", async () => {
  //   const betAmount = web3.utils.toWei('1', 'ether');
  //   const remainingAmount = web3.utils.toWei('0.5', 'ether');
  //   await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
  //   await instance.placeBet(1, odds1, { from: alice, value: betAmount });


  //   const chrisBalance1 = await web3.eth.getBalance(chris);

  //   await instance.refundLiquidity(1, { from: contractOwner, value: 0 });
  //   const liquidity1 = await instance.getLiquidityById.call(1);

  //   assert.equal(
  //     liquidity1[3],
  //     0,
  //     "the remainingLiquidity value does not match the expected value (0)",
  //   );

  //   assert.equal(
  //     liquidity1[5],
  //     true,
  //     "the closed value does not match the expected value (true)",
  //   );

  //   const chrisBalance2 = await web3.eth.getBalance(chris);

  //   let balanceMatch0 = (chrisBalance1 < chrisBalance2);
      
  //   assert.equal(
  //     balanceMatch0,
  //     true,
  //     "the chrisBalance1 " + web3.utils.fromWei(chrisBalance1) + " should < chrisBalance2 " + web3.utils.fromWei(chrisBalance2),
  //   );

    
  // });

  it("Oracle Test", async () => {
    // oracle = await SoccerOracle.new();
    // await instance.setOracleAddress(oracle.address);
    const result = await instance.testOracleValid();
    assert.equal(
      result,
      true,
      "the result should be true",
    );
  });
  
  
});
