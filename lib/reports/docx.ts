import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { assessmentLabel, CANH_BAO_THIEU_DU_LIEU, evidenceCodes, formatDateRange } from "./format";
import { ImprovementPlan, ReportCriterion, ReportData, ReportEvidence } from "./data";

const FONT = "Times New Roman";
const RED = "C00000";
const BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "000000",
};

function text(value: string, options: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}) {
  return new TextRun({
    text: value,
    font: FONT,
    size: options.size ?? 26,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
  });
}

function p(
  children: (TextRun | string)[],
  options: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; center?: boolean; spacing?: number } = {},
) {
  return new Paragraph({
    heading: options.heading,
    alignment: options.center ? AlignmentType.CENTER : undefined,
    spacing: { after: options.spacing ?? 120 },
    children: children.map((child) => (typeof child === "string" ? text(child) : child)),
  });
}

function cell(children: (Paragraph | Table)[], width?: number) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
    children,
  });
}

function plainCell(value: string, width?: number, warning = false) {
  return cell([p([text(value || (warning ? CANH_BAO_THIEU_DU_LIEU : ""), { color: warning ? RED : undefined })])], width);
}

function table(rows: TableRow[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function criterionEvidence(data: ReportData, criterionId: string) {
  return data.evidence.filter((item) => item.tieuChiIds.includes(criterionId));
}

function descriptionWithEvidence(description: string | null | undefined, evidence: ReportEvidence[]) {
  const value = description?.trim();

  if (!value || evidence.length === 0) {
    return {
      text: CANH_BAO_THIEU_DU_LIEU,
      warning: true,
    };
  }

  return {
    text: `${value} ${evidenceCodes(evidence.map((item) => item.ma))}`,
    warning: false,
  };
}

function assessmentByCriterion(data: ReportData, criterion: ReportCriterion) {
  return data.assessments.find((item) => item.tieu_chi_id === criterion.id);
}

function criterionSection(data: ReportData, criterion: ReportCriterion) {
  const assessment = assessmentByCriterion(data, criterion);
  const linkedEvidence = criterionEvidence(data, criterion.id);
  const muc1 = descriptionWithEvidence(assessment?.mo_ta_muc_1, linkedEvidence);
  const muc2 = descriptionWithEvidence(assessment?.mo_ta_muc_2, linkedEvidence);
  const level = assessment?.muc_dat ?? 0;

  return [
    p([`Tiêu chí ${criterion.ma}: ${criterion.ten}`], { heading: HeadingLevel.HEADING_3 }),
    p([text("Mức 1: ", { bold: true }), criterion.muc_1 || CANH_BAO_THIEU_DU_LIEU]),
    p([text("Mức 2: ", { bold: true }), criterion.muc_2 || CANH_BAO_THIEU_DU_LIEU]),
    p([text("Mô tả hiện trạng:", { bold: true })]),
    table([
      new TableRow({
        tableHeader: true,
        children: [
          plainCell("Mức", 12),
          plainCell("Hiện trạng, kết quả đạt được kèm mã minh chứng", 68),
          plainCell("Đánh giá", 20),
        ],
      }),
      new TableRow({
        children: [
          plainCell("Mức 1", 12),
          plainCell(muc1.text, 68, muc1.warning),
          plainCell(assessment?.dat_muc_1 ? "Đạt" : "Không đạt", 20),
        ],
      }),
      new TableRow({
        children: [
          plainCell("Mức 2", 12),
          plainCell(muc2.text, 68, muc2.warning),
          plainCell(assessment?.dat_muc_2 ? "Đạt" : "Không đạt", 20),
        ],
      }),
    ]),
    p([text("Tự đánh giá: ", { bold: true }), `Tiêu chí ${assessmentLabel(level).toLowerCase()}.`]),
  ];
}

function standardSummary(data: ReportData, standardId: string) {
  const standardCriteria = data.criteria.filter((criterion) => criterion.tieu_chuan_id === standardId);

  return table([
    new TableRow({
      tableHeader: true,
      children: [plainCell("Tiêu chí", 20), plainCell("Bắt buộc", 20), plainCell("Kết quả", 30), plainCell("Minh chứng", 30)],
    }),
    ...standardCriteria.map((criterion) => {
      const assessment = assessmentByCriterion(data, criterion);
      const linkedEvidence = criterionEvidence(data, criterion.id);

      return new TableRow({
        children: [
          plainCell(criterion.ma, 20),
          plainCell(criterion.la_bat_buoc ? "Có" : "Không", 20),
          plainCell(assessmentLabel(assessment?.muc_dat ?? 0), 30),
          plainCell(linkedEvidence.map((item) => item.ma).join(", "), 30, linkedEvidence.length === 0),
        ],
      });
    }),
  ]);
}

function warningParagraph(label: string) {
  return p([text(`${label}: `, { bold: true }), text(CANH_BAO_THIEU_DU_LIEU, { color: RED })]);
}

function cover(data: ReportData) {
  return [
    p([data.school.co_quan_quan_ly ?? ""], { center: true }),
    p([data.school.ten.toUpperCase()], { center: true }),
    p([""], { spacing: 1000 }),
    p([text("BÁO CÁO TỰ ĐÁNH GIÁ", { bold: true, size: 32 })], { center: true }),
    p([text(`Năm học ${data.year.ten}`, { bold: true, size: 28 })], { center: true }),
    p([text(`Cấp học: ${data.capHoc}`, { size: 26 })], { center: true }),
    p([""], { spacing: 2400 }),
    p([data.school.dia_chi ?? "", " ", new Date().getFullYear().toString()], { center: true }),
  ];
}

function innerCover(data: ReportData) {
  const members =
    data.councilMembers.length > 0
      ? data.councilMembers
      : [{ ho_ten: CANH_BAO_THIEU_DU_LIEU, chuc_vu: "", vai_tro_hoi_dong: "", thu_tu: 1 }];

  return [
    p([text("DANH SÁCH VÀ CHỮ KÝ HỘI ĐỒNG TỰ ĐÁNH GIÁ", { bold: true })], {
      center: true,
      heading: HeadingLevel.HEADING_1,
    }),
    table([
      new TableRow({
        tableHeader: true,
        children: [plainCell("TT", 10), plainCell("Họ và tên", 35), plainCell("Chức vụ", 25), plainCell("Vai trò", 20), plainCell("Chữ ký", 10)],
      }),
      ...members.map(
        (member, index) =>
          new TableRow({
            children: [
              plainCell(String(index + 1), 10),
              plainCell(member.ho_ten, 35, member.ho_ten === CANH_BAO_THIEU_DU_LIEU),
              plainCell(member.chuc_vu ?? "", 25),
              plainCell(member.vai_tro_hoi_dong, 20),
              plainCell("", 10),
            ],
          }),
      ),
    ]),
  ];
}

export async function buildSelfAssessmentDocx(data: ReportData) {
  const children = [
    ...cover(data),
    new Paragraph({ pageBreakBefore: true }),
    ...innerCover(data),
    new Paragraph({ pageBreakBefore: true }),
    p([text("MỤC LỤC", { bold: true })], { center: true, heading: HeadingLevel.HEADING_1 }),
    new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ pageBreakBefore: true }),
    p(["PHẦN I. TỔNG QUAN"], { heading: HeadingLevel.HEADING_1 }),
    p([text("Cơ sở giáo dục: ", { bold: true }), data.school.ten]),
    p([text("Năm học: ", { bold: true }), data.year.ten]),
    p([text("Kết quả tự đánh giá: ", { bold: true }), data.giaiTrinh.mucDat]),
    p([text("Giải trình: ", { bold: true }), data.giaiTrinh.lyDo]),
    p(["PHẦN II. TỰ ĐÁNH GIÁ"], { heading: HeadingLevel.HEADING_1 }),
  ];

  for (const standard of data.standards) {
    const standardCriteria = data.criteria.filter((criterion) => criterion.tieu_chuan_id === standard.id);

    if (standardCriteria.length === 0) {
      continue;
    }

    children.push(p([`Tiêu chuẩn ${standard.so_thu_tu}: ${standard.ten}`], { heading: HeadingLevel.HEADING_2 }));

    for (const criterion of standardCriteria) {
      children.push(...criterionSection(data, criterion));
    }

    children.push(warningParagraph("Điểm mạnh nổi bật"));
    children.push(warningParagraph("Điểm hạn chế trọng tâm và nguyên nhân cốt lõi"));
    children.push(warningParagraph("Định hướng cải tiến chất lượng"));
    children.push(p([text("Bảng tổng hợp kết quả:", { bold: true })]));
    children.push(standardSummary(data, standard.id));
  }

  children.push(
    p(["PHẦN III. KẾT LUẬN"], { heading: HeadingLevel.HEADING_1 }),
    p([text("Kết quả: ", { bold: true }), data.giaiTrinh.mucDat]),
    p([text("Khoảng cách cần xử lý: ", { bold: true }), data.giaiTrinh.khoangCach]),
    p(["PHẦN IV. PHỤ LỤC"], { heading: HeadingLevel.HEADING_1 }),
    p([text("Danh mục minh chứng được trích dẫn trong báo cáo", { bold: true })]),
    evidenceTable(data.evidence),
  );

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 26 },
          paragraph: { spacing: { after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT, width: 11906, height: 16838 },
            margin: { top: 1417, right: 1134, bottom: 1417, left: 1701 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

function evidenceTable(evidence: ReportEvidence[]) {
  return table([
    new TableRow({
      tableHeader: true,
      children: [plainCell("TT", 8), plainCell("Mã", 18), plainCell("Tên", 38), plainCell("Vị trí/đường dẫn", 26), plainCell("Ghi chú", 10)],
    }),
    ...(evidence.length > 0
      ? evidence.map(
          (item, index) =>
            new TableRow({
              children: [
                plainCell(String(index + 1), 8),
                plainCell(item.ma, 18),
                plainCell(item.ten, 38),
                plainCell(item.duong_dan || item.storage_path || "", 26),
                plainCell(item.ghi_chu ?? "", 10),
              ],
            }),
        )
      : [
          new TableRow({
            children: [plainCell("1", 8), plainCell(CANH_BAO_THIEU_DU_LIEU, 92, true)],
          }),
        ]),
  ]);
}

export async function buildImprovementPlanDocx(data: ReportData) {
  const children = [
    p([text("KẾ HOẠCH CẢI TIẾN CHẤT LƯỢNG", { bold: true, size: 32 })], {
      center: true,
      heading: HeadingLevel.HEADING_1,
    }),
    p(["1. Thông tin chung"], { heading: HeadingLevel.HEADING_2 }),
    p([text("Cơ sở giáo dục: ", { bold: true }), data.school.ten]),
    p([text("Năm học: ", { bold: true }), data.year.ten]),
    p(["2. Căn cứ xây dựng"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Căn cứ xây dựng"),
    p(["3. Mục đích, yêu cầu"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Mục đích, yêu cầu"),
    p(["4. Tóm tắt vấn đề trọng tâm cần cải tiến"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Tóm tắt vấn đề trọng tâm cần cải tiến"),
    p(["5. Bảng kế hoạch cải tiến"], { heading: HeadingLevel.HEADING_2 }),
    improvementPlanTable(data.plans),
    p(["6. Theo dõi và đánh giá thực hiện"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Theo dõi và đánh giá thực hiện"),
    p(["7. Tổ chức thực hiện"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Tổ chức thực hiện"),
    p(["8. Cơ chế đánh giá và báo cáo"], { heading: HeadingLevel.HEADING_2 }),
    warningParagraph("Cơ chế đánh giá và báo cáo"),
  ];

  const document = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 24 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

function improvementPlanTable(plans: ImprovementPlan[]) {
  const headers = [
    "TT",
    "Nội dung",
    "Mục tiêu",
    "Hoạt động/giải pháp",
    "Chỉ số đánh giá kết quả",
    "Thời gian",
    "Đơn vị/cá nhân phụ trách",
    "Nguồn lực",
    "Minh chứng dự kiến",
    "Mức độ thực hiện",
  ];

  return table([
    new TableRow({
      tableHeader: true,
      children: headers.map((header) => plainCell(header)),
    }),
    ...(plans.length > 0
      ? plans.map(
          (plan, index) =>
            new TableRow({
              children: [
                plainCell(String(index + 1)),
                plainCell(plan.noi_dung ?? "", undefined, !plan.noi_dung),
                plainCell(plan.muc_tieu ?? "", undefined, !plan.muc_tieu),
                plainCell(plan.hoat_dong ?? "", undefined, !plan.hoat_dong),
                plainCell(plan.chi_so_ket_qua ?? "", undefined, !plan.chi_so_ket_qua),
                plainCell(formatDateRange(plan.thoi_gian_bat_dau, plan.thoi_gian_ket_thuc)),
                plainCell(plan.phu_trach?.ho_ten ?? ""),
                plainCell(plan.nguon_luc ?? ""),
                plainCell(plan.minh_chung_du_kien ?? ""),
                plainCell(plan.muc_do_thuc_hien ?? ""),
              ],
            }),
        )
      : [
          new TableRow({
            children: [plainCell("1"), plainCell(CANH_BAO_THIEU_DU_LIEU, undefined, true)],
          }),
        ]),
  ]);
}
