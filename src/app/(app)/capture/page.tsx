import { CaptureForm } from "@/components/capture/capture-form";
import {
  PendingCaptureList,
  type PendingCaptureListItem,
} from "@/components/capture/pending-capture-list";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

type CapturePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CapturePage({ searchParams }: CapturePageProps) {
  const { error: pageError } = await searchParams;
  const { supabase } = await requireSession();

  const { data: captures, error: capturesError } = await supabase
    .from("pending_captures")
    .select("id,raw_text,source,status,captured_at")
    .eq("status", "pending")
    .order("captured_at", { ascending: false })
    .limit(50)
    .returns<PendingCaptureListItem[]>();

  if (capturesError) {
    throw new Error(capturesError.message);
  }

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
          <StatusBadge label={`${captures.length}`} tone="amber" />
        </div>
        <PendingCaptureList captures={captures} returnTo="/capture" />
      </section>
    </main>
  );
}
