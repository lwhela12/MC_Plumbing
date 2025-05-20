import React, { useState } from "react";
import PlumberList from "@/components/plumber/PlumberList";
import PlumberForm from "@/components/plumber/PlumberForm";
import { Plumber } from "@shared/schema";

const Plumbers: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPlumber, setEditingPlumber] = useState<Plumber | undefined>(undefined);

  const handleAddPlumber = () => {
    setEditingPlumber(undefined);
    setShowForm(true);
  };

  const handleEditPlumber = (plumber: Plumber) => {
    setEditingPlumber(plumber);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPlumber(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPlumber(undefined);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-darker">Plumber Management</h1>
        <p className="text-sm text-neutral-dark">Add, edit, and manage plumber profiles</p>
      </div>

      {showForm && (
        <PlumberForm
          plumber={editingPlumber}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <PlumberList
        onAddPlumber={handleAddPlumber}
        onEditPlumber={handleEditPlumber}
      />
    </div>
  );
};

export default Plumbers;
