import {TronWeb} from 'tronweb';
import 'dotenv/config';

const v3RouterAbi = [{
  name: 'swapExactInput',
  type: 'function',
  stateMutability: 'payable',
  inputs: [
    { internalType: 'address[]', name: 'path',        type: 'address[]' },
    { internalType: 'string[]',  name: 'poolVersion', type: 'string[]'  },
    { internalType: 'uint256[]', name: 'versionLen',  type: 'uint256[]' },
    { internalType: 'uint24[]',   name: 'fees',        type: 'uint24[]'   },
    {
      internalType: 'struct SwapData',
      name: 'data',
      type: 'tuple',
      components: [
        { internalType: 'uint256', name: 'amountIn',    type: 'uint256' },
        { internalType: 'uint256', name: 'amountOutMin',type: 'uint256' },
        { internalType: 'address', name: 'to',          type: 'address' },
        { internalType: 'uint256', name: 'deadline',    type: 'uint256' }
      ]
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
  const usdjAddr   = 'TLBaRhANQoJFTqre9Nf1mjuwNWjCJeYqUL';  
  const me         = tronWeb.defaultAddress.base58;       

  const amountIn     = (100 * 10**6).toString();           
  const amountOutMin = '1';                               
  const deadline     = Math.floor(Date.now()/1000) + 300;  

  console.log('Approving router to spend 100 USDT…');
  await (await tronWeb.contract().at(usdtAddr))
    .approve(routerAddr, amountIn)
    .send({ feeLimit: 1e8, callValue: 0, shouldPollResponse: true });
  console.log('✅ Approval confirmed.');

  const router = await tronWeb.contract(v3RouterAbi, routerAddr);

  const path        = [usdtAddr, usdjAddr];
  const poolVersion = ['usdj2pooltusdusdt'];
  const versionLen  = [2];
  const fees        = [0];   

  const data = [ amountIn, amountOutMin, me, deadline ];

  console.log('Swapping USDT → USDJ…');
  const result = await router
    .swapExactInput(path, poolVersion, versionLen, fees, data)
    .send({ feeLimit: 1e8, callValue: 0, shouldPollResponse: true });
  console.log('✅ Swap complete, amountsOut:', result);

  console.log('Fetching USDJ balance…');
  const usdj = await tronWeb.contract().at(usdjAddr);
  const balSun = await usdj.balanceOf(me).call();
  const decs   = await usdj.decimals().call();
  console.log(
    `🎉 You now have ${Number(balSun) / 10**Number(decs)} USDJ`
  );
}

main().catch(err => {
  console.error('❌ Swap failed:', err);
  process.exit(1);
});
