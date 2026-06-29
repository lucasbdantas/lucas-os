import { CaptureForm } from "@/components/capture/capture-form";
import {
  PendingCaptureList,
  type PendingCaptureListItem,
} from "@/components/capture/pending-capture-list";
import type {
  CaptureDomainOption,
  CaptureProjectOption,
} from "@/components/capture/capture-task-form";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

type CapturePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  is_system: boolean;
  active: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  domain_id: string;
};

export default async function CapturePage({ searchParams }: CapturePageProps) {
  const { error: pageError } = await searchParams;
  const { supabase } = await requireSession();

  const [capturesResult, domainsResult, projectsResult] = await Promise.all([
    supabase
      .from("pending_captures")
      .select("id,raw_text,source,status,captured_at")
      .eq("status", "pending")
      .order("captured_at", { ascending: false })
      .limit(50)
      .returns<PendingCaptureListItem[]>(),
    supabase
      .from("domains")
      .select("id,name,is_system,active")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true })
      .returns<DomainRow[]>(),
    supabase
      .from("projects")
      .select("id,name,domain_id")
      .in("status", ["active", "waiting"])
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
  ]);

  if (capturesResult.error) {
    throw new Error(capturesResult.error.message);
  }

  if (domainsResult.error) {
    throw new Error(domainsResult.error.message);
  }

  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const selectableDomains: CaptureDomainOption[] = domainsResult.data.filter(
    (domain) => domain.active || (domain.is_system && domain.name === "Inbox"),
  );
  const projectOptions: CaptureProjectOption[] = projectsResult.data.map(
    (project) => ({
      ...project,
      domainName: domainNameById.get(project.domain_id),
    }),
  );

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Fase 2"
        title="Capture"
        description="Captura manual de texto bruto para triagem posterior, sem IA e sem voz nesta etapa."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-zinc-950">Nova captura</h2>
          <StatusBadge label="manual" />
        </div>
        <CaptureForm returnTo="/capture" />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-zinc-950">Pendentes</h2>
          <StatusBadge label={`${capturesResult.data.length}`} tone="amber" />
        </div>
        <PendingCaptureList
          captures={capturesResult.data}
          domains={selectableDomains}
          projects={projectOptions}
          returnTo="/capture"
        />
      </section>
    </main>
  );
}
