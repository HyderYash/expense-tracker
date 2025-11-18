export interface CategoryExport {
  name: string;
  displayName?: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  totalInvested: number;
  expectedAmount: number;
  profitLoss: number;
  profitLossPercent: number;
  entries: Array<{
    name: string;
    quantity: number;
    invested: number;
  }>;
}

// Format number for CSV (without currency symbol to avoid encoding issues)
function formatNumberForCSV(value: number): string {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}

export function exportToCSV(categories: CategoryExport[]): void {
  // Create CSV header
  const headers = [
    "Category Name",
    "Display Name",
    "Slug",
    "Expected %",
    "Total Invested (INR)",
    "Expected Amount (INR)",
    "Current Value (INR)",
    "Profit/Loss (INR)",
    "Profit/Loss %",
    "Entry Name",
    "Entry Quantity",
    "Entry Invested (INR)",
  ];

  // Create CSV rows
  const rows: string[][] = [headers];

  categories.forEach((category) => {
    if (category.entries.length === 0) {
      // Category with no entries
      rows.push([
        category.name,
        category.displayName || "",
        category.slug,
        category.expectedPercent.toString(),
        formatNumberForCSV(category.totalInvested),
        formatNumberForCSV(category.expectedAmount),
        formatNumberForCSV(category.currentValue),
        formatNumberForCSV(category.profitLoss),
        category.profitLossPercent.toFixed(2) + "%",
        "",
        "",
        "",
      ]);
    } else {
      // Category with entries
      category.entries.forEach((entry, index) => {
        rows.push([
          index === 0 ? category.name : "",
          index === 0 ? (category.displayName || "") : "",
          index === 0 ? category.slug : "",
          index === 0 ? category.expectedPercent.toString() : "",
          index === 0 ? formatNumberForCSV(category.totalInvested) : "",
          index === 0 ? formatNumberForCSV(category.expectedAmount) : "",
          index === 0 ? formatNumberForCSV(category.currentValue) : "",
          index === 0 ? formatNumberForCSV(category.profitLoss) : "",
          index === 0 ? category.profitLossPercent.toFixed(2) + "%" : "",
          entry.name,
          entry.quantity.toString(),
          formatNumberForCSV(entry.invested),
        ]);
      });
    }
  });

  // Convert to CSV string
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || "");
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");

  // Add UTF-8 BOM for proper Excel encoding
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;
  
  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

