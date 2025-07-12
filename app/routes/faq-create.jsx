import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const method = request.method;
    const payload = await request.json();

    if (method === "POST") {
      const { groupId, question, answer } = payload;
      const newFaq = await prisma.faq.create({
        data: {
          question,
          answer,
          faq_group_id: BigInt(groupId),
        },
      });
      return json({
        success: true,
        faq: {
          ...newFaq,
          id: newFaq.id.toString(),
          faq_group_id: newFaq.faq_group_id.toString(),
        },
      });
    }

    if (method === "PUT") {
      const { id, question, answer } = payload;
      const updatedFaq = await prisma.faq.update({
        where: { id: BigInt(id) },
        data: { question, answer },
      });
      return json({
        success: true,
        faq: {
          ...updatedFaq,
          id: updatedFaq.id.toString(),
          faq_group_id: updatedFaq.faq_group_id.toString(),
        },
      });
    }

    if (method === "DELETE") {
      const { id } = payload;
      await prisma.faq.delete({ where: { id: BigInt(id) } });
      return json({ success: true });
    }

    return json({ success: false, error: "Unsupported method" }, { status: 405 });
  } catch (error) {
    console.error("Create/Update/Delete FAQ error:", error);
    return json({ success: false, error: error.message || "Unknown error" });
  }
};
