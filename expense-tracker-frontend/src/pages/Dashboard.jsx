import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { format, subDays } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import { useGetIncomes } from "@/hooks/income";
import { useGetExpenses } from "@/hooks/expense";
import { downloadCSV } from "@/lib/helper";

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#10b981",
];

const Dashboard = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const [netWorth, setNetWorth] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    data: filteredIncomeResult,
    isLoading: isFilteredIncomeLoading,
  } = useGetIncomes({
    period,
    startDate,
    endDate,
    source: "",
    enabled: period !== "custom" ? true : Boolean(startDate && endDate),
  });

  const {
    data: filteredExpenseResult,
    isLoading: isFilteredExpenseLoading,
  } = useGetExpenses({
    period,
    startDate,
    endDate,
    category: "",
    recurring: undefined,
    enabled: period !== "custom" ? true : Boolean(startDate && endDate),
  });

  const filteredIncomes = filteredIncomeResult?.incomes || [];
  const filteredExpenses = filteredExpenseResult?.expenses || [];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all-time income + expense (for charts), net worth, goals
      const [incomeRes, expenseRes, netWorthRes, goalsRes] = await Promise.all([
        api.get("/incomes"),
        api.get("/expenses"),
        api.get("/stats/net-worth"),
        api.get("/savings-goals"),
      ]);

      const incomes = incomeRes.result?.incomes || [];
      const expenses = expenseRes.result?.expenses || [];
      const goalsData = goalsRes.result || [];
      const { netWorth: fetchedNetWorth } = netWorthRes.result || { netWorth: 0 };

      const now = new Date();

      // Monthly trend (last 6 months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          name: format(d, "MMM"),
          income: 0,
          expense: 0,
        };
      }).reverse();

      incomes.forEach((i) => {
        const d = new Date(i.date);
        const monthKey = format(d, "MMM");
        const month = last6Months.find((m) => m.name === monthKey);
        if (month) month.income += i.amount || 0;
      });

      expenses.forEach((e) => {
        const d = new Date(e.date);
        const monthKey = format(d, "MMM");
        const month = last6Months.find((m) => m.name === monthKey);
        if (month) month.expense += e.amount || 0;
      });

      setMonthlyData(last6Months);
      setGoals(goalsData);
      setNetWorth(fetchedNetWorth);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const derivedStats = useMemo(() => {
    const totalIncome = filteredIncomes.reduce(
      (sum, i) => sum + (i.amount || 0),
      0
    );
    const totalExpense = filteredExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );
    const balance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const categoryMap = {};
    filteredExpenses.forEach((e) => {
      const key = e.category || "other";
      categoryMap[key] = (categoryMap[key] || 0) + (e.amount || 0);
    });
    const topCat =
      Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

    return {
      totalIncome,
      totalExpense,
      balance,
      monthlyChange: balance,
      savingsRate: Math.round(savingsRate),
      topCategory: topCat[0],
      topAmount: topCat[1],
    };
  }, [filteredIncomes, filteredExpenses]);

  const categoryData = useMemo(() => {
    const categoryMap = {};
    filteredExpenses.forEach((e) => {
      const key = e.category || "other";
      categoryMap[key] = (categoryMap[key] || 0) + (e.amount || 0);
    });
    const catData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
    return catData.length > 0 ? catData : [{ name: "No expenses", value: 1 }];
  }, [filteredExpenses]);

  const handleApplyCustom = () => {
    if (!tempStartDate || !tempEndDate) return;
    if (tempStartDate > tempEndDate) return;
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  };

  const handleDownloadIncomeCSV = () => {
    if (!filteredIncomes.length) return;
    const headers = ["Date", "Source", "Description", "Amount"];
    const rows = filteredIncomes.map((income) => [
      income.date,
      income.source || "",
      income.description || "",
      income.amount ?? "",
    ]);
    const baseName =
      filteredIncomeResult?.period === "custom"
        ? `dashboard-incomes-${filteredIncomeResult?.searchStartDate || ""}-to-${
            filteredIncomeResult?.searchEndDate || ""
          }`
        : `dashboard-incomes-${filteredIncomeResult?.period || period || "all"}`;
    downloadCSV(baseName, headers, rows);
  };

  const handleDownloadExpenseCSV = () => {
    if (!filteredExpenses.length) return;
    const headers = ["Date", "Category", "Description", "Amount", "Recurring"];
    const rows = filteredExpenses.map((expense) => [
      expense.date,
      expense.category || "",
      expense.description || "",
      expense.amount ?? "",
      expense.recurring ? expense.recurringFrequency || "Yes" : "No",
    ]);
    const baseName =
      filteredExpenseResult?.period === "custom"
        ? `dashboard-expenses-${filteredExpenseResult?.searchStartDate || ""}-to-${
            filteredExpenseResult?.searchEndDate || ""
          }`
        : `dashboard-expenses-${filteredExpenseResult?.period || period || "all"}`;
    downloadCSV(baseName, headers, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
        <p className="text-lg text-primary">
          {format(new Date(), "MMMM yyyy")}
        </p>
      </div>

      <FilterBar
        filter={period}
        setFilter={(newPeriod) => {
          setPeriod(newPeriod);
          if (newPeriod !== "custom") {
            setStartDate(null);
            setEndDate(null);
            setTempStartDate(null);
            setTempEndDate(null);
          } else {
            const defaultStart = subDays(new Date(), 30);
            const defaultEnd = new Date();
            const useStart = startDate || defaultStart;
            const useEnd = endDate || defaultEnd;
            setStartDate(useStart);
            setEndDate(useEnd);
            setTempStartDate(useStart);
            setTempEndDate(useEnd);
          }
        }}
        from={tempStartDate}
        setFrom={setTempStartDate}
        to={tempEndDate}
        setTo={setTempEndDate}
        source={""}
        setSource={() => {}}
        sourceOptions={[]}
        onApplyCustom={handleApplyCustom}
        className="rounded-box"
      />

      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          className="btn btn-sm btn-outline gap-2"
          onClick={handleDownloadIncomeCSV}
          disabled={isFilteredIncomeLoading || !filteredIncomes.length}
        >
          <Download className="w-4 h-4" />
          Download Income CSV
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline gap-2"
          onClick={handleDownloadExpenseCSV}
          disabled={isFilteredExpenseLoading || !filteredExpenses.length}
        >
          <Download className="w-4 h-4" />
          Download Expense CSV
        </button>
      </div>

      {/* Net Worth Card */}
      <div className="card bg-base-100 text-primary shadow-2xl">
        <div className="card-body text-center">
          <h2 className="text-lg">Your Net Worth</h2>
          <p className="text-5xl font-bold mt-2">
            ৳{netWorth.toLocaleString()}
          </p>
          <p className="text-sm mt-4 opacity-80">
            +৳{Math.abs(derivedStats.monthlyChange).toLocaleString()} this month
            {derivedStats.monthlyChange > 0 ? "↑" : "↓"}
          </p>
        </div>
      </div>

      {/* Big Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70">Total Income</p>
                <p className="text-3xl font-bold text-success">
                  +৳{derivedStats.totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-success opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70">Total Expense</p>
                <p className="text-3xl font-bold text-error">
                  -৳{derivedStats.totalExpense.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-error opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70">Net Savings</p>
                <p
                  className={`text-3xl font-bold ${
                    derivedStats.balance >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  {derivedStats.balance >= 0 ? "+" : ""}৳
                  {derivedStats.balance.toLocaleString()}
                </p>
              </div>
              <Wallet className="w-10 h-10 text-primary opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70">Savings Rate</p>
                <p className="text-3xl font-bold text-primary">
                  {derivedStats.savingsRate}%
                </p>
              </div>
              {derivedStats.savingsRate >= 20 ? (
                <ArrowUpRight className="w-10 h-10 text-success" />
              ) : (
                <ArrowDownRight className="w-10 h-10 text-warning" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Budget Overview</h2>
          {budgets.map((b) => (
            <div key={b._id} className="mb-4">
              <p className="font-medium capitalize">
                {b.category}: ৳{b.remaining.toLocaleString()} left
              </p>
              <progress
                className="progress progress-primary"
                value={b.progress}
                max="100"
              />
              {b.progress > 100 ? (
                <p className="text-error text-sm mt-1 text-center">
                  Limit exceeded by ৳{(b.spent - b.amount).toLocaleString()}!
                </p>
              ) : b.progress > 80 ? (
                <p className="text-warning text-sm mt-1 text-center">
                  Approaching limit!
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div> */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Income vs Expense (6 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `৳${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Expenses by Category</h2>
            {categoryData.length === 1 &&
            categoryData[0].name === "No expenses" ? (
              <div className="flex items-center justify-center h-64 text-base-content/50">
                <p className="text-xl">No expenses this month</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart className="capitalize">
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `৳${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Savings Goals Progress */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Savings Goals Progress</h2>
            {goals.length === 0 ? (
              <div className="text-center py-10 text-base-content/50">
                No savings goals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip formatter={(v) => `৳${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="currentAmount" fill="#10b981" name="Saved" />
                  <Bar dataKey="targetAmount" fill="#6366f1" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Spending */}
      {derivedStats.topCategory !== "None" && (
        <div className="alert shadow-lg">
          <div>
            <div className="text-xl">Highest Spending</div>
            <div className="text-2xl font-bold capitalize">
              {derivedStats.topCategory}
            </div>
            <div className="text-lg">৳{derivedStats.topAmount.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
