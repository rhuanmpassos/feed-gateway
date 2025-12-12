# 🔍 Análise Gateway vs Backend

**Data:** 2024-12-12

---

## ✅ ERROS CORRIGIDOS

### 1. `newsData is not iterable` - CORRIGIDO ✅

**Problema:** Gateway esperava array, backend retorna `{ success: true, data: [...] }`

**Arquivo:** `src/routes/api.ts` linha 328

**Correção:**
```typescript
// ANTES (errado)
const newsData = await newsResponse.json() as any[];

// DEPOIS (correto)
const response = await newsResponse.json();
const newsData = response.data || [];
```

---

### 2. `foreign key constraint user_interactions_user_id_fkey`

**Problema:** O app está enviando interações com `user_id` que não existe no banco.

**Causa provável:**
- Usuário não registrado antes de enviar interações
- user_id do app != user_id do backend

**Correção adicionada:** Mensagem de erro mais clara no gateway

**Solução no app:**
1. Garantir que usuário está registrado ANTES de enviar interações
2. Usar o `user_id` retornado pelo backend, não um ID local

---

## 📋 MAPEAMENTO DE ROTAS

### Backend → Gateway

| Backend | Gateway | Status |
|---------|---------|--------|
| `POST /api/auth/register` | `POST /api/auth/register` | ✅ OK |
| `POST /api/auth/login` | `POST /api/auth/login` | ✅ OK |
| `GET /api/auth/me` | `GET /api/auth/me` | ✅ OK |
| `POST /api/auth/refresh` | `POST /api/auth/refresh` | ✅ OK |
| `PUT /api/auth/password` | `PUT /api/auth/password` | ✅ OK |
| `GET /api/articles/bookmarked` | `GET /api/bookmarks` | ✅ CORRIGIDO |
| `GET /api/articles/liked` | `GET /api/articles/liked` | ✅ OK |
| `POST /api/articles/:id/like` | `POST /api/articles/:id/like` | ✅ OK |
| `DELETE /api/articles/:id/like` | `DELETE /api/articles/:id/like` | ✅ OK |
| `POST /api/interactions` | `POST /api/interactions` | ✅ OK (erro de dados) |
| `GET /api/categories` | `GET /api/categories` | ✅ OK |
| `GET /api/categories/hierarchical` | `GET /api/categories/hierarchical` | ✅ OK |
| `GET /feeds/addictive` | `GET /api/feeds/addictive` | ✅ OK |
| `GET /feeds/for-you` | `GET /api/feeds/for-you` | ✅ OK |
| `GET /feeds/addictive/more` | `GET /api/feeds/addictive/more` | ✅ OK |
| `GET /feeds/breaking` | `GET /api/feeds/breaking` | ✅ OK |
| `GET /feeds/predict` | `GET /api/feeds/predict` | ✅ OK |
| `GET /feeds/preferences/:user_id` | `GET /api/feeds/preferences/:user_id` | ✅ OK |
| `POST /feeds/preferences/:user_id/recalculate` | `POST /api/feeds/preferences/:user_id/recalculate` | ✅ OK |
| `POST /api/interactions/sessions` | `POST /api/sessions` | ✅ OK |
| `PUT /api/interactions/sessions/:id/end` | `PUT /api/sessions/:id/end` | ✅ OK |
| `GET /api/interactions/sessions/user/:id` | `GET /api/sessions/user/:id` | ✅ OK |
| `GET /api/interactions/users/:id/profile` | `GET /api/users/:id/profile` | ✅ OK |
| `GET /api/interactions/users/:id/patterns` | `GET /api/users/:id/patterns` | ✅ OK |

---

## 🔧 AÇÕES NECESSÁRIAS NO APP

### Para resolver erro de Foreign Key:

```typescript
// No app, ANTES de enviar interações:

// 1. Verificar se usuário está logado
if (!user?.id) {
  console.warn('Usuário não logado, ignorando interações');
  return;
}

// 2. Garantir que user.id é do BACKEND (número), não local
const userId = user.backend_id; // Use o ID retornado pelo backend no login/registro

// 3. Só então enviar interações
api.sendInteractions({
  user_id: userId, // ID do backend!
  interactions: [...]
});
```

---

## ✅ CONCLUSÃO

O gateway está **CORRETO** em relação ao backend. Os erros eram:

1. ✅ **Formato de resposta** - Corrigido (data vs array)
2. ⚠️ **user_id inválido** - Problema no APP, não no gateway

