import type { DirectiveBinding } from "vue";
import { setupClickOutsideDetection } from "./eventController";

var lockedTooltip = false;

const createTooltip = (el: any, text: string) => {
  removeTooltip(el);
  const tooltipEl = document.createElement("div");
  tooltipEl.innerHTML = text;
  tooltipEl.className = "tooltip thin-golden-border";
  document.body.appendChild(tooltipEl);

  el._tooltipEl = tooltipEl;
};

const setPosition = (el: any, event: MouseEvent) => {
  if (el._tooltipEl) {
    el._tooltipEl.style.position = "fixed";
    el._tooltipEl.style.left = `${event.clientX + 10}px`;
    el._tooltipEl.style.top = `${event.clientY + 10}px`;
    el._tooltipEl.style.maxHeight = `${window.innerHeight - 20}px`; // Cap height

    // Ensure it doesn't overflow the viewport
    const tooltipRect = el._tooltipEl.getBoundingClientRect();
    if (tooltipRect.bottom > window.innerHeight) {
      el._tooltipEl.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
    }
  }
};

const removeTooltip = (el: any) => {
  if (el._tooltipEl) {
    document.body.removeChild(el._tooltipEl);
    el._tooltipEl = null;
  }
  document.removeEventListener("mousemove", el._tooltipMoveHandler);
};

const tooltipDirective = {
  mounted(el: any, binding: DirectiveBinding) {
    var value = binding.value;
    if(typeof binding.value == "object") {
      var options = binding.value as TooltipOptions;
      value = options.tooltip;
      el.dataset.disableLock = options.disableLock;

      if(typeof value == "function") {
        el.tooltipFunction = value;
      }
      else {
        el.tooltipFunction = () => value;
      }
    }

    if(typeof value == "function") {
      el.tooltipFunction = value;
    }
    else {
      el.dataset.tooltipText = value;
    }

    el._tooltipMoveHandler = (event: MouseEvent) => {
      if(!el._tooltipEl.locked) {
        setPosition(el, event);
      }
    };

    el.addEventListener("mouseenter", (event: MouseEvent) => {
      if(lockedTooltip) {
        return;
      }

      var textToDisplay = el.dataset.tooltipText;
      if(el.tooltipFunction) {
        textToDisplay = el.tooltipFunction();
      }

      if (textToDisplay) {
        createTooltip(el, textToDisplay);
        setPosition(el, event);
        document.addEventListener("mousemove", el._tooltipMoveHandler);
      }
    });

    el.addEventListener("mouseleave", () => {
      if(!el?._tooltipEl) {
        lockedTooltip = false;
        if(el) {
          removeTooltip(el);
        }
        return;
      }

      if(!el._tooltipEl.locked) {
        removeTooltip(el);
      }
      else {
        el._tooltipEl.addEventListener("mouseleave", () => {
          closeTooltip(el);
        });
      }
    });

    el.addEventListener("mousedown", () => {
      if(el._tooltipEl && !el.dataset.disableLock) {
        el._tooltipEl.locked = true;
        setupClickOutsideDetection(el, () => { closeTooltip(el) });
      }
    });
  },

  updated(el: any, binding: DirectiveBinding) {
    if(!el.tooltipFunction) {
      el.dataset.tooltipText = binding.value;
    }
  },

  unmounted(el: any) {
    removeTooltip(el);
  },

  
};

function closeTooltip(el: any) {
  if(!el?._tooltipEl) {
    lockedTooltip = false;
    return;
  }

  lockedTooltip = el._tooltipEl.locked = false;
  removeTooltip(el);
}

export default tooltipDirective;

export type TooltipOptions = {
    tooltip: any,
    disableLock: Boolean
}