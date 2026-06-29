import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import {
  authUsers,
  domains,
  projectTypeEnum,
  projects,
} from "../schema";
import { createDbClient } from "../client";

loadEnvConfig(process.cwd());

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DomainSeed = {
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystem?: boolean;
};

type ProjectSeed = {
  domainName: string;
  name: string;
  description: string;
  type?: (typeof projectTypeEnum.enumValues)[number];
};

const domainSeeds: DomainSeed[] = [
  {
    name: "Inbox",
    description: "Entrada obrigatória para itens ainda não classificados.",
    color: "#71717a",
    icon: "inbox",
    isSystem: true,
  },
  {
    name: "Faculdade FEEC",
    description: "Unicamp, disciplinas, provas, relatórios e prazos.",
    color: "#2563eb",
    icon: "graduation-cap",
  },
  {
    name: "Serena & Energia",
    description: "Estágio, mercado livre de energia e aprendizado setorial.",
    color: "#16a34a",
    icon: "zap",
  },
  {
    name: "Carreira & Processos",
    description: "Vagas, currículo, LinkedIn, entrevistas e reposicionamento.",
    color: "#7c3aed",
    icon: "briefcase",
  },
  {
    name: "TCC & Pesquisa",
    description: "Data centers sustentáveis, bibliografia e escrita.",
    color: "#0891b2",
    icon: "book-open",
  },
  {
    name: "Vida Pessoal",
    description: "Pendências práticas, documentos, compras e compromissos.",
    color: "#db2777",
    icon: "home",
  },
  {
    name: "Casa & Finanças",
    description: "Contas, orçamento, carro, moradia e logística pessoal.",
    color: "#ca8a04",
    icon: "wallet",
  },
  {
    name: "Saúde, Energia & Rotina",
    description: "Sono, energia, humor, treino, consultas e rotina mínima.",
    color: "#dc2626",
    icon: "heart-pulse",
  },
  {
    name: "Relações & Família",
    description: "Família, Nicole, amigos, presença e vínculos importantes.",
    color: "#ea580c",
    icon: "users",
  },
  {
    name: "Aprendizado & Biblioteca",
    description: "Livros, cursos, referências, ideias e repertório.",
    color: "#4f46e5",
    icon: "library",
  },
  {
    name: "Construções & Projetos Técnicos",
    description: "Lucas OS, GitHub, dashboards, automações e experimentos.",
    color: "#0f766e",
    icon: "hammer",
  },
];

const projectSeeds: ProjectSeed[] = [
  {
    domainName: "Faculdade FEEC",
    name: "Controle — Projeto computacional",
    description: "Projeto computacional de Controle.",
    type: "deadline",
  },
  {
    domainName: "Faculdade FEEC",
    name: "Controle — Prova final",
    description: "Preparação para prova final de Controle.",
    type: "deadline",
  },
  {
    domainName: "Faculdade FEEC",
    name: "Fechamento semestre 2026.1",
    description: "Organização dos prazos finais do semestre.",
    type: "seasonal",
  },
  {
    domainName: "Serena & Energia",
    name: "Onboarding Serena Energia",
    description: "Entrada e adaptação ao estágio na Serena Energia.",
    type: "administrative",
  },
  {
    domainName: "Serena & Energia",
    name: "Trilha de estudos em desenvolvimento de projetos",
    description: "Base técnica e de mercado para desenvolvimento de projetos.",
    type: "learning",
  },
  {
    domainName: "Serena & Energia",
    name: "Dicionário pessoal de energia/mercado",
    description: "Glossário próprio de termos, agentes e conceitos do setor.",
    type: "learning",
  },
  {
    domainName: "Carreira & Processos",
    name: "Reposicionamento profissional Lucas",
    description: "Narrativa profissional na transição Agibank, Serena e energia.",
    type: "ongoing",
  },
  {
    domainName: "Carreira & Processos",
    name: "Currículo energia/infraestrutura",
    description: "Currículo focado em energia, infraestrutura e sustentabilidade.",
    type: "administrative",
  },
  {
    domainName: "Carreira & Processos",
    name: "LinkedIn 2026",
    description: "Atualização de perfil e narrativa no LinkedIn.",
    type: "administrative",
  },
  {
    domainName: "TCC & Pesquisa",
    name: "Consolidar bibliografia",
    description: "Organização das referências principais do TCC.",
    type: "deadline",
  },
  {
    domainName: "TCC & Pesquisa",
    name: "Reestruturar sumário pós-orientação",
    description: "Revisão da estrutura do TCC após conversa com orientação.",
    type: "deadline",
  },
  {
    domainName: "TCC & Pesquisa",
    name: "Versão para orientador",
    description: "Preparação de uma versão revisável para orientação.",
    type: "deadline",
  },
  {
    domainName: "Vida Pessoal",
    name: "Rotina julho 2026",
    description: "Ajuste prático da rotina de julho.",
    type: "seasonal",
  },
  {
    domainName: "Vida Pessoal",
    name: "Organizar quarto/ambiente de trabalho",
    description: "Deixar o ambiente físico mais leve para estudar e trabalhar.",
    type: "administrative",
  },
  {
    domainName: "Casa & Finanças",
    name: "Plano financeiro básico",
    description: "Primeira organização de contas, gastos e prioridades.",
    type: "administrative",
  },
  {
    domainName: "Casa & Finanças",
    name: "Cuidar do carro",
    description: "Pendências, manutenção e logística do carro.",
    type: "administrative",
  },
  {
    domainName: "Saúde, Energia & Rotina",
    name: "Rotina mínima de energia",
    description: "Base pequena e sustentável para sono, corpo e energia.",
    type: "ongoing",
  },
  {
    domainName: "Saúde, Energia & Rotina",
    name: "Check-ins de energia",
    description: "Acompanhar energia e humor sem transformar em cobrança.",
    type: "ongoing",
  },
  {
    domainName: "Relações & Família",
    name: "Relacionamento e presença",
    description: "Manutenção de presença em vínculos importantes.",
    type: "ongoing",
  },
  {
    domainName: "Aprendizado & Biblioteca",
    name: "Green Belt",
    description: "Aprendizado e materiais relacionados ao Green Belt.",
    type: "learning",
  },
  {
    domainName: "Aprendizado & Biblioteca",
    name: "Biblioteca pessoal",
    description: "Organização inicial de livros, referências e repertório.",
    type: "ongoing",
  },
  {
    domainName: "Construções & Projetos Técnicos",
    name: "Construir Lucas OS",
    description: "Construção faseada do Lucas OS.",
    type: "ongoing",
  },
  {
    domainName: "Construções & Projetos Técnicos",
    name: "Deploy Lucas OS",
    description: "Preparar publicação e operação do Lucas OS.",
    type: "administrative",
  },
];

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required. Add it to .env.local before seeding.`);
  }

  return value;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const seedUserId = requireEnv("SEED_USER_ID");

  if (!uuidPattern.test(seedUserId)) {
    throw new Error("SEED_USER_ID must be a valid Supabase Auth user UUID.");
  }

  const { client, db } = createDbClient(databaseUrl);

  try {
    const [user] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.id, seedUserId))
      .limit(1);

    if (!user) {
      throw new Error("SEED_USER_ID does not exist in auth.users.");
    }

    const seededDomains = await Promise.all(
      domainSeeds.map((domain) =>
        db
          .insert(domains)
          .values({
            userId: seedUserId,
            name: domain.name,
            description: domain.description,
            color: domain.color,
            icon: domain.icon,
            isSystem: domain.isSystem ?? false,
            active: true,
          })
          .onConflictDoUpdate({
            target: [domains.userId, domains.name],
            set: {
              description: domain.description,
              color: domain.color,
              icon: domain.icon,
              isSystem: domain.isSystem ?? false,
              active: true,
            },
          })
          .returning({ id: domains.id, name: domains.name }),
      ),
    );

    const domainIdByName = new Map(
      seededDomains.flat().map((domain) => [domain.name, domain.id]),
    );

    for (const project of projectSeeds) {
      const domainId = domainIdByName.get(project.domainName);

      if (!domainId) {
        throw new Error(`Missing seeded domain for project: ${project.name}`);
      }

      await db
        .insert(projects)
        .values({
          userId: seedUserId,
          domainId,
          name: project.name,
          description: project.description,
          status: "active",
          type: project.type ?? "deadline",
        })
        .onConflictDoUpdate({
          target: [projects.userId, projects.domainId, projects.name],
          set: {
            description: project.description,
            status: "active",
            type: project.type ?? "deadline",
          },
        });
    }

    console.log(
      `Seed complete: ${domainSeeds.length} domains and ${projectSeeds.length} projects are ready.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = getSafeSeedErrorMessage(error);

  console.error(`Seed failed: ${message}`);
  process.exit(1);
});

function getSafeSeedErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown seed error.";
  }

  const cause = error.cause;

  if (cause instanceof Error && cause.message) {
    return sanitizeErrorMessage(cause.message);
  }

  return sanitizeErrorMessage(error.message);
}

function sanitizeErrorMessage(message: string) {
  return message
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "[uuid]",
    )
    .replace(/params:[\s\S]*/i, "params: [redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[database-url]");
}
