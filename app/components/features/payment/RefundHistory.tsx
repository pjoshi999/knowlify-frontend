/**
 * Refund History Component
 *
 * Displays a list of refund requests and their statuses
 */

"use client";

interface RefundRecord {
  id: string;
  enrollmentId: string;
  courseName: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  requestedAt: Date;
  processedAt?: Date;
  reason?: string;
}

interface RefundHistoryProps {
  refunds: RefundRecord[];
}

/**
 * Get status badge color
 */
function getStatusColor(status: RefundRecord["status"]): string {
  switch (status) {
    case "succeeded":
      return "bg-gray-800 text-white";
    case "pending":
      return "bg-gray-800 text-white";
    case "failed":
      return "bg-gray-800 text-white";
    default:
      return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: RefundRecord["status"]): string {
  switch (status) {
    case "succeeded":
      return "Completed";
    case "pending":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

/**
 * RefundHistory component
 *
 * Displays a table of refund requests with their statuses
 *
 * @param refunds - Array of refund records to display
 */
export function RefundHistory({ refunds }: RefundHistoryProps) {
  if (refunds.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No refund history
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven&apos;t requested any refunds yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Refund History</h3>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Processed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {refunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {refund.courseName}
                  </div>
                  {refund.reason && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {refund.reason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  ${refund.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      refund.status
                    )}`}
                  >
                    {getStatusLabel(refund.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(refund.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {refund.processedAt ? new Date(refund.processedAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {refunds.map((refund) => (
          <div
            key={refund.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {refund.courseName}
                </h4>
                {refund.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{refund.reason}</p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  refund.status
                )}`}
              >
                {getStatusLabel(refund.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                  ${refund.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Requested:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {new Date(refund.requestedAt).toLocaleDateString()}
                </span>
              </div>
              {refund.processedAt && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">Processed:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {new Date(refund.processedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
