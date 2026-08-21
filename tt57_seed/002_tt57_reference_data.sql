-- TT57/2026/TT-BGDĐT reference-data seed
-- Phụ lục I, II, III
-- Assumption: id columns are UUID-compatible. Adjust only ID expressions if your schema uses BIGINT/SERIAL.
-- don_vi and cong_thuc remain NULL because the appendices do not define normalized units/formulas for each extracted item.
BEGIN;

INSERT INTO bo_tieu_chuan (id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, trang_thai)
VALUES ('2cb34301-9207-5036-b337-d229d8268b1d', '57/2026/TT-BGDĐT', 'Bộ tiêu chuẩn bảo đảm chất lượng giáo dục TT57/2026 - Phụ lục I', DATE '2026-07-07', 'mam_non', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('594f44c3-6525-5d6f-a74f-ba7932256111', '2cb34301-9207-5036-b337-d229d8268b1d', 1, 'Quản trị nhà trường và bảo đảm chất lượng')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('74e36bd5-2970-5156-bddb-04e74a6fa42b', '594f44c3-6525-5d6f-a74f-ba7932256111', '1.1', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('628c8381-eed3-5f71-bf3a-239a9e234151', '74e36bd5-2970-5156-bddb-04e74a6fa42b', 1, 'Nhà trường xác định mục tiêu, chỉ tiêu và kế hoạch năm học hoặc kế hoạch phát triển phù hợp với nhiệm vụ nuôi dưỡng, chăm sóc, giáo dục trẻ; quy mô, loại hình, điều kiện thực tế của nhà trường, địa phương, đặc điểm trẻ và Chương trình giáo dục mầm non.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4ecec4d9-df80-5098-a647-0c6114141fca', '74e36bd5-2970-5156-bddb-04e74a6fa42b', 2, 'Nhà trường rà soát kết quả thực hiện kế hoạch để điều chỉnh mục tiêu, nhiệm vụ, nguồn lực và tổ chức hoạt động trong chu kỳ tiếp theo. Việc điều chỉnh có căn cứ từ kết quả thực hiện, dữ liệu quản lý, phản hồi phù hợp và được công khai theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('a6c899dc-b579-5bc5-bec8-c9b7dcaf0ea3', '74e36bd5-2970-5156-bddb-04e74a6fa42b', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', 'Kế hoạch năm học; kế hoạch giáo dục nhà trường; mục tiêu, chỉ tiêu, nhiệm vụ và kế hoạch phát triển của nhà trường; báo cáo thực hiện kế hoạch; minh chứng rà soát, điều chỉnh mục tiêu, nhiệm vụ hoặc kế hoạch phát triển; minh chứng công khai kế hoạch và kết quả thực hiện theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('b890cb54-1bf6-5702-b850-e43e35c4981c', '594f44c3-6525-5d6f-a74f-ba7932256111', '1.2', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('0f88e724-47d1-5c52-87e8-45f9f792c1ef', 'b890cb54-1bf6-5702-b850-e43e35c4981c', 1, 'Nhà trường có cơ cấu tổ chức, phân công nhiệm vụ và bố trí người phụ trách các hoạt động theo quy định, phù hợp với quy mô, loại hình, số nhóm/lớp và điều kiện thực tế. Nhiệm vụ của cán bộ quản lý cơ sở giáo dục, giáo viên, nhân viên và các bộ phận liên quan được phân công rõ ràng, bảo đảm phối hợp trong hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ và bảo đảm an toàn.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e870d69c-0093-59c9-8a57-f09b5d09f648', 'b890cb54-1bf6-5702-b850-e43e35c4981c', 2, 'Nhà trường rà soát hiệu quả cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ; kịp thời điều chỉnh các nhiệm vụ chồng chéo, bỏ sót hoặc quá tải. Các nhiệm vụ thiết yếu có người phụ trách, có cơ chế phối hợp hoặc thay thế khi có thay đổi nhân sự.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('a935de38-0936-57e8-8333-a4a5856b2b83', 'b890cb54-1bf6-5702-b850-e43e35c4981c', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', 'Sơ đồ tổ chức; quyết định thành lập hoặc kiện toàn hội đồng, tổ chuyên môn, tổ văn phòng hoặc bộ phận liên quan; quy chế làm việc; bảng phân công nhiệm vụ; biên bản họp; hồ sơ điều chỉnh phân công khi có thay đổi.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', '594f44c3-6525-5d6f-a74f-ba7932256111', '1.3', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('fb2a7215-df11-5ad7-9dbf-b9c02b0e4430', '2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', 1, 'Nhà trường có hồ sơ, thông tin và dữ liệu thiết yếu về kế hoạch, tài chính, trẻ, đội ngũ, nhóm/lớp, chương trình, cơ sở vật chất, sức khỏe, dinh dưỡng, chuyên cần, an toàn và phát triển của trẻ. Hồ sơ, thông tin và dữ liệu được cập nhật, lưu trữ, quản lý, sử dụng theo quy định, bảo đảm đầy đủ, đúng thời hạn, an toàn và bảo mật thông tin.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b4e34f21-1597-5964-b9d7-b643f630bbb3', '2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', 2, 'Nhà trường rà soát, đối chiếu, tổng hợp và sử dụng dữ liệu để xác định vấn đề, ưu tiên nguồn lực, điều chỉnh kế hoạch, hỗ trợ trẻ và cải thiện điều kiện nuôi dưỡng, chăm sóc, giáo dục. Các sai lệch dữ liệu ảnh hưởng đến quản lý, theo dõi chất lượng được phát hiện và khắc phục theo thời hạn quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('222875e2-fe91-5f04-a469-c48d5a37ec44', '2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', 'Hồ sơ quản lý kế hoạch, tài chính, nhân lực; sổ theo dõi trẻ; hồ sơ nhóm/lớp; hồ sơ sức khỏe, dinh dưỡng, chuyên cần và an toàn của trẻ; hồ sơ cơ sở vật chất; báo cáo tổng hợp hoặc rà soát dữ liệu phục vụ quản lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('d8edd075-3265-545d-942f-c0751eb763f2', '2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', 'Tỷ lệ dữ liệu được cập nhật đầy đủ, đúng thời hạn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('8750c98d-afa4-51f0-8f6d-a56c53321c9f', '2b5dc3f4-1e5b-5503-bb6d-713be6a2690d', 'số sai lệch dữ liệu được phát hiện và xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('1694147b-7dd3-5a77-b9b0-94693007189d', '594f44c3-6525-5d6f-a74f-ba7932256111', '1.4', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('505a36d3-68d3-5e16-b92b-cd2790efc155', '1694147b-7dd3-5a77-b9b0-94693007189d', 1, 'Nhà trường thực hiện tự kiểm tra hoặc tự đánh giá để xác định điểm mạnh, hạn chế, nguyên nhân và nội dung cần cải tiến. Kết quả tự kiểm tra, tự đánh giá được sử dụng để xây dựng hoặc cập nhật kế hoạch cải tiến chất lượng với nhiệm vụ, người phụ trách, thời hạn thực hiện và kết quả dự kiến.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b62c7743-3f3a-54e2-b371-14c114f04217', '1694147b-7dd3-5a77-b9b0-94693007189d', 2, 'Nhà trường triển khai kế hoạch cải tiến dựa trên dữ liệu, phản hồi và kết quả tự đánh giá; kết quả cải tiến được theo dõi, kiểm chứng bằng minh chứng phù hợp. Chu trình tự đánh giá, cải tiến, công khai và giải trình được thực hiện hằng năm; kết quả cải tiến được sử dụng để điều chỉnh hoạt động quản lý, nuôi dưỡng, chăm sóc, giáo dục trẻ trong chu kỳ tiếp theo.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('84e559dd-a489-5fd1-a1f3-7ca19b3d401d', '1694147b-7dd3-5a77-b9b0-94693007189d', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', 'Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến chất lượng; phân công thực hiện cải tiến; hồ sơ theo dõi thực hiện cải tiến; hồ sơ công khai, giải trình, tiếp nhận và xử lý phản hồi; minh chứng kết quả cải tiến.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4432aed9-f2d3-58b9-a8b3-cf43801f7259', '1694147b-7dd3-5a77-b9b0-94693007189d', 'Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('f08e883f-df42-5163-912d-d54076e25b90', '1694147b-7dd3-5a77-b9b0-94693007189d', 'số phản hồi được tiếp nhận, xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('b1e90ded-4e28-5ac3-8cec-1f27d079b47d', '2cb34301-9207-5036-b337-d229d8268b1d', 2, 'Phát triển đội ngũ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('affc4f43-4c14-5b92-915d-03db055e8d67', 'b1e90ded-4e28-5ac3-8cec-1f27d079b47d', '2.1', 'Cán bộ quản lý cơ sở giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('182452e5-68dc-5dcb-bf18-ce55006b96d6', 'affc4f43-4c14-5b92-915d-03db055e8d67', 1, 'Nhà trường có hiệu trưởng, phó hiệu trưởng theo quy định; cán bộ quản lý cơ sở giáo dục được bổ nhiệm, phân công nhiệm vụ phù hợp và đáp ứng tiêu chuẩn chức danh. Cán bộ quản lý cơ sở giáo dục thực hiện nhiệm vụ chỉ đạo, điều hành đối với kế hoạch giáo dục, đội ngũ, trẻ, tài chính, tài sản, an toàn, hồ sơ, dữ liệu và phối hợp với cha mẹ trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('aba6fe83-4e65-5101-9754-9be2165b1db4', 'affc4f43-4c14-5b92-915d-03db055e8d67', 2, 'Cán bộ quản lý cơ sở giáo dục sử dụng dữ liệu, kết quả tự đánh giá, kiểm tra nội bộ và phản hồi phù hợp để điều chỉnh kế hoạch, phân công nhiệm vụ, phát triển đội ngũ và cải tiến chất lượng. Kết quả điều chỉnh, cải tiến được theo dõi, kiểm chứng và sử dụng trong quản lý nhà trường.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('79ab59c0-ff70-59f6-bf29-44143129aa7a', 'affc4f43-4c14-5b92-915d-03db055e8d67', 'Cán bộ quản lý cơ sở giáo dục', 'Quyết định bổ nhiệm; hồ sơ phân công nhiệm vụ; hồ sơ đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('dc8fa295-443d-54cc-aa83-d1b4f201e1e9', 'affc4f43-4c14-5b92-915d-03db055e8d67', 'Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('f48b0bcd-5185-5832-9f1c-9d41df1b5a84', 'affc4f43-4c14-5b92-915d-03db055e8d67', 'tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('3578a0b7-d5f1-59a6-a230-a97051f724d2', 'b1e90ded-4e28-5ac3-8cec-1f27d079b47d', '2.2', 'Giáo viên', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('18ad4220-fce7-517b-8c09-b8f8895ce00e', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 1, 'Nhà trường có đội ngũ giáo viên đáp ứng yêu cầu thực hiện Chương trình giáo dục mầm non về số lượng, cơ cấu nhóm/lớp, trình độ đào tạo, phẩm chất, đạo đức nghề nghiệp và chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh theo quy định. Giáo viên được phân công phù hợp với chuyên môn, năng lực và điều kiện thực tế; thực hiện nhiệm vụ nuôi dưỡng, chăm sóc, giáo dục trẻ; tham gia sinh hoạt chuyên môn, bồi dưỡng và theo dõi, đánh giá sự phát triển của trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('3ccfba54-0ab6-51c8-b006-6fa366c05084', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 2, 'Nhà trường theo dõi, rà soát tình hình đội ngũ giáo viên để điều chỉnh phân công, bồi dưỡng và hỗ trợ chuyên môn. Giáo viên sử dụng kết quả theo dõi sự phát triển của trẻ, sinh hoạt chuyên môn, bồi dưỡng và phản hồi phù hợp để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục và thực hiện biện pháp hỗ trợ trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('7f285669-ceff-5644-ab45-5f0c4fc682c2', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 'Giáo viên', 'Hồ sơ giáo viên; phân công nhóm/lớp; kế hoạch giáo dục; hồ sơ bồi dưỡng; biên bản sinh hoạt chuyên môn; hồ sơ theo dõi sự phát triển của trẻ; minh chứng điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('eb4d32d6-784e-5ca3-b1bf-7b7abb0117e3', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 'Số lượng giáo viên hiện có so với định mức', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('f3c2f02f-0694-503d-ae45-e8f844cea62d', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 'số giáo viên thiếu hoặc thừa theo nhóm/lớp', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('fa812182-07a2-5cd1-a285-9690317f2253', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 'tỷ lệ giáo viên đạt chuẩn trình độ đào tạo', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('875597cd-16ac-5389-be22-574396e77aea', '3578a0b7-d5f1-59a6-a230-a97051f724d2', 'tỷ lệ giáo viên được phân công phù hợp nhóm/lớp', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('b289eefd-aec6-57b8-90e6-acf153d63d2e', 'b1e90ded-4e28-5ac3-8cec-1f27d079b47d', '2.3', 'Nhân sự hỗ trợ giáo dục', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('ce5ebff1-e5c4-5b51-bb7b-8c7c071895f8', 'b289eefd-aec6-57b8-90e6-acf153d63d2e', 1, 'Nhà trường bố trí nhân sự hỗ trợ hoặc có phương án phân công, kiêm nhiệm, hợp đồng, phối hợp để thực hiện các nhiệm vụ thiết yếu về y tế, dinh dưỡng, an toàn, thiết bị, hành chính, tài chính, bảo vệ và hỗ trợ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ theo quy định và điều kiện thực tế. Nhiệm vụ của từng vị trí hoặc bộ phận hỗ trợ được phân công cụ thể.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('aa7dc4e7-4d1f-5fdb-b17f-db498cf06a60', 'b289eefd-aec6-57b8-90e6-acf153d63d2e', 2, 'Nhà trường rà soát mức độ đáp ứng của nhân sự hỗ trợ; kịp thời điều chỉnh phân công hoặc đề xuất bổ sung khi cần. Các nhiệm vụ thiết yếu về an toàn, y tế, dinh dưỡng, nuôi dưỡng, bảo vệ và hỗ trợ hoạt động của nhà trường được duy trì ổn định, không bị bỏ trống.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('7488aeb2-fa0b-5842-b230-e5fd57099915', 'b289eefd-aec6-57b8-90e6-acf153d63d2e', 'Nhân viên (thuộc nhóm nhân sự hỗ trợ hoạt động giáo dục)', 'Danh sách nhân sự hỗ trợ; phân công nhiệm vụ; hồ sơ thực hiện nhiệm vụ về y tế, dinh dưỡng, thiết bị, hành chính, tài chính, bảo vệ và các nhiệm vụ hỗ trợ khác; hồ sơ rà soát, điều chỉnh khi có thay đổi.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('5821d5a8-d9c8-5a83-a5dd-6d7c28398a5f', 'b289eefd-aec6-57b8-90e6-acf153d63d2e', 'Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('c51bdc39-7454-51aa-b5c0-18db7f1e2d05', 'b289eefd-aec6-57b8-90e6-acf153d63d2e', 'tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '2cb34301-9207-5036-b337-d229d8268b1d', 3, 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển trẻ em')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('9be29334-7b54-5c46-afd9-79a26f299200', 'c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '3.1', 'Tổ chức thực hiện chương trình giáo dục mầm non', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('8c40670b-c2c5-5f4a-adf1-1ed507720e17', '9be29334-7b54-5c46-afd9-79a26f299200', 1, 'Nhà trường xây dựng kế hoạch giáo dục và tổ chức thực hiện Chương trình giáo dục mầm non phù hợp với độ tuổi, nhóm trẻ, lớp mẫu giáo, điều kiện thực tế của nhà trường và địa phương. Các hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ được thực hiện theo kế hoạch, bảo đảm an toàn, phù hợp với đặc điểm phát triển của trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('76a3f5ce-2b9c-53b0-b5ff-d1131300a78b', '9be29334-7b54-5c46-afd9-79a26f299200', 2, 'Nhà trường sử dụng kết quả theo dõi tiến độ thực hiện kế hoạch, chuyên cần, sức khỏe, dinh dưỡng, sự phát triển của trẻ và điều kiện thực tế để rà soát, điều chỉnh kế hoạch giáo dục. Việc thực hiện chương trình được duy trì ổn định; kế hoạch giáo dục được điều chỉnh, cải tiến phù hợp với nhu cầu của trẻ và điều kiện của nhà trường.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('1948fbac-13ad-5c51-ae8e-c66480f512a7', '9be29334-7b54-5c46-afd9-79a26f299200', 'Tổ chức thực hiện chương trình giáo dục mầm non', 'Kế hoạch giáo dục; lịch hoạt động; hồ sơ nhóm/lớp; báo cáo thực hiện chương trình; biên bản sinh hoạt chuyên môn; minh chứng theo dõi, điều chỉnh kế hoạch giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('e900b992-de33-5fea-bb19-8e1a37803e16', '9be29334-7b54-5c46-afd9-79a26f299200', 'Tỷ lệ thực hiện kế hoạch giáo dục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('77d869c8-5d94-5ad1-bf4b-0a4cbfad92b0', '9be29334-7b54-5c46-afd9-79a26f299200', 'tỷ lệ chuyên cần của trẻ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('00a0e1de-1d10-5819-b424-ebaa56f42a65', 'c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '3.2', 'Đổi mới phương pháp chăm sóc, giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của trẻ em', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('d37e4add-3074-5c7a-8492-5fc8af42d2cc', '00a0e1de-1d10-5819-b424-ebaa56f42a65', 1, 'Giáo viên áp dụng phương pháp nuôi dưỡng, chăm sóc, giáo dục phù hợp với độ tuổi, đặc điểm phát triển và nhu cầu của trẻ; thực hiện quan sát, theo dõi, đánh giá sự phát triển của trẻ theo quy định hoặc kế hoạch của nhà trường. Kết quả quan sát, theo dõi, đánh giá được sử dụng để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('ff028ae6-c8c1-59be-9f3f-37fa0f329d59', '00a0e1de-1d10-5819-b424-ebaa56f42a65', 2, 'Nhà trường tổ chức sinh hoạt chuyên môn để phân tích phương pháp nuôi dưỡng, chăm sóc, giáo dục, kết quả theo dõi trẻ và hỗ trợ giáo viên điều chỉnh hoạt động. Phương pháp nuôi dưỡng, chăm sóc, giáo dục được cải tiến; trẻ được tham gia hoạt động tích cực, phù hợp, an toàn và có tiến bộ được ghi nhận.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('8b2cd734-279f-5c34-a704-ac8fafb327bf', '00a0e1de-1d10-5819-b424-ebaa56f42a65', 'Đổi mới phương pháp giáo dục/chăm sóc và theo dõi, đánh giá sự phát triển, tiến bộ của trẻ em', 'Kế hoạch hoạt động; hồ sơ quan sát, theo dõi, đánh giá sự phát triển của trẻ; hình ảnh, sản phẩm hoạt động của trẻ; biên bản sinh hoạt chuyên môn; minh chứng dự giờ, góp ý chuyên môn; minh chứng điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('3f3b5a9e-f62f-5cf7-a563-e1289d32e968', '00a0e1de-1d10-5819-b424-ebaa56f42a65', 'Số trẻ được quan sát, theo dõi theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('45588802-c774-5c57-a51d-a65fc5216912', '00a0e1de-1d10-5819-b424-ebaa56f42a65', 'số trẻ cần hỗ trợ được phát hiện qua quan sát, theo dõi', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('612853b5-eeba-5861-8f8a-239ec7954a39', 'c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '3.3', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('af13e823-697a-5976-a84b-30e795ec9e76', '612853b5-eeba-5861-8f8a-239ec7954a39', 1, 'Nhà trường tổ chức các hoạt động vui chơi, trải nghiệm, vận động, nghệ thuật, ngôn ngữ, khám phá, tự phục vụ và các hoạt động phù hợp khác theo độ tuổi. Trẻ được tham gia các hoạt động phát triển thể chất, nhận thức, ngôn ngữ, tình cảm - kỹ năng xã hội và thẩm mỹ theo Chương trình giáo dục mầm non.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e6791f39-63c4-5ed8-a452-eba335525fcd', '612853b5-eeba-5861-8f8a-239ec7954a39', 2, 'Nhà trường theo dõi sự tham gia, nhu cầu, khả năng và tiến bộ của trẻ để điều chỉnh nội dung, hình thức tổ chức hoạt động giáo dục. Hoạt động phát triển toàn diện được duy trì, đa dạng, an toàn, phù hợp bối cảnh và hỗ trợ sự tiến bộ của trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('4fb33919-d6f7-5a2b-b9aa-41fe24621e67', '612853b5-eeba-5861-8f8a-239ec7954a39', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', 'Kế hoạch hoạt động; hồ sơ nhóm/lớp; hồ sơ hoặc tổng hợp hoạt động vui chơi, trải nghiệm, vận động, nghệ thuật, ngôn ngữ, khám phá và tự phục vụ; hình ảnh, sản phẩm hoạt động của trẻ; minh chứng điều chỉnh, cải tiến hoạt động.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('02af9cae-fef7-5a1b-89f8-3a0d26f8070d', '612853b5-eeba-5861-8f8a-239ec7954a39', 'Số hoạt động giáo dục được tổ chức trong năm', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('5b238686-a5a1-5124-aad7-776cd5014f31', '612853b5-eeba-5861-8f8a-239ec7954a39', 'tỷ lệ trẻ tham gia hoạt động giáo dục theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 'c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '3.4', 'Quản lý, theo dõi, hỗ trợ trẻ em và giáo dục hòa nhập', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('7947c22e-4700-58ff-b4b7-ff9468217251', 'ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 1, 'Nhà trường có hồ sơ quản lý trẻ; theo dõi chuyên cần, sức khỏe, dinh dưỡng, an toàn, sự phát triển và nhu cầu hỗ trợ của trẻ. Trẻ cần hỗ trợ, trẻ có nhu cầu đặc thù hoặc trẻ thuộc diện giáo dục hòa nhập được nhận diện, lập kế hoạch hỗ trợ, phân công người phụ trách và phối hợp với cha mẹ trẻ khi cần.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('20d3743e-fb9e-5aa9-a599-c3ef45652536', 'ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 2, 'Kết quả hỗ trợ trẻ được theo dõi, đánh giá và điều chỉnh khi cần thiết. Nhà trường duy trì việc phát hiện sớm, hỗ trợ trẻ và phối hợp với cha mẹ trẻ, chuyên gia, cơ quan hoặc tổ chức liên quan khi phù hợp; bảo đảm trẻ được tôn trọng, an toàn, hòa nhập và có cơ hội phát triển.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('548668bd-d6f7-5fb0-ad10-11901271a134', 'ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 'Quản lý, theo dõi, hỗ trợ trẻ và giáo dục hòa nhập', 'Hồ sơ trẻ; dữ liệu chuyên cần, sức khỏe, dinh dưỡng; danh sách trẻ cần hỗ trợ; kế hoạch và hồ sơ hỗ trợ cá nhân hoặc nhóm; minh chứng trao đổi với cha mẹ trẻ; biên bản phối hợp; hồ sơ tư vấn, y tế nếu có; báo cáo rà soát định kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('cb32bb8f-9e93-5ec5-a819-ce1cce2eec4f', 'ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 'Số trẻ cần hỗ trợ được lập kế hoạch hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4630ec19-6164-5f7e-8466-f514ad539a98', 'ac7853fa-fa8d-5fe0-819d-825bf8cf3584', 'số trẻ được theo dõi, hỗ trợ theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('23f8c119-7dc9-5754-aba3-1d2d0628703d', 'c2a28fc8-ff19-5e99-8e77-172fb04d50c6', '3.5', 'Kết quả phát triển và sự tiến bộ của trẻ', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('83c68084-049f-5859-8c26-72d272deed68', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 1, 'Trẻ được theo dõi sự phát triển theo mục tiêu Chương trình giáo dục mầm non và đặc điểm độ tuổi. Nhà trường tổng hợp kết quả phát triển, chuyên cần, sức khỏe, dinh dưỡng và sự tiến bộ của trẻ để xác định nhóm trẻ cần hỗ trợ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e02af1a9-e23b-5400-9650-8cccbc52a628', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 2, 'Nhà trường phân tích kết quả phát triển và sự tiến bộ của trẻ để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục và hỗ trợ trẻ. Kết quả theo dõi cho thấy sự tiến bộ của trẻ, đặc biệt đối với trẻ cần hỗ trợ hoặc trẻ 5 tuổi chuẩn bị vào lớp Một; việc xem xét kết quả chú trọng sự tiến bộ của trẻ, không áp dụng máy móc yêu cầu so sánh giữa các cơ sở giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('3ae7efa6-6f54-509b-abe1-caa21de4346d', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 'Kết quả phát triển và sự tiến bộ của trẻ', 'Hồ sơ theo dõi trẻ; kết quả đánh giá sự phát triển của trẻ theo độ tuổi/giai đoạn; sản phẩm hoạt động của trẻ; báo cáo tổng hợp kết quả phát triển, chuyên cần, sức khỏe, dinh dưỡng và sự tiến bộ của trẻ; danh sách trẻ cần hỗ trợ; thông tin, minh chứng về chuẩn bị cho trẻ 5 tuổi vào lớp Một; phản hồi của cha mẹ trẻ khi có.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4815bebb-dd97-51e6-886d-c875fd29fe31', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 'Số trẻ được theo dõi sự phát triển theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('fac9c96a-024f-5ca6-b46d-50767d3dd4c8', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 'số trẻ có nội dung phát triển cần được theo dõi, hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('efca6219-8c25-577c-aee4-9bc1b85e851b', '23f8c119-7dc9-5754-aba3-1d2d0628703d', 'số trẻ 5 tuổi được theo dõi, hỗ trợ chuẩn bị vào lớp Một', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('e5f3069c-905a-5535-a0b8-b01733b18e4f', '2cb34301-9207-5036-b337-d229d8268b1d', 4, 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('69cd1c9a-cea5-5683-b929-288a2757e8b5', 'e5f3069c-905a-5535-a0b8-b01733b18e4f', '4.1', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('ac9638bc-8b1e-57f3-8cab-2fd0732a52c9', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 1, 'Nhà trường có phòng học, khu chức năng, sân chơi, khu vệ sinh, nước sạch, thiết bị, đồ dùng, đồ chơi, học liệu, bếp ăn (nếu có) và các điều kiện vật chất cần thiết phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ theo quy định, phù hợp với quy mô, độ tuổi và điều kiện thực tế. Các điều kiện này được quản lý, sử dụng, bảo trì, bảo quản và rà soát định kỳ; hạng mục thiếu, xuống cấp hoặc chưa bảo đảm an toàn có phương án khắc phục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('036efa27-0570-5d5f-a56d-134ace77ae35', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 2, 'Nhà trường sử dụng dữ liệu về tình trạng cơ sở vật chất, thiết bị, đồ dùng, đồ chơi, học liệu và nhu cầu nuôi dưỡng, chăm sóc, giáo dục trẻ để lập kế hoạch sửa chữa, bảo trì, bổ sung, sắp xếp hoặc khai thác hiệu quả hơn. Việc cải thiện cơ sở vật chất, thiết bị, học liệu và điều kiện vật chất góp phần tạo môi trường nuôi dưỡng, chăm sóc, giáo dục an toàn, thân thiện, phù hợp với đặc điểm phát triển của trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('3178fc22-cb4b-554d-b799-55766db978ba', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động nuôi dưỡng chăm sóc giáo dục trẻ', 'Hồ sơ tài sản; hồ sơ kiểm kê thiết bị, đồ dùng, đồ chơi, học liệu; bảng kiểm phòng học, khu vệ sinh, sân chơi, bếp ăn nếu có; kế hoạch bảo trì, sửa chữa, bổ sung; biên bản kiểm tra; minh chứng khắc phục hạng mục thiếu, xuống cấp hoặc chưa bảo đảm an toàn; minh chứng sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a512a9ca-6fb9-5bed-8d72-1d25f14c51c8', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 'Số phòng học đạt yêu cầu so với tổng số phòng học', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('1ef4ad45-e8fc-5a74-b184-ffb03e4bdd40', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 'số khu vệ sinh đạt yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('5df6450a-b73f-57e6-ac8c-5f8804ced1f1', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 'số bếp ăn đạt yêu cầu khi áp dụng', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a053e01e-9956-5d88-a452-bf71096923d3', '69cd1c9a-cea5-5683-b929-288a2757e8b5', 'tỷ lệ thiết bị, đồ dùng, đồ chơi, học liệu sử dụng được', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('d776cb41-0d64-5695-b99f-44509a65842a', 'e5f3069c-905a-5535-a0b8-b01733b18e4f', '4.2', 'Môi trường giáo dục an toàn, sức khỏe và hạnh phúc', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e14c608b-f750-5fcd-bc43-381748b5a099', 'd776cb41-0d64-5695-b99f-44509a65842a', 1, 'Nhà trường có biện pháp bảo đảm an toàn thể chất, sức khỏe, vệ sinh, dinh dưỡng, phòng chống tai nạn, bạo lực, xâm hại và các rủi ro trong hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ. Nhà trường thực hiện quy trình đón, trả trẻ; kiểm soát người ra vào; bảo đảm an toàn bữa ăn, giấc ngủ, hoạt động ngoài trời, đồ chơi, thiết bị và khu vệ sinh; có kênh tiếp nhận phản ánh, quy trình xử lý sự cố, tai nạn, nghi ngờ bạo hành hoặc xâm hại trẻ. Các nguy cơ mất an toàn được phát hiện, ghi nhận, xử lý và theo dõi kết quả khắc phục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('95bb0699-346b-5f79-9d53-45578e2fd2a8', 'd776cb41-0d64-5695-b99f-44509a65842a', 2, 'Nhà trường phân tích dữ liệu sự cố, nguy cơ mất an toàn, phản hồi của cha mẹ trẻ và kết quả kiểm tra để phòng ngừa rủi ro tái diễn, cải thiện môi trường nuôi dưỡng, chăm sóc, giáo dục an toàn, lành mạnh, tích cực. Trẻ được tôn trọng, bảo vệ, hỗ trợ phù hợp; kết quả kiểm tra và phản hồi được sử dụng để điều chỉnh biện pháp phòng ngừa, xử lý và hỗ trợ trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('b223330b-67db-58d8-8c1e-ebbba337f9e2', 'd776cb41-0d64-5695-b99f-44509a65842a', 'Môi trường giáo dục an toàn, sức khỏe và hạnh phúc', 'Bảng kiểm an toàn; hồ sơ sức khỏe; hồ sơ dinh dưỡng; biên bản kiểm tra; hồ sơ xử lý sự cố nếu có; danh sách nguy cơ mất an toàn; biên bản xử lý, minh chứng khắc phục; hồ sơ thông tin, trao đổi với cha mẹ trẻ khi cần; kế hoạch phòng ngừa; báo cáo hoặc minh chứng cải thiện môi trường giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('83a2df28-1c0e-5e4e-a06e-b6e1e6b01a81', 'd776cb41-0d64-5695-b99f-44509a65842a', 'Số sự cố an toàn trong năm', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('68b51148-82d7-57d8-8ed2-d33f0ebd65e9', 'd776cb41-0d64-5695-b99f-44509a65842a', 'số sự cố đã xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('95f66bf0-5e32-5641-809d-451a14ed930b', 'd776cb41-0d64-5695-b99f-44509a65842a', 'số nguy cơ mất an toàn được phát hiện và khắc phục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('6c4d9652-eff8-5fcf-bd54-31a5f56b8bb3', 'd776cb41-0d64-5695-b99f-44509a65842a', 'tỷ lệ trẻ được theo dõi sức khỏe định kỳ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('2efe913e-5fd8-52f4-b69a-ae72fe3f8850', 'e5f3069c-905a-5535-a0b8-b01733b18e4f', '4.3', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('a0e166f0-4274-5493-a6cc-ca0fc921abca', '2efe913e-5fd8-52f4-b69a-ae72fe3f8850', 1, 'Nhà trường có kênh phối hợp với cha mẹ trẻ, cộng đồng và tổ chức liên quan trong nuôi dưỡng, chăm sóc, giáo dục, bảo đảm an toàn và hỗ trợ trẻ. Hoạt động phối hợp được thực hiện định kỳ hoặc khi cần thiết, có ghi nhận nội dung trao đổi, phản hồi và kết quả xử lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('ba7eed90-70fa-56f9-bdfe-ed1ede4beb0c', '2efe913e-5fd8-52f4-b69a-ae72fe3f8850', 2, 'Nhà trường sử dụng phản hồi và kết quả phối hợp để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục, bảo đảm an toàn và hỗ trợ trẻ. Cơ chế phối hợp hai chiều được duy trì ổn định, minh bạch; nguồn lực huy động hợp pháp và có tác động tích cực đến môi trường nuôi dưỡng, chăm sóc, giáo dục, an toàn hoặc hỗ trợ trẻ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('edc2fa0e-6951-5e5a-af27-6c759d545e3d', '2efe913e-5fd8-52f4-b69a-ae72fe3f8850', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', 'Kế hoạch phối hợp; sổ liên lạc hoặc kênh thông tin; biên bản họp cha mẹ trẻ; hồ sơ phối hợp với y tế, chính quyền, tổ chức liên quan; hồ sơ phản hồi; minh chứng xử lý kiến nghị hoặc phối hợp hỗ trợ trẻ; hồ sơ huy động, tiếp nhận, sử dụng nguồn lực theo quy định.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bo_tieu_chuan (id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, trang_thai)
VALUES ('41a2cbae-7a29-520a-b7d2-966886e65621', '57/2026/TT-BGDĐT', 'Bộ tiêu chuẩn bảo đảm chất lượng giáo dục TT57/2026 - Phụ lục II', DATE '2026-07-07', 'pho_thong', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('a36c64e4-121d-5b6c-9e27-7a9ead75e5cd', '41a2cbae-7a29-520a-b7d2-966886e65621', 1, 'Quản trị nhà trường và bảo đảm chất lượng')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('dc5c18c7-e142-5bdc-90c8-7ee045a6fc76', 'a36c64e4-121d-5b6c-9e27-7a9ead75e5cd', '1.1', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('32007e0a-846d-5b82-87c9-1055fa87851a', 'dc5c18c7-e142-5bdc-90c8-7ee045a6fc76', 1, 'Nhà trường xác định mục tiêu, định hướng phát triển và xây dựng kế hoạch năm học/kế hoạch phát triển phù hợp với cấp học, Chương trình giáo dục phổ thông, quy mô học sinh, điều kiện thực tế của nhà trường và địa phương. Kế hoạch xác định rõ nhiệm vụ trọng tâm, chỉ tiêu chủ yếu, thời hạn thực hiện, phân công trách nhiệm và nguồn lực cần thiết.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('8a8be58e-6259-5eb4-964b-9d3a6273204a', 'dc5c18c7-e142-5bdc-90c8-7ee045a6fc76', 2, 'Nhà trường rà soát, điều chỉnh kế hoạch trên cơ sở kết quả thực hiện, dữ liệu về học sinh, đội ngũ, điều kiện bảo đảm, an toàn trường học và kết quả giáo dục. Việc điều chỉnh có tham khảo ý kiến phù hợp của đội ngũ, học sinh, cha mẹ học sinh và các bên liên quan; có minh chứng về chuyển biến trong thực hiện nhiệm vụ trọng tâm hoặc cải thiện điều kiện bảo đảm chất lượng giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('90671549-334f-52bb-8786-83e10024bc8d', 'dc5c18c7-e142-5bdc-90c8-7ee045a6fc76', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', 'Kế hoạch năm học, kế hoạch giáo dục hoặc kế hoạch phát triển của nhà trường; mục tiêu, nhiệm vụ trọng tâm và phân công thực hiện; báo cáo rà soát, đánh giá và điều chỉnh kế hoạch.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('0eac27dd-f9e9-55a4-a80b-7b7877c229eb', 'a36c64e4-121d-5b6c-9e27-7a9ead75e5cd', '1.2', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('a5a6bd7a-a6dd-5a9e-b0cb-06323732d3db', '0eac27dd-f9e9-55a4-a80b-7b7877c229eb', 1, 'Nhà trường có cơ cấu tổ chức, các tổ chuyên môn, tổ văn phòng/bộ phận hỗ trợ và các hội đồng theo quy định, phù hợp với cấp học, quy mô và điều kiện thực tế. Nhiệm vụ của cán bộ quản lý cơ sở giáo dục, giáo viên, giáo viên chủ nhiệm, nhân viên và các bộ phận liên quan được phân công rõ người, rõ việc, rõ trách nhiệm và có cơ chế phối hợp trong thực hiện nhiệm vụ giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('f17d2314-8842-51d5-98bf-a33450738c95', '0eac27dd-f9e9-55a4-a80b-7b7877c229eb', 2, 'Nhà trường định kỳ rà soát cơ cấu tổ chức, phân công nhiệm vụ và hiệu quả phối hợp nội bộ; kịp thời điều chỉnh những nội dung chồng chéo, bỏ sót hoặc chưa phù hợp. Việc điều chỉnh góp phần nâng cao hiệu quả quản trị, thực hiện chương trình giáo dục, hỗ trợ học sinh và bảo đảm an toàn trường học.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('b5f6341c-0fce-50a7-ac7d-ac8f6738db02', '0eac27dd-f9e9-55a4-a80b-7b7877c229eb', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', 'Sơ đồ tổ chức; quyết định thành lập hoặc kiện toàn các tổ chức theo quy định; quy chế làm việc hoặc bảng phân công nhiệm vụ; hồ sơ rà soát, điều chỉnh phân công khi có phát sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('6c79c569-481c-5030-b182-73ef86b7dc81', 'a36c64e4-121d-5b6c-9e27-7a9ead75e5cd', '1.3', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('31500ad7-c1e1-5b27-9653-da8bc6822418', '6c79c569-481c-5030-b182-73ef86b7dc81', 1, 'Nhà trường có hồ sơ, thông tin và dữ liệu thiết yếu phục vụ quản lý hoạt động giáo dục, bao gồm dữ liệu về học sinh, đội ngũ, lớp học, khối lớp, chương trình giáo dục, cơ sở vật chất, thiết bị dạy học, tài chính, chuyên cần, an toàn và kết quả giáo dục. Hồ sơ, thông tin và dữ liệu được cập nhật, lưu trữ, quản lý, đối chiếu và sử dụng theo quy định, bảo đảm đầy đủ, đúng thời hạn, an toàn, bảo mật và phục vụ công tác điều hành của nhà trường.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b5980501-8614-5082-a0aa-37bccc3739ac', '6c79c569-481c-5030-b182-73ef86b7dc81', 2, 'Nhà trường rà soát, đối chiếu, tổng hợp và phân tích dữ liệu để đánh giá thực trạng, dự báo nhu cầu, điều chỉnh kế hoạch, phân bổ nguồn lực, tổ chức lớp học, bồi dưỡng đội ngũ, hỗ trợ học sinh và cải thiện điều kiện giáo dục. Dữ liệu được theo dõi, so sánh theo chu kỳ phù hợp; được sử dụng làm căn cứ cho các quyết định quản lý, tự đánh giá, cải tiến chất lượng và công khai theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('d5599be8-f972-5900-a1fd-f1919fdb512e', '6c79c569-481c-5030-b182-73ef86b7dc81', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', 'Hồ sơ, dữ liệu về học sinh, đội ngũ, lớp học, chương trình giáo dục, cơ sở vật chất, thiết bị, tài chính và kết quả giáo dục; minh chứng cập nhật, quản lý, sử dụng, phân quyền và bảo mật dữ liệu; báo cáo hoặc tài liệu sử dụng dữ liệu phục vụ công tác quản lý, điều hành.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('791fc515-64dc-5d9d-bee9-a93ce0e45041', '6c79c569-481c-5030-b182-73ef86b7dc81', 'Tỷ lệ hồ sơ, dữ liệu quản lý được cập nhật đầy đủ, đúng hạn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('688ea464-6f46-5ad0-9708-391239cab33c', '6c79c569-481c-5030-b182-73ef86b7dc81', 'số sai lệch dữ liệu được phát hiện và xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('ff976176-8b38-5005-8b30-fbaef4a6fc82', '6c79c569-481c-5030-b182-73ef86b7dc81', 'số nội dung quản lý, điều hành được điều chỉnh trên cơ sở dữ liệu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('d3bb52be-271b-59b7-98c9-f9ad2c1d3762', 'a36c64e4-121d-5b6c-9e27-7a9ead75e5cd', '1.4', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('49f297d1-e8d7-5b97-92a5-49299f9fa36f', 'd3bb52be-271b-59b7-98c9-f9ad2c1d3762', 1, 'Nhà trường thực hiện tự kiểm tra, tự đánh giá theo quy định hoặc theo kế hoạch của nhà trường để xác định điểm mạnh, hạn chế, nguyên nhân và nội dung cần cải tiến. Kết quả tự kiểm tra, tự đánh giá được sử dụng để xây dựng hoặc cập nhật kế hoạch cải tiến; thực hiện công khai thông tin và tiếp nhận, xử lý phản hồi theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('77da7f52-1017-57ec-b704-7afd78724ef6', 'd3bb52be-271b-59b7-98c9-f9ad2c1d3762', 2, 'Nhà trường triển khai kế hoạch cải tiến với nhiệm vụ, người phụ trách, thời hạn, nguồn lực và sản phẩm cụ thể; ưu tiên các nội dung cần khắc phục về chương trình giáo dục, đội ngũ, an toàn, hỗ trợ học sinh, dữ liệu và điều kiện bảo đảm chất lượng. Kết quả cải tiến được theo dõi, kiểm chứng bằng minh chứng hoặc dữ liệu phù hợp; được sử dụng để điều chỉnh hoạt động quản lý, dạy học, giáo dục, hỗ trợ học sinh và điều kiện bảo đảm chất lượng trong chu kỳ tiếp theo.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('ecfa657c-a888-5fe6-a01a-3edabe401abe', 'd3bb52be-271b-59b7-98c9-f9ad2c1d3762', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', 'Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến chất lượng; hồ sơ theo dõi thực hiện cải tiến; hồ sơ công khai, giải trình, tiếp nhận và xử lý phản hồi; minh chứng kết quả cải tiến.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('8c4b22ae-a942-5074-808a-7dd92bc279d7', 'd3bb52be-271b-59b7-98c9-f9ad2c1d3762', 'Số nhiệm vụ cải tiến hoàn thành/tổng số nhiệm vụ cải tiến theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('dded211b-356e-56a9-aaea-d0f11b8cdca5', 'd3bb52be-271b-59b7-98c9-f9ad2c1d3762', 'số phản hồi được tiếp nhận, xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('63f31e71-da18-5414-a4e0-9d91e194cef4', '41a2cbae-7a29-520a-b7d2-966886e65621', 2, 'Phát triển đội ngũ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('40a45949-c7fc-5e9d-a79b-5f1c0200c16b', '63f31e71-da18-5414-a4e0-9d91e194cef4', '2.1', 'Cán bộ quản lý cơ sở giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('19dd4276-5493-5c7b-adaf-3dc71b7c10b9', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 1, 'Nhà trường có cán bộ quản lý cơ sở giáo dục theo quy định; cán bộ quản lý cơ sở giáo dục được bổ nhiệm, phân công nhiệm vụ phù hợp với vị trí việc làm và đáp ứng tiêu chuẩn chức danh. Cán bộ quản lý cơ sở giáo dục thực hiện nhiệm vụ chỉ đạo, điều hành đối với chương trình giáo dục, đội ngũ, học sinh, tài chính, tài sản, an toàn trường học, quản lý hồ sơ, dữ liệu và bảo đảm chất lượng giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('7431d91c-590f-56c5-82d6-7b631d9da690', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 2, 'Cán bộ quản lý cơ sở giáo dục sử dụng dữ liệu, kết quả tự đánh giá, kiểm tra nội bộ và phản hồi phù hợp của đội ngũ, học sinh, cha mẹ học sinh để điều chỉnh kế hoạch, phân công nhiệm vụ và cải tiến hoạt động của nhà trường. Công tác quản trị, chỉ đạo, điều hành có chuyển biến tích cực; các hạn chế, tồn tại được phát hiện và có biện pháp khắc phục, góp phần nâng cao hiệu quả thực hiện chương trình giáo dục, phát triển đội ngũ, hỗ trợ học sinh và bảo đảm an toàn trường học.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('4fc760c2-5521-54ad-8902-98e5bd54ef4d', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 'Cán bộ quản lý cơ sở giáo dục', 'Hồ sơ bổ nhiệm, phân công nhiệm vụ cán bộ quản lý cơ sở giáo dục; hồ sơ tiêu chuẩn chức danh, đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4bdb4f23-5099-5954-862d-eb2c0e34cd4e', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 'Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('bdffbfc7-471d-55be-b189-6be4d71af046', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 'tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('f1eb8749-e1c5-5e59-8456-6e0cbfd7e980', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 'tỷ lệ cán bộ quản lý cơ sở giáo dục hoàn thành nhiệm vụ trở lên', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('efaa9c8a-6bca-549b-8b68-0caaef0476cb', '40a45949-c7fc-5e9d-a79b-5f1c0200c16b', 'số nội dung quản lý được cải tiến trên cơ sở kết quả kiểm tra, tự đánh giá', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('186939f6-3c83-5b3c-986a-d016599ec44d', '63f31e71-da18-5414-a4e0-9d91e194cef4', '2.2', 'Giáo viên', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('c7bde981-9191-57c0-ad5b-2eae4dd83465', '186939f6-3c83-5b3c-986a-d016599ec44d', 1, 'Nhà trường có đội ngũ giáo viên đáp ứng yêu cầu thực hiện Chương trình giáo dục phổ thông về số lượng, cơ cấu môn học và hoạt động giáo dục, trình độ đào tạo, phẩm chất, đạo đức nghề nghiệp và chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh theo quy định. Giáo viên được phân công nhiệm vụ phù hợp với chuyên môn, năng lực và điều kiện thực tế; thực hiện kế hoạch giáo dục, kế hoạch bài dạy, đánh giá học sinh, sinh hoạt chuyên môn và bồi dưỡng theo quy định hoặc kế hoạch của nhà trường.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('c0de1e7f-70c0-552a-a3d3-7b0bc8810a7f', '186939f6-3c83-5b3c-986a-d016599ec44d', 2, 'Nhà trường theo dõi, rà soát tình hình đội ngũ giáo viên để điều chỉnh phân công, bồi dưỡng, hỗ trợ chuyên môn; duy trì hoặc nâng cao mức độ đáp ứng về số lượng, cơ cấu, trình độ đào tạo và chuẩn nghề nghiệp của giáo viên. Giáo viên vận dụng kết quả bồi dưỡng, sinh hoạt chuyên môn, kết quả đánh giá học sinh, sản phẩm học tập và phản hồi phù hợp để điều chỉnh phương pháp dạy học, giáo dục, hỗ trợ học sinh và nâng cao hiệu quả thực hiện Chương trình giáo dục phổ thông.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('13e32783-f66b-54e9-a9ee-caaac9732c56', '186939f6-3c83-5b3c-986a-d016599ec44d', 'Giáo viên', 'Danh sách giáo viên; hồ sơ trình độ đào tạo, chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh; bảng phân công chuyên môn; hồ sơ sinh hoạt chuyên môn, bồi dưỡng; hồ sơ đánh giá, cải tiến hoạt động dạy học và hỗ trợ học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('2b2f5d97-b10b-560d-9a47-9114bcb53229', '186939f6-3c83-5b3c-986a-d016599ec44d', 'Số giáo viên hiện có so với định mức', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('367ad02f-c1dc-50fd-8b65-036eef375b0d', '186939f6-3c83-5b3c-986a-d016599ec44d', 'số giáo viên thiếu hoặc thừa theo môn học/hoạt động giáo dục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('43f2f9ed-42b0-558f-8290-bba40a914200', '186939f6-3c83-5b3c-986a-d016599ec44d', 'tỷ lệ giáo viên đạt chuẩn trình độ đào tạo', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('19d18b02-748a-5bd0-a00b-ed3c5b0b2769', '186939f6-3c83-5b3c-986a-d016599ec44d', 'tỷ lệ giáo viên được phân công phù hợp chuyên môn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('d4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', '63f31e71-da18-5414-a4e0-9d91e194cef4', '2.3', 'Nhân sự hỗ trợ giáo dục', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('1fcc3703-e124-5f37-8ef4-e195b0a0852c', 'd4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', 1, 'Nhà trường bố trí nhân sự hỗ trợ giáo dục theo quy định hoặc có phương án phân công, kiêm nhiệm, hợp đồng, phối hợp để thực hiện các nhiệm vụ thiết yếu về y tế, thư viện, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn và hỗ trợ học sinh. Việc bố trí nhân sự hỗ trợ phù hợp với cấp học, quy mô, điều kiện thực tế của nhà trường; nhiệm vụ của từng vị trí hoặc bộ phận hỗ trợ được phân công cụ thể.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('dcdc235e-ee43-53cd-b153-221def3b7840', 'd4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', 2, 'Nhà trường theo dõi, rà soát chất lượng hoạt động hỗ trợ giáo dục; kịp thời phát hiện khó khăn, hạn chế hoặc rủi ro về sức khỏe, an toàn, thiết bị, học liệu, công nghệ thông tin, hành chính, tài chính, tư vấn và hỗ trợ học sinh để có biện pháp điều chỉnh. Hoạt động hỗ trợ giáo dục được cải thiện, góp phần phục vụ tốt hơn hoạt động dạy học, giáo dục, chăm sóc sức khỏe, bảo đảm an toàn và hỗ trợ học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('1ea53442-17db-5500-a598-0baef593791b', 'd4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', 'Nhân viên (nhân sự hỗ trợ hoạt động giáo dục)', 'Danh sách nhân sự hỗ trợ; phân công nhiệm vụ; hồ sơ thực hiện nhiệm vụ về y tế, thư viện, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn và hỗ trợ học sinh; hồ sơ rà soát, điều chỉnh hoạt động hỗ trợ khi có sự thay đổi.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('d5ad7936-0ec0-56c5-b3a4-3a2b88e4bbd9', 'd4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', 'Số vị trí nhân sự hỗ trợ hiện có so với tổng số vị trí theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('ec292e6c-7967-5627-81bb-47f6a0791cf5', 'd4e9e1fa-eb2b-5a5f-b0b7-69a740de1ca8', 'tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('b55913cf-6a8e-5d31-a481-f612813f805b', '41a2cbae-7a29-520a-b7d2-966886e65621', 3, 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển học sinh')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('751b750b-591e-57df-a877-0df48618a22f', 'b55913cf-6a8e-5d31-a481-f612813f805b', '3.1', 'Tổ chức thực hiện chương trình giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('05146000-0342-5f05-9a82-661d406fb3a9', '751b750b-591e-57df-a877-0df48618a22f', 1, 'Nhà trường xây dựng và thực hiện kế hoạch giáo dục theo Chương trình giáo dục phổ thông theo năm học, học kỳ, tháng/tuần; phù hợp với cấp học, đối tượng học sinh, điều kiện thực tế của nhà trường và địa phương. Việc tổ chức dạy học, giáo dục, hoạt động trải nghiệm, hướng nghiệp nếu có, kiểm tra và đánh giá học sinh được thực hiện đầy đủ, đúng quy định; có theo dõi tiến độ thực hiện chương trình, bảo đảm nội dung, thời lượng, môn học và hoạt động giáo dục theo kế hoạch.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b0a51aae-37e4-5078-85c6-57c48fa55147', '751b750b-591e-57df-a877-0df48618a22f', 2, 'Nhà trường sử dụng kết quả theo dõi tiến độ chương trình, dữ liệu chuyên cần, kết quả đánh giá học sinh, sinh hoạt chuyên môn và phản hồi phù hợp của học sinh, cha mẹ học sinh để rà soát, điều chỉnh kế hoạch giáo dục, tổ chức dạy học, giáo dục và hỗ trợ học sinh. Việc thực hiện chương trình giáo dục được điều chỉnh kịp thời, linh hoạt, phù hợp hơn với bối cảnh địa phương, điều kiện nhà trường và nhu cầu học sinh; có minh chứng về kết quả cải tiến trong tổ chức thực hiện chương trình, học tập, rèn luyện hoặc phát triển của học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('fd73b8c2-edee-579b-9730-8634913c4cb2', '751b750b-591e-57df-a877-0df48618a22f', 'Tổ chức thực hiện chương trình giáo dục', 'Kế hoạch giáo dục nhà trường; kế hoạch dạy học môn học/hoạt động giáo dục; thời khóa biểu, sổ đầu bài hoặc hồ sơ chuyên môn; hồ sơ kiểm tra, đánh giá; minh chứng theo dõi, điều chỉnh tiến độ thực hiện chương trình.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('afebe35b-ec10-534a-8dc1-e4d251060e59', '751b750b-591e-57df-a877-0df48618a22f', 'Tỷ lệ lớp thực hiện đúng tiến độ chương trình', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('7953e55b-3c7d-5906-8a95-839be56481e0', '751b750b-591e-57df-a877-0df48618a22f', 'tỷ lệ môn học/hoạt động giáo dục hoàn thành theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('fd753f53-67ca-5ecb-a85c-e40dc72615fa', '751b750b-591e-57df-a877-0df48618a22f', 'tỷ lệ chuyên cần của học sinh', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('f9cea025-f398-5c36-b793-e8713606c729', '751b750b-591e-57df-a877-0df48618a22f', 'số buổi dạy bù, học bù hoặc điều chỉnh kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('b09ee348-3a4c-5afc-9198-9010b7d9a651', 'b55913cf-6a8e-5d31-a481-f612813f805b', '3.2', 'Đổi mới phương pháp giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của học sinh', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('30f46516-3dd2-56dc-b4c1-b3b433ca722f', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 1, 'Nhà trường tổ chức dạy học, giáo dục và đánh giá học sinh phù hợp với mục tiêu Chương trình giáo dục phổ thông, cấp học, đối tượng học sinh và điều kiện thực tế. Giáo viên xây dựng kế hoạch bài dạy; lựa chọn phương pháp dạy học, giáo dục và hình thức kiểm tra, đánh giá phù hợp; theo dõi sự phát triển, tiến bộ của học sinh; tham gia sinh hoạt chuyên môn, dự giờ và bồi dưỡng chuyên môn theo quy định hoặc kế hoạch của nhà trường.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('34c06624-1398-5911-896f-d491c998e184', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 2, 'Nhà trường sử dụng kết quả đánh giá học sinh, sản phẩm học tập, kết quả sinh hoạt chuyên môn, phản hồi phù hợp của học sinh, cha mẹ học sinh và sự tiến bộ của học sinh để điều chỉnh phương pháp dạy học, giáo dục và biện pháp hỗ trợ học sinh. Giáo viên thực hiện các phương pháp dạy học phát triển phẩm chất, năng lực; hỗ trợ phù hợp với nhu cầu của học sinh, tôn trọng sự khác biệt và bảo đảm môi trường học tập an toàn, tích cực. Các giải pháp đổi mới được theo dõi, đánh giá, rút kinh nghiệm, duy trì hoặc chia sẻ phù hợp; có minh chứng về kết quả hoặc tác động tích cực đối với sự phát triển và tiến bộ của học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('251b4e22-b21a-5040-9a17-f908aae6d508', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 'Đổi mới phương pháp giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của học sinh', 'Kế hoạch bài dạy; hồ sơ chuyên môn; hồ sơ đánh giá học sinh; biên bản sinh hoạt chuyên môn, dự giờ; sản phẩm học tập; minh chứng điều chỉnh phương pháp dạy học, giáo dục và hỗ trợ học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('0020088a-6ede-5746-a20a-cd61a7697085', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 'Tỷ lệ học sinh đạt yêu cầu đánh giá theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('5433cb9b-8563-5d24-bc87-3aa24595b85b', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 'số học sinh có tiến bộ qua từng giai đoạn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4ba4dee7-51b5-5afb-8418-89be088c3642', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 'số học sinh cần hỗ trợ được theo dõi, hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('aa9a215a-1738-5735-bfbc-97d18e256ba3', 'b09ee348-3a4c-5afc-9198-9010b7d9a651', 'số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp, đánh giá học sinh', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('02a9aed8-1705-5139-be9a-744abe418e1f', 'b55913cf-6a8e-5d31-a481-f612813f805b', '3.3', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('95adec97-438d-5c80-8b43-3f6eda15896b', '02a9aed8-1705-5139-be9a-744abe418e1f', 1, 'Nhà trường xây dựng và tổ chức các hoạt động giáo dục phát triển toàn diện học sinh phù hợp với Chương trình giáo dục phổ thông, cấp học, điều kiện thực tế và nhu cầu của học sinh. Các hoạt động được thực hiện theo kế hoạch, gắn với mục tiêu phát triển phẩm chất, năng lực, kỹ năng sống, hoạt động trải nghiệm, hướng nghiệp nếu có, giáo dục văn hóa, thể chất, thẩm mỹ và các nội dung giáo dục phù hợp khác.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b96a12ef-d2bb-5870-bd76-4bcea2b8a5c3', '02a9aed8-1705-5139-be9a-744abe418e1f', 2, 'Nhà trường theo dõi mức độ tham gia, kết quả, sản phẩm và phản hồi để điều chỉnh nội dung, hình thức tổ chức hoạt động giáo dục. Các hoạt động giáo dục được cải thiện theo hướng tăng tính trải nghiệm, sáng tạo, tích hợp, gắn với khoa học, công nghệ, đổi mới sáng tạo và thực tiễn; tăng cường kết nối học tập với gia đình, cộng đồng hoặc các tổ chức liên quan khi phù hợp; có minh chứng về kết quả hoặc tác động tích cực đối với sự phát triển toàn diện của học sinh. Số lượng, tần suất hoặc tỷ lệ tham gia hoạt động được xác định theo kế hoạch giáo dục của nhà trường hoặc hướng dẫn của cơ quan quản lý, phù hợp với loại hình, quy mô và điều kiện thực tế của cơ sở giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('69efb5da-1b46-5ea7-9c71-334306a4ed7b', '02a9aed8-1705-5139-be9a-744abe418e1f', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', 'Kế hoạch hoạt động giáo dục; hoạt động trải nghiệm, hướng nghiệp; hoạt động thể thao, văn nghệ, kỹ năng sống; hoạt động, dự án giáo dục STEM hoặc STEAM; sản phẩm học sinh; minh chứng phối hợp với gia đình, cộng đồng.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('bd2e97a0-d0c8-5f58-90b4-6022aef9ec56', '02a9aed8-1705-5139-be9a-744abe418e1f', 'Số hoạt động giáo dục được tổ chức trong năm', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('13486ca9-044c-5a65-80a2-ab2b2a17259b', '02a9aed8-1705-5139-be9a-744abe418e1f', 'tỷ lệ học sinh tham gia các hoạt động giáo dục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('fe2cd06f-c136-54f1-821b-5b82c73ab5d2', 'b55913cf-6a8e-5d31-a481-f612813f805b', '3.4', 'Quản lý, theo dõi, hỗ trợ học sinh và giáo dục hòa nhập', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('a7add0ab-90c1-529e-be28-64c2bfdbec7d', 'fe2cd06f-c136-54f1-821b-5b82c73ab5d2', 1, 'Nhà trường thực hiện tuyển sinh, tiếp nhận, quản lý hồ sơ học sinh và cập nhật thông tin về chuyên cần, học tập, rèn luyện, sức khỏe, an toàn, chuyển trường, nghỉ học kéo dài và nhu cầu hỗ trợ của học sinh theo quy định, bao gồm nhu cầu tư vấn học đường, hỗ trợ tâm lý hoặc công tác xã hội trường học khi cần. Nhà trường phối hợp với cha mẹ học sinh, giáo viên, nhân sự hỗ trợ, chuyên gia, cơ quan, tổ chức liên quan khi cần để hỗ trợ học sinh khó khăn, học sinh có nhu cầu đặc thù hoặc học sinh có nguy cơ bị bạo lực, bắt nạt, bắt nạt trực tuyến, khủng hoảng tâm lý, nguy cơ bị tổn thương; bảo đảm không phân biệt đối xử, tôn trọng, an toàn và bảo mật thông tin của học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('d71ffca7-ce4d-56ef-9d6d-db3ba9bfaa9b', 'fe2cd06f-c136-54f1-821b-5b82c73ab5d2', 2, 'Nhà trường sử dụng dữ liệu về chuyên cần, học tập, rèn luyện, sức khỏe, an toàn, tư vấn học đường, hỗ trợ tâm lý, công tác xã hội trường học, phản ánh, thông tin về sự cố và kết quả hỗ trợ để phát hiện sớm học sinh có nguy cơ hoặc cần hỗ trợ. Các biện pháp hỗ trợ được theo dõi, đánh giá và điều chỉnh phù hợp với nhu cầu của học sinh hoặc nhóm học sinh; có phối hợp với cha mẹ học sinh, chuyên gia, cơ quan, tổ chức liên quan khi cần. Kết quả hỗ trợ được sử dụng để xây dựng môi trường giáo dục hòa nhập, an toàn, tôn trọng sự khác biệt, bảo vệ học sinh và phòng ngừa rủi ro đối với học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('851dc07d-036a-5602-b8d4-1bcfe70c1404', 'fe2cd06f-c136-54f1-821b-5b82c73ab5d2', 'Quản lý, theo dõi, hỗ trợ học sinh và giáo dục hòa nhập', 'Hồ sơ học sinh; dữ liệu chuyên cần, học tập, rèn luyện, sức khỏe và an toàn; danh sách học sinh cần hỗ trợ; kế hoạch và hồ sơ hỗ trợ cá nhân hoặc nhóm; hồ sơ tư vấn học đường, hỗ trợ tâm lý; minh chứng phối hợp với cha mẹ học sinh và các tổ chức liên quan khi cần thiết.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('a96370f2-32ef-5fa4-9f87-027b3055e85f', 'b55913cf-6a8e-5d31-a481-f612813f805b', '3.5', 'Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của học sinh', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('52293170-60ac-5ab8-a54f-19487444d760', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 1, 'Nhà trường thực hiện đánh giá, ghi nhận và quản lý kết quả học tập, rèn luyện, phẩm chất, năng lực và sự tiến bộ của học sinh theo quy định; theo dõi mức độ đạt yêu cầu về học tập, rèn luyện và phát triển của học sinh theo cấp học. Kết quả được theo dõi theo lớp, khối lớp, môn học/hoạt động giáo dục và nhóm học sinh khi cần; được sử dụng để trao đổi với học sinh, cha mẹ học sinh và điều chỉnh hoạt động dạy học, giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('1a2fa828-78f7-565a-abe0-520929163a69', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 2, 'Nhà trường phân tích kết quả học tập, rèn luyện, chuyên cần, sự tiến bộ, sản phẩm học tập, phản hồi phù hợp, kết quả hỗ trợ và nhu cầu của học sinh để điều chỉnh kế hoạch giáo dục, phương pháp dạy học, kiểm tra, đánh giá và biện pháp hỗ trợ. Kết quả theo dõi cho thấy sự tiến bộ của học sinh, sự cải thiện về kết quả học tập, rèn luyện hoặc hiệu quả hỗ trợ đối với học sinh cần hỗ trợ. Việc xem xét kết quả chú trọng đánh giá vì sự tiến bộ của học sinh, không yêu cầu mọi trường phải cao hơn mức trung bình của địa phương.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('9181eba6-c596-5e1b-a614-7f71514d60c1', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 'Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của học sinh', 'Hồ sơ đánh giá học sinh; bảng tổng hợp kết quả học tập, rèn luyện theo lớp, khối, môn học/hoạt động giáo dục; hồ sơ chuyên cần; danh sách học sinh chưa đạt hoặc cần hỗ trợ; hồ sơ điều chỉnh dạy học và hỗ trợ sau đánh giá.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('39216e20-b176-5a13-a680-b0247082fad6', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 'Tỷ lệ học sinh đạt yêu cầu theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('23a3b985-5d18-5c21-a723-20c6ae15493b', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 'tỷ lệ học sinh hoàn thành chương trình/lớp học/cấp học (khi áp dụng)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('482e0c86-e9b1-5641-9c72-79f2b86d9bc2', 'a96370f2-32ef-5fa4-9f87-027b3055e85f', 'số học sinh chưa đạt hoặc cần hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('bdf9d97f-4520-5b73-b2be-5cc799e48774', '41a2cbae-7a29-520a-b7d2-966886e65621', 4, 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'bdf9d97f-4520-5b73-b2be-5cc799e48774', '4.1', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e274d1b7-823b-50df-abcc-a8f93f135df4', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 1, 'Nhà trường có cơ sở vật chất, phòng học, phòng chức năng nếu có, thiết bị dạy học, học liệu, thư viện hoặc nguồn học liệu, khu vệ sinh, sân chơi/bãi tập, hạ tầng công nghệ thông tin và kết nối mạng phục vụ hoạt động quản lý, dạy học, giáo dục theo quy định, phù hợp với cấp học, Chương trình giáo dục phổ thông và điều kiện thực tế. Các điều kiện này được quản lý, sử dụng, bảo trì, bảo quản và rà soát định kỳ để bảo đảm an toàn, hiệu quả và đáp ứng yêu cầu tổ chức hoạt động giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('8d8e0e6c-0b29-5987-8ec0-45596070ab0b', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 2, 'Nhà trường sử dụng dữ liệu về tình trạng cơ sở vật chất, thiết bị dạy học, học liệu, thư viện, hạ tầng công nghệ thông tin, kết nối mạng và nhu cầu dạy học để lập kế hoạch sửa chữa, bảo trì, bổ sung, sắp xếp hoặc khai thác hiệu quả hơn. Nhà trường từng bước phát triển, sử dụng học liệu số, thiết bị công nghệ, công cụ số hoặc nền tảng hỗ trợ dạy học phù hợp với điều kiện thực tế; không áp dụng cứng các mô hình phòng học thông minh, thiết bị thông minh hoặc không gian học tập số như điều kiện tối thiểu đối với mọi trường. Việc cải thiện điều kiện giáo dục góp phần tạo môi trường học tập an toàn, thân thiện, linh hoạt, hòa nhập và hỗ trợ tốt hơn cho hoạt động dạy học, giáo dục.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('754a88a7-4c11-5189-96cc-82c4e823dc4f', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục', 'Hồ sơ phòng học, phòng chức năng; danh mục cơ sở vật chất, thiết bị dạy học, học liệu, thư viện; hồ sơ hạ tầng công nghệ thông tin, kết nối mạng; hồ sơ kiểm kê, bảo trì, sửa chữa, bổ sung; minh chứng khai thác thiết bị, học liệu và học liệu số.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('467c1bfd-99b0-5792-a60c-beac786b6e2b', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'Số phòng học đạt yêu cầu so với tổng số phòng học', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('33843e05-6823-5f09-865f-ffc48b11fea3', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'số phòng chức năng hoặc không gian học tập đáp ứng yêu cầu khi áp dụng', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('e479d34f-2938-5c0a-b7e8-cae171a4837c', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'số hạng mục cơ sở vật chất thiếu, xuống cấp hoặc cần sửa chữa', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('e6102c03-9819-5368-9719-85190a8e50f3', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'tỷ lệ thiết bị dạy học sử dụng được so với tổng số thiết bị', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a20c52b8-61c8-5087-9134-b156c25bd7e8', '90f3ab94-75b8-5d5f-9056-6c096d3504fc', 'tỷ lệ lớp học bảo đảm sĩ số theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('d9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'bdf9d97f-4520-5b73-b2be-5cc799e48774', '4.2', 'Môi trường giáo dục an toàn, tích cực, hỗ trợ phát triển học sinh', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('8404283f-1ea3-5a82-a15f-5ff4e822f11c', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 1, 'Nhà trường bảo đảm các điều kiện tối thiểu về vệ sinh, nước sạch, khu vệ sinh, ánh sáng, thông gió, sân chơi/bãi tập, an toàn thiết bị, phòng cháy chữa cháy, an toàn thực phẩm nếu có, an toàn số và bảo mật thông tin học sinh. Nhà trường thực hiện chăm sóc sức khỏe, phòng ngừa bạo lực học đường, xâm hại, bắt nạt, bắt nạt trực tuyến, tai nạn thương tích, khủng hoảng tâm lý và các rủi ro ảnh hưởng đến an toàn, sức khỏe, tinh thần của học sinh; có hồ sơ kiểm soát điều kiện an toàn, kiểm tra định kỳ, kênh tiếp nhận phản ánh, quy trình xử lý sự cố, hồ sơ xử lý sự cố và phối hợp với gia đình, cơ quan, tổ chức liên quan khi cần. Việc tiếp nhận, xử lý, hỗ trợ học sinh bảo đảm nguyên tắc bảo mật thông tin, tôn trọng, không kỳ thị và bảo vệ học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b80c789f-14fa-5c8f-8406-b01378804541', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 2, 'Nhà trường phân tích dữ liệu về sức khỏe, an toàn, sự cố, phản ánh, khảo sát hoặc phản hồi phù hợp của học sinh, cha mẹ học sinh và đội ngũ để nhận diện nguy cơ, cải thiện môi trường giáo dục và giảm rủi ro. Việc khảo sát phản hồi, an toàn hoặc hài lòng nếu được thực hiện phải phù hợp với lứa tuổi học sinh, bảo đảm khách quan, bảo mật thông tin và không gây áp lực cho người trả lời. Nhà trường xây dựng nền nếp bảo đảm an toàn, chăm sóc sức khỏe, phòng ngừa bạo lực học đường, xâm hại, bắt nạt, bắt nạt trực tuyến, rủi ro trên môi trường số và hỗ trợ sức khỏe tinh thần của học sinh. Học sinh được tôn trọng, lắng nghe, bảo vệ, hỗ trợ phù hợp và tham gia xây dựng môi trường giáo dục an toàn, tích cực, hòa nhập. Nhà trường theo dõi kết quả sau khắc phục, sử dụng dữ liệu và phản hồi để điều chỉnh biện pháp phòng ngừa, xử lý, hỗ trợ và phòng ngừa tái diễn.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('caae7629-7c2f-5b81-b720-6d990ea890c3', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'Môi trường giáo dục an toàn, tích cực, hỗ trợ phát triển học sinh', 'Hồ sơ vệ sinh, an toàn trường học; hồ sơ y tế học đường; bảng kiểm an toàn, phòng cháy chữa cháy, an toàn thực phẩm nếu có; kênh tiếp nhận phản ánh; hồ sơ xử lý sự cố, bạo lực, bắt nạt, an toàn số; hồ sơ hỗ trợ tâm lý, bảo mật thông tin học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('791f61d3-6947-55e6-ae79-84043a71cd82', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'Số sự cố an toàn trường học được ghi nhận', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a34f8697-ddb3-5097-bba9-2bc4f0cbebee', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'số sự cố được xử lý theo quy trình', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('ab169ab7-c50c-5717-a0d2-35438920d139', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'số trường hợp bạo lực, bắt nạt, xâm hại hoặc nguy cơ mất an toàn được xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('6ca38466-c99c-5767-898f-6eceb9518794', 'd9ea56bb-bed8-5b01-ae8e-6149d2ee8aaa', 'số học sinh được hỗ trợ về sức khỏe, tâm lý hoặc an toàn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('7525c278-848c-5c1b-817a-05ba8bacd11c', 'bdf9d97f-4520-5b73-b2be-5cc799e48774', '4.3', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e7df2568-277f-5cef-9d48-528b4e9dbe9d', '7525c278-848c-5c1b-817a-05ba8bacd11c', 1, 'Nhà trường duy trì kênh thông tin hai chiều với cha mẹ học sinh hoặc người giám hộ; thông báo kịp thời về chuyên cần, kết quả học tập, rèn luyện, sự tiến bộ, sức khỏe, an toàn và nhu cầu hỗ trợ của học sinh. Nhà trường tiếp nhận, phân loại, xử lý phản hồi theo phạm vi trách nhiệm; có kế hoạch hoặc chương trình phối hợp với gia đình, chính quyền, y tế, công an, cơ sở giáo dục nghề nghiệp, doanh nghiệp, tổ chức xã hội và các bên liên quan để chăm sóc sức khỏe, bảo đảm an toàn, giáo dục kỹ năng, hướng nghiệp, phân luồng, hỗ trợ học sinh và huy động nguồn lực hợp pháp theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('f6d741da-3799-51ee-9c37-7c4c8c187a8d', '7525c278-848c-5c1b-817a-05ba8bacd11c', 2, 'Nhà trường sử dụng phản hồi của cha mẹ học sinh, dữ liệu chuyên cần, kết quả học tập, rèn luyện, sức khỏe, an toàn và hồ sơ hỗ trợ học sinh để điều chỉnh hoạt động phối hợp với gia đình, cộng đồng và tổ chức liên quan. Cha mẹ học sinh tham gia phù hợp vào hoạt động giáo dục, bảo vệ an toàn, hướng nghiệp khi phù hợp và hỗ trợ học sinh. Nhà trường đánh giá hiệu quả phối hợp; sử dụng kết quả phối hợp để cải thiện chăm sóc sức khỏe, bảo đảm an toàn, giáo dục kỹ năng, hướng nghiệp, phân luồng, giáo dục hòa nhập, năng lực số, đổi mới sáng tạo khi phù hợp và môi trường giáo dục. Nguồn lực huy động được quản lý, sử dụng minh bạch, hợp pháp và có tác động tích cực đến an toàn, sự tiến bộ và phát triển của học sinh.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('4953711f-14af-53bf-a460-3faa179b1ae7', '7525c278-848c-5c1b-817a-05ba8bacd11c', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', 'Sổ liên lạc hoặc kênh thông tin điện tử; hồ sơ trao đổi hai chiều với cha mẹ học sinh; biên bản họp cha mẹ học sinh; hồ sơ phối hợp với chính quyền, y tế, công an, tổ chức xã hội, cơ sở giáo dục nghề nghiệp, doanh nghiệp khi phù hợp; hồ sơ huy động, quản lý và sử dụng nguồn lực theo quy định.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bo_tieu_chuan (id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, trang_thai)
VALUES ('9d8a7ec9-8253-558b-b3ee-cb5229f99b9e', '57/2026/TT-BGDĐT', 'Bộ tiêu chuẩn bảo đảm chất lượng giáo dục TT57/2026 - Phụ lục III', DATE '2026-07-07', 'gdtx', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('5652d8f5-40ae-57b6-bc08-06f22007723a', '9d8a7ec9-8253-558b-b3ee-cb5229f99b9e', 1, 'Quản trị nhà trường và bảo đảm chất lượng')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('18eff54e-f3e6-5f05-a4ed-383bd963c724', '5652d8f5-40ae-57b6-bc08-06f22007723a', '1.1', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('731ad27b-0d35-5229-acfc-aa4938da6067', '18eff54e-f3e6-5f05-a4ed-383bd963c724', 1, 'Xác định mục tiêu, chỉ tiêu, nhiệm vụ và kế hoạch phát triển/kế hoạch năm học phù hợp với nhiệm vụ giáo dục thường xuyên, điều kiện, nhu cầu nhân lực của địa phương, nhu cầu học tập của học viên, người dân và cộng đồng.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('58e3d4ba-42b8-522b-ba81-40bb955f6585', '18eff54e-f3e6-5f05-a4ed-383bd963c724', 2, 'Đạt Mức 1 và có cải tiến thực chất: sử dụng dữ liệu, phản hồi của học viên, đội ngũ, các bên liên quan và kết quả tự đánh giá để rà soát, điều chỉnh mục tiêu, chỉ tiêu, nhiệm vụ, kế hoạch phát triển/năm học; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('231be4b2-a284-57f2-be87-4c007f14e186', '18eff54e-f3e6-5f05-a4ed-383bd963c724', 'Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', 'Kế hoạch năm học; kế hoạch thực hiện từng chương trình giáo dục, khóa học; mục tiêu, chỉ tiêu, nhiệm vụ; quyết định của Giám đốc trung tâm; nghị quyết Hội đồng trường nếu có; biên bản họp lãnh đạo hoặc hội đồng chuyên môn; báo cáo kết quả thực hiện; minh chứng rà soát, điều chỉnh kế hoạch nếu có; minh chứng công khai kế hoạch và kết quả thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('2efac3b7-b140-58d3-a94a-469b32dcac77', '5652d8f5-40ae-57b6-bc08-06f22007723a', '1.2', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4c94269c-fe7f-5e10-852b-a2ab22101b65', '2efac3b7-b140-58d3-a94a-469b32dcac77', 1, 'Đáp ứng yêu cầu tối thiểu và vận hành ổn định: Trung tâm có cơ cấu tổ chức, phân công nhiệm vụ và cơ chế phối hợp nội bộ rõ ràng đối với cán bộ quản lý cơ sở giáo dục, giáo viên, nhân sự hỗ trợ giáo dục, tổ/bộ phận và người phụ trách nhiệm vụ trọng tâm; việc phân công phù hợp với quy mô, chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('e306383b-976c-5743-91a5-33da2afe4e9e', '2efac3b7-b140-58d3-a94a-469b32dcac77', 2, 'Đạt Mức 1 và có cải tiến thực chất: sử dụng dữ liệu, phản hồi của đội ngũ và kết quả tự đánh giá để rà soát, điều chỉnh cơ cấu tổ chức, phân công nhiệm vụ và cơ chế phối hợp nội bộ; các nhiệm vụ trọng tâm được thực hiện ổn định, hạn chế chồng chéo, bỏ sót hoặc quá tải.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('5c4074d5-3606-557a-88a6-ff449e96bf18', '2efac3b7-b140-58d3-a94a-469b32dcac77', 'Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', 'Quyết định thành lập, quy chế tổ chức và hoạt động; sơ đồ tổ chức; phân công nhiệm vụ; hồ sơ giao việc; biên bản họp, phối hợp nội bộ; minh chứng điều chỉnh phân công khi có thay đổi.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('87faee72-5ce3-5a22-9773-90aa5c9b22e3', '5652d8f5-40ae-57b6-bc08-06f22007723a', '1.3', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('84a70da2-0edc-5468-b5e5-39c1047fb5f1', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 1, 'Quản lý kế hoạch, tài chính, cơ sở vật chất, học liệu, nhân lực, hồ sơ học viên; thông tin về lớp, khóa học, tình trạng tham gia học tập, kết quả học tập, rèn luyện và thông tin về an toàn; thực hiện công khai thông tin theo quy định.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('abb43494-a885-5915-b9f6-0a682712b3d5', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 2, 'Đạt Mức 1; sử dụng dữ liệu, hồ sơ điện tử, phần mềm hoặc cơ sở dữ liệu ngành nếu có, phản hồi của các bên liên quan và kết quả tự đánh giá để rà soát, điều chỉnh kế hoạch, nguồn lực, thông tin và dữ liệu; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('e630ddaf-b403-5dcb-89e2-d7e8ee63c7cc', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 'Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu', 'Hồ sơ quản lý học viên; danh sách lớp/khóa học; dữ liệu chuyên cần/tham gia học tập; kết quả học tập, rèn luyện; hồ sơ tài chính, cơ sở vật chất, học liệu và nhân lực; hồ sơ điện tử hoặc phần mềm quản lý nếu có; báo cáo rà soát dữ liệu phục vụ quản lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('b2aef6b5-d3f5-5e47-bd9d-448d754eb360', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 'Tỷ lệ hồ sơ học viên được cập nhật đầy đủ, đúng thời hạn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('bf96e075-1e45-52f4-bee0-c96da58391f7', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 'tỷ lệ lớp/khóa học có dữ liệu tham gia học tập được cập nhật đầy đủ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('3d49fb3c-eac1-5da3-a806-162ed3299b5e', '87faee72-5ce3-5a22-9773-90aa5c9b22e3', 'số sai lệch dữ liệu được phát hiện và xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('b24f3cfb-b8f8-50ef-9d0e-501dced8a176', '5652d8f5-40ae-57b6-bc08-06f22007723a', '1.4', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('ac642c35-f14a-5a3f-beb2-0ba677fe63d5', 'b24f3cfb-b8f8-50ef-9d0e-501dced8a176', 1, 'Thực hiện tự kiểm tra/tự đánh giá, xác định vấn đề cần cải tiến, lập kế hoạch cải tiến, theo dõi kết quả, công khai thông tin và giải trình với cơ quan quản lý, học viên và các bên liên quan; có kênh tiếp nhận phản hồi phù hợp.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('2488009b-f0d1-596f-b7fa-eb9816713536', 'b24f3cfb-b8f8-50ef-9d0e-501dced8a176', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, các bên liên quan và kết quả tự đánh giá để điều chỉnh hoạt động tự đánh giá, cải tiến, công khai và giải trình; có minh chứng về kết quả cải tiến được theo dõi tối thiểu trong 01 chu kỳ, trong đó ưu tiên các nội dung liên quan đến duy trì học tập, hỗ trợ học viên và nâng cao hiệu quả hoạt động giáo dục qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('ee98e0da-ae34-50c0-b367-21caa1fe5bd4', 'b24f3cfb-b8f8-50ef-9d0e-501dced8a176', 'Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình', 'Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến; danh mục nhiệm vụ cải tiến, phân công thực hiện, thời hạn và kết quả; hồ sơ công khai, giải trình; phản hồi của học viên, đội ngũ và bên liên quan; minh chứng kết quả cải tiến.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('09d569da-049d-5d22-8c46-d869dd8b6d9f', 'b24f3cfb-b8f8-50ef-9d0e-501dced8a176', 'Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('0894f055-945a-51dc-8166-2f5a5ad18406', 'b24f3cfb-b8f8-50ef-9d0e-501dced8a176', 'số phản hồi được tiếp nhận, xử lý', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('5d6161f3-2efe-5da7-9c9b-c127428490f3', '9d8a7ec9-8253-558b-b3ee-cb5229f99b9e', 2, 'Phát triển đội ngũ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('4a970d08-0319-5340-893e-47c37aafc590', '5d6161f3-2efe-5da7-9c9b-c127428490f3', '2.1', 'Cán bộ quản lý cơ sở giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('5d02133e-69f0-588a-b959-72f5c4e527e4', '4a970d08-0319-5340-893e-47c37aafc590', 1, 'Cán bộ quản lý cơ sở giáo dục có hồ sơ chức danh/phân công, đánh giá hằng năm, bồi dưỡng/tập huấn theo quy định hoặc kế hoạch; tổ chức quản lý, điều hành hoạt động của trung tâm phù hợp với nhiệm vụ giáo dục thường xuyên, chương trình, hình thức tổ chức hoạt động giáo dục và đặc điểm người học. Có hồ sơ, dữ liệu và phân công thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('804f582b-babf-542c-9cd0-9d7d7ecc2d72', '4a970d08-0319-5340-893e-47c37aafc590', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh quản lý, phát triển đội ngũ và cải tiến hoạt động của trung tâm; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('e313e205-08bf-5284-8f81-c3271dfce4c1', '4a970d08-0319-5340-893e-47c37aafc590', 'Cán bộ quản lý cơ sở giáo dục', 'Hồ sơ giám đốc, phó giám đốc hoặc cán bộ quản lý cơ sở giáo dục; quyết định phân công nhiệm vụ; hồ sơ đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('c926e6d3-0db1-5e45-a300-5c3aef79d948', '4a970d08-0319-5340-893e-47c37aafc590', 'Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('fc029de1-3745-5d35-858f-beafd09f81fd', '4a970d08-0319-5340-893e-47c37aafc590', 'tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('46003c19-a9a9-5350-9424-f4ecd7db8c33', '5d6161f3-2efe-5da7-9c9b-c127428490f3', '2.2', 'Giáo viên', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('0fe88000-3b26-5e32-a7a3-f723c866068b', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 1, 'Giáo viên có hồ sơ đáp ứng yêu cầu về trình độ, chuẩn/chức danh, phân công, kế hoạch dạy học, đánh giá học viên, sinh hoạt chuyên môn và bồi dưỡng phù hợp với chương trình giáo dục thường xuyên; giáo viên cơ hữu, hợp đồng, thỉnh giảng có đủ số lượng theo định mức hoặc phương án được phê duyệt; được phân công phù hợp với chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('01cf4a91-ed5b-5016-9dec-8e51b60d8035', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, kết quả đánh giá và kết quả tự đánh giá để điều chỉnh phương pháp dạy học, kiểm tra, đánh giá, hỗ trợ tự học, học tập linh hoạt và duy trì học tập của học viên; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('a1bb3315-fe05-5f88-9894-bf4469a0051e', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 'Giáo viên', 'Danh sách giáo viên cơ hữu, giáo viên hợp đồng, giáo viên thỉnh giảng hoặc giáo viên tham gia giảng dạy theo hợp đồng liên kết (nếu có); hồ sơ trình độ đào tạo, tiêu chuẩn chức danh nghề nghiệp; phân công giảng dạy; hồ sơ sinh hoạt chuyên môn, bồi dưỡng; hồ sơ kiểm tra, đánh giá kết quả học tập của học viên; minh chứng điều chỉnh hoạt động dạy học và hỗ trợ học viên.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('d3f7df23-35c7-5331-9b89-9fcb06be9365', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 'Số giáo viên hiện có so với nhu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('5ecff762-f568-56fe-aa36-4b04f8cb7722', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 'số giáo viên thiếu hoặc thừa theo môn học/chương trình giáo dục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('277c0148-fc35-537c-9788-58c641bd1cdc', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 'tỷ lệ giáo viên đạt chuẩn trình độ đào tạo hoặc tiêu chuẩn chức danh theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('df8c1878-c8a7-5caa-aa36-e16be7296327', '46003c19-a9a9-5350-9424-f4ecd7db8c33', 'tỷ lệ giáo viên được phân công phù hợp chuyên môn', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('0269f5ba-ce23-521e-9569-b57bd30467bc', '5d6161f3-2efe-5da7-9c9b-c127428490f3', '2.3', 'Nhân sự hỗ trợ giáo dục', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('d5a6a8b2-c960-5260-9f6d-107d1632e0dc', '0269f5ba-ce23-521e-9569-b57bd30467bc', 1, 'Nhân viên, giáo viên hoặc người được phân công, kiêm nhiệm được bố trí để thực hiện nhiệm vụ tư vấn hỗ trợ học tập, hướng nghiệp, tư vấn y tế, thư viện/học liệu, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn/hỗ trợ học viên nếu có, phù hợp với quy định, quy mô và điều kiện thực tế.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('6fbee289-0fff-58a2-9480-112353c48234', '0269f5ba-ce23-521e-9569-b57bd30467bc', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để rà soát, điều chỉnh phân công, phối hợp và bồi dưỡng nhân sự hỗ trợ giáo dục; các nhiệm vụ hỗ trợ học viên, an toàn và vận hành trung tâm được thực hiện ổn định; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('3eae27a9-fe56-57d1-8dba-8257d0fb39ee', '0269f5ba-ce23-521e-9569-b57bd30467bc', 'Nhân sự hỗ trợ giáo dục', 'Danh sách nhân viên hoặc người được giao kiêm nhiệm thực hiện nhiệm vụ hỗ trợ giáo dục; phân công nhiệm vụ học vụ, thư viện hoặc học liệu, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn, hỗ trợ học viên khi có; hồ sơ tập huấn và kết quả thực hiện nhiệm vụ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('89288d46-b62e-57d9-b0df-61ed2bf1706c', '0269f5ba-ce23-521e-9569-b57bd30467bc', 'Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('e1c9d84d-296a-55a0-bdc1-d085ef43bbdd', '0269f5ba-ce23-521e-9569-b57bd30467bc', 'tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('f359728d-1670-5ea1-853f-261df65e396f', '9d8a7ec9-8253-558b-b3ee-cb5229f99b9e', 3, 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('cdda0fa1-7451-5188-9456-f6bd9dddb256', 'f359728d-1670-5ea1-853f-261df65e396f', '3.1', 'Tổ chức thực hiện chương trình giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('cf22f4a5-b8f1-5d9c-bf22-fde41550315e', 'cdda0fa1-7451-5188-9456-f6bd9dddb256', 1, 'Tổ chức thực hiện chương trình/kế hoạch giáo dục theo năm học, học kỳ, tháng/tuần hoặc khóa học; theo dõi tiến độ, tình hình tham gia học tập, kết quả học tập và điều chỉnh khi phát sinh, phù hợp với chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế. Có hồ sơ, dữ liệu và phân công thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('0e6c59ff-58d2-5be7-b0cc-277b1c7a729e', 'cdda0fa1-7451-5188-9456-f6bd9dddb256', 2, 'Đạt Mức 1; sử dụng dữ liệu về tiến độ, tình hình tham gia học tập, kết quả học tập, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để điều chỉnh chương trình/kế hoạch giáo dục, thời khóa biểu hoặc hình thức tổ chức hoạt động giáo dục khi phù hợp; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('b63b1af1-678a-59d8-9e4b-891f44be7bc3', 'cdda0fa1-7451-5188-9456-f6bd9dddb256', 'Tổ chức thực hiện chương trình giáo dục', 'Kế hoạch giáo dục theo năm học, học kỳ, tháng/tuần hoặc khóa học; lịch học/thời khóa biểu; hồ sơ lớp/khóa học; báo cáo tiến độ; hồ sơ điều chỉnh, bù đắp nội dung khi phát sinh; minh chứng thực hiện đầy đủ nội dung chương trình.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('08bacead-2fbd-5f93-b4c9-4d4813c9a5f1', 'cdda0fa1-7451-5188-9456-f6bd9dddb256', 'Tỷ lệ hoàn thành chương trình/kế hoạch giáo dục', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('52ef03ba-945e-59a7-9140-4f33ed856e2e', 'cdda0fa1-7451-5188-9456-f6bd9dddb256', 'tỷ lệ duy trì tiến độ đúng kế hoạch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('e444def0-8d52-5ef6-904f-c858d83114cd', 'f359728d-1670-5ea1-853f-261df65e396f', '3.2', 'Đổi mới phương pháp dạy học và theo dõi, đánh giá sự phát triển, tiến bộ của người học', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('b66e7f12-accc-5ddf-b4f8-3e490bf2e2de', 'e444def0-8d52-5ef6-904f-c858d83114cd', 1, 'Giáo viên áp dụng phương pháp dạy học linh hoạt, phù hợp với đặc điểm người học, điều kiện học tập, chương trình và hình thức tổ chức hoạt động giáo dục; thực hiện kiểm tra, đánh giá kết quả học tập của học viên theo quy định. Kết quả kiểm tra, đánh giá được sử dụng để điều chỉnh dạy học và hỗ trợ học viên duy trì học tập.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('c5c8786a-6c7e-5f46-8c94-c5cd3c70cc4e', 'e444def0-8d52-5ef6-904f-c858d83114cd', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, kết quả kiểm tra, đánh giá và kết quả tự đánh giá để điều chỉnh phương pháp dạy học, hình thức kiểm tra, đánh giá và hoạt động hỗ trợ học viên; ứng dụng công nghệ thông tin, công nghệ số hoặc học liệu phù hợp khi có điều kiện; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('7d6bd1ab-1534-5ec9-812a-f443cd8b0002', 'e444def0-8d52-5ef6-904f-c858d83114cd', 'Đổi mới phương pháp dạy học và kiểm tra, đánh giá người học', 'Kế hoạch bài dạy; hồ sơ dự giờ, sinh hoạt chuyên môn; hồ sơ kiểm tra, đánh giá kết quả học tập của học viên; phản hồi của học viên; minh chứng điều chỉnh phương pháp dạy học, kiểm tra, đánh giá, hỗ trợ tự học, học tập linh hoạt, học tập kết hợp và duy trì học tập.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('15b4c90c-c0f1-5b9b-9eb8-389a427bc8f0', 'e444def0-8d52-5ef6-904f-c858d83114cd', 'Tỷ lệ học viên đạt yêu cầu theo quy định', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('bf677117-671a-577b-ac87-c6442db6af1b', 'e444def0-8d52-5ef6-904f-c858d83114cd', 'số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp dạy học, kiểm tra, đánh giá hoặc hỗ trợ học tập', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('de63cac0-3efd-5ab2-a223-e09b01d1ce35', 'f359728d-1670-5ea1-853f-261df65e396f', '3.3', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('9ba13118-7cff-50dd-8577-caf3acb5d347', 'de63cac0-3efd-5ab2-a223-e09b01d1ce35', 1, 'Tổ chức hoạt động giáo dục bổ trợ về kỹ năng sống, giáo dục công dân, hướng nghiệp/phân luồng, năng lực số, hoạt động cộng đồng, tác phong học tập, tác phong lao động, an toàn hoặc nội dung phù hợp với chương trình và điều kiện học viên.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4c01df7e-330e-5dce-bd32-51e029865c35', 'de63cac0-3efd-5ab2-a223-e09b01d1ce35', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh hoạt động giáo dục bổ trợ, hướng nghiệp, phân luồng, năng lực số hoặc hoạt động cộng đồng; phối hợp với tổ chức, cá nhân liên quan khi phù hợp để nâng cao hiệu quả hoạt động; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('5c883a4b-f8c7-54ab-8efb-47a538027355', 'de63cac0-3efd-5ab2-a223-e09b01d1ce35', 'Tổ chức hoạt động giáo dục và phát triển toàn diện', 'Kế hoạch và hồ sơ hoạt động trải nghiệm, hướng nghiệp, phân luồng, giáo dục kỹ năng sống, năng lực số, học tập suốt đời, hoạt động cộng đồng hoặc nội dung bổ trợ phù hợp; sản phẩm hoạt động, dữ liệu tham gia, phản hồi của học viên.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('b1f35d6e-cf08-502d-80d2-b25162daee2c', 'de63cac0-3efd-5ab2-a223-e09b01d1ce35', 'Số hoạt động giáo dục bổ trợ được tổ chức trong năm học/khóa học', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('6854f244-bdf5-59e1-bf63-e1f201eefc64', 'de63cac0-3efd-5ab2-a223-e09b01d1ce35', 'tỷ lệ học viên tham gia các hoạt động giáo dục bổ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('18425d00-8330-53c4-bf62-4b71b7f1b83f', 'f359728d-1670-5ea1-853f-261df65e396f', '3.4', 'Quản lý, theo dõi, hỗ trợ người học và giáo dục hòa nhập', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('bd60c7c9-919c-56ed-9029-55c1a98ee0f7', '18425d00-8330-53c4-bf62-4b71b7f1b83f', 1, 'Quản lý hồ sơ học viên, theo dõi chuyên cần/tham gia học tập, nhận diện học viên có nguy cơ ngừng học/bỏ học hoặc cần hỗ trợ; thực hiện biện pháp tư vấn, phối hợp hoặc hỗ trợ phù hợp, bảo đảm không phân biệt đối xử.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4cd434b6-a7ab-527d-8220-51320c72f5e1', '18425d00-8330-53c4-bf62-4b71b7f1b83f', 2, 'Đạt Mức 1; sử dụng dữ liệu chuyên cần/tham gia học tập, kết quả học tập, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh biện pháp quản lý, theo dõi, tư vấn, hỗ trợ học viên và giáo dục hòa nhập; có minh chứng kết quả sau hỗ trợ hoặc cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('b0f3330e-ccfd-5c8f-ac94-43635ebda943', '18425d00-8330-53c4-bf62-4b71b7f1b83f', 'Quản lý, theo dõi, hỗ trợ người học và giáo dục hòa nhập', 'Hồ sơ học viên; dữ liệu chuyên cần/tham gia học tập; danh sách học viên cần hỗ trợ, có nguy cơ ngừng học, bỏ học hoặc mất kết nối học tập trực tuyến; kế hoạch hỗ trợ cá nhân/nhóm; hồ sơ tư vấn, phối hợp, kết quả hỗ trợ; hồ sơ bảo mật thông tin.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a98cac6c-7d60-51aa-9e4f-47c26e19bff4', '18425d00-8330-53c4-bf62-4b71b7f1b83f', 'Số học viên có nguy cơ ngừng học, bỏ học hoặc cần hỗ trợ được theo dõi, hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('8c3ecf2f-2900-501d-b9c1-3416fdd1b387', '18425d00-8330-53c4-bf62-4b71b7f1b83f', 'số lượt tư vấn, hỗ trợ người học theo nhu cầu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 'f359728d-1670-5ea1-853f-261df65e396f', '3.5', 'Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của người học', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('d0a34d69-99fb-5040-b20d-e67c209f26d4', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 1, 'Theo dõi kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn, sự tiến bộ của học viên, kết quả hỗ trợ, học tiếp, học nghề hoặc việc làm (dữ liệu việc làm thu thập tùy thuộc điều kiện) khi có dữ liệu hợp pháp. Có hồ sơ, dữ liệu và phân công thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4e6f8239-a1ba-5671-a864-54689592acc5', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 2, 'Đạt Mức 1; sử dụng dữ liệu kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn, kết quả hỗ trợ, học tiếp, học nghề hoặc việc làm khi có dữ liệu hợp pháp, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để điều chỉnh hoạt động dạy học, kiểm tra, đánh giá và hỗ trợ học viên; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('9ddc866c-3fa0-5ff7-8327-f9c5cba16489', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 'Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của người học', 'Bảng tổng hợp kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn; dữ liệu chuyên cần, duy trì học tập; kết quả hỗ trợ; dữ liệu học tiếp, học nghề hoặc việc làm khi có dữ liệu hợp pháp hoặc phù hợp với chương trình giáo dục; báo cáo phân tích xu hướng và tiến bộ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('bb452a08-86fc-53a7-895e-0d1f29187e99', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 'Tỷ lệ học viên hoàn thành chương trình/giai đoạn/khóa học', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('1b93ce3b-1183-5b6e-b230-ef80aa9db3f0', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 'số học viên chưa đạt yêu cầu hoặc cần hỗ trợ', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('adbfd879-3bf5-5b09-a28b-fb0e30038b62', '1c1b3abe-e5a6-5864-ac81-0dc680bd9e8c', 'xu hướng kết quả theo năm học hoặc khóa học khi có dữ liệu', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chuan (id, bo_id, so_thu_tu, ten)
VALUES ('86d50b9c-c7b2-58af-a537-4ba62e08b228', '9d8a7ec9-8253-558b-b3ee-cb5229f99b9e', 4, 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('d2fdd258-40fe-5211-ae88-a35f0b3362fc', '86d50b9c-c7b2-58af-a537-4ba62e08b228', '4.1', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('869375dc-1c27-5a8e-a479-9119c2162ed0', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 1, 'Có phòng học, thiết bị, học liệu, thư viện/nguồn học liệu, hạ tầng kỹ thuật/số, khu vệ sinh và điều kiện tổ chức dạy học trực tiếp, học trực tuyến hoặc kết hợp khi có điều kiện; quản lý, sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ hoạt động giáo dục theo quy định, bao gồm việc khai thác, sử dụng nguồn lực hợp pháp nếu có.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4f6531a1-bea8-56a6-a658-90ea36a7e794', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 2, 'Đạt Mức 1; sử dụng dữ liệu kiểm kê, sử dụng cơ sở vật chất, thiết bị, học liệu, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để rà soát, bảo trì, bổ sung, điều chỉnh hoặc đề xuất cải thiện điều kiện giáo dục; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('464bc7c9-8bc6-52d3-a6d4-8661db47ca59', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 'Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục', 'Hồ sơ phòng học, phòng chức năng, thiết bị, học liệu, thư viện/nguồn học liệu, hạ tầng kỹ thuật/số, khu vệ sinh; kiểm kê, bảo trì, sửa chữa, bổ sung; minh chứng sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ dạy học; hồ sơ phối hợp, liên kết sử dụng cơ sở vật chất, thiết bị, học liệu hoặc nguồn lực hợp pháp khác nếu có.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('c00a47aa-d820-560d-ba7d-511865be8666', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 'Tỷ lệ phòng đạt chuẩn (%)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('8c6a6fba-7ffd-5dd0-aa30-8238342a5524', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 'tỷ lệ thiết bị hoạt động tốt (%)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('52ebf8b3-080b-52a1-a160-30ec9fffccc7', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 'Tỷ lệ sử dụng thiết bị (%)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('4cd12257-8b1c-5fc6-8720-3f1a8a0c6d3a', 'd2fdd258-40fe-5211-ae88-a35f0b3362fc', 'số hạng mục sửa chữa/bổ sung/năm', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('dd9a5483-271f-5cee-a32b-8f466fd3b380', '86d50b9c-c7b2-58af-a537-4ba62e08b228', '4.2', 'Môi trường giáo dục an toàn, sức khỏe và hạnh phúc', TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('fb118590-8409-5910-85c4-2d610560a049', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 1, 'Kiểm soát điều kiện vệ sinh, nước sạch, ánh sáng, thông gió, an toàn thiết bị, phòng cháy chữa cháy, an toàn số, bảo mật thông tin, sức khỏe, tâm lý, tư vấn/hỗ trợ và xử lý sự cố; bảo đảm an toàn khi tổ chức hoạt động thực hành, thực tập hoặc hoạt động liên kết nếu có. Có hồ sơ, dữ liệu và phân công thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('9d16dc2c-2cb6-57fa-8429-47f1b7ef6fb0', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 2, 'Đạt Mức 1; sử dụng dữ liệu về an toàn, sức khỏe, sự cố, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để phòng ngừa rủi ro, cải thiện môi trường giáo dục an toàn, lành mạnh, thân thiện, phù hợp với đặc điểm học viên; có minh chứng kết quả sau cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('b1ff7674-c35f-5e4f-a9f5-157529d0cf95', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 'Môi trường giáo dục an toàn, sức khỏe và hạnh phúc', 'Bảng kiểm an toàn; hồ sơ vệ sinh, nước sạch, ánh sáng, thông gió, phòng cháy chữa cháy, an toàn số, bảo mật thông tin; hồ sơ sự cố, xử lý và phòng ngừa; hồ sơ tư vấn/hỗ trợ học viên; khảo sát/phản hồi ẩn danh nếu triển khai.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('2323a20d-caec-516e-a2f5-fcaab7515d88', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 'Số sự cố/năm', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('309973ac-cecd-5a27-9de7-544cc18163ac', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 'tỷ lệ xử lý sự cố đúng quy trình (%)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('a95a5a56-32c3-5158-8044-ffe9638d9ae9', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 'tỷ lệ giảm sự cố qua các năm (%)', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('b1e3c069-44e1-5a06-8056-4e42002be044', 'dd9a5483-271f-5cee-a32b-8f466fd3b380', 'mức độ hài lòng môi trường giáo dục (%) nếu khảo sát', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO tieu_chi (id, tieu_chuan_id, ma, ten, la_bat_buoc)
VALUES ('f08b48d0-a135-567f-9bc5-ebae35e2abe2', '86d50b9c-c7b2-58af-a537-4ba62e08b228', '4.3', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('411ae446-6427-5bc8-86ba-58c3b93fc946', 'f08b48d0-a135-567f-9bc5-ebae35e2abe2', 1, 'Duy trì kênh liên lạc với học viên; phối hợp với gia đình/người giám hộ khi phù hợp, chính quyền, y tế, công an, cơ sở giáo dục, cơ sở giáo dục nghề nghiệp, doanh nghiệp sử dụng lao động, tổ chức xã hội để hỗ trợ học viên, bảo đảm an toàn, hướng nghiệp, phân luồng, học tiếp, học nghề và học tập suốt đời. Có hồ sơ, dữ liệu và phân công thực hiện.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO muc_tieu_chi (id, tieu_chi_id, muc, noi_dung_yeu_cau)
VALUES ('4c053cc9-23fa-5a31-98cb-88b67138cfb9', 'f08b48d0-a135-567f-9bc5-ebae35e2abe2', 2, 'Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, gia đình/người giám hộ khi phù hợp, cộng đồng, tổ chức liên quan và kết quả tự đánh giá để điều chỉnh hoạt động phối hợp, huy động và sử dụng nguồn lực hợp pháp; có minh chứng kết quả sau phối hợp hoặc cải tiến qua chu kỳ.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO minh_chung_goi_y (id, tieu_chi_id, nhom_noi_dung, mo_ta)
VALUES ('003e9a80-32ca-5d16-805f-b4ccc098c700', 'f08b48d0-a135-567f-9bc5-ebae35e2abe2', 'Phối hợp với gia đình, cộng đồng và tổ chức liên quan', 'Kế hoạch phối hợp; kênh thông tin với học viên, gia đình/người giám hộ khi phù hợp; hồ sơ phối hợp với chính quyền, y tế, công an, cơ sở giáo dục nghề nghiệp, doanh nghiệp, tổ chức xã hội; minh chứng phối hợp, hỗ trợ từ các tổ chức, cá nhân theo quy định (nếu có); minh chứng kết quả hoặc tác động của hoạt động phối hợp.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('367d07cd-e32d-5e59-91ae-9fb1e268c819', 'f08b48d0-a135-567f-9bc5-ebae35e2abe2', 'Số hoạt động phối hợp trong năm học/khóa học', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO chi_so_dinh_luong (id, tieu_chi_id, ten_chi_so, don_vi, cong_thuc)
VALUES ('391e12b3-2215-56f4-b454-4b70d2172154', 'f08b48d0-a135-567f-9bc5-ebae35e2abe2', 'số người học được hỗ trợ hoặc hưởng lợi từ hoạt động phối hợp', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;