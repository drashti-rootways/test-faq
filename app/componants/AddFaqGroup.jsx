// app/components/AddFaqGroup.jsx
import { useState } from "react";
import {
  Button,
  Modal,
  TextField,
  Card,
  LegacyStack,
  Popover,
  ActionList,
  Text,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { PlusIcon } from "@shopify/polaris-icons";


export default function AddFaqGroup({
  products,
  collections,
  editData = null,
  onClose = () => {},
  onSaved = () => {},
  onUpdate
}) {
  const [active, setActive] = useState(!!editData);
  const fetcher = useFetcher();
  const [groupName, setGroupName] = useState(editData?.group_name || "");
  const [selectedType, setSelectedType] = useState("Select Product/Collection");
  const [selectProductCollection, setSelectProductCollection] = useState(false);
  const [optionPopoverActive, setOptionPopoverActive] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (selectedType === "Specific Product")
      return JSON.parse(editData?.specific_product || "[]");
    if (selectedType === "Specific Collection")
      return JSON.parse(editData?.specific_collection || "[]");
    return [];
  });

  const [currentOptions, setCurrentOptions] = useState(() => {
    return selectedType === "Specific Product" ? products : collections;
  });

  const [validationErrors, setValidationErrors] = useState({});

  // This must be inside the component!
 useEffect(() => {
  if (editData) {
    setGroupName(editData.group_name || "");

    const parsedProducts = Array.isArray(editData.specific_product)
      ? editData.specific_product
      : JSON.parse(editData.specific_product || "[]");

    const parsedCollections = Array.isArray(editData.specific_collection)
      ? editData.specific_collection
      : JSON.parse(editData.specific_collection || "[]");

    if (parsedProducts.length > 0) {
      setSelectedType("Specific Product");
      setSelectedOptions(parsedProducts);
      setCurrentOptions(products);
    } else if (parsedCollections.length > 0) {
      setSelectedType("Specific Collection");
      setSelectedOptions(parsedCollections);
      setCurrentOptions(collections);
    } else {
      setSelectedType("Select Product/Collection");
      setSelectedOptions([]);
      setCurrentOptions([]);
    }

    setActive(true);
  }
}, [editData, products, collections]);


  useEffect(() => {
    setCurrentOptions(
      selectedType === "Specific Product" ? products : collections
    );
  }, [selectedType]);

  const toggleProductCollectionPopover = () =>
    setSelectProductCollection((prev) => !prev);

  const toggleOptionPopover = () =>
    setOptionPopoverActive((prev) => !prev);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectProductCollection(false);
    setSelectedOptions([]);
  };

  const handleOptionToggle = (id) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const errors = {};
    if (!groupName.trim()) errors.groupName = "Group name is required";
    if (selectedType === "Select Product/Collection")
      errors.selectedType = "Please select a product or collection type";
    if (selectedOptions.length === 0)
      errors.selectedOptions = "Please select at least one option";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const method = editData ? "PUT" : "POST";

    fetcher.submit(
      {
        id: editData?.id,
        group_name: groupName,
        specific_product:
          selectedType === "Specific Product"
            ? JSON.stringify(selectedOptions)
            : "[]",
        specific_collection:
          selectedType === "Specific Collection"
            ? JSON.stringify(selectedOptions)
            : "[]",
      },
      {
        method,
        action: "/faqs",
        encType: "application/json",
      }
    );
  };

 useEffect(() => {
  if (fetcher.data?.success) {
    const isEdit = !!editData;
    const message = isEdit ? "Group updated successfully" : "Group created successfully";

    // Reset form
    setGroupName("");
    setSelectedType("Select Product/Collection");
    setSelectedOptions([]);
    setCurrentOptions([]);
    setActive(false);

    // Close modal
    if (typeof onClose === "function") {
      onClose();
    }

    // NEW: Trigger parent update
    if (typeof onUpdate === "function") {
      const updatedGroup = isEdit ? fetcher.data.updatedFaq : fetcher.data.faqGroup;
      onUpdate(updatedGroup); // Add to or replace in listing
    }

    // Toast
    if (typeof onSaved === "function") {
      onSaved(message); // Show toast
    }
  }
}, [fetcher.data]);


  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <Card sectioned>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button icon={PlusIcon} onClick={() => setActive(true)}>Add FAQ Group</Button>
         <div style={{ display: 'flex', alignItems: 'center',  gap: '4px'}}>
          <Button>Activate</Button>
        </div>
        </div>
      </Card>

      <Modal
        open={active}
        onClose={() => {
        setActive(false);
        onClose();
      }}
         title={editData ? "Edit FAQ Group" : "Add FAQ Group"}
        primaryAction={{
          content: "Save",
          onAction: handleSubmit,
        }}
      >
        <Modal.Section>
          <LegacyStack vertical spacing="tight">
            <LegacyStack.Item>
              <TextField
                label="FAQ Group Name"
                value={groupName}
                onChange={setGroupName}
                autoComplete="off"
                error={validationErrors.groupName}
              />
            </LegacyStack.Item>

            {/* Type Dropdown */}
            <LegacyStack.Item>
              <Popover
                active={selectProductCollection}
                activator={
                  <div style={{ display: "inline-block" }}>
                    <Button
                      onClick={toggleProductCollectionPopover}
                      disclosure
                      tone={validationErrors.selectedType ? "critical" : undefined}
                    >
                      {selectedType}
                    </Button>
                  </div>
                }
                onClose={() => setSelectProductCollection(false)}
                autofocusTarget="first-node"
              >
                <ActionList
                  actionRole="menuitem"
                  items={[
                    {
                      content: "Specific Product",
                      onAction: () => handleTypeChange("Specific Product"),
                    },
                    {
                      content: "Specific Collection",
                      onAction: () => handleTypeChange("Specific Collection"),
                    },
                  ]}
                />
              </Popover>
              {validationErrors.selectedType && (
                <Text variant="bodySm" tone="critical">
                  {validationErrors.selectedType}
                </Text>
              )}
            </LegacyStack.Item>

            {/* Options Selector */}
            {selectedType !== "Select Product/Collection" && (
              <LegacyStack.Item>
                <Popover
                  active={optionPopoverActive}
                  activator={
                    <div
                      onClick={toggleOptionPopover}
                      style={{ maxWidth: 300, display: "inline-block" }}
                    >
                      <TextField
                        label={`Choose ${
                          selectedType === "Specific Product" ? "Products" : "Collections"
                        }`}
                        value={currentOptions
                          .filter((item) => selectedOptions.includes(item.id))
                          .map((item) => item.title)
                          .join(", ")}
                        placeholder={`Choose ${
                          selectedType === "Specific Product" ? "products" : "collections"
                        }`}
                        readOnly
                        error={validationErrors.selectedOptions}
                      />
                    </div>
                  }
                  onClose={toggleOptionPopover}
                  autofocusTarget="first-node"
                >
                  <ActionList
                    actionRole="menuitemcheckbox"
                    items={currentOptions.map((item) => ({
                      content: item.title,
                      active: selectedOptions.includes(item.id),
                      onAction: () => handleOptionToggle(item.id),
                    }))}
                  />
                </Popover>
              </LegacyStack.Item>
            )}
          </LegacyStack>
        </Modal.Section>
      </Modal>
      </div>
  );
}
