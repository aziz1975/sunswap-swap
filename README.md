# SUNSWAP-SWAP

This project demonstrates how to programmatically swap tokens on the TRON blockchain using SunSwap's decentralized exchange (DEX) via TronWeb.

## Overview

The project includes:

* A JavaScript script (`swap.js`) to perform token swaps on SunSwap.
* Environment-based configuration for secure handling of private keys.

## Project Structure

```
SUNSWAP-SWAP/
├── swap.js
├── package.json
└── .env
```

## Prerequisites

* Node.js (version 18 or higher recommended)
* npm

## Installation

1. Clone the repository: \
https://github.com/aziz1975/sunswap-swap.git

```bash
git clone <repository-url>
cd SUNSWAP-SWAP
```

2. Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the root of the project and include your private key and TRON Nile testnet URL:

```env
PRIVATE_KEY_NILE=your_private_key_here
NILE_RPC=https://nile.trongrid.io
```

Replace `your_private_key_here` with your actual private key.

## Running the Swap Script

Execute the `swap.js` script to swap USDT for USDJ on the TRON Nile testnet:

```bash
node swap.js
```

### Expected Output:

The script will:

* Approve the SunSwap router to spend your tokens.
* Swap tokens and confirm the successful transaction.
* Display your updated USDJ balance.

Example output:

```
Approving router to spend 100 USDT…
✅ Approval confirmed.
Swapping USDT → USDJ…
✅ Swap complete, amountsOut: [actual amount output]
Fetching USDJ balance…
🎉 You now have [new balance] USDJ
```

## Explanation

* The script uses TronWeb to connect to TRON's Nile testnet.
* Tokens (USDT → USDJ) are swapped using SunSwap's V2 Router contract.

## Dependencies

* `tronweb`: TRON blockchain JavaScript library
* `dotenv`: Environment variable management

## Useful Resources

* [SunSwap Documentation (smart-router)](https://docs.sun.io/developers/swap/smart-router/contract)
* [SunSwap Documentation (exchange-functions)](https://docs.sun.io/developers/swap/smart-router/exchange-functions#complete-code)
* [TronWeb Documentation](https://developers.tron.network/docs/tronweb-intro)
* [TRON Nile Testnet Explorer](https://nile.tronscan.org)
