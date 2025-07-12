// app/routes/app._index.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import AddFaqGroup from "../componants/AddFaqGroup";
import AddFaqForm from "../componants/AddFaq";
import prisma from "../db.server";
import {
  Text,
  Card,
  Button,
  Toast,
  Frame,
  Modal,
  Badge,
  InlineStack,
} from "@shopify/polaris";
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  CaretDownIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback } from "react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = `{
    products(first: 100) {
      edges { node { id title } }
    }
    collections(first: 100) {
      edges { node { id title } }
    }
  }`;

  const response = await admin.graphql(query);
  const result = await response.json();

  const products = result?.data?.products?.edges?.map(({ node }) => ({ id: node.id, title: node.title })) || [];
  const collections = result?.data?.collections?.edges?.map(({ node }) => ({ id: node.id, title: node.title })) || [];

  const faqGroupsRaw = await prisma.faqGroup.findMany({
    orderBy: { created_at: "desc" },
    include: { faqs: { orderBy: { created_at: "desc" } } },
  });

  const faqGroups = faqGroupsRaw.map((g) => ({
    ...g,
    id: g.id.toString(),
    faqs: g.faqs.map((f) => ({
      ...f,
      id: f.id.toString(),
      faq_group_id: f.faq_group_id.toString(),
    })),
  }));

  return json({ products, collections, faqGroups });
};

export default function IndexPage() {
  const data = useLoaderData();
  const [faqGroups, setFaqGroups] = useState(data.faqGroups ?? []);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentFaq, setCurrentFaq] = useState(null);
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(faqGroups.length / itemsPerPage);
  const paginatedGroups = faqGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleShowToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const toggleStatus = useCallback(async (id) => {
    const group = faqGroups.find((g) => g.id === id);
    const newStatus = group.status === "1" ? "0" : "1";
    try {
      const res = await fetch("/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setFaqGroups((prev) => prev.map((g) => g.id === id ? { ...g, status: newStatus } : g));
        handleShowToast(`Group turned ${newStatus === "1" ? "on" : "off"}`);
      } else handleShowToast("Failed to update status");
    } catch (err) {
      console.error("Status update error:", err);
      handleShowToast("Error updating status");
    }
  }, [faqGroups]);

  const handleDeleteFaq = async (faqId) => {
    try {
      const res = await fetch("/faq-create", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faqId }),
      });
      const result = await res.json();
      if (result.success) {
        setFaqGroups((prev) => prev.map((group) => ({
          ...group,
          faqs: group.faqs.filter((faq) => faq.id !== faqId),
        })));
        handleShowToast("FAQ deleted");
      }
    } catch (err) {
      console.error("FAQ delete failed:", err);
    }
  };

const handleFaqSaved = (savedFaq) => {
  setFaqFormOpen(false);
  setCurrentFaq(null);
  setFaqGroups((prev) =>
    prev.map((group) => {
      if (group.id !== savedFaq.faq_group_id) return group;
      const existingIndex = group.faqs.findIndex((f) => f.id === savedFaq.id);
      const updatedFaqs = existingIndex !== -1
        ? group.faqs.map((f) => f.id === savedFaq.id ? savedFaq : f)
        : [savedFaq, ...group.faqs];
      return { ...group, faqs: updatedFaqs };
    })
  );
  handleShowToast(currentFaq ? "FAQ updated" : "FAQ created");
};

  return (
    <Frame>
      <AddFaqGroup
        products={data.products}
        collections={data.collections}
        editData={editGroup}
        onClose={() => setEditGroup(null)}
        onSaved={(msg) => {
          setEditGroup(null);
          handleShowToast(msg);
        }}
        onUpdate={(updatedGroup) => {
          setFaqGroups((prev) => {
            const index = prev.findIndex((g) => g.id === updatedGroup.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = updatedGroup;
              return updated;
            }
            return [updatedGroup, ...prev];
          });
        }}
      />

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {faqGroups.length > 0 ? paginatedGroups.map((group) => {
          const isActive = group.status === "1";
          return (
            <div style={{ maxWidth: "900px",alignItems:"center", margin: "0 600px" }}>
            <Card key={group.id} sectioned>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <InlineStack align="start" gap="300">
                  <Text variant="bodyMd">{group.group_name}</Text>
                  <Badge tone={isActive ? "success" : undefined}>{isActive ? "On" : "Off"}</Badge>
                </InlineStack>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Button icon={EditIcon} onClick={() => setEditGroup(group)} />
                  <Button icon={DeleteIcon} onClick={() => { setDeleteGroup(group); setDeleteModalActive(true); }} />
                  <Button size="slim" onClick={() => toggleStatus(group.id)}>{isActive ? "Turn off" : "Turn on"}</Button>
                  <Button icon={PlusIcon} onClick={() => { setCurrentGroupId(group.id); setCurrentFaq(null); setFaqFormOpen(true); }}>Add FAQ</Button>
                  <Button icon={CaretDownIcon} onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)} />
                </div>
              </div>
              {expandedGroupId === group.id && group.faqs.length > 0 && (
                <div style={{ marginTop: 16, paddingLeft: 20 }}>
                  {group.faqs.map((faq) => (
                    <Card key={faq.id} sectioned>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <Text variant="bodyMd"><strong>Q:</strong> {faq.question}</Text>
                          <Text variant="bodyMd"><strong>A:</strong> {faq.answer}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button icon={EditIcon} size="slim" onClick={() => { setCurrentGroupId(group.id); setCurrentFaq(faq); setFaqFormOpen(true); }} />
                          <Button icon={DeleteIcon} size="slim" destructive onClick={() => handleDeleteFaq(faq.id)} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
            </div>
          );
        }) : <Text>No FAQ groups yet.</Text>}
      </div>

      <AddFaqForm
        open={faqFormOpen}
        onClose={() => setFaqFormOpen(false)}
        groupId={currentGroupId}
        editData={currentFaq}
        onSaved={handleFaqSaved}
      />

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
        <Button onClick={() => setCurrentPage((prev) => prev - 1)} disabled={currentPage === 1}>Previous</Button>
        <Text>Page {currentPage} of {totalPages}</Text>
        <Button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage === totalPages}>Next</Button>
      </div>

      {showToast && <Toast content={toastMessage} onDismiss={() => setShowToast(false)} />}

      {deleteGroup && (
        <Modal
          open={deleteModalActive}
          onClose={() => setDeleteModalActive(false)}
          title="Delete FAQ Group?"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: async () => {
              try {
                const res = await fetch("/faqs", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: deleteGroup.id }),
                });
                const result = await res.json();
                if (result.success) {
                  const updated = faqGroups.filter((g) => g.id !== deleteGroup.id);
                  setFaqGroups(updated);
                  setDeleteGroup(null);
                  setDeleteModalActive(false);
                  const updatedPage = updated.length <= (currentPage - 1) * itemsPerPage && currentPage > 1 ? currentPage - 1 : currentPage;
                  setCurrentPage(updatedPage);
                  handleShowToast("FAQ group deleted.");
                } else {
                  handleShowToast("Delete failed: " + (result.error || "Unknown error"));
                }
              } catch (err) {
                console.error("Delete error:", err);
                handleShowToast("Delete failed.");
              }
            },
          }}
          secondaryActions={[{ content: "Cancel", onAction: () => setDeleteModalActive(false) }]}
        >
          <Modal.Section>
            <Text as="p">Are you sure you want to delete "{deleteGroup.group_name}"?</Text>
          </Modal.Section>
        </Modal>
      )}
    </Frame>
  );
}
