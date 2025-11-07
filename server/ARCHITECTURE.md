# Arquitetura - INSSats API

## 📊 Visão Geral

```
┌─────────────────┐
│   UI Client     │
│   (Browser)     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────────────┐
│        Express API Server               │
│         (Port 3001)                     │
│                                         │
│  ┌────────────────────────────────┐   │
│  │  Routes (contract.ts)          │   │
│  │  - POST /contract/create       │   │
│  │  - POST /contract/fund         │   │
│  │  - POST /contract/pset/create  │   │
│  │  - POST /contract/pset/finalize│   │
│  │  - POST /contract/broadcast    │   │
│  │  - GET /transaction/:txid      │   │
│  └───────────┬────────────────────┘   │
│              │                         │
│  ┌───────────▼────────────────────┐   │
│  │  ScriptExecutor                │   │
│  │  - Execute bash scripts        │   │
│  │  - Parse outputs               │   │
│  │  - Environment variables       │   │
│  └───────────┬────────────────────┘   │
└──────────────┼──────────────────────────┘
               │ Shell exec
               ▼
┌──────────────────────────────────────────┐
│         Bash Scripts Layer               │
│                                          │
│  1-create-contract.sh                   │
│  2-fund-contract.sh                     │
│  3-create-pset.sh                       │
│  4-finalize-pset.sh                     │
│  5-broadcast-transaction.sh             │
│  6-query-transaction.sh                 │
└────┬──────────────────┬─────────────────┘
     │                  │
     │ simc             │ elements-cli
     │ hal-simplicity   │ (Docker)
     ▼                  ▼
┌─────────────┐   ┌──────────────────┐
│  Simplicity │   │  Elements Node   │
│  Compiler   │   │  (elementsd1)    │
└─────────────┘   └──────────────────┘
                         │
                         │ RPC
                         ▼
                  ┌──────────────────┐
                  │  Liquid Testnet  │
                  │  Blockchain      │
                  └──────────────────┘
```

## 🔄 Fluxo de Dados

### 1. Create Contract
```
Client → API → Script 1 → simc compiler
                       ↓
                  Contract Address
                       ↓
Client ← API ← Script 1
```

### 2. Fund Contract
```
Client → API → Script 2 → Esplora API (faucet)
                       ↓
                  TXID + funding info
                       ↓
Client ← API ← Script 2
```

### 3. Create PSET
```
Client → API → Script 3 → elementsd1 (Docker)
                       ↓
                  Minimal PSET
                       ↓
Client ← API ← Script 3
```

### 4. Finalize PSET
```
Client → API → Script 4 → hal-simplicity
                       ↓
                  hal-elements
                       ↓
                  Signed PSET + Raw TX
                       ↓
Client ← API ← Script 4
```

### 5. Broadcast
```
Client → API → Script 5 → Esplora API
                       ↓
                  TXID + status
                       ↓
Client ← API ← Script 5
```

### 6. Query
```
Client → API → Script 6 → Esplora API
                       ↓
                  TX details + status
                       ↓
Client ← API ← Script 6
```

## 🔐 Camadas de Segurança

```
┌─────────────────────────────────────────┐
│  Client Layer (Untrusted)               │
│  - Pode enviar endereços                │
│  - Pode enviar valores                  │
│  - NÃO pode enviar código de contrato   │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼──────────┐
        │   Validation      │
        │   Layer           │
        └────────┬──────────┘
                 │
┌────────────────▼────────────────────────┐
│  API Layer (Trusted)                    │
│  - Valida inputs do cliente             │
│  - Aplica regras de negócio             │
│  - Adiciona variáveis de ambiente       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Script Layer (Server-Controlled)       │
│  - programSource = server constant      │
│  - internalKey = server constant        │
│  - Contract logic = server-defined      │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Execution Layer (Sandboxed)            │
│  - Bash scripts executados isoladamente │
│  - Sem acesso ao filesystem do servidor │
│  - Output sanitizado antes de retornar  │
└─────────────────────────────────────────┘
```

## 📦 Estrutura de Diretórios

```
INSSats/
├── server/                    # API REST
│   ├── src/
│   │   ├── routes/
│   │   │   └── contract.ts   # Endpoints REST
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── scriptExecutor.ts  # Bash executor
│   │   └── server.ts         # Express app
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── API_EXAMPLES.md
│   ├── CHANGELOG.md
│   ├── SUMMARY.md
│   ├── QUICKSTART.md
│   ├── ARCHITECTURE.md       # Este arquivo
│   └── test-complete-workflow.sh
│
├── scripts/                   # Bash scripts modulares
│   ├── 1-create-contract.sh
│   ├── 2-fund-contract.sh
│   ├── 3-create-pset.sh
│   ├── 4-finalize-pset.sh
│   ├── 5-broadcast-transaction.sh
│   └── 6-query-transaction.sh
│
├── contracts/                 # Código Simplicity
│   ├── htlc.simf             # Contrato HTLC
│   └── htlc.complete.wit     # Witness completo
│
├── infra/                     # Infraestrutura Docker
│   ├── docker-compose.yml
│   └── elementsdir1/         # Dados do Elements node
│
└── ui/                        # Frontend (futuro)
    └── src/
```

## 🔄 Padrão de Comunicação

### Request/Response Flow

```typescript
// 1. Client Request
POST /contract/create
Body: {}
Headers: { "Content-Type": "application/json" }

// 2. API Processing
router.post('/create', async (req, res) => {
  const env = { OUTPUT_FILE: '/dev/null' };
  const { stdout } = await executor.executeScript('1-create-contract.sh', env);
  // ...
});

// 3. Script Execution
$ bash 1-create-contract.sh
Environment:
  OUTPUT_FILE=/dev/null
  PROGRAM_SOURCE=/path/to/htlc.simf  # SERVER CONSTANT
  INTERNAL_KEY=50929b74...           # SERVER CONSTANT

// 4. Script Output
CMR = abc123...
CONTRACT_ADDRESS = lq1xyz...
BYTECODE = 0x...

// 5. API Response
{
  "cmr": "abc123...",
  "contractAddress": "lq1xyz...",
  "bytecode": "0x...",
  "internalKey": "50929b74...",      // Read-only
  "programSource": "/path/to/htlc.simf"  // Read-only
}
```

## 🛡️ Modelo de Segurança

### Princípio de Privilégio Mínimo

```
Cliente tem acesso a:
  ✅ Criar contrato (com lógica pré-definida)
  ✅ Financiar endereços
  ✅ Fornecer endereço de recebimento
  ✅ Consultar transações públicas

Cliente NÃO tem acesso a:
  ❌ Modificar código do contrato
  ❌ Escolher chaves internas
  ❌ Executar código arbitrário
  ❌ Acessar filesystem do servidor
  ❌ Modificar variáveis de ambiente críticas
```

### Variáveis Controladas

| Variável | Fonte | Mutável? |
|----------|-------|----------|
| `PROGRAM_SOURCE` | Server constant | ❌ Não |
| `INTERNAL_KEY` | Server constant | ❌ Não |
| `CONTRACT_ADDRESS` | Client parameter | ✅ Sim |
| `RECIPIENT_ADDRESS` | Client parameter | ✅ Sim |
| `AMOUNT` | Client parameter | ✅ Sim |
| `FEE` | Client parameter | ✅ Sim |

## 🚀 Escalabilidade

### Atual (MVP)
- Suporta 1 tipo de contrato (HTLC)
- Execução síncrona
- Sem cache
- Sem rate limiting

### Próximas Melhorias
- Suporte a múltiplos tipos de contrato
- Processamento assíncrono com filas
- Cache de consultas frequentes
- Rate limiting por IP/usuário
- Clustering para alta disponibilidade

## 📊 Métricas Sugeridas

```typescript
// Métricas importantes a monitorar
- contract_creation_time_ms
- contract_funding_time_ms
- pset_creation_time_ms
- pset_finalization_time_ms
- broadcast_success_rate
- transaction_confirmation_time_ms
- api_request_count (por endpoint)
- api_error_count (por tipo)
- script_execution_failures
```

## 🔍 Troubleshooting

### Fluxo de Debug

```
1. Client error
   ↓
2. Check API logs
   ↓
3. Check script execution
   ↓
4. Check Docker containers
   ↓
5. Check Liquid Testnet status
```

### Logs Importantes

```bash
# API logs
npm run dev

# Docker logs
docker logs elementsd1

# Script logs
bash -x scripts/1-create-contract.sh
```

---

**Versão**: 1.0.0  
**Última atualização**: 2024-01-XX
