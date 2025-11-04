import { ref } from "vue";

const iconsController = ref<{
    signalIconsLoaded?: (forceReload: boolean) => void;
  }>();

export function SignalIconsLoaded(forceReload: boolean) {
    if(iconsController.value && iconsController.value.signalIconsLoaded) {
        iconsController.value.signalIconsLoaded(forceReload);
    }
}

export default iconsController;
