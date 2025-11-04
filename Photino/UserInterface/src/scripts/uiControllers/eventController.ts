export function setupClickOutsideDetection(element: HTMLElement, callback: () => void) {
    function handleClickInside(event: Event) {
      event.stopPropagation();
    }
  
    function handleClickOutside() {
      callback();
    }
  
    element.addEventListener("click", handleClickInside);
  
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside, { once: true });
    });
}