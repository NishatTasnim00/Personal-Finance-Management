import { useEffect, useState } from "react";
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
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

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
  const [stats, setStats] = useState({
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0,
    savingsRate: 0,
    topCategory: "None",
    topAmount: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch last 6 months income + expense + budgets + net worth
      const [incomeRes, expenseRes, budgetRes, netWorthRes] = await Promise.all(
        [
          api.get("/incomes?period=months"),
          api.get("/expenses?period=months"),
          api.get("/budgets?period=monthly"),
          api.get("/stats/net-worth"),
        ]
      );

      const incomes = incomeRes.result?.incomes || [];
      const expenses = expenseRes.result?.expenses || [];
      const budgetsData = budgetRes.result || [];
      const { netWorth } = netWorthRes.result || { netWorth: 0 };

      // Current month stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthIncomes = incomes.filter((i) => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const currentMonthExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const totalIncome = currentMonthIncomes.reduce(
        (sum, i) => sum + i.amount,
        0
      );
      const totalExpense = currentMonthExpenses.reduce(
        (sum, e) => sum + e.amount,
        0
      );
      const balance = totalIncome - totalExpense;
      const monthlyChange = balance;
      const savingsRate =
        totalIncome > 0
          ? ((totalIncome - totalExpense) / totalIncome) * 100
          : 0;

      // Top spending category
      const categoryMap = {};
      currentMonthExpenses.forEach((e) => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      });
      const topCat = Object.entries(categoryMap).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["None", 0];

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
        if (month) month.income += i.amount;
      });

      expenses.forEach((e) => {
        const d = new Date(e.date);
        const monthKey = format(d, "MMM");
        const month = last6Months.find((m) => m.name === monthKey);
        if (month) month.expense += e.amount;
      });

      // Category pie chart
      const catData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));

      setStats({
        netWorth,
        totalIncome,
        totalExpense,
        monthlyChange,
        balance,
        savingsRate: Math.round(savingsRate),
        topCategory: topCat[0],
        topAmount: topCat[1],
      });

      setMonthlyData(last6Months);
      setCategoryData(
        catData.length > 0 ? catData : [{ name: "No expenses", value: 1 }]
      );
      setBudgets(budgetsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      {/* Net Worth Card */}
      <div className="card bg-base-100 text-primary shadow-2xl">
        <div className="card-body text-center">
          <h2 className="text-lg">Your Net Worth</h2>
          <p className="text-5xl font-bold mt-2">
            ৳{stats.netWorth.toLocaleString()}
          </p>
          <p className="text-sm mt-4 opacity-80">
            +৳{Math.abs(stats.monthlyChange).toLocaleString()} this month
            {stats.monthlyChange > 0 ? "↑" : "↓"}
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
                  +৳{stats.totalIncome.toLocaleString()}
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
                  -৳{stats.totalExpense.toLocaleString()}
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
                    stats.balance >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  {stats.balance >= 0 ? "+" : ""}৳
                  {stats.balance.toLocaleString()}
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
                  {stats.savingsRate}%
                </p>
              </div>
              {stats.savingsRate >= 20 ? (
                <ArrowUpRight className="w-10 h-10 text-success" />
              ) : (
                <ArrowDownRight className="w-10 h-10 text-warning" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
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
      </div>

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
      </div>

      {/* Top Spending */}
      {stats.topCategory !== "None" && (
        <div className="alert shadow-lg">
          <div>
            <div className="text-xl">Highest Spending</div>
            <div className="text-2xl font-bold capitalize">
              {stats.topCategory}
            </div>
            <div className="text-lg">৳{stats.topAmount.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
