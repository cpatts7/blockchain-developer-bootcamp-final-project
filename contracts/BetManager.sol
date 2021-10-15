// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16 <0.9.0;
import "./safemath.sol";
/// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract BetManager {

    address payable public owner;
    uint256 betCounter;
    uint256 liquidityCounter;
    uint minBet = 0.001 ether;
    uint minLiquidity = 0.001 ether;

    Bet[] public bets;
    mapping (uint256 => uint) private betMapping;

    Liquidity[] public betPools;
    mapping (uint256 => uint) private poolMapping;
    
    enum MatchResult{ Undecided, BookieWon, PunditWon, Void }

    event BookieProvidingLiquidity(uint256 id);
    event BetPlaced(uint256 id);
    event BetResult(uint256 id);

//Structure representing a bet with 2 parties involved. The Pundit and the Bookie. The bookie placed odds and liquidity and the pundit took a position. 
//The payout will go to either the Pundit or the Bookie when the result is decided. There is a 1% fee taken off the profits paid to the contract owner.
    struct Bet {
        uint256 id;
        uint256 liquidityId;
        uint bookiePayout; //this is profit the bookie stands to make on their bet.
        uint punditPayout; //this the profit the pundit makes on their bet.
        address payable pundit; //account taking a punt on this outcome (they want to win)
        MatchResult result;
    }

//Structure representing betting liquidity on a certain match/player/odds. ie: As a bookie I can lay odds on Federer to beat Nadal at 200 (even payout).
//The bookie can post the total liquidity they are willing to expose themselves to; ie: 10 ETH and as bets are placed the available liquidty will decrease until it reaches 0.
//With these odds, pundits (people taking a bet) can take a position on these odds. ie: 1ETH. 
//The pundit hopes Federer wins as they will receive 2 ETH in return whereas the bookie hopes Nadal wins as they receive the bet amount + the liquidity they provided. 2 ETH as well.
//Odds can range from 101 to 10000. 101 is equivalent to 1.01 * stake and 10000 is 100 * stake. 
//Once a bet is placed it is final and will require an outcome.
    struct Liquidity {
        uint256 id;
        address payable bookie; //account laying the odds (they do not want this bet to pay out)
        uint matchId; //each match will have a unique id
        uint sideId; //will need to choose the winning side of the match
        uint remainingLiquidity;
        uint256 odds; // 1.50 odds would be stored as 150 (*100).
        bool closed;
    }


      /* 
   * Modifiers
   */

  // Create a modifer, `isOwner` that checks if the msg.sender is the owner of the contract
  function isOwner() public view returns(bool) {
    return msg.sender == owner;
  }


    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    // otherwise, the sender's money is transferred to contract
    function () external payable {
        revert();
    }

    constructor() public {
        owner = msg.sender;
    }

    /// @notice Public function for a bookie to place odds on a match result and submit available liquidity. ie: Federer to beat Nadal, 200 odds with 10ETH max payout.
    /// @param _matchId The unique ID of a match (ie: Federer vs Nadal at 2018 Wimbledon final)
    /// @param _sideId The perspective winning side, ie: Federer. (unique ID from the source JSON data)
    /// @param _odds The odds. ie: 150 = decimal equivalent odds at 1.5. 200 = 2. Payout formula is basically _odds/100 * stake. 
                    //ie: 150/100 * 1ETH = 0.5ETH payout + your original stake = 1.5ETH return. 
    /// @return _id returns unique ID of the new liquidity object.
    function addLiquidity(uint _matchId, uint _sideId, uint256 _odds) public payable returns (uint _id)
    {
        require(_odds > 100);
        require(_odds < 10001);
        require(msg.value >= minLiquidity);

        _id = ++liquidityCounter;

        betPools.push(Liquidity({
            id: _id,
            bookie: msg.sender,
            matchId: _matchId, 
            sideId: _sideId,
            remainingLiquidity: msg.value,
            odds: _odds, 
            closed: false
            }));

        poolMapping[_id] = _id-1;

        emit BookieProvidingLiquidity(_id);

    }

/// @notice Public function allowing a pundit to place a bet leveraging existing liquidity in a market/odds.
/// @dev poolRequired is somewhat complex as depending on the stake, the payout has to be calculated on the fly and deducted from the pool of liquidity. 
/// @param _liquidityId pointer to available liquidity. The msg.amount is the stake.
/// @return _id - returns unique ID of the new bet object.
    function placeBet(uint256 _liquidityId) public payable returns (uint256 _id)
    {
        require(msg.value >= minBet);
        
        Liquidity storage _l = betPools[poolMapping[_liquidityId]];
        require(_l.closed == false);

        uint256 poolRequired = SafeMath.div(SafeMath.mul(msg.value, _l.odds), 100)-msg.value;
        require(_l.remainingLiquidity >= poolRequired);

        _id = ++betCounter;

        bets.push(Bet({
            id: _id,
            liquidityId: _liquidityId, 
            bookiePayout: msg.value, //the amount paid to the bookie if they win (they will get their collateral back as well)
            punditPayout: poolRequired, //the amount paid to the pundit if they win (they also get their stake back)
            pundit: msg.sender,
            result: MatchResult.Undecided
            }));

        betMapping[_id] = _id-1;

        _l.remainingLiquidity = SafeMath.sub(_l.remainingLiquidity, poolRequired);
        if (_l.remainingLiquidity == 0)
        {
            _l.closed = true;
        }

        emit BetPlaced(_id);

    }

/// @notice called by the contract owner to set the result of a given bet. This should be handled by an oracle in the future so there is no manual intervention required. 
/// @dev The payout structure depends on who wins but either the pundit or bookie gets paid - 1% of profits as a fee.
/// @param _betId - unique id of the bet
/// @param _result - result of the match. Determines how the bet pays out.
/// @return _success true if no errors.
    function setResult(uint256 _betId, MatchResult _result) public payable returns (bool _success) {
        require(isOwner());
        require(msg.value == 0);

        Bet storage _bet = bets[betMapping[_betId]];
        Liquidity storage _l = betPools[poolMapping[_bet.liquidityId]];
        require(_bet.result == MatchResult.Undecided);

        _bet.result = _result;

        if (_result == MatchResult.BookieWon)
        {
            uint256 fee = SafeMath.div(_bet.bookiePayout, 100);
            uint256 payout = _bet.bookiePayout + _bet.punditPayout - fee;
            _l.bookie.transfer(payout);
            owner.transfer(fee);
        }
        else if (_result == MatchResult.PunditWon)
        {
            uint256 fee = SafeMath.div(_bet.punditPayout, 100);
            uint256 payout = _bet.bookiePayout + _bet.punditPayout - fee;
            _bet.pundit.transfer(payout);
            owner.transfer(fee);
        }
        else if (_result == MatchResult.Void)
        {
            //refund their money as the match was cancelled
            _l.bookie.transfer(_bet.punditPayout);
            _bet.pundit.transfer(_bet.bookiePayout);
        }

        _success = true;
        emit BetResult(_betId);
    }

    function refundLiquidity(uint _id) public payable returns (bool _result) {
        require(isOwner());
        require(msg.value == 0);
        Liquidity storage _l = betPools[poolMapping[_id]];
        require(!_l.closed);
        
        _l.closed = true;
        uint refund = _l.remainingLiquidity;
        _l.remainingLiquidity = 0;
        _l.bookie.transfer(refund);
        _result = true;
    }

    function getLiquidityById(uint _id) public view returns (uint matchId, uint sideId, uint256 remainingLiquidity, bool closed)
    {
        Liquidity storage _l = betPools[poolMapping[_id]];
        matchId = _l.matchId;
        sideId = _l.sideId;
        remainingLiquidity = _l.remainingLiquidity;
        closed = _l.closed;
        return (matchId, sideId, remainingLiquidity, closed);
    }

    function getBetById(uint _id) public view returns (uint256 liquidityId, uint bookiePayout, uint punditPayout, address pundit, MatchResult result)
    {
        Bet storage bet = bets[betMapping[_id]];
        liquidityId = bet.liquidityId;
        bookiePayout = bet.bookiePayout;
        punditPayout = bet.punditPayout;
        pundit = bet.pundit;
        result = bet.result;
        return (liquidityId, bookiePayout, punditPayout, pundit, result);
    }


    function contractBalance() public view returns (uint256 _balance) {
        _balance = address(this).balance;
    }

}

