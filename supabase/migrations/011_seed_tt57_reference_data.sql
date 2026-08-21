-- Seed du lieu that TT57/2026/TT-BGDDT tu Phu luc I, II, III.
-- Source-of-truth trong repo: data/tt57/*.json.
-- Migration nay cap nhat cac ban ghi khung da co bang khoa nghiep vu, khong tao trung tieu chi.

begin;

do $$
declare
  v_data jsonb := $tt57$
{
  "metadata": {
    "ma_van_ban": "57/2026/TT-BGDĐT",
    "ngay_ban_hanh": "2026-07-07",
    "ngay_hieu_luc": "2026-07-07",
    "nguon_chinh_thuc": "https://vanban.chinhphu.vn/?classid=1&docid=218991&pageid=27160&typegroupid=6",
    "nguon_trich_xuat_html": "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-57-2026-TT-BGDDT-bao-dam-chat-luong-giao-duc-co-so-giao-duc-mam-non-716471.aspx"
  },
  "bo_tieu_chuan": [
    {
      "metadata": {
        "ma_van_ban": "57/2026/TT-BGDĐT",
        "ngay_ban_hanh": "2026-07-07",
        "ngay_hieu_luc": "2026-07-07",
        "phu_luc": "I",
        "loai_hinh": "mam_non",
        "ten": "Hướng dẫn nội dung, mức độ đáp ứng và thông tin minh chứng các tiêu chí bảo đảm chất lượng đối với cơ sở giáo dục mầm non",
        "nguon_chinh_thuc": "https://vanban.chinhphu.vn/?classid=1&docid=218991&pageid=27160&typegroupid=6",
        "nguon_trich_xuat_html": "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-57-2026-TT-BGDDT-bao-dam-chat-luong-giao-duc-co-so-giao-duc-mam-non-716471.aspx",
        "ghi_chu": "Dữ liệu được cấu trúc hóa từ nội dung Phụ lục I."
      },
      "ghi_chu_phu_luc": "Trong Phụ lục này, “trẻ” được hiểu là trẻ em trong cơ sở giáo dục mầm non; “hoạt động giáo dục” bao gồm hoạt động nuôi dưỡng, chăm sóc và giáo dục trẻ; “kết quả phát triển và sự tiến bộ của trẻ” được hiểu là kết quả phát triển của trẻ theo mục tiêu Chương trình giáo dục mầm non và đặc điểm độ tuổi; “nhân sự hỗ trợ giáo dục” được hiểu là nhân viên hoặc cá nhân được phân công thực hiện nhiệm vụ hỗ trợ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ và các nhiệm vụ hỗ trợ khác theo quy định.",
      "tieu_chuan": [
        {
          "so_thu_tu": 1,
          "ten": "Quản trị nhà trường và bảo đảm chất lượng",
          "tieu_chi": [
            {
              "ma": "1.1",
              "ten": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường xác định mục tiêu, chỉ tiêu và kế hoạch năm học hoặc kế hoạch phát triển phù hợp với nhiệm vụ nuôi dưỡng, chăm sóc, giáo dục trẻ; quy mô, loại hình, điều kiện thực tế của nhà trường, địa phương, đặc điểm trẻ và Chương trình giáo dục mầm non."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát kết quả thực hiện kế hoạch để điều chỉnh mục tiêu, nhiệm vụ, nguồn lực và tổ chức hoạt động trong chu kỳ tiếp theo. Việc điều chỉnh có căn cứ từ kết quả thực hiện, dữ liệu quản lý, phản hồi phù hợp và được công khai theo quy định."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
                "minh_chung_goi_y": "Kế hoạch năm học; kế hoạch giáo dục nhà trường; mục tiêu, chỉ tiêu, nhiệm vụ và kế hoạch phát triển của nhà trường; báo cáo thực hiện kế hoạch; minh chứng rà soát, điều chỉnh mục tiêu, nhiệm vụ hoặc kế hoạch phát triển; minh chứng công khai kế hoạch và kết quả thực hiện theo quy định.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.2",
              "ten": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có cơ cấu tổ chức, phân công nhiệm vụ và bố trí người phụ trách các hoạt động theo quy định, phù hợp với quy mô, loại hình, số nhóm/lớp và điều kiện thực tế. Nhiệm vụ của cán bộ quản lý cơ sở giáo dục, giáo viên, nhân viên và các bộ phận liên quan được phân công rõ ràng, bảo đảm phối hợp trong hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ và bảo đảm an toàn."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát hiệu quả cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ; kịp thời điều chỉnh các nhiệm vụ chồng chéo, bỏ sót hoặc quá tải. Các nhiệm vụ thiết yếu có người phụ trách, có cơ chế phối hợp hoặc thay thế khi có thay đổi nhân sự."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
                "minh_chung_goi_y": "Sơ đồ tổ chức; quyết định thành lập hoặc kiện toàn hội đồng, tổ chuyên môn, tổ văn phòng hoặc bộ phận liên quan; quy chế làm việc; bảng phân công nhiệm vụ; biên bản họp; hồ sơ điều chỉnh phân công khi có thay đổi.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.3",
              "ten": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có hồ sơ, thông tin và dữ liệu thiết yếu về kế hoạch, tài chính, trẻ, đội ngũ, nhóm/lớp, chương trình, cơ sở vật chất, sức khỏe, dinh dưỡng, chuyên cần, an toàn và phát triển của trẻ. Hồ sơ, thông tin và dữ liệu được cập nhật, lưu trữ, quản lý, sử dụng theo quy định, bảo đảm đầy đủ, đúng thời hạn, an toàn và bảo mật thông tin."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát, đối chiếu, tổng hợp và sử dụng dữ liệu để xác định vấn đề, ưu tiên nguồn lực, điều chỉnh kế hoạch, hỗ trợ trẻ và cải thiện điều kiện nuôi dưỡng, chăm sóc, giáo dục. Các sai lệch dữ liệu ảnh hưởng đến quản lý, theo dõi chất lượng được phát hiện và khắc phục theo thời hạn quy định."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
                "minh_chung_goi_y": "Hồ sơ quản lý kế hoạch, tài chính, nhân lực; sổ theo dõi trẻ; hồ sơ nhóm/lớp; hồ sơ sức khỏe, dinh dưỡng, chuyên cần và an toàn của trẻ; hồ sơ cơ sở vật chất; báo cáo tổng hợp hoặc rà soát dữ liệu phục vụ quản lý.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ dữ liệu được cập nhật đầy đủ, đúng thời hạn; số sai lệch dữ liệu được phát hiện và xử lý.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ dữ liệu được cập nhật đầy đủ, đúng thời hạn",
                  "số sai lệch dữ liệu được phát hiện và xử lý"
                ]
              }
            },
            {
              "ma": "1.4",
              "ten": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường thực hiện tự kiểm tra hoặc tự đánh giá để xác định điểm mạnh, hạn chế, nguyên nhân và nội dung cần cải tiến. Kết quả tự kiểm tra, tự đánh giá được sử dụng để xây dựng hoặc cập nhật kế hoạch cải tiến chất lượng với nhiệm vụ, người phụ trách, thời hạn thực hiện và kết quả dự kiến."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường triển khai kế hoạch cải tiến dựa trên dữ liệu, phản hồi và kết quả tự đánh giá; kết quả cải tiến được theo dõi, kiểm chứng bằng minh chứng phù hợp. Chu trình tự đánh giá, cải tiến, công khai và giải trình được thực hiện hằng năm; kết quả cải tiến được sử dụng để điều chỉnh hoạt động quản lý, nuôi dưỡng, chăm sóc, giáo dục trẻ trong chu kỳ tiếp theo."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
                "minh_chung_goi_y": "Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến chất lượng; phân công thực hiện cải tiến; hồ sơ theo dõi thực hiện cải tiến; hồ sơ công khai, giải trình, tiếp nhận và xử lý phản hồi; minh chứng kết quả cải tiến.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch; số phản hồi được tiếp nhận, xử lý.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch",
                  "số phản hồi được tiếp nhận, xử lý"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 2,
          "ten": "Phát triển đội ngũ",
          "tieu_chi": [
            {
              "ma": "2.1",
              "ten": "Cán bộ quản lý cơ sở giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có hiệu trưởng, phó hiệu trưởng theo quy định; cán bộ quản lý cơ sở giáo dục được bổ nhiệm, phân công nhiệm vụ phù hợp và đáp ứng tiêu chuẩn chức danh. Cán bộ quản lý cơ sở giáo dục thực hiện nhiệm vụ chỉ đạo, điều hành đối với kế hoạch giáo dục, đội ngũ, trẻ, tài chính, tài sản, an toàn, hồ sơ, dữ liệu và phối hợp với cha mẹ trẻ."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Cán bộ quản lý cơ sở giáo dục sử dụng dữ liệu, kết quả tự đánh giá, kiểm tra nội bộ và phản hồi phù hợp để điều chỉnh kế hoạch, phân công nhiệm vụ, phát triển đội ngũ và cải tiến chất lượng. Kết quả điều chỉnh, cải tiến được theo dõi, kiểm chứng và sử dụng trong quản lý nhà trường."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cán bộ quản lý cơ sở giáo dục",
                "minh_chung_goi_y": "Quyết định bổ nhiệm; hồ sơ phân công nhiệm vụ; hồ sơ đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.",
                "du_lieu_dinh_luong_goc": "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định; tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định",
                  "tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh"
                ]
              }
            },
            {
              "ma": "2.2",
              "ten": "Giáo viên",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có đội ngũ giáo viên đáp ứng yêu cầu thực hiện Chương trình giáo dục mầm non về số lượng, cơ cấu nhóm/lớp, trình độ đào tạo, phẩm chất, đạo đức nghề nghiệp và chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh theo quy định. Giáo viên được phân công phù hợp với chuyên môn, năng lực và điều kiện thực tế; thực hiện nhiệm vụ nuôi dưỡng, chăm sóc, giáo dục trẻ; tham gia sinh hoạt chuyên môn, bồi dưỡng và theo dõi, đánh giá sự phát triển của trẻ."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường theo dõi, rà soát tình hình đội ngũ giáo viên để điều chỉnh phân công, bồi dưỡng và hỗ trợ chuyên môn. Giáo viên sử dụng kết quả theo dõi sự phát triển của trẻ, sinh hoạt chuyên môn, bồi dưỡng và phản hồi phù hợp để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục và thực hiện biện pháp hỗ trợ trẻ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Giáo viên",
                "minh_chung_goi_y": "Hồ sơ giáo viên; phân công nhóm/lớp; kế hoạch giáo dục; hồ sơ bồi dưỡng; biên bản sinh hoạt chuyên môn; hồ sơ theo dõi sự phát triển của trẻ; minh chứng điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.",
                "du_lieu_dinh_luong_goc": "Số lượng giáo viên hiện có so với định mức; số giáo viên thiếu hoặc thừa theo nhóm/lớp; tỷ lệ giáo viên đạt chuẩn trình độ đào tạo; tỷ lệ giáo viên được phân công phù hợp nhóm/lớp.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số lượng giáo viên hiện có so với định mức",
                  "số giáo viên thiếu hoặc thừa theo nhóm/lớp",
                  "tỷ lệ giáo viên đạt chuẩn trình độ đào tạo",
                  "tỷ lệ giáo viên được phân công phù hợp nhóm/lớp"
                ]
              }
            },
            {
              "ma": "2.3",
              "ten": "Nhân sự hỗ trợ giáo dục",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường bố trí nhân sự hỗ trợ hoặc có phương án phân công, kiêm nhiệm, hợp đồng, phối hợp để thực hiện các nhiệm vụ thiết yếu về y tế, dinh dưỡng, an toàn, thiết bị, hành chính, tài chính, bảo vệ và hỗ trợ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ theo quy định và điều kiện thực tế. Nhiệm vụ của từng vị trí hoặc bộ phận hỗ trợ được phân công cụ thể."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát mức độ đáp ứng của nhân sự hỗ trợ; kịp thời điều chỉnh phân công hoặc đề xuất bổ sung khi cần. Các nhiệm vụ thiết yếu về an toàn, y tế, dinh dưỡng, nuôi dưỡng, bảo vệ và hỗ trợ hoạt động của nhà trường được duy trì ổn định, không bị bỏ trống."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Nhân viên (thuộc nhóm nhân sự hỗ trợ hoạt động giáo dục)",
                "minh_chung_goi_y": "Danh sách nhân sự hỗ trợ; phân công nhiệm vụ; hồ sơ thực hiện nhiệm vụ về y tế, dinh dưỡng, thiết bị, hành chính, tài chính, bảo vệ và các nhiệm vụ hỗ trợ khác; hồ sơ rà soát, điều chỉnh khi có thay đổi.",
                "du_lieu_dinh_luong_goc": "Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu; tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu",
                  "tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 3,
          "ten": "Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển trẻ em",
          "tieu_chi": [
            {
              "ma": "3.1",
              "ten": "Tổ chức thực hiện chương trình giáo dục mầm non",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường xây dựng kế hoạch giáo dục và tổ chức thực hiện Chương trình giáo dục mầm non phù hợp với độ tuổi, nhóm trẻ, lớp mẫu giáo, điều kiện thực tế của nhà trường và địa phương. Các hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ được thực hiện theo kế hoạch, bảo đảm an toàn, phù hợp với đặc điểm phát triển của trẻ."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng kết quả theo dõi tiến độ thực hiện kế hoạch, chuyên cần, sức khỏe, dinh dưỡng, sự phát triển của trẻ và điều kiện thực tế để rà soát, điều chỉnh kế hoạch giáo dục. Việc thực hiện chương trình được duy trì ổn định; kế hoạch giáo dục được điều chỉnh, cải tiến phù hợp với nhu cầu của trẻ và điều kiện của nhà trường."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức thực hiện chương trình giáo dục mầm non",
                "minh_chung_goi_y": "Kế hoạch giáo dục; lịch hoạt động; hồ sơ nhóm/lớp; báo cáo thực hiện chương trình; biên bản sinh hoạt chuyên môn; minh chứng theo dõi, điều chỉnh kế hoạch giáo dục.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ thực hiện kế hoạch giáo dục; tỷ lệ chuyên cần của trẻ.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ thực hiện kế hoạch giáo dục",
                  "tỷ lệ chuyên cần của trẻ"
                ]
              }
            },
            {
              "ma": "3.2",
              "ten": "Đổi mới phương pháp chăm sóc, giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của trẻ em",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Giáo viên áp dụng phương pháp nuôi dưỡng, chăm sóc, giáo dục phù hợp với độ tuổi, đặc điểm phát triển và nhu cầu của trẻ; thực hiện quan sát, theo dõi, đánh giá sự phát triển của trẻ theo quy định hoặc kế hoạch của nhà trường. Kết quả quan sát, theo dõi, đánh giá được sử dụng để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường tổ chức sinh hoạt chuyên môn để phân tích phương pháp nuôi dưỡng, chăm sóc, giáo dục, kết quả theo dõi trẻ và hỗ trợ giáo viên điều chỉnh hoạt động. Phương pháp nuôi dưỡng, chăm sóc, giáo dục được cải tiến; trẻ được tham gia hoạt động tích cực, phù hợp, an toàn và có tiến bộ được ghi nhận."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Đổi mới phương pháp giáo dục/chăm sóc và theo dõi, đánh giá sự phát triển, tiến bộ của trẻ em",
                "minh_chung_goi_y": "Kế hoạch hoạt động; hồ sơ quan sát, theo dõi, đánh giá sự phát triển của trẻ; hình ảnh, sản phẩm hoạt động của trẻ; biên bản sinh hoạt chuyên môn; minh chứng dự giờ, góp ý chuyên môn; minh chứng điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.",
                "du_lieu_dinh_luong_goc": "Số trẻ được quan sát, theo dõi theo kế hoạch; số trẻ cần hỗ trợ được phát hiện qua quan sát, theo dõi.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số trẻ được quan sát, theo dõi theo kế hoạch",
                  "số trẻ cần hỗ trợ được phát hiện qua quan sát, theo dõi"
                ]
              }
            },
            {
              "ma": "3.3",
              "ten": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường tổ chức các hoạt động vui chơi, trải nghiệm, vận động, nghệ thuật, ngôn ngữ, khám phá, tự phục vụ và các hoạt động phù hợp khác theo độ tuổi. Trẻ được tham gia các hoạt động phát triển thể chất, nhận thức, ngôn ngữ, tình cảm - kỹ năng xã hội và thẩm mỹ theo Chương trình giáo dục mầm non."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường theo dõi sự tham gia, nhu cầu, khả năng và tiến bộ của trẻ để điều chỉnh nội dung, hình thức tổ chức hoạt động giáo dục. Hoạt động phát triển toàn diện được duy trì, đa dạng, an toàn, phù hợp bối cảnh và hỗ trợ sự tiến bộ của trẻ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
                "minh_chung_goi_y": "Kế hoạch hoạt động; hồ sơ nhóm/lớp; hồ sơ hoặc tổng hợp hoạt động vui chơi, trải nghiệm, vận động, nghệ thuật, ngôn ngữ, khám phá và tự phục vụ; hình ảnh, sản phẩm hoạt động của trẻ; minh chứng điều chỉnh, cải tiến hoạt động.",
                "du_lieu_dinh_luong_goc": "Số hoạt động giáo dục được tổ chức trong năm; tỷ lệ trẻ tham gia hoạt động giáo dục theo kế hoạch.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số hoạt động giáo dục được tổ chức trong năm",
                  "tỷ lệ trẻ tham gia hoạt động giáo dục theo kế hoạch"
                ]
              }
            },
            {
              "ma": "3.4",
              "ten": "Quản lý, theo dõi, hỗ trợ trẻ em và giáo dục hòa nhập",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có hồ sơ quản lý trẻ; theo dõi chuyên cần, sức khỏe, dinh dưỡng, an toàn, sự phát triển và nhu cầu hỗ trợ của trẻ. Trẻ cần hỗ trợ, trẻ có nhu cầu đặc thù hoặc trẻ thuộc diện giáo dục hòa nhập được nhận diện, lập kế hoạch hỗ trợ, phân công người phụ trách và phối hợp với cha mẹ trẻ khi cần."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Kết quả hỗ trợ trẻ được theo dõi, đánh giá và điều chỉnh khi cần thiết. Nhà trường duy trì việc phát hiện sớm, hỗ trợ trẻ và phối hợp với cha mẹ trẻ, chuyên gia, cơ quan hoặc tổ chức liên quan khi phù hợp; bảo đảm trẻ được tôn trọng, an toàn, hòa nhập và có cơ hội phát triển."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý, theo dõi, hỗ trợ trẻ và giáo dục hòa nhập",
                "minh_chung_goi_y": "Hồ sơ trẻ; dữ liệu chuyên cần, sức khỏe, dinh dưỡng; danh sách trẻ cần hỗ trợ; kế hoạch và hồ sơ hỗ trợ cá nhân hoặc nhóm; minh chứng trao đổi với cha mẹ trẻ; biên bản phối hợp; hồ sơ tư vấn, y tế nếu có; báo cáo rà soát định kỳ.",
                "du_lieu_dinh_luong_goc": "Số trẻ cần hỗ trợ được lập kế hoạch hỗ trợ; số trẻ được theo dõi, hỗ trợ theo kế hoạch.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số trẻ cần hỗ trợ được lập kế hoạch hỗ trợ",
                  "số trẻ được theo dõi, hỗ trợ theo kế hoạch"
                ]
              }
            },
            {
              "ma": "3.5",
              "ten": "Kết quả phát triển và sự tiến bộ của trẻ",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Trẻ được theo dõi sự phát triển theo mục tiêu Chương trình giáo dục mầm non và đặc điểm độ tuổi. Nhà trường tổng hợp kết quả phát triển, chuyên cần, sức khỏe, dinh dưỡng và sự tiến bộ của trẻ để xác định nhóm trẻ cần hỗ trợ."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường phân tích kết quả phát triển và sự tiến bộ của trẻ để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục và hỗ trợ trẻ. Kết quả theo dõi cho thấy sự tiến bộ của trẻ, đặc biệt đối với trẻ cần hỗ trợ hoặc trẻ 5 tuổi chuẩn bị vào lớp Một; việc xem xét kết quả chú trọng sự tiến bộ của trẻ, không áp dụng máy móc yêu cầu so sánh giữa các cơ sở giáo dục."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Kết quả phát triển và sự tiến bộ của trẻ",
                "minh_chung_goi_y": "Hồ sơ theo dõi trẻ; kết quả đánh giá sự phát triển của trẻ theo độ tuổi/giai đoạn; sản phẩm hoạt động của trẻ; báo cáo tổng hợp kết quả phát triển, chuyên cần, sức khỏe, dinh dưỡng và sự tiến bộ của trẻ; danh sách trẻ cần hỗ trợ; thông tin, minh chứng về chuẩn bị cho trẻ 5 tuổi vào lớp Một; phản hồi của cha mẹ trẻ khi có.",
                "du_lieu_dinh_luong_goc": "Số trẻ được theo dõi sự phát triển theo quy định; số trẻ có nội dung phát triển cần được theo dõi, hỗ trợ; số trẻ 5 tuổi được theo dõi, hỗ trợ chuẩn bị vào lớp Một.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số trẻ được theo dõi sự phát triển theo quy định",
                  "số trẻ có nội dung phát triển cần được theo dõi, hỗ trợ",
                  "số trẻ 5 tuổi được theo dõi, hỗ trợ chuẩn bị vào lớp Một"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 4,
          "ten": "Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội",
          "tieu_chi": [
            {
              "ma": "4.1",
              "ten": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có phòng học, khu chức năng, sân chơi, khu vệ sinh, nước sạch, thiết bị, đồ dùng, đồ chơi, học liệu, bếp ăn (nếu có) và các điều kiện vật chất cần thiết phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ theo quy định, phù hợp với quy mô, độ tuổi và điều kiện thực tế. Các điều kiện này được quản lý, sử dụng, bảo trì, bảo quản và rà soát định kỳ; hạng mục thiếu, xuống cấp hoặc chưa bảo đảm an toàn có phương án khắc phục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng dữ liệu về tình trạng cơ sở vật chất, thiết bị, đồ dùng, đồ chơi, học liệu và nhu cầu nuôi dưỡng, chăm sóc, giáo dục trẻ để lập kế hoạch sửa chữa, bảo trì, bổ sung, sắp xếp hoặc khai thác hiệu quả hơn. Việc cải thiện cơ sở vật chất, thiết bị, học liệu và điều kiện vật chất góp phần tạo môi trường nuôi dưỡng, chăm sóc, giáo dục an toàn, thân thiện, phù hợp với đặc điểm phát triển của trẻ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động nuôi dưỡng chăm sóc giáo dục trẻ",
                "minh_chung_goi_y": "Hồ sơ tài sản; hồ sơ kiểm kê thiết bị, đồ dùng, đồ chơi, học liệu; bảng kiểm phòng học, khu vệ sinh, sân chơi, bếp ăn nếu có; kế hoạch bảo trì, sửa chữa, bổ sung; biên bản kiểm tra; minh chứng khắc phục hạng mục thiếu, xuống cấp hoặc chưa bảo đảm an toàn; minh chứng sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ.",
                "du_lieu_dinh_luong_goc": "Số phòng học đạt yêu cầu so với tổng số phòng học; số khu vệ sinh đạt yêu cầu; số bếp ăn đạt yêu cầu khi áp dụng; tỷ lệ thiết bị, đồ dùng, đồ chơi, học liệu sử dụng được.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số phòng học đạt yêu cầu so với tổng số phòng học",
                  "số khu vệ sinh đạt yêu cầu",
                  "số bếp ăn đạt yêu cầu khi áp dụng",
                  "tỷ lệ thiết bị, đồ dùng, đồ chơi, học liệu sử dụng được"
                ]
              }
            },
            {
              "ma": "4.2",
              "ten": "Môi trường giáo dục an toàn, sức khỏe và hạnh phúc",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có biện pháp bảo đảm an toàn thể chất, sức khỏe, vệ sinh, dinh dưỡng, phòng chống tai nạn, bạo lực, xâm hại và các rủi ro trong hoạt động nuôi dưỡng, chăm sóc, giáo dục trẻ. Nhà trường thực hiện quy trình đón, trả trẻ; kiểm soát người ra vào; bảo đảm an toàn bữa ăn, giấc ngủ, hoạt động ngoài trời, đồ chơi, thiết bị và khu vệ sinh; có kênh tiếp nhận phản ánh, quy trình xử lý sự cố, tai nạn, nghi ngờ bạo hành hoặc xâm hại trẻ. Các nguy cơ mất an toàn được phát hiện, ghi nhận, xử lý và theo dõi kết quả khắc phục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường phân tích dữ liệu sự cố, nguy cơ mất an toàn, phản hồi của cha mẹ trẻ và kết quả kiểm tra để phòng ngừa rủi ro tái diễn, cải thiện môi trường nuôi dưỡng, chăm sóc, giáo dục an toàn, lành mạnh, tích cực. Trẻ được tôn trọng, bảo vệ, hỗ trợ phù hợp; kết quả kiểm tra và phản hồi được sử dụng để điều chỉnh biện pháp phòng ngừa, xử lý và hỗ trợ trẻ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Môi trường giáo dục an toàn, sức khỏe và hạnh phúc",
                "minh_chung_goi_y": "Bảng kiểm an toàn; hồ sơ sức khỏe; hồ sơ dinh dưỡng; biên bản kiểm tra; hồ sơ xử lý sự cố nếu có; danh sách nguy cơ mất an toàn; biên bản xử lý, minh chứng khắc phục; hồ sơ thông tin, trao đổi với cha mẹ trẻ khi cần; kế hoạch phòng ngừa; báo cáo hoặc minh chứng cải thiện môi trường giáo dục.",
                "du_lieu_dinh_luong_goc": "Số sự cố an toàn trong năm; số sự cố đã xử lý; số nguy cơ mất an toàn được phát hiện và khắc phục; tỷ lệ trẻ được theo dõi sức khỏe định kỳ.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số sự cố an toàn trong năm",
                  "số sự cố đã xử lý",
                  "số nguy cơ mất an toàn được phát hiện và khắc phục",
                  "tỷ lệ trẻ được theo dõi sức khỏe định kỳ"
                ]
              }
            },
            {
              "ma": "4.3",
              "ten": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có kênh phối hợp với cha mẹ trẻ, cộng đồng và tổ chức liên quan trong nuôi dưỡng, chăm sóc, giáo dục, bảo đảm an toàn và hỗ trợ trẻ. Hoạt động phối hợp được thực hiện định kỳ hoặc khi cần thiết, có ghi nhận nội dung trao đổi, phản hồi và kết quả xử lý."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng phản hồi và kết quả phối hợp để điều chỉnh hoạt động nuôi dưỡng, chăm sóc, giáo dục, bảo đảm an toàn và hỗ trợ trẻ. Cơ chế phối hợp hai chiều được duy trì ổn định, minh bạch; nguồn lực huy động hợp pháp và có tác động tích cực đến môi trường nuôi dưỡng, chăm sóc, giáo dục, an toàn hoặc hỗ trợ trẻ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
                "minh_chung_goi_y": "Kế hoạch phối hợp; sổ liên lạc hoặc kênh thông tin; biên bản họp cha mẹ trẻ; hồ sơ phối hợp với y tế, chính quyền, tổ chức liên quan; hồ sơ phản hồi; minh chứng xử lý kiến nghị hoặc phối hợp hỗ trợ trẻ; hồ sơ huy động, tiếp nhận, sử dụng nguồn lực theo quy định.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            }
          ]
        }
      ]
    },
    {
      "metadata": {
        "ma_van_ban": "57/2026/TT-BGDĐT",
        "ngay_ban_hanh": "2026-07-07",
        "ngay_hieu_luc": "2026-07-07",
        "phu_luc": "II",
        "loai_hinh": "pho_thong",
        "ten": "Hướng dẫn nội dung, mức độ đáp ứng và thông tin minh chứng các tiêu chí bảo đảm chất lượng đối với cơ sở giáo dục phổ thông",
        "nguon_chinh_thuc": "https://vanban.chinhphu.vn/?classid=1&docid=218991&pageid=27160&typegroupid=6",
        "nguon_trich_xuat_html": "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-57-2026-TT-BGDDT-bao-dam-chat-luong-giao-duc-co-so-giao-duc-mam-non-716471.aspx",
        "ghi_chu": "Dữ liệu được cấu trúc hóa từ nội dung Phụ lục II."
      },
      "tieu_chuan": [
        {
          "so_thu_tu": 1,
          "ten": "Quản trị nhà trường và bảo đảm chất lượng",
          "tieu_chi": [
            {
              "ma": "1.1",
              "ten": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường xác định mục tiêu, định hướng phát triển và xây dựng kế hoạch năm học/kế hoạch phát triển phù hợp với cấp học, Chương trình giáo dục phổ thông, quy mô học sinh, điều kiện thực tế của nhà trường và địa phương. Kế hoạch xác định rõ nhiệm vụ trọng tâm, chỉ tiêu chủ yếu, thời hạn thực hiện, phân công trách nhiệm và nguồn lực cần thiết."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát, điều chỉnh kế hoạch trên cơ sở kết quả thực hiện, dữ liệu về học sinh, đội ngũ, điều kiện bảo đảm, an toàn trường học và kết quả giáo dục. Việc điều chỉnh có tham khảo ý kiến phù hợp của đội ngũ, học sinh, cha mẹ học sinh và các bên liên quan; có minh chứng về chuyển biến trong thực hiện nhiệm vụ trọng tâm hoặc cải thiện điều kiện bảo đảm chất lượng giáo dục."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
                "minh_chung_goi_y": "Kế hoạch năm học, kế hoạch giáo dục hoặc kế hoạch phát triển của nhà trường; mục tiêu, nhiệm vụ trọng tâm và phân công thực hiện; báo cáo rà soát, đánh giá và điều chỉnh kế hoạch.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.2",
              "ten": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có cơ cấu tổ chức, các tổ chuyên môn, tổ văn phòng/bộ phận hỗ trợ và các hội đồng theo quy định, phù hợp với cấp học, quy mô và điều kiện thực tế. Nhiệm vụ của cán bộ quản lý cơ sở giáo dục, giáo viên, giáo viên chủ nhiệm, nhân viên và các bộ phận liên quan được phân công rõ người, rõ việc, rõ trách nhiệm và có cơ chế phối hợp trong thực hiện nhiệm vụ giáo dục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường định kỳ rà soát cơ cấu tổ chức, phân công nhiệm vụ và hiệu quả phối hợp nội bộ; kịp thời điều chỉnh những nội dung chồng chéo, bỏ sót hoặc chưa phù hợp. Việc điều chỉnh góp phần nâng cao hiệu quả quản trị, thực hiện chương trình giáo dục, hỗ trợ học sinh và bảo đảm an toàn trường học."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
                "minh_chung_goi_y": "Sơ đồ tổ chức; quyết định thành lập hoặc kiện toàn các tổ chức theo quy định; quy chế làm việc hoặc bảng phân công nhiệm vụ; hồ sơ rà soát, điều chỉnh phân công khi có phát sinh.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.3",
              "ten": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có hồ sơ, thông tin và dữ liệu thiết yếu phục vụ quản lý hoạt động giáo dục, bao gồm dữ liệu về học sinh, đội ngũ, lớp học, khối lớp, chương trình giáo dục, cơ sở vật chất, thiết bị dạy học, tài chính, chuyên cần, an toàn và kết quả giáo dục. Hồ sơ, thông tin và dữ liệu được cập nhật, lưu trữ, quản lý, đối chiếu và sử dụng theo quy định, bảo đảm đầy đủ, đúng thời hạn, an toàn, bảo mật và phục vụ công tác điều hành của nhà trường."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường rà soát, đối chiếu, tổng hợp và phân tích dữ liệu để đánh giá thực trạng, dự báo nhu cầu, điều chỉnh kế hoạch, phân bổ nguồn lực, tổ chức lớp học, bồi dưỡng đội ngũ, hỗ trợ học sinh và cải thiện điều kiện giáo dục. Dữ liệu được theo dõi, so sánh theo chu kỳ phù hợp; được sử dụng làm căn cứ cho các quyết định quản lý, tự đánh giá, cải tiến chất lượng và công khai theo quy định."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
                "minh_chung_goi_y": "Hồ sơ, dữ liệu về học sinh, đội ngũ, lớp học, chương trình giáo dục, cơ sở vật chất, thiết bị, tài chính và kết quả giáo dục; minh chứng cập nhật, quản lý, sử dụng, phân quyền và bảo mật dữ liệu; báo cáo hoặc tài liệu sử dụng dữ liệu phục vụ công tác quản lý, điều hành.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ hồ sơ, dữ liệu quản lý được cập nhật đầy đủ, đúng hạn; số sai lệch dữ liệu được phát hiện và xử lý; số nội dung quản lý, điều hành được điều chỉnh trên cơ sở dữ liệu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ hồ sơ, dữ liệu quản lý được cập nhật đầy đủ, đúng hạn",
                  "số sai lệch dữ liệu được phát hiện và xử lý",
                  "số nội dung quản lý, điều hành được điều chỉnh trên cơ sở dữ liệu"
                ]
              }
            },
            {
              "ma": "1.4",
              "ten": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường thực hiện tự kiểm tra, tự đánh giá theo quy định hoặc theo kế hoạch của nhà trường để xác định điểm mạnh, hạn chế, nguyên nhân và nội dung cần cải tiến. Kết quả tự kiểm tra, tự đánh giá được sử dụng để xây dựng hoặc cập nhật kế hoạch cải tiến; thực hiện công khai thông tin và tiếp nhận, xử lý phản hồi theo quy định."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường triển khai kế hoạch cải tiến với nhiệm vụ, người phụ trách, thời hạn, nguồn lực và sản phẩm cụ thể; ưu tiên các nội dung cần khắc phục về chương trình giáo dục, đội ngũ, an toàn, hỗ trợ học sinh, dữ liệu và điều kiện bảo đảm chất lượng. Kết quả cải tiến được theo dõi, kiểm chứng bằng minh chứng hoặc dữ liệu phù hợp; được sử dụng để điều chỉnh hoạt động quản lý, dạy học, giáo dục, hỗ trợ học sinh và điều kiện bảo đảm chất lượng trong chu kỳ tiếp theo."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
                "minh_chung_goi_y": "Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến chất lượng; hồ sơ theo dõi thực hiện cải tiến; hồ sơ công khai, giải trình, tiếp nhận và xử lý phản hồi; minh chứng kết quả cải tiến.",
                "du_lieu_dinh_luong_goc": "Số nhiệm vụ cải tiến hoàn thành/tổng số nhiệm vụ cải tiến theo kế hoạch; số phản hồi được tiếp nhận, xử lý.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số nhiệm vụ cải tiến hoàn thành/tổng số nhiệm vụ cải tiến theo kế hoạch",
                  "số phản hồi được tiếp nhận, xử lý"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 2,
          "ten": "Phát triển đội ngũ",
          "tieu_chi": [
            {
              "ma": "2.1",
              "ten": "Cán bộ quản lý cơ sở giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có cán bộ quản lý cơ sở giáo dục theo quy định; cán bộ quản lý cơ sở giáo dục được bổ nhiệm, phân công nhiệm vụ phù hợp với vị trí việc làm và đáp ứng tiêu chuẩn chức danh. Cán bộ quản lý cơ sở giáo dục thực hiện nhiệm vụ chỉ đạo, điều hành đối với chương trình giáo dục, đội ngũ, học sinh, tài chính, tài sản, an toàn trường học, quản lý hồ sơ, dữ liệu và bảo đảm chất lượng giáo dục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Cán bộ quản lý cơ sở giáo dục sử dụng dữ liệu, kết quả tự đánh giá, kiểm tra nội bộ và phản hồi phù hợp của đội ngũ, học sinh, cha mẹ học sinh để điều chỉnh kế hoạch, phân công nhiệm vụ và cải tiến hoạt động của nhà trường. Công tác quản trị, chỉ đạo, điều hành có chuyển biến tích cực; các hạn chế, tồn tại được phát hiện và có biện pháp khắc phục, góp phần nâng cao hiệu quả thực hiện chương trình giáo dục, phát triển đội ngũ, hỗ trợ học sinh và bảo đảm an toàn trường học."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cán bộ quản lý cơ sở giáo dục",
                "minh_chung_goi_y": "Hồ sơ bổ nhiệm, phân công nhiệm vụ cán bộ quản lý cơ sở giáo dục; hồ sơ tiêu chuẩn chức danh, đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.",
                "du_lieu_dinh_luong_goc": "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định; tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh; tỷ lệ cán bộ quản lý cơ sở giáo dục hoàn thành nhiệm vụ trở lên; số nội dung quản lý được cải tiến trên cơ sở kết quả kiểm tra, tự đánh giá.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định",
                  "tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh",
                  "tỷ lệ cán bộ quản lý cơ sở giáo dục hoàn thành nhiệm vụ trở lên",
                  "số nội dung quản lý được cải tiến trên cơ sở kết quả kiểm tra, tự đánh giá"
                ]
              }
            },
            {
              "ma": "2.2",
              "ten": "Giáo viên",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có đội ngũ giáo viên đáp ứng yêu cầu thực hiện Chương trình giáo dục phổ thông về số lượng, cơ cấu môn học và hoạt động giáo dục, trình độ đào tạo, phẩm chất, đạo đức nghề nghiệp và chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh theo quy định. Giáo viên được phân công nhiệm vụ phù hợp với chuyên môn, năng lực và điều kiện thực tế; thực hiện kế hoạch giáo dục, kế hoạch bài dạy, đánh giá học sinh, sinh hoạt chuyên môn và bồi dưỡng theo quy định hoặc kế hoạch của nhà trường."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường theo dõi, rà soát tình hình đội ngũ giáo viên để điều chỉnh phân công, bồi dưỡng, hỗ trợ chuyên môn; duy trì hoặc nâng cao mức độ đáp ứng về số lượng, cơ cấu, trình độ đào tạo và chuẩn nghề nghiệp của giáo viên. Giáo viên vận dụng kết quả bồi dưỡng, sinh hoạt chuyên môn, kết quả đánh giá học sinh, sản phẩm học tập và phản hồi phù hợp để điều chỉnh phương pháp dạy học, giáo dục, hỗ trợ học sinh và nâng cao hiệu quả thực hiện Chương trình giáo dục phổ thông."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Giáo viên",
                "minh_chung_goi_y": "Danh sách giáo viên; hồ sơ trình độ đào tạo, chuẩn nghề nghiệp hoặc tiêu chuẩn chức danh; bảng phân công chuyên môn; hồ sơ sinh hoạt chuyên môn, bồi dưỡng; hồ sơ đánh giá, cải tiến hoạt động dạy học và hỗ trợ học sinh.",
                "du_lieu_dinh_luong_goc": "Số giáo viên hiện có so với định mức; số giáo viên thiếu hoặc thừa theo môn học/hoạt động giáo dục; tỷ lệ giáo viên đạt chuẩn trình độ đào tạo; tỷ lệ giáo viên được phân công phù hợp chuyên môn.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số giáo viên hiện có so với định mức",
                  "số giáo viên thiếu hoặc thừa theo môn học/hoạt động giáo dục",
                  "tỷ lệ giáo viên đạt chuẩn trình độ đào tạo",
                  "tỷ lệ giáo viên được phân công phù hợp chuyên môn"
                ]
              }
            },
            {
              "ma": "2.3",
              "ten": "Nhân sự hỗ trợ giáo dục",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường bố trí nhân sự hỗ trợ giáo dục theo quy định hoặc có phương án phân công, kiêm nhiệm, hợp đồng, phối hợp để thực hiện các nhiệm vụ thiết yếu về y tế, thư viện, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn và hỗ trợ học sinh. Việc bố trí nhân sự hỗ trợ phù hợp với cấp học, quy mô, điều kiện thực tế của nhà trường; nhiệm vụ của từng vị trí hoặc bộ phận hỗ trợ được phân công cụ thể."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường theo dõi, rà soát chất lượng hoạt động hỗ trợ giáo dục; kịp thời phát hiện khó khăn, hạn chế hoặc rủi ro về sức khỏe, an toàn, thiết bị, học liệu, công nghệ thông tin, hành chính, tài chính, tư vấn và hỗ trợ học sinh để có biện pháp điều chỉnh. Hoạt động hỗ trợ giáo dục được cải thiện, góp phần phục vụ tốt hơn hoạt động dạy học, giáo dục, chăm sóc sức khỏe, bảo đảm an toàn và hỗ trợ học sinh."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Nhân viên (nhân sự hỗ trợ hoạt động giáo dục)",
                "minh_chung_goi_y": "Danh sách nhân sự hỗ trợ; phân công nhiệm vụ; hồ sơ thực hiện nhiệm vụ về y tế, thư viện, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn và hỗ trợ học sinh; hồ sơ rà soát, điều chỉnh hoạt động hỗ trợ khi có sự thay đổi.",
                "du_lieu_dinh_luong_goc": "Số vị trí nhân sự hỗ trợ hiện có so với tổng số vị trí theo quy định; tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số vị trí nhân sự hỗ trợ hiện có so với tổng số vị trí theo quy định",
                  "tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 3,
          "ten": "Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển học sinh",
          "tieu_chi": [
            {
              "ma": "3.1",
              "ten": "Tổ chức thực hiện chương trình giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường xây dựng và thực hiện kế hoạch giáo dục theo Chương trình giáo dục phổ thông theo năm học, học kỳ, tháng/tuần; phù hợp với cấp học, đối tượng học sinh, điều kiện thực tế của nhà trường và địa phương. Việc tổ chức dạy học, giáo dục, hoạt động trải nghiệm, hướng nghiệp nếu có, kiểm tra và đánh giá học sinh được thực hiện đầy đủ, đúng quy định; có theo dõi tiến độ thực hiện chương trình, bảo đảm nội dung, thời lượng, môn học và hoạt động giáo dục theo kế hoạch."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng kết quả theo dõi tiến độ chương trình, dữ liệu chuyên cần, kết quả đánh giá học sinh, sinh hoạt chuyên môn và phản hồi phù hợp của học sinh, cha mẹ học sinh để rà soát, điều chỉnh kế hoạch giáo dục, tổ chức dạy học, giáo dục và hỗ trợ học sinh. Việc thực hiện chương trình giáo dục được điều chỉnh kịp thời, linh hoạt, phù hợp hơn với bối cảnh địa phương, điều kiện nhà trường và nhu cầu học sinh; có minh chứng về kết quả cải tiến trong tổ chức thực hiện chương trình, học tập, rèn luyện hoặc phát triển của học sinh."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức thực hiện chương trình giáo dục",
                "minh_chung_goi_y": "Kế hoạch giáo dục nhà trường; kế hoạch dạy học môn học/hoạt động giáo dục; thời khóa biểu, sổ đầu bài hoặc hồ sơ chuyên môn; hồ sơ kiểm tra, đánh giá; minh chứng theo dõi, điều chỉnh tiến độ thực hiện chương trình.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ lớp thực hiện đúng tiến độ chương trình; tỷ lệ môn học/hoạt động giáo dục hoàn thành theo kế hoạch; tỷ lệ chuyên cần của học sinh; số buổi dạy bù, học bù hoặc điều chỉnh kế hoạch.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ lớp thực hiện đúng tiến độ chương trình",
                  "tỷ lệ môn học/hoạt động giáo dục hoàn thành theo kế hoạch",
                  "tỷ lệ chuyên cần của học sinh",
                  "số buổi dạy bù, học bù hoặc điều chỉnh kế hoạch"
                ]
              }
            },
            {
              "ma": "3.2",
              "ten": "Đổi mới phương pháp giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của học sinh",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường tổ chức dạy học, giáo dục và đánh giá học sinh phù hợp với mục tiêu Chương trình giáo dục phổ thông, cấp học, đối tượng học sinh và điều kiện thực tế. Giáo viên xây dựng kế hoạch bài dạy; lựa chọn phương pháp dạy học, giáo dục và hình thức kiểm tra, đánh giá phù hợp; theo dõi sự phát triển, tiến bộ của học sinh; tham gia sinh hoạt chuyên môn, dự giờ và bồi dưỡng chuyên môn theo quy định hoặc kế hoạch của nhà trường."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng kết quả đánh giá học sinh, sản phẩm học tập, kết quả sinh hoạt chuyên môn, phản hồi phù hợp của học sinh, cha mẹ học sinh và sự tiến bộ của học sinh để điều chỉnh phương pháp dạy học, giáo dục và biện pháp hỗ trợ học sinh. Giáo viên thực hiện các phương pháp dạy học phát triển phẩm chất, năng lực; hỗ trợ phù hợp với nhu cầu của học sinh, tôn trọng sự khác biệt và bảo đảm môi trường học tập an toàn, tích cực. Các giải pháp đổi mới được theo dõi, đánh giá, rút kinh nghiệm, duy trì hoặc chia sẻ phù hợp; có minh chứng về kết quả hoặc tác động tích cực đối với sự phát triển và tiến bộ của học sinh."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Đổi mới phương pháp giáo dục và theo dõi, đánh giá sự phát triển, tiến bộ của học sinh",
                "minh_chung_goi_y": "Kế hoạch bài dạy; hồ sơ chuyên môn; hồ sơ đánh giá học sinh; biên bản sinh hoạt chuyên môn, dự giờ; sản phẩm học tập; minh chứng điều chỉnh phương pháp dạy học, giáo dục và hỗ trợ học sinh.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ học sinh đạt yêu cầu đánh giá theo quy định; số học sinh có tiến bộ qua từng giai đoạn; số học sinh cần hỗ trợ được theo dõi, hỗ trợ; số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp, đánh giá học sinh.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ học sinh đạt yêu cầu đánh giá theo quy định",
                  "số học sinh có tiến bộ qua từng giai đoạn",
                  "số học sinh cần hỗ trợ được theo dõi, hỗ trợ",
                  "số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp, đánh giá học sinh"
                ]
              }
            },
            {
              "ma": "3.3",
              "ten": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường xây dựng và tổ chức các hoạt động giáo dục phát triển toàn diện học sinh phù hợp với Chương trình giáo dục phổ thông, cấp học, điều kiện thực tế và nhu cầu của học sinh. Các hoạt động được thực hiện theo kế hoạch, gắn với mục tiêu phát triển phẩm chất, năng lực, kỹ năng sống, hoạt động trải nghiệm, hướng nghiệp nếu có, giáo dục văn hóa, thể chất, thẩm mỹ và các nội dung giáo dục phù hợp khác."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường theo dõi mức độ tham gia, kết quả, sản phẩm và phản hồi để điều chỉnh nội dung, hình thức tổ chức hoạt động giáo dục. Các hoạt động giáo dục được cải thiện theo hướng tăng tính trải nghiệm, sáng tạo, tích hợp, gắn với khoa học, công nghệ, đổi mới sáng tạo và thực tiễn; tăng cường kết nối học tập với gia đình, cộng đồng hoặc các tổ chức liên quan khi phù hợp; có minh chứng về kết quả hoặc tác động tích cực đối với sự phát triển toàn diện của học sinh. Số lượng, tần suất hoặc tỷ lệ tham gia hoạt động được xác định theo kế hoạch giáo dục của nhà trường hoặc hướng dẫn của cơ quan quản lý, phù hợp với loại hình, quy mô và điều kiện thực tế của cơ sở giáo dục."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
                "minh_chung_goi_y": "Kế hoạch hoạt động giáo dục; hoạt động trải nghiệm, hướng nghiệp; hoạt động thể thao, văn nghệ, kỹ năng sống; hoạt động, dự án giáo dục STEM hoặc STEAM; sản phẩm học sinh; minh chứng phối hợp với gia đình, cộng đồng.",
                "du_lieu_dinh_luong_goc": "Số hoạt động giáo dục được tổ chức trong năm; tỷ lệ học sinh tham gia các hoạt động giáo dục.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số hoạt động giáo dục được tổ chức trong năm",
                  "tỷ lệ học sinh tham gia các hoạt động giáo dục"
                ]
              }
            },
            {
              "ma": "3.4",
              "ten": "Quản lý, theo dõi, hỗ trợ học sinh và giáo dục hòa nhập",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường thực hiện tuyển sinh, tiếp nhận, quản lý hồ sơ học sinh và cập nhật thông tin về chuyên cần, học tập, rèn luyện, sức khỏe, an toàn, chuyển trường, nghỉ học kéo dài và nhu cầu hỗ trợ của học sinh theo quy định, bao gồm nhu cầu tư vấn học đường, hỗ trợ tâm lý hoặc công tác xã hội trường học khi cần. Nhà trường phối hợp với cha mẹ học sinh, giáo viên, nhân sự hỗ trợ, chuyên gia, cơ quan, tổ chức liên quan khi cần để hỗ trợ học sinh khó khăn, học sinh có nhu cầu đặc thù hoặc học sinh có nguy cơ bị bạo lực, bắt nạt, bắt nạt trực tuyến, khủng hoảng tâm lý, nguy cơ bị tổn thương; bảo đảm không phân biệt đối xử, tôn trọng, an toàn và bảo mật thông tin của học sinh."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng dữ liệu về chuyên cần, học tập, rèn luyện, sức khỏe, an toàn, tư vấn học đường, hỗ trợ tâm lý, công tác xã hội trường học, phản ánh, thông tin về sự cố và kết quả hỗ trợ để phát hiện sớm học sinh có nguy cơ hoặc cần hỗ trợ. Các biện pháp hỗ trợ được theo dõi, đánh giá và điều chỉnh phù hợp với nhu cầu của học sinh hoặc nhóm học sinh; có phối hợp với cha mẹ học sinh, chuyên gia, cơ quan, tổ chức liên quan khi cần. Kết quả hỗ trợ được sử dụng để xây dựng môi trường giáo dục hòa nhập, an toàn, tôn trọng sự khác biệt, bảo vệ học sinh và phòng ngừa rủi ro đối với học sinh."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý, theo dõi, hỗ trợ học sinh và giáo dục hòa nhập",
                "minh_chung_goi_y": "Hồ sơ học sinh; dữ liệu chuyên cần, học tập, rèn luyện, sức khỏe và an toàn; danh sách học sinh cần hỗ trợ; kế hoạch và hồ sơ hỗ trợ cá nhân hoặc nhóm; hồ sơ tư vấn học đường, hỗ trợ tâm lý; minh chứng phối hợp với cha mẹ học sinh và các tổ chức liên quan khi cần thiết.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "3.5",
              "ten": "Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của học sinh",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường thực hiện đánh giá, ghi nhận và quản lý kết quả học tập, rèn luyện, phẩm chất, năng lực và sự tiến bộ của học sinh theo quy định; theo dõi mức độ đạt yêu cầu về học tập, rèn luyện và phát triển của học sinh theo cấp học. Kết quả được theo dõi theo lớp, khối lớp, môn học/hoạt động giáo dục và nhóm học sinh khi cần; được sử dụng để trao đổi với học sinh, cha mẹ học sinh và điều chỉnh hoạt động dạy học, giáo dục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường phân tích kết quả học tập, rèn luyện, chuyên cần, sự tiến bộ, sản phẩm học tập, phản hồi phù hợp, kết quả hỗ trợ và nhu cầu của học sinh để điều chỉnh kế hoạch giáo dục, phương pháp dạy học, kiểm tra, đánh giá và biện pháp hỗ trợ. Kết quả theo dõi cho thấy sự tiến bộ của học sinh, sự cải thiện về kết quả học tập, rèn luyện hoặc hiệu quả hỗ trợ đối với học sinh cần hỗ trợ. Việc xem xét kết quả chú trọng đánh giá vì sự tiến bộ của học sinh, không yêu cầu mọi trường phải cao hơn mức trung bình của địa phương."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của học sinh",
                "minh_chung_goi_y": "Hồ sơ đánh giá học sinh; bảng tổng hợp kết quả học tập, rèn luyện theo lớp, khối, môn học/hoạt động giáo dục; hồ sơ chuyên cần; danh sách học sinh chưa đạt hoặc cần hỗ trợ; hồ sơ điều chỉnh dạy học và hỗ trợ sau đánh giá.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ học sinh đạt yêu cầu theo quy định; tỷ lệ học sinh hoàn thành chương trình/lớp học/cấp học (khi áp dụng); số học sinh chưa đạt hoặc cần hỗ trợ.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ học sinh đạt yêu cầu theo quy định",
                  "tỷ lệ học sinh hoàn thành chương trình/lớp học/cấp học (khi áp dụng)",
                  "số học sinh chưa đạt hoặc cần hỗ trợ"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 4,
          "ten": "Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội",
          "tieu_chi": [
            {
              "ma": "4.1",
              "ten": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường có cơ sở vật chất, phòng học, phòng chức năng nếu có, thiết bị dạy học, học liệu, thư viện hoặc nguồn học liệu, khu vệ sinh, sân chơi/bãi tập, hạ tầng công nghệ thông tin và kết nối mạng phục vụ hoạt động quản lý, dạy học, giáo dục theo quy định, phù hợp với cấp học, Chương trình giáo dục phổ thông và điều kiện thực tế. Các điều kiện này được quản lý, sử dụng, bảo trì, bảo quản và rà soát định kỳ để bảo đảm an toàn, hiệu quả và đáp ứng yêu cầu tổ chức hoạt động giáo dục."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng dữ liệu về tình trạng cơ sở vật chất, thiết bị dạy học, học liệu, thư viện, hạ tầng công nghệ thông tin, kết nối mạng và nhu cầu dạy học để lập kế hoạch sửa chữa, bảo trì, bổ sung, sắp xếp hoặc khai thác hiệu quả hơn. Nhà trường từng bước phát triển, sử dụng học liệu số, thiết bị công nghệ, công cụ số hoặc nền tảng hỗ trợ dạy học phù hợp với điều kiện thực tế; không áp dụng cứng các mô hình phòng học thông minh, thiết bị thông minh hoặc không gian học tập số như điều kiện tối thiểu đối với mọi trường. Việc cải thiện điều kiện giáo dục góp phần tạo môi trường học tập an toàn, thân thiện, linh hoạt, hòa nhập và hỗ trợ tốt hơn cho hoạt động dạy học, giáo dục."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục",
                "minh_chung_goi_y": "Hồ sơ phòng học, phòng chức năng; danh mục cơ sở vật chất, thiết bị dạy học, học liệu, thư viện; hồ sơ hạ tầng công nghệ thông tin, kết nối mạng; hồ sơ kiểm kê, bảo trì, sửa chữa, bổ sung; minh chứng khai thác thiết bị, học liệu và học liệu số.",
                "du_lieu_dinh_luong_goc": "Số phòng học đạt yêu cầu so với tổng số phòng học; số phòng chức năng hoặc không gian học tập đáp ứng yêu cầu khi áp dụng; số hạng mục cơ sở vật chất thiếu, xuống cấp hoặc cần sửa chữa; tỷ lệ thiết bị dạy học sử dụng được so với tổng số thiết bị; tỷ lệ lớp học bảo đảm sĩ số theo quy định.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số phòng học đạt yêu cầu so với tổng số phòng học",
                  "số phòng chức năng hoặc không gian học tập đáp ứng yêu cầu khi áp dụng",
                  "số hạng mục cơ sở vật chất thiếu, xuống cấp hoặc cần sửa chữa",
                  "tỷ lệ thiết bị dạy học sử dụng được so với tổng số thiết bị",
                  "tỷ lệ lớp học bảo đảm sĩ số theo quy định"
                ]
              }
            },
            {
              "ma": "4.2",
              "ten": "Môi trường giáo dục an toàn, tích cực, hỗ trợ phát triển học sinh",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường bảo đảm các điều kiện tối thiểu về vệ sinh, nước sạch, khu vệ sinh, ánh sáng, thông gió, sân chơi/bãi tập, an toàn thiết bị, phòng cháy chữa cháy, an toàn thực phẩm nếu có, an toàn số và bảo mật thông tin học sinh. Nhà trường thực hiện chăm sóc sức khỏe, phòng ngừa bạo lực học đường, xâm hại, bắt nạt, bắt nạt trực tuyến, tai nạn thương tích, khủng hoảng tâm lý và các rủi ro ảnh hưởng đến an toàn, sức khỏe, tinh thần của học sinh; có hồ sơ kiểm soát điều kiện an toàn, kiểm tra định kỳ, kênh tiếp nhận phản ánh, quy trình xử lý sự cố, hồ sơ xử lý sự cố và phối hợp với gia đình, cơ quan, tổ chức liên quan khi cần. Việc tiếp nhận, xử lý, hỗ trợ học sinh bảo đảm nguyên tắc bảo mật thông tin, tôn trọng, không kỳ thị và bảo vệ học sinh."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường phân tích dữ liệu về sức khỏe, an toàn, sự cố, phản ánh, khảo sát hoặc phản hồi phù hợp của học sinh, cha mẹ học sinh và đội ngũ để nhận diện nguy cơ, cải thiện môi trường giáo dục và giảm rủi ro. Việc khảo sát phản hồi, an toàn hoặc hài lòng nếu được thực hiện phải phù hợp với lứa tuổi học sinh, bảo đảm khách quan, bảo mật thông tin và không gây áp lực cho người trả lời. Nhà trường xây dựng nền nếp bảo đảm an toàn, chăm sóc sức khỏe, phòng ngừa bạo lực học đường, xâm hại, bắt nạt, bắt nạt trực tuyến, rủi ro trên môi trường số và hỗ trợ sức khỏe tinh thần của học sinh. Học sinh được tôn trọng, lắng nghe, bảo vệ, hỗ trợ phù hợp và tham gia xây dựng môi trường giáo dục an toàn, tích cực, hòa nhập. Nhà trường theo dõi kết quả sau khắc phục, sử dụng dữ liệu và phản hồi để điều chỉnh biện pháp phòng ngừa, xử lý, hỗ trợ và phòng ngừa tái diễn."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Môi trường giáo dục an toàn, tích cực, hỗ trợ phát triển học sinh",
                "minh_chung_goi_y": "Hồ sơ vệ sinh, an toàn trường học; hồ sơ y tế học đường; bảng kiểm an toàn, phòng cháy chữa cháy, an toàn thực phẩm nếu có; kênh tiếp nhận phản ánh; hồ sơ xử lý sự cố, bạo lực, bắt nạt, an toàn số; hồ sơ hỗ trợ tâm lý, bảo mật thông tin học sinh.",
                "du_lieu_dinh_luong_goc": "Số sự cố an toàn trường học được ghi nhận; số sự cố được xử lý theo quy trình; số trường hợp bạo lực, bắt nạt, xâm hại hoặc nguy cơ mất an toàn được xử lý; số học sinh được hỗ trợ về sức khỏe, tâm lý hoặc an toàn.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số sự cố an toàn trường học được ghi nhận",
                  "số sự cố được xử lý theo quy trình",
                  "số trường hợp bạo lực, bắt nạt, xâm hại hoặc nguy cơ mất an toàn được xử lý",
                  "số học sinh được hỗ trợ về sức khỏe, tâm lý hoặc an toàn"
                ]
              }
            },
            {
              "ma": "4.3",
              "ten": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhà trường duy trì kênh thông tin hai chiều với cha mẹ học sinh hoặc người giám hộ; thông báo kịp thời về chuyên cần, kết quả học tập, rèn luyện, sự tiến bộ, sức khỏe, an toàn và nhu cầu hỗ trợ của học sinh. Nhà trường tiếp nhận, phân loại, xử lý phản hồi theo phạm vi trách nhiệm; có kế hoạch hoặc chương trình phối hợp với gia đình, chính quyền, y tế, công an, cơ sở giáo dục nghề nghiệp, doanh nghiệp, tổ chức xã hội và các bên liên quan để chăm sóc sức khỏe, bảo đảm an toàn, giáo dục kỹ năng, hướng nghiệp, phân luồng, hỗ trợ học sinh và huy động nguồn lực hợp pháp theo quy định."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Nhà trường sử dụng phản hồi của cha mẹ học sinh, dữ liệu chuyên cần, kết quả học tập, rèn luyện, sức khỏe, an toàn và hồ sơ hỗ trợ học sinh để điều chỉnh hoạt động phối hợp với gia đình, cộng đồng và tổ chức liên quan. Cha mẹ học sinh tham gia phù hợp vào hoạt động giáo dục, bảo vệ an toàn, hướng nghiệp khi phù hợp và hỗ trợ học sinh. Nhà trường đánh giá hiệu quả phối hợp; sử dụng kết quả phối hợp để cải thiện chăm sóc sức khỏe, bảo đảm an toàn, giáo dục kỹ năng, hướng nghiệp, phân luồng, giáo dục hòa nhập, năng lực số, đổi mới sáng tạo khi phù hợp và môi trường giáo dục. Nguồn lực huy động được quản lý, sử dụng minh bạch, hợp pháp và có tác động tích cực đến an toàn, sự tiến bộ và phát triển của học sinh."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
                "minh_chung_goi_y": "Sổ liên lạc hoặc kênh thông tin điện tử; hồ sơ trao đổi hai chiều với cha mẹ học sinh; biên bản họp cha mẹ học sinh; hồ sơ phối hợp với chính quyền, y tế, công an, tổ chức xã hội, cơ sở giáo dục nghề nghiệp, doanh nghiệp khi phù hợp; hồ sơ huy động, quản lý và sử dụng nguồn lực theo quy định.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            }
          ]
        }
      ]
    },
    {
      "metadata": {
        "ma_van_ban": "57/2026/TT-BGDĐT",
        "ngay_ban_hanh": "2026-07-07",
        "ngay_hieu_luc": "2026-07-07",
        "phu_luc": "III",
        "loai_hinh": "gdtx",
        "ten": "Hướng dẫn nội dung, mức độ đáp ứng và thông tin minh chứng các tiêu chí bảo đảm chất lượng đối với cơ sở giáo dục thường xuyên",
        "nguon_chinh_thuc": "https://vanban.chinhphu.vn/?classid=1&docid=218991&pageid=27160&typegroupid=6",
        "nguon_trich_xuat_html": "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-57-2026-TT-BGDDT-bao-dam-chat-luong-giao-duc-co-so-giao-duc-mam-non-716471.aspx",
        "ghi_chu": "Dữ liệu được cấu trúc hóa từ nội dung Phụ lục III. Nguồn HTML hiển thị 'TC1.1' tại tiêu chí đầu tiên; mã được chuẩn hóa thành '1.1'."
      },
      "ghi_chu_phu_luc": "Trong Phụ lục này, “nhà trường” được hiểu là trung tâm giáo dục thường xuyên và trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên; “người học” được hiểu là học viên; “hoạt động giáo dục” bao gồm hoạt động dạy học, giáo dục, đào tạo, bồi dưỡng và các hoạt động hỗ trợ người học theo chức năng, nhiệm vụ của trung tâm; “nhân sự hỗ trợ giáo dục” được hiểu là viên chức, nhân viên hoặc người được phân công thực hiện các nhiệm vụ tư vấn, hỗ trợ hoạt động giáo dục, hướng nghiệp, quản lý học viên và vận hành trung tâm theo quy định và điều kiện thực tế.",
      "tieu_chuan": [
        {
          "so_thu_tu": 1,
          "ten": "Quản trị nhà trường và bảo đảm chất lượng",
          "tieu_chi": [
            {
              "ma": "1.1",
              "ten": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Xác định mục tiêu, chỉ tiêu, nhiệm vụ và kế hoạch phát triển/kế hoạch năm học phù hợp với nhiệm vụ giáo dục thường xuyên, điều kiện, nhu cầu nhân lực của địa phương, nhu cầu học tập của học viên, người dân và cộng đồng."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1 và có cải tiến thực chất: sử dụng dữ liệu, phản hồi của học viên, đội ngũ, các bên liên quan và kết quả tự đánh giá để rà soát, điều chỉnh mục tiêu, chỉ tiêu, nhiệm vụ, kế hoạch phát triển/năm học; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
                "minh_chung_goi_y": "Kế hoạch năm học; kế hoạch thực hiện từng chương trình giáo dục, khóa học; mục tiêu, chỉ tiêu, nhiệm vụ; quyết định của Giám đốc trung tâm; nghị quyết Hội đồng trường nếu có; biên bản họp lãnh đạo hoặc hội đồng chuyên môn; báo cáo kết quả thực hiện; minh chứng rà soát, điều chỉnh kế hoạch nếu có; minh chứng công khai kế hoạch và kết quả thực hiện.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.2",
              "ten": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Đáp ứng yêu cầu tối thiểu và vận hành ổn định: Trung tâm có cơ cấu tổ chức, phân công nhiệm vụ và cơ chế phối hợp nội bộ rõ ràng đối với cán bộ quản lý cơ sở giáo dục, giáo viên, nhân sự hỗ trợ giáo dục, tổ/bộ phận và người phụ trách nhiệm vụ trọng tâm; việc phân công phù hợp với quy mô, chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1 và có cải tiến thực chất: sử dụng dữ liệu, phản hồi của đội ngũ và kết quả tự đánh giá để rà soát, điều chỉnh cơ cấu tổ chức, phân công nhiệm vụ và cơ chế phối hợp nội bộ; các nhiệm vụ trọng tâm được thực hiện ổn định, hạn chế chồng chéo, bỏ sót hoặc quá tải."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ",
                "minh_chung_goi_y": "Quyết định thành lập, quy chế tổ chức và hoạt động; sơ đồ tổ chức; phân công nhiệm vụ; hồ sơ giao việc; biên bản họp, phối hợp nội bộ; minh chứng điều chỉnh phân công khi có thay đổi.",
                "du_lieu_dinh_luong_goc": "Không yêu cầu dữ liệu định lượng riêng.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": true,
                "chi_so_dinh_luong": []
              }
            },
            {
              "ma": "1.3",
              "ten": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Quản lý kế hoạch, tài chính, cơ sở vật chất, học liệu, nhân lực, hồ sơ học viên; thông tin về lớp, khóa học, tình trạng tham gia học tập, kết quả học tập, rèn luyện và thông tin về an toàn; thực hiện công khai thông tin theo quy định."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, hồ sơ điện tử, phần mềm hoặc cơ sở dữ liệu ngành nếu có, phản hồi của các bên liên quan và kết quả tự đánh giá để rà soát, điều chỉnh kế hoạch, nguồn lực, thông tin và dữ liệu; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý kế hoạch, nguồn lực, thông tin và dữ liệu",
                "minh_chung_goi_y": "Hồ sơ quản lý học viên; danh sách lớp/khóa học; dữ liệu chuyên cần/tham gia học tập; kết quả học tập, rèn luyện; hồ sơ tài chính, cơ sở vật chất, học liệu và nhân lực; hồ sơ điện tử hoặc phần mềm quản lý nếu có; báo cáo rà soát dữ liệu phục vụ quản lý.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ hồ sơ học viên được cập nhật đầy đủ, đúng thời hạn; tỷ lệ lớp/khóa học có dữ liệu tham gia học tập được cập nhật đầy đủ; số sai lệch dữ liệu được phát hiện và xử lý.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ hồ sơ học viên được cập nhật đầy đủ, đúng thời hạn",
                  "tỷ lệ lớp/khóa học có dữ liệu tham gia học tập được cập nhật đầy đủ",
                  "số sai lệch dữ liệu được phát hiện và xử lý"
                ]
              }
            },
            {
              "ma": "1.4",
              "ten": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Thực hiện tự kiểm tra/tự đánh giá, xác định vấn đề cần cải tiến, lập kế hoạch cải tiến, theo dõi kết quả, công khai thông tin và giải trình với cơ quan quản lý, học viên và các bên liên quan; có kênh tiếp nhận phản hồi phù hợp."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, các bên liên quan và kết quả tự đánh giá để điều chỉnh hoạt động tự đánh giá, cải tiến, công khai và giải trình; có minh chứng về kết quả cải tiến được theo dõi tối thiểu trong 01 chu kỳ, trong đó ưu tiên các nội dung liên quan đến duy trì học tập, hỗ trợ học viên và nâng cao hiệu quả hoạt động giáo dục qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tự đánh giá, cải tiến, công khai và trách nhiệm giải trình",
                "minh_chung_goi_y": "Báo cáo tự đánh giá hoặc tự kiểm tra; kế hoạch cải tiến; danh mục nhiệm vụ cải tiến, phân công thực hiện, thời hạn và kết quả; hồ sơ công khai, giải trình; phản hồi của học viên, đội ngũ và bên liên quan; minh chứng kết quả cải tiến.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch; số phản hồi được tiếp nhận, xử lý.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ nhiệm vụ cải tiến hoàn thành theo kế hoạch",
                  "số phản hồi được tiếp nhận, xử lý"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 2,
          "ten": "Phát triển đội ngũ",
          "tieu_chi": [
            {
              "ma": "2.1",
              "ten": "Cán bộ quản lý cơ sở giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Cán bộ quản lý cơ sở giáo dục có hồ sơ chức danh/phân công, đánh giá hằng năm, bồi dưỡng/tập huấn theo quy định hoặc kế hoạch; tổ chức quản lý, điều hành hoạt động của trung tâm phù hợp với nhiệm vụ giáo dục thường xuyên, chương trình, hình thức tổ chức hoạt động giáo dục và đặc điểm người học. Có hồ sơ, dữ liệu và phân công thực hiện."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh quản lý, phát triển đội ngũ và cải tiến hoạt động của trung tâm; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cán bộ quản lý cơ sở giáo dục",
                "minh_chung_goi_y": "Hồ sơ giám đốc, phó giám đốc hoặc cán bộ quản lý cơ sở giáo dục; quyết định phân công nhiệm vụ; hồ sơ đánh giá, bồi dưỡng; kế hoạch chỉ đạo, điều hành; hồ sơ kiểm tra nội bộ, tự đánh giá và cải tiến hoạt động quản lý.",
                "du_lieu_dinh_luong_goc": "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định; tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số cán bộ quản lý cơ sở giáo dục hiện có so với số lượng theo quy định",
                  "tỷ lệ cán bộ quản lý cơ sở giáo dục đáp ứng tiêu chuẩn chức danh"
                ]
              }
            },
            {
              "ma": "2.2",
              "ten": "Giáo viên",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Giáo viên có hồ sơ đáp ứng yêu cầu về trình độ, chuẩn/chức danh, phân công, kế hoạch dạy học, đánh giá học viên, sinh hoạt chuyên môn và bồi dưỡng phù hợp với chương trình giáo dục thường xuyên; giáo viên cơ hữu, hợp đồng, thỉnh giảng có đủ số lượng theo định mức hoặc phương án được phê duyệt; được phân công phù hợp với chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, kết quả đánh giá và kết quả tự đánh giá để điều chỉnh phương pháp dạy học, kiểm tra, đánh giá, hỗ trợ tự học, học tập linh hoạt và duy trì học tập của học viên; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Giáo viên",
                "minh_chung_goi_y": "Danh sách giáo viên cơ hữu, giáo viên hợp đồng, giáo viên thỉnh giảng hoặc giáo viên tham gia giảng dạy theo hợp đồng liên kết (nếu có); hồ sơ trình độ đào tạo, tiêu chuẩn chức danh nghề nghiệp; phân công giảng dạy; hồ sơ sinh hoạt chuyên môn, bồi dưỡng; hồ sơ kiểm tra, đánh giá kết quả học tập của học viên; minh chứng điều chỉnh hoạt động dạy học và hỗ trợ học viên.",
                "du_lieu_dinh_luong_goc": "Số giáo viên hiện có so với nhu cầu; số giáo viên thiếu hoặc thừa theo môn học/chương trình giáo dục; tỷ lệ giáo viên đạt chuẩn trình độ đào tạo hoặc tiêu chuẩn chức danh theo quy định; tỷ lệ giáo viên được phân công phù hợp chuyên môn.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số giáo viên hiện có so với nhu cầu",
                  "số giáo viên thiếu hoặc thừa theo môn học/chương trình giáo dục",
                  "tỷ lệ giáo viên đạt chuẩn trình độ đào tạo hoặc tiêu chuẩn chức danh theo quy định",
                  "tỷ lệ giáo viên được phân công phù hợp chuyên môn"
                ]
              }
            },
            {
              "ma": "2.3",
              "ten": "Nhân sự hỗ trợ giáo dục",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Nhân viên, giáo viên hoặc người được phân công, kiêm nhiệm được bố trí để thực hiện nhiệm vụ tư vấn hỗ trợ học tập, hướng nghiệp, tư vấn y tế, thư viện/học liệu, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn/hỗ trợ học viên nếu có, phù hợp với quy định, quy mô và điều kiện thực tế."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để rà soát, điều chỉnh phân công, phối hợp và bồi dưỡng nhân sự hỗ trợ giáo dục; các nhiệm vụ hỗ trợ học viên, an toàn và vận hành trung tâm được thực hiện ổn định; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Nhân sự hỗ trợ giáo dục",
                "minh_chung_goi_y": "Danh sách nhân viên hoặc người được giao kiêm nhiệm thực hiện nhiệm vụ hỗ trợ giáo dục; phân công nhiệm vụ học vụ, thư viện hoặc học liệu, thiết bị, công nghệ thông tin, hành chính, tài chính, bảo vệ, tư vấn, hỗ trợ học viên khi có; hồ sơ tập huấn và kết quả thực hiện nhiệm vụ.",
                "du_lieu_dinh_luong_goc": "Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu; tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số vị trí nhân sự hỗ trợ hiện có so với số vị trí theo yêu cầu",
                  "tỷ lệ vị trí hỗ trợ được bố trí đáp ứng yêu cầu"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 3,
          "ten": "Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học",
          "tieu_chi": [
            {
              "ma": "3.1",
              "ten": "Tổ chức thực hiện chương trình giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Tổ chức thực hiện chương trình/kế hoạch giáo dục theo năm học, học kỳ, tháng/tuần hoặc khóa học; theo dõi tiến độ, tình hình tham gia học tập, kết quả học tập và điều chỉnh khi phát sinh, phù hợp với chương trình, hình thức tổ chức hoạt động giáo dục và điều kiện thực tế. Có hồ sơ, dữ liệu và phân công thực hiện."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu về tiến độ, tình hình tham gia học tập, kết quả học tập, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để điều chỉnh chương trình/kế hoạch giáo dục, thời khóa biểu hoặc hình thức tổ chức hoạt động giáo dục khi phù hợp; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức thực hiện chương trình giáo dục",
                "minh_chung_goi_y": "Kế hoạch giáo dục theo năm học, học kỳ, tháng/tuần hoặc khóa học; lịch học/thời khóa biểu; hồ sơ lớp/khóa học; báo cáo tiến độ; hồ sơ điều chỉnh, bù đắp nội dung khi phát sinh; minh chứng thực hiện đầy đủ nội dung chương trình.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ hoàn thành chương trình/kế hoạch giáo dục; tỷ lệ duy trì tiến độ đúng kế hoạch.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ hoàn thành chương trình/kế hoạch giáo dục",
                  "tỷ lệ duy trì tiến độ đúng kế hoạch"
                ]
              }
            },
            {
              "ma": "3.2",
              "ten": "Đổi mới phương pháp dạy học và theo dõi, đánh giá sự phát triển, tiến bộ của người học",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Giáo viên áp dụng phương pháp dạy học linh hoạt, phù hợp với đặc điểm người học, điều kiện học tập, chương trình và hình thức tổ chức hoạt động giáo dục; thực hiện kiểm tra, đánh giá kết quả học tập của học viên theo quy định. Kết quả kiểm tra, đánh giá được sử dụng để điều chỉnh dạy học và hỗ trợ học viên duy trì học tập."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, kết quả kiểm tra, đánh giá và kết quả tự đánh giá để điều chỉnh phương pháp dạy học, hình thức kiểm tra, đánh giá và hoạt động hỗ trợ học viên; ứng dụng công nghệ thông tin, công nghệ số hoặc học liệu phù hợp khi có điều kiện; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Đổi mới phương pháp dạy học và kiểm tra, đánh giá người học",
                "minh_chung_goi_y": "Kế hoạch bài dạy; hồ sơ dự giờ, sinh hoạt chuyên môn; hồ sơ kiểm tra, đánh giá kết quả học tập của học viên; phản hồi của học viên; minh chứng điều chỉnh phương pháp dạy học, kiểm tra, đánh giá, hỗ trợ tự học, học tập linh hoạt, học tập kết hợp và duy trì học tập.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ học viên đạt yêu cầu theo quy định; số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp dạy học, kiểm tra, đánh giá hoặc hỗ trợ học tập.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ học viên đạt yêu cầu theo quy định",
                  "số chuyên đề sinh hoạt chuyên môn gắn với đổi mới phương pháp dạy học, kiểm tra, đánh giá hoặc hỗ trợ học tập"
                ]
              }
            },
            {
              "ma": "3.3",
              "ten": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Tổ chức hoạt động giáo dục bổ trợ về kỹ năng sống, giáo dục công dân, hướng nghiệp/phân luồng, năng lực số, hoạt động cộng đồng, tác phong học tập, tác phong lao động, an toàn hoặc nội dung phù hợp với chương trình và điều kiện học viên."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh hoạt động giáo dục bổ trợ, hướng nghiệp, phân luồng, năng lực số hoặc hoạt động cộng đồng; phối hợp với tổ chức, cá nhân liên quan khi phù hợp để nâng cao hiệu quả hoạt động; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Tổ chức hoạt động giáo dục và phát triển toàn diện",
                "minh_chung_goi_y": "Kế hoạch và hồ sơ hoạt động trải nghiệm, hướng nghiệp, phân luồng, giáo dục kỹ năng sống, năng lực số, học tập suốt đời, hoạt động cộng đồng hoặc nội dung bổ trợ phù hợp; sản phẩm hoạt động, dữ liệu tham gia, phản hồi của học viên.",
                "du_lieu_dinh_luong_goc": "Số hoạt động giáo dục bổ trợ được tổ chức trong năm học/khóa học; tỷ lệ học viên tham gia các hoạt động giáo dục bổ trợ.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số hoạt động giáo dục bổ trợ được tổ chức trong năm học/khóa học",
                  "tỷ lệ học viên tham gia các hoạt động giáo dục bổ trợ"
                ]
              }
            },
            {
              "ma": "3.4",
              "ten": "Quản lý, theo dõi, hỗ trợ người học và giáo dục hòa nhập",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Quản lý hồ sơ học viên, theo dõi chuyên cần/tham gia học tập, nhận diện học viên có nguy cơ ngừng học/bỏ học hoặc cần hỗ trợ; thực hiện biện pháp tư vấn, phối hợp hoặc hỗ trợ phù hợp, bảo đảm không phân biệt đối xử."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu chuyên cần/tham gia học tập, kết quả học tập, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để điều chỉnh biện pháp quản lý, theo dõi, tư vấn, hỗ trợ học viên và giáo dục hòa nhập; có minh chứng kết quả sau hỗ trợ hoặc cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Quản lý, theo dõi, hỗ trợ người học và giáo dục hòa nhập",
                "minh_chung_goi_y": "Hồ sơ học viên; dữ liệu chuyên cần/tham gia học tập; danh sách học viên cần hỗ trợ, có nguy cơ ngừng học, bỏ học hoặc mất kết nối học tập trực tuyến; kế hoạch hỗ trợ cá nhân/nhóm; hồ sơ tư vấn, phối hợp, kết quả hỗ trợ; hồ sơ bảo mật thông tin.",
                "du_lieu_dinh_luong_goc": "Số học viên có nguy cơ ngừng học, bỏ học hoặc cần hỗ trợ được theo dõi, hỗ trợ; số lượt tư vấn, hỗ trợ người học theo nhu cầu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số học viên có nguy cơ ngừng học, bỏ học hoặc cần hỗ trợ được theo dõi, hỗ trợ",
                  "số lượt tư vấn, hỗ trợ người học theo nhu cầu"
                ]
              }
            },
            {
              "ma": "3.5",
              "ten": "Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của người học",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Theo dõi kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn, sự tiến bộ của học viên, kết quả hỗ trợ, học tiếp, học nghề hoặc việc làm (dữ liệu việc làm thu thập tùy thuộc điều kiện) khi có dữ liệu hợp pháp. Có hồ sơ, dữ liệu và phân công thực hiện."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn, kết quả hỗ trợ, học tiếp, học nghề hoặc việc làm khi có dữ liệu hợp pháp, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để điều chỉnh hoạt động dạy học, kiểm tra, đánh giá và hỗ trợ học viên; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Kết quả học tập, phát triển, rèn luyện và sự tiến bộ của người học",
                "minh_chung_goi_y": "Bảng tổng hợp kết quả học tập, rèn luyện, hoàn thành chương trình/giai đoạn; dữ liệu chuyên cần, duy trì học tập; kết quả hỗ trợ; dữ liệu học tiếp, học nghề hoặc việc làm khi có dữ liệu hợp pháp hoặc phù hợp với chương trình giáo dục; báo cáo phân tích xu hướng và tiến bộ.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ học viên hoàn thành chương trình/giai đoạn/khóa học; số học viên chưa đạt yêu cầu hoặc cần hỗ trợ; xu hướng kết quả theo năm học hoặc khóa học khi có dữ liệu.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ học viên hoàn thành chương trình/giai đoạn/khóa học",
                  "số học viên chưa đạt yêu cầu hoặc cần hỗ trợ",
                  "xu hướng kết quả theo năm học hoặc khóa học khi có dữ liệu"
                ]
              }
            }
          ]
        },
        {
          "so_thu_tu": 4,
          "ten": "Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội",
          "tieu_chi": [
            {
              "ma": "4.1",
              "ten": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Có phòng học, thiết bị, học liệu, thư viện/nguồn học liệu, hạ tầng kỹ thuật/số, khu vệ sinh và điều kiện tổ chức dạy học trực tiếp, học trực tuyến hoặc kết hợp khi có điều kiện; quản lý, sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ hoạt động giáo dục theo quy định, bao gồm việc khai thác, sử dụng nguồn lực hợp pháp nếu có."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu kiểm kê, sử dụng cơ sở vật chất, thiết bị, học liệu, phản hồi của học viên, đội ngũ và kết quả tự đánh giá để rà soát, bảo trì, bổ sung, điều chỉnh hoặc đề xuất cải thiện điều kiện giáo dục; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Cơ sở vật chất, thiết bị, học liệu và hạ tầng kỹ thuật phục vụ hoạt động giáo dục",
                "minh_chung_goi_y": "Hồ sơ phòng học, phòng chức năng, thiết bị, học liệu, thư viện/nguồn học liệu, hạ tầng kỹ thuật/số, khu vệ sinh; kiểm kê, bảo trì, sửa chữa, bổ sung; minh chứng sử dụng cơ sở vật chất, thiết bị, học liệu phục vụ dạy học; hồ sơ phối hợp, liên kết sử dụng cơ sở vật chất, thiết bị, học liệu hoặc nguồn lực hợp pháp khác nếu có.",
                "du_lieu_dinh_luong_goc": "Tỷ lệ phòng đạt chuẩn (%); tỷ lệ thiết bị hoạt động tốt (%); Tỷ lệ sử dụng thiết bị (%); số hạng mục sửa chữa/bổ sung/năm.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Tỷ lệ phòng đạt chuẩn (%)",
                  "tỷ lệ thiết bị hoạt động tốt (%)",
                  "Tỷ lệ sử dụng thiết bị (%)",
                  "số hạng mục sửa chữa/bổ sung/năm"
                ]
              }
            },
            {
              "ma": "4.2",
              "ten": "Môi trường giáo dục an toàn, sức khỏe và hạnh phúc",
              "la_bat_buoc": true,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Kiểm soát điều kiện vệ sinh, nước sạch, ánh sáng, thông gió, an toàn thiết bị, phòng cháy chữa cháy, an toàn số, bảo mật thông tin, sức khỏe, tâm lý, tư vấn/hỗ trợ và xử lý sự cố; bảo đảm an toàn khi tổ chức hoạt động thực hành, thực tập hoặc hoạt động liên kết nếu có. Có hồ sơ, dữ liệu và phân công thực hiện."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu về an toàn, sức khỏe, sự cố, phản hồi của học viên, đội ngũ, bên liên quan và kết quả tự đánh giá để phòng ngừa rủi ro, cải thiện môi trường giáo dục an toàn, lành mạnh, thân thiện, phù hợp với đặc điểm học viên; có minh chứng kết quả sau cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Môi trường giáo dục an toàn, sức khỏe và hạnh phúc",
                "minh_chung_goi_y": "Bảng kiểm an toàn; hồ sơ vệ sinh, nước sạch, ánh sáng, thông gió, phòng cháy chữa cháy, an toàn số, bảo mật thông tin; hồ sơ sự cố, xử lý và phòng ngừa; hồ sơ tư vấn/hỗ trợ học viên; khảo sát/phản hồi ẩn danh nếu triển khai.",
                "du_lieu_dinh_luong_goc": "Số sự cố/năm; tỷ lệ xử lý sự cố đúng quy trình (%); tỷ lệ giảm sự cố qua các năm (%); mức độ hài lòng môi trường giáo dục (%) nếu khảo sát.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số sự cố/năm",
                  "tỷ lệ xử lý sự cố đúng quy trình (%)",
                  "tỷ lệ giảm sự cố qua các năm (%)",
                  "mức độ hài lòng môi trường giáo dục (%) nếu khảo sát"
                ]
              }
            },
            {
              "ma": "4.3",
              "ten": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
              "la_bat_buoc": false,
              "muc_do": [
                {
                  "muc": 1,
                  "noi_dung_yeu_cau": "Duy trì kênh liên lạc với học viên; phối hợp với gia đình/người giám hộ khi phù hợp, chính quyền, y tế, công an, cơ sở giáo dục, cơ sở giáo dục nghề nghiệp, doanh nghiệp sử dụng lao động, tổ chức xã hội để hỗ trợ học viên, bảo đảm an toàn, hướng nghiệp, phân luồng, học tiếp, học nghề và học tập suốt đời. Có hồ sơ, dữ liệu và phân công thực hiện."
                },
                {
                  "muc": 2,
                  "noi_dung_yeu_cau": "Đạt Mức 1; sử dụng dữ liệu, phản hồi của học viên, gia đình/người giám hộ khi phù hợp, cộng đồng, tổ chức liên quan và kết quả tự đánh giá để điều chỉnh hoạt động phối hợp, huy động và sử dụng nguồn lực hợp pháp; có minh chứng kết quả sau phối hợp hoặc cải tiến qua chu kỳ."
                }
              ],
              "thong_tin_minh_chung": {
                "nhom_noi_dung": "Phối hợp với gia đình, cộng đồng và tổ chức liên quan",
                "minh_chung_goi_y": "Kế hoạch phối hợp; kênh thông tin với học viên, gia đình/người giám hộ khi phù hợp; hồ sơ phối hợp với chính quyền, y tế, công an, cơ sở giáo dục nghề nghiệp, doanh nghiệp, tổ chức xã hội; minh chứng phối hợp, hỗ trợ từ các tổ chức, cá nhân theo quy định (nếu có); minh chứng kết quả hoặc tác động của hoạt động phối hợp.",
                "du_lieu_dinh_luong_goc": "Số hoạt động phối hợp trong năm học/khóa học; số người học được hỗ trợ hoặc hưởng lợi từ hoạt động phối hợp.",
                "khong_yeu_cau_du_lieu_dinh_luong_rieng": false,
                "chi_so_dinh_luong": [
                  "Số hoạt động phối hợp trong năm học/khóa học",
                  "số người học được hỗ trợ hoặc hưởng lợi từ hoạt động phối hợp"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
$tt57$::jsonb;
  v_bo jsonb;
  v_standard jsonb;
  v_criterion jsonb;
  v_level jsonb;
  v_indicator text;
  v_bo_id uuid;
  v_tieu_chuan_id uuid;
  v_tieu_chi_id uuid;
  v_loai_hinh text;
  v_ma_van_ban text := v_data #>> '{metadata,ma_van_ban}';
  v_ngay_hieu_luc date := (v_data #>> '{metadata,ngay_hieu_luc}')::date;
  v_expected_standards integer;
  v_expected_criteria integer;
  v_expected_levels integer;
  v_expected_evidence integer;
  v_expected_indicators integer;
  v_actual integer;
  v_indicator_index integer;
begin
  for v_bo in select value from jsonb_array_elements(v_data->'bo_tieu_chuan')
  loop
    v_loai_hinh := v_bo #>> '{metadata,loai_hinh}';

    -- Lay lai bo tieu chuan khung da seed truoc do neu co, ke ca ban ghi dung ma khong dau "TT-BGDDT".
    select id into v_bo_id
    from bo_tieu_chuan
    where loai_hinh = v_loai_hinh::loai_hinh_co_so
      and version = 1
      and ma_van_ban in (v_ma_van_ban, '57/2026/TT-BGDDT')
    order by created_at asc
    limit 1;

    if v_bo_id is null then
      insert into bo_tieu_chuan(ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai)
      values (
        v_ma_van_ban,
        v_bo #>> '{metadata,ten}',
        v_ngay_hieu_luc,
        v_loai_hinh::loai_hinh_co_so,
        1,
        'dang_ap_dung'
      )
      returning id into v_bo_id;
    else
      update bo_tieu_chuan
      set ma_van_ban = v_ma_van_ban,
          ten = v_bo #>> '{metadata,ten}',
          ngay_hieu_luc = v_ngay_hieu_luc,
          trang_thai = 'dang_ap_dung',
          updated_at = now()
      where id = v_bo_id;
    end if;

    for v_standard in select value from jsonb_array_elements(v_bo->'tieu_chuan')
    loop
      insert into tieu_chuan(bo_id, so_thu_tu, ten)
      values (
        v_bo_id,
        (v_standard->>'so_thu_tu')::smallint,
        v_standard->>'ten'
      )
      on conflict (bo_id, so_thu_tu) do update
        set ten = excluded.ten,
            updated_at = now()
      returning id into v_tieu_chuan_id;

      for v_criterion in select value from jsonb_array_elements(v_standard->'tieu_chi')
      loop
        insert into tieu_chi(
          tieu_chuan_id,
          ma,
          ten,
          la_bat_buoc,
          loai_hinh_ap_dung,
          thu_tu
        )
        values (
          v_tieu_chuan_id,
          v_criterion->>'ma',
          v_criterion->>'ten',
          (v_criterion->>'la_bat_buoc')::boolean,
          v_loai_hinh::loai_hinh_co_so,
          split_part(v_criterion->>'ma', '.', 2)::smallint
        )
        on conflict (tieu_chuan_id, ma) do update
          set ten = excluded.ten,
              la_bat_buoc = excluded.la_bat_buoc,
              loai_hinh_ap_dung = excluded.loai_hinh_ap_dung,
              thu_tu = excluded.thu_tu,
              updated_at = now()
        returning id into v_tieu_chi_id;

        for v_level in select value from jsonb_array_elements(v_criterion->'muc_do')
        loop
          insert into muc_tieu_chi(tieu_chi_id, muc, noi_dung_yeu_cau)
          values (
            v_tieu_chi_id,
            (v_level->>'muc')::smallint,
            v_level->>'noi_dung_yeu_cau'
          )
          on conflict (tieu_chi_id, muc) do update
            set noi_dung_yeu_cau = excluded.noi_dung_yeu_cau,
                updated_at = now();
        end loop;

        delete from minh_chung_goi_y where tieu_chi_id = v_tieu_chi_id;
        insert into minh_chung_goi_y(tieu_chi_id, nhom_noi_dung, mo_ta, thu_tu)
        values (
          v_tieu_chi_id,
          v_criterion #>> '{thong_tin_minh_chung,nhom_noi_dung}',
          v_criterion #>> '{thong_tin_minh_chung,minh_chung_goi_y}',
          1
        );

        delete from chi_so_dinh_luong where tieu_chi_id = v_tieu_chi_id;
        v_indicator_index := 0;
        for v_indicator in
          select value
          from jsonb_array_elements_text(v_criterion #> '{thong_tin_minh_chung,chi_so_dinh_luong}')
        loop
          v_indicator_index := v_indicator_index + 1;
          insert into chi_so_dinh_luong(tieu_chi_id, ma, ten_chi_so, don_vi, cong_thuc, thu_tu)
          values (
            v_tieu_chi_id,
            'CS.' || (v_criterion->>'ma') || '.' || lpad(v_indicator_index::text, 2, '0'),
            v_indicator,
            null,
            null,
            v_indicator_index
          );
        end loop;
      end loop;
    end loop;

    select count(*) into v_expected_standards
    from jsonb_array_elements(v_bo->'tieu_chuan');

    select count(*) into v_expected_criteria
    from jsonb_path_query(v_bo, '$.tieu_chuan[*].tieu_chi[*]');

    select count(*) into v_expected_levels
    from jsonb_path_query(v_bo, '$.tieu_chuan[*].tieu_chi[*].muc_do[*]');

    select count(*) into v_expected_evidence
    from jsonb_path_query(v_bo, '$.tieu_chuan[*].tieu_chi[*].thong_tin_minh_chung.minh_chung_goi_y');

    select count(*) into v_expected_indicators
    from jsonb_path_query(v_bo, '$.tieu_chuan[*].tieu_chi[*].thong_tin_minh_chung.chi_so_dinh_luong[*]');

    select count(*) into v_actual from tieu_chuan where bo_id = v_bo_id;
    if v_actual <> v_expected_standards then
      raise exception 'TT57 %: sai so tieu chuan, expected %, actual %', v_loai_hinh, v_expected_standards, v_actual;
    end if;

    select count(*) into v_actual
    from tieu_chi tc
    join tieu_chuan tcu on tcu.id = tc.tieu_chuan_id
    where tcu.bo_id = v_bo_id;
    if v_actual <> v_expected_criteria then
      raise exception 'TT57 %: sai so tieu chi, expected %, actual %', v_loai_hinh, v_expected_criteria, v_actual;
    end if;

    select count(*) into v_actual
    from muc_tieu_chi mtc
    join tieu_chi tc on tc.id = mtc.tieu_chi_id
    join tieu_chuan tcu on tcu.id = tc.tieu_chuan_id
    where tcu.bo_id = v_bo_id;
    if v_actual <> v_expected_levels then
      raise exception 'TT57 %: sai so muc, expected %, actual %', v_loai_hinh, v_expected_levels, v_actual;
    end if;

    select count(*) into v_actual
    from minh_chung_goi_y mcgy
    join tieu_chi tc on tc.id = mcgy.tieu_chi_id
    join tieu_chuan tcu on tcu.id = tc.tieu_chuan_id
    where tcu.bo_id = v_bo_id;
    if v_actual <> v_expected_evidence then
      raise exception 'TT57 %: sai so nhom minh chung goi y, expected %, actual %', v_loai_hinh, v_expected_evidence, v_actual;
    end if;

    select count(*) into v_actual
    from chi_so_dinh_luong csdl
    join tieu_chi tc on tc.id = csdl.tieu_chi_id
    join tieu_chuan tcu on tcu.id = tc.tieu_chuan_id
    where tcu.bo_id = v_bo_id;
    if v_actual <> v_expected_indicators then
      raise exception 'TT57 %: sai so chi so dinh luong, expected %, actual %', v_loai_hinh, v_expected_indicators, v_actual;
    end if;
  end loop;
end;
$$;

commit;
