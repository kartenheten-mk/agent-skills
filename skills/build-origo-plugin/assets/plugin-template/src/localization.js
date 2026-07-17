import enLocale from '../loc/en_US.json';
import svLocale from '../loc/sv_SE.json';

const registerLocalization = (localization) => {
  if (localization) {
    localization.addPluginToLocale('en-US', enLocale);
    localization.addPluginToLocale('sv-SE', svLocale);
  }
};

const getText = (localization, key, fallback) => (
  localization?.getStringByKeys({
    targetParentKey: 'plugin-name',
    targetKey: key
  }) || fallback
);

export { getText, registerLocalization };
