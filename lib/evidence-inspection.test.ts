import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { inspectEvidenceBlob } from './evidence-inspection';

describe('đối chiếu nội dung tệp minh chứng', () => {
  it('nhận diện PDF và tính SHA-256 ở phía máy chủ', async () => {
    const blob = new Blob(['%PDF-1.7\nnoi dung'], { type: 'application/pdf' });

    const result = await inspectEvidenceBlob('school/year/file.pdf', blob);

    expect(result.mimeType).toBe('application/pdf');
    expect(result.size).toBe(blob.size);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('từ chối tệp giả PDF dù MIME được khai báo là PDF', async () => {
    const blob = new Blob(['khong phai pdf'], { type: 'application/pdf' });

    await expect(inspectEvidenceBlob('school/year/file.pdf', blob)).rejects.toThrow(
      'không khớp định dạng PDF',
    );
  });

  it('phân biệt DOCX và XLSX bằng cấu trúc OOXML', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<Types />');
    zip.file('word/document.xml', '<document />');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(inspectEvidenceBlob('school/year/file.docx', blob)).resolves.toMatchObject({
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(inspectEvidenceBlob('school/year/file.xlsx', blob)).rejects.toThrow(
      'không khớp định dạng XLSX',
    );
  });
});
