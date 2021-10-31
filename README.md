## blockchain-developer-bootcamp-final-project - Be The Bookie
## Be The Bookie

## Problem Statement
Most centralized betting sites (bet365 for example) make odds on sporting events and typically earn profit by using spreads. They aim to build a book on both sides that offers them risk free profits by taking the spread in between odds (ie: 5%).

## Goals
This project (Be-The-Bookie) aims to disrupt this business model by removing the need for this middle man in between. Particpants can either make a market on a match (be a bookie) or take a bet on a particular result. The app will leverage an oracle to determine who is paid out in the end. 


## Requirements
  1. Latest truffle version.
     ```console
     npm -g uninstall truffle && npm -g install truffle
     ```
  2. Latest version of NPM

## Local Testing

  1. Load truffle-config.js into ganache
  2. ```console
     truffle migrate
     ```
  3. Open comand prompt, navigate to blockchain-developer-bootcamp-final-project\src
  4. ```console
     npm run dev
     ```
  5. Connect Metamask using the owner account
  6. Navigate to the Administration tab
  7. Press the Set Oracle button and accept the transaction in Metamask
  8. Enter 1 in the Num textbox and press Set Initial Matches button (for more matches, repeat using numbers 2 through 10)
  9. Refresh and the bookie tab will refresh with available matches

