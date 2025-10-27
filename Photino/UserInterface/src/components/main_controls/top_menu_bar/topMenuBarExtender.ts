import type { DropdownMenuOption, DropdownMenuViewModel } from "../../basic_controls/dropdown_menu/dropdownMenuExtender";

import { saveMod } from "@/scripts/repositories/modRepository";
import { saveMissionTrees } from "@/scripts/repositories/missionTreeRepository";
import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import { modSavedEventName } from "@/scripts/event_system/editorControlsEvents";
import { saveLanguageLocalisation } from "@/scripts/repositories/localisationRepository";
import { saveOpenedObjects } from "@/scripts/repositories/editorRepository";
import { confirmClose } from "@/scripts/layerCommunication/systemCommunication";
import { handleObjectOpenedById } from "@/components/object_editor_controls/objectEditorStructureTreeExtender";
import { AppSettingsFileName, ModSettingsFileName, saveAppSettings, saveModSettings } from "@/scripts/repositories/settingsRepository";
import { ObjectType } from "@/structs/genericStructs";
import { useModStore } from "@/stores/modStore";
import { sendModForExport } from "@/scripts/layerCommunication/objects/objectCommunication";
import { saveTextFiles } from "@/scripts/repositories/textObjectRepository";
import { modExportedEventName } from "@/scripts/pdxExporters/exportUtils";
import { FeedbackMessageType, openFeedbackMessage } from "@/scripts/uiControllers/feedbackMessageController";
import { saveGfxFiles } from "@/scripts/repositories/GfxRepository";

export function getFileMenuViewModel() : DropdownMenuViewModel {
  var exitOption = <DropdownMenuOption>({ id: 'exit', label: "Exit", onClick: () => Exit() });
  var model = <DropdownMenuViewModel>({ 
    label: "File",
    options: []
  }); 

  var modStore = useModStore();
  if(modStore.getMod()) {
    var modSettingsOption = <DropdownMenuOption>({ id: 'modsetting', label: "Mod Settings", onClick: () => openModSettings() });
    var appsettingsOption = <DropdownMenuOption>({ id: 'appsetting', label: "App Settings", onClick: () => openAppSettings() });
    var saveOption = <DropdownMenuOption>({ id: 'save', label: "Save all(CTRL+ALT+S)", onClick: () => saveAll() });
    var exportOption = <DropdownMenuOption>({ id: 'export', label: "Export all(CTRL+ALT+E)", onClick: () => exportAll() });
    model.options.push(...[saveOption, exportOption, modSettingsOption, appsettingsOption, exitOption]);
  }
  else {
    model.options.push(exitOption);
  }

  return model;
}

export async function saveAll() {
  await saveMod();
  await saveExportableObjects();
  await saveOpenedObjects();
  await saveAppSettings();
  await saveTextFiles();
  saveModSettings();
  fireEvent(modSavedEventName);
  openFeedbackMessage("Mod saved", FeedbackMessageType.success);
}

export async function saveExportableObjects(isSaveBeforeExport?: boolean) {
  await saveMissionTrees(isSaveBeforeExport);
  await saveLanguageLocalisation(isSaveBeforeExport);
  await saveGfxFiles(isSaveBeforeExport);
}

export async function openAppSettings() {
  await handleObjectOpenedById(AppSettingsFileName, ObjectType.AppSettings);
}

export async function openModSettings() {
  await handleObjectOpenedById(ModSettingsFileName, ObjectType.ModSettings);
}

export async function exportAll() {
  await saveExportableObjects(true);
  await sendModForExport();
  fireEvent(modExportedEventName);
  openFeedbackMessage("Mod exported", FeedbackMessageType.success);
}

export function Exit() {
  confirmClose();
}