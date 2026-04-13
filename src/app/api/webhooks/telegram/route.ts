import { db } from "@/lib/db";

// POST /api/webhooks/telegram — handles inline button callbacks from Telegram
// Register this webhook: https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://your-domain/api/webhooks/telegram
export async function POST(request: Request) {
  const payload = await request.json();

  // Handle callback queries (inline button presses)
  const callback = payload.callback_query;
  if (!callback) {
    return Response.json({ ok: true }); // Ignore non-callback messages
  }

  const data = callback.data as string; // format: "approve:approvalId" or "reject:approvalId"
  const [action, approvalId] = data.split(":");

  if (!approvalId || !["approve", "reject"].includes(action)) {
    return Response.json({ ok: true });
  }

  const status = action === "approve" ? "APPROVED" : "REJECTED";

  try {
    const approval = await db.approval.update({
      where: { id: approvalId },
      data: {
        status,
        decidedAt: new Date(),
        decidedBy: `telegram:${callback.from?.username ?? callback.from?.id}`,
      },
      include: { agent: { select: { name: true } } },
    });

    // Resume the run if it was waiting
    if (approval.runId) {
      await db.agentRun.update({
        where: { id: approval.runId },
        data: {
          status: status === "APPROVED" ? "COMPLETED" : "FAILED",
          completedAt: new Date(),
          ...(status === "REJECTED" && { error: "Rejected via Telegram" }),
        },
      });
    }

    // Answer the callback (removes the loading spinner on the button)
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(
      `https://api.telegram.org/bot${token}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: `${status === "APPROVED" ? "Approved" : "Rejected"}: ${approval.title}`,
        }),
      }
    );

    // Edit the original message to show the decision
    const emoji = status === "APPROVED" ? "✅" : "❌";
    await fetch(
      `https://api.telegram.org/bot${token}/editMessageText`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id,
          text: `${emoji} *${status}*\n\n${approval.title}\nAgent: ${approval.agent.name}\nDecided by: @${callback.from?.username ?? "unknown"}`,
          parse_mode: "Markdown",
        }),
      }
    );
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
  }

  return Response.json({ ok: true });
}
