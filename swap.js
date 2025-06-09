import {TronWeb} from 'tronweb';
import 'dotenv/config';

const v3RouterAbi = [{
  name: 'exactInput',
  type: 'function',
  stateMutability: 'payable',
  inputs: [
    {
      components: [
        { internalType: 'bytes',    name: 'path',         type: 'bytes'    },
        { internalType: 'address',  name: 'recipient',    type: 'address'  },
        { internalType: 'uint256',  name: 'deadline',     type: 'uint256'  }
      ],
      internalType: 'struct ExactInputParams',
      name: 'params',
      type: 'tuple'
    }
  ],
  outputs: [
    { internalType: 'uint256[]', name: 'amountsOut', type: 'uint256[]' }
  ]
}];

async function main() {
  const tronWeb = new TronWeb({
    fullNode:     'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io', 
    eventServer:  'https://nile.trongrid.io',
    privateKey:   process.env.PRIVATE_KEY_NILE
  });

  const routerAddr = 'TFkswj6rUfK3cQtFGzungCkNXxD2UCpEVD';
  const usdtAddr   = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';
  const jstAddr    = 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3';
  const me         = tronWeb.defaultAddress.base58;

  const amountIn     = (100 * 10**6).toString();
  const amountOutMin = '1';
  const deadline     = Math.floor(Date.now() / 1000) + 300;

  console.log('Approving router to spend USDT…');
  const usdt = await tronWeb.contract().at(usdtAddr);
  await usdt.approve(routerAddr, amountIn).send({
    feeLimit:          1e8,
    callValue:         0,
    shouldPollResponse: true
  });
  console.log('✅ Approval confirmed.');

  const feeHex       = '0001f4';
  const tokenInHex   = tronWeb.address.toHex(usdtAddr).slice(2);
  const tokenOutHex  = tronWeb.address.toHex(jstAddr).slice(2);
  const pathBytes    = '0x' + tokenInHex + feeHex + tokenOutHex;

  const router = await tronWeb.contract(v3RouterAbi, routerAddr);

  console.log('Swapping 100 USDT for JST via exactInput…');
  const params = [ pathBytes, me, deadline ];
  const result = await router.exactInput(params).send({
    feeLimit:          15000000000,
    callValue:         5000000,
    shouldPollResponse: true
  });
  console.log('✅ Swap complete, amountsOut (base units):', result);

  const jst = await tronWeb.contract().at(jstAddr);
  const balSun = await jst.balanceOf(me).call();
  const decs   = await jst.decimals().call();
  console.log(`🎉 You now have ${Number(balSun) / 10**Number(decs)} JST`);
}

main().catch(err => {
  console.error('❌ Swap failed:', err);
  process.exit(1);
});
