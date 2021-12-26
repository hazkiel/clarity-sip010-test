
import { Clarinet, Tx, Chain, Account, Contract, types } from 'https://deno.land/x/clarinet@v0.21.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const FEE = 0.15/100;
const SUPPLY = 1000000;

function getFee(amount : number|bigint) : number {
    return Math.floor(Math.max(Number(amount) * FEE, 1));
}

Clarinet.test({
    name: "Ensure that everything works fine",
    async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<String, Contract>) {
        const deployer = accounts.get('deployer')!.address;
        const contractWallet = accounts.get('deployer')!.address + '.token-a';
        const wallet1 = accounts.get('wallet1')!.address;
        const wallet2 = accounts.get('wallet2')!.address;
        const amountToBuy = 10000;
        const amountToTransfer = 1000;
        const newRate = 100;
        
        let block = chain.mineBlock([
            Tx.contractCall('token-a', 'get-total-supply', [], deployer),                                       // 0
            Tx.contractCall('token-a', 'get-name', [], deployer),
            Tx.contractCall('token-a', 'get-symbol', [], deployer),
            Tx.contractCall('token-a', 'get-decimals', [], deployer),
            Tx.contractCall('token-a', 'get-token-uri', [], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(contractWallet)], deployer),             // 5
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], wallet1),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet2)], wallet2),
            Tx.contractCall('token-a', 'get-rate', [], deployer),
            Tx.contractCall('token-a', 'update-rate', [types.uint(newRate)], deployer),
            Tx.contractCall('token-a', 'get-rate', [], deployer),                                               // 10
            Tx.contractCall('token-a', 'update-rate', [types.uint(123456)], deployer),
            Tx.contractCall('token-a', 'calculate-fee', [types.uint(amountToBuy)], wallet1),
            Tx.contractCall('token-a', 'buy', [types.uint(amountToBuy), types.principal(wallet1)], wallet1),
            Tx.contractCall('token-a', 'get-balance', [types.principal(contractWallet)], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], wallet1),                     // 15
            Tx.contractCall('token-a', 'transfer', [types.uint(amountToTransfer), types.principal(wallet1), types.principal(wallet2), types.none()], wallet1),
            Tx.contractCall('token-a', 'get-balance', [types.principal(contractWallet)], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], wallet1),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet2)], wallet2),
        ]);
        // console.log(JSON.stringify(block, null, 4));
        assertEquals(block.height, 2);
        assertEquals(block.receipts.length, 20);
        
        const totalSupplyRes = block.receipts[0].result.expectOk();
        const totalSupply = totalSupplyRes.expectUint(SUPPLY);
        
        const nameRes = block.receipts[1].result.expectOk();
        const name = nameRes.expectAscii("Token A");
        
        const symbolRes = block.receipts[2].result.expectOk();
        const symbol = symbolRes.expectAscii("TOK-A");
        
        const decimalsRes = block.receipts[3].result.expectOk();
        const decimals = decimalsRes.expectUint(4);
        
        const uriRes = block.receipts[4].result.expectOk();
        const uri = uriRes.expectNone();
        
        let deployerBalRes = block.receipts[5].result.expectOk();
        let deployerBal = Number(deployerBalRes.expectUint(SUPPLY));
        
        let wallet1BalRes = block.receipts[6].result.expectOk();
        let wallet1Bal = Number(wallet1BalRes.expectUint(0));
        
        let wallet2BalRes = block.receipts[7].result.expectOk();
        let wallet2Bal = Number(wallet2BalRes.expectUint(0));
        
        let rateRes = block.receipts[8].result.expectOk();
        let rate = rateRes.expectUint(1000);

        block.receipts[9].result.expectOk();
        rateRes = block.receipts[10].result.expectOk();
        rate = rateRes.expectUint(100);
        block.receipts[11].result.expectErr();
        
        block.receipts[12].result.expectUint(Math.max(amountToBuy * FEE, 1));
        block.receipts[13].result.expectOk();
        
        deployerBalRes = block.receipts[14].result.expectOk();
        deployerBal = Number(deployerBalRes.expectUint(SUPPLY - amountToBuy + getFee(amountToBuy)));
        
        wallet1BalRes = block.receipts[15].result.expectOk();
        wallet1Bal = Number(wallet1BalRes.expectUint(amountToBuy - getFee(amountToBuy)));
        block.receipts[16].result.expectOk();
        
        deployerBalRes = block.receipts[17].result.expectOk();
        deployerBal = Number(deployerBalRes.expectUint(deployerBal + getFee(amountToTransfer)));
        
        wallet1BalRes = block.receipts[18].result.expectOk();
        wallet1Bal = Number(wallet1BalRes.expectUint(wallet1Bal - amountToTransfer));
        
        wallet2BalRes = block.receipts[19].result.expectOk();
        wallet2Bal = Number(wallet2BalRes.expectUint(wallet2Bal + amountToTransfer - getFee(amountToTransfer)));
    },
});
