import { Save } from "lucide-react";
import { updateNotificationPreferences } from "@/lib/push/notification-actions";
import {
  supportedTimezones,
  type SupportedTimezone,
} from "@/lib/app-settings/preferences";
import type { NotificationPreferences } from "@/lib/push/notification-preferences";

const timezoneLabels: Record<SupportedTimezone, string> = {
  "America/New_York": "America/New_York",
  "America/Sao_Paulo": "America/São_Paulo",
  "Europe/London": "Europe/London",
  UTC: "UTC",
};

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  return (
    <form action={updateNotificationPreferences} className="app-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Início do silêncio
          <input
            className="form-input min-h-11"
            defaultValue={preferences.quietHoursStart}
            name="quietHoursStart"
            type="time"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Fim do silêncio
          <input
            className="form-input min-h-11"
            defaultValue={preferences.quietHoursEnd}
            name="quietHoursEnd"
            type="time"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Timezone
          <select
            className="form-select min-h-11"
            defaultValue={preferences.timezone}
            name="timezone"
          >
            {supportedTimezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezoneLabels[timezone]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Lembrete padrão para novas tarefas
          <select
            className="form-select min-h-11"
            defaultValue={preferences.defaultReminderOffset}
            name="defaultReminderOffset"
          >
            <option value="none">Nenhum</option>
            <option value="0">Na hora</option>
            <option value="15">15 minutos antes</option>
            <option value="60">1 hora antes</option>
            <option value="1440">1 dia antes</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3">
        <PreferenceToggle
          defaultChecked={preferences.quietHoursEnabled}
          label="Ativar quiet hours"
          name="quietHoursEnabled"
        />
        <PreferenceToggle
          defaultChecked={preferences.pushEnabled}
          label="Permitir canal push"
          name="pushEnabled"
        />
        <PreferenceToggle
          defaultChecked={preferences.pushOnWeekends}
          label="Permitir push em fins de semana"
          name="pushOnWeekends"
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Estas preferências já são validadas e armazenadas. A aplicação no cron
        automático exige uma migration específica para não consumir lembretes
        durante o silêncio; até lá, o scheduler mantém o comportamento atual.
      </p>

      <button
        className="primary-button mt-5 min-h-11 gap-2 px-4 py-2.5 text-sm font-semibold"
        type="submit"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        Salvar preferências
      </button>
    </form>
  );
}

function PreferenceToggle({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="app-card-muted flex min-h-12 items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-800">
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      {label}
    </label>
  );
}
