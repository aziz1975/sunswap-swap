import { TronWeb } from 'tronweb';
import 'dotenv/config';

// Router ABI: keep swapExactInput, add WTRX()/WETH() getters for auto-detecting wrapped TRX
const v3RouterAbi = [
  {
    name: 'swapExactInput',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { internalType: 'address[]', name: 'path',        type: 'address[]' },
      { internalType: 'string[]',  name: 'poolVersion', type: 'string[]'  },
      { internalType: 'uint256[]', name: 'versionLen',  type: 'uint256[]' },
      { internalType: 'uint24[]',  name: 'fees',        type: 'uint24[]'  },
      {
        internalType: 'struct SwapData',
        name: 'data',
        type: 'tuple',
        components: [
          { internalType: 'uint256', name: 'amountIn',     type: 'uint256' },
          { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
          { internalType: 'address', name: 'to',           type: 'address' },
          { internalType: 'uint256', name: 'deadline',     type: 'uint256' }
        ]
      }
    ],
    outputs: [{ internalType: 'uint256[]', name: 'amountsOut', type: 'uint256[]' }]
  },
  // Optional helpers some routers expose:
  { name: 'WTRX', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'WETH', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }
];

// Minimal WTRX ABI (to check balance & unwrap to TRX)
const wtrxAbi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'withdraw',  type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'wad', type: 'uint256' }], outputs: [] },
  { name: 'deposit',   type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }
];

async function main() {
  const tronWeb = new TronWeb({
    fullNode:     'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io',
    eventServer:  'https://nile.trongrid.io',
    privateKey:   process.env.PRIVATE_KEY_NILE
  });

  // --- Addresses (Nile) ---
  const routerAddr = 'TDAQGC5Ekd683GjekSaLzCaeg7jGsGSmbh';  // your router
  const usdtAddr   = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';  // USDT (Nile)
  // WTRX will be auto-detected from router if possible; otherwise use env var
  let wtrxAddr = process.env.WTRX_ADDR || '';

  const me = tronWeb.defaultAddress.base58;

  // --- Amounts ---
  const amountIn     = (100 * 10 ** 6).toString(); // 100 USDT with 6 decimals
  const amountOutMin = '1';                        // slippage protection - adjust as needed
  const deadline     = Math.floor(Date.now() / 1000) + 300;

  // Helper to convert hex address to base58 if needed
  const toB58 = (a) => {
    try { return tronWeb.address.fromHex(a); } catch { return a; }
  };

  // Prepare router contract
  const router = await tronWeb.contract(v3RouterAbi, routerAddr);

  // --- Detect WTRX address if not supplied ---
  if (!wtrxAddr) {
    try {
      const res = await router.WTRX().call();
      wtrxAddr = toB58(res);
    } catch (_) {}
  }
  if (!wtrxAddr) {
    try {
      const res = await router.WETH().call(); // some routers keep Ethereum naming
      wtrxAddr = toB58(res);
    } catch (_) {}
  }
  if (!wtrxAddr) {
    throw new Error('Cannot determine WTRX address. Set WTRX_ADDR in your .env for Nile.');
  }

  // --- 1) Approve router to spend USDT ---
  console.log('Approving router to spend 100 USDT…');
  await (await tronWeb.contract().at(usdtAddr))
    .approve(routerAddr, amountIn)
    .send({ feeLimit: 1e8, callValue: 0, shouldPollResponse: true });
  console.log('✅ Approval confirmed.');

  // --- (Optional) Check TRX balance before for comparison ---
  const trxBefore = await tronWeb.trx.getBalance(me);

  // --- 2) Swap USDT -> WTRX ---
  // NOTE: poolVersion/versionLen/fees are kept identical to your working USDJ swap.
  const path        = [usdtAddr, wtrxAddr];
  const poolVersion = ['v2'];
  const versionLen  = [2];
  const fees        = [0, 0];

  const data = [amountIn, amountOutMin, me, deadline];

  console.log('Swapping USDT → WTRX…');
  const swapRes = await router
    .swapExactInput(path, poolVersion, versionLen, fees, data)
    .send({ feeLimit: 1e8, callValue: 0, shouldPollResponse: true });
  console.log('✅ Swap tx sent. Router response:', swapRes);

  // --- 3) Unwrap WTRX -> TRX ---
  console.log('Unwrapping WTRX → TRX…');
  const wtrx = await tronWeb.contract(wtrxAbi, wtrxAddr);
  const wtrxBalSun = await wtrx.balanceOf(me).call(); // returns string/bn
  // If you only want to unwrap what you just received, you could use swapRes amount.
  await wtrx.withdraw(wtrxBalSun).send({ feeLimit: 1e8, callValue: 0, shouldPollResponse: true });
  console.log('✅ Unwrap complete.');

  // --- 4) Show resulting TRX balance ---
  const trxAfter = await tronWeb.trx.getBalance(me);
  const delta = (Number(trxAfter) - Number(trxBefore)) / 1e6;
  console.log(`🎉 TRX balance increased by approximately ${delta} TRX (after fees).`);
}

main().catch(err => {
  console.error('❌ Swap to TRX failed:', err);
  process.exit(1);
});
