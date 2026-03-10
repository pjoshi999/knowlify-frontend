import { showToast } from "./toast";

// Example usage of the new Sonner toast system

export const toastExamples = {
  // Simple success toast
  success: () => {
    showToast.success("Success! Action completed successfully.");
  },

  // Simple error toast
  error: () => {
    showToast.error("Error occurred. Please try again.");
  },

  // Warning toast
  warning: () => {
    showToast.warning("Warning: Please check your input.");
  },

  // Info toast
  info: () => {
    showToast.info("Information: Here's something helpful.");
  },

  // Loading toast
  loading: () => {
    const toastId = showToast.loading("Processing your request...");
    
    // Simulate async operation
    setTimeout(() => {
      showToast.success("Done! Request processed successfully.");
    }, 2000);
    
    return toastId;
  },

  // Promise toast (automatically handles loading, success, and error states)
  promise: () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve("Success data");
        } else {
          reject(new Error("Something went wrong"));
        }
      }, 2000);
    });

    showToast.promise(promise, {
      loading: "Processing...",
      success: "Operation completed successfully!",
      error: "Operation failed. Please try again.",
    });
  },
};

// Usage examples:
// toastExamples.success();
// toastExamples.error();
// toastExamples.promise();