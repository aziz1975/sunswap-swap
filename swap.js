import {TronWeb} from 'tronweb';
import 'dotenv/config';
import routerArtifact from './SunSwapV2Router02.json' assert { type: 'json' };
const routerAbi = routerArtifact.abi;

async function main() {
  const tronWeb = new TronWeb({
    fullNode:     'https://api.nileex.io',     
    solidityNode: 'https://api.nileex.io',     
    eventServer:  'https://event.nileex.io',   
    privateKey:   process.env.PRIVATE_KEY_NILE
  });

  const routerAddr = 'TB6xBCixqRPUSKiXb45ky1GhChFJ7qrfFj';
  const usdtAddr   = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';
  const jstAddr    = 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3';
  const me         = tronWeb.defaultAddress.base58;

  const amountIn = (100 * 10 ** 6).toString(); 

  console.log('Approving router to spend USDT…');
  const usdtContract = await tronWeb.contract().at(usdtAddr);
  await usdtContract.approve(routerAddr, amountIn).send({
    feeLimit:          1e8,
    callValue:         0,
    shouldPollResponse: true
  });
  console.log(' Approval confirmed.');

  console.log('Instantiating router…');
  const router = await tronWeb.contract(routerAbi, routerAddr);
   if (typeof router.swapExactTokensForTokens !== 'function') {
     console.error('Available router methods:', Object.keys(router));
     throw new Error('swapExactTokensForTokens() not found');
   }

  console.log('Swapping 100 USDT for JST…');
  const deadline = Math.floor(Date.now() / 1000) + 300; 
  await router.swapExactTokensForTokens(
    usdtAddr,
    amountIn,
    '1',                  
    [usdtAddr, jstAddr],  
    me,                   
    deadline
  ).send({
    feeLimit:          1e8,
    callValue:         0,
    shouldPollResponse: true
  });
  console.log(' Swap transaction confirmed.');

  console.log('Fetching your JST balance…');
  const jstContract = await tronWeb.contract().at(jstAddr);
  const balanceSun  = await jstContract.balanceOf(me).call();
  const decimals    = await jstContract.decimals().call();
  const balance     = Number(balanceSun) / 10 ** Number(decimals);
  console.log(` You now have ${balance} JST`);
}

main().catch(err => {
  console.error(' Error during swap:', err);
  process.exit(1);
});
