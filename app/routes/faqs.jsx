import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    if (request.method === "DELETE") {
      const rawBody = await request.text();
      const payload = JSON.parse(rawBody);
      const id = payload.id;

      await prisma.faqGroup.delete({
        where: { id: BigInt(id) },
      });

      return json({ success: true });
    }

    const payload = await request.json();

    if (request.method === "PATCH") {
      const { id, status } = payload;
      await prisma.faqGroup.update({
        where: { id: BigInt(id) },
        data: { status },
      });

      return json({ success: true });
    }

    if (request.method === "PUT") {
      const updatedFaq = await prisma.faqGroup.update({
        where: { id: BigInt(payload.id) },
        data: {
          group_name: payload.group_name,
          specific_product: payload.specific_product ?? [],
          specific_collection: payload.specific_collection ?? [],
        },
      });

      return json({
        success: true,
        updatedFaq: {
          ...updatedFaq,
          id: updatedFaq.id.toString(),
        },
      });
    }

    const newFaqGroup = await prisma.faqGroup.create({
      data: {
        group_name: payload.group_name,
        specific_product: payload.specific_product ?? [],
        specific_collection: payload.specific_collection ?? [],
      },
    });

    return json({
      success: true,
      faqGroup: {
        ...newFaqGroup,
        id: newFaqGroup.id.toString(),
      },
    });
  } catch (error) {
    console.error("FAQ Group action failed:", error);
    return json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
};

