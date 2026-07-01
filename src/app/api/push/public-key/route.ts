import { getWebPushPublicKey } from "@/lib/push/env";

export async function GET() {
  const publicKey = getWebPushPublicKey();

  if (!publicKey) {
    return Response.json(
      {
        enabled: false,
        error: "Web Push nao configurado no servidor.",
      },
      { status: 503 },
    );
  }

  return Response.json({
    enabled: true,
    publicKey,
  });
}
