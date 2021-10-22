pragma solidity >=0.5.16 <0.9.0;

import "./OracleInterface.sol";
import "./Ownable.sol";

contract SoccerOracle is OracleInterface, Ownable {

    Match[] public matches;
    mapping (uint256 => uint256) matchIdIndexMapping;
    
    MatchResult[] public matchResults;
    mapping (uint256 => uint256) matchIdResultIndexMapping;

    constructor() public {

        //this is done to make sure there is a blank match at index 0. Due to the way the mappings work, a missing value results in 0 which would be the first index of the matches[] array. 
        //It would be possible to accidentally set the result for the wrong match this way. By having a seeded match in index 0 that is by default invalid this issue is mitigated.
        matches.push(Match({
            match_id: 0,
            match_date: "",
            team1_id: 0,
            team2_id: 0,
            team1_name: "",
            team2_name: "",
            pending: false
        }));

        matchIdIndexMapping[0] = matches.length - 1;
    }

    function Validate() external view returns (bool _result) {
        _result = true;
    }

    function setMatchResult(uint256 matchId, ResultType result, uint256 winner, string calldata final_score) external onlyOwner {
        Match storage _match = matches[matchIdIndexMapping[matchId]];
        require(_match.pending); //make sure this is still a pending match.

        _match.pending = false;
        matchResults.push(MatchResult({
            match_id: matchId,
            result: result,
            winning_team_id: winner,
            result_time: block.timestamp,
            final_score: final_score
        }));
        matchIdResultIndexMapping[matchId] = matchResults.length-1;
    }

    function addMatch(uint256 match_id,
                        string calldata match_date,
                        uint256 team1_id,
                        uint256 team2_id,
                        string calldata team1_name,
                        string calldata team2_name) external onlyOwner
    {
        matches.push(Match({
            match_id: match_id,
            match_date: match_date,
            team1_id: team1_id,
            team2_id: team2_id,
            team1_name: team1_name,
            team2_name: team2_name,
            pending: true
        }));

        matchIdIndexMapping[match_id] = matches.length - 1;
    }

    function getAvailableMatches() external view returns (uint256[] memory) {
        uint count = 0; 

        //get count of pending matches 
        for (uint i = 0; i < matches.length; i++) {
            if (matches[i].pending) 
                count++; 
        }

        //collect up all the pending matches
        uint256[] memory output = new uint256[](count); 

        if (count > 0) {
            uint index = 0;
            for (uint n = matches.length; n > 0; n--) {
                if (matches[n-1].pending) 
                    output[index++] = matches[n-1].match_id;
            }
        } 

        return output; 
    }

    function getMatch(uint256 match_id) external view returns (string memory match_date,
                                                    uint256 team1_id,
                                                    uint256 team2_id,
                                                    string memory team1_name,
                                                    string memory team2_name,
                                                    bool pending) 
    {
        Match memory _match = matches[matchIdIndexMapping[match_id]];
        match_date = _match.match_date;
        team1_id = _match.team1_id;
        team2_id = _match.team2_id;
        team1_name = _match.team1_name;
        team2_name = _match.team2_name;
        pending = _match.pending;
    }

    function getMatchResult(uint256 match_id) external view returns (ResultType result,
                                                                    uint256 winning_team_id,
                                                                    uint256 result_time)
    {
        MatchResult memory _matchResult = matchResults[matchIdResultIndexMapping[match_id]];
        result = _matchResult.result;
        winning_team_id = _matchResult.winning_team_id;
        result_time = _matchResult.result_time;
    }
}