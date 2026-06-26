1. Tối giản Output Schema (Cắt giảm Output Tokens)
   Mỗi ký tự LLM sinh ra đều tốn thời gian. Nhìn vào cấu trúc JSON của bạn, có những trường (fields) không cần thiết bắt AI phải sinh ra.

Trạng thái hiện tại: AI đang phải sinh ra các trường như "tempId": "q1", "selected": true, "promptLang": "en", "displayOrder": 0.

Cách tối ưu: Bỏ ngay các trường này khỏi Prompt Example. AI chỉ cần sinh ra questionType, promptText, explanation và choices (chỉ chứa choiceText và correct).

Tại Backend (Spring Boot): Sau khi nhận JSON về, hàm AiQuestionGenResultValidator của bạn sẽ tự động vòng lặp (loop) qua các câu hỏi để gắn thêm UUID cho tempId, set selected = true, gắn promptLang dựa trên config ban đầu, và đánh số displayOrder cho mảng.

Hiệu quả: Giảm được 15-20% số lượng output tokens, tiết kiệm trực tiếp hàng chục giây.

2. Cap Input Excerpt (Giảm Time-To-First-Token)
   Ở mục 3, bạn đang đẩy tối đa 100k ký tự (extracted_text) vào prompt.

Dù input tokens không làm chậm quá trình sinh câu hỏi, nhưng nó làm chậm quá trình đọc hiểu ban đầu (Time-To-First-Token - TTFT) và làm loãng sự chú ý (Attention) của model.

Cách tối ưu: Implement ngay biến AI_GEN_EXCERPT_CHARS. Nếu user upload 100k ký tự, ở pha này, bạn chỉ nên cắt khoảng 10.000 - 15.000 ký tự (tương đương 3-5 trang A4) nội dung cốt lõi nhất để gửi đi.

3. "Parallel Batching" Đúng Cách (Chìa khóa giải quyết Wall-clock time)
   Ở mục 13, bạn đã thử Batching nhưng revert lại vì: tốn input tokens, lỗi schema, lệch số câu. Tuy nhiên, nếu muốn gen 50 câu mà thời gian chỉ bằng gen 10 câu, Parallel Batching là con đường duy nhất.

Đây là cách thiết kế lại luồng Batching trong Spring Boot để không bị fail như lần trước:

Chấp nhận lặp Input: Flash model có giá Input token cực rẻ ($0.07/1M token). Đừng lo việc gửi 10.000 ký tự excerpt 4 lần cùng lúc. Đổi lại, bạn tiết kiệm được 5 phút của người dùng.

Chia nhỏ logic: Thay vì gọi 1 request 20 câu (gồm 10 MCQ, 10 Fill Blank), AiQuestionGenerationService sẽ tạo ra 2 tác vụ CompletableFuture<AiQuestionGenEnvelopeDTO> chạy song song qua aiTaskExecutor:

Request 1: Chỉ system prompt của MCQ, yêu cầu đúng 10 câu.

Request 2: Chỉ system prompt của Fill Blank, yêu cầu đúng 10 câu.

Xử lý Lệch số câu / Skeleton JSON: \* Viết một Aggregator ở Backend chờ cả 2 Future hoàn thành.

Nếu Request 1 trả về 8 câu hợp lệ (thay vì 10) và 2 câu bị lỗi (thiếu promptText), bạn đừng gộp mảng rồi báo lỗi cả Task. Hãy lưu 8 câu đó vào Database, và ở UI hiển thị: "Đã sinh thành công 18/20 câu (Bỏ qua 2 câu lỗi định dạng)".

UX này hoàn toàn chấp nhận được với tính năng AI (Human-in-the-loop). Người dùng có quyền thêm/bớt sau đó.

4. Nâng cấp trải nghiệm Stream (Perceived Performance)
   Bạn đang dùng Stream (chatJsonStream) nhưng chỉ để cập nhật progress_message ("Đã nhận 1.2k ký tự"). Việc này chỉ cho user thấy hệ thống không bị "chết", nhưng họ vẫn phải chờ.

Cách tối ưu ở Frontend: Sử dụng một thư viện parse JSON theo luồng (ví dụ: partial-json hoặc các kỹ thuật regex) trên React.

Khi Backend đẩy SSE từng chunk, FE tiến hành parse. Bất cứ khi nào nó match được một object {...} hoàn chỉnh của một câu hỏi, nó lập tức render câu hỏi đó ra màn hình Preview luôn (kiểu hiệu ứng gõ phím).

User vừa có thể bắt đầu đọc/sửa câu số 1, số 2 trong khi AI vẫn đang hì hục gen câu số 20 ở dưới. Chờ đợi sẽ không còn là vấn đề.

Bạn thấy phương án tối giản Schema (số 1) hay chia CompletableFuture (số 3) dễ dàng triển khai ngay vào kiến trúc code hiện tại của bạn hơn?
