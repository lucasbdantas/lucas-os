import { expect, test, type Page } from "@playwright/test";

const e2eEmail = process.env.E2E_TEST_EMAIL;
const e2ePassword = process.env.E2E_TEST_PASSWORD;
const hasE2ECredentials = Boolean(e2eEmail && e2ePassword);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(e2eEmail!);
  await page.getByLabel("Senha").fill(e2ePassword!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

test.describe("public smoke", () => {
  test("/login carrega", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("/api/health retorna status simples", async ({ request }) => {
    const response = await request.get("/api/health");
    const payload = await response.json();

    expect(response.ok()).toBe(true);
    expect(payload).toEqual({
      ok: true,
      service: "lucas-os",
    });
  });

  test("/api/backup/export exige login", async ({ request }) => {
    const response = await request.get("/api/backup/export");
    const payload = await response.json();

    expect(response.status()).toBe(401);
    expect(payload).toEqual({
      error: "Faca login para exportar seus dados.",
    });
  });

  test("/api/push/test exige login e retorna JSON", async ({ request }) => {
    const response = await request.post("/api/push/test");
    const payload = await response.json();

    expect(response.status()).toBe(401);
    expect(payload).toEqual({
      error: "Faca login para testar notificacoes.",
      ok: false,
    });
  });

  test("/api/push/test-reminder exige login", async ({ request }) => {
    const response = await request.post("/api/push/test-reminder");
    const payload = await response.json();

    expect(response.status()).toBe(401);
    expect(payload.error).toContain("login");
  });

  test("/api/cron/process-reminders exige credencial e retorna JSON", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/process-reminders");
    const payload = await response.json();

    expect([401, 503]).toContain(response.status());
    expect(payload).toMatchObject({
      error: expect.any(String),
      ok: false,
    });
  });

  test("/share carrega fallback publico", async ({ page }) => {
    await page.goto("/share");

    await expect(
      page.getByRole("heading", { name: "Compartilhar captura" }),
    ).toBeVisible();
  });
});

test.describe("authenticated smoke", () => {
  test.skip(
    !hasE2ECredentials,
    "Configure E2E_TEST_EMAIL e E2E_TEST_PASSWORD para rodar smoke tests autenticados.",
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const protectedRoutes = [
    "/today",
    "/planning",
    "/tasks",
    "/projects",
    "/capture",
    "/inbox",
    "/quick-capture",
    "/settings",
    "/settings/backup",
    "/settings/health",
    "/settings/integrations",
    "/settings/notifications",
    "/notifications",
    "/review",
  ];

  for (const route of protectedRoutes) {
    test(`${route} carrega autenticado`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBeLessThan(400);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("main")).toBeVisible();
    });
  }
});
