// Telegram Bot API integration for alerts and approvals

const TELEGRAM_API = "https://api.telegram.org/bot";

interface TelegramAlertParams {
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
}

const SEVERITY_EMOJI: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  urgent: "🚨",
};

export async function sendTelegramAlert({
  title,
  message,
  severity,
}: TelegramAlertParams): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return false;
  }

  const emoji = SEVERITY_EMOJI[severity] ?? "ℹ️";
  const text = `${emoji} *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Telegram] Send failed:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] Error:", error);
    return false;
  }
}

export async function sendTelegramApprovalRequest({
  approvalId,
  title,
  description,
  agentName,
}: {
  approvalId: string;
  title: string;
  description: string;
  agentName: string;
}): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return false;

  const text = [
    `🔔 *Approval Required*`,
    ``,
    `*${escapeMarkdown(title)}*`,
    `Agent: ${escapeMarkdown(agentName)}`,
    ``,
    escapeMarkdown(description),
    ``,
    `ID: \`${approvalId}\``,
  ].join("\n");

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Approve", callback_data: `approve:${approvalId}` },
              { text: "❌ Reject", callback_data: `reject:${approvalId}` },
            ],
          ],
        },
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
