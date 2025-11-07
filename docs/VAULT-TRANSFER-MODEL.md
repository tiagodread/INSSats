# 🔄 Modelo de Transferência INSSats Vault

## Visão Geral

O contrato INSSats vault utiliza um **modelo de transferência direto** ao invés de mint/burn. Isso significa que:

- ✅ L-BTC já existe e é transferido entre endereços
- ✅ Broker envia L-BTC para o contrato (deposit)
- ✅ Contrato envia L-BTC para endereço de destino (withdrawal)
- ❌ Não há criação (mint) ou destruição (burn) de tokens

---

## 📥 Fluxo de Depósito (Deposit)

### Cenário
Saver quer depositar 100.000 sats de L-BTC na vault através do Broker.

### Passo a Passo

```
1. Saver transfere BRL para Broker (fora da blockchain)
2. Broker possui L-BTC em sua carteira
3. Broker cria transação de depósito:

   Inputs:
   - UTXO do Broker: 100.000 sats L-BTC
   - UTXO da Vault (estado atual): balance = 500.000 sats

   Outputs:
   - UTXO da Vault (novo estado): balance = 597.500 sats
     (100.000 - 2.5% broker fee = 97.500 adicionados)
   - UTXO do Broker (taxa): 2.500 sats (broker fee)

4. Contrato valida:
   ✓ Assinatura do Broker
   ✓ Balance aumentou corretamente
   ✓ Taxa calculada corretamente
```

### Fórmula
```rust
net_deposit = deposit_amount - (deposit_amount * broker_fee_bp / 10000)
new_balance = old_balance + net_deposit
```

---

## 📤 Fluxo de Saque Planejado (Planned Withdrawal)

### Cenário
Saver quer sacar 50.000 sats para seu endereço pessoal.

### Passo a Passo

#### Fase 1: Iniciar Saque (Initiate)
```
1. Saver cria PendingOperation:
   - amount: 50.000 sats
   - destination: endereço do Saver
   - expires_at: block_atual + 10.080 blocos (≈7 dias)

2. Vault permanece inalterada (sem transferência ainda)

3. Broker e Vault Keeper são notificados

4. Período de 7 dias para veto
```

#### Fase 2: Executar Saque (Execute)
```
Após 7 dias (e se ninguém vetou):

Inputs:
- UTXO da Vault (estado atual): balance = 597.500 sats
- PendingOperation validada

Outputs:
- UTXO da Vault (novo estado): balance = 547.500 sats
- UTXO do Saver (destino): 50.000 sats L-BTC

Contrato valida:
✓ Timelock expirou (block_atual >= expires_at)
✓ Operação não foi vetada
✓ Balance diminuiu corretamente
✓ Destino recebeu o valor correto
```

---

## 🚨 Fluxo de Saque Urgente (Urgent Withdrawal)

### Cenário
Saver precisa de acesso imediato a 30.000 sats (emergência médica).

### Passo a Passo

```
1. Saver solicita via app
2. Broker verifica identidade (vídeo call, presencial)
3. Vault Keeper valida (não detecta atividade suspeita)
4. Todos assinam a transação:

   Inputs:
   - UTXO da Vault (estado atual): balance = 547.500 sats
   - 3 assinaturas: Saver + Broker + Keeper

   Outputs:
   - UTXO da Vault (novo estado): balance = 512.500 sats
   - UTXO do Saver (destino): 30.000 sats L-BTC
   - UTXO de taxa urgente: 5.000 sats (vai para Vault Keeper)

5. Contrato valida:
   ✓ 3 assinaturas válidas (3/3 consensus)
   ✓ Balance -= (amount + urgent_fee)
   ✓ Destino recebeu o valor correto
   ✓ Taxa urgente paga
```

### Fórmula
```rust
total_cost = withdrawal_amount + urgent_fee
new_balance = old_balance - total_cost
```

---

## 🔐 Validações de Segurança

### Deposit
```rust
// 1. Verificar assinatura do remetente
checksig(sender, signature)

// 2. Calcular taxa do broker
broker_fee = deposit_amount * broker_fee_bp / 10000
net_deposit = deposit_amount - broker_fee

// 3. Validar balanço aumentou
assert!(new_balance == old_balance + net_deposit)

// 4. Validar output da vault
assert!(vault_output.amount == new_balance)
assert!(vault_output.asset == L_BTC_ASSET_ID)
```

### Withdrawal
```rust
// 1. Verificar permissões (planned = saver, urgent = 3/3)
checksig(saver, saver_sig)
// ou
checksig(saver, saver_sig) && checksig(broker, broker_sig) && checksig(keeper, keeper_sig)

// 2. Verificar timelock (apenas planned)
assert!(current_block >= operation.expires_at)
assert!(operation.vetoed == false)

// 3. Validar balanço diminuiu
assert!(new_balance == old_balance - withdrawal_amount)

// 4. Validar output de destino
assert!(destination_output.amount == withdrawal_amount)
assert!(destination_output.script_hash == destination_address)
assert!(destination_output.asset == L_BTC_ASSET_ID)
```

---

## 📊 Exemplo Completo

### Estado Inicial
```
Vault:
- saver: 0xAAA...
- broker: 0xBBB...
- keeper: 0xCCC...
- balance: 0 sats
- broker_fee_bp: 250 (2.5%)
- urgent_fee: 5000 sats
```

### Operação 1: Deposit de 1.000.000 sats
```
Input:  Broker UTXO (1.000.000 sats)
Output: Vault (975.000 sats) + Broker fee (25.000 sats)

Vault.balance = 975.000 sats
```

### Operação 2: Deposit de 500.000 sats
```
Input:  Broker UTXO (500.000 sats)
Output: Vault (1.462.500 sats) + Broker fee (12.500 sats)

Vault.balance = 1.462.500 sats
```

### Operação 3: Planned Withdrawal de 200.000 sats
```
T0: Initiate
- PendingOperation criada
- Vault.balance = 1.462.500 sats (inalterado)

T0 + 7 dias: Execute
Input:  Vault (1.462.500 sats)
Output: Vault (1.262.500 sats) + Saver (200.000 sats)

Vault.balance = 1.262.500 sats
```

### Operação 4: Urgent Withdrawal de 100.000 sats
```
Input:  Vault (1.262.500 sats)
Output: Vault (1.157.500 sats) + Saver (100.000 sats) + Fee (5.000 sats)

Vault.balance = 1.157.500 sats
```

---

## 🎯 Diferenças vs Mint/Burn

| Aspecto | Mint/Burn | Transfer (INSSats) |
|---------|-----------|-------------------|
| **Asset Creation** | Sim (mint cria tokens) | Não (L-BTC já existe) |
| **Asset Destruction** | Sim (burn destrói tokens) | Não (L-BTC permanece) |
| **Deposit** | Mint tokens representando depósito | Transfer L-BTC para vault |
| **Withdrawal** | Burn tokens, libera colateral | Transfer L-BTC da vault |
| **Total Supply** | Variável | Constante (21M L-BTC) |
| **Complexidade** | Alta (gerenciar supply) | Baixa (apenas transfers) |

---

## 🔍 Parâmetros da Transação

### Witness Data (Inputs)
```rust
witness::STATE_TYPE           // Tipo de operação
witness::OLD_VAULT            // Estado anterior da vault
witness::DEPOSIT_AMOUNT       // (Deposit) Valor depositado
witness::AMOUNT               // (Withdrawal) Valor a sacar
witness::DESTINATION          // (Withdrawal) Endereço destino
witness::SAVER_SIGNATURE      // Assinatura do Saver
witness::BROKER_SIGNATURE     // Assinatura do Broker (urgent)
witness::KEEPER_SIGNATURE     // Assinatura do Keeper (urgent)
witness::OPERATION            // (Execute) PendingOperation
witness::VETOER_PUBKEY        // (Veto) Quem vetou
witness::PARAM_ID             // (Update) ID do parâmetro
witness::NEW_VALUE            // (Update) Novo valor
```

### Parâmetros do Contrato
```rust
param::L_BTC_ASSET_ID         // Asset ID do L-BTC na Liquid Network
```

---

## ✅ Checklist de Implementação

- [x] Remover lógica de mint/burn
- [x] Implementar `enforce_deposit_transfer`
- [x] Implementar `enforce_withdrawal_transfer`
- [x] Implementar `enforce_urgent_withdrawal_transfer`
- [x] Validar outputs de destino com `ensure_output_sends_to_address`
- [x] Garantir continuidade do vault UTXO
- [x] Calcular broker fee corretamente
- [x] Calcular urgent fee corretamente
- [x] Validar assinaturas em cada operação

---

**🛡️ INSSats - Transfer-based Vault Security**
