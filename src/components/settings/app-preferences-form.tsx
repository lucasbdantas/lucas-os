import { updateAppPreferences } from "@/lib/app-settings/actions";
import {
  preferredHomeValues,
  supportedTimezones,
  todayDensityValues,
  type AppPreferences,
} from "@/lib/app-settings/preferences";

type AppPreferencesFormProps = {
  preferences: AppPreferences;
};

const densityLabels = {
  compact: "Compacta",
  comfortable: "Confortável",
};

const homeLabels = {
  "/quick-capture": "Captura rápida",
  "/today": "Today",
};

export function AppPreferencesForm({ preferences }: AppPreferencesFormProps) {
  return (
    <form action={updateAppPreferences} className="mt-4 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Timezone</span>
          <select
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={preferences.timezone}
            name="timezone"
          >
            {supportedTimezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Densidade do Today
          </span>
          <select
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={preferences.todayDensity}
            name="todayDensity"
          >
            {todayDensityValues.map((density) => (
              <option key={density} value={density}>
                {densityLabels[density]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Página inicial preferida
        </span>
        <select
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          defaultValue={preferences.preferredHome}
          name="preferredHome"
        >
          {preferredHomeValues.map((home) => (
            <option key={home} value={home}>
              {homeLabels[home]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <input
          className="mt-1"
          defaultChecked={preferences.showProjectsWithoutNextAction}
          name="showProjectsWithoutNextAction"
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-medium text-zinc-800">
            Mostrar projetos sem próxima ação no Today
          </span>
          <span className="mt-1 block text-sm leading-6 text-zinc-600">
            Quando desativado, essa lista continua disponível no Weekly Review.
          </span>
        </span>
      </label>

      <button className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Salvar preferências
      </button>
    </form>
  );
}
