# 🚀 Guia Rápido - INSSats API

## Início em 5 Minutos

### 1. Pré-requisitos

```bash
# Certifique-se de ter instalado:
- Node.js >= 18
- Docker & Docker Compose
- simc (Simplicity compiler)
- hal-simplicity
```

### 2. Iniciar Infraestrutura

```bash
cd infra
docker compose up -d elementsd1
cd ..
```

### 3. Instalar e Iniciar API

```bash
cd server
npm install
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

### 4. Testar

```bash
# Teste rápido (health check)
curl http://localhost:3001/health

# Teste completo
./test-complete-workflow.sh
```

## 📝 Exemplo Rápido

```bash
# 1. Criar contrato
CREATE=$(curl -s -X POST http://localhost:3001/contract/create -H "Content-Type: application/json" -d '{}')
ADDRESS=$(echo $CREATE | jq -r '.contractAddress')

# 2. Financiar
FUND=$(curl -s -X POST http://localhost:3001/contract/fund -H "Content-Type: application/json" -d "{\"contractAddress\":\"$ADDRESS\"}")
TXID=$(echo $FUND | jq -r '.txid')
SCRIPT_PUBKEY=$(echo $FUND | jq -r '.scriptPubkey')
ASSET=$(echo $FUND | jq -r '.asset')
VALUE=$(echo $FUND | jq -r '.value')

# 3. Criar PSET
PSET_CREATE=$(curl -s -X POST http://localhost:3001/contract/pset/create -H "Content-Type: application/json" -d "{\"txid\":\"$TXID\"}")
PSET=$(echo $PSET_CREATE | jq -r '.pset')

# 4. Finalizar
FINALIZE=$(curl -s -X POST http://localhost:3001/contract/pset/finalize -H "Content-Type: application/json" -d "{\"pset\":\"$PSET\",\"scriptPubkey\":\"$SCRIPT_PUBKEY\",\"asset\":\"$ASSET\",\"value\":\"$VALUE\"}")
RAW_TX=$(echo $FINALIZE | jq -r '.rawTx')

# 5. Broadcast
BROADCAST=$(curl -s -X POST http://localhost:3001/contract/broadcast -H "Content-Type: application/json" -d "{\"rawTx\":\"$RAW_TX\"}")
CLAIM_TXID=$(echo $BROADCAST | jq -r '.txid')

# 6. Verificar
curl http://localhost:3001/contract/transaction/$CLAIM_TXID | jq
```

## 🔍 Verificação de Problemas

### Servidor não inicia?
```bash
# Verifique se a porta 3001 está livre
lsof -i :3001

# Verifique logs
npm run dev
```

### Docker não disponível?
```bash
# Inicie o container Elements
cd infra
docker compose up -d elementsd1

# Verifique status
docker ps | grep elements
```

### Script não funciona?
```bash
# Verifique se os scripts são executáveis
chmod +x scripts/*.sh

# Verifique se as ferramentas estão instaladas
which simc
which hal-simplicity
```

## 📚 Documentação Completa

- **README.md** - Guia completo da API
- **API_EXAMPLES.md** - Exemplos detalhados de uso
- **CHANGELOG.md** - Histórico de mudanças
- **SUMMARY.md** - Resumo técnico completo

## ⚠️ Importante - Segurança

Esta API implementa segurança por design:
- ✅ Código do contrato é **server-side only**
- ✅ Chaves internas são **protegidas**
- ✅ Cliente **não pode injetar** código malicioso

**Nunca** aceite `programSource` ou `internalKey` de clientes não confiáveis!

## 🎯 Próximos Passos

1. ✅ API funcionando? → Continue para integração com UI
2. ❌ Problemas? → Veja README.md ou verifique logs
3. 🤔 Dúvidas? → Consulte API_EXAMPLES.md

## 💡 Dicas

- Use `test-complete-workflow.sh` para validar tudo está funcionando
- Monitore logs do servidor durante desenvolvimento
- Use o Explorer da Liquid Testnet para verificar transações
- Mantenha o Docker rodando enquanto usa a API

---

**Pronto para começar!** 🚀
