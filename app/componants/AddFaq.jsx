import { useState, useEffect } from "react";
import { Modal,LegacyStack, TextField,  } from "@shopify/polaris";
export default function AddFaqForm({ open, onClose, groupId, onSaved, editData }) {
  const [question, setQuestion] = useState(editData?.question || "");
  const [answer, setAnswer] = useState(editData?.answer || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuestion(editData?.question || "");
    setAnswer(editData?.answer || "");
  }, [editData]);

  const handleSave = async () => {
    setLoading(true);
    const url = editData ? "/faq-create" : "/faq-create";
    const method = editData ? "PUT" : "POST";
    const body = editData
      ? { id: editData.id, question, answer }
      : { groupId, question, answer };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        onSaved(result.faq);
        setQuestion("");
        setAnswer("");
        onClose();
      } else {
        alert("Save failed");
      }
    } catch (err) {
      console.error("FAQ save error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? "Edit FAQ" : "Add FAQ"}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <LegacyStack vertical spacing="tight">
          <TextField label="Question" value={question} onChange={setQuestion} multiline />
          <TextField label="Answer" value={answer} onChange={setAnswer} multiline />
        </LegacyStack>
      </Modal.Section>
    </Modal>
  );
}
