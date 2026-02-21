import { CirclePlus, Target, Trash2 } from "lucide-react";
import GoalForm from "@/components/GoalForm";
import {
  useGetGoals,
  useUpdateGoal,
  useDeleteGoal,
} from "@/hooks/goal";
import { useState } from "react";
import DeleteConfirmation from "@/components/common/DeleteConfirmation";
import { formatDate } from "@/lib/helper";

const Goals = () => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: goals = [], isLoading, refetch } = useGetGoals();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const openForm = () => {
    document.getElementById("goal-form-modal")?.showModal();
  };

  const closeForm = () => {
    document.getElementById("goal-form-modal")?.close();
    setSelectedGoal(null);
  };

  const handleSubmit = (formData) => {
    updateMutation.mutate(
      {
        isEdit: !!selectedGoal,
        id: selectedGoal?._id,
        formData,
      },
      {
        onSuccess: () => {
          refetch();
          closeForm();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedGoal?._id) return;
    deleteMutation.mutate(selectedGoal._id, {
      onSuccess: () => {
        refetch();
        document.getElementById("delete-goal-modal")?.close();
        setSelectedGoal(null);
      },
    });
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
            <p className="text-3xl mb-4">Start saving for your dreams!</p>
            <p className="text-base-content/60 mb-8">
              Create your first savings goal to get started
            </p>
            <button onClick={openForm} className="btn btn-primary btn-lg">
              <CirclePlus className="w-5 h-5" />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div
                  key={goal._id}
                  className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer ${
                    isCompleted ? "ring-2 ring-success" : ""
                  }`}
                  style={{ borderLeftColor: goal.color }}
                  onClick={() => {
                    setSelectedGoal(goal);
                    openForm();
                  }}
                >
                  <div className="card-body p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">{goal.icon || "🎯"}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGoal(goal);
                          document.getElementById("delete-goal-modal")?.showModal();
                        }}
                        className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
                    
                    {goal.deadline && (
                      <p className="text-xs text-base-content/60 mb-3">
                        Deadline: {formatDate(goal.deadline)}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold">
                          ৳{goal.currentAmount.toLocaleString()}
                        </span>
                        <span className={`text-lg font-semibold ${
                          isCompleted ? "text-success" : "text-primary"
                        }`}>
                          {progress}%
                        </span>
                      </div>
                      
                      <progress
                        className={`progress h-3 ${
                          isCompleted ? "progress-success" : "progress-primary"
                        }`}
                        value={progress}
                        max="100"
                      />
                      
                      <div className="flex justify-between text-sm text-base-content/60">
                        <span>Target: ৳{goal.targetAmount.toLocaleString()}</span>
                        {!isCompleted && (
                          <span>Remaining: ৳{remaining.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {goal.recurring && (
                      <div className="badge badge-success badge-sm mt-3">
                        Auto: ৳{goal.recurringAmount?.toLocaleString() || 0} / {goal.recurringFrequency || "monthly"}
                      </div>
                    )}

                    {isCompleted && (
                      <div className="badge badge-success badge-lg mt-3">
                        🎉 Goal Achieved!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-8 right-8 btn btn-circle btn-primary btn-lg shadow-2xl z-10"
        onClick={openForm}
      >
        <CirclePlus className="w-8 h-8" />
      </button>

      <GoalForm
        goal={selectedGoal}
        onSubmit={handleSubmit}
        onClose={closeForm}
        isSubmitting={updateMutation.isPending}
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
