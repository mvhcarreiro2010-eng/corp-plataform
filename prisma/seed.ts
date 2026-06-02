import { PrismaClient, Role, ChannelType, LessonType, StepType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ============================================================
  // USUÁRIOS
  // ============================================================
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: adminPassword,
      role: Role.ADMIN,
      jobTitle: 'Administrador do Sistema',
      department: 'TI',
      xp: 5000,
      level: 10,
    },
  })

  const hr = await prisma.user.upsert({
    where: { email: 'rh@empresa.com' },
    update: {},
    create: {
      name: 'Ana Paula - RH',
      email: 'rh@empresa.com',
      password: userPassword,
      role: Role.HR,
      jobTitle: 'Analista de RH',
      department: 'Recursos Humanos',
      xp: 2500,
      level: 6,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'gestor@empresa.com' },
    update: {},
    create: {
      name: 'Carlos Silva - Gestor',
      email: 'gestor@empresa.com',
      password: userPassword,
      role: Role.MANAGER,
      jobTitle: 'Gerente Comercial',
      department: 'Comercial',
      xp: 1800,
      level: 5,
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'colaborador@empresa.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'colaborador@empresa.com',
      password: userPassword,
      role: Role.EMPLOYEE,
      jobTitle: 'Analista Comercial',
      department: 'Comercial',
      xp: 350,
      level: 2,
    },
  })

  console.log('✅ Usuários criados')

  // ============================================================
  // BADGES
  // ============================================================
  await prisma.badge.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Bem-vindo!', description: 'Completou o onboarding', icon: '🌟', condition: 'complete_onboarding' },
      { name: 'Aprendiz', description: 'Completou o primeiro curso', icon: '📚', condition: 'complete_first_course' },
      { name: 'Colaborador Ativo', description: 'Fez 10 comentários no feed', icon: '💬', condition: 'comment_10_times' },
      { name: 'Wiki Master', description: 'Leu 20 artigos da wiki', icon: '🏆', condition: 'read_20_wiki_pages' },
      { name: 'Veterano', description: 'Alcançou nível 5', icon: '⭐', condition: 'reach_level_5', xpRequired: 2000 },
    ],
  })

  console.log('✅ Badges criados')

  // ============================================================
  // POSTS NO FEED
  // ============================================================
  await prisma.post.createMany({
    data: [
      {
        content: '🎉 **Bem-vindos à nossa nova plataforma corporativa!**\n\nEstamos muito felizes em lançar este espaço de aprendizado e comunicação. Aqui você vai encontrar comunicados, treinamentos, a wiki de conhecimentos e muito mais.\n\nExplore, interaja e aproveite ao máximo!',
        authorId: admin.id,
        pinned: true,
      },
      {
        content: '📢 **Lembrete: Reunião Geral de Resultados**\n\nNa próxima sexta-feira, às 14h, teremos nossa reunião mensal de resultados. Todos os colaboradores estão convidados a participar.\n\n📍 Sala de Conferências A ou pelo link da videoconferência (enviaremos por e-mail).',
        authorId: hr.id,
        pinned: false,
      },
      {
        content: '🚀 **Novo curso disponível: Atendimento ao Cliente**\n\nAcabamos de lançar nosso mais novo treinamento! Aprenda as melhores práticas de atendimento ao cliente e ganhe XP.\n\nAcesse a seção **Aprendizado** e comece agora!',
        authorId: hr.id,
        pinned: false,
      },
    ],
  })

  console.log('✅ Posts criados')

  // ============================================================
  // WIKI
  // ============================================================
  const catRH = await prisma.wikiCategory.upsert({
    where: { slug: 'recursos-humanos' },
    update: {},
    create: { name: 'Recursos Humanos', slug: 'recursos-humanos', icon: '👥', color: '#6366f1', order: 1 },
  })

  const catProcessos = await prisma.wikiCategory.upsert({
    where: { slug: 'processos-internos' },
    update: {},
    create: { name: 'Processos Internos', slug: 'processos-internos', icon: '⚙️', color: '#f59e0b', order: 2 },
  })

  const catTI = await prisma.wikiCategory.upsert({
    where: { slug: 'tecnologia' },
    update: {},
    create: { name: 'Tecnologia', slug: 'tecnologia', icon: '💻', color: '#10b981', order: 3 },
  })

  await prisma.wikiPage.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Política de Benefícios',
        slug: 'politica-de-beneficios',
        content: '# Política de Benefícios\n\nNossa empresa oferece um pacote completo de benefícios para todos os colaboradores.\n\n## Plano de Saúde\nCoberta para o colaborador e dependentes.\n\n## Vale Refeição\nR$ 35,00 por dia útil trabalhado.\n\n## Vale Transporte\nVale de acordo com o itinerário cadastrado.\n\n## Gympass\nAcesso a academias parceiras com desconto.',
        excerpt: 'Conheça todos os benefícios oferecidos pela empresa',
        categoryId: catRH.id,
        authorId: hr.id,
      },
      {
        title: 'Processo de Solicitação de Férias',
        slug: 'solicitacao-de-ferias',
        content: '# Como Solicitar Férias\n\n1. Acesse o portal de RH\n2. Selecione "Solicitar Férias"\n3. Escolha o período desejado (mínimo 5 dias)\n4. Aguarde aprovação do gestor (prazo: 3 dias úteis)\n5. Confirme após aprovação\n\n**Importante:** Solicite com no mínimo 30 dias de antecedência.',
        excerpt: 'Passo a passo para solicitar suas férias',
        categoryId: catRH.id,
        authorId: hr.id,
      },
      {
        title: 'Abertura de Chamados de TI',
        slug: 'abertura-de-chamados-ti',
        content: '# Como Abrir um Chamado de TI\n\nPara reportar problemas de tecnologia, siga os passos:\n\n1. Acesse **ti@empresa.com** ou discque **ramal 5555**\n2. Descreva o problema com o máximo de detalhes\n3. Informe seu ramal e departamento\n4. Aguarde retorno em até **4 horas úteis**\n\n## Prioridades\n- 🔴 **Crítico**: Sistema parado (1h)\n- 🟡 **Alto**: Impossibilidade de trabalhar (4h)\n- 🟢 **Normal**: Lentidão, dúvidas (24h)',
        excerpt: 'Como reportar problemas e abrir chamados para o time de TI',
        categoryId: catTI.id,
        authorId: admin.id,
      },
    ],
  })

  console.log('✅ Wiki criada')

  // ============================================================
  // CANAIS DE COMUNIDADE
  // ============================================================
  const channelGeral = await prisma.channel.upsert({
    where: { id: 'channel-geral' },
    update: {},
    create: {
      id: 'channel-geral',
      name: 'geral',
      description: 'Canal principal da empresa',
      type: ChannelType.PUBLIC,
      icon: '🏢',
    },
  })

  await prisma.channel.upsert({
    where: { id: 'channel-avisos' },
    update: {},
    create: {
      id: 'channel-avisos',
      name: 'avisos',
      description: 'Comunicados oficiais',
      type: ChannelType.PUBLIC,
      icon: '📢',
    },
  })

  await prisma.channel.upsert({
    where: { id: 'channel-boas-vindas' },
    update: {},
    create: {
      id: 'channel-boas-vindas',
      name: 'boas-vindas',
      description: 'Dê as boas-vindas aos novos colaboradores',
      type: ChannelType.PUBLIC,
      icon: '👋',
    },
  })

  // Mensagens iniciais
  await prisma.message.createMany({
    data: [
      { content: 'Bem-vindos ao canal geral! 👋', channelId: channelGeral.id, userId: admin.id },
      { content: 'Olá a todos! Feliz em fazer parte do time 😊', channelId: channelGeral.id, userId: employee.id },
      { content: 'Bem-vinda, Maria! Qualquer dúvida, estou por aqui.', channelId: channelGeral.id, userId: hr.id },
    ],
  })

  console.log('✅ Canais e mensagens criados')

  // ============================================================
  // CURSO DE EXEMPLO
  // ============================================================
  const course = await prisma.course.create({
    data: {
      title: 'Atendimento ao Cliente',
      description: 'Aprenda as melhores práticas para oferecer um atendimento excepcional aos clientes.',
      xpReward: 200,
      published: true,
    },
  })

  const module1 = await prisma.module.create({
    data: {
      title: 'Fundamentos do Atendimento',
      order: 1,
      courseId: course.id,
    },
  })

  await prisma.lesson.createMany({
    data: [
      {
        title: 'Introdução ao Atendimento ao Cliente',
        content: '# Introdução\n\nO atendimento ao cliente é a base de qualquer negócio bem-sucedido...\n\n## O que vamos aprender\n- Como entender as necessidades do cliente\n- Comunicação eficaz\n- Resolução de conflitos\n- Fidelização',
        type: LessonType.TEXT,
        order: 1,
        xpReward: 20,
        moduleId: module1.id,
      },
      {
        title: 'Comunicação Eficaz',
        content: '# Comunicação Eficaz\n\nA comunicação é a chave para um bom atendimento...',
        type: LessonType.TEXT,
        order: 2,
        xpReward: 20,
        moduleId: module1.id,
      },
    ],
  })

  console.log('✅ Curso criado')

  // ============================================================
  // TRILHA DE INDUÇÃO
  // ============================================================
  const trail = await prisma.inductionTrail.create({
    data: {
      title: 'Trilha de Integração',
      description: 'Bem-vindo(a)! Complete sua trilha de integração e comece sua jornada conosco.',
      published: true,
    },
  })

  await prisma.inductionStep.createMany({
    data: [
      {
        title: 'Boas-vindas!',
        content: '# Seja bem-vindo(a)! 🌟\n\nEstamos muito felizes em tê-lo(a) em nossa equipe.\n\nNesta trilha, você vai conhecer nossa empresa, nossa cultura, nossas ferramentas e tudo que precisa para começar bem.\n\nVamos começar?',
        type: StepType.LESSON,
        order: 1,
        xpReward: 50,
        trailId: trail.id,
      },
      {
        title: 'Nossa História e Cultura',
        content: '# Nossa História\n\nFundada em 2010, nossa empresa nasceu com o objetivo de...\n\n## Nossos Valores\n- **Inovação**: Buscamos sempre melhorar\n- **Pessoas em primeiro lugar**: Clientes e colaboradores são nossa prioridade\n- **Integridade**: Agimos com honestidade e transparência\n- **Colaboração**: Juntos somos mais fortes',
        type: StepType.LESSON,
        order: 2,
        xpReward: 50,
        trailId: trail.id,
      },
      {
        title: 'Estrutura Organizacional',
        content: '# Estrutura da Empresa\n\nConheça os departamentos e como trabalhamos juntos...\n\n## Departamentos\n- **Comercial**: Vendas e atendimento ao cliente\n- **Operações**: Processos e qualidade\n- **RH**: Pessoas e cultura\n- **TI**: Tecnologia e infraestrutura\n- **Financeiro**: Finanças e contabilidade',
        type: StepType.LESSON,
        order: 3,
        xpReward: 50,
        trailId: trail.id,
      },
      {
        title: 'Ferramentas e Sistemas',
        content: '# Nossas Ferramentas\n\nVeja os principais sistemas que você vai usar no dia a dia...\n\n## Principais Ferramentas\n- 📧 **E-mail corporativo**: seu.nome@empresa.com\n- 💬 **Esta plataforma**: Comunicação, aprendizado e comunidade\n- 📊 **ERP**: Sistema de gestão (solicite acesso ao TI)\n- 📅 **Google Workspace**: Calendário, docs e reuniões',
        type: StepType.LESSON,
        order: 4,
        xpReward: 50,
        trailId: trail.id,
      },
      {
        title: 'Quiz: O que você aprendeu?',
        content: '# Hora de testar seus conhecimentos! 🎯\n\nResponda as perguntas abaixo para concluir sua trilha de integração.',
        type: StepType.QUIZ,
        order: 5,
        xpReward: 100,
        trailId: trail.id,
      },
    ],
  })

  // Quiz para a última etapa
  const quizStep = await prisma.inductionStep.findFirst({
    where: { trailId: trail.id, order: 5 },
  })

  if (quizStep) {
    await prisma.inductionQuiz.createMany({
      data: [
        {
          question: 'Em que ano a empresa foi fundada?',
          options: ['2005', '2008', '2010', '2015'],
          answer: 2,
          stepId: quizStep.id,
        },
        {
          question: 'Qual é o canal correto para reportar problemas de TI?',
          options: ['Falar com o gestor', 'ti@empresa.com ou ramal 5555', 'WhatsApp', 'Enviar carta'],
          answer: 1,
          stepId: quizStep.id,
        },
      ],
    })
  }

  console.log('✅ Trilha de indução criada')
  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('  Admin:       admin@empresa.com / admin123')
  console.log('  RH:          rh@empresa.com / user123')
  console.log('  Gestor:      gestor@empresa.com / user123')
  console.log('  Colaborador: colaborador@empresa.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
