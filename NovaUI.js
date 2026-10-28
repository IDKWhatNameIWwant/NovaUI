
(() => {
  // NOVA UI - a simple browser UI library

  const style = document.createElement("style");

  style.textContent = `
    #nova-root {
      position: fixed;
      top: 80px;
      left: 80px;
      width: 360px;
      max-width: calc(100vw - 24px);
      background: #111018;
      color: #f4f0ff;
      font: 14px Arial, sans-serif;
      border: 1px solid #8b5cf6;
      border-radius: 12px;
      overflow: hidden;
      z-index: 2147483647;
      box-shadow: 0 12px 45px #0009;
    }

    #nova-root * { box-sizing: border-box; }

    #nova-root .nova-header {
      padding: 16px;
      background: #211a30;
      color: #c4b5fd;
      font-weight: bold;
      cursor: move;
      user-select: none;
      display: flex;
      justify-content: space-between;
    }

    #nova-root .nova-tabs {
      display: flex;
      gap: 6px;
      padding: 10px;
      overflow-x: auto;
    }

    #nova-root button {
      cursor: pointer;
      color: #eee7ff;
      background: #252031;
      border: 1px solid #443754;
      border-radius: 7px;
      padding: 9px 12px;
    }

    #nova-root button:hover { border-color: #a78bfa; }
    #nova-root button.active { background: #7c3aed; }

    #nova-root .nova-page { padding: 12px; }
    #nova-root .nova-section {
      color: #a78bfa;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1.5px;
      margin: 10px 0;
    }

    #nova-root .nova-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      margin-bottom: 8px;
      background: #191720;
      border: 1px solid #30283b;
      border-radius: 8px;
    }

    #nova-root .nova-item small {
      display: block;
      color: #aaa2ba;
      margin-top: 5px;
    }

    #nova-root button.nova-on { background: #7c3aed; }
  `;

  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "nova-root";

  root.innerHTML = `
    <div class="nova-header">
      <span class="nova-title">✦ NOVA</span>
      <button class="nova-close">×</button>
    </div>
    <div class="nova-tabs"></div>
    <div class="nova-content"></div>
  `;

  document.body.appendChild(root);

  const header = root.querySelector(".nova-header");
  const tabsBar = root.querySelector(".nova-tabs");
  const content = root.querySelector(".nova-content");
  const allTabs = [];

  root.querySelector(".nova-close").onclick = () => {
    root.remove();
    style.remove();
  };

  // Make the window draggable.
  let drag = null;

  header.addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;

    drag = {
      x: event.clientX - root.offsetLeft,
      y: event.clientY - root.offsetTop
    };

    header.setPointerCapture(event.pointerId);
  });

  header.addEventListener("pointermove", event => {
    if (!drag) return;

    root.style.left = Math.max(
      0, Math.min(innerWidth - root.offsetWidth, event.clientX - drag.x)
    ) + "px";

    root.style.top = Math.max(
      0, Math.min(innerHeight - root.offsetHeight, event.clientY - drag.y)
    ) + "px";
  });

  header.addEventListener("pointerup", () => drag = null);
  header.addEventListener("pointercancel", () => drag = null);

  function createWindow(options = {}) {
    root.querySelector(".nova-title").textContent =
      "✦ " + (options.name || "NOVA");

    function createTab(name) {
      const tabButton = document.createElement("button");
      tabButton.textContent = name;
      tabsBar.appendChild(tabButton);

      const page = document.createElement("div");
      page.className = "nova-page";
      page.hidden = true;
      content.appendChild(page);

      const tab = {
        button: tabButton,
        page,

        select() {
          allTabs.forEach(tab => {
            tab.page.hidden = true;
            tab.button.classList.remove("active");
          });

          page.hidden = false;
          tabButton.classList.add("active");
        },

        createSection(name) {
          const section = document.createElement("div");
          section.className = "nova-section";
          section.textContent = name.toUpperCase();
          page.appendChild(section);
          return section;
        },

        createButton(options = {}) {
          const row = document.createElement("div");
          row.className = "nova-item";

          const info = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = options.name || "Button";
          info.appendChild(title);

          if (options.description) {
            const desc = document.createElement("small");
            desc.textContent = options.description;
            info.appendChild(desc);
          }

          const button = document.createElement("button");
          button.textContent = options.text || "RUN";

          button.onclick = () => {
            try {
              if (options.callback) options.callback();
            } catch (error) {
              console.error("[NovaUI] Button error:", error);
            }
          };

          row.append(info, button);
          page.appendChild(row);

          return button;
        },

        createToggle(options = {}) {
          let value = Boolean(options.default);

          const row = document.createElement("div");
          row.className = "nova-item";

          const info = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = options.name || "Toggle";
          info.appendChild(title);

          if (options.description) {
            const desc = document.createElement("small");
            desc.textContent = options.description;
            info.appendChild(desc);
          }

          const button = document.createElement("button");
          row.append(info, button);
          page.appendChild(row);

          function update() {
            button.textContent = value ? "ON" : "OFF";
            button.classList.toggle("nova-on", value);
          }

          button.onclick = () => {
            value = !value;
            update();

            try {
              if (options.callback) options.callback(value);
            } catch (error) {
              console.error("[NovaUI] Toggle error:", error);
            }
          };

          update();

          return {
            getValue: () => value,

            setValue(next) {
              value = Boolean(next);
              update();

              if (options.callback) options.callback(value);
            }
          };
        }
      };

      tabButton.onclick = () => tab.select();
      allTabs.push(tab);

      if (allTabs.length === 1) tab.select();

      return tab;
    }

    return { createTab };
  }

  // Export the library globally for browser console use.
  globalThis.NovaUI = {
    createWindow,
    destroy() {
      root.remove();
      style.remove();
      delete globalThis.NovaUI;
    }
  };
})();
