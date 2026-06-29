import { PageHeader } from "@/components/layout/page-header";

export default function TodayPage() {
  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Lucas OS"
        title="Today"
        description="Base protegida da tela Today. Os blocos operacionais entram depois do auth shell."
      />
    </main>
  );
}
