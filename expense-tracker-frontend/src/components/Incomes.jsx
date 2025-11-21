import { CirclePlus, Banknote } from "lucide-react";
import IncomeForm from "@/components/income/IncomeForm";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toastError } from "@/lib/toast";
import { useState } from "react";
import FilterBar from "@/components/common/FilterBar";
import { format } from "date-fns";

const Incomes = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [source, setSource] = useState("");
  const [selectedIncome, setSelectedIncome] = useState({});

  // React Query: Automatically refetches when any filter changes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["incomes", period, startDate, endDate, source],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (period && period !== "all" && period !== "custom") {
        params.append("period", period);
      }

      if (period === "custom") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }

      if (source) {
        params.append("source", source);
      }

      const url = `/incomes?${params.toString()}`;
      const response = await api.get(url);

      return response?.result;
    },
    onError: (err) => {
      toastError(err.message || "Failed to fetch incomes!");
    },
    // Optional: keep previous data while loading new
    keepPreviousData: true,
  });
  const incomes = data?.incomes || [];
  const formattedDate = (value) => {
    if (!value) return "N/A";
    return format(new Date(value), "MMM d, yyyy");
  };
  const openModal = () => {
    document.getElementById("income-form-modal")?.showModal();
  };

  return (
    <>
      <FilterBar
        filter={period}
        setFilter={(newPeriod) => {
          setPeriod(newPeriod);
          if (newPeriod !== "custom") {
            setStartDate("");
            setEndDate("");
          }
        }}
        from={startDate}
        setFrom={setStartDate}
        to={endDate}
        setTo={setEndDate}
        source={source}
        setSource={setSource}
        sourceOptions={[
          "salary",
          "freelance",
          "investment",
          "gift",
          "bonus",
          "other",
        ]}
        sourcePlaceholder="All Income Sources"
      />
      <div className="card w-fit min-w-90 font-medium bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-base-100">
        <div className="mt-auto">
          <p className="text-3xl font-bold text-success">
            +$ {Number(data?.totalAmount).toLocaleString()}
          </p>
          <p className="text-lg mt-1">
            <span>Earning from {data?.source}.</span>
            <br />
            {`From ${formattedDate(
              incomes[incomes.length - 1]?.date
            )} To ${formattedDate(incomes[0]?.date)}`}
          </p>
        </div>
      </div>
      {isLoading && !incomes.length ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !incomes.length ? (
        <div className="text-center py-16">
          <p className="text-xl text-base-content/70 mb-4">
            No incomes found for the selected filters.
          </p>
          <p className="text-base-content/50">
            Try changing the period or add your first income!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-6">
          {incomes.map((income) => (
            <div
              onClick={() => {
                setSelectedIncome(income);
                openModal();
              }}
              key={income._id}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-base-200 min-h-50 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0"
                  style={{ backgroundColor: `${income.color || "#10b981"}30` }}
                >
                  {income.icon || <Banknote />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg capitalize truncate">
                    {income.source || "Income"}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {income.description || "No description"}
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-3xl font-bold text-success">
                  +${Number(income.amount).toLocaleString()}
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  {new Date(income.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        className="fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-2xl hover:scale-110 transition-all z-50"
        onClick={openModal}
      >
        <CirclePlus className="w-8 h-8" />
      </button>
      <IncomeForm
        onSuccess={refetch}
        selectedIncome={selectedIncome}
        setSelectedIncome={setSelectedIncome}
      />
    </>
  );
};

export default Incomes;
