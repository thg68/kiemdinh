import { describe, expect, it } from 'vitest';
import {
  canonicalEvidenceMimeType,
  validateEvidenceFile,
  validateEvidenceFileName,
} from './evidence';

function makeFile(name: string, type: string, size = 32) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('kiểm tra tệp minh chứng', () => {
  it('chấp nhận PDF có tên và MIME khớp', () => {
    const file = makeFile('quyet-dinh-so-12.pdf', 'application/pdf');

    expect(validateEvidenceFile(file)).toBeNull();
    expect(canonicalEvidenceMimeType(file)).toBe('application/pdf');
  });

  it('suy ra MIME chuẩn khi trình duyệt không cung cấp MIME', () => {
    const file = makeFile('bao-cao.docx', '');

    expect(validateEvidenceFile(file)).toBeNull();
    expect(canonicalEvidenceMimeType(file)).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('từ chối MIME không khớp phần mở rộng', () => {
    const file = makeFile('bao-cao.pdf', 'application/msword');

    expect(validateEvidenceFile(file)).toContain('không khớp');
  });

  it('từ chối tên tệp có đường dẫn hoặc ký tự điều khiển', () => {
    expect(validateEvidenceFileName('../bao-cao.pdf')).toContain('không hợp lệ');
    expect(validateEvidenceFileName('bao-cao\u0000.pdf')).toContain('không hợp lệ');
  });

  it('từ chối tệp vượt quá 25 MiB', () => {
    const file = makeFile('bao-cao.pdf', 'application/pdf', 25 * 1024 * 1024 + 1);

    expect(validateEvidenceFile(file)).toContain('25 MB');
  });
});
