# INSSats Contract API

API RESTful para criar, financiar e fazer claim de contratos Simplicity na Liquid Testnet.

## 📚 Documentação

- **[QUICKSTART.md](QUICKSTART.md)** - Comece aqui! Guia rápido de 5 minutos
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Exemplos detalhados de uso da API
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura e fluxo de dados
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de mudanças e melhorias
- **[SUMMARY.md](SUMMARY.md)** - Resumo técnico completo do projeto
- **README.md** (este arquivo) - Documentação de referência da API

---

## Instalação

```bash
cd server
npm install
```

## Configuração

Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme necessário:

```bash
cp .env.example .env
```

## Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`

## Build

```bash
npm run build
npm start
```

## Endpoints

### 1. Criar Contrato
**POST** `/contract/create`

Compila o código Simplicity e gera o endereço do contrato.

> ⚠️ **IMPORTANTE**: O `programSource` e `internalKey` são definidos no servidor por questões de segurança. O cliente **não pode** controlar esses parâmetros.

**Request:**
```json
{}
```

**Response:**
```json
{
  "cmr": "abc123...",
  "contractAddress": "lq1...",
  "bytecode": "0x...",
  "internalKey": "50929b74...",      // Apenas para referência
  "programSource": "/path/to/contract.simf",  // Apenas para referência
  "compiledProgram": "0x..."
}
```

### 2. Financiar Contrato
**POST** `/contract/fund`

Solicita fundos do faucet para o endereço do contrato.

**Request:**
```json
{
  "contractAddress": "lq1..."
}
```

**Response:**
```json
{
  "txid": "abc123...",
  "vout": 0,
  "scriptPubkey": "0x...",
  "asset": "abc...",
  "value": "0.001",
  "valueSats": 100000
}
```

### 3. Criar PSET
**POST** `/contract/pset/create`

Cria um PSET mínimo para gastar os fundos do contrato.

**Request:**
```json
{
  "txid": "abc123...",
  "recipientAddress": "tlq1...",    // opcional
  "amount": "0.00099900",           // opcional
  "fee": "0.00000100"               // opcional
}
```

**Response:**
```json
{
  "pset": "cHNldP8BAF...",
  "recipientAddress": "tlq1...",
  "amount": "0.00099900",
  "fee": "0.00000100"
}
```

### 4. Finalizar PSET
**POST** `/contract/pset/finalize`

Finaliza o PSET com assinaturas e witness.

> ⚠️ **IMPORTANTE**: O `programSource` e `internalKey` são definidos no servidor por questões de segurança. O cliente **não pode** controlar esses parâmetros.

**Request (Mínimo):**
```json
{
  "pset": "cHNldP8BAF...",
  "scriptPubkey": "0x...",
  "asset": "abc...",
  "value": "0.001"
}
```

**Request (Com Opcionais):**
```json
{
  "pset": "cHNldP8BAF...",
  "scriptPubkey": "0x...",
  "asset": "abc...",
  "value": "0.001",
  "cmr": "abc123...",              // opcional
  "privateKey": "0000...",          // opcional
  "witnessFile": "/path/to/file.wit" // opcional
}
```

**Response:**
```json
{
  "pset": "cHNldP8BAF...",
  "rawTx": "0200000000...",
  "signature": "abc123..."
}
```

### 5. Broadcast Transação
**POST** `/contract/broadcast`

Envia a transação finalizada para a rede.

**Request:**
```json
{
  "rawTx": "0200000000..."
}
```

**Response:**
```json
{
  "txid": "abc123...",
  "status": "pending",
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/abc123..."
}
```

### 6. Consultar Transação
**GET** `/contract/transaction/:txid`

Consulta o status de uma transação.

**Response:**
```json
{
  "txid": "abc123...",
  "transaction": { ... },
  "status": { ... },
  "confirmed": true,
  "blockHeight": 123456,
  "blockTime": 1234567890,
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/abc123..."
}
```

### Health Check
**GET** `/health`

Verifica o status do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T...",
  "uptime": 123.45
}
```

## Exemplo de Uso Completo

```bash
# 1. Criar contrato
curl -X POST http://localhost:3001/contract/create \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Financiar contrato
curl -X POST http://localhost:3001/contract/fund \
  -H "Content-Type: application/json" \
  -d '{"contractAddress": "lq1..."}'

# 3. Criar PSET
curl -X POST http://localhost:3001/contract/pset/create \
  -H "Content-Type: application/json" \
  -d '{"txid": "abc123..."}'

# 4. Finalizar PSET
curl -X POST http://localhost:3001/contract/pset/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "pset": "cHNldP8BAF...",
    "scriptPubkey": "0x...",
    "asset": "abc...",
    "value": "0.001"
  }'

# 5. Broadcast
curl -X POST http://localhost:3001/contract/broadcast \
  -H "Content-Type: application/json" \
  -d '{"rawTx": "0200000000..."}'

# 6. Consultar transação
curl http://localhost:3001/contract/transaction/abc123...
```

## Requisitos

- Node.js >= 18
- Docker com `elementsd1` rodando (para criar e finalizar PSETs)
- `simc` - Compilador Simplicity
- `hal-simplicity` - Ferramentas HAL para Simplicity
- Scripts de faucet configurados

## Segurança

### Proteção Contra Injeção de Contrato

Este servidor implementa proteções importantes contra injeção de código malicioso:

1. **Código do Contrato Controlado pelo Servidor**: O `programSource` (código Simplicity) é definido no servidor e não pode ser modificado pelo cliente. Isso previne que usuários maliciosos executem código arbitrário.

2. **Chaves Internas Protegidas**: O `internalKey` usado para assinatura é controlado pelo servidor, prevenindo uso não autorizado de chaves privadas.

3. **Endpoints Afetados**:
   - `POST /contract/create` - Não aceita parâmetros de entrada
   - `POST /contract/pset/finalize` - Não aceita `programSource` ou `internalKey`

4. **Dados Retornados como Referência**: Embora o servidor retorne `programSource` e `internalKey` nas respostas, esses valores são apenas informativos e não podem ser usados para modificar o comportamento do servidor.

### Próximos Passos de Segurança (Recomendado)

- [ ] Implementar autenticação JWT
- [ ] Adicionar rate limiting por IP
- [ ] Implementar validação de entrada mais rigorosa
- [ ] Adicionar logging de auditoria
- [ ] Configurar HTTPS para produção
- [ ] Implementar whitelist de IPs permitidos

## Estrutura

```
server/
├── src/
│   ├── routes/
│   │   └── contract.ts       # Rotas da API
│   ├── types/
│   │   └── index.ts          # Tipos TypeScript
│   ├── utils/
│   │   └── scriptExecutor.ts # Executor de scripts bash
│   └── server.ts             # Servidor principal
├── package.json
├── tsconfig.json
└── .env.example
```

## Erros Comuns

### Docker não disponível
```json
{
  "error": "Failed to create PSET",
  "details": "Docker container elementsd1 is not running"
}
```
**Solução:** Inicie o container: `cd infra && docker compose up -d elementsd1`

### Script não encontrado
```json
{
  "error": "Failed to create contract",
  "details": "Script execution failed: ..."
}
```
**Solução:** Certifique-se de que os scripts em `../scripts/` existem e são executáveis
