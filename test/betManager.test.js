
const { catchRevert } = require("./exceptionsHelpers.js");
var BetManager = artifacts.require("./BetManager.sol");

contract("BetManager", function (accounts) {
  const [contractOwner, chris] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  //bet 1
  const bookiePaymentAmount1 = web3.utils.toWei('1', 'ether');
  const bookieAmount1 = web3.utils.toWei('1', 'ether');
  const punditAmount1 = web3.utils.toWei('2', 'ether');
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

  it("Bookie Place Bet (1)", async () => {
    const tx = await instance.bookieLayOdds(1, 1, odds1, { from: chris, value: bookiePaymentAmount1 });
    const result = await instance.getBetById.call(1);
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
      bookieAmount1,
      "the bookieAmount does not match the expected value",
    );

    it("should emit a BookieLayingOdds event when bookie lays a bet", async () => {
      let eventEmitted = false;
      
      if (tx.logs[0].event == "BookieLayingOdds") {
        eventEmitted = true;
      }

      assert.equal(
        eventEmitted,
        true,
        "laying a bet should emit a BookieLayingOdds event",
      );
    });

  });



  
});
