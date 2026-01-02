// pages/Goals.jsx
import { CirclePlus, Target, Trash2 } from "lucide-react";
import GoalForm from "@/components/GoalForm";
import {
  useGetGoals,
  useUpdateGoal,
  useAddToGoal,
  useDeleteGoal,
} from "@/hooks/goal";
import { toastError } from "@/lib/toast";
import { useState } from "react";
import DeleteConfirmation from "@/components/common/DeleteConfirmation";

const Goals = () => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: goals = [], isLoading } = useGetGoals();
  const updateMutation = useUpdateGoal();
  const addMutation = useAddToGoal();
  const deleteMutation = useDeleteGoal();

  const openForm = () =>
    document.getElementById("goal-form-modal")?.showModal();
  const closeForm = () => {
    document.getElementById("goal-form-modal")?.close();
    setSelectedGoal(null);
  };

  const handleSubmit = (formData) => {
    updateMutation.mutate({
      isEdit: !!selectedGoal,
      id: selectedGoal?._id,
      formData,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedGoal._id);
  };

  const handleAddMoney = (id) => {
    const amount = prompt("Add amount:", "5000");
    if (amount && !isNaN(amount) && amount > 0) {
      addMutation.mutate({ id, amount: Number(amount) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-4">
            <Target className="w-12 h-12" />
            Savings Goals
          </h1>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-32">
            <Target className="w-40 h-40 mx-auto text-base-300 mb-8" />
            <p className="text-3xl">Start saving for your dreams!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className="card bg-base-100 shadow-2xl hover:shadow-3xl transition-all border-l-8 cursor-pointer"
                style={{ borderLeftColor: goal.color }}
                onClick={() => {
                  setSelectedGoal(goal);
                  openForm();
                }}
              >
                <div className="card-body p-8">
                  <div className="flex justify-between mb-4">
                    <div className="text-6xl">{goal.icon}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGoal(goal);
                        document
                          .getElementById("delete-goal-modal")
                          .showModal();
                      }}
                      className="btn btn-ghost btn-circle text-error"
                    >
                      <Trash2 />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold mb-3">{goal.title}</h3>
                  <p className="text-lg opacity-70 mb-6">
                    Target: ৳{goal.targetAmount.toLocaleString()}
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between text-2xl font-bold">
                      <span>৳{goal.currentAmount.toLocaleString()}</span>
                      <span>{Math.round(goal.progress)}%</span>
                    </div>
                    <progress
                      className="progress progress-success h-8"
                      value={goal.progress}
                      max="100"
                    />
                  </div>

                  {goal.recurring && (
                    <div className="badge badge-success badge-lg mt-4">
                      +৳{goal.recurringAmount} / {goal.recurringFrequency}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMoney(goal._id);
                    }}
                    className="btn btn-primary w-full mt-6"
                  >
                    Add Money
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-8 right-8 btn btn-circle btn-primary btn-lg shadow-2xl"
        onClick={openForm}
      >
        <CirclePlus className="w-8 h-8" />
      </button>

      <GoalForm
        goal={selectedGoal}
        onSubmit={handleSubmit}
        onClose={() => {
          document.getElementById("goal-form-modal")?.close();
          setSelectedGoal(null);
        }}
      />

      <DeleteConfirmation
        id="delete-goal-modal"
        title="Delete Goal"
        content={`"${selectedGoal?.title}"`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default Goals;
