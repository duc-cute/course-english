# -*- coding: utf-8 -*-
"""Assemble REVIEW.html with tabs, checklists, and localStorage progress."""
from pathlib import Path
import re

root = Path(__file__).parent
src = root.parent / "public" / "docs" / "REVIEW.html"
lc_tab = (root / "_learning_tab.html").read_text(encoding="utf-8")
st_tab = (root / "_student_tab.html").read_text(encoding="utf-8")
html = src.read_text(encoding="utf-8")

extra_css = """
      .progress-panel {
        background: var(--paper-deep);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 16px 18px;
        margin: 0 0 24px;
      }
      .progress-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .progress-pct { color: var(--accent); font-weight: 700; }
      .progress-track {
        height: 8px;
        background: var(--line);
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--accent);
        border-radius: 999px;
        transition: width 200ms ease;
      }
      .progress-note { font-size: 12px; color: var(--muted); margin: 8px 0 0; }
      .link-btn {
        background: none;
        border: 0;
        padding: 0;
        color: var(--info);
        cursor: pointer;
        font-size: inherit;
        text-decoration: underline;
      }
      ul.checklist {
        list-style: none;
        padding: 0;
        margin: 12px 0 20px;
      }
      ul.checklist li {
        margin: 0;
        border-bottom: 1px solid var(--line);
      }
      ul.checklist li:last-child { border-bottom: 0; }
      ul.checklist label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        cursor: pointer;
        font-size: 14px;
      }
      ul.checklist label:hover { background: var(--accent-soft); }
      ul.checklist input[type="checkbox"] {
        margin-top: 3px;
        width: 16px;
        height: 16px;
        accent-color: var(--accent);
        flex-shrink: 0;
      }
      ul.checklist li.is-done label span {
        text-decoration: line-through;
        color: var(--muted);
      }
      .check-summary {
        font-size: 13px;
        color: var(--muted);
        margin: 4px 0 12px;
      }
      .tabs .tab-badge {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 6px;
        background: var(--warning-soft);
        color: var(--warning);
      }
"""

if ".progress-panel" not in html:
    html = html.replace(
        "      .callout strong {\n        color: var(--info);\n      }",
        "      .callout strong {\n        color: var(--info);\n      }\n" + extra_css,
    )

sidebar_new = """      <aside class="sidebar">
        <h2>Mục lục</h2>
        <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Khung theo <code>promt.md</code></p>
        <ul class="toc toc-group is-active" data-toc="review">
          <li><a href="#overview">1. Tổng quan</a></li>
          <li><a href="#module-tracker">2. Tracker 9 module</a></li>
          <li class="sub"><a href="#chk-auth">2.1 Auth</a></li>
          <li class="sub"><a href="#chk-course">2.2 Course</a></li>
          <li><a href="#" data-switch-tab="learning">→ 2.3 Learning Content (tab)</a></li>
          <li class="sub"><a href="#chk-quiz">2.4 Quiz</a></li>
          <li class="sub"><a href="#chk-assign">2.5 Assignment</a></li>
          <li class="sub"><a href="#chk-progress">2.6 Progress</a></li>
          <li class="sub"><a href="#chk-dash">2.7 Dashboard</a></li>
          <li class="sub"><a href="#chk-notify">2.8 Notify</a></li>
          <li class="sub"><a href="#chk-comm">2.9 Comm</a></li>
          <li><a href="#master-flow">3. Luồng tổng</a></li>
          <li><a href="#module-priority">6. MVP / V2 / V3</a></li>
          <li><a href="#sitemap">7. Sitemap</a></li>
          <li><a href="#user-journeys">8. Journey</a></li>
          <li><a href="#impl-status">12. Hiện trạng code</a></li>
          <li><a href="#lessons-core">13. Thiết kế Lesson</a></li>
          <li><a href="#execution-plan">14. Sprint</a></li>
          <li><a href="#summary">Tổng kết</a></li>
        </ul>
        <ul class="toc toc-group" data-toc="learning">
          <li><a href="#lc-progress-panel">Tiến độ</a></li>
          <li><a href="#lc-foundation">A. Nền tảng CMS</a></li>
          <li><a href="#lc-text">B. Rich text</a></li>
          <li><a href="#lc-image">C. Images</a></li>
          <li><a href="#lc-video">D. Video</a></li>
          <li><a href="#lc-audio">E. Audio</a></li>
          <li><a href="#lc-pdf">F. PDF</a></li>
          <li><a href="#lc-vocab">G. Vocabulary</a></li>
          <li><a href="#lc-grammar">H. Grammar</a></li>
          <li><a href="#lc-summary">I. Summary</a></li>
          <li><a href="#lc-inline-quiz">J. Quick quiz</a></li>
          <li><a href="#lc-cross">K. Chất lượng</a></li>
        </ul>
      </aside>"""

html = re.sub(r"      <aside class=\"sidebar\">.*?</aside>", sidebar_new, html, count=1, flags=re.S)

tabs_html = """
        <nav class="tabs" role="tablist">
          <button type="button" role="tab" class="is-active" data-tab="review" aria-selected="true">Product Review</button>
          <button type="button" role="tab" data-tab="learning" aria-selected="false">
            Learning Content <span class="tab-badge">2.3 · chi tiết</span>
          </button>
        </nav>
        <div class="progress-panel" id="review-progress-panel">
          <div class="progress-head">
            <strong>Tiến độ 9 module (Product Review)</strong>
            <span class="progress-pct" id="review-progress-pct">0%</span>
          </div>
          <div class="progress-track"><div class="progress-fill" id="review-progress-fill" style="width:0%"></div></div>
          <p class="progress-note">Đã tick <span id="review-progress-count">0</span> / <span id="review-progress-total">0</span> ·
            Module <strong>2.3</strong> theo dõi riêng ở tab Learning Content ·
            <button type="button" class="link-btn" id="review-reset-defaults">Đặt lại P0</button> ·
            <button type="button" class="link-btn" id="review-clear-all">Xóa tick</button>
          </p>
        </div>
        <section class="tab-panel is-active" data-panel="review" role="tabpanel">
"""

if 'data-tab="review"' not in html:
    html = html.replace(
        '        <div class="callout">',
        tabs_html + '\n        <div class="callout">',
        1,
    )

tracker = """
        <h2 class="section" id="module-tracker">2. Tracker tiến độ — 9 module (promt.md)</h2>
        <p class="lead">Tick các hạng mục đã hoàn thành. Tiến độ lưu trên trình duyệt (<code>localStorage</code>). <strong>Module 2.3 Learning Content</strong> có tab riêng với checklist chi tiết (~70 mục).</p>
        <p class="check-summary" id="mod-progress-summary"></p>

        <h3 id="chk-auth">2.1 Authentication</h3>
        <ul class="checklist" data-group="mod-auth">
          <li><label><input type="checkbox" data-check-id="mod.auth.login" data-default="1" /><span>Login + JWT + refresh</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.auth.register" data-default="1" /><span>Register</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.auth.rbac" data-default="1" /><span>Role &amp; permission CRUD</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.auth.forgot" /><span>Forgot password (V2)</span></label></li>
        </ul>

        <h3 id="chk-course">2.2 Course Management</h3>
        <ul class="checklist" data-group="mod-course">
          <li><label><input type="checkbox" data-check-id="mod.course.classroom" data-default="1" /><span>Classroom CRUD</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.course.subject" data-default="1" /><span>Subject (Unit) CRUD</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.course.lesson" data-default="1" /><span>Lesson CRUD + publish</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.course.enroll" data-default="1" /><span>Enrollment</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.course.filter" /><span>Filter bài theo enrollment (P1)</span></label></li>
        </ul>

        <h3 id="chk-content-link">2.3 Learning Content</h3>
        <div class="card info">
          <p><strong>Module quan trọng nhất</strong> — Video, Audio, PDF, Rich text, Vocabulary, Grammar, Images (theo <code>promt.md</code>).</p>
          <p style="margin-bottom:0">Mở tab <button type="button" class="link-btn" data-switch-tab="learning">Learning Content</button> để tick <strong>từng hạng mục kỹ thuật</strong> (TEXT, IMAGE, VIDEO, AUDIO, PDF, Vocab, CALLOUT, SUMMARY, QUESTION_REF…).</p>
        </div>

        <h3 id="chk-quiz">2.4 Quiz System</h3>
        <ul class="checklist" data-group="mod-quiz">
          <li><label><input type="checkbox" data-check-id="mod.quiz.bank" /><span>Question bank (V2)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.quiz.mcq" /><span>MCQ + T/F + auto-grade</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.quiz.fill" /><span>Fill blank, Matching, Drag-drop</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.quiz.listen" /><span>Listening quiz</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.quiz.speak" /><span>Speaking (V3)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.quiz.random" /><span>Random câu/đáp án + time limit + retry</span></label></li>
        </ul>

        <h3 id="chk-assign">2.5 Assignment</h3>
        <ul class="checklist" data-group="mod-assign">
          <li><label><input type="checkbox" data-check-id="mod.assign.hw" /><span>Homework + due date (V2)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.assign.test" /><span>Practice / Midterm / Final</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.assign.submit" /><span>Submit + grade + feedback</span></label></li>
        </ul>

        <h3 id="chk-progress">2.6 Progress</h3>
        <ul class="checklist" data-group="mod-progress">
          <li><label><input type="checkbox" data-check-id="mod.prog.local" data-default="1" /><span>Lesson progress localStorage</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.prog.api" /><span>Progress API server (P1)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.prog.streak" /><span>Streak (V2)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.prog.history" /><span>Learning history (V2)</span></label></li>
        </ul>

        <h3 id="chk-dash">2.7 Dashboard</h3>
        <ul class="checklist" data-group="mod-dash">
          <li><label><input type="checkbox" data-check-id="mod.dash.student" data-default="1" /><span>Student home + continue (cơ bản)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.dash.teacher" /><span>Teacher: weak students, pending grade (V2)</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.dash.admin" /><span>Admin: totals report (V2)</span></label></li>
        </ul>

        <h3 id="chk-notify">2.8 Notification</h3>
        <ul class="checklist" data-group="mod-notify">
          <li><label><input type="checkbox" data-check-id="mod.n.due" /><span>Assignment due reminder</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.n.lesson" /><span>New lesson notification</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.n.quiz" /><span>Quiz result notification</span></label></li>
        </ul>

        <h3 id="chk-comm">2.9 Communication</h3>
        <ul class="checklist" data-group="mod-comm">
          <li><label><input type="checkbox" data-check-id="mod.c.comment" /><span>Teacher comments</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.c.announce" /><span>Announcements</span></label></li>
          <li><label><input type="checkbox" data-check-id="mod.c.discuss" /><span>Discussion (V3)</span></label></li>
        </ul>

        <details class="card" style="margin-top:24px">
          <summary style="cursor:pointer;font-weight:600">Bảng chi tiết module (tham khảo — không tick)</summary>
"""

html = re.sub(
    r'        <h2 class="section" id="nine-modules">.*?(?=        <h2 class="section" id="master-flow">)',
    tracker,
    html,
    count=1,
    flags=re.S,
)

# Close details before master-flow
html = html.replace(
    '        <h2 class="section" id="master-flow">',
    '        </details>\n\n        <h2 class="section" id="master-flow">',
    1,
)

# Update callout links
html = html.replace(
    '<a href="#nine-modules">Mục 2</a>',
    '<a href="#module-tracker">Mục 2 (tracker)</a>',
)

# Close review tab panel + append learning tab before footer in main
close_and_lc = """
        </section>
""" + lc_tab + "\n"

html = html.replace(
    '        <footer class="page-foot">',
    close_and_lc + '        <footer class="page-foot">',
    1,
)

progress_js = """
      (function () {
        var STORAGE_KEY = "course-english.review.checks.v1";

        function loadState() {
          try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
          } catch (e) {
            return {};
          }
        }

        function saveState(state) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          } catch (e) {}
        }

        function allCheckboxes() {
          return Array.prototype.slice.call(
            document.querySelectorAll("input[type=checkbox][data-check-id]")
          );
        }

        function applyCheckbox(box, state) {
          var id = box.getAttribute("data-check-id");
          var def = box.getAttribute("data-default") === "1";
          if (state[id] === undefined) {
            box.checked = def;
          } else {
            box.checked = !!state[id];
          }
          var li = box.closest("li");
          if (li) li.classList.toggle("is-done", box.checked);
        }

        function readStateFromDom() {
          var state = {};
          allCheckboxes().forEach(function (box) {
            state[box.getAttribute("data-check-id")] = box.checked;
          });
          return state;
        }

        function updateProgress(scope) {
          var boxes = scope
            ? Array.prototype.slice.call(scope.querySelectorAll("input[data-check-id]"))
            : allCheckboxes();
          var done = boxes.filter(function (b) { return b.checked; }).length;
          var total = boxes.length;
          var pct = total ? Math.round((done / total) * 100) : 0;

          if (scope && scope.getAttribute("data-panel") === "learning") {
            var elPct = document.getElementById("lc-progress-pct");
            var elFill = document.getElementById("lc-progress-fill");
            var elCount = document.getElementById("lc-progress-count");
            var elTotal = document.getElementById("lc-progress-total");
            if (elPct) elPct.textContent = pct + "%";
            if (elFill) elFill.style.width = pct + "%";
            if (elCount) elCount.textContent = String(done);
            if (elTotal) elTotal.textContent = String(total);
          } else if (!scope || scope.getAttribute("data-panel") === "review") {
            var rPct = document.getElementById("review-progress-pct");
            var rFill = document.getElementById("review-progress-fill");
            var rCount = document.getElementById("review-progress-count");
            var rTotal = document.getElementById("review-progress-total");
            var reviewPanel = document.querySelector('[data-panel="review"]');
            var reviewBoxes = reviewPanel
              ? Array.prototype.slice.call(reviewPanel.querySelectorAll("input[data-check-id]"))
              : [];
            var rDone = reviewBoxes.filter(function (b) { return b.checked; }).length;
            var rTot = reviewBoxes.length;
            var rP = rTot ? Math.round((rDone / rTot) * 100) : 0;
            if (rPct) rPct.textContent = rP + "%";
            if (rFill) rFill.style.width = rP + "%";
            if (rCount) rCount.textContent = String(rDone);
            if (rTotal) rTotal.textContent = String(rTot);
            var summary = document.getElementById("mod-progress-summary");
            if (summary) {
              summary.textContent =
                "Product Review: " + rDone + "/" + rTot + " mục module · Mở tab Learning Content cho checklist 2.3 chi tiết.";
            }
          }
        }

        function bindCheckboxes() {
          var state = loadState();
          allCheckboxes().forEach(function (box) {
            applyCheckbox(box, state);
          });
          updateProgress(document.querySelector('[data-panel="learning"]'));
          updateProgress(document.querySelector('[data-panel="review"]'));

          allCheckboxes().forEach(function (box) {
            box.addEventListener("change", function () {
              var li = box.closest("li");
              if (li) li.classList.toggle("is-done", box.checked);
              saveState(readStateFromDom());
              var panel = box.closest(".tab-panel");
              updateProgress(panel);
              updateProgress(document.querySelector('[data-panel="review"]'));
            });
          });
        }

        function setDefaults(scope) {
          var boxes = scope
            ? Array.prototype.slice.call(scope.querySelectorAll("input[data-check-id]"))
            : allCheckboxes();
          boxes.forEach(function (box) {
            box.checked = box.getAttribute("data-default") === "1";
            var li = box.closest("li");
            if (li) li.classList.toggle("is-done", box.checked);
          });
          saveState(readStateFromDom());
          updateProgress(scope);
          updateProgress(document.querySelector('[data-panel="review"]'));
        }

        function clearAll(scope) {
          var boxes = scope
            ? Array.prototype.slice.call(scope.querySelectorAll("input[data-check-id]"))
            : allCheckboxes();
          boxes.forEach(function (box) {
            box.checked = false;
            var li = box.closest("li");
            if (li) li.classList.remove("is-done");
          });
          saveState(readStateFromDom());
          updateProgress(scope);
          updateProgress(document.querySelector('[data-panel="review"]'));
        }

        function switchTab(name) {
          document.querySelectorAll(".tabs button[data-tab]").forEach(function (btn) {
            var active = btn.getAttribute("data-tab") === name;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-selected", active ? "true" : "false");
          });
          document.querySelectorAll(".tab-panel").forEach(function (panel) {
            panel.classList.toggle("is-active", panel.getAttribute("data-panel") === name);
          });
          document.querySelectorAll(".toc-group").forEach(function (toc) {
            toc.classList.toggle("is-active", toc.getAttribute("data-toc") === name);
          });
          var reviewProg = document.getElementById("review-progress-panel");
          if (reviewProg) reviewProg.style.display = name === "review" ? "" : "none";
        }

        document.querySelectorAll(".tabs button[data-tab]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            switchTab(btn.getAttribute("data-tab"));
          });
        });

        document.querySelectorAll("[data-switch-tab]").forEach(function (el) {
          el.addEventListener("click", function (e) {
            e.preventDefault();
            switchTab(el.getAttribute("data-switch-tab"));
          });
        });

        var lcReset = document.getElementById("lc-reset-defaults");
        var lcClear = document.getElementById("lc-clear-all");
        var reviewReset = document.getElementById("review-reset-defaults");
        var reviewClear = document.getElementById("review-clear-all");
        if (lcReset) {
          lcReset.addEventListener("click", function () {
            setDefaults(document.querySelector('[data-panel="learning"]'));
          });
        }
        if (lcClear) {
          lcClear.addEventListener("click", function () {
            clearAll(document.querySelector('[data-panel="learning"]'));
          });
        }
        if (reviewReset) {
          reviewReset.addEventListener("click", function () {
            setDefaults(document.querySelector('[data-panel="review"]'));
          });
        }
        if (reviewClear) {
          reviewClear.addEventListener("click", function () {
            clearAll(document.querySelector('[data-panel="review"]'));
          });
        }

        bindCheckboxes();

        document.querySelectorAll(".toc a[href^='#']").forEach(function (link) {
          link.addEventListener("click", function (event) {
            var href = link.getAttribute("href");
            if (!href || href.length < 2 || href === "#") return;
            var target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            var panel = target.closest(".tab-panel");
            if (panel) {
              switchTab(panel.getAttribute("data-panel"));
            }
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      })();
"""

html = re.sub(
    r"    <script>\s*\(function \(\) \{.*?</script>",
    "    <script>" + progress_js + "\n    </script>",
    html,
    count=1,
    flags=re.S,
)

out_docs = root / "REVIEW.html"
out_public = root.parent / "public" / "docs" / "REVIEW.html"
out_docs.write_text(html, encoding="utf-8")
out_public.write_text(html, encoding="utf-8")
print("Wrote", out_docs, "and", out_public, "—", len(html), "chars")
