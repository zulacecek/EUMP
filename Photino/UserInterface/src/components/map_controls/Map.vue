<script setup lang="ts">
import {  onMounted, ref, } from 'vue';
import { openGroupedObjects, parseMap, pathExists, readDirFileNames } from '../../scripts/backendControllers/backendCommunication';
import { convertFileSrc } from '@tauri-apps/api/core';
import { dataDir } from '../../scripts/appContext';
import { Color, ColorSource, Container as cont, Container, Point, Sprite, Texture, Ticker } from 'pixi.js';
import { Application, useApplication } from 'vue3-pixi';
import { NFlex } from 'naive-ui';
import { ChangedObjectCategory, Mod } from '../../structs/missionStructs';

// @ts-ignore
import { useStore, State } from 'vuex';
import { ProvinceHistory } from '../../scripts/pdxImporters/provinceHistoryImporter';
import { colorToIdMap } from '../../scripts/repositories/provinceRepository';
import { idToHistory } from '../../scripts/repositories/provinceHistoryRepository';
import { religionNameToColorMap } from '../../scripts/repositories/religionRepository';
import { areaToRegion, provinceIdToArea, provinceIdToClimate, provinceIdToColonialRegion, provinceIdToWeather, regionToSuperRegion, wastelandIds, waterIds } from '../../scripts/repositories/mapRepository';
import { countryNameToColorMap } from '../../scripts/repositories/countryRepository';
import { provinceIdToTradeNode } from '../../scripts/repositories/tradeNodeRepository';
import { tradeGoodsNameToTradeGoods } from '../../scripts/repositories/tradeGoodsRepository';
import CheckboxGroup, { CheckboxGroupValue } from '../common_controls/CheckboxGroup.vue';
import Loader from '../common_controls/Loader.vue';
import { Climate, MapInfo } from '../../scripts/pdxImporters/mapImporters';
import { Country } from '../../scripts/pdxImporters/tagImporter';
import { ReligionGroup } from '../../scripts/pdxImporters/religionImporter';
import { Area } from '../../scripts/pdxImporters/areaImporter';
import { Region } from '../../scripts/pdxImporters/regionImporter';
import { SuperRegion } from '../../scripts/pdxImporters/superRegionImporter';
import { TradeGood } from '../../scripts/pdxImporters/tradeGoodsImporter';
import { TradeNode } from '../../scripts/pdxImporters/tradeNodeImporter';
import { ColonialRegion } from '../../scripts/pdxImporters/colonialRegionsImporter';
import { ProvinceDefinition } from '../../scripts/pdxImporters/provinceImporter';
import HorizontallyResizablePanel from '../common_controls/HorizontallyResizablePanel.vue';
import ProvinceHistoryForm from './ProvinceHistoryForm.vue';

const store = useStore();
var modData = ref((store.getters.getMod as Mod));

let dragging = false;
let startX = 0;
let startY = 0;
let stageStartX = 0;
let stageStartY = 0;

class ProvinceSprite extends Sprite {
    province_history: ProvinceHistory | undefined;
    base_color: Color | undefined;
}

const onMouseDown = (event : any) => {
    if(event.buttons != 4) {
        return;
    }

    dragging = true;
    startX = event.x;
    startY = event.y;
    var container = containerRef.value;
    stageStartX = container.x;
    stageStartY = container.y;
};

const onMouseMove = (event : any) => {
  if (dragging) {
    const dx = event.x - startX;
    const dy = event.y - startY;

    var container = containerRef.value;

    // Apply movement to the stage
    container.x = stageStartX + dx;
    container.y = stageStartY + dy;
  }
};

const keys: Record<string, boolean> = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

let velocityX = 0;
let velocityY = 0;
const acceleration = 0.5;
const maxSpeed = 10;
const friction = 0.9;

Ticker.shared.add(() => {
    const container = containerRef.value;

    // Determine directional input
    let moveX = 0;
    let moveY = 0;

    if (keys["w"] || keys["arrowup"]) moveY -= 1;
    if (keys["s"] || keys["arrowdown"]) moveY += 1;
    if (keys["a"] || keys["arrowleft"]) moveX -= 1;
    if (keys["d"] || keys["arrowright"]) moveX += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
    }

    // Apply acceleration
    velocityX += moveX * acceleration;
    velocityY += moveY * acceleration;

    // Clamp velocity to max speed
    velocityX = Math.max(-maxSpeed, Math.min(maxSpeed, velocityX));
    velocityY = Math.max(-maxSpeed, Math.min(maxSpeed, velocityY));

    // Apply friction
    velocityX *= friction;
    velocityY *= friction;

    // Move container
    container.x -= velocityX;
    container.y -= velocityY;
});

// Mouse up event to stop dragging
const onMouseUp = () => {
  dragging = false;
};

const onWheelZoom = (event : any) => {
    event.preventDefault(); // Prevent page scrolling
    const zoomFactor = 1.1;
    let scaleChange = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    var container = containerRef.value;

    let currentScale = container.scale.x;
    let newScale = currentScale * scaleChange;
    newScale = Math.min(5, Math.max(0.5, newScale)); // Limit zoom levels

    if (newScale === currentScale){
     return;
    }

    //Adjust stage position to keep the zoom centered on the cursor
    container.x -= (event.clientX - container.x) * (scaleChange - 1);
    container.y -= (event.clientY - container.y) * (scaleChange - 1);

    container.scale.set(newScale);
};

function getX(input: string) : string {
    return input.split('_')[0];
}

function getY(input: string) : string {
    return input.split('_')[1];
}

function getColor(input: string) : number[] {
    return input.split('_')[2].split('.')[0].split('-').map(x => Number(x) / 255);
}

function getColorForId(input: string) : string {
    return input.split('_')[2].split('.')[0];
}

function getTexture(path: string) : string {
    var result = convertFileSrc(`${mapFilesLocation}/${path}`);
    return result;
}

const mapFilesLocation = `${dataDir}${modData.value.project_name}/map`;

var imageFiles: Array<string> | undefined = undefined;

onMounted(async () => {
    var app = appRef.value = useApplication().value;
    if (!containerRef.value) {
        if(app && app.view) {
            // @ts-ignore
            app?.view?.addEventListener("contextmenu", (event) => {
                event.preventDefault()
            });
        }
        
        var container = app.stage.getChildByName('RenderContainer') as cont;        
    } 
    else {
        container = containerRef.value;
    }

    if(app && app.view) {
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        var canvas = app.view;
        const widthPx = 92 * remInPx;
        const heightPx = 41 * remInPx;
        app.stage.width = app.screen.width = canvas.width = widthPx;
        app.stage.height = app.screen.height = canvas.height = heightPx;
        if(canvas.style){
            canvas.style.width = `${widthPx}px`;
            canvas.style.height = `${heightPx}px`;
        }
    }

    showMapLoader.value = true;

    if (!modData.value.provinces || modData.value.provinces.length == 0) {
        modData.value.provinces = await openGroupedObjects<ProvinceDefinition>(modData.value, ChangedObjectCategory.ProvinceDefinition);
    }

    if (!modData.value.province_histories || modData.value.province_histories.length == 0) {
        modData.value.province_histories = await openGroupedObjects<ProvinceHistory>(modData.value, ChangedObjectCategory.ProvinceHistory);
    }

    if (!modData.value.map_info) {
        modData.value.map_info = (await openGroupedObjects<MapInfo>(modData.value, ChangedObjectCategory.MapInfo))[0];
    }

    if (!modData.value.climates || modData.value.climates.length == 0) {
        modData.value.climates = await openGroupedObjects<Climate>(modData.value, ChangedObjectCategory.Climate);
    }

    var files = imageFiles;
    if (!files && await pathExists(mapFilesLocation)) {
        files = loadedFiles.value = await readDirFileNames(mapFilesLocation);
    }

    if (!files) {
        await parseMap(`${modData.value.work_directory}/${modData.value.project_name}/provinces.bmp`, modData.value.project_name);
        files = loadedFiles.value = await readDirFileNames(mapFilesLocation);
    }

    showMapLoader.value = false;

    for (var file of files) {
        var sprite = new ProvinceSprite();
        var baseColor = getColorForId(file);
        var provinceId = colorToIdMap.value.get(baseColor) as string;

        if (provinceId && idToHistory.value.has(provinceId)) {
            sprite.province_history = idToHistory.value.get(provinceId);
        } 
        else {
            sprite.province_history = <ProvinceHistory>({ province_id: provinceId });
        }

        sprite.texture = Texture.from(getTexture(file));
        sprite.x = Number(getX(file));
        sprite.y = Number(getY(file));
        sprite.base_color = sprite.tint = new Color(getColor(file));
        sprite.name = getColorForId(file);

        //@ts-ignore
        container.addChild(sprite);
    }

    container.on('pointerdown', (event) => {
        if(event.buttons == 2 && selectedProvince.value) {
            if(selectedProvince.value.tint == highlightTint){
                selectedProvince.value.tint = selectedProvincePreselectTint;
            }
            selectedProvince.value = undefined;
        }

        if(event. buttons != 1){
            return;
        }

        const x = event.globalX;
        const y = event.globalY;
        for (let child of container.children) {
            var sprite = child as ProvinceSprite;
            if (isClickInsideIrregularSprite(sprite, x, y)) {
                if(selectedProvince.value && selectedProvince.value.tint == highlightTint) {
                    selectedProvince.value.tint = selectedProvincePreselectTint;
                }

                selectedProvincePreselectTint = sprite.tint;
                selectedProvince.value = sprite;
                selectedProvince.value.tint = highlightTint;
            }
        }
    });
});

var highlightTint = 0xf7d84a;
var selectedProvincePreselectTint: ColorSource;
var selectedProvince = ref<ProvinceSprite | undefined>();

function isClickInsideIrregularSprite(sprite: ProvinceSprite, x : number, y : number) {
    const localPosition = sprite.toLocal(new Point(x, y));
    const texture = sprite.texture;

    if (!sprite.getBounds().contains(x, y)) {
        return false;
    }

    const baseTexture = texture.baseTexture;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if(!ctx) {
        return;
    }

    var source = (baseTexture.resource as any).source;
    ctx.drawImage(source, 0, 0, source.width, source.height);
    
    const pixel = ctx.getImageData(localPosition.x, localPosition.y, 1, 1);

    return pixel.data[3] > 0; // alpha > 0
}

const missingProvince = <ProvinceHistory>({
    province_id: '-1'
});

enum MapMode {
    Base = 0,
    Area,
    Region,
    Subcontinent,
    ColonialRegions,
    Climate,
    Weather,
    Political,
    HRE,
    Religious,
    Developement,
    TradeNodes,
    TradeGoods
}

var containerRef = ref();
var appRef = ref();
//@ts-ignore
var mapMode: MapMode = MapMode.Base;

var loadedFiles = ref<string[]>(new Array());

async function renderBase() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;

    mapMode = MapMode.Base;
    for(var child of container.children){
        var sprite = child as ProvinceSprite;
        if(sprite.base_color) {
            sprite.tint = sprite.base_color;
        }
    }
}

async function renderPoliticalMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;

    if(!modData.value.countries || modData.value.countries.length == 0) {
        showMapLoader.value = true;
        modData.value.countries = await openGroupedObjects<Country>(modData.value, ChangedObjectCategory.Country);
    }

    showMapLoader.value = false;

    mapMode = MapMode.Political;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var owner = sprite?.province_history?.owner ?? '';
        var trade_goods = sprite?.province_history?.trade_goods ?? '';

        var mapped = countryNameToColorMap.value.get(owner);
        if(mapped){
            sprite.tint = mapSimpleColorStringToColor(mapped);
            continue;
        }
        else if(!owner && !trade_goods) {
            renderBaseProvinceColors(sprite);
            continue;
        }
        else if(!owner){
            renderUncolonizedLand(sprite);
            continue;
        }
    }
}

async function renderReligiousMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;

    
    if(!modData.value.religious_groups || modData.value.religious_groups.length == 0) {
        showMapLoader.value = true;
        modData.value.religious_groups = await openGroupedObjects<ReligionGroup>(modData.value, ChangedObjectCategory.ReligiousGroups);
    }
    showMapLoader.value = false;

    mapMode = MapMode.Religious;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var religionName = sprite?.province_history?.religion ?? '';
        if(!religionName){
            if(sprite?.province_history?.trade_goods){
                renderUncolonizedLand(sprite);
            }
            else {
                renderBaseProvinceColors(sprite);
            }
            continue;
        }

        var mapped = religionNameToColorMap.value.get(religionName);
        if(mapped){
            sprite.tint = mapSimpleColorStringToColor(mapped);
            continue;
        }
        else {
            renderBaseProvinceColors(sprite);
            continue;
        }
    }
}

function renderHREMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.HRE;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var hre = sprite?.province_history?.hre ?? false;
        if(!hre){
            if(sprite?.province_history?.trade_goods){
                renderUncolonizedLand(sprite);
            }
            else {
                renderBaseProvinceColors(sprite);
            }
            continue;
        }
        else {
            sprite.tint = 0x478a21;
            continue;
        }
    }
}

async function renderAreaMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Area;

    if(!modData.value.areas || modData.value.areas.length == 0) {
        showMapLoader.value = true;
        modData.value.areas = await openGroupedObjects<Area>(modData.value, ChangedObjectCategory.Area);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }
        
        var areaMapped = provinceIdToArea.value.get(provinceId);
        if(areaMapped) {
            sprite.tint = mapSimpleColorStringToColor(areaMapped.color);
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }
}

async function renderRegionMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Region;

    if(!modData.value.areas || modData.value.areas.length == 0) {
        showMapLoader.value = true;
        modData.value.areas = await openGroupedObjects<Area>(modData.value, ChangedObjectCategory.Area);
    }

    if(!modData.value.regions || modData.value.regions.length == 0) {
        showMapLoader.value = true;
        modData.value.regions = await openGroupedObjects<Region>(modData.value, ChangedObjectCategory.Regions);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var areaMapped = provinceIdToArea.value.get(provinceId);
        if(areaMapped) {
            var regionMapped = areaToRegion.value.get(areaMapped.name);
            if(regionMapped) {
                sprite.tint = mapSimpleColorStringToColor(regionMapped.color);
            }
            else {
                renderUncolonizedLand(sprite);
            }
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }
}

async function renderSubcontinentMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Subcontinent;

    if(!modData.value.areas || modData.value.areas.length == 0) {
        showMapLoader.value = true;
        modData.value.areas = await openGroupedObjects<Area>(modData.value, ChangedObjectCategory.Area);
    }

    if(!modData.value.regions || modData.value.regions.length == 0) {
        showMapLoader.value = true;
        modData.value.regions = await openGroupedObjects<Region>(modData.value, ChangedObjectCategory.Regions);
    }

    if(!modData.value.super_regions || modData.value.super_regions.length == 0) {
        showMapLoader.value = true;
        modData.value.super_regions = await openGroupedObjects<SuperRegion>(modData.value, ChangedObjectCategory.SuperRegions);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var areaMapped = provinceIdToArea.value.get(provinceId);
        if(areaMapped) {
            var regionMapped = areaToRegion.value.get(areaMapped.name);
            if(regionMapped) {
                var superRegionMapped = regionToSuperRegion.value.get(regionMapped.name);
                if(superRegionMapped) {
                    sprite.tint = mapSimpleColorStringToColor(superRegionMapped.color);
                }
            }
            else {
                renderUncolonizedLand(sprite);
            }
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }
}

async function renderTradeGoods() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.TradeGoods;

    if(!modData.value.trade_goods || modData.value.trade_goods.length == 0) {
        showMapLoader.value = true;
        modData.value.trade_goods = await openGroupedObjects<TradeGood>(modData.value, ChangedObjectCategory.TradeGoods);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        var provinceTradeGoods = sprite?.province_history?.trade_goods ?? '';
        if(!provinceId || provinceTradeGoods){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var tradeGoodsMapped = tradeGoodsNameToTradeGoods.value.get(provinceTradeGoods);
        if(tradeGoodsMapped) {
            sprite.tint = mapSimpleColorStringToColor(tradeGoodsMapped.color);
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }
}

async function renderTradeNodes() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    // var overlayContainer = container.getChildByName("OverlayContainer") as cont;

    mapMode = MapMode.TradeNodes;

    if(!modData.value.trade_nodes || modData.value.trade_nodes.length == 0) {
        showMapLoader.value = true;
        modData.value.trade_nodes = await openGroupedObjects<TradeNode>(modData.value, ChangedObjectCategory.TradeNodes);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var tradeNodeMapped = provinceIdToTradeNode.value.get(provinceId);
        if(tradeNodeMapped) {
            sprite.tint = mapSimpleColorStringToColor(tradeNodeMapped.color);
            // if(tradeNodeMapped.location == provinceId) {
            //     var tradeNodeLabel = new Graphics()
            //         .lineStyle(0.5, 0x00000, 1)
            //         .beginFill(0x00000, 0.8)
            //         .drawRect(child.x - 35, child.y - 7.5, 70, 15)
            //         .endFill();

            //     var name = new Text(tradeNodeMapped.name, { fontSize: 8, align: 'center', fill: '#FFFFFF' });
            //     name.x = child.x - 35;
            //     name.y = child.y - 7.5;
            //     name.resolution = 3;
            //     tradeNodeLabel.addChild(name);

            //     overlayContainer.addChild(tradeNodeLabel);
            // }
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }

    // Code for connecting trade nodes. This requires reading of positions.txt in map folder to determine start and end of the trade node!
    // const points = [
    //     3301, 650, 3299, 628, 3287, 595, 3270, 574, 3260, 559, 3231, 537, 3177, 531
    // ];

    // const graphics = new Graphics();
    // graphics.lineStyle(3, 0xe0a716, 1);
    // graphics.moveTo(points[0], 2048 - points[1]);

    // for (let i = 2; i < points.length; i += 2) {
    //     var x = points[i - 2];
    //     var y = 2048 - points[i - 1];

    //     let cx = (x + points[i]) / 2;
    //     let cy = (y + 2048 - points[i + 1]) / 2;
        
    //     graphics.quadraticCurveTo(x, y, cx, cy);
    // }

    // container.addChild(graphics);
}

async function renderColonialRegions() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.ColonialRegions;

    if(!modData.value.colonial_regions || modData.value.colonial_regions.length == 0) {
        showMapLoader.value = true;
        modData.value.colonial_regions = await openGroupedObjects<ColonialRegion>(modData.value, ChangedObjectCategory.ColonialRegions);
    }

    showMapLoader.value = false;

    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var colonialRegionMapped = provinceIdToColonialRegion.value.get(provinceId);
        if(colonialRegionMapped) {
            sprite.tint = mapSimpleColorStringToColor(colonialRegionMapped.color);
        }
        else {
            renderUncolonizedLand(sprite);
        }
    }
}

async function renderWeather() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Weather;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var weatherMapped = provinceIdToWeather.value.get(provinceId);
        switch(weatherMapped) {
            case 'mild_winter':
                sprite.tint = 0x9ff1f5;
                break;
            case 'normal_winter':
                sprite.tint = 0x07effa;
                break;
            case 'severe_winter':
                sprite.tint = 0x1523eb;
                break;
            case 'mild_monsoon':
                sprite.tint = 0xb5fca2;
                break;
            case 'normal_monsoon':
                sprite.tint = 0x5cf533;
                break;
            case 'severe_monsoon':
                sprite.tint = 0x02a332;
                break;
            default:
                sprite.tint = 0xfff87a;
                break;
        }
    }
}

async function renderClimate() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Climate;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;

        var provinceId = sprite?.province_history?.province_id ?? '';
        if(!provinceId){
            renderUncolonizedLand(sprite);
        }

        if(checkWaterAndWasteland(sprite)) {
            continue;
        }

        var climateMapped = provinceIdToClimate.value.get(provinceId);
        switch(climateMapped) {
            case 'arid':
                sprite.tint = 0xdbd96e;
                break;
            case 'tropical':
                sprite.tint = 0x0b7301;
                break;
            case 'arctic':
                sprite.tint = 0x0091cf;
                break;
            default:
                sprite.tint = 0x79ed55;
                break;
        }
    }
}


function renderDevelopementMap() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    mapMode = MapMode.Developement;
    for(var child of container.children) {
        var sprite = child as ProvinceSprite;
        renderDevelopementColor(sprite);
    }   
}

function renderDevelopementColor(sprite: ProvinceSprite) {
    const min = 3, max = 100;
    var provinceHistory = sprite.province_history;

    if(!provinceHistory) {
        renderBaseColor(sprite);
        return;
    }

    if(Number.isNaN(provinceHistory.base_manpower) || provinceHistory.base_manpower == 0) {
        provinceHistory.base_manpower = 1;
    }

    if(Number.isNaN(provinceHistory.base_production) || provinceHistory.base_production == 0) {
        provinceHistory.base_production = 1;
    }

    if(Number.isNaN(provinceHistory.base_tax) || provinceHistory.base_tax == 0) {
        provinceHistory.base_tax = 1;
    }
    
    var value = provinceHistory.base_manpower + provinceHistory.base_production + provinceHistory.base_tax;
    if(!value) {
        renderBaseProvinceColors(sprite);
        return;
    }

    const t = Math.pow((value - min) / (max - min), 0.4);

    const r = Math.round((1 - t) * 170);
    const g = Math.round(t * 255);
    const b = 0;

    // Return the color as an RGB string
    sprite.tint = new Color(`rgb(${r}, ${g}, ${b})`);
}

function renderUncolonizedLand(sprite: ProvinceSprite) {
    sprite.tint = 0x7a7979;
}

function checkWaterAndWasteland(sprite: ProvinceSprite) : boolean {
    var provinceId = sprite.province_history?.province_id;

    if(!provinceId) {
        return false;
    }

    if(waterIds.value?.has(provinceId)){
        sprite.tint = 0x0079b5;
        return true;
    }
    else if(wastelandIds.value.has(provinceId) || provinceId == missingProvince.province_id) {
        sprite.tint = 0x424242;
        return true;
    }

    return false;
}

function renderBaseProvinceColors(sprite: ProvinceSprite) {
    var provinceId = sprite.province_history?.province_id;
    if(!provinceId){
        renderBaseColor(sprite);
        return true;
    }
    
    if(checkWaterAndWasteland(sprite)){
       return;
    }
    else {
        renderBaseColor(sprite);
        return;
    }
}

function renderBaseColor(sprite: ProvinceSprite) {
    if(sprite.base_color) {
        sprite.tint = 0x424242;
        return true;
    }
}

function mapSimpleColorStringToColor(input: string) : Color {
    return new Color(`rgb(${input})`)
}

async function reloadMap() {
    showMapLoader.value = true;
    await parseMap(`${modData.value.work_directory}/${modData.value.project_name}/provinces.bmp`, modData.value.project_name);
    loadedFiles.value = await readDirFileNames(mapFilesLocation);
    renderBase();
    showMapLoader.value = false;
}

function recenterMap() {
    var container = containerRef.value;
    dragging = false;

    // Apply movement to the stage
    container.x = 0;
    container.y = 0;
    container.scale.set(1);
}

function getMapModes() : CheckboxGroupValue[] {
    return [
        <CheckboxGroupValue>({ name: MapMode.Base.toString(), text: 'Base' }),
        <CheckboxGroupValue>({ name: MapMode.Area.toString(), text: 'Areas' }),
        <CheckboxGroupValue>({ name: MapMode.Region.toString(), text: 'Regions' }),
        <CheckboxGroupValue>({ name: MapMode.Subcontinent.toString(), text: 'Subcontinent' }),
        <CheckboxGroupValue>({ name: MapMode.ColonialRegions.toString(), text: 'Colonial' }),
        <CheckboxGroupValue>({ name: MapMode.Climate.toString(), text: 'Climate' }),
        <CheckboxGroupValue>({ name: MapMode.Weather.toString(), text: 'Weather' }),
        <CheckboxGroupValue>({ name: MapMode.Political.toString(), text: 'Political' }),
        <CheckboxGroupValue>({ name: MapMode.HRE.toString(), text: 'HRE' }),
        <CheckboxGroupValue>({ name: MapMode.Religious.toString(), text: 'Religion' }),
        <CheckboxGroupValue>({ name: MapMode.Developement.toString(), text: 'Developement' }),
        <CheckboxGroupValue>({ name: MapMode.TradeNodes.toString(), text: 'Trade' }),
        <CheckboxGroupValue>({ name: MapMode.TradeGoods.toString(), text: 'Goods' }),
    ];
}

function clearOverlay() {
    var app = appRef.value;
    var container = app.stage.getChildByName('RenderContainer') as cont;
    var overlayContainer = container.getChildByName('OverlayContainer') as cont;
    overlayContainer.removeChildren();
}

function renderSelectedMapMode(args: any) {
    var value = Number(args.value) as MapMode;
    clearOverlay();
    switch(value) {
        case MapMode.Base:
            renderBase();
            break;
        case MapMode.Area:
            renderAreaMap();
            break;
        case MapMode.Region:
            renderRegionMap();
            break;
        case MapMode.Subcontinent:
            renderSubcontinentMap();
            break;
        case MapMode.ColonialRegions:
            renderColonialRegions();
            break;
        case MapMode.Climate:
            renderClimate();
            break;
        case MapMode.Weather:
            renderWeather();
            break;
        case MapMode.Political:
            renderPoliticalMap();
            break;
        case MapMode.HRE:
            renderHREMap();
            break;
        case MapMode.Religious:
            renderReligiousMap();
            break;
        case MapMode.Developement:
            renderDevelopementMap();
            break;
        case MapMode.TradeNodes:
            renderTradeNodes();
            break;
        case MapMode.TradeGoods:
            renderTradeGoods();
            break;
    }
}

const showMapLoader = ref(false);

</script>

<template>
    <Loader :display="showMapLoader" style="top: 0; left:0;"></Loader>
    <div class="map-container simple-background golden-border">
        <div style="height: 135px;">
            <div class="flex-container" style="padding-top: 3px; padding-left: 3px;">
                <CheckboxGroup :values="getMapModes()" @value-changed="renderSelectedMapMode"></CheckboxGroup>
            </div>
            <div class="flex-container" style="padding-top: 3px;"> 
                <button class="small-button" @click="reloadMap"> Reload map file </button>
                <button class="small-button" @click="recenterMap"> Recenter map </button>
            </div> 
        </div>
        <div class="map-panel-container">
            <keep-alive>
                <Application @wheel="onWheelZoom" :backgroundColor="'black'">
                    <container :name="'RenderContainer'" ref="containerRef" @mousedown="(e : any) => onMouseDown(e)" @mousemove="(e: any) => onMouseMove(e)" @mouseup="onMouseUp">
                        <container :name="'OverlayContainer'"></container>
                    </container>
                </Application>
            </keep-alive>
            <HorizontallyResizablePanel :minWidth="150" :maxWidth="800" :initialWidth="250" :anchor="'right'" :floating="true" >
                <div>
                    <ProvinceHistoryForm :editedProvinceId="selectedProvince?.province_history?.province_id"></ProvinceHistoryForm>
                </div>
            </HorizontallyResizablePanel>
        </div>
    </div>
</template>

<style scoped>

.map-panel-container {
    height: 41rem;
    width: 90rem;
    display: flex;
}

.map-container {
    height: 50rem;
}

</style>
