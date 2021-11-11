pragma solidity >=0.5.16 <0.9.0;

interface  OracleInterface {

//Result enum
    enum ResultType
    {
        Undecided,
        Void,
        Completed
    }

//Reference data for available matches to be bet on
    struct Match
    {
        uint256 match_id;
        string match_date;
        uint256 team1_id;
        uint256 team2_id;
        string team1_name;
        string team2_name;
        bool pending;
        
    }

//Completed results data
    struct MatchResult
    {
        ResultType result; 
        uint256 match_id;
        uint256 winning_team_id;
        string final_score;
        uint256 result_time;
    }

//Returns true if setup properly
    function Validate() external view returns (bool);

//Adds a match to the reference data collection
    function addMatch(uint256 match_id,
                        string calldata match_date,
                        uint256 team1_id,
                        uint256 team2_id,
                        string calldata team1_name,
                        string calldata team2_name) external;

//Inputs a result for a given match
    function setMatchResult(uint256 matchId, ResultType result, uint256 winner, string calldata final_score) external;

//Returns all matches that have not completed yet.
    function getAvailableMatches() external view returns (uint256[] memory);

//Returns the details of a specific match
    function getMatch(uint256 match_id) external view returns (
                                                    uint256 id,
                                                    string memory match_date,
                                                    uint256 team1_id,
                                                    uint256 team2_id,
                                                    string memory team1_name,
                                                    string memory team2_name,
                                                    bool pending);
//returns result of a specific match
    function getMatchResult(uint256 match_id) external view returns (ResultType result,
                                                                    uint256 winning_team_id,
                                                                    uint256 result_time);

//used to generate test data
    function setInitialMatches(uint256 _set) external;
                                                                
}