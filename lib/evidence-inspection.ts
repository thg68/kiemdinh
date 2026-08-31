import JSZip from "jszip";
import {
  MAX_EVIDENCE_FILE_SIZE_BYTES,
  evidenceFileExtension,
  evidenceMimeTypeForFileName,
  validateEvidenceFileName,
} from "@/lib/evidence";

function beginsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function containsNullByte(bytes: Uint8Array) {
  return bytes.some((value) => value === 0);
}

async function assertOoxmlStructure(
  extension: string,
  bytes: Uint8Array,
) {
  let archive: JSZip;

  try {
    archive = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error(`Nội dung tệp không khớp định dạng ${extension.toUpperCase()}.`);
  }

  const requiredEntry =
    extension === "docx" ? "word/document.xml" : "xl/workbook.xml";

  if (!archive.file("[Content_Types].xml") || !archive.file(requiredEntry)) {
    throw new Error(`Nội dung tệp không khớp định dạng ${extension.toUpperCase()}.`);
  }
}

async function assertEvidenceSignature(
  extension: string,
  bytes: Uint8Array,
) {
  switch (extension) {
    case "pdf":
      if (!beginsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
        throw new Error("Nội dung tệp không khớp định dạng PDF.");
      }
      return;
    case "jpg":
    case "jpeg":
      if (!beginsWith(bytes, [0xff, 0xd8, 0xff])) {
        throw new Error("Nội dung tệp không khớp định dạng JPG.");
      }
      return;
    case "png":
      if (!beginsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        throw new Error("Nội dung tệp không khớp định dạng PNG.");
      }
      return;
    case "webp":
      if (
        !beginsWith(bytes, [0x52, 0x49, 0x46, 0x46]) ||
        !beginsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
      ) {
        throw new Error("Nội dung tệp không khớp định dạng WebP.");
      }
      return;
    case "doc":
    case "xls":
      if (!beginsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
        throw new Error(`Nội dung tệp không khớp định dạng ${extension.toUpperCase()}.`);
      }
      return;
    case "docx":
    case "xlsx":
      await assertOoxmlStructure(extension, bytes);
      return;
    case "csv":
    case "txt":
      if (containsNullByte(bytes)) {
        throw new Error(`Nội dung tệp không khớp định dạng ${extension.toUpperCase()}.`);
      }
      return;
    default:
      throw new Error("Định dạng tệp minh chứng chưa được hỗ trợ.");
  }
}

export async function inspectEvidenceBlob(storagePath: string, blob: Blob) {
  const fileName = storagePath.split("/").at(-1) ?? "";
  const fileNameError = validateEvidenceFileName(fileName);

  if (fileNameError) {
    throw new Error(fileNameError);
  }

  if (blob.size <= 0) {
    throw new Error("Tệp minh chứng đang rỗng.");
  }

  if (blob.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
    throw new Error("Tệp minh chứng vượt quá giới hạn 25 MB.");
  }

  const extension = evidenceFileExtension(fileName);
  const mimeType = evidenceMimeTypeForFileName(fileName);

  if (!mimeType) {
    throw new Error("Định dạng tệp minh chứng chưa được hỗ trợ.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  await assertEvidenceSignature(extension, bytes);

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const sha256 = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return {
    mimeType,
    sha256,
    size: blob.size,
  };
}
