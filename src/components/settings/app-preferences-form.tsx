import { updateAppPreferences } from "@/lib/app-settings/actions";
import {
  appearanceValues,
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

const appearanceLabels = {
  dark: "Escuro",
  light: "Claro",
  system: "Sistema",
};

export function AppPreferencesForm({ preferences }: AppPreferencesFormProps) {
  return (
    <form action={updateAppPreferences} className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Aparencia</span>
        <select
          className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
          defaultValue={preferences.appearance}
          name="appearance"
        >
          {appearanceValues.map((appearance) => (
            <option key={appearance} value={appearance}>
              {appearanceLabels[appearance]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          Controla o tema do Lucas OS. Nao depende da caixa visual das Next Dev
          Tools.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Timezone</span>
          <select
            className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
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
            className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
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
          className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
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

      <label className="app-card-muted flex items-start gap-3 p-3">
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

      <button className="primary-button w-fit px-4 py-2.5 text-sm font-semibold">
        Salvar preferências
      </button>
    </form>
  );
}
