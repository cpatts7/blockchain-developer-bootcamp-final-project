const { catchRevert } = require("./exceptionsHelpers.js");
var SoccerOracle = artifacts.require("./SoccerOracle.sol");

contract("SoccerOracle", function (accounts) {
  const [contractOwner, test1] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  

  beforeEach(async () => {
    instance = await SoccerOracle.new();
  });

  it("Is owned by owner", async () => {
    assert.equal(
      await instance.owner.call(),
      contractOwner,
      "owner is not correct",
    );
  });


  it("Add Match", async () => {
    await instance.addMatch(100, "2021-11-01", 1, 2, "A", "B", { from: contractOwner });
    const result = await instance.getAvailableMatches();
    const matchResult = await instance.getMatch(100);

    assert.equal(
        result.length,
        1,
        "the number of matches should be 1"
      );

      assert.equal(
        result[0],
        100,
        "the first match id should be 100"
      );

    
      assert.equal(
        matchResult.match_date,
        "2021-11-01",
        "the match_date does not equate"
      );

      assert.equal(
        matchResult.team1_id,
        1,
        "the team1_id does not equate"
      );

      assert.equal(
        matchResult.team2_id,
        2,
        "the team2_id does not equate"
      );

      assert.equal(
        matchResult.team1_name,
        "A",
        "the team1_name does not equate"
      );

      assert.equal(
        matchResult.team2_name,
        "B",
        "the team2_name does not equate"
      );

      assert.equal(
        matchResult.pending,
        true,
        "the result does not equate"
      );
    
  });

  it("Set Match Result", async () => {
    await instance.addMatch(100, "2021-11-01", 1, 2, "A", "B", { from: contractOwner });
    await instance.setMatchResult(100, 2, 1);
    const matchResult = await instance.getMatchResult(100);
    assert.equal(
        matchResult.result,
        2,
        "the result does not equate"
      );
      assert.equal(
        matchResult.winning_team_id,
        1,
        "the winning_team_id does not equate"
      );
      
  });

  it("Set Match Result - VOID", async () => {
    await instance.addMatch(100, "2021-11-01", 1, 2, "A", "B", { from: contractOwner });
    await instance.setMatchResult(100, 1, 0);
    const matchResult = await instance.getMatchResult(100);
    assert.equal(
        matchResult.result,
        1,
        "the result does not equate"
      );
      
      
  });

});