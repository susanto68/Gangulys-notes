/* Adds a "Visualize this algorithm" button to Java Lab pages that have a
   matching page in the Algorithm Visual Lab. Include it with:
     <script src="visual-lab-link.js" data-algo="bubble-sort" defer></script>
   Change VISUAL_LAB_BASE if the Visual Lab is deployed somewhere else. */
(function () {
  var VISUAL_LAB_BASE = "https://quantum-computing-visual-lab.vercel.app";

  var ROUTES = {
    "linear-search": "/algorithms/searching/linear-search",
    "binary-search": "/algorithms/searching/binary-search",
    "bubble-sort": "/algorithms/sorting/bubble-sort",
    "selection-sort": "/algorithms/sorting/selection-sort"
  };
  var NAMES = {
    "linear-search": "Linear Search",
    "binary-search": "Binary Search",
    "bubble-sort": "Bubble Sort",
    "selection-sort": "Selection Sort"
  };

  var script = document.currentScript;
  var algo = script && script.getAttribute("data-algo");
  if (!algo || !ROUTES[algo]) return;

  function addButton() {
    var bar = document.querySelector(".topbar");
    if (!bar || bar.querySelector(".visual-lab-btn")) return;
    var a = document.createElement("a");
    a.className = "visual-lab-btn";
    a.href = VISUAL_LAB_BASE + ROUTES[algo];
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Visualize →";
    a.title = "Open " + NAMES[algo] + " in the Algorithm Visual Lab: step-by-step animation, pseudocode and Java code";
    a.setAttribute("aria-label", "Visualize " + NAMES[algo] + " in the Algorithm Visual Lab (opens in a new tab)");
    a.style.cssText =
      "flex:0 0 auto;color:#fff;background:#f59e0b;text-decoration:none;font-weight:700;" +
      "font-size:14px;padding:7px 12px;border-radius:999px;white-space:nowrap;";
    var h1 = bar.querySelector("h1");
    if (h1 && h1.nextSibling) bar.insertBefore(a, h1.nextSibling);
    else bar.appendChild(a);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
  else addButton();
})();
