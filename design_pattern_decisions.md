## Design Patterns ##

## #1 - Access Control Design Patterns
This contract makes use of the ownable concept and only allows certain functions to be run by the contract owner (setting the Oracle, managing payouts, etc). This was done to ensure security and integrity when handling the results of the match. In an ideal world this contract would pick up the results from a true oracle and handle payouts based on users closing their bets but this was too advanced for this project. 

The Liqudity objects implement a loose form of ownership (bookie address property) which allows the 'owner' of the liqudity to edit the odds or cancel (refund) based on their ownership.

## #2 - Oracle
The oracle is designed to be an independant soure of match details + results for any given sport. It should use a more standard approach to collecting data from a rest endpoint but given the nature of the data (sporting results) this is not widely available for free. 

## #3 - Interface
The Oracle implements a generic interface which would allow for the contract (BeTheBookie) to connect to different team based sporting events (ie: tennis, football, etc). The GUI could have different sections based on different sports and each contract would have a connection to a supporting Oracle. Alternatively the Bookie contract could be designed to contain a link to a set of oracles by key (TENNIS, SOCCER, etc) and then it could handle all sports from a single contract.

## Attack vectors

## SWC-102 - Compiles against later version of Solidity. pragma solidity >=0.5.16 <0.9.0;
## SWC-111 - Contract makes use of no obsolete function calls. 