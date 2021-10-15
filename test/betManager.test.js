
const { catchRevert } = require("./exceptionsHelpers.js");
var BetManager = artifacts.require("./BetManager.sol");

contract("BetManager", function (accounts) {
  const [contractOwner, chris, alice] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  //bet 1
  const bookiePaymentAmount1 = web3.utils.toWei('1', 'ether');
  const bookieAmount1 = web3.utils.toWei('1', 'ether');
  const odds1 = 150; //decimal equivalent to 1.5 odds. ie: Bet $100 = $50 return + your stake = $150 total return to pundit.

  beforeEach(async () => {
    instance = await BetManager.new();
  });

  it("Tests have been initialised successfully.", async() => {
    const eth100 = 100e18;
    assert.equal(await web3.eth.getBalance(chris), eth100.toString());
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
    assert.equal(
      result[0],
      1,
      "the matchId does not match the expected value",
    );
    assert.equal(
      result[1],
      1,
      "the sideId does not match the expected value",
    );
    assert.equal(
      result[2],
      bookiePaymentAmount1,
      "the remainingLiquidity does not match the expected value",
    );
    assert.equal(
      result[3],
      false,
      "the closed does not match the expected value",
    );

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

  it("Placing Bet", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const bookiePayout = web3.utils.toWei('0.5', 'ether');
    const contractBalance = web3.utils.toWei('2', 'ether');
    const remainingLiquidity = web3.utils.toWei('0.5', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    const tx1 = await instance.placeBet(1, { from: alice, value: betAmount });
    const result = await instance.getBetById.call(1);
    const liquidityObject = await instance.getLiquidityById.call(1);
    const balance = await instance.contractBalance.call();

    assert.equal(
      result[0],
      1,
      "the liquidityId does not match the expected value",
    );

    assert.equal(
      result[1],
      betAmount,
      "the bookiePayout does not match the expected value",
    );

    assert.equal(
      result[2],
      bookiePayout,
      "the punditPayout does not match the expected value",
    );

    assert.equal(
      web3.utils.fromWei(balance),
      web3.utils.fromWei(contractBalance),
      "the contractBalance does not match the expected value",
    );

    assert.equal(
      web3.utils.fromWei(liquidityObject[2]),
      web3.utils.fromWei(remainingLiquidity),
      "the remainingLiquidity does not match the expected value",
    );
    assert.equal(
      liquidityObject[3],
      false,
      "the closed does not match the expected value",
    );

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
    await instance.placeBet(1, { from: alice, value: betAmount });
    const liquidity1 = await instance.getLiquidityById.call(1);

    assert.equal(
      liquidity1[3],
      false,
      "the closed does not match the expected value",
    );

    await instance.placeBet(1, { from: alice, value: betAmount });

    const liquidity2 = await instance.getLiquidityById.call(1);

    assert.equal(
      liquidity2[3],
      true,
      "the closed does not match the expected value",
    );
    
  });

  it("Bookie Won", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, { from: alice, value: betAmount });

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    await instance.setResult(1, 1, { from: contractOwner, value: 0 });

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getBetById.call(1);

    assert.equal(
      bet[4],
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
    
  });


  it("Pundit Won", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, { from: alice, value: betAmount });

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    await instance.setResult(1, 2, { from: contractOwner, value: 0 });

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getBetById.call(1);
    
    assert.equal(
      bet[4],
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
    await instance.placeBet(1, { from: alice, value: betAmount });

    const ownerBalance1 = await web3.eth.getBalance(contractOwner);
    const chrisBalance1 = await web3.eth.getBalance(chris);
    const aliceBalance1 = await web3.eth.getBalance(alice);

    await instance.setResult(1, 3, { from: contractOwner, value: 0 });

    const ownerBalance2 = await web3.eth.getBalance(contractOwner);
    const chrisBalance2 = await web3.eth.getBalance(chris);
    const aliceBalance2 = await web3.eth.getBalance(alice);

    const bet = await instance.getBetById.call(1);
    
    assert.equal(
      bet[4],
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


  it("Refund Liquidity", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const remainingAmount = web3.utils.toWei('0.5', 'ether');
    await instance.addLiquidity(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    await instance.placeBet(1, { from: alice, value: betAmount });


    const chrisBalance1 = await web3.eth.getBalance(chris);

    await instance.refundLiquidity(1, { from: contractOwner, value: 0 });
    const liquidity1 = await instance.getLiquidityById.call(1);

    assert.equal(
      liquidity1[2],
      0,
      "the remainingLiquidity value does not match the expected value (0)",
    );

    assert.equal(
      liquidity1[3],
      true,
      "the closed value does not match the expected value (true)",
    );

    const chrisBalance2 = await web3.eth.getBalance(chris);

    let balanceMatch0 = (chrisBalance1 < chrisBalance2);
      
    assert.equal(
      balanceMatch0,
      true,
      "the chrisBalance1 " + web3.utils.fromWei(chrisBalance1) + " should < chrisBalance2 " + web3.utils.fromWei(chrisBalance2),
    );

    
  });
  
});
