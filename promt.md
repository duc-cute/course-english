<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soạn đề thi - Course English</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F8FAFC; }
    </style>
</head>
<body class="text-slate-800 antialiased flex h-screen overflow-hidden">

    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col z-20 hidden md:flex">
        <div class="h-16 flex items-center px-6 border-b border-slate-100">
            <div class="w-8 h-8 bg-[#0052cc] rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-md">E</div>
            <h1 class="font-bold text-[15px] tracking-tight">Course English</h1>
        </div>
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <a href="#" class="flex items-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"><span class="text-[14px] font-medium">Tổng quan</span></a>
            <a href="#" class="flex items-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"><span class="text-[14px] font-medium">Lịch dạy</span></a>
            <a href="#" class="flex items-center px-3 py-2.5 bg-[#0052cc] text-white rounded-xl shadow-md shadow-[#0052cc]/20 transition-all mt-4">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <span class="text-[14px] font-medium">Đề thi / Kiểm tra</span>
            </a>
        </nav>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden relative">

        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
            <div class="flex items-center text-sm">
                <a href="#" class="text-slate-400 hover:text-[#0052cc] font-medium flex items-center transition-colors">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Danh sách đề
                </a>
                <span class="mx-2 text-slate-300">/</span>
                <span class="font-bold text-slate-800">Soạn đề thi mới</span>
            </div>

            <div class="flex items-center space-x-3">
                <div class="relative group">
                    <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                        <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Nhập nhanh từ...
                        <svg class="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div class="p-1 space-y-1">
                            <a href="#" class="block px-3 py-2 text-[13px] text-slate-600 hover:bg-blue-50 hover:text-[#0052cc] rounded-lg">✨ Tự động bằng AI (Word/PDF)</a>
                            <a href="#" class="block px-3 py-2 text-[13px] text-slate-600 hover:bg-blue-50 hover:text-[#0052cc] rounded-lg">📊 Import từ Excel</a>
                        </div>
                    </div>
                </div>

                <button class="px-5 py-2 bg-[#0052cc] border border-[#0052cc] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-800 transition-colors shadow-sm shadow-[#0052cc]/20 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    Lưu đề thi
                </button>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto p-8">
            <div class="max-w-5xl mx-auto space-y-6">

                <div>
                    <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Thiết lập cấu trúc đề</h2>
                    <p class="text-[13px] text-slate-500 mt-1">Điền thông tin cơ bản và bắt đầu thêm các phần câu hỏi.</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div class="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                        <h3 class="text-[14px] font-bold text-slate-800 mb-5 flex items-center">
                            <span class="w-2 h-2 rounded-full bg-[#0052cc] mr-2"></span> Thông tin chung
                        </h3>
                        <div class="space-y-5">
                            <div>
                                <label class="block text-[12px] font-semibold text-slate-600 mb-1.5">Tên đề thi <span class="text-red-500">*</span></label>
                                <input type="text" placeholder="Nhập tên đề thi..." value="Đề thi mới" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all">
                            </div>
                            <div>
                                <label class="block text-[12px] font-semibold text-slate-600 mb-1.5">Hướng dẫn toàn đề (Tùy chọn)</label>
                                <textarea rows="3" placeholder="Nhập lời khuyên hoặc hướng dẫn làm bài cho học sinh..." class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                        <h3 class="text-[14px] font-bold text-slate-800 mb-5 flex items-center">
                            <span class="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> Cài đặt
                        </h3>
                        <div class="space-y-5">
                            <div>
                                <label class="block text-[12px] font-semibold text-slate-600 mb-1.5">Thời gian làm bài</label>
                                <div class="relative">
                                    <input type="number" placeholder="0" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all">
                                    <span class="absolute right-4 top-2.5 text-[13px] text-slate-400">phút</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[12px] font-semibold text-slate-600 mb-1.5">Điểm đạt (Pass)</label>
                                <div class="relative">
                                    <input type="number" value="80" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all">
                                    <span class="absolute right-4 top-2.5 text-[13px] text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[12px] font-semibold text-slate-600 mb-1.5">Trạng thái xuất bản</label>
                                <select class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-600 focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all cursor-pointer">
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Xuất bản</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div class="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 class="text-[14px] font-bold text-slate-800">Nội dung câu hỏi</h3>
                        <div class="flex space-x-2">
                            <span class="bg-white border border-slate-200 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">0 PHẦN</span>
                            <span class="bg-white border border-slate-200 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">0 CÂU HỎI</span>
                        </div>
                    </div>

                    <div class="px-6 py-20 flex flex-col items-center justify-center text-center bg-slate-50/30 border-2 border-dashed border-slate-200 m-6 rounded-xl">

                        <div class="w-16 h-16 bg-blue-50 text-[#0052cc] rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>

                        <h4 class="text-[16px] font-bold text-slate-800 mb-2">Đề thi chưa có câu hỏi nào</h4>
                        <p class="text-[13px] text-slate-500 max-w-sm mb-6 leading-relaxed">
                            Bắt đầu bằng cách tạo một phần thi (Section) trống hoặc tự động sinh câu hỏi bằng trí tuệ nhân tạo.
                        </p>

                        <div class="flex space-x-3">
                            <button class="px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-[13px] font-semibold hover:border-[#0052cc] hover:text-[#0052cc] transition-colors flex items-center">
                                ✨ Sinh bằng AI
                            </button>
                            <button class="px-4 py-2 bg-blue-50 text-[#0052cc] rounded-xl text-[13px] font-bold hover:bg-blue-100 transition-colors flex items-center shadow-sm">
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                Thêm Section mới
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>

</body>
</html>
