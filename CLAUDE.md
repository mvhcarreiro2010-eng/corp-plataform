@AGENTS.md

# CorpHub — Plataforma Corporativa

Plataforma corporativa completa (LMS + CMS + Rede Social Interna) em produção em https://plataforma.lgtreinamento.com.br

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Banco | PostgreSQL (Supabase) + Prisma ORM v5 |
| Auth | NextAuth.js v5 (JWT, credenciais email/senha) |
| Editor | TipTap (wiki e posts ricos) |
| Storage | Supabase Storage (buckets: `images`, `videos`; PDFs em `images/documents/`) |
| Real-time | Pusher (mensagens de comunidade) |
| Deploy | VPS Linux + PM2 + Git |

---

## Deploy

```bash
# No VPS via SSH:
cd /var/www/corp-platform && git pull && npx prisma generate && npm run build && pm2 restart corp-platform

# Quando há mudanças no schema (novos campos/modelos):
cd /var/www/corp-platform && git pull && npx prisma db push && npm run build && pm2 restart corp-platform
```

**NUNCA** usar `prisma migrate dev` em produção — usar sempre `prisma db push`.

---

## Contas de Teste (NUNCA sobrescrever)

| Email | Senha | Role |
|-------|-------|------|
| admin@empresa.com | Spot@2026 | ADMIN |
| rh@empresa.com | Spot@2026 | HR |
| gestor@empresa.com | Spot@2026 | MANAGER |
| colaborador@empresa.com | Spot@2026 | EMPLOYEE |

Senha padrão para usuários importados via CSV: `Spot@2026` (bcrypt, cost 12).

---

## Roles de Usuário

```
ADMIN       → Acesso total a tudo
HR          → Cria/edita conteúdo, gerencia usuários, vê relatórios
MANAGER     → Vê relatórios da equipe, modera
COORDINATOR → Coordena um grupo de usuários
LEADER      → Lidera um grupo de usuários
INSTRUCTOR  → Instrui alunos
EDITOR      → Cria posts e conteúdo
EMPLOYEE    → Consome conteúdo, interage
```

---

## Estrutura de Pastas

```
app/
├── (auth)/entrar/          → Página de login
├── (platform)/             → Layout autenticado (Sidebar + Header)
│   ├── feed/               → Feed de posts
│   ├── comunicados/        → Comunicados com aceite obrigatório
│   ├── wiki/               → Base de conhecimento
│   ├── comunidade/         → Chat por canais (Pusher)
│   ├── aprendizado/        → Cursos e lições
│   ├── inducao/            → Trilha de onboarding estilo Duolingo
│   ├── treinamentos/       → Treinamentos online
│   ├── avaliacoes/         → Avaliações (exceto testeRapido)
│   ├── ranking/            → Leaderboard de XP e interações
│   ├── loja/               → Loja de recompensas com pontos
│   ├── dashboard/          → Métricas por role
│   ├── perfil/             → Perfil do usuário, XP, badges
│   └── admin/              → Área administrativa (ADMIN/HR)
│       ├── posts/          → Gerenciar posts do feed
│       ├── wiki/           → Gerenciar artigos wiki
│       ├── cursos/         → Builder de cursos
│       ├── inducao/        → Builder da trilha de indução
│       ├── avaliacoes/     → Gerenciar avaliações + Teste Rápido
│       ├── comunicados/    → Gerenciar comunicados
│       ├── usuarios/       → CRUD + importação CSV
│       ├── bus/            → Gerenciar Business Units
│       ├── turmas/         → Gerenciar turmas
│       ├── comunidade/     → Gerenciar canais
│       └── loja/           → Gerenciar produtos da loja
└── api/
    ├── posts/              → CRUD posts + likes + comentários
    ├── wiki/               → CRUD wiki (categorias + páginas)
    ├── avaliacoes/         → CRUD + iniciar + submeter tentativas
    ├── popup-test/         → GET: popup obrigatório pendente
    ├── ranking/            → Leaderboard com filtro de período
    ├── upload/             → Upload imagem/vídeo/PDF → Supabase
    ├── search/             → Busca full-text wiki + cursos + avaliações
    ├── notificacoes/       → Posts recentes para o sino do header
    ├── admin/
    │   ├── avaliacoes/     → Lista TUDO (drafts + testeRapido)
    │   ├── bus/            → CRUD Business Units
    │   ├── usuarios/       → CRUD + importação CSV
    │   └── export/notas/   → CSV de notas
    └── ...

components/
├── layout/
│   ├── Sidebar.tsx         → Nav lateral (hidden md:flex)
│   ├── Header.tsx          → Header com busca, sino, avatar
│   ├── MobileNav.tsx       → Bottom tab bar (md:hidden)
│   ├── PopupTest.tsx       → Popup obrigatório de testeRapido
│   ├── SearchBar.tsx       → Busca com dropdown live (debounce 300ms)
│   └── Chatbot.tsx         → IA flutuante (Claude API)
├── admin/
│   ├── PostEditor.tsx      → Editor de posts (criar/editar)
│   └── VisibilityConfig.tsx → Painel de segmentação reutilizável
├── feed/
│   ├── PostCard.tsx        → Card do post com like/comment
│   ├── CreatePost.tsx      → Formulário de criar post inline
│   └── CommentSection.tsx  → Comentários
├── wiki/
│   └── PdfUpload.tsx       → Upload/preview de PDF em artigos
├── editor/
│   └── RichEditor.tsx      → TipTap wrapper (posts e wiki)
└── ui/
    ├── TagInput.tsx        → Input de tags (Enter/vírgula)
    └── ... (shadcn/ui)

lib/
├── auth.ts                 → Config NextAuth + callbacks JWT
├── prisma.ts               → Singleton Prisma Client
├── segmentation.ts         → buildSegFilter() — filtro BU/role/userId
├── supabase.ts             → Cliente Supabase Storage admin
└── utils.ts                → cn(), timeAgo(), getRoleLabel(), xpProgress()
```

---

## Sistema de Segmentação de Conteúdo

Todo conteúdo (Post, WikiPage, Course, InductionTrail, Avaliacao) tem 3 campos:

```prisma
buIds      String[]  @default([])  // Business Units que podem ver
roleFilter String[]  @default([])  // Roles que podem ver
userIds    String[]  @default([])  // Pessoas específicas que podem ver
```

**Regra:** array vazio = sem restrição (todos vêem). Arrays preenchidos = apenas quem bate.

A função `buildSegFilter(user)` em `lib/segmentation.ts` gera o filtro Prisma com lógica AND + OR aninhados. É usada em todas as rotas GET de leitura de conteúdo.

O componente `VisibilityConfig` em `components/admin/VisibilityConfig.tsx` é a UI reutilizável para configurar esse filtro nos formulários admin.

---

## Sistema de Avaliações

### Tipos de Avaliação

| Campo `testeRapido` | Comportamento |
|---------------------|---------------|
| `false` (padrão) | Aparece em `/avaliacoes`, banco de questões, tentativas rastreadas |
| `true` | **Popup obrigatório** na entrada da plataforma, NÃO aparece em `/avaliacoes` |

### Fluxo de uma Avaliação Normal

```
1. Admin cria avaliação em /admin/avaliacoes
2. Admin adiciona questões em /admin/avaliacoes/[id]/questoes
3. Admin publica (toggle Eye icon)
4. Usuário vê em /avaliacoes e clica "Iniciar"
5. POST /api/avaliacoes/[id]/iniciar → sorteia questões, cria Tentativa
6. Usuário responde → POST /api/avaliacoes/[id]/submeter → calcula nota
7. Resultado salvo na Tentativa com nota, acertos, finalizadaEm
```

### Fluxo do Popup Test (Teste Rápido)

```
1. Admin clica "Teste Rápido" ⚡ em /admin/avaliacoes
2. Preenche título + pergunta + 4 opções + marca correta
3. API cria Avaliacao (testeRapido:true) + Questao + publica direto
4. Qualquer usuário que entrar na plataforma → <PopupTest /> no layout
5. GET /api/popup-test → retorna primeiro testeRapido sem tentativa do usuário
6. Popup aparece cobrindo tudo (z-100, sem close)
7. Usuário responde → usa iniciar/submeter normal → fecha popup
8. Nunca mais aparece para esse usuário (tentativa finalizada existe)
```

### Anti-cola

Na tela de avaliação normal (`/avaliacoes/[id]`):
- `visibilitychange` + `blur` detecta troca de aba/janela
- 1ª troca = aviso modal
- 2ª troca = submissão forçada (`fechadaPorTrapa: true`)

---

## Sistema de Ranking

**Rota:** `GET /api/ranking?period=all|month|week`

**Fórmula de pontuação:**
```
score = xp + posts*20 + comments*5 + likes*2 + coursesCompleted*50 + avaliacoes*10 + inducaoSteps*10
```

**Página `/ranking`:**
- Filtro de período (Geral / Este mês / Esta semana)
- Pódio top 3 (ouro/prata/bronze), 1º centralizado e maior
- Card azul com posição do usuário atual (se fora do top 3)
- Lista completa com breakdown de interações por ícones

---

## Layout Mobile

**Padrão:** sidebar oculta em mobile, bottom tab bar fixa.

| Elemento | Desktop | Mobile |
|----------|---------|--------|
| Sidebar | `md:flex` (visível) | `hidden` (oculto) |
| Bottom Nav | `hidden` | `md:hidden fixed bottom-0` |
| Header busca | Barra inline | Ícone → overlay full-screen |
| Padding conteúdo | `pb-6` | `pb-24` (espaço para bottom nav) |

**Safe area iOS:** `padding-bottom: env(safe-area-inset-bottom)` via classe `.safe-bottom` no `globals.css`.

**Bottom Nav tabs (mobile):** Feed · Comunidade · Ranking · Aprender · Perfil

---

## Upload de Arquivos

**Rota:** `POST /api/upload`

| Tipo | MIME | Bucket Supabase | Limite |
|------|------|-----------------|--------|
| Imagem | `image/jpeg,png,gif,webp` | `images/` | 10MB |
| Vídeo | `video/mp4,webm,ogg,quicktime` | `videos/` | 500MB |
| PDF | `application/pdf` | `images/documents/` | 50MB |

Retorna `{ url, type, name? }`. PDFs vão para o bucket `images` com prefixo `documents/` para não precisar de novo bucket no Supabase.

---

## Wiki com PDF

Campos adicionados ao modelo `WikiPage`:
```prisma
pdfUrl  String?  // URL pública no Supabase
pdfName String?  // Nome original do arquivo
```

O componente `PdfUpload` (`components/wiki/PdfUpload.tsx`) gerencia o upload e mostra um chip vermelho com nome, botão de visualizar e remover.

Na visualização do artigo (`/wiki/[slug]`), quando há PDF:
- Card vermelho com nome + botões Baixar e Abrir
- Iframe embutido recolhível (`<details open>`) com 70vh de altura
- Parâmetros `#toolbar=1&navpanes=0` no src do iframe

---

## Gamificação

| Ação | XP |
|------|----|
| Comentar no feed | +5 XP |
| Completar lição | +20 XP |
| Quiz 100% | +30 XP |
| Etapa de indução | +50 XP |
| Completar curso | +100 XP |

**Níveis:** 1 (0) → 2 (200) → 3 (500) → 4 (1000) → 5 (2000) → ...

---

## Padrões de Código

### Toda API Route

```typescript
export async function GET/POST/PUT/DELETE(req, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  // lógica...
  return NextResponse.json(data)
}
```

### Toda Page Client

```typescript
'use client'
export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/rota').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])
  if (loading) return <Loader2 ... />
  return <div>{data.map(item => <Card key={item.id} ... />)}</div>
}
```

### Segmentação em APIs de Leitura

```typescript
import { buildSegFilter } from '@/lib/segmentation'
const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
const where = isAdmin ? {} : { published: true, ...buildSegFilter(session.user) }
const items = await prisma.model.findMany({ where })
```

---

## Modelos Prisma Principais

```
User          → id, name, email, password, role, xp, level, buId, avatar...
BusinessUnit  → id, name, region
Post          → id, content, mediaUrl, mediaType, pinned, buIds[], roleFilter[], userIds[]
WikiPage      → id, title, slug, content, pdfUrl, pdfName, buIds[], roleFilter[], userIds[]
WikiCategory  → id, name, slug, icon, color, parentId (árvore recursiva)
Course        → id, title, modules[], buIds[], roleFilter[], userIds[]
InductionTrail → id, title, steps[], buIds[], roleFilter[], userIds[]
Avaliacao     → id, title, questoesExibir, testeRapido, published, buIds[], roleFilter[], userIds[]
Questao       → id, enunciado, options[], answer, tipo, avaliacaoId
Tentativa     → id, userId, avaliacaoId, respostas(JSON), nota, finalizadaEm
Comunicado    → id, title, content, urgente, requireAceite
Message       → id, content, channelId, userId
Badge/UserBadge → sistema de conquistas
```

---

## Variáveis de Ambiente Necessárias

```env
DATABASE_URL=           # PostgreSQL Supabase connection string
NEXTAUTH_URL=           # URL pública da aplicação
NEXTAUTH_SECRET=        # Secret JWT (random string longa)
SUPABASE_URL=           # URL do projeto Supabase
SUPABASE_SERVICE_KEY=   # Service role key (admin, para uploads)
ANTHROPIC_API_KEY=      # Chatbot IA (Claude API)
PUSHER_APP_ID=          # Real-time (comunidade)
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
```
