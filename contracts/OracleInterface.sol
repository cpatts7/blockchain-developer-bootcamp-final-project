pragma solidity >=0.5.16 <0.9.0;

interface  OracleInterface {

    enum ResultType
    {
        Undecided,
        Void,
        Completed
    }

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

    struct MatchResult
    {
        ResultType result; 
        uint256 match_id;
        uint256 winning_team_id;
        string final_score;
        uint256 result_time;
    }

    function Validate() external view returns (bool);

    function addMatch(uint256 match_id,
                        string calldata match_date,
                        uint256 team1_id,
                        uint256 team2_id,
                        string calldata team1_name,
                        string calldata team2_name) external;

    function setMatchResult(uint256 matchId, ResultType result, uint256 winner, string calldata final_score) external;
    function getAvailableMatches() external view returns (uint256[] memory);
    function getMatch(uint256 match_id) external view returns (string memory match_date,
                                                    uint256 team1_id,
                                                    uint256 team2_id,
                                                    string memory team1_name,
                                                    string memory team2_name,
                                                    bool pending);
    function getMatchResult(uint256 match_id) external view returns (ResultType result,
                                                                    uint256 winning_team_id,
                                                                    uint256 result_time);

                                                                
}