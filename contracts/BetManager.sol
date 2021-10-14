// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16 <0.9.0;

contract BetManager {

    address public owner;
    uint256 betCounter;

    Bet[] public bets;
    mapping (uint256 => uint) private betMapping;
    
    enum State{ NeedPundit, NeedBookie, Matched }
    enum MatchResult{ Undecided, BookieWon, PunditWon }

    event BookieLayingOdds(uint256 id);
    event PunditLookingForBookie(uint256 id);
    event BetFinalized(uint256 id);

    struct Bet {
        uint256 id;
        uint matchId; //each match will have a unique id
        uint sideId; //will need to choose the winning side of the match
        uint amount;
        uint256 odds; // 1.50 odds would be stored as 150 (*100).
        bool sold;
        State state;
        MatchResult result;
        address bookie; //account laying the odds (they do not want this bet to pay out)
        address pundit; //account taking a punt on this outcome (they want to win)
    }

    function isOwner() public view returns(bool) {
        return msg.sender == owner;
    }

    constructor() public {
        owner = msg.sender;
    }

    modifier verifyCaller (address _address) { 
        require(isOwner());
        _;
    }

    function BookieLayOdds(uint _matchId, uint _sideId, uint256 _odds) public payable returns (uint _id)
    {
        //require(msg.value >= 
        _id = CreateBet(_matchId, _sideId, _odds, msg.value, State.NeedPundit, msg.sender, address(0));
        emit BookieLayingOdds(_id);
    }

    function PunditPlaceOpenBet(uint _matchId, uint _sideId, uint256 _odds) public payable returns (uint _id)
    {
        //require(msg.value >= 
        _id = CreateBet(_matchId, _sideId, _odds, msg.value, State.NeedBookie, address(0), msg.sender);
        emit PunditLookingForBookie(_id);
    }

    function CreateBet(uint _matchId, uint _sideId, uint256 _odds, uint _amount, State _state, address _bookie, address _pundit) private returns (uint) {
        uint _betId = ++betCounter;

        bets.push(Bet({
            id: _betId,
            matchId: _matchId, 
            sideId: _sideId,
            amount: _amount,
            odds: _odds, 
            state: _state, 
            bookie: _bookie, 
            pundit: _pundit,
            sold: false,
            result: MatchResult.Undecided
            }));

        betMapping[_betId] = _betId-1;

        return _betId;
    }

    function PunditTakeBet(uint _betId) public payable returns (bool) {
        require(bets[betMapping[_betId]].state == State.NeedPundit);
        require(bets[betMapping[_betId]].sold == false);
        require(bets[betMapping[_betId]].result == MatchResult.Undecided);

        bets[betMapping[_betId]].pundit = msg.sender;
        bets[betMapping[_betId]].sold = true;

        emit BetFinalized(_betId);
        return true;
    }

    function BookieTakeBet(uint _betId) public payable returns (bool) {
        require(bets[betMapping[_betId]].state == State.NeedBookie);
        require(bets[betMapping[_betId]].sold == false);
        require(bets[betMapping[_betId]].result == MatchResult.Undecided);

        bets[betMapping[_betId]].bookie = msg.sender;
        bets[betMapping[_betId]].sold = true;

        emit BetFinalized(_betId);
        return true;
    }

    function GetBetById(uint _id) public view
     returns (uint matchId, //each match will have a unique id
        uint sideId, //will need to choose the winning side of the match
        uint amount,
        uint256 odds, // 1.50 odds would be stored as 150 (*100).
        bool sold,
        State state,
        MatchResult result,
        address bookie, //account laying the odds (they do not want this bet to pay out)
        address pundit)
   { 
     Bet storage bet = bets[betMapping[_id]];
     matchId = bet.matchId;
     sideId = bet.sideId;
     amount = bet.amount;
     odds = bet.odds;
     sold = bet.sold;
     state = bet.state;
     result = bet.result; 
     bookie = bet.bookie; 
     pundit = bet.pundit; 
     return (matchId, sideId, amount, odds, sold, state, result, bookie, pundit); 
   }

}

