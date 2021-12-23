
import { Clarinet, Tx, Chain, Account, Contract, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const FEE = 0.15/100;
const SUPPLY = 1000000000000000;

Clarinet.test({
    name: "Ensure that everything works fine",
    async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<String, Contract>) {
        const deployer = accounts.get('deployer')!.address;
        const wallet1 = accounts.get('wallet1')!.address;
        const wallet2 = accounts.get('wallet2')!.address;

        let block = chain.mineBlock([
            Tx.contractCall('token-a', 'get-total-supply', [], deployer),
            Tx.contractCall('token-a', 'get-name', [], deployer),
            Tx.contractCall('token-a', 'get-symbol', [], deployer),
            Tx.contractCall('token-a', 'get-decimals', [], deployer),
            Tx.contractCall('token-a', 'get-token-uri', [], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(deployer)], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], deployer),
            Tx.contractCall('token-a', 'get-balance', [types.principal(wallet2)], deployer),
        ]);
        // console.log('------- BLOCK');
        // console.log(JSON.stringify(block, null, 4));
        assertEquals(block.height, 2);
        assertEquals(block.receipts.length, 8);
        
        const totalSupplyRes = block.receipts[0].result.expectOk();
        const totalSupply = totalSupplyRes.expectUint(SUPPLY);
        
        const nameRes = block.receipts[1].result.expectOk();
        const name = nameRes.expectAscii("Token A");
        
        const symbolRes = block.receipts[2].result.expectOk();
        const symbol = symbolRes.expectAscii("TOK-A");
        
        const decimalsRes = block.receipts[3].result.expectOk();
        const decimals = decimalsRes.expectUint(9);
        
        const uriRes = block.receipts[4].result.expectOk();
        const uri = uriRes.expectNone();

        let deployerBalRes = block.receipts[5].result.expectOk();
        let deployerBal = deployerBalRes.expectUint(SUPPLY);

        let wallet1BalRes = block.receipts[6].result.expectOk();
        let wallet1Bal = wallet1BalRes.expectUint(0);

        let wallet2BalRes = block.receipts[7].result.expectOk();
        let wallet2Bal = wallet2BalRes.expectUint(0);

        const amountToBuy = 100;

        block = chain.mineBlock([
            // Tx.contractCall('token-a', 'update-rate', [types.uint(10000)], deployer),
            Tx.contractCall('token-a', 'buy', [types.uint(amountToBuy), types.principal(wallet1)], wallet1),
            // Tx.contractCall('token-a', 'get-balance', [types.principal(deployer)], deployer),
            // Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], deployer),
            // Tx.contractCall('token-a', 'transfer', [types.uint(99), types.principal(wallet1), types.principal(wallet2), types.none()], wallet1),
            // Tx.contractCall('token-a', 'get-balance', [types.principal(deployer)], deployer),
            // Tx.contractCall('token-a', 'get-balance', [types.principal(wallet1)], deployer),
            // Tx.contractCall('token-a', 'get-balance', [types.principal(wallet2)], deployer),
            // Tx.contractCall('token-a', 'get-total-supply', [], deployer),
        ]);
        // console.log('------- BLOCK');
        console.log(JSON.stringify(block, null, 4));
        assertEquals(block.height, 3);
        // assertEquals(block.receipts.length, 9);
        
        // const rateRes = block.receipts[0].result.expectOk();
        // const buyRes = block.receipts[1].result.expectOk();

        // deployerBalRes = block.receipts[2].result.expectOk();
        // deployerBal = deployerBalRes.expectUint(SUPPLY - amountToBuy);

        // wallet1BalRes = block.receipts[3].result.expectOk();
        // wallet1Bal = wallet1BalRes.expectUint(amountToBuy - Math.floor(Math.max(amountToBuy * FEE, 1)));

        

        // const newTotalSupplyRes = block.receipts[8].result.expectOk();
        // const newTotalSupply = newTotalSupplyRes.expectUint(SUPPLY);
    },
});
