/**
 * Revenue Breakdown Component
 *
 * Displays revenue per course with visual chart, transaction history,
 * and date range filtering.
 *
 * Validates: Requirements 12.4
 */

"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/app/lib/hooks/use-transactions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/loading";
import { ErrorMessage } from "@/app/components/ui/error-message";
import { motion } from "framer-motion";
import type { CourseStats, Transaction } from "@/app/lib/api/service-types";

interface RevenueBreakdownProps {
  courseStats: CourseStats[];
}

export function RevenueBreakdown({ courseStats }: RevenueBreakdownProps) {
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Calculate date range for API query
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: string | undefined;
    let end: string | undefined;

    switch (dateRange) {
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        end = now.toISOString().split("T")[0];
        break;
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        end = now.toISOString().split("T")[0];
        break;
      case "90d":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        end = now.toISOString().split("T")[0];
        break;
      case "custom":
        start = customStartDate || undefined;
        end = customEndDate || undefined;
        break;
      default:
        start = undefined;
        end = undefined;
    }

    return { startDate: start, endDate: end };
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch transactions with date filter
  const {
    data: transactionsData,
    isLoading,
    error,
    refetch,
  } = useTransactions({
    startDate,
    endDate,
  });

  // Calculate max revenue for chart scaling
  const maxRevenue = useMemo(() => {
    return Math.max(...courseStats.map((c) => c.revenue), 1);
  }, [courseStats]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!transactionsData?.transactions) return;

    const headers = ["Date", "Course", "Student", "Amount", "Status"];
    const rows = transactionsData.transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString(),
      t.courseName,
      t.studentName,
      `$${t.amount.toFixed(2)}`,
      t.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${startDate || "all"}-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Revenue Per Course Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Course</CardTitle>
          <CardDescription>Visual breakdown of earnings per course</CardDescription>
        </CardHeader>
        <CardContent>
          {courseStats.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary">
              No courses with revenue yet
            </div>
          ) : (
            <div className="space-y-4">
              {courseStats.map((course) => (
                <motion.div
                  key={course.courseId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{course.courseName}</span>
                    <span className="text-sm font-bold text-white">
                      ${course.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(course.revenue / maxRevenue) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-white rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-white mix-blend-difference">
                        {course.enrollments} enrollment{course.enrollments !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Detailed list of all course purchases</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!transactionsData?.transactions?.length}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Date Range Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateRange === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setDateRange("all")}
              >
                All Time
              </Button>
              <Button
                variant={dateRange === "7d" ? "primary" : "outline"}
                size="sm"
                onClick={() => setDateRange("7d")}
              >
                Last 7 Days
              </Button>
              <Button
                variant={dateRange === "30d" ? "primary" : "outline"}
                size="sm"
                onClick={() => setDateRange("30d")}
              >
                Last 30 Days
              </Button>
              <Button
                variant={dateRange === "90d" ? "primary" : "outline"}
                size="sm"
                onClick={() => setDateRange("90d")}
              >
                Last 90 Days
              </Button>
              <Button
                variant={dateRange === "custom" ? "primary" : "outline"}
                size="sm"
                onClick={() => setDateRange("custom")}
              >
                Custom Range
              </Button>
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === "custom" && (
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {/* Error State */}
          {error && <ErrorMessage error={error} onRetry={() => refetch()} />}

          {/* Transaction List */}
          {transactionsData && (
            <>
              {transactionsData.transactions.length === 0 ? (
                <div className="text-center py-8 text-foreground-secondary">
                  No transactions found for the selected date range
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Course
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Student
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Amount
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsData.transactions.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Summary */}
              {transactionsData.transactions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">
                      Total ({transactionsData.transactions.length} transaction
                      {transactionsData.transactions.length !== 1 ? "s" : ""})
                    </span>
                    <span className="text-lg font-bold text-white">
                      $
                      {transactionsData.transactions
                        .filter((t) => t.status === "succeeded")
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Transaction Row Component
 */
interface TransactionRowProps {
  transaction: Transaction;
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const statusColors = {
    succeeded: "text-white bg-gray-800",
    pending: "text-white bg-gray-800",
    failed: "text-white bg-gray-800",
    refunded: "text-gray-600 bg-gray-100",
  };

  return (
    <motion.tr
      className="border-b border-border hover:bg-muted transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <td className="py-3 px-4 text-foreground">
        {new Date(transaction.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-foreground">{transaction.courseName}</td>
      <td className="py-3 px-4 text-foreground">{transaction.studentName}</td>
      <td className="py-3 px-4 text-right text-foreground font-medium">
        ${transaction.amount.toFixed(2)}
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[transaction.status]
          }`}
        >
          {transaction.status}
        </span>
      </td>
    </motion.tr>
  );
}
