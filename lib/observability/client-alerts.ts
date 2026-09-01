export const STORAGE_FAILURE_OPERATIONS = [
  "approved_report_signed_url",
  "evidence_cleanup",
  "evidence_upload",
  "report_cleanup",
  "report_upload",
] as const;

export type StorageFailureOperation =
  (typeof STORAGE_FAILURE_OPERATIONS)[number];

export async function reportStorageFailure(
  operation: StorageFailureOperation,
) {
  try {
    await fetch("/api/observability/storage-failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation }),
      keepalive: true,
    });
  } catch {
    // Cảnh báo vận hành không được làm gián đoạn thao tác hiện tại của người dùng.
  }
}
