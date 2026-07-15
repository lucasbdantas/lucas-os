import type {
  PushFailedReason,
  PushFailedReasons,
  PushSkippedReason,
  PushSkippedReasons,
} from "@/lib/push/reminder-dispatch";

export type PushDiagnosticItem = {
  count: number;
  message: string;
  reason: PushFailedReason | PushSkippedReason;
};

const skippedMessages: Record<PushSkippedReason, string> = {
  already_delivered:
    "Este lembrete já foi processado para este dispositivo e não será reenviado.",
  invalid_payload:
    "Um lembrete antigo tem dados incompletos e não pôde ser enviado.",
  missing_subscription:
    "Nenhum dispositivo ativo está disponível para receber este lembrete.",
  missing_task:
    "A task relacionada ao lembrete não foi encontrada e o envio foi ignorado.",
  notification_not_due:
    "O horário deste lembrete ainda não chegou.",
  subscription_revoked:
    "A inscrição deste dispositivo foi desativada. Reative notificações para voltar a receber push.",
  unknown:
    "Um lembrete foi ignorado por um motivo não identificado.",
};

const failedMessages: Record<PushFailedReason, string> = {
  web_push_bad_subscription:
    "A inscrição deste dispositivo está inválida. Resete e reative as notificações.",
  web_push_gone:
    "A inscrição antiga expirou. Reative notificações neste dispositivo.",
  web_push_not_found:
    "A inscrição antiga expirou. Reative notificações neste dispositivo.",
  web_push_payload_error:
    "O navegador recusou o conteúdo do push. Tente novamente ou resete a inscrição.",
  web_push_unauthorized:
    "A inscrição pode ter sido criada com outra chave VAPID. Reative notificações neste dispositivo.",
  web_push_unknown:
    "O provedor de push não concluiu o envio. Tente novamente e, se persistir, resete a inscrição.",
};

export function getPushDiagnosticItems(
  skippedReasons: PushSkippedReasons,
  failedReasons: PushFailedReasons,
): PushDiagnosticItem[] {
  const skipped = (Object.entries(skippedReasons) as Array<
    [PushSkippedReason, number]
  >)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({
      count,
      message: skippedMessages[reason],
      reason,
    }));
  const failed = (Object.entries(failedReasons) as Array<
    [PushFailedReason, number]
  >)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({
      count,
      message: failedMessages[reason],
      reason,
    }));

  return [...failed, ...skipped];
}

export function getPushTestFailureMessage(reason: PushFailedReason) {
  return failedMessages[reason];
}
