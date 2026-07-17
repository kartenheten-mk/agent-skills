import { getText, registerLocalization } from './localization.js';

const {
  Button, Component, Element: El, Modal, dom
} = Origo.ui;

const PluginName = function PluginName(options = {}) {
  const {
    buttonAriaLabel = 'Open plugin',
    buttonText = 'Plugin',
    content = '<div class="o-plugin-name__content"><p>Plugin content</p></div>',
    icon = '#ic_help_outline_24px',
    localization: injectedLocalization,
    placement = ['screen', 'menu'],
    title = 'Plugin'
  } = options;

  let viewer;
  let localization;
  let mapMenu;
  let mapTools;
  let menuItem;
  let screenButton;
  let screenButtonContainer;

  const openModal = function openModal(owner) {
    const openedModal = Modal({
      title: getText(localization, 'title', title),
      content,
      target: viewer.getId()
    });
    owner.addComponent(openedModal);
    openedModal.on('closed', () => {
      owner.removeComponent(openedModal);
    });
  };

  return Component({
    name: 'plugin-name',
    onAdd(evt) {
      viewer = evt.target;
      localization = injectedLocalization
        ?? viewer.getControlByName('localization');
      registerLocalization(localization);

      if (placement.includes('screen')) {
        const localizedAriaLabel = getText(
          localization,
          'buttonAriaLabel',
          buttonAriaLabel
        );
        mapTools = viewer.getMain().getMapTools().getId();
        screenButtonContainer = El({
          tagName: 'div',
          cls: 'flex column'
        });
        screenButton = Button({
          cls: 'o-plugin-name padding-small icon-smaller round light box-shadow',
          click() {
            openModal(this);
          },
          icon,
          ariaLabel: localizedAriaLabel,
          tooltipText: localizedAriaLabel,
          tooltipPlacement: 'east'
        });
        this.addComponent(screenButton);
      }

      if (placement.includes('menu')) {
        mapMenu = viewer.getControlByName('mapmenu');
        if (!mapMenu) {
          console.warn('plugin-name menu placement requires the mapmenu control');
        } else {
          menuItem = mapMenu.MenuItem({
            click() {
              openModal(this);
              mapMenu.close();
            },
            icon,
            title: getText(localization, 'buttonText', buttonText)
          });
          this.addComponent(menuItem);
        }
      }

      this.render();
    },
    render() {
      if (screenButtonContainer && screenButton) {
        const containerEl = dom.html(screenButtonContainer.render());
        document.getElementById(mapTools).appendChild(containerEl);
        const buttonEl = dom.html(screenButton.render());
        document
          .getElementById(screenButtonContainer.getId())
          .appendChild(buttonEl);
      }
      if (mapMenu && menuItem) {
        mapMenu.appendMenuItem(menuItem);
      }
      this.dispatch('render');
    }
  });
};

export default PluginName;
