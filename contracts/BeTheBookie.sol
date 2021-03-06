// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16 <0.9.0;
import "./safemath.sol";
import "./Ownable.sol";
import "./OracleInterface.sol";
import "./SoccerOracle.sol";
/// @title A title that should describe the contract/interface
/// @author Chris Patterson
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract BeTheBookie is Ownable {

    address payable private ownerPayable;
    bool contractPaused;
    uint256 betCounter;
    uint minBet = 0.001 ether;
    uint256 liquidityCounter;
    uint minLiquidity = 0.001 ether;

    address internal soccerOracleAddr = address(0);
    OracleInterface internal oracle = OracleInterface(soccerOracleAddr);

    Bet[] public bets;
    mapping (uint256 => uint) betMapping; //id -> index
    
    //mapping of pundit bets to an address
    mapping (address => uint256[]) addressBetsMapping; 

    //Collection of liquidity provided by the bookmakers of the app.
    Liquidity[] public betPools;

    //Mapping of the Liquidity ID to the index in the betPools array.
    mapping (uint256 => uint) poolMapping; //id -> index

    //mapping of bookie liquidity to an address
    mapping (address => uint256[]) bookieLiquidityMapping; 

    //mapping of the unique match id's to provided liquidity. Used to be able to filter for available bets without downloading the entire dataset.
    mapping (uint256 => uint256[]) matchLiquidityMapping; 
    //mapping of the unique match id's to bets. It is needed to be able to find all bets for a given match on the client. 
    mapping (uint256 => uint256[]) matchBetMapping; 
    
    //Enum representing the various types of results for a bet.
    enum MatchResult{ Undecided, BookieWon, PunditWon, Void }

    //Mapping of an address to a bool if they chose to exclude themselves from the contract.
    mapping (address => bool) exclusionList;

/// @notice Raises an event that a new liquidity / market has been provided to pundits.
/// @dev Will be used by the GUI as a trigger to reload the screen
/// @param id the liquidityId
    event BookieProvidingLiquidity(uint256 id);

/// @notice Raised when a bet is placed. 
/// @dev Will be used by the GUI as a trigger to reload the screen
/// @param id new unique bet id
    event BetPlaced(uint256 id);

/// @notice Explain to an end user what this does
/// @dev Will be used by the GUI as a trigger to reload the screen to show if they won or not.
/// @param id bet id
    event BetResult(uint256 id);

//Structure representing a bet with 2 parties involved. The Pundit and the Bookie. The bookie placed odds and liquidity and the pundit took a position. 
//The payout will go to either the Pundit or the Bookie when the result is decided. There is a 1% fee taken off the profits paid to the contract owner.
    struct Bet {
        uint256 id;
        uint256 liquidityId;
        uint256 bookieCollateral;
        uint256 punditCollateral;
        uint256 bookiePayout; 
        uint256 punditPayout; 
        uint256 feePaid;
        address payable bookie; // bookie address copied from the liquidity object
        address payable pundit; //account taking a punt on this outcome (they want to win)
        uint odds; //odds at the time of bet.
        MatchResult result;
        uint createdTime;
        uint closedTime;
        bool closed;
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
        uint256 remainingLiquidity;
        uint odds; // 1.50 odds would be stored as 150 (*100).
        bool closed;
        uint createdTime;
        uint closedTime;
    }


    
/// @notice Returns true/false depending if the address is in the exclusion list or not.
/// @return Returns true/false
  function isNotExcluded() public view returns(bool) {
    return !exclusionList[msg.sender];
  }

    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    // otherwise, the sender's money is transferred to contract
    function () external payable {
        revert();
    }

/// @notice Main constructor for the contract. Set's the owner to the sender.
    constructor() public {
        ownerPayable = msg.sender;
    }

/// @notice This function is for the owner to put the contract in a paused state if there is a flaw that needs to be investigated. It will stop new money from being sent to the contract.
/// @dev Only applies to the placeBet / addLiquidity functions
/// @param paused switch to enable/disable the contract.
/// @return bool - returns current paused state.
    function setContractState(bool paused) public onlyOwner returns (bool)
    {
        contractPaused = paused;
        return contractPaused;
    }

/// @notice Gambling addiction is a real problem and this option allows people to self exclude from the platform should they feel they are participating in an unhealthly way.
/// @return _excluded returns true when added.
    function selfExclude() public returns (bool _excluded)
    {
        require(isNotExcluded()); //no point executing this function twice.
        _excluded = true;
        exclusionList[msg.sender] = _excluded;
    }

/// @notice Returns the total contract balance in this contract.
    function contractBalance() public view returns (uint256 _balance) {
        _balance = address(this).balance;
    }

/// @notice Called after creation to link this contract to the appropriate Oracle that provides the matches/scores.
/// @param _address of the Oracle
/// @return returns bool - the oracle will return true if setup properly.
    function setOracleAddress(address _address) public onlyOwner returns (bool) {
        soccerOracleAddr = _address;
        oracle = OracleInterface(soccerOracleAddr);
        return oracle.Validate();
    }
    
    /// @notice Calls the validation method on the oracle to prove it is connected.
    /// @return Returns true/false based on if the oracle is setup.
    function testOracleValid() public view returns (bool) {
        return oracle.Validate();
    }

/// @notice Public function allowing a pundit to place a bet leveraging existing liquidity in a market/odds.
/// @dev bookieCollateral is somewhat complex as depending on the stake, the payout has to be calculated on the fly and deducted from the pool of liquidity. 
/// @param _liquidityId pointer to available liquidity. The msg.amount is the stake.
/// @return _id - returns unique ID of the new bet object.
    function placeBet(uint256 _liquidityId, uint _odds) public payable returns (uint256 _id)
    {
        require(!contractPaused);
        require(isNotExcluded()); //ensure the participant has not chosed to self exclude from the platform
        require(msg.value >= minBet);
        
        Liquidity storage _l = betPools[poolMapping[_liquidityId]];
        require(_l.closed == false);
        require(msg.sender != _l.bookie);
        require(_l.odds == _odds); //possible the bookie might adjust the odds before a bet has been placed. Confirm they match.

        uint256 bookieCollateral = SafeMath.div(SafeMath.mul(msg.value, _odds), 100)-msg.value;
        require(_l.remainingLiquidity >= bookieCollateral);

        (uint256 id, 
        string memory match_date, 
        uint256 team1_id,
        uint256 team2_id,
        string memory team1_name,
        string memory team2_name,
        bool pending) = oracle.getMatch(_l.matchId);

        require(pending);

        _id = ++betCounter;

        bets.push(Bet({
            id: _id,
            liquidityId: _liquidityId, 
            bookieCollateral: bookieCollateral,
            punditCollateral: msg.value,
            bookiePayout: 0, 
            punditPayout: 0, 
            feePaid: 0,
            pundit: msg.sender,
            bookie: _l.bookie,
            odds: _odds,
            result: MatchResult.Undecided, 
            createdTime: block.timestamp,
            closedTime: 0,
            closed: false
            }));

        betMapping[_id] = _id-1;
        addressBetsMapping[msg.sender].push(_id);
        addressBetsMapping[_l.bookie].push(_id);
        matchBetMapping[_l.matchId].push(_id);

        _l.remainingLiquidity = SafeMath.sub(_l.remainingLiquidity, bookieCollateral);
        if (_l.remainingLiquidity == 0)
        {
            _l.closed = true;
        }

        emit BetPlaced(_id);

    }

/// @notice Called after a match result has been set in the Oracle by the owner. Handles all the payouts depending on the result. Also refunds any excess liquidity where bets have not been placed.
/// @param _matchId a parameter just like in doxygen (must be followed by parameter name)
/// @return _success returns true if successfully completed.
    function matchCompleteHandlePayouts(uint256 _matchId) public payable onlyOwner returns (bool _success) {
        require(msg.value == 0);
        (OracleInterface.ResultType _type,uint256 winning_team_id,uint256 result_time)  = oracle.getMatchResult(_matchId);
        require(_type != OracleInterface.ResultType.Undecided);

        for (uint i = 0; i < matchBetMapping[_matchId].length; i++)
        {
            Bet storage _bet = bets[betMapping[matchBetMapping[_matchId][i]]];
            if (_bet.closed || _bet.result != MatchResult.Undecided) //double check to ensure the bet is still open.
                {continue;}

            Liquidity storage _l = betPools[poolMapping[_bet.liquidityId]];

            MatchResult _result = MatchResult.BookieWon;
            if (_type == OracleInterface.ResultType.Void)
                _result = MatchResult.Void;
            else if (_l.sideId == winning_team_id)
                _result = MatchResult.PunditWon;
            
            setResult(_bet.id, _result);
        }

        for (uint j = 0; j < matchLiquidityMapping[_matchId].length; j++)
        {
            Liquidity storage _l = betPools[poolMapping[matchLiquidityMapping[_matchId][j]]];
            if (_l.closed || _l.remainingLiquidity == 0)
                { continue; }
            refundLiquidity(_l.id);
        }
        

        _success = true;
    }


/// @notice called internally by the contract owner to set the result of a given bet.  
/// @dev The payout structure depends on who wins but either the pundit or bookie gets paid - 1% of profits as a fee.
/// @param _betId - unique id of the bet
/// @param _result - result of the match. Determines how the bet pays out.
/// @return _success true if no errors.
    function setResult(uint256 _betId, MatchResult _result) public payable onlyOwner returns (bool _success) {
        require(msg.value == 0);

        Bet storage _bet = bets[betMapping[_betId]];
        require(_bet.closed == false);
        require(_bet.result == MatchResult.Undecided);

        _bet.result = _result;
        _bet.closedTime = block.timestamp;
        _bet.closed = true;

        uint256 fee;
        if (_result == MatchResult.BookieWon)
        {
            fee = SafeMath.div(_bet.punditCollateral, 100);
            uint256 payout = _bet.punditCollateral + _bet.bookieCollateral - fee;
            _bet.bookiePayout = payout;
            _bet.bookie.transfer(payout);
        }
        else if (_result == MatchResult.PunditWon)
        {
            fee = SafeMath.div(_bet.bookieCollateral, 100);
            uint256 payout = _bet.punditCollateral + _bet.bookieCollateral - fee;
            _bet.punditPayout = payout;
            _bet.pundit.transfer(payout);
        }
        else if (_result == MatchResult.Void)
        {
            //refund their money as the match was cancelled
            _bet.bookiePayout = _bet.bookieCollateral;
            _bet.punditPayout = _bet.punditCollateral;
            _bet.bookie.transfer(_bet.bookieCollateral);
            _bet.pundit.transfer(_bet.punditCollateral);
        }

        if (fee > 0)
        {
            _bet.feePaid = fee;
            ownerPayable.transfer(fee);
        }

        _success = _bet.closed;
        emit BetResult(_betId);
    }

/// @notice used by the GUI to display current bets for active user
/// @return uint256[] - list of bet ID's owned by the msg.sender
    function getActiveBetsByAddress(address a, bool asBookie) external view returns (uint256[] memory)
    {
        uint256[] memory _bets = addressBetsMapping[a];
        return getActiveBetsByAddressAndStatus(_bets, a, asBookie, false);
    }

/// @notice used by the GUI to display closed bets for active user
/// @return uint256[] - list of bet ID's owned by the msg.sender
    function getInActiveBetsByAddress(address a, bool asBookie) external view returns (uint256[] memory)
    {
        uint256[] memory _bets = addressBetsMapping[a];
        return getActiveBetsByAddressAndStatus(_bets, a, asBookie, true);
    }

/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
/// @param _bets - collection of bets to filter
/// @param asBookie -  determines the address to filter on (bookie or pundit)
/// @param isClosed - filter to bring back open/closed bets
/// @return uint256[] list of bet ID's owned by the msg.sender
    function getActiveBetsByAddressAndStatus(uint256[] memory _bets, address a, bool asBookie, bool isClosed) private view returns (uint256[] memory)
    {
        uint count = 0; 

        //get count of pending matches 
        for (uint i = 0; i < _bets.length; i++) {
            Bet storage _bet = bets[i];
            if (_bet.closed == isClosed && 
                    ((asBookie && _bet.bookie == a) 
                    || (!asBookie && _bet.pundit == a))
                ) 
                count++; 
        }

        //collect up all the pending matches
        uint256[] memory output = new uint256[](count); 

        if (count > 0) {
            uint index = 0;
            for (uint n = _bets.length; n > 0; n--) {
                Bet storage _bet = bets[n-1];
                if (_bet.closed == isClosed) 
                    output[index++] = _bet.id;
            }
        } 

        return output;
    }

/// @notice Returns all important properties of a bet by it's ID
/// @param _id Bet.ID
/// @return properties of the bet.
    function getBetById(uint256 _id) external view returns (uint256 matchId, uint256 sideId, uint256 odds, uint256 bookieCollateral, uint256 punditCollateral,  MatchResult result, uint256 bookiePayout, uint256 punditPayout, uint256 feePaid, uint lastUpdateTime, bool closed)
    {
        Bet storage bet = bets[betMapping[_id]];
        Liquidity storage _l = betPools[poolMapping[bet.liquidityId]];
        
        matchId = _l.matchId;
        sideId = _l.sideId;
        odds = bet.odds;
        bookieCollateral = bet.bookieCollateral;
        punditCollateral = bet.punditCollateral;
        result = bet.result;
        bookiePayout = bet.bookiePayout;
        punditPayout = bet.punditPayout;
        feePaid = bet.feePaid;
        lastUpdateTime = bet.createdTime;
        if (bet.closedTime > 0)
            lastUpdateTime = bet.closedTime;
        closed = bet.closed;
        return (matchId, sideId, odds, bookieCollateral, punditCollateral, result, bookiePayout, punditPayout, feePaid, lastUpdateTime, closed);
    }

    /// @notice Public function for a bookie to place odds on a match result and submit available liquidity. ie: Federer to beat Nadal, 200 odds with 10ETH max payout.
    /// @param _matchId The unique ID of a match (ie: Federer vs Nadal at 2018 Wimbledon final)
    /// @param _sideId The perspective winning side, ie: Federer. (unique ID from the source JSON data)
    /// @param _odds The odds. ie: 150 = decimal equivalent odds at 1.5. 200 = 2. Payout formula is basically _odds/100 * stake. 
                    //ie: 150/100 * 1ETH = 0.5ETH payout + your original stake = 1.5ETH return. 
    /// @return _id returns unique ID of the new liquidity object.
    function addLiquidity(uint _matchId, uint _sideId, uint256 _odds) public payable returns (uint _id)
    {
        require(!contractPaused);
        require(isNotExcluded()); //ensure the participant has not chosed to self exclude from the platform
        require(_odds > 100);
        require(_odds < 10001);
        require(msg.value >= minLiquidity);

        (uint256 id, 
        string memory match_date, 
        uint256 team1_id,
        uint256 team2_id,
        string memory team1_name,
        string memory team2_name,
        bool pending) = oracle.getMatch(_matchId);

        require(pending);
        require(_sideId == 0 || _sideId == team1_id || _sideId == team2_id);

        _id = ++liquidityCounter;

        betPools.push(Liquidity({
            id: _id,
            bookie: msg.sender,
            matchId: _matchId, 
            sideId: _sideId,
            remainingLiquidity: msg.value,
            odds: _odds, 
            closed: false,
            createdTime: block.timestamp,
            closedTime: 0
            }));

        poolMapping[_id] = _id-1;
        bookieLiquidityMapping[msg.sender].push(_id);
        matchLiquidityMapping[_matchId].push(_id);

        emit BookieProvidingLiquidity(_id);

    }

/// @notice Allows the bookie to adjust their odds for a given liquidity object.
/// @param _liquidityId Liquidity.ID
/// @param _odds New odds.
/// @return bool - true if successful.
    function adjustOdds(uint _liquidityId, uint _odds) public returns (bool _result) {
        require(!contractPaused);
        require(_odds > 100);
        require(_odds < 10001);

        Liquidity storage _l = betPools[poolMapping[_liquidityId]];
        require(msg.sender == _l.bookie);
        require(!_l.closed);
        require(_l.remainingLiquidity > 0);
        require(_l.odds != _odds); //no point in performing the change if the values match.

        _l.odds = _odds;
        _result = true;
    }


/// @notice Returns unused liqudity to the bookie after a match is over or if they cancel in the GUI.
/// @param _id liqudity id
/// @return _result true if no errors
    function refundLiquidity(uint _id) public payable returns (bool _result) {
        require(msg.value == 0);
        Liquidity storage _l = betPools[poolMapping[_id]];
        require(isOwner() || msg.sender == _l.bookie);
        require(!_l.closed);
        
        _l.closed = true;
        uint refund = _l.remainingLiquidity;
        _l.remainingLiquidity = 0;
        _l.bookie.transfer(refund);
        _result = true;
    }

/// @notice Used by the GUI to return all bookie liquidity items for tracking purpose.
/// @return uint256[] - list of liquidity ID's owned by the msg.sender
    function getBookieLiquidity(address bookie) external view returns (uint256[] memory)
    {
        uint256[] memory response = bookieLiquidityMapping[bookie];
        return response;
    }

/// @notice Returns all available liquidity that a pundit can bet on. Used by the GUI to show the user all the bets they could take.
/// @return uint256[] - returns all liquidty ID's where they are still valid.
    function getAllAvailableLiquidity() external view returns (uint256[] memory) {
        uint count = 0; 

        //get count of available liquidity 
        for (uint i = 0; i < betPools.length; i++) {
            Liquidity storage _l = betPools[i];
            if (_l.closed == false) 
                count++; 
        }

        //collect up all the pending matches
        uint256[] memory output = new uint256[](count); 

        if (count > 0) {
            uint index = 0;
            for (uint n = betPools.length; n > 0; n--) {
                Liquidity storage _l = betPools[n-1];
                if (_l.closed == false) 
                    output[index++] = _l.id;
            }
        } 

        return output;
    }

/// @notice Returns all useful properites of the liquidity object to the GUI
/// @param _id liqudity.id
/// @return returns all useful properites of the liquidity object to the GUI
    function getLiquidityById(uint _id) external view returns (uint id, uint matchId, uint sideId, uint256 remainingLiquidity, uint odds, bool closed, uint createdTime)
    {
        Liquidity storage _l = betPools[poolMapping[_id]];
        id = _l.id;
        matchId = _l.matchId;
        sideId = _l.sideId;
        remainingLiquidity = _l.remainingLiquidity;
        odds = _l.odds;
        closed = _l.closed;
        createdTime = _l.createdTime;
        return (id, matchId, sideId, remainingLiquidity, odds, closed, createdTime);
    }

}

