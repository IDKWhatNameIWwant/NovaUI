(() => {
  const existing = globalThis.NovaUI;
  if (existing && typeof existing.destroy === "function") {
    existing.destroy();
  }

  const windows = new Set();

  const css = `
    .nova-root {
      position: fixed;
      top: 80px;
      left: 80px;
      width: 360px;
      max-width: calc(100vw - 24px);
      max-height: calc(100vh - 24px);
      overflow: auto;
      background: #111018;
      color: #f4f0ff;
      font: 14px Arial, sans-serif;
      border: 1px solid #8b5cf6;
      border-radius: 12px;
      z-index: 2147483647;
      box-shadow: 0 12px 45px #0009;
    }
    .nova-root * { box-sizing: border-box; }
    .nova-header {
      position: sticky;
      top: 0;
      padding: 14px;
      background: #211a30;
      color: #c4b5fd;
      font-weight: bold;
      cursor: move;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nova-root button {
      cursor: pointer;
      color: #eee7ff;
      background: #252031;
      border: 1px solid #443754;
      border-radius: 7px;
      padding: 8px 10px;
    }
    .nova-root button:hover { border-color: #a78bfa; }
    .nova-root button.active,
    .nova-root button.nova-on { background: #7c3aed; }
    .nova-tabs {
      display: flex;
      gap: 6px;
      padding: 10px;
      overflow-x: auto;
    }
    .nova-content { padding-bottom: 8px; }
    .nova-page { padding: 12px; }
    .nova-section {
      color: #a78bfa;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1.5px;
      margin: 10px 0;
    }
    .nova-item {
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
    .nova-info { min-width: 0; overflow-wrap: anywhere; }
    .nova-info small {
      display: block;
      color: #aaa2ba;
      margin-top: 5px;
    }
    .nova-label {
      padding: 8px 2px;
      color: #f4f0ff;
      overflow-wrap: anywhere;
    }
    .nova-paragraph-content {
      color: #c8c1d5;
      margin-top: 6px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .nova-root input,
    .nova-root select {
      max-width: 150px;
      min-width: 0;
      color: #f4f0ff;
      background: #252031;
      border: 1px solid #443754;
      border-radius: 6px;
      padding: 8px;
    }
    .nova-root input[type="range"] { padding: 0; }
    .nova-root button:focus-visible,
    .nova-root input:focus-visible,
    .nova-root select:focus-visible {
      outline: 2px solid #a78bfa;
      outline-offset: 2px;
    }
  `;

  let style = document.getElementById("nova-ui-styles");
  if (!style) {
    style = document.createElement("style");
    style.id = "nova-ui-styles";
    style.textContent = css;
    document.head.appendChild(style);
  } else {
    style.textContent = css;
  }

  function createWindow(options = {}) {
    const root = document.createElement("div");
    root.className = "nova-root";
    root.innerHTML = `
      <div class="nova-header">
        <span class="nova-title"></span>
        <button type="button" class="nova-close" aria-label="Close window">×</button>
      </div>
      <div class="nova-tabs"></div>
      <div class="nova-content"></div>
    `;

    root.querySelector(".nova-title").textContent =
      "✦ " + (options.name || "NOVA");

    document.body.appendChild(root);

    const header = root.querySelector(".nova-header");
    const tabsBar = root.querySelector(".nova-tabs");
    const content = root.querySelector(".nova-content");
    const tabs = [];
    let destroyed = false;
    let drag = null;

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      root.remove();
      windows.delete(api);

      if (windows.size === 0) {
        const currentStyle = document.getElementById("nova-ui-styles");
        if (currentStyle) currentStyle.remove();
      }
    }

    root.querySelector(".nova-close").addEventListener("click", destroy);

    header.addEventListener("pointerdown", event => {
      if (event.target.closest("button")) return;
      drag = {
        x: event.clientX - root.offsetLeft,
        y: event.clientY - root.offsetTop
      };
      header.setPointerCapture(event.pointerId);
    });

    header.addEventListener("pointermove", event => {
      if (!drag || destroyed) return;
      const maxX = Math.max(0, innerWidth - root.offsetWidth);
      const maxY = Math.max(0, innerHeight - root.offsetHeight);
      root.style.left = Math.max(
        0, Math.min(maxX, event.clientX - drag.x)
      ) + "px";
      root.style.top = Math.max(
        0, Math.min(maxY, event.clientY - drag.y)
      ) + "px";
    });

    header.addEventListener("pointerup", () => drag = null);
    header.addEventListener("pointercancel", () => drag = null);

    function createTab(name = "Tab") {
      const tabButton = document.createElement("button");
      tabButton.type = "button";
      tabButton.textContent = name;

      const page = document.createElement("div");
      page.className = "nova-page";
      page.hidden = true;

      tabsBar.appendChild(tabButton);
      content.appendChild(page);

      const tab = {
        button: tabButton,
        page,

        select() {
          tabs.forEach(item => {
            item.page.hidden = true;
            item.button.classList.remove("active");
          });
          page.hidden = false;
          tabButton.classList.add("active");
        },

        createSection(name = "Section") {
          const section = document.createElement("div");
          section.className = "nova-section";
          section.textContent = String(name).toUpperCase();
          page.appendChild(section);
          return section;
        },

        createLabel(text = "") {
          const label = document.createElement("div");
          label.className = "nova-label";
          label.textContent = text;
          page.appendChild(label);
          return label;
        },

        createParagraph(options = {}) {
          const row = document.createElement("div");
          row.className = "nova-item";
          const info = document.createElement("div");
          info.className = "nova-info";

          const title = document.createElement("strong");
          title.textContent = options.name || "Information";

          const paragraph = document.createElement("div");
          paragraph.className = "nova-paragraph-content";
          paragraph.textContent = options.content || "";

          info.append(title, paragraph);
          row.appendChild(info);
          page.appendChild(row);
          return row;
        },

        createButton(options = {}) {
          const row = makeRow(page, options.name || "Button",
            options.description);
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = options.text || "RUN";
          row.appendChild(button);

          button.addEventListener("click", () => {
            if (typeof options.callback === "function") {
              options.callback();
            }
          });

          return {
            element: row,
            control: button,
            remove: () => row.remove(),
            setText: text => button.textContent = text,
            getText: () => button.textContent
          };
        },

        createToggle(options = {}) {
          const row = makeRow(page, options.name || "Toggle",
            options.description);
          const button = document.createElement("button");
          button.type = "button";
          row.appendChild(button);

          let value = Boolean(options.default);

          function update() {
            button.textContent = value
              ? (options.onText || "ON")
              : (options.offText || "OFF");
            button.classList.toggle("nova-on", value);
          }

          function setValue(next, notify = true) {
            value = Boolean(next);
            update();
            if (notify && typeof options.callback === "function") {
              options.callback(value);
            }
          }

          button.addEventListener("click", () => setValue(!value));
          update();

          return {
            element: row,
            control: button,
            remove: () => row.remove(),
            getValue: () => value,
            setValue
          };
        },

        createInput(options = {}) {
          const row = makeRow(page, options.name || "Input",
            options.description);
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = options.placeholder || "";
          input.value = options.default ?? "";
          input.addEventListener("input", () => {
            if (typeof options.callback === "function") {
              options.callback(input.value);
            }
          });
          row.appendChild(input);

          return {
            element: row,
            control: input,
            remove: () => row.remove(),
            getValue: () => input.value,
            setValue(value, notify = true) {
              input.value = value;
              if (notify && typeof options.callback === "function") {
                options.callback(input.value);
              }
            }
          };
        },

        createSlider(options = {}) {
          const row = makeRow(page, options.name || "Slider",
            options.description);
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = options.min ?? 0;
          slider.max = options.max ?? 100;
          slider.step = options.step ?? 1;
          slider.value = options.default ?? slider.min;

          const valueText = document.createElement("span");
          valueText.textContent = slider.value;

          function update(notify = true) {
            valueText.textContent = slider.value;
            if (notify && typeof options.callback === "function") {
              options.callback(Number(slider.value));
            }
          }

          slider.addEventListener("input", () => update(true));
          row.append(slider, valueText);
          update(false);

          return {
            element: row,
            control: slider,
            remove: () => row.remove(),
            getValue: () => Number(slider.value),
            setValue(value, notify = true) {
              slider.value = value;
              update(notify);
            }
          };
        },

        createDropdown(options = {}) {
          const row = makeRow(page, options.name || "Dropdown",
            options.description);
          const select = document.createElement("select");

          (options.options || []).forEach(option => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            select.appendChild(item);
          });

          if (options.default != null) {
            select.value = options.default;
          }

          select.addEventListener("change", () => {
            if (typeof options.callback === "function") {
              options.callback(select.value);
            }
          });

          row.appendChild(select);

          return {
            element: row,
            control: select,
            remove: () => row.remove(),
            getValue: () => select.value,
            setValue(value, notify = true) {
              select.value = value;
              if (notify && typeof options.callback === "function") {
                options.callback(select.value);
              }
            }
          };
        },

        remove() {
          page.remove();
          tabButton.remove();
          const index = tabs.indexOf(tab);
          if (index !== -1) tabs.splice(index, 1);

          if (tabs.length > 0 && !tabs.some(item => !item.page.hidden)) {
            tabs[0].select();
          }
        }
      };

      tabButton.addEventListener("click", () => tab.select());
      tabs.push(tab);
      if (tabs.length === 1) tab.select();

      return tab;
    }

    function makeRow(page, name, description) {
      const row = document.createElement("div");
      row.className = "nova-item";

      const info = document.createElement("div");
      info.className = "nova-info";

      const title = document.createElement("strong");
      title.textContent = name;
      info.appendChild(title);

      if (description) {
        const desc = document.createElement("small");
        desc.textContent = description;
        info.appendChild(desc);
      }

      row.appendChild(info);
      page.appendChild(row);
      return row;
    }

    const api = {
      root,
      createTab,
      destroy,
      remove: destroy
    };

    windows.add(api);
    return api;
  }

  globalThis.NovaUI = {
    createWindow,
    destroy() {
      [...windows].forEach(window => window.destroy());
      const currentStyle = document.getElementById("nova-ui-styles");
      if (currentStyle) currentStyle.remove();
      delete globalThis.NovaUI;
    }
  };
})();
