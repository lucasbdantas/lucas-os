import { PageHeader } from "@/components/layout/page-header";

export default function InboxPage() {
  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Inbox"
        description="Entrada protegida para itens ainda não classificados."
      />
    </main>
  );
}
