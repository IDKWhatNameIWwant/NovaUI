(() => {
  const previous = globalThis.NovaUI;
  if (previous && typeof previous.destroy === "function") previous.destroy();

  const windows = new Set();

  const THEMES = {
    Purple: {
      bg: "#111018", header: "#211a30", accent: "#7c3aed",
      border: "#443754", text: "#f4f0ff", muted: "#aaa2ba",
      surface: "#191720"
    },
    Midnight: {
      bg: "#0b1020", header: "#151f38", accent: "#3b82f6",
      border: "#334155", text: "#eff6ff", muted: "#a8b7ce",
      surface: "#111a2d"
    },
    Emerald: {
      bg: "#081510", header: "#123326", accent: "#16a34a",
      border: "#285541", text: "#ecfdf5", muted: "#a7c9b7",
      surface: "#10241a"
    },
    Crimson: {
      bg: "#180b0b", header: "#351313", accent: "#dc2626",
      border: "#542626", text: "#fff1f2", muted: "#d7aaaa",
      surface: "#241111"
    },
    Rose: {
      bg: "#190e19", header: "#3b1736", accent: "#db2777",
      border: "#653454", text: "#fdf2f8", muted: "#d7adc5",
      surface: "#251625"
    },
    Light: {
      bg: "#f5f5fa", header: "#e5e7f5", accent: "#6d4aff",
      border: "#d1d5e5", text: "#191827", muted: "#5d6074",
      surface: "#ffffff"
    }
  };

  const DEFAULT_THEME = { ...THEMES.Purple };

  const CSS = `
    .nova-root {
      --nova-bg:#111018; --nova-header:#211a30;
      --nova-accent:#7c3aed; --nova-border:#443754;
      --nova-text:#f4f0ff; --nova-muted:#aaa2ba;
      --nova-surface:#191720;
      position:fixed;top:80px;left:80px;width:370px;
      max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);
      overflow:auto;background:var(--nova-bg);color:var(--nova-text);
      font:14px Arial,sans-serif;border:1px solid var(--nova-accent);
      border-radius:12px;z-index:2147483647;box-shadow:0 12px 45px #0009;
    }
    .nova-root *{box-sizing:border-box}
    .nova-header{
      position:sticky;top:0;z-index:2;padding:14px;
      background:var(--nova-header);color:var(--nova-text);
      font-weight:bold;cursor:move;user-select:none;
      display:flex;justify-content:space-between;align-items:center;
    }
    .nova-root button,.nova-root input,.nova-root select{font:inherit}
    .nova-root button{
      cursor:pointer;color:var(--nova-text);background:var(--nova-surface);
      border:1px solid var(--nova-border);border-radius:7px;padding:8px 10px;
    }
    .nova-root button:hover{border-color:var(--nova-accent)}
    .nova-root button.active,.nova-root button.nova-on{
      background:var(--nova-accent);color:#fff;
    }
    .nova-tabs{display:flex;gap:6px;padding:10px;overflow-x:auto}
    .nova-content{padding-bottom:8px}
    .nova-page{padding:12px}
    .nova-section{
      color:var(--nova-accent);font-size:11px;font-weight:bold;
      letter-spacing:1.5px;margin:12px 0;
    }
    .nova-item{
      display:flex;align-items:center;justify-content:space-between;
      gap:12px;padding:12px;margin-bottom:8px;
      background:var(--nova-surface);border:1px solid var(--nova-border);
      border-radius:8px;
    }
    .nova-info{min-width:0;flex:1;overflow-wrap:anywhere}
    .nova-info small{display:block;color:var(--nova-muted);margin-top:5px}
    .nova-label{padding:8px 2px;color:var(--nova-text);overflow-wrap:anywhere}
    .nova-paragraph-content{
      color:var(--nova-muted);margin-top:6px;white-space:pre-wrap;
      overflow-wrap:anywhere;
    }
    .nova-root input,.nova-root select{
      max-width:155px;min-width:0;color:var(--nova-text);
      background:var(--nova-bg);border:1px solid var(--nova-border);
      border-radius:6px;padding:8px;
    }
    .nova-root input[type=range]{width:110px;padding:0;accent-color:var(--nova-accent)}
    .nova-root input[type=color]{width:48px;height:34px;padding:2px}
    .nova-theme-controls{
      display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;
    }
    .nova-theme-controls label{
      display:flex;flex-direction:column;gap:5px;
      color:var(--nova-muted);font-size:12px;
    }
    .nova-theme-controls input,.nova-theme-controls select{max-width:100%;width:100%}
    .nova-theme-controls .nova-wide{grid-column:1/-1}
  `;

  let style = document.getElementById("nova-ui-styles");
  if (!style) {
    style = document.createElement("style");
    style.id = "nova-ui-styles";
    document.head.appendChild(style);
  }
  style.textContent = CSS;

  function normalizeTheme(theme) {
    const result = { ...DEFAULT_THEME };
    if (theme && typeof theme === "object") {
      for (const key of Object.keys(result)) {
        if (typeof theme[key] === "string" &&
            /^#[0-9a-fA-F]{6}$/.test(theme[key])) {
          result[key] = theme[key];
        }
      }
    }
    return result;
  }

  function createWindow(options = {}) {
    const root = document.createElement("div");
    root.className = "nova-root";

    const header = document.createElement("div");
    header.className = "nova-header";

    const title = document.createElement("span");
    title.textContent = "✦ " + (options.name || "NOVA");

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close window");
    header.append(title, close);

    const tabsBar = document.createElement("div");
    tabsBar.className = "nova-tabs";
    const content = document.createElement("div");
    content.className = "nova-content";
    root.append(header, tabsBar, content);
    document.body.appendChild(root);

    const tabs = [];
    let destroyed = false;
    let drag = null;
    let currentTheme = normalizeTheme(options.theme);

    function setTheme(theme) {
      currentTheme = normalizeTheme(theme);
      const vars = {
        bg: "--nova-bg", header: "--nova-header",
        accent: "--nova-accent", border: "--nova-border",
        text: "--nova-text", muted: "--nova-muted",
        surface: "--nova-surface"
      };
      for (const [key, variable] of Object.entries(vars)) {
        root.style.setProperty(variable, currentTheme[key]);
      }
      return { ...currentTheme };
    }

    function getTheme() {
      return { ...currentTheme };
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      root.remove();
      windows.delete(api);
      if (windows.size === 0) {
        document.getElementById("nova-ui-styles")?.remove();
      }
    }

    close.addEventListener("click", destroy);
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
      root.style.left = Math.max(
        0, Math.min(innerWidth - root.offsetWidth, event.clientX - drag.x)
      ) + "px";
      root.style.top = Math.max(
        0, Math.min(innerHeight - root.offsetHeight, event.clientY - drag.y)
      ) + "px";
    });
    header.addEventListener("pointerup", () => drag = null);
    header.addEventListener("pointercancel", () => drag = null);

    function makeRow(page, name, description) {
      const row = document.createElement("div");
      row.className = "nova-item";
      const info = document.createElement("div");
      info.className = "nova-info";
      const heading = document.createElement("strong");
      heading.textContent = name;
      info.appendChild(heading);
      if (description) {
        const desc = document.createElement("small");
        desc.textContent = description;
        info.appendChild(desc);
      }
      row.appendChild(info);
      page.appendChild(row);
      return row;
    }

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
        remove() {
          const index = tabs.indexOf(tab);
          if (index < 0) return;
          const wasSelected = !page.hidden;
          page.remove();
          tabButton.remove();
          tabs.splice(index, 1);
          if (wasSelected && tabs.length) tabs[0].select();
        },
        createSection(name = "Section") {
          const el = document.createElement("div");
          el.className = "nova-section";
          el.textContent = String(name).toUpperCase();
          page.appendChild(el);
          return el;
        },
        createLabel(text = "") {
          const el = document.createElement("div");
          el.className = "nova-label";
          el.textContent = String(text);
          page.appendChild(el);
          return el;
        },
        createParagraph(options = {}) {
          const row = document.createElement("div");
          row.className = "nova-item";
          const info = document.createElement("div");
          info.className = "nova-info";
          const heading = document.createElement("strong");
          heading.textContent = options.name || "Information";
          const paragraph = document.createElement("div");
          paragraph.className = "nova-paragraph-content";
          paragraph.textContent = options.content || "";
          info.append(heading, paragraph);
          row.appendChild(info);
          page.appendChild(row);
          return row;
        },
        createButton(options = {}) {
          const row = makeRow(page, options.name || "Button", options.description);
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = options.text || "RUN";
          row.appendChild(button);
          button.addEventListener("click", () => {
            if (typeof options.callback === "function") options.callback();
          });
          return {
            element: row, control: button,
            remove: () => row.remove(),
            setText: text => button.textContent = String(text),
            getText: () => button.textContent
          };
        },
        createToggle(options = {}) {
          const row = makeRow(page, options.name || "Toggle", options.description);
          const button = document.createElement("button");
          button.type = "button";
          row.appendChild(button);
          let value = Boolean(options.default);
          function update() {
            button.textContent = value
              ? (options.onText || "ON") : (options.offText || "OFF");
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
            element: row, control: button, remove: () => row.remove(),
            getValue: () => value, setValue
          };
        },
        createInput(options = {}) {
          const row = makeRow(page, options.name || "Input", options.description);
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = options.placeholder || "";
          input.value = options.default ?? "";
          input.addEventListener("input", () => {
            if (typeof options.callback === "function") options.callback(input.value);
          });
          row.appendChild(input);
          return {
            element: row, control: input, remove: () => row.remove(),
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
          const row = makeRow(page, options.name || "Slider", options.description);
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = options.min ?? 0;
          slider.max = options.max ?? 100;
          slider.step = options.step ?? 1;
          slider.value = options.default ?? slider.min;
          const valueText = document.createElement("span");
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
            element: row, control: slider, remove: () => row.remove(),
            getValue: () => Number(slider.value),
            setValue(value, notify = true) {
              slider.value = value;
              update(notify);
            }
          };
        },
        createDropdown(options = {}) {
          const row = makeRow(page, options.name || "Dropdown", options.description);
          const select = document.createElement("select");
          (options.options || []).forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
          });
          if (options.default != null) select.value = options.default;
          select.addEventListener("change", () => {
            if (typeof options.callback === "function") options.callback(select.value);
          });
          row.appendChild(select);
          return {
            element: row, control: select, remove: () => row.remove(),
            getValue: () => select.value,
            setValue(value, notify = true) {
              select.value = value;
              if (notify && typeof options.callback === "function") {
                options.callback(select.value);
              }
            }
          };
        },
        createThemePicker(options = {}) {
          const row = makeRow(page, options.name || "Theme Picker", options.description);
          const controls = document.createElement("div");
          controls.className = "nova-theme-controls";

          const presetLabel = document.createElement("label");
          presetLabel.textContent = "Template";
          const preset = document.createElement("select");
          Object.keys(THEMES).forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            preset.appendChild(option);
          });
          presetLabel.appendChild(preset);
          controls.appendChild(presetLabel);

          const fields = [
            ["bg", "Background"], ["header", "Header"],
            ["accent", "Accent"], ["border", "Border"],
            ["text", "Text"], ["muted", "Muted text"],
            ["surface", "Element background"]
          ];
          const inputs = {};

          fields.forEach(([key, labelText]) => {
            const label = document.createElement("label");
            label.textContent = labelText;
            const input = document.createElement("input");
            input.type = "color";
            input.value = currentTheme[key];
            inputs[key] = input;
            label.appendChild(input);
            controls.appendChild(label);
          });

          const applyButton = document.createElement("button");
          applyButton.type = "button";
          applyButton.textContent = "Apply custom theme";
          applyButton.className = "nova-wide";
          controls.appendChild(applyButton);

          const resetButton = document.createElement("button");
          resetButton.type = "button";
          resetButton.textContent = "Reset to template";
          resetButton.className = "nova-wide";
          controls.appendChild(resetButton);
          row.appendChild(controls);

          function sync(theme) {
            const clean = normalizeTheme(theme);
            fields.forEach(([key]) => inputs[key].value = clean[key]);
          }
          function apply(theme) {
            const clean = setTheme(theme);
            sync(clean);
            if (typeof options.callback === "function") options.callback({ ...clean });
            return clean;
          }

          preset.addEventListener("change", () => apply(THEMES[preset.value]));
          applyButton.addEventListener("click", () => {
            const custom = {};
            fields.forEach(([key]) => custom[key] = inputs[key].value);
            apply(custom);
          });
          resetButton.addEventListener("click", () => {
            sync(THEMES[preset.value] || THEMES.Purple);
            apply(THEMES[preset.value] || THEMES.Purple);
          });

          const initial = options.default || "Purple";
          preset.value = THEMES[initial] ? initial : "Purple";
          if (THEMES[initial]) apply(THEMES[initial]);
          else sync(currentTheme);

          return {
            element: row,
            remove: () => row.remove(),
            getValue: getTheme,
            setValue: apply,
            getTemplates: () => NovaUI.getThemes()
          };
        }
      };

      tabButton.addEventListener("click", () => tab.select());
      tabs.push(tab);
      if (tabs.length === 1) tab.select();
      return tab;
    }

    const api = {
      root, createTab, destroy, remove: destroy, setTheme, getTheme,
      getThemes: () => NovaUI.getThemes()
    };

    setTheme(currentTheme);
    windows.add(api);
    return api;
  }

  globalThis.NovaUI = {
    createWindow,
    themes: Object.keys(THEMES),
    getThemes: () => Object.fromEntries(
      Object.entries(THEMES).map(([name, theme]) => [name, { ...theme }])
    ),
    destroy() {
      [...windows].forEach(window => window.destroy());
      document.getElementById("nova-ui-styles")?.remove();
      delete globalThis.NovaUI;
    }
  };
})();
