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
        addMatchDetails(match_id, match_date, team1_id, team2_id, team1_name, team2_name);
    }

    function addMatchDetails(uint256 match_id,
                        string memory match_date,
                        uint256 team1_id,
                        uint256 team2_id,
                        string memory team1_name,
                        string memory team2_name) public onlyOwner
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

    function getMatch(uint256 match_id) external view returns (
                                                    uint256 id,
                                                    string memory match_date,
                                                    uint256 team1_id,
                                                    uint256 team2_id,
                                                    string memory team1_name,
                                                    string memory team2_name,
                                                    bool pending) 
    {
        Match memory _match = matches[matchIdIndexMapping[match_id]];
        id = _match.match_id;
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

    function setInitialMatches() external
    {
        addMatchDetails(316055, "2021-11-01", 850, 2516, "Wolverhampton Wanderers", "Everton FC");
        addMatchDetails(316059, "2021-10-30", 849, 2524, "Newcastle United", "Chelsea FC");
        addMatchDetails(316063, "2021-10-30", 12430, 2523, "Tottenham Hotspur", "Manchester United");
        addMatchDetails(316067, "2021-10-30", 2513, 2537, "Burnley FC", "Brentford FC");
        addMatchDetails(316071, "2021-10-30", 2509, 2518, "Liverpool FC", "Brighton & Hove Albion");
        addMatchDetails(316075, "2021-10-31", 2510, 2546, "Norwich City", "Leeds United");
        addMatchDetails(316078, "2021-10-30", 12424, 2522, "Leicester City", "Arsenal FC");
        addMatchDetails(316082, "2021-10-30", 12400, 2515, "Manchester City", "Crystal Palace");
        addMatchDetails(316086, "2021-10-30", 2517, 2959, "Watford FC", "Southampton FC");
        addMatchDetails(316090, "2021-10-31", 2520, 12401, "Aston Villa", "West Ham United");
        // addMatchDetails(316094, "2021-11-06", 2523, 12400, "Manchester United", "Manchester City");
        // addMatchDetails(316099, "2021-11-06", 2515, 850, "Crystal Palace", "Wolverhampton Wanderers");
        // addMatchDetails(316104, "2021-11-07", 12401, 2509, "West Ham United", "Liverpool FC");
        // addMatchDetails(316109, "2021-11-05", 2959, 2520, "Southampton FC", "Aston Villa");
        // addMatchDetails(316112, "2021-11-06", 2537, 2510, "Brentford FC", "Norwich City");
        // addMatchDetails(316116, "2021-11-06", 2518, 849, "Brighton & Hove Albion", "Newcastle United");
        // addMatchDetails(316120, "2021-11-06", 2524, 2513, "Chelsea FC", "Burnley FC");
        // addMatchDetails(316124, "2021-11-07", 2516, 12430, "Everton FC", "Tottenham Hotspur");
        // addMatchDetails(316128, "2021-11-07", 2522, 2517, "Arsenal FC", "Watford FC");
        // addMatchDetails(316132, "2021-11-07", 2546, 12424, "Leeds United", "Leicester City");
        // addMatchDetails(316136, "2021-11-21", 12430, 2546, "Tottenham Hotspur", "Leeds United");
        // addMatchDetails(316140, "2021-11-20", 2517, 2523, "Watford FC", "Manchester United");
        // addMatchDetails(316144, "2021-11-20", 849, 2537, "Newcastle United", "Brentford FC");
        // addMatchDetails(316148, "2021-11-21", 12400, 2516, "Manchester City", "Everton FC");
        // addMatchDetails(316152, "2021-11-20", 2510, 2959, "Norwich City", "Southampton FC");
        // addMatchDetails(316156, "2021-11-20", 850, 12401, "Wolverhampton Wanderers", "West Ham United");
        // addMatchDetails(316160, "2021-11-20", 2509, 2522, "Liverpool FC", "Arsenal FC");
        // addMatchDetails(316164, "2021-11-20", 2520, 2518, "Aston Villa", "Brighton & Hove Albion");
        // addMatchDetails(316167, "2021-11-20", 2513, 2515, "Burnley FC", "Crystal Palace");
        // addMatchDetails(316170, "2021-11-20", 12424, 2524, "Leicester City", "Chelsea FC");
        // addMatchDetails(316173, "2021-11-27", 2509, 2959, "Liverpool FC", "Southampton FC");
        // addMatchDetails(316176, "2021-11-27", 2510, 850, "Norwich City", "Wolverhampton Wanderers");
        // addMatchDetails(316179, "2021-11-28", 2524, 2523, "Chelsea FC", "Manchester United");
        // addMatchDetails(316182, "2021-11-28", 12400, 12401, "Manchester City", "West Ham United");
        // addMatchDetails(316185, "2021-11-28", 12424, 2517, "Leicester City", "Watford FC");
        // addMatchDetails(316188, "2021-11-28", 2513, 12430, "Burnley FC", "Tottenham Hotspur");
        // addMatchDetails(316191, "2021-11-27", 2515, 2520, "Crystal Palace", "Aston Villa");
        // addMatchDetails(316194, "2021-11-27", 2522, 849, "Arsenal FC", "Newcastle United");
        // addMatchDetails(316197, "2021-11-28", 2537, 2516, "Brentford FC", "Everton FC");
        // addMatchDetails(316201, "2021-11-27", 2518, 2546, "Brighton & Hove Albion", "Leeds United");
        // addMatchDetails(316203, "2021-12-01", 2517, 2524, "Watford FC", "Chelsea FC");
        // addMatchDetails(316205, "2021-12-02", 2523, 2522, "Manchester United", "Arsenal FC");
        // addMatchDetails(316208, "2021-12-01", 850, 2513, "Wolverhampton Wanderers", "Burnley FC");
        // addMatchDetails(316209, "2021-12-01", 12401, 2518, "West Ham United", "Brighton & Hove Albion");
        // addMatchDetails(316212, "2021-12-01", 2520, 12400, "Aston Villa", "Manchester City");
        // addMatchDetails(316215, "2021-11-30", 2546, 2515, "Leeds United", "Crystal Palace");
        // addMatchDetails(316219, "2021-12-01", 2516, 2509, "Everton FC", "Liverpool FC");
        // addMatchDetails(316221, "2021-12-02", 12430, 2537, "Tottenham Hotspur", "Brentford FC");
        // addMatchDetails(316224, "2021-11-30", 849, 2510, "Newcastle United", "Norwich City");
        // addMatchDetails(316227, "2021-12-01", 2959, 12424, "Southampton FC", "Leicester City");
        // addMatchDetails(316230, "2021-12-04", 12401, 2524, "West Ham United", "Chelsea FC");
        // addMatchDetails(316236, "2021-12-06", 2516, 2522, "Everton FC", "Arsenal FC");
        // addMatchDetails(316239, "2021-12-05", 2523, 2515, "Manchester United", "Crystal Palace");
        // addMatchDetails(316242, "2021-12-05", 2520, 12424, "Aston Villa", "Leicester City");
        // addMatchDetails(316245, "2021-12-05", 2546, 2537, "Leeds United", "Brentford FC");
        // addMatchDetails(316248, "2021-12-04", 2517, 12400, "Watford FC", "Manchester City");
        // addMatchDetails(316257, "2021-12-05", 12430, 2510, "Tottenham Hotspur", "Norwich City");
        // addMatchDetails(316263, "2021-12-10", 2537, 2517, "Brentford FC", "Watford FC");
        // addMatchDetails(316266, "2021-12-12", 2515, 2516, "Crystal Palace", "Everton FC");
        // addMatchDetails(316269, "2021-12-11", 2510, 2523, "Norwich City", "Manchester United");
        // addMatchDetails(316272, "2021-12-11", 12400, 850, "Manchester City", "Wolverhampton Wanderers");
        // addMatchDetails(316280, "2021-12-12", 2518, 12430, "Brighton & Hove Albion", "Tottenham Hotspur");
        // addMatchDetails(316283, "2021-12-12", 2513, 12401, "Burnley FC", "West Ham United");
        // addMatchDetails(316286, "2021-12-12", 12424, 849, "Leicester City", "Newcastle United");
        // addMatchDetails(316289, "2021-12-16", 12424, 12430, "Leicester City", "Tottenham Hotspur");
        // addMatchDetails(316292, "2021-12-15", 2513, 2517, "Burnley FC", "Watford FC");
        // addMatchDetails(316298, "2021-12-15", 2522, 12401, "Arsenal FC", "West Ham United");
        // addMatchDetails(316301, "2021-12-14", 2537, 2523, "Brentford FC", "Manchester United");
        // addMatchDetails(316304, "2021-12-15", 2518, 850, "Brighton & Hove Albion", "Wolverhampton Wanderers");
        // addMatchDetails(316307, "2021-12-15", 2515, 2959, "Crystal Palace", "Southampton FC");
        // addMatchDetails(316310, "2021-12-14", 12400, 2546, "Manchester City", "Leeds United");
        // addMatchDetails(316313, "2021-12-16", 2509, 849, "Liverpool FC", "Newcastle United");
        // addMatchDetails(316316, "2021-12-15", 2524, 2516, "Chelsea FC", "Everton FC");
    }
}