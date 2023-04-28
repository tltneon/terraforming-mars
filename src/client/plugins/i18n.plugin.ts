import {App} from 'vue';
import {translateTextNode, $t} from '@/client/directives/i18n';

export default {
  install: (app: App) => {
    app.directive('i18n', {
      mounted: translateTextNode,
      updated: translateTextNode,
    });
    app.config.globalProperties.$t = $t;
  },
};

declare module '@vue/runtime-core' {
  // Bind to `this` keyword
  interface ComponentCustomProperties {
    $t: typeof $t;
  }
}

// Notes on upgrading from Vue 2:
// https://stackoverflow.com/questions/64118679/question-about-vue-3-typescript-and-augmenting-types-for-use-with-plugins
