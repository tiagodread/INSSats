# Contract Deployment Scripts

Scripts modulares para criar, financiar e fazer claim de contratos Simplicity na Liquid Testnet.

## Scripts

### 1. `1-create-contract.sh`
Cria o contrato compilando o código Simplicity e gerando o endereço do contrato.

**Entrada:**
- `PROGRAM_SOURCE` - Caminho para o arquivo `.simf` (default: `contracts/htlc.simf`)
- `INTERNAL_KEY` - Chave pública NUMS (default: hardcoded)

**Saída:**
- `tmp/contract-info.json` - Informações do contrato (CMR, endereço, bytecode)

**Exemplo:**
```bash
./scripts/1-create-contract.sh
```

### 2. `2-fund-contract.sh`
Solicita fundos do faucet para o endereço do contrato e aguarda confirmação.

**Entrada:**
- `tmp/contract-info.json` - Informações do contrato (do script 1)
- `FAUCET_SCRIPT` - Script do faucet (default: `~/faucet.sh`)
- `EXTRACT_TX_SCRIPT` - Script para extrair TXID (default: `~/extract-transaction.sh`)

**Saída:**
- `tmp/funding-info.json` - Informações do funding (txid, vout, scriptPubkey, asset, value)

**Exemplo:**
```bash
./scripts/2-fund-contract.sh
```

### 3. `3-create-pset.sh`
Cria um PSET mínimo para gastar os fundos do contrato.

**Entrada:**
- `tmp/funding-info.json` - Informações do funding (do script 2)
- `RECIPIENT_ADDRESS` - Endereço de destino (default: faucet address)
- `CONTRACT_AMOUNT` - Valor a enviar (default: 0.00099900)
- `CONTRACT_FEE` - Taxa da transação (default: 0.00000100)

**Saída:**
- `tmp/pset-minimal.json` - PSET mínimo criado

**Exemplo:**
```bash
RECIPIENT_ADDRESS="tlq1qq..." ./scripts/3-create-pset.sh
```

### 4. `4-finalize-pset.sh`
Finaliza o PSET com assinaturas e witness, gerando a transação pronta para broadcast.

**Entrada:**
- `tmp/contract-info.json` - Informações do contrato (do script 1)
- `tmp/funding-info.json` - Informações do funding (do script 2)
- `tmp/pset-minimal.json` - PSET mínimo (do script 3)
- `PRIVKEY_1` - Chave privada para assinar (default: hardcoded)
- `WITNESS_FILE` - Arquivo witness (default: `.complete.wit` correspondente ao `.simf`)

**Saída:**
- `tmp/pset-finalized.json` - PSET finalizado e raw transaction

**Exemplo:**
```bash
PRIVKEY_1="your-private-key" ./scripts/4-finalize-pset.sh
```

### 5. `5-broadcast-transaction.sh`
Envia a transação finalizada para a rede Liquid Testnet.

**Entrada:**
- `tmp/pset-finalized.json` - PSET finalizado (do script 4)

**Saída:**
- `tmp/broadcast-result.json` - Resultado do broadcast (txid, status)

**Exemplo:**
```bash
./scripts/5-broadcast-transaction.sh
```

### 6. `6-query-transaction.sh`
Consulta o status de uma transação na Liquid Testnet.

**Entrada:**
- `TXID` - ID da transação (via argumento, env var, ou do script 5)

**Saída:**
- Informações completas da transação e status de confirmação

**Exemplo:**
```bash
# Usando TXID do script 5
./scripts/6-query-transaction.sh

# Ou especificando TXID
./scripts/6-query-transaction.sh 333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240

# Ou via variável de ambiente
TXID="333d18..." ./scripts/6-query-transaction.sh
```

## Fluxo Completo

```bash
# 1. Criar o contrato
./scripts/1-create-contract.sh

# 2. Adicionar fundos ao contrato
./scripts/2-fund-contract.sh

# 3. Criar PSET mínimo
RECIPIENT_ADDRESS="tlq1qq..." ./scripts/3-create-pset.sh

# 4. Finalizar PSET com assinaturas
PRIVKEY_1="your-key" ./scripts/4-finalize-pset.sh

# 5. Broadcast da transação
./scripts/5-broadcast-transaction.sh

# 6. Consultar status da transação
./scripts/6-query-transaction.sh
```

## Arquivos Temporários

Todos os scripts salvam seus resultados em `tmp/*.json`:
- `tmp/contract-info.json` - Informações do contrato criado
- `tmp/funding-info.json` - Informações do funding
- `tmp/pset-minimal.json` - PSET mínimo
- `tmp/pset-finalized.json` - PSET finalizado
- `tmp/broadcast-result.json` - Resultado do broadcast

## Requisitos

- `simc` - Compilador Simplicity
- `hal-simplicity` - Ferramentas HAL para Simplicity
- `jq` - Processador JSON
- Docker com `elementsd1` rodando (para criar e finalizar PSETs)
- Scripts de faucet (`~/faucet.sh` e `~/extract-transaction.sh`)

## Variáveis de Ambiente

Você pode sobrescrever qualquer padrão usando variáveis de ambiente:

```bash
# Diretórios
export PROJECT_ROOT="/path/to/project"
export INFRA_DIR="$PROJECT_ROOT/infra"

# API
export ESPLORA_API="https://blockstream.info/liquidtestnet/api"

# Arquivos
export PROGRAM_SOURCE="$PROJECT_ROOT/contracts/htlc.simf"
export WITNESS_FILE="$PROJECT_ROOT/contracts/htlc.complete.wit"

# Chaves e endereços
export INTERNAL_KEY="50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0"
export PRIVKEY_1="0000000000000000000000000000000000000000000000000000000000000001"
export RECIPIENT_ADDRESS="tlq1qq..."

# Valores
export CONTRACT_AMOUNT="0.00099900"
export CONTRACT_FEE="0.00000100"
```
