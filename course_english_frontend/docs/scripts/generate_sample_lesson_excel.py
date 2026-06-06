"""Generate sample lesson Excel for manual data entry in Cell Studio admin."""

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

OUT = Path(__file__).resolve().parent.parent / "mau-bai-hoc-te-bao-thuc-vat.xlsx"

HEADER_FILL = PatternFill("solid", fgColor="DCE9FF")
WRAP = Alignment(wrap_text=True, vertical="top")


def set_header_row(ws, headers):
    ws.append(headers)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.font = Font(bold=True)
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def autosize(ws, max_width=72):
    for col in ws.columns:
        letter = get_column_letter(col[0].column)
        length = max(len(str(c.value or "")) for c in col)
        ws.column_dimensions[letter].width = min(max_width, max(12, length + 2))


def main():
    wb = Workbook()

    # --- Sheet 1: Hướng dẫn ---
    ws0 = wb.active
    ws0.title = "Huong_dan"
    guide = [
        ["Cách dùng file mẫu này"],
        [""],
        ["1. Sheet 'Bai_hoc': tạo bài trong Admin → Quản lý bài học (môn Sinh học)."],
        ["2. Sheet 'Blocks': thêm từng block theo thứ tự cot A; copy nội dung TEXT vào editor (dùng H2 cho tiêu đề mục lục)."],
        ["3. Sheet 'Assets': upload ảnh theo mô tả; block IMAGE chọn asset sau khi upload."],
        ["4. CELL_VIEWER / CELL_STEP: chọn cellId plant hoặc animal trong editor; payload tham khảo cot G."],
        ["5. Publish bài → xem tại Khu vực học sinh → Bài học."],
        ["6. File này KHÔNG import tự động — chỉ là kịch bản soạn tay."],
        [""],
        ["Lưu ý ảnh: bạn tự tìm ảnh minh họa; caption ghi trong sheet Assets."],
    ]
    for row in guide:
        ws0.append(row)
    ws0["A1"].font = Font(bold=True, size=14)
    ws0.column_dimensions["A"].width = 88

    # --- Sheet 2: Bài học ---
    ws1 = wb.create_sheet("Bai_hoc")
    set_header_row(
        ws1,
        [
            "title",
            "summary",
            "subject_name",
            "display_order",
            "status_sau_khi_soan",
            "ghi_chu",
        ],
    )
    ws1.append(
        [
            "Khám phá tế bào thực vật",
            "Tìm hiểu cấu trúc tế bào thực vật qua lý thuyết, hình minh họa và mô hình 3D tương tác — từ màng sinh chất đến lục lạp.",
            "Sinh học",
            1,
            "PUBLISHED",
            "Tạo môn Sinh học + lớp trước nếu chưa có. Publish sau khi thêm đủ block.",
        ]
    )
    autosize(ws1)

    # --- Sheet 3: Blocks ---
    ws2 = wb.create_sheet("Blocks")
    set_header_row(
        ws2,
        [
            "thu_tu",
            "block_type",
            "tieu_de_h2_muc_luc",
            "noi_dung_TEXT_html",
            "mo_ta_anh_neu_IMAGE",
            "caption_anh",
            "payload_CELL_VIEWER",
            "payload_CELL_STEP",
            "ghi_chu_thao_tac",
        ],
    )

    blocks = [
        (
            1,
            "TEXT",
            "Mục tiêu bài học",
            """<h2>Mục tiêu bài học</h2>
<p>Sau khi hoàn thành bài này, bạn có thể:</p>
<ul>
<li>Phân biệt tế bào thực vật và tế bào động vật ở mức cơ bản.</li>
<li>Nêu chức năng của <strong>màng sinh chất</strong>, <strong>nhân</strong>, <strong>lục lạp</strong> và <strong>không bào</strong>.</li>
<li>Quan sát các bào quan trên <strong>mô hình 3D</strong> và mô tả vị trí tương đối.</li>
</ul>""",
            "",
            "",
            "",
            "",
            "Dán vào block TEXT; giữ thẻ H2 để mục lục hiện đúng.",
        ),
        (
            2,
            "TEXT",
            "Tế bào thực vật — khái niệm",
            """<h2>Tế bào thực vật — khái niệm</h2>
<p>Tế bào thực vật có <strong>thành tế bào</strong> bên ngoài màng sinh chất, giúp tạo hình dạng và bảo vệ tế bào. Bên trong có <strong>không bào</strong> chứa dịch bào — nơi diễn ra nhiều phản ứng hóa học.</p>
<p>Điểm đặc trưng so với tế bào động vật: có <strong>lục lạp</strong> (quang hợp) và thường có <strong>không bào lớn</strong>.</p>""",
            "",
            "",
            "",
            "",
            "",
        ),
        (
            3,
            "IMAGE",
            "Hình minh họa",
            "",
            "Ảnh sơ đồ cắt ngang tế bào thực vật (có nhãn: thành tế bào, màng sinh chất, nhân, lục lạp, không bào). Nền trắng hoặc pastel, dễ đọc.",
            "Hình 1. Sơ đồ cấu trúc tế bào thực vật (minh họa).",
            "",
            "",
            "Upload ảnh → block IMAGE → chọn asset; điền caption.",
        ),
        (
            4,
            "CELL_VIEWER",
            "Mô hình 3D",
            "",
            "",
            "",
            '{"cellId":"plant","defaultOrganelle":"nucleus"}',
            "",
            "Block CELL_VIEWER: chọn tế bào thực vật (plant), focus nhân.",
        ),
        (
            5,
            "TEXT",
            "Các bào quan chính",
            """<h2>Các bào quan chính</h2>
<ol>
<li><strong>Thành tế bào</strong> — cellulose, cứng, bảo vệ.</li>
<li><strong>Màng sinh chất</strong> — kiểm soát vật chất ra vào.</li>
<li><strong>Nhân</strong> — chứa ADN, điều khiển hoạt động sống.</li>
<li><strong>Lục lạp</strong> — tổng hợp hữu cơ từ CO₂ và nước (quang hợp).</li>
<li><strong>Không bào</strong> — dự trữ nước, ion, hỗ trợ áp suất nước.</li>
</ol>
<blockquote>Hãy mở mô hình 3D phía trên và bấm từng bào quan để xem mô tả.</blockquote>""",
            "",
            "",
            "",
            "",
            "",
        ),
        (
            6,
            "CELL_STEP",
            "Thực hành từng bước",
            "",
            "",
            "",
            "",
            """cellId: plant
Bước 1 | cell_wall | Quan sát thành tế bào — lớp bảo vệ ngoài cùng.
Bước 2 | cell_membrane | Xem màng sinh chất sát bên trong thành tế bào.
Bước 3 | nucleus | Tìm nhân — cấu trúc điều khiển của tế bào.
Bước 4 | chloroplast | Quan sát lục lạp — nơi diễn ra quang hợp.
Bước 5 | vacuole | Không bào lớn — dự trữ và giữ áp suất.""",
            "Nhập trong editor CELL_STEP (hoặc tham chiếu organelleId trong app).",
        ),
        (
            7,
            "TEXT",
            "Tóm tắt",
            """<h2>Tóm tắt</h2>
<p>Tế bào thực vật có thành tế bào, lục lạp và thường có không bào lớn. Kết hợp <strong>đọc lý thuyết</strong>, <strong>hình minh họa</strong> và <strong>thực hành 3D</strong> giúp ghi nhớ lâu hơn.</p>
<p><em>Gợi ý ôn tập:</em> vẽ lại sơ đồ không nhìn tài liệu, sau đó đối chiếu với Hình 1 và mô hình 3D.</p>""",
            "",
            "",
            "",
            "",
            "",
        ),
    ]

    for b in blocks:
        row = list(b)
        ws2.append(row)
        for c in ws2[ws2.max_row]:
            c.alignment = WRAP

    autosize(ws2, 80)

    # --- Sheet 4: Assets ---
    ws3 = wb.create_sheet("Assets")
    set_header_row(
        ws3,
        [
            "thu_tu",
            "type",
            "mo_ta_file_can_tim",
            "caption",
            "dung_cho_block",
            "ghi_chu",
        ],
    )
    ws3.append(
        [
            1,
            "IMAGE",
            "Sơ đồ tế bào thực vật có nhãn tiếng Việt hoặc song ngữ; độ phân giải ≥ 800px; PNG/JPG.",
            "Hình 1. Sơ đồ cấu trúc tế bào thực vật (minh họa).",
            "Block 3 - IMAGE",
            "Upload: Admin editor block IMAGE hoặc POST /files folder lessons/{lessonId}",
        ]
    )
    autosize(ws3)

    wb.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
