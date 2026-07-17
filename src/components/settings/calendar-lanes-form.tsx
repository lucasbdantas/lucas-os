import { updateGoogleCalendarLanes } from "@/lib/app-settings/actions";
import {
  type CalendarLanePreferences,
  type CalendarLaneSource,
  getCalendarLane,
  getCalendarPreferenceKey,
} from "@/lib/integrations/google/calendar-lanes";

type CalendarLanesFormProps = {
  preferences: CalendarLanePreferences;
  sources: CalendarLaneSource[];
};

const laneLabels = {
  context: "Contexto / Interesses",
  hidden: "Oculto",
  primary: "Agenda principal",
};

const laneDescriptions = {
  context: "Aparece em uma seção mais leve no Hoje.",
  hidden: "Não aparece no Hoje.",
  primary: "Compromissos principais no Hoje.",
};

export function CalendarLanesForm({
  preferences,
  sources,
}: CalendarLanesFormProps) {
  if (sources.length === 0) {
    return (
      <div className="app-card-muted p-4 text-sm text-zinc-600">
        Nenhum calendário disponível para configurar ainda. Conecte ou
        reconecte uma conta Google com Calendar somente leitura.
      </div>
    );
  }

  return (
    <form action={updateGoogleCalendarLanes} className="grid gap-3">
      {sources.map((source) => {
        const calendarKey = getCalendarPreferenceKey(source);
        const currentLane = getCalendarLane(preferences, source);

        return (
          <div
            className="app-card-muted grid gap-3 p-4 md:grid-cols-[1fr_240px]"
            key={calendarKey}
          >
            <div>
              <input name="calendarKey" type="hidden" value={calendarKey} />
              <p className="font-medium text-zinc-950">
                {source.calendarSummary}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {source.accountEmail}
              </p>
              <p className="mt-1 break-all text-xs text-zinc-500">
                {source.calendarId}
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                {laneDescriptions[currentLane]}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Lane</span>
              <select
                className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                defaultValue={currentLane}
                name={`lane:${calendarKey}`}
              >
                <option value="primary">{laneLabels.primary}</option>
                <option value="context">{laneLabels.context}</option>
                <option value="hidden">{laneLabels.hidden}</option>
              </select>
            </label>
          </div>
        );
      })}

      <button className="primary-button w-fit px-4 py-2 text-sm font-semibold">
        Salvar calendários
      </button>
    </form>
  );
}
