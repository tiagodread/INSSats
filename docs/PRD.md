# Product Document requirements

INSSats

## Goals

1. Allow customers to buy Bitcoin via DCA for long term retirement;
2. Must be easy and connected to people with no really much knowledge of Bitcoin ecosystem;
3. Customers must be able to:
    - Create it's account easily;
    - Create it's retirement plan (amount, frequency, years, objective);
    - Make constant payments on it's retirement plan;
        - This constitutes making a Bitcoin purchase
    - Check it's ballance on a watch only wallet;
    - Export it's funds to a different wallet;
4. Create a "private IRA account" in collaboration with companies;


## UX constraints

1. Must be easy and made up for Brazilian with no knowledge in Bitcoin;
2. Must be 


## Entities

### Customer

The customer is the person who wants to hold bitcoin for long term retirement

Actions:

- Buy bitcoin via DCA
- Check it's retirement account balance
- Partial sell based on monthly threshold
- Total sell/liquidation
    - Triggered by a price

### Vault

The vault is the entity holding the funds via multisig + smart contract

Actions:

- Create contracts
- Verify contracts
- Lock funds
- Unlock funds

### BROKER

The broker is the entity responsible for taking care of Bitcoin transactions, it means, buy and sell in name of the customer

- Buy bitcoin and deposit in customer wallet (in posses of vault)
- Sell bitcoin and request vault to unlock funds
- Process payments and liquidation

