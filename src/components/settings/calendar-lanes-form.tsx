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
  context: "Aparece em uma lane mais leve no Today.",
  hidden: "Nao aparece no Today.",
  primary: "Compromissos principais no Today.",
};

export function CalendarLanesForm({
  preferences,
  sources,
}: CalendarLanesFormProps) {
  if (sources.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
        Nenhum calendario disponivel para configurar ainda. Conecte ou
        reconecte uma conta Google com Calendar read-only.
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
            className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1fr_240px]"
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
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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

      <button className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Salvar calendarios
      </button>
    </form>
  );
}
