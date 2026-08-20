import ExcelJS from "exceljs";
import { ReportData } from "./data";
import { storageOrLink } from "./format";

export async function buildEvidenceCatalogXlsx(data: ReportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KiemDinh";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Danh mục minh chứng");
  sheet.columns = [
    { header: "TT", key: "tt", width: 8 },
    { header: "Mã", key: "ma", width: 18 },
    { header: "Tên", key: "ten", width: 42 },
    { header: "Định dạng/vị trí lưu trữ hoặc đường dẫn điện tử", key: "vi_tri", width: 52 },
    { header: "Ghi chú", key: "ghi_chu", width: 28 },
  ];

  sheet.getRow(1).font = { bold: true, name: "Times New Roman", size: 12 };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  data.evidence.forEach((item, index) => {
    sheet.addRow({
      tt: index + 1,
      ma: item.ma,
      ten: item.ten,
      vi_tri: storageOrLink(item),
      ghi_chu: item.ghi_chu ?? "",
    });
  });

  sheet.eachRow((row) => {
    row.font = { name: "Times New Roman", size: 12 };
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  return workbook.xlsx.writeBuffer();
}
