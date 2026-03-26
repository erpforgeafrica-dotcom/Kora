export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data.length) return;

  const headers = columns
    ? columns.map(c => c.label)
    : Object.keys(data[0]);

  const keys = columns
    ? columns.map(c => c.key)
    : Object.keys(data[0]);

  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      keys.map(key => {
        const value = row[key];
        const stringValue = value === null || value === undefined ? "" : String(value);
        return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
      }).join(",")
    )
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
}

export function exportToJSON<T>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
