import { useState } from "react";
import {
  useGetBudgets,
  useUpdateBudget,
  useDeleteBudget,
} from "@/hooks/budget";
import TransactionForm from "@/components/common/TransactionForm";
import { defaultExpenseTypes } from "@/lib/helper";
import { CirclePlus, Trash2 } from "lucide-react";
import DeleteConfirmation from "@/components/common/DeleteConfirmation";

const Budgets = () => {
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [period, setPeriod] = useState("monthly");

  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const { data: budgets = [], isLoading } = useGetBudgets({ period });

  const closeTransactionModal = () => {
    document.getElementById("transaction-form-modal")?.close();
    setSelectedBudget(null);
  };

  const handleSubmit = (formData) => {
    updateMutation.mutate({
      isEdit: !!selectedBudget?._id,
      id: selectedBudget?._id,
      formData,
    });

    closeTransactionModal();
  };

  const handleDelete = () => {
    if (!selectedBudget?._id) return;

    deleteMutation.mutate(selectedBudget._id);
    document.getElementById("delete-confirmation-modal")?.close();
  };

  const openTransactionFormModal = () => {
    document.getElementById("transaction-form-modal")?.showModal();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Budgets</h1>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="select select-bordered"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="all">All</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl text-base-content/20 mb-6">
            No budgets set yet.
          </p>
          <button
            className="btn btn-primary"
            onClick={openTransactionFormModal}
          >
            Set Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div
              key={budget._id}
              className="card bg-base-100 shadow-xl p-6 cursor-pointer"
              onClick={() => {
                setSelectedBudget(budget);
                openTransactionFormModal();
              }}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-xl capitalize">
                  {budget.category}
                </h3>
                <button
                  className="cursor-help hover:text-error hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBudget(budget);
                    document
                      .getElementById("delete-confirmation-modal")
                      ?.showModal();
                  }}
                >
                  <Trash2 />
                </button>
              </div>
              <p className="text-sm text-base-content/60 capitalize">
                {budget.period}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Spent: ৳{budget.spent?.toLocaleString()}</span>
                  <span>Remaining: ৳{budget.remaining?.toLocaleString()}</span>
                </div>
                <progress
                  className="progress progress-primary w-full"
                  value={budget.progress}
                  max="100"
                />
                <p className="text-center mt-2 font-medium">
                  ৳{budget.amount?.toLocaleString()} Budget
                </p>
                <div className="text-center mt-3">
                  {budget.spent > budget.amount ? (
                    <div className="text-error font-bold animate-pulse">
                      Limit exceeded by ৳
                      {(budget.spent - budget.amount).toLocaleString()}!
                    </div>
                  ) : budget.progress >= 90 ? (
                    <div className="text-error font-medium">
                      Almost over! Only ৳{budget.remaining.toLocaleString()}{" "}
                      left
                    </div>
                  ) : budget.progress >= 75 ? (
                    <div className="text-warning">
                      Careful — ৳{budget.remaining.toLocaleString()} remaining
                    </div>
                  ) : (
                    <div className="text-success">
                      On track — ৳{budget.remaining.toLocaleString()} left
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="add_button" onClick={openTransactionFormModal}>
        <CirclePlus className="w-8 h-8" />
      </button>

      <TransactionForm
        type="budget"
        sources={defaultExpenseTypes}
        selectedTransaction={selectedBudget}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        onClose={closeTransactionModal}
      />

      <DeleteConfirmation
        id="delete-confirmation-modal"
        title="Delete Budget"
        content={`budget for ${selectedBudget?.category} (${selectedBudget?.period})`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Budgets;
