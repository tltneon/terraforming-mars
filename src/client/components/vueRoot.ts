import {ComponentPublicInstance} from 'vue';
import {mainAppSettings} from '@/client/components/App';

// Gives caller access to global client methods and data.
//
// This app's top level is probably not using a standard pattern, so some of this is
// just messy. But at least this method simplifies access.
export function vueRoot(component: ComponentPublicInstance<any, any, any, any, any>): typeof mainAppSettings.methods & typeof mainAppSettings.data {
  return component.$root as unknown as (typeof mainAppSettings.methods & typeof mainAppSettings.data);
}
