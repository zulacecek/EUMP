import type { KeyValuePair } from "../../structs/genericStructs";
import type { AvailableLocalisation } from "../../structs/localisationStructs";
import { type AvailableMissionTree, ChangedObjectActionType, ChangedObjectCategory, type Icon, type MissionTree, type Mod, type TreeItemOption } from "../../structs/missionStructs";
import { appendAvailableTreeItems, availableModIcons, availableVanillaIcons, saveAvailableTags, saveAvailableTradeNodes } from "../appContext";
import { copyFile, copyFolderRecursive, pathExists, readDirFileNames, readFileContent, saveAvailableIcons, saveCustomIcons } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { getDefaultLocalisation } from "../repositories/localisationRepository";
import { openAndImportExistingMissionTree, openAndImportLocalisationFile } from "../repositories/missionTreeRepository";
import { createEmptyNewMod } from "../repositories/modRepository";
import { changeGlobalLoaderText } from "../uiControllers/appController";
import { FeedbackMessageType, openFeedbackMessage } from "../uiControllers/feedbackMessageController";
import { generateObjectId, getDirectory, getFileSystemSelectedFilePathName, getLocalisationFileNameWithForwardSlash, getMissionTreeFileName, removeTrailingCharacter } from "../utils";
import { importAreas } from "./areaImporter";
import { importColonialRegions } from "./colonialRegionsImporter";
import { importClimateInfo, importDefaultMapInfo } from "./mapImporters";
import { ImportModFile, type ModFile } from "./modFileImporter";
import { parseAllProvincesHistory } from "./provinceHistoryImporter";
import { importProvinces } from "./provinceImporter";
import { importRegions } from "./regionImporter";
import { importReligionGroup } from "./religionImporter";
import { importSuperRegions } from "./superRegionImporter";
import { importCountries, importTags } from "./tagImporter";
import { importTradeGoods } from "./tradeGoodsImporter";
import { importTradeNodes } from "./tradeNodeImporter";
import { type GfxFile, parseGfxFile } from "./gfxFileParser";

async function importLocalisation(mod: Mod, directoryPath: string, isReplacement: boolean = false) {
  var localisationFiles = await readDir(directoryPath);
  
  for(var entry of localisationFiles) {
    if(entry.isFile) {
      var localisationPath = `${directoryPath}/${entry.name}`;
      var localisation = await openAndImportLocalisationFile(localisationPath);
      localisation.id = generateObjectId();
      localisation.generateReplacementFile = isReplacement;
      localisation.wasIinitialImport = true;
      localisation.exportFileLastModified = 0;
      localisation.originalFileName = localisation.name = getLocalisationFileNameWithForwardSlash(localisationPath);

      mod.localisations.set(localisation.id, localisation);

      mod.available_localisation.set(localisation.id, <AvailableLocalisation>({ id: localisation.id, name: localisation.name }));
      addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.Localisation, localisation.id, localisation.name);
    }
    else if(entry.isDirectory) {
      await importLocalisation(mod, `${directoryPath}/${entry.name}`, true);
    }
  }
}

export async function importModIcons(mod: Mod, directoryPath: string) {
  var icons : Icon[] = new Array();

  if(!mod?.import_mod_parameters?.icon_gfx_path) {
    return;
  }

 changeGlobalLoaderText('Icons...');
 var gfxFileImported : GfxFile | undefined;
 if(mod.import_mod_parameters.icon_gfx_path) {
     var gfxFileContent = await readFileContent(mod.import_mod_parameters.icon_gfx_path);   
     if(gfxFileContent){
         gfxFileImported = parseGfxFile(getFileSystemSelectedFilePathName(mod.import_mod_parameters.icon_gfx_path), gfxFileContent);
     }
 }

  if(gfxFileImported) {
      for(var sprite of gfxFileImported.sprite_types) {
          var iconPath = `${directoryPath}/${sprite.texture_file}`;
          var iconPathFixed = iconPath.replace(/\\/g, '/');
          var iconFileName = sprite.name;
          var icon = <Icon>({ group: mod.project_name, file_path: iconPathFixed, name: iconFileName, file_name: iconFileName });

          icons.push(icon);
      }

      var proccessedIcons = await saveCustomIcons(icons, mod.project_name);
      await saveAvailableIcons(proccessedIcons.concat(availableModIcons), mod.project_name);
      changeGlobalLoaderText('');
  }
}

export async function importPDXMod(parameters: ImportModParameters) : Promise<Mod | undefined> {
    var mod = createEmptyNewMod();
    
    changeGlobalLoaderText('Descriptor...');
    var descriptorFileContent = await readFileContent(parameters.descriptor_path);
    if(descriptorFileContent){
        var descriptorImported = ImportModFile(descriptorFileContent);
    }
    else {
        return undefined;
    }

    descriptorImported.import_directory_path = removeTrailingCharacter(getDirectory(parameters.descriptor_path), '\\\\');
    mod.mod_name = descriptorImported.name.replace(/"/g, '').replace('\r', '');
    mod.project_name = mod.mod_name.replace(/[<>:/\\|?*]/g, '');
    mod.is_created = false;
    mod.mod_tags = descriptorImported.tags;
    mod.mod_version = '0.1.0';
    mod.supported_version = descriptorImported.version.replace(/"/g, '').replace('\r', '');
    mod.mod_file = descriptorImported;
    mod.import_mod_parameters = parameters;

    if(parameters.is_submod) {
      mod.parent_mod_name = mod.project_name;
      mod.project_name = mod.mod_name = `${mod.parent_mod_name} extended`;
    }

    changeGlobalLoaderText('Done...');
    return mod;
}

async function loadMissionTreesWithIconsAndLocalisations(mod: Mod, modFile: ModFile) {
  var directoryPath = modFile.import_directory_path;
  changeGlobalLoaderText('Localisations...');
  var defaultLocalisation = getDefaultLocalisation(mod);
  await importLocalisation(mod, `${directoryPath}/localisation`, false);
  var missionsPath = `${directoryPath}/missions`;
  var missionFiles = await readDirFileNames(missionsPath);

  if(mod.import_mod_parameters) {
    await importModIcons(mod, mod.mod_file.import_directory_path);
  }

  changeGlobalLoaderText('Missions...');
  for(var fileName of missionFiles) {
    var missionTreePath = `${missionsPath}/${fileName}`;
    var missionTree = await openAndImportExistingMissionTree(missionTreePath);
    missionTree.originalFileName = getMissionTreeFileName(fileName);
    missionTree.name = missionTree.originalFileName.replace(/_/g, " ").replace(/^./, str => str.toUpperCase());
    missionTree.generateReplacementFile = false;
    missionTree.wasIinitialImport = true;
    missionTree.id = generateObjectId();
    missionTree.exportFileLastModified = 0;
    for(var missionSlot of missionTree.mission_slots) {
      if(!missionSlot || !missionSlot.missions) {
        continue;
      }
      
      for(var mission of missionSlot.missions) {
        if(!mission){
            continue;
        }

        mission.name = mission.id;
        var missionNameLocalisation = `${mission.id}_title`;

        for(var searchedLocalisation of mod.localisations.values()) {
            if(searchedLocalisation.localisationMap.firstOrDefault(x => x.key == missionNameLocalisation)){
                missionTree.localisation_file_id = searchedLocalisation.id;
                break;
            }
        }

        if(!missionTree.localisation_file_id) {
          var nameLocalisationAdded = <KeyValuePair<string, string>>({ key: missionNameLocalisation, value: mission.id });
          defaultLocalisation.localisationMap.push(nameLocalisationAdded);
          missionTree.localisation_file_id = defaultLocalisation.id;
        }
      }
    }
        
    loadMissionTreeIcons(missionTree);

    mod.mission_trees.push(missionTree);
    mod.available_mission_trees.set(missionTree.id, <AvailableMissionTree>({ id: missionTree.id, name: missionTree.name }));
    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.MissionTree, missionTree.id, missionTree.name);
  }

  changeGlobalLoaderText('');
}

async function loadCountryTags(baseFolder: string, mod : Mod, modFile: ModFile, isModImport: boolean) {
  var vanillaCountriesFileName = '00_countries.txt';
  var countriesBasePath = `common/country_tags`;
  var basePath = `${baseFolder}/${countriesBasePath}`;

  if(isModImport && !modFile.replace_files.includes('country_tags') && !await pathExists(basePath)) {
    basePath = `${mod.eu4_directory}/${countriesBasePath}`;
  }

  var countriesFiles = await readDirFileNames(basePath);
  
  mod.country_tags = new Array();
  for(var countryFilePath of countriesFiles){
    mod.country_tags.push(...await importTags(`${basePath}/${countryFilePath}`, countryFilePath));
  }
  
  if(isModImport && !countriesFiles.includes(vanillaCountriesFileName) && !modFile.replace_files.includes('country_tags')) {
    mod.country_tags.push(...await importTags(`${mod.eu4_directory}/${countriesBasePath}/${vanillaCountriesFileName}`, vanillaCountriesFileName));
  }

  var tags = mod.country_tags;
  appendAvailableTreeItems(tags.map(x => <TreeItemOption>({ Category: "Tag", Type: "Clause", Key: x.tag, Label: x.name })));
  saveAvailableTags(tags.map(x => x.tag) as string[]);
}

async function loadProvinceDefinitions(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var provinceDefinitionsFilePath = 'map/definition.csv';
  var filePath = `${baseFolder}/${provinceDefinitionsFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${provinceDefinitionsFilePath}`;
  }

  mod.provinces = await importProvinces(filePath);
  if(mod.provinces.length == 0) {
    openFeedbackMessage("Province definition file is missing!", FeedbackMessageType.failure);
    return;
  }

  appendAvailableTreeItems(mod.provinces.map(x => <TreeItemOption>({ Category: "ProvinceID", Type: "Clause", Key: x.id, Label: x.name })));
}

async function loadAreas(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var areaFilePath = 'map/area.txt';
  var filePath = `${baseFolder}/${areaFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${areaFilePath}`;
  }

  mod.areas = await importAreas(filePath);
  if(mod.areas.length == 0) {
    openFeedbackMessage("Areas definition file is missing!", FeedbackMessageType.failure);
    return;
  }

  appendAvailableTreeItems(mod.areas.map(x => <TreeItemOption>({ Category: "Area", Type: "Clause", Key: x.name, Label: x.name })));
}

async function loadClimateInfo(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var areaFilePath = 'map/climate.txt';
  var filePath = `${baseFolder}/${areaFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${areaFilePath}`;
  }

  mod.climates = await importClimateInfo(filePath);
  if(mod.climates.length == 0) {
    openFeedbackMessage("Climate definition file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadDefaultMapInfo(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var areaFilePath = 'map/default.map';
  var filePath = `${baseFolder}/${areaFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${areaFilePath}`;
  }

  var mapInfo =  await importDefaultMapInfo(filePath);
  if(!mapInfo) {
    openFeedbackMessage("Map info file is missing!", FeedbackMessageType.failure);
    return;
  }

  mod.map_info = mapInfo
  
  appendAvailableTreeItems(mod.areas.map(x => <TreeItemOption>({ Category: "Area", Type: "Clause", Key: x.name, Label: x.name })));
}

async function loadTradeGoods(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var vanillaFileName = '00_tradegoods.txt';
  var tradeGoodsFolderPath = 'common/tradegoods/';
  var basePath = `${baseFolder}/${tradeGoodsFolderPath}`;
  
  if(isModImport && !(await pathExists(basePath))) {
    mod.trade_goods = await importTradeGoods(`${mod.eu4_directory}/${tradeGoodsFolderPath}/${vanillaFileName}`, vanillaFileName);
    return;
  }
  
  var tradeGoodsFiles = await readDirFileNames(basePath);
  var tradeGoods = new Array();
  for(var fileName of tradeGoodsFiles) {
    tradeGoods.push(...await importTradeGoods(`${basePath}/${fileName}`, fileName))
  }

  mod.trade_goods = tradeGoods;
  if(mod.trade_goods.length == 0) {
    openFeedbackMessage("Trade goods file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadColonialRegions(baseFolder: string, mod : Mod, modFile: ModFile, isModImport: boolean) {
  var colonialRegionsFilePath = 'common/colonial_regions/00_colonial_regions.txt';
  var filePath = `${baseFolder}/${colonialRegionsFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${colonialRegionsFilePath}`;
  }

  mod.colonial_regions = await importColonialRegions(filePath);
  if(mod.colonial_regions.length == 0 && !modFile.replace_files.includes('common/colonial_regions')) {
    openFeedbackMessage("Colonial regions file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadTradeNodes(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var vanillaFileName = '00_tradenodes.txt';
  var tradeNodesFolderPath = 'common/tradenodes';
  var basePath = `${baseFolder}/${tradeNodesFolderPath}`;
  if(isModImport && !(await pathExists(basePath))) {
    mod.trade_nodes = await importTradeNodes(`${mod.eu4_directory}/${tradeNodesFolderPath}/${vanillaFileName}`, vanillaFileName);
    saveAvailableTradeNodes(mod.trade_nodes.map(x => x.name));
    return;
  }

  var tradeGoodsFiles = await readDirFileNames(basePath);
  var tradeNodes = new Array();
  for(var fileName of tradeGoodsFiles) {
    tradeNodes.push(...await importTradeNodes(`${basePath}/${fileName}`, fileName))
  } 

  mod.trade_nodes = tradeNodes;
  if(mod.trade_nodes.length == 0) {
    openFeedbackMessage("Trade nodes file is missing!", FeedbackMessageType.failure);
    return;
  }
  
  saveAvailableTradeNodes(mod.trade_nodes.map(x => x.name));
}

async function loadSuperRegions(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var superRegionFilePath = 'map/superregion.txt';
  var filePath = `${baseFolder}/${superRegionFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${superRegionFilePath}`;
  }

  mod.super_regions = await importSuperRegions(filePath);
  if(mod.super_regions.length == 0) {
    openFeedbackMessage("Super region file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadRegions(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var regionsFilePath = 'map/region.txt';
  var filePath = `${baseFolder}/${regionsFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${regionsFilePath}`;
  }

  mod.regions = await importRegions(filePath);
  if(mod.regions.length == 0) {
    openFeedbackMessage("Region file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadCountries(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var countriesFilePath = 'common/countries';
  var filePath = `${baseFolder}/${countriesFilePath}`;
  if(isModImport && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${countriesFilePath}`;
  }

  mod.countries = await importCountries(filePath, mod.country_tags);
  if(mod.countries.length == 0) {
    openFeedbackMessage("Countries file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadReligiousGroups(baseFolder: string, mod : Mod, modFile: ModFile, isModImport: boolean) {
  var vanillaFileName = '00_religion.txt';
  var religionsFilePath = 'common/religions';
  var basePath = `${baseFolder}/${religionsFilePath}`;
  if(isModImport && !modFile.replace_files.includes('religions') && !(await pathExists(basePath))) {
    mod.religious_groups =  await importReligionGroup(`${mod.eu4_directory}/${religionsFilePath}/${vanillaFileName}`, vanillaFileName);
    return;
  }

  var religionsFiles = await readDirFileNames(basePath);
  var religions = new Array();
  for(var fileName of religionsFiles) {
    religions.push(...await importReligionGroup(`${basePath}/${fileName}`, fileName))
  }

  mod.religious_groups = religions;

  if(mod.religious_groups.length == 0) {
    openFeedbackMessage("Religions file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function loadProvinceHistories(baseFolder: string, mod : Mod, modFile: ModFile, isModImport: boolean) {
  var provinceHistoryFolderPath = 'history/provinces';
  var filePath = `${baseFolder}/${provinceHistoryFolderPath}`;
  if(isModImport && !modFile.replace_files.includes('religions') && !(await pathExists(filePath))) {
    filePath = `${mod.eu4_directory}/${provinceHistoryFolderPath}`;
  }

  mod.province_histories = await parseAllProvincesHistory(filePath);
  if(mod.province_histories.length == 0) {
    openFeedbackMessage("Religions file is missing!", FeedbackMessageType.failure);
    return;
  }
}

async function copyModMap(baseFolder: string, mod : Mod, _: ModFile, isModImport: boolean) {
  var provincesFileName = 'map/provinces.bmp';
  var provincesFilePath = `${baseFolder}/${provincesFileName}`;
  if(isModImport && !await pathExists(provincesFilePath)){
    provincesFilePath = `${mod.eu4_directory}/${provincesFileName}`;
  }

  await copyFile(provincesFilePath, `${mod.work_directory}/${mod.project_name}`);
}

export async function loadGameObjects(baseFolder: string, mod : Mod, isModImport: boolean) {
  var modFile = mod.mod_file;
  changeGlobalLoaderText('Country tags...');
  await loadCountryTags(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Province definitions...');
  await loadProvinceDefinitions(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Areas...');
  await loadAreas(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Climates...');
  await loadClimateInfo(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Map info...');
  await loadDefaultMapInfo(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Trade goods...');
  await loadTradeGoods(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Colonial regions...');
  await loadColonialRegions(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Trade nodes...');
  await loadTradeNodes(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Continents...');
  await loadSuperRegions(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Regions...');
  await loadRegions(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Countries...');
  await loadCountries(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Religions...');
  await loadReligiousGroups(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Province histories...');
  await loadProvinceHistories(baseFolder, mod, modFile, isModImport);
  changeGlobalLoaderText('Copying map...');
  await copyModMap(baseFolder, mod, modFile, isModImport);

  if(isModImport) {
    loadMissionTreesWithIconsAndLocalisations(mod, modFile);

    if(!mod.parent_mod_name) {
      changeGlobalLoaderText('Cloning source mod...');
      await copyFolderRecursive(baseFolder, `${mod.work_directory}/${mod.project_name}/mod_export/${mod.mod_name}`);
    }
  }
}

function loadMissionTreeIcons(missionTree: MissionTree) {
  for(var missionSlot of missionTree.mission_slots){
    for(var mission of missionSlot.missions) {
      if(!mission.icon){
        continue;
      }

      if(availableVanillaIcons && availableVanillaIcons.length > 0){
        var vanillaIcon = availableVanillaIcons.filter(x => x.name == mission.icon.name)[0];
        if(vanillaIcon) {
          mission.icon = vanillaIcon;
        }
      }

      if(availableModIcons && availableModIcons.length > 0){
        var modIcon = availableModIcons.filter(x => x.name == mission.icon.name)[0];
        if(modIcon) {
          mission.icon = modIcon;
        }
      }
    }
  }
}

export type ImportModParameters = {
    descriptor_path: string,
    icon_gfx_path: string,
    localisation_file_paths: string[],
    is_submod: boolean,
    import_all_localisations: boolean
}
