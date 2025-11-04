export default {
  mounted(el: any, binding: any) {
    if(!binding.value) {
        return;
    }

    const getMenu = binding.value.getMenu;
    const onSelect = binding.value.onSelect || (() => {});

    if (typeof getMenu !== 'function') {
      return;
    }

    const contextMenuHandler = (e : any) => {
      e.preventDefault();

      const existing = document.querySelector('.custom-context-menu');
      if (existing) existing.remove();

      const menu = getMenu(e);
      if (!menu || !Array.isArray(menu)) {
        return;
      }

      const contextMenu = document.createElement('ul');
      contextMenu.classList.add('custom-context-menu');
      contextMenu.style.top = `${e.clientY}px`;
      contextMenu.style.left = `${e.clientX}px`;

      menu.forEach((item: ContextMenuItem) => {
        const li = document.createElement('li');
        li.textContent = item.label;
        li.addEventListener('click', () => {
          onSelect(item);
          contextMenu.remove();
        });
        contextMenu.appendChild(li);
      });

      document.body.appendChild(contextMenu);

      const closeMenu = () => {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      };

      setTimeout(() => {
        document.addEventListener('click', closeMenu);
      }, 0);
    };

    el.__vueContextMenuHandler__ = contextMenuHandler;
    el.addEventListener('contextmenu', contextMenuHandler);
  },

  unmounted(el: any) {
    el.removeEventListener('contextmenu', el.__vueContextMenuHandler__);
    delete el.__vueContextMenuHandler__;
  },
};

export type ContextMenuItem = {
    label: string,
    value: string,
    objectContext : any
}