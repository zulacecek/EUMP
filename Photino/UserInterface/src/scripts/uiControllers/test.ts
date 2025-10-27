import { TreeItemType, type Statement, type TreeItemEntry } from "@/components/basic_controls/builder_tree/builderTreeItemExtender";
import { type MissionNode, type MissionTree, type TreeItemOption } from "../../structs/missionStructs";
import { keyAvailableTreeItemMap } from "../appContext";
// import { nameToAreaMap } from "../repositories/areaRepository";
// import { countryTagToCountry } from "../repositories/countryRepository";
import { getLocalisationKeyTranslation, getMissionNameText } from "../repositories/localisationRepository";
// import { provinceIdToProvince } from "../repositories/provinceRepository";
// import { nameToRegionMap } from "../repositories/regionrepository";
import { deepClone, getArrowFunctionParams } from "../utils";
import { getGoldenText, getHighlightText } from "./htmlController";

const messageKeyToMessage = new Map<string, Function>([
    ["MsgUnprocessed", (msg: string) => msg],
    ["MsgYes", () => `Yes`],
    ["MsgNo", () => `No`],
    ["add_cardinal", () => "Gain a cardinal"],
    ["kill_heir", () => "Heir dies"],
    ["kill_ruler", () => "Ruler dies"],
    ["remove_cardinal", () => "Lose a cardinal"],
    ["remove_non_electors_emperors_from_empire_effect", () => "Remove all provinces from the Holy Roman Empire, unless an elector or the Emperor"],
    ["is_janissary_modifier", () => "(This is a Janissary modifier.)"],
    ["add_adm_power", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} administrative power`],
    ["add_army_tradition", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} army tradition`],
    ["add_authority", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} authority`],
    ["drill_gain_modifier", (amount: string) => coloredNumber(amount) + " Army drill gain modifier"],
    ["add_base_tax", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} base tax`],
    ["add_base_production", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} base production`],
    ["add_base_manpower", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} base manpower`],
    ["add_dip_power", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} diplomatic power`],
    ["add_doom", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} doom`],
    ["add_heir_claim", (amount: string) => `Heir ${gainOrLose(amount)} ${coloredNumber(amount)} claim strength`],
    ["add_devotion", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} devotion`],
    ["add_horde_unity", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} horde unity`],
    ["add_imperial_influence", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} imperial authority`],
    ["add_karma", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} karma`],
    ["add_legitimacy", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} legitimacy`],
    ["add_mil_power", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} military power`],
    ["add_navy_tradition", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} navy tradition`],
    ["add_papal_influence", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} papal influence`],
    ["add_prestige", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} prestige`],
    ["add_republican_tradition", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} republican tradition`],
    ["add_stability", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} stability`],
    ["add_war_exhaustion", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} war exhaustion`],
    ["add_yearly_manpower", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} ${pluralOrSingle(amount, "year's", "years'")} worth of manpower`],
    ["change_adm", (amount: string) => `Ruler ${gainOrLose(amount)} ${coloredNumber(amount)} administrative skill`],
    ["change_dip", (amount: string) => `Ruler ${gainOrLose(amount)} ${coloredNumber(amount)} diplomatic skill`],
    ["change_mil", (amount: string) => `Ruler ${gainOrLose(amount)} ${coloredNumber(amount)} military skill`],
    ["change_siege", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} siege progress`],
    ["add_patriarch_authority", (amount: string) => `${gainOrLose(amount)} ${coloredPercentage(numberFromPercetage(amount))} Patriarch authority`],
    ["add_piety", (amount: string) => `Gain ${numberFromPercetage(amount)} ${ifElseThen(toNumber(amount) > 0, "Legalism", "Mysticism")}`],
    ["change_statists_vs_orangists", (amount: string) => `Strengthen ${ifElseThen(toNumber(amount) > 0, "Orangist", "Stasists")} by ${numberFromPercetage(amount)} `],
    ["add_inflation", (amount: string) => `${gainOrLose(amount)} ${displayPercentage(amount)} inflation`],
    ["add_local_autonomy", (amount: string) => `${gainOrLose(amount)} ${displayPercentage(amount)} local autonomy`],
    ["reform_desire", (amount: string) => `Catholicism has at least ${displayPercentage(numberFromPercetage(amount))} reform desire`],
    ["add_reform_desire", (amount: string) => `Catholicism ${gainOrLose(amount)} ${displayPercentage(numberFromPercetage(amount))} reform desire`],
    ["add_mercantilism", (amount: string) => `${gainOrLose(amount)} ${coloredPercentage(amount)} mercantilism`],
    ["add_manpower", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} manpower`],
    ["num_of_provinces_owned_or_owned_by_subjects_with", (value: string) => `${getGoldenText(value)} provinces (current: #) owned by you or your subjects with:`],
    

    // Not used ??
    ["MsgGainMPFrac", (amount: string) => `${gainOrLose(amount)} manpower equal to ${coloredPercentage(numberFromPercetage(amount))} of maximum`],
    ["nationalism", (amount: string, inNotScope: boolean) => `Has ${inNotScope ? "less than" : "at least"} ${getGoldenText(amount)} ${pluralOrSingle(amount, "year", "years")} of separatism`],
    ["remove_country_modifier", () => "country modifier"],
    ["remove_province_modifier", () => "province modifier"],
    ["add_permanent_province_modifier", () => "permanent province modifier"],
    ["remove_ruler_modifier", () => "ruler modifier"],
    ["add_trade_modifier", () => "trade modifier"],

    ["add_ruler_modifier", (modid: string, type: string, name: string, days: string) => `Gain ${type} ${textInQuotes(name)} <!-- ${modid} --> for ${Number(days) < 0 ? (type === "ruler" ? "the duration of the current ruler's reign" : "the rest of the game") : `${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`} , giving the following effects:`],
    ["remove_province_modifier", (modid: string) => `Remove province modifier "${getGoldenText(modid)}"`],
    ["and", () => "All of the following must be true:"],

    // TODO: What are these ?
    ["MsgAddMod", (modid: string, name: string, days: string) => `Gain modifier ${textInQuotes(name)} <!-- ${modid} --> for ${getGoldenText(days)} days`],
    ["MsgGainMod", (modid: string, type: string, name: string) => `Gain ${type} ${textInQuotes(name)}, <!-- ${modid} --> giving the following effects:`],
    ["MsgGainModPow", (modid: string, type: string, name: string, pow: string) => `Gain ${type} ${textInQuotes(name)} <!-- ${modid} --> (${coloredNumberSigned(pow)} Power)`],
    ["MsgGainModPowDur", (modid: string, type: string, name: string, pow: string, days: string) => `Gain ${type} ${textInQuotes(name)} <!-- ${modid} --> (${coloredNumberSigned(pow)} Power) for ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],
    ["MsgActorGainsMod", (modid: string, who: string, type: string, name: string) => `${getGoldenText(who)} gains ${type} ${textInQuotes(name)} <!-- ${modid} --> giving the following effects:`],
    ["MsgActorGainsModDur", (modid: string, who: string, type: string, name: string, days: string) => `${getGoldenText(who)} gains ${type} ${textInQuotes(name)} <!-- ${modid} --> for ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")} , giving the following effects:`],
    ["MsgActorGainsModPow", (modid: string, who: string, type: string, name: string, pow: string) => `${getGoldenText(who)} gains ${type} ${textInQuotes(name)} <!-- ${modid} --> (${coloredNumberSigned(pow)} Power)`],
    ["MsgActorGainsModPowDur", (modid: string, who: string, type: string, name: string, pow: string, days: string) => `${getGoldenText(who)} gains ${type} ${textInQuotes(name)} <!-- ${modid} --> (${coloredNumberSigned(pow)} Power) for ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],

    ["has_country_modifier", (name: string, inNotScope: boolean) => `${inNotScope ? "NOT have" : "Have"} the modifier ${getGoldenText(name)}`],
    ["has_ruler_modifier", (name: string, inNotScope: boolean) => `${inNotScope ? "NOT have" : "Have"} the ruler modifier ${getGoldenText(name)}`],
    ["has_province_modifier", (name: string, inNotScope: boolean) => `${inNotScope ? "NOT have" : "Have"} the province modifier ${getGoldenText(name)}`],
    ["has_trade_modifier", (name: string, inNotScope: boolean) => `${inNotScope ? "NOT have" : "Have"} the trade modifier ${getGoldenText(name)}`],
    ["has_global_modifier_value", (which: string, value: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(displayPercentage(numberFromPercetage(value)))} ${getGoldenText(which)}`],

    // TODO - Probably solve by code
    ["MsgFROM", () => "FROM:"],
    ["MsgROOT", () => "ROOT"],
    ["MsgROOTCountry", () => "Our country"],
    ["MsgROOTCountryAsOther", () => "same as our country"],
    ["MsgROOTProvince", () => "The currently considered province"],
    ["MsgROOTProvinceOwner", () => "the owner of the currently considered province"],
    ["MsgROOTProvinceAsOther", () => "same as the currently considered province"],
    ["MsgROOTTradeNode", () => "The currently considered trade node"],
    ["MsgROOTGeographic", () => "The currently considered location"],
    ["MsgPREV", () => "PREV"],
    ["MsgPREVCountry", () => "Previously mentioned country"],
    ["MsgPREVCountryAsOther", () => "same as the previously mentioned country"],
    ["MsgPREVProvince", () => "The previously mentioned province"],
    ["MsgPREVProvinceOwner", () => "the owner of the previously mentioned province"],
    ["MsgPREVProvinceAsOther", () => "same as the previously mentioned province"],
    ["MsgPREVTradeNode", () => "The previously mentioned trade node"],
    ["MsgPREVGeographic", () => "The previously mentioned location"],
    ["MsgTHISCountry", () => "this country"],
    ["MsgTHISCountryAsOther", () => "same as this country"],
    ["MsgTHISProvince", () => "this province"],
    ["MsgTHISProvinceOwner", () => "the owner of this province"],
    ["MsgTHISProvinceAsOther", () => "same as this province"],
    ["MsgTHISTradeNode", () => "This trade node"],
    ["MsgTHISGeographic", () => "This location"],


    ["emperor", () => "Emperor"],

    // Scope e.g. set_dynasty = original_dynasty
    ["MsgOriginalDynasty", () => "the country's original dynasty"],
    ["MsgHistoricDynasty", () => "one of the country's historical dynasties"],


    ["not", () => `${getHighlightText("Not: ")}`],
    ["all_core_province", () => "All core provinces:"],
    ["all_province", () => "All provinces:"],
    ["all_subject_country", () => "All subject countries:"],

    // For effect when province is scope
    ["MsgArea", () => "Area containing this province:"],

    ["or", () => "One of the following must be true:"],
    ["any_active_trade_node", () => "Any trade node with a merchant present:"],
    ["any_ally", () => "Any ally:"],
    ["any_core_country", () => "Any country with a core on this province:"],
    ["any_core_province", () => "Any core province:"],
    ["any_country", () => "Any country in the world:"],
    ["any_empty_neighbor_province", () => "Any neighbouring uncolonized province:"],
    ["any_enemy_country", () => "Any enemy country:"],
    ["any_heretic_province", () => "Any province with heretic religion:"],
    ["any_known_country", () => "Any known country:"],
    ["any_neighbor_country", () => "Any neighbouring country:"],
    ["any_neighbor_province", () => "Any neighbouring province:"],
    ["any_owned_province", () => "Any owned province:"],
    ["any_privateering_country", () => "Any country privateering in this node:"],
    ["any_province", () => "Any province:"],
    ["any_rival_country", () => "Any rival:"],
    ["any_subject_country", (inNotScope: boolean) => `${inNotScope ? "No" : "Any" } subject country:`],
    ["any_trade_node", () => "Any trade node:"],
    ["capital_scope", () => "Capital"],
    ["controller", () => "Province controller"],

    // TODO: test
    ["else", () => `${getHighlightText("Else:")}`],
    // ["else", () => '_'.repeat(35)],
    ["all_country", () => "All countries in the world:"],
    ["all_neighbor_country", () => "All neighbouring countries:"],
    ["every_active_trade_node", () => "Every trade node with a merchant present:"],
    ["every_ally", () => "Every ally:"],
    ["every_country", () => "Every country in the world:"],
    ["every_core_country", () => "Every country with a core:"],
    ["every_core_province", () => "Every core province:"],
    ["every_enemy_country", () => "Every enemy country:"],
    ["every_heretic_province", () => "Every province with heretic religion:"],
    ["every_known_country", () => "Every known country:"],
    ["every_neighbor_country", () => "Every neighbouring country:"],
    ["every_neighbor_province", () => "Every neighbouring province:"],
    ["every_owned_province", () => "Every owned province:"],
    ["every_province", () => "Every province in the world:"],
    ["every_rival_country", () => "Every rival:"],
    ["every_subject_country", () => "Every subject country:"],
    ["hidden_effect", () => "Hidden effect:"],

    //TODO test
    ["if", () => `${getHighlightText("If:")}`],
    ["else_if", () => `${getHighlightText("Else If:")}`],
    // ["if", () => '='.repeat(25)],
    ["limit", () => "Limited to:"],
    ["most_province_trade_power", () => "The country with the most provincial trade power:"],
    ["overlord", () => "Overlord:"],
    ["owner", () => "Province owner:"],
    ["random_active_trade_node", () => "One random trade node with a merchant present:"],
    ["random_ally", () => "One random ally:"],
    ["random_core_country", () => "One random country with a core:"],
    ["random_core_province", () => "One random core province:"],
    ["random_country", () => "One random country:"],
    ["random_elector", () => "One random elector:"],
    ["random_empty_neighbor_province", () => "One random neighbouring uncolonized province:"],
    ["random_heretic_province", () => "One random province with heretic religion:"],
    ["random_known_country", () => "One random known country:"],
    ["MsgRandomList", () => "One of the following at random:"],
    ["random_neighbor_country", () => "One random neighbouring country:"],
    ["random_neighbor_province", () => "One random neighbouring province:"],
    ["random_owned_province", () => "One random owned province:"],
    ["random_privateering_country", () => "One random country privateering in this node:"],
    ["random_province", () => "One random province:"],
    ["random_rival_country", () => "One random rival:"],
    ["random_subject_country", () => "One random subject country:"],
    ["random_trade_node", () => "One random trade node:"],
    ["strongest_trade_power", () => "The country with the most trade power:"],
    ["while", () => "While:"],

    ["random", (chance: string) => `${numberToPercentage(chance)} chance of:`],
    ["random_list", () => "One of the following at random:"],
    ["change_government", (what: string) => `Change government to ${getGoldenText(what)}`],

    // when province is in continent
    ["continent", (what: string) => `Continent is ${getGoldenText(what)}`],
    // when province is the same continent and another province
    ["MsgContinentIsAs", (what: string) => `Continent is the same as ${getGoldenText(what)}`],

    // when of province is culture
    ["culture", (what: string) => `Culture is ${getGoldenText(what)}`],
    // when province culture is the same of another province
    ["MsgCultureIsAs", (who: string) => `Culture is the same as ${getGoldenText(who)}`],

    // when culture is in culture group like culture_group = iberian
    ["culture_group", (what: string, inNotScope: boolean) => `The culture group ${inNotScope ? "is NOT" : "is"} ${getGoldenText(what)}`],
    // when culture is in the group as another like culture_group = andalusion
    ["MsgCultureGroupAs", (what: string) => `Culture is in the same group as ${getGoldenText(what)}`],

    // when value in ""
    ["dynasty", (what: string) => `Ruler is of ${getGoldenText(what)} dynasty`],
    // When scope/tag
    ["Msgdynasty", (who: string) => `Ruler is of the same dynasty as ${getGoldenText(who)}`],

    // heir culture is culture
    ["heir_nationality", (what: string) => `Heir's culture is ${getGoldenText(what)}`],
    // heir culture is the same as scope
    ["MsgHeirNationalityAs", (who: string) => `Heir's culture is the same as ${getGoldenText(who)}`],


    // heir religion is religion
    ["heir_religion", (what: string) => `Heir's religion is ${getGoldenText(what)}`],
    // heir religion is same as scope
    ["MsgHeirReligionAs", (who: string) => `Heir's religion is the same as ${getGoldenText(who)}`],

    // set heir religion to religion
    ["set_heir_religion", (what: string) => `Heir's religion becomes ${getGoldenText(what)}`],
    // set heir religion as scope religion
    ["MsgsetHeiReligion", (who: string) => `Heir's religion becomes that of ${getGoldenText(who)}`],

    ["end_disaster", (what: string) => `Disaster ${textInQuotes(what)} ends`],
    ["government", (what: string) => `Government is ${getGoldenText(what)}`],
    ["has_advisor", (whom: string) => `Has advisor ${getGoldenText(whom)}`],
    ["advisor", (what: string) => `Has ${getGoldenText(what)} advisor`],
    ["has_terrain", (what: string) => `Has ${getGoldenText(what)} terrain`],

    // TODO: How is this used ? Also implement for the special unit types like mamluks_cavalry etc.
    ["cavalry", (whom: string) => `A cavalry regiment loyal to ${getGoldenText(whom)} spawns`],
    ["MsgCavalrySpawnsProvince", (where: string) => `A cavalry regiment spawns in ${getGoldenText(where)}`],

    // TODO: same as cavalry
    ["infantry", (whom: string) => `An infantry regiment loyal to ${getGoldenText(whom)} spawns`],
    ["MsgInfantrySpawnsProvince", (where: string) => `An infantry regiment spawns in ${getGoldenText(where)}`],


    ["kill_advisor", (who: string) => `Advisor ${getGoldenText(who)} dies`],

    // primary culture is exact culture
    ["primary_culture", (what: string) => `Primary culture is ${getGoldenText(what)}`],

    // primary culture is the same as scope
    ["MsgPrimaryCultureIsAs", (what: string) => `Primary culture is the same as ${getGoldenText(what)}`],

    ["region", (what: string) => `${getGoldenText("Province(s)")} is in the region ${getGoldenText(what)}`],
    ["superregion", (what: string) => `${getGoldenText("Province(s)")} is in the ${getGoldenText(what)} superregion`],
    ["remove_advisor", (who: string) => `Advisor ${getGoldenText(who)} leaves the country's court`],
    ["remove_estate", (whom: string) => `Remove province from the ${getGoldenText(whom)} estate`],
    ["has_disaster", (what: string) => `The ${textInQuotes(what)} disaster is ongoing`],
    ["province_id", (what: string) => `Province is ${getGoldenText(what)}`],
    ["owns", (what: string) => `Owns province ${getGoldenText(what)}`],
    ["owns_core_province", (what: string) => `Owns core province ${getGoldenText(what)}`],
    ["controls", (what: string) => `Controls province ${getGoldenText(what)}`],
    ["advisor_exists", (advisorID: string) => `Advisor with ID ${getGoldenText(advisorID)} exists`],
    ["is_advisor_employed", (advisorID: string) => `Advisor with ID ${getGoldenText(advisorID)} is employed`],
    ["MsgClearFlag", (flagType: string, name: string) => `Clear ${flagType} flag ${getGoldenText(name)}`],

    // TODO: all flag checks. Province/Country/global etc.
    ["MsgSetFlag", (flagType: string, name: string) => `Set ${flagType} flag ${getGoldenText(name)}`],
    ["MsgHadFlag", (category: string, name: string, days: string) => `Has had ${category} flag ${getGoldenText(name)} for ${getGoldenText(days)} days`],
    
    
    ["has_country_flag", (name: string) => `Country flag ${getGoldenText(name)} is set`],
    ["set_country_flag", () => "country"],
    ["set_province_flag", () => "province"],
    ["set_ruler_flag", () => "ruler"],
    ["set_global_flag", () => "global"],
    ["had_country_flag", (name: string, days: string) => `Has had country flag ${getGoldenText(name)} for at least ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],
    ["had_province_flag", (name: string, days: string) => `Has had province flag ${getGoldenText(name)} for at least ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],
    ["had_ruler_flag", (name: string, days: string) => `Has had ruler flag ${getGoldenText(name)} for at least ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],
    ["had_global_flag", (name: string, days: string) => `Global flag ${getGoldenText(name)} has been set for at least ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],
    ["MsgColonySettlers", (amount: string) => `Colony has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "settler", "settlers")}`],
    ["had_recent_war", (amount: string) => `Was at war within the last ${getGoldenText(amount)} ${pluralOrSingle(amount, "month", "months")}`],
    ["heir_age", (amount: string) => `Heir is at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "year", "years")} old`],
    ["is_year", (amount: string) => `Year is ${getGoldenText(amount)} or later`],
    ["num_of_loans", (amount: string, inNotScope: boolean) => `Number of Loans ${inNotScope ? "less than" : "at least"} ${getGoldenText(amount)}`],
    ["num_of_mercenaries", (amount: string) => `Has at least ${getGoldenText(amount)} mercenary ${pluralOrSingle(amount, "regiment", "regiments")}`],
    ["num_of_missionaries", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "missionary", "missionaries")}`],

    ["num_of_ports", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "port", "ports")}`],
    // These are same ?
    ["num_of_total_ports", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "port", "ports")}`],

    ["num_of_times_improved", (amount: string) => `Has been improved at least ${getGoldenText(amount)} times.`],
    

    ["num_of_rebel_armies", (amount: string) => `At least ${getGoldenText(amount)} rebel ${pluralOrSingle(amount, "army is", "armies are")} present in the country`],
    ["num_of_trade_embargos", (amount: string) => `Is embargoing at least ${getGoldenText(amount)} other ${pluralOrSingle(amount, "country", "countries")}`],
    ["units_in_province", (amount: string) => `Province contains at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "regiment", "regiments")}`],
    ["num_of_cities", (amount: string) => `Owns at least ${getGoldenText(amount)} non-colony ${pluralOrSingle(amount, "province", "provinces")}`],
    ["num_of_cities", (whom: string) => `Owns at least as many cities as ${getGoldenText(whom)}`],
    ["tolerance_to_this", (amount: string) => `Tolerance to this religion is at least ${coloredNumber(amount)}`],
    ["adm", (amount: string) => `Ruler's administrative skill is at least ${getGoldenText(amount)}`],
    ["adm_tech", (amount: string) => `Administrative technology is at least ${getGoldenText(amount)}`],
    ["army_tradition", (amount: string) => `Army tradition is at least ${getGoldenText(amount)}`],
    ["army_tradition_from_battle", (amount: string) => `${coloredNumber(amount)} Army tradition from battles`],

    // modifier - Same as trigger
    // ["<SGarmy_tradition", (amount: string) => `${coloredNumberSigned(amount)} Yearly army tradition`],

    ["base_manpower", (amount: string) => `Base manpower is at least ${getGoldenText(amount)}`],
    ["base_production", (amount: string) => `Base production is at least ${getGoldenText(amount)}`],
    ["base_tax", (amount: string) => `Base tax is at least ${getGoldenText(amount)}`],
    ["create_admiral", (amount: string) => `Gain admiral with ${getGoldenText(amount)} navy tradition`],
    ["create_conquistador", (amount: string) => `Gain conquistador with ${getGoldenText(amount)} navy tradition`],
    ["create_explorer", (amount: string) => `Gain explorer with ${getGoldenText(amount)} navy tradition`],
    ["num_of_explorers", (amount: string) => `Number of explorers at least ${getGoldenText(amount)}`],
    ["create_general", (amount: string) => `Gain general with ${getGoldenText(amount)} army tradition`],
    ["development", (development: string) => `Development is at least ${development}`],
    ["grown_by_development", (development: string) => `Have grown at least by ${development} development`],
    
    ["dip", (amount: string) => `Ruler's diplomatic skill is at least ${getGoldenText(amount)}`],
    ["dip_tech", (amount: string) => `Diplomatic technology is at least ${getGoldenText(amount)}`],
    ["horde_unity", (amount: string) => `Horde unity is at least ${getGoldenText(amount)}`],
    ["horde_unity", (amount: string) => `${coloredNumberSigned(amount)} Yearly horde unity`],
    ["karma", (amount: string) => `Karma is at least ${coloredPercentage(amount)}`],

    ["legitimacy", (amount: string) => `Legitimacy is at least ${getGoldenText(amount)}`],
    // when legitimacy compared to scope
    ["MsglegitimacyAs", (who: string) => `As much Legitimacy as ${getGoldenText(who)}`],

    // Not used ?
    ["MsgYearlyLegitimacy", (amount: string) => `${coloredNumberSigned(amount)} Yearly legitimacy`],

    ["mil", (amount: string) => `Ruler's military skill is at least ${getGoldenText(amount)}`],
    ["mil_tech", (amount: string) => `Military technology is at least ${getGoldenText(amount)}`],
    ["military_strength", (who: string, value: string) => `Military strength is at least ${getGoldenText(displayPercentage(numberFromPercetage(value)))} of ${getGoldenText(who)}`],

    ["num_of_allies", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "ally", "allies")}`],
    ["num_of_cardinals", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "cardinal", "cardinals")}`],
    ["num_of_colonists", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "colonist", "colonists")}`],

    ["num_of_heavy_ship", (amount: string) => `Has at least ${getGoldenText(amount)} heavy ${pluralOrSingle(amount, "ship", "ships")}`],    
    ["num_of_heavy_ship_scope", (scope: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "more or equal"} heavy ships than ${getGoldenText(scope)} (#)`],
    
    ["num_of_light_ship", (amount: string) => `Has at least ${getGoldenText(amount)} light ${pluralOrSingle(amount, "ship", "ships")}`],
    ["num_of_light_ship_scope", (scope: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "more or equal"} light ships than ${getGoldenText(scope)} (#)`],

    ["num_of_merchants", (amount: string) => `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "merchant", "merchants")}`],
    ["stability", (amount: string) => `Stability is at least ${getGoldenText(amount)}`],
    ["total_development", (amount: string) => `Total development is at least ${getGoldenText(amount)} (Currrently #)`],
    ["total_number_of_cardinals", (amount: string) => `At least ${getGoldenText(amount)} ${pluralOrSingle(amount, "cardinal", "cardinals")} exist in the world`],
    ["unrest", (amount: string) => `Unrest is at least ${getGoldenText(amount)}`],
    ["monthly_income", (amount: string) => `Monthly income is at least ${coloredNumber(amount)} ducats`],

    ["war_exhaustion", (amount: string) => `War exhaustion is at least ${getGoldenText(amount)}`],
    // when compared to scope
    ["Msgwar_exhaustionAs", (amount: string) => `War exhaustion is at least ${getGoldenText(amount)}`],

    // TODO: Not used ?
    ["MsgMonthlyWarExhaustion", (amount: string) => `${getGoldenText(amount)} Monthly war exhaustion`],
    ["war_score", (amount: string) => `War score is at least ${coloredPercentage(amount)}`],
    ["republican_tradition", (amount: string) => `Republican tradition is at least ${getGoldenText(amount)}`],
    ["republican_tradition", (amount: string) => `${coloredNumber(amount)} Yearly republican tradition`],
    ["inflation", (amount: string, inNotScope: boolean) => `Inflation is ${inNotScope ? "less than" : "at least"}  ${getGoldenText(displayPercentage(amount))}`],
    ["local_autonomy", (amount: string) => `Local autonomy is at least ${displayPercentage(amount)}`],
    ["manpower", (amount: string) => `Has at least ${getGoldenText((toThousands(amount)))} manpower`],
    ["manpower_percentage", (amount: string) => `Manpower reserves are at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))} of maximum`],
    ["mercantilism", (amount: string) => `Mercantilism is at least ${getGoldenText(amount)}`],
    ["change_trade_goods", (what: string) => `Change province's goods produced to ${getGoldenText(what)}`],
    ["create_advisor", (what: string) => `Gain ${getGoldenText(what)} advisor`],
    ["has_idea_group", (what: string) => `Has activated ${getGoldenText(what)}`],

    ["trade_goods", (what: string) => `Produces ${getGoldenText(what)}`],
    // TODO: compared to scope
    ["MsgProducesSameGoods", (where: string) => `Produces the same goods as ${getGoldenText(where)}`],

    ["has_estate", (what: string, inNotScope: boolean, currentScope: string) => `${getGoldenText(currentScope)} ${inNotScope ? "Does NOT" : "Does"} have the ${getGoldenText(what)} Estate.`],

    ["is_monarch_leader", () => `Ruler is a general`],
    ["alliance_with", (whom: string) => `Is allied to ${getGoldenText(whom)}`],
    ["cede_province", (whom: string) => `Cede province to ${getGoldenText(whom)}`],
    ["controlled_by", (whom: string) => `Province is controlled by ${getGoldenText(whom)}`],
    ["country_or_non_sovereign_subject_holds", (whom: string) => `Owned by ${getGoldenText(whom)} or by its non-Tributary Subjects.`],
    ["defensive_war_with", (whom: string) => `Is defending in a war against ${getGoldenText(whom)}`],
    ["discover_country", (whom: string) => `Discover ${getGoldenText(whom)}`],
    ["discover_province", (what: string) => `Discover ${getGoldenText(what)}`],
    ["add_claim", (who: string) => `${getGoldenText(who)} gains a claim on this province`],

    ["add_permanent_claim", (where: string) => `Gain a permanent claim on ${getGoldenText(where)}`],
    ["add_permanent_claim_scope", (scope: string) => `${getGoldenText(scope)} gains a permanent claim on this province`],

    // country is scope
    ["has_discovered", (whomOrWhere: string) => `Has discovered ${whomOrWhere}`],
    ["has_discovered_scope", (scope: string) => `Has been discovered by ${getGoldenText(scope)}`],

    ["inherit", (whom: string) => `Inherit ${getGoldenText(whom)}`],
    ["is_neighbor_of", (whom: string) => `Has a border with ${getGoldenText(whom)}`],
    ["is_rival", (whom: string, inNotScope: boolean) => `${getGoldenText(whom)} ${inNotScope ? "is not" : "is"} a rival`],
    ["is_subject_of", (whom: string) => `Is a subject of ${getGoldenText(whom)}`],

    ["remove_core", (who: string) => `${getGoldenText(who)} loses their core on this province`],
    ["MsgLoseCoreProvince", (where: string) => `Lose core on ${getGoldenText(where)}`],
    
    ["marriage_with", (whom: string) => `Has a royal marriage with ${getGoldenText(whom)}`],
    ["offensive_war_with", (whom: string) => `Is attacking in a war against ${getGoldenText(whom)}`],
    ["owned_by", (whom: string, inNotScope: boolean) => `${inNotScope ? "Is NOT" : "Is"} owned by ${getGoldenText(whom)}`],
    ["release", (whom: string) => `Release ${getGoldenText(whom)} as a vassal`],
    ["sieged_by", (whom: string) => `Province is under siege by ${getGoldenText(whom)}`],
    ["support_independence_of", (whom: string) => `Support the independence of ${getGoldenText(whom)}`],
    ["tag", (who: string) => `Is ${getGoldenText(who)}`],
    ["truce_with", (whom: string) =>  `Has a truce with ${getGoldenText(whom)}`],
    // @ts-ignore
    ["trust", (who: string, value: string, _: boolean, currentScope: string) =>  `Trust at least ${getGoldenText(value)}.`],

    ["war_with", (whom: string) => `Is at war with ${getGoldenText(whom)}`],
    ["white_peace", (whom: string) => `Make a white peace with ${getGoldenText(whom)}`],

    // Value is country
    ["MsgCountryExists", (who: string) => `${getGoldenText(who)} exists`],
    // Country is scope
    ["exists", (who: string, inNotScope: boolean) => `${who} ${inNotScope ? "Does NOT exist" : "Exists"}`],

    ["religion", (what: string, inNotScope: boolean) => `Religion ${inNotScope ? "is NOT" : "is" } ${getGoldenText(what)}`],
    ["religion_scope", (scope: string, inNotScope: boolean) => `Religion ${inNotScope ? "is NOT" : "is" } the same as ${getGoldenText(scope)}`],

    ["religion_group", (what: string, inNotScope: boolean) => `Religion ${inNotScope ? "is NOT" : "is" } in ${getGoldenText(what)} group`],
    ["religion_group_scope", (scope: string, inNotScope: boolean) => `Religious group ${inNotScope ? "is NOT" : "is" } same as ${getGoldenText(scope)}`],

    ["MsgChangeSameReligion", (whom: string) => `Change religion to that of ${getGoldenText(whom)}`],
    ["change_religion", (what: string) => `Change religion to ${getGoldenText(what)}`],

    ["is_core", (whom: string) => `Is a core of ${getGoldenText(whom)}`],
    ["MsgHasCoreOn", (what: string) => `Has a core on ${getGoldenText(what)}`],

    ["is_claim", (who: string) => `${getGoldenText(who)} has a claim on this province`],
    ["MsgHasClaimOn", (what: string) => `Has a claim on ${getGoldenText(what)}`],

    ["ai", (yn: string) => `Is ${ifElseThenYesNo(yn, "AI", "player")}-controlled`],
    ["has_cardinal", (yn: string) => `${ifElseThenYesNo(yn, "Has", "Does ''not'' have")} a cardinal`],
    ["has_heir", (yn: string) => `${ifElseThenYesNo(yn, "Has", "Does ''not'' have")} an heir`],
    ["has_owner_culture", (yn: string) => `Has ${ifElseThenYesNo(yn, "the same culture as", "a different culture from")} its owner`],
    ["has_owner_religion", (yn: string) => `Has ${ifElseThenYesNo(yn, "the same religion as", "a different religion from")} its owner`],
    ["has_port", (yn: string) => `${ifElseThenYesNo(yn, "Has", "Does ''not'' have")} a port`],
    ["has_seat_in_parliament", (yn: string) => `${ifElseThenYesNo(yn, "Has", "Does ''not'' have")} a seat in Parliament`],
    ["has_regency", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} in a regency`],
    ["unit_in_siege", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} under siege`],
    ["is_at_war", (yn: string) => `${ifElseThenYesNo(yn, "At War", "At Peace")} `],
    ["is_capital", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} the country's capital`],
    ["is_city", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} a city`],
    ["is_colony", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} a colony`],
    ["is_emperor", (yn: string) => `Is${ifElseThenYesNo(yn, "", " NOT")} the Holy Roman Emperor`],
    ["is_female", (yn: string) => `Ruler is ${ifElseThenYesNo(yn, "female", "male")}`],
    ["is_lesser_in_union", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} a lesser partner in a personal union`],
    ["is_looted", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} looted`],
    ["is_overseas", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} overseas`],
    ["is_part_of_hre", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} part of the Holy Roman Empire`],
    ["is_reformation_center", (yn: string) => `Is${ifElseThenYesNo(yn, "", " ''not''")} a Center of Reformation`],
    ["is_subject", (yn: string) => `Is${ifElseThenYesNo(yn, "", " not")} a subject nation`],
    ["papacy_active", (yn: string) => `Papal interaction is${ifElseThenYesNo(yn, "", " ''not''")} active`],
    ["is_papal_controller", () => `Are the Papal controller`],
    
    ["was_player", (yn: string) => `Has${ifElseThenYesNo(yn, "", " ''never''")} been player-controlled`],
    ["is_statists_in_power", (yn: string) => `The Statists are${ifElseThenYesNo(yn, "", " ''not''")} in power`],
    ["is_orangists_in_power", (yn: string) => `The Orangists are${ifElseThenYesNo(yn, "", " ''not''")} in power`],

    // TODO:
    ["MsgGainCB", (cbtype: string, whom: string) => `Gain ${cbtype} casus belli against ${getGoldenText(whom)}`],
    ["MsgGainCBDuration", (cbtype: string, whom: string, months: string) => `Gain ${cbtype} casus belli against ${getGoldenText(whom)} for ${months} months`],
    ["MsgReverseGainCB", (cbtype: string, who: string) => `${getGoldenText(who)} gains ${cbtype} casus belli against this country`],
    ["MsgReverseGainCBDuration", (cbtype: string, who: string, months: string) => `${getGoldenText(who)} gains ${cbtype} casus belli against this country for ${months} months`],
    ["MsgFactionGainInfluence", (whom: string, amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} influence for the ${getGoldenText(whom)} faction`],
    ["MsgFactionInPower", (whom: string) => `${getGoldenText(whom)} faction is in power`],


    ["has_factions", (yn: string) => `${ifElseThenYesNo(yn, "Has", "Does ''not'' have")} factions`],
    ["has_building", (what: string) => `Has ${getGoldenText(what)} building`],

    // Not used ?
    ["MsgIndefinitely", () => "indefinitely"],
    ["MsgForDays", (days: string) => `for ${getGoldenText(days)} days`],
    
    ["estate_loyalty", (estate: string, loyalty: string) => `${getGoldenText(estate)} loyalty is at least ${getGoldenText(loyalty)}`],
    ["estate_influence", (estate: string, influence: string) => `${getGoldenText(estate)} influence is at least ${getGoldenText(influence)}`],
    ["num_of_estate_agendas_completed", (estate: string, value: string) => `${getGoldenText(value)} Agendas from ${getGoldenText(estate)} completed`],
    ["num_of_estate_privileges", (estate: string, value: string) => `${getGoldenText(value)} Privileges currently granted to ${getGoldenText(estate)}`],
    
    ["add_opinion", (modid: string, what: string, whom: string) => `Gain opinion modifier ${textInQuotes(what)} <!-- ${modid} --> towards ${getGoldenText(whom)}`],
    ["MsgNewHeir", () => "Gain a new heir"],
    
    // Not used ?
    ["MsgNewHeirClaim", (claim: string) => `Gain a new heir with claim strength ${claim}`],
    ["MsgNewHeirDynasty", (flag: string) => `Gain a new heir of the same dynasty as ${flag}`],
    ["MsgNewHeirDynastyClaim", (claim: string) => `Gain a new heir with claim strength ${claim}`],
    ["MsgNewHeirAge", (age: string) => `Gain a new ${age} year old heir`],
    ["MsgNewHeirAgeClaim", (age: string, claim: string) => `Gain a new ${age} year old heir with claim strength ${claim}`],
    ["MsgNewHeirAgeFlag", (age: string, flag: string) => `Gain a new ${age} year old heir of the same dynasty as ${flag}`],
    ["MsgNewHeirAgeFlagClaim", (age: string, flag: string, claim: string) => `Gain a new ${age} year old heir of the same dynasty as ${flag} with claim strength ${claim}`],


    ["build_to_forcelimit", (infantry: string, cavalry: string, artillery: string) => `Build land units to forcelimit: ${numberToPercentage(infantry)} infantry, ${numberToPercentage(cavalry)} cavalry, ${numberToPercentage(artillery)} artillery`],
    // Not used ?
    ["MsgBuildToForcelimitNavy", (heavy: string, light: string, galley: string, transport: string) => `Build naval units to forcelimit:${numberToPercentage(heavy)} heavy ships, ${numberToPercentage(light)} light ships, ${numberToPercentage(galley)} galleys, ${numberToPercentage(transport)} transports`],
    ["province_event", () => "province event"],
    ["country_event", () => "country event"],

    // Not used ?
    ["MsgTriggerEvent", (evttype: string, evtid: string, name: string) => `Trigger ${evttype} ${textInQuotes(name)} <!-- ${evtid} -->`],
    ["MsgTriggerEventDays", (evttype: string, evtid: string, name: string, days: string) => `Trigger ${evttype} ${textInQuotes(name)} <!-- ${evtid} --> in ${getGoldenText(days)} days`],


    ["declare_war_with_cb", (whom: string, cbtype: string) => `Declare war on ${getGoldenText(whom)} using ${cbtype} casus belli`],

    // Not used ? define_advisor instead
    ["MsgGainAdvisor", (skill: string) => `Gain skill ${skill} advisor`],
    ["MsgGainAdvisorDiscount", (skill: string) => `Gain skill ${skill} advisor (50% cheaper to employ)`],
    ["MsgGainAdvisorLoc", (where: string, skill: string) => `Gain skill ${skill} advisor in ${getGoldenText(where)}`],
    ["MsgGainAdvisorLocDiscount", (where: string, skill: string) => `Gain skill ${skill} advisor in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainAdvisorName", (name: string, skill: string) => `Gain skill ${skill} advisor named ${getGoldenText(name)}`],
    ["MsgGainAdvisorNameDiscount", (name: string, skill: string) => `Gain skill ${skill} advisor named ${getGoldenText(name)} (50% cheaper to employ)`],
    ["MsgGainAdvisorNameLoc", (name: string, where: string, skill: string) => `Gain skill ${skill} advisor named ${getGoldenText(name)} in ${getGoldenText(where)}`],
    ["MsgGainAdvisorNameLocDiscount", (name: string, where: string, skill: string) => `Gain skill ${skill} advisor named ${getGoldenText(name)} in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainAdvisorType", (advtype: string, skill: string) => `Gain skill ${skill} ${advtype} advisor`],
    ["MsgGainAdvisorTypeDiscount", (advtype: string, skill: string) => `Gain skill ${skill} ${advtype} advisor (50% cheaper to employ)`],
    ["MsgGainAdvisorTypeLoc", (advtype: string, where: string, skill: string) => `Gain skill ${skill} ${advtype} advisor in ${getGoldenText(where)}`],
    ["MsgGainAdvisorTypeLocDiscount", (advtype: string, where: string, skill: string) => `Gain skill ${skill} ${advtype} advisor in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainAdvisorTypeName", (advtype: string, name: string, skill: string) => `Gain skill ${skill} ${advtype} advisor named ${getGoldenText(name)}`],
    ["MsgGainAdvisorTypeNameDiscount", (advtype: string, name: string, skill: string) => `Gain skill ${skill} ${advtype} advisor named ${getGoldenText(name)} (50% cheaper to employ)`],
    ["MsgGainAdvisorTypeNameLoc", (advtype: string, name: string, where: string, skill: string) => `Gain skill ${skill} ${advtype} advisor named ${getGoldenText(name)} in ${getGoldenText(where)}`],
    ["MsgGainAdvisorTypeNameLocDiscount", (advtype: string, name: string, where: string, skill: string) => `Gain skill ${skill} ${advtype} advisor named ${getGoldenText(name)} in ${getGoldenText(where)} (50% cheaper to employ)`],

    // same as previous
    ["MsgGainFemaleAdvisor", (female: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor`],
    ["MsgGainFemaleAdvisorDiscount", (female: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorLoc", (female: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor in ${getGoldenText(where)}`],
    ["MsgGainFemaleAdvisorLocDiscount", (female: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorName", (female: string, name: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor named ${getGoldenText(name)}`],
    ["MsgGainFemaleAdvisorNameDiscount", (female: string, name: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor named ${getGoldenText(name)} (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorNameLoc", (female: string, name: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor named ${getGoldenText(name)} in ${getGoldenText(where)}`],
    ["MsgGainFemaleAdvisorNameLocDiscount", (female: string, name: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} advisor named ${getGoldenText(name)} in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorType", (female: string, advtype: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} ${advtype} advisor`],
    ["MsgGainFemaleAdvisorTypeDiscount", (female: string, advtype: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} ${advtype} advisor (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorTypeLoc", (female: string, advtype: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} ${advtype} advisor in ${getGoldenText(where)}`],
    ["MsgGainFemaleAdvisorTypeLocDiscount", (female: string, advtype: string, where: string, skill: string) => `Gain skill ${skill} ${ifElseThenYesNo(female, "female", "male")} ${advtype} advisor in ${getGoldenText(where)} (50% cheaper to employ)`],
    ["MsgGainFemaleAdvisorTypeName", (female: string, advtype: string, name: string, skill: string) => 
        `Gain skill ${skill} ${female ? "female" : "male"} ${advtype} advisor named ${getGoldenText(name)}`
    ],
    ["MsgGainFemaleAdvisorTypeNameDiscount", (female: string, advtype: string, name: string, skill: string) => 
        `Gain skill ${skill} ${female ? "female" : "male"} ${advtype} advisor named ${getGoldenText(name)} (50% cheaper to employ)`
    ],
    ["MsgGainFemaleAdvisorTypeNameLoc", (female: string, advtype: string, name: string, where: string, skill: string) => 
        `Gain skill ${skill} ${female ? "female" : "male"} ${advtype} advisor named ${getGoldenText(name)} in ${getGoldenText(where)}`
    ],
    ["MsgGainFemaleAdvisorTypeNameLocDiscount", (female: string, advtype: string, name: string, where: string, skill: string) => 
        `Gain skill ${skill} ${female ? "female" : "male"} ${advtype} advisor named ${getGoldenText(name)} in ${getGoldenText(where)} (50% cheaper to employ)`
    ],

    // Not used ?
    ["MsgRebelLeaderRuler", () => "The leader of the rebels becomes the country's new ruler"],

    // Not used ?
    ["MsgNewRuler", (regent: string) => `A new ${regent ? "regent" : "ruler"} comes to power`],
    ["MsgNewRulerLeader", (regent: string, name: string) => `The leader ${getGoldenText(name)} becomes ${regent ? "regent" : "ruler"}`],
    ["MsgNewRulerAttribs", (regent: string) => `A new ${regent ? "regent" : "ruler"} comes to power with the following attributes:`],
    ["MsgNewRulerLeaderAttribs", (regent: string, name: string) => `The leader ${getGoldenText(name)} becomes ${regent ? "regent" : "ruler"} with the following attributes:`],
    ["MsgLeaderRuler", (regent: string, name: string) => `The leader ${getGoldenText(name)} comes to power as ${regent ? "regent" : "ruler"}`],
    ["MsgNewRulerName", (name: string) => `Named ${getGoldenText(name)}`],
    ["MsgNewRulerDynasty", (name: string) => `Of the ${getGoldenText(name)} dynasty`],
    ["MsgNewRulerDynastyAs", (name: string) => `Of the same dynasty as ${getGoldenText(name)}`],
    ["MsgNewRulerOriginalDynasty", () => "Of the country's original dynasty"],
    ["MsgNewRulerHistoricDynasty", () => "Of one of the country's historic dynasties"],
    ["MsgNewRulerAge", (amount: string) => `Aged ${getGoldenText(amount)} years`],
    ["MsgNewRulerAdm", (fixed: string, amount: string) => `${fixed ? "Fixed " : ""} ${getGoldenText(amount)} administrative skill`],
    ["MsgNewRulerDip", (fixed: string, amount: string) => `${fixed ? "Fixed " : ""} ${getGoldenText(amount)} diplomatic skill`],
    ["MsgNewRulerMil", (fixed: string, amount: string) => `${fixed ? "Fixed " : ""} ${getGoldenText(amount)} military skill`],
    ["MsgNewRulerClaim", (amount: string) => `Claim strength ${getGoldenText(amount)}`],
    ["MsgNewRulerFixed", (adm: string, dip: string, mil: string) => 
        `A new ruler comes to power with fixed skills adm - ${adm}, dip - ${dip}, mil - ${mil}`
    ],
    ["MsgEstateHasInfluenceModifier", (estate: string, modifier: string) => 
        `${estate} estate has influence modifier ${textInQuotes(modifier)}`
    ],

    // Not used ?
    ["MsgTriggerSwitch", () => "The first of the following that is true:"],
    ["MsgTriggerSwitchClause", (cond: string) => `If ${cond}:`],
    ["MsgProvinceHasRebels", (rtype: string) => `Province's most likely rebel type is ${rtype}`],
    ["MsgRebelsFriendlyTo", (friend: string) => `friendly to ${friend}`],
    ["MsgRebelsLedBy", (leader: string) => `led by ${getGoldenText(leader)}`],
    ["MsgRebelsGainProgress", (amount: string) => `gaining ${getGoldenText(amount)} progress towards their next uprising`],
    ["MsgSpawnRebels", (rtype: string, size: string, friend: string, leader: string, win: string, progress: string) => 
        `${rtype} (size ${size})${friend} rise in revolt ${getGoldenText(leader)} ${win ? "and occupy the province" : ""}${progress}`
    ],
    ["MsgRebelsHaveRisen", (rtype: string) => `${rtype} have risen in revolt`],
    ["MsgTagGainsCore", (who: string) => `${getGoldenText(who)} gains a core on this province`],
    ["MsgGainCoreOnProvince", (prov: string) => `Gain core on ${getGoldenText(prov)}`],
    ["MsgHasDLC", (dlc: string) => `DLC ${dlc} is active`],
    ["MsgProvince", (where: string) => `Province ${getGoldenText(where)}:`],


    ["technology_group", (name: string) => `Technology group is ${getGoldenText(name)}`],
    ["num_of_religion", (name: string, amount: string) => 
        `Has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "province", "provinces")} of ${getGoldenText(name)} religion`
    ],
    ["is_strongest_trade_power", (who: string) => `${getGoldenText(who)} is the strongest trade power in this node`],

    ["province_has_center_of_trade_of_level", (level: string) => `Province has Center of Trade of level ${getGoldenText(level)}`],
    
    ["area", (what: string) => `Is in ${getGoldenText(what)} area`],
    // when compared to another area 
    ["MsgAreaIsAs", (what: string) => `Is in the same area as ${getGoldenText(what)}`],

    ["dominant_religion", (what: string) => `The country's dominant religion is ${getGoldenText(what)}`],
    ["MsgDominantReligionAs", (whom: string) => `The country's dominant religion is that of ${getGoldenText(whom)}`],
    
    ["enable_religion", (what: string) => `Enable the ${getGoldenText(what)} religion`],
    ["hre_religion", (what: string) => `The Holy Roman Empire's official religion is ${getGoldenText(what)}`],
    ["hre_size", (value: string, inNotScope: boolean) => `${inNotScope ? "Less" : "More"} then ${getGoldenText(value)} members of HRE`],
    ["set_hre_religion_locked", (yn: string) => `The Holy Roman Empire's religion ${checkYesNo(yn) ? "becomes fixed" : "is no longer fixed"}`],
    ["set_hre_religion", (what: string) => `The Holy Roman Empire's official religion becomes ${getGoldenText(what)}`],
    ["set_hre_heretic_religion", (what: string) => `The ${getGoldenText(what)} religion is considered heretical within the Holy Roman Empire`],
    ["set_hre_religion_treaty", () => `From now on, the Emperor, Electors, and Princes of the Holy Roman Empire may be of any Christian religion without being considered heretics.`],
    ["hre_leagues_enabled", (yn: string) => `Leagues for the religion of the Holy Roman Empire ${checkYesNo(yn) ? "have" : "have ''not''"} begun to form`],
    ["hre_religion_locked", (yn: string) => `The religion of the Holy Roman Empire ${checkYesNo(yn) ? "is" : "is ''not''"} fixed`],
    ["hre_religion_treaty", (yn: string) => `The Peace of Westphalia ${checkYesNo(yn) ? "has" : "has ''not''"} been signed`],
    ["is_elector", (yn: string) => `Is${checkYesNo(yn) ? "" : " ''not''"} an Elector of the Holy Roman Empire`],
    ["hre_reform_passed", (what: string) => `The imperial reform ''${getGoldenText(what)}'' has been passed`],
    ["hre_leagues_enabled", () => `Leagues for the religion of the Holy Roman Empire begin to form.`],
    ["is_in_league_war", (yn: string) => `Is${checkYesNo(yn) ? "" : " ''not''"} involved in a religious league war`],
    ["is_league_enemy", (whom: string) => `Is in the opposite religious league to ${getGoldenText(whom)}`],
    ["religion_years", (name: string, years: string) => `The ${getGoldenText(name)} religion has existed for at least ${years} years`],
    ["has_idea", (what: string) => `Has idea "${getGoldenText(what)}"`],
    ["totemism", (name: string, amount: string) => `Country has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "province", "provinces")} following the ${getGoldenText(name)} religion`],
    ["wool", (name: string, amount: string) => `Country has at least ${getGoldenText(amount)} ${pluralOrSingle(amount, "province", "provinces")} producing ${getGoldenText(name)}`],
    ["aristocracy_ideas", (name: string, num: string) => `Has Aristocratic idea ${num} "${getGoldenText(name)}"`],
    ["economic_ideas", (name: string, num: string) => `Has Economic idea ${num} "${getGoldenText(name)}"`],
    ["defensive_ideas", (name: string, num: string) => `Has  Defensive idea ${num} "${getGoldenText(name)}"`],
    ["innovativeness_ideas", (name: string, num: string) => `Has { Innovative idea ${num} "${getGoldenText(name)}"`],
    ["offensive_ideas", (name: string, num: string) => `Has  Offensive idea ${num} "${getGoldenText(name)}"`],
    ["maritime_ideas", (name: string, num: string) => `Has Maritime idea ${num} "${getGoldenText(name)}"`],
    ["colonists", (amount: string) => `${getGoldenText(amount)} Colonists`],
    ["may_explore", () => `Can recruit explorers and conquistadors. Explorers may explore ocean provinces.`],
    ["range", (amount: string) => `${getGoldenText(amount)} Colonial range`],
    ["colonist_placement_chance", (amount: string) => `${getGoldenText(amount)} Settler chance`],
    ["global_colonial_growth", (amount: string) => `${getGoldenText(amount)} Global settler increase`],
    ["global_tariffs", (amount: string) => `${getGoldenText(amount)} Global tariffs`],
    ["naval_forcelimit_modifier", (amount: string) => `${getGoldenText(amount)} Naval forcelimit modifier`],
    ["cb_on_overseas", () => `Gain permanent "Overseas Expansion" [[Casus Belli]] against countries with Indian, Sub-Saharan, Chinese, or Nomad tech group.`],
    ["cb_on_primitives", () => `Gain permanent "Colonial Conquest" [[Casus Belli]] against all primitives.`],
    ["navy_tradition", (amount: string) => `Naval tradition is at least ${getGoldenText(amount)}`],
    ["navy_tradition", (amount: string) => `${getGoldenText(amount)} Yearly naval tradition`],
    ["heavy_ship_power", (amount: string) => `${getGoldenText(amount)} Heavy ship combat ability`],
    ["light_ship_power", (amount: string) => `${getGoldenText(amount)} Light ship combat ability`],
    ["galley_power", (amount: string) => `${getGoldenText(amount)} Galley combat ability`],
    ["global_ship_repair", (amount: string) => `${getGoldenText(amount)} Ship repair`],
    ["global_ship_cost", (amount: string) => `${getGoldenText(amount)} Ship cost`],
    ["global_regiment_cost", (amount: string) => `${getGoldenText(amount)} Regiment cost`],
    ["leader_naval_manuever", (amount: string) => `${getGoldenText(amount)} Naval leader maneuver`],
    ["blockade_efficiency", (amount: string) => `${getGoldenText(amount)} Blockade efficiency`],
    ["sea_repair", () => `Ships repair while in coastal sea provinces.`],
    ["primitives", (yn: string) => `Is${checkYesNo(yn) ? "" : " ''not''"} primitive`],
    ["global_tax_modifier", (amount: string) => `${getGoldenText(amount)} National tax modifier`],
    ["build_cost", (amount: string) => `${getGoldenText(amount)} Construction cost`],
    ["inflation_reduction", (amount: string) => `${getGoldenText(amount)} Yearly inflation reduction`],
    ["interest", (amount: string) => `${getGoldenText(amount)} Interest per annum`],
    ["global_autonomy", (amount: string) => `${getGoldenText(amount)} Monthly autonomy change`],
    ["land_maintenance_modifier", (amount: string) => `${getGoldenText(amount)} Land maintenance modifier`],
    ["naval_maintenance_modifier", (amount: string) => `${getGoldenText(amount)} Naval maintenance modifier`],

    // TODO: Numberic comparisaon
    ["production_efficiency", (amount: string) => `Production efficiency is at least ${getGoldenText(amount)}`],
    // Comapred to scope
    ["MsgScopeproduction_efficiency", (amount: string) => `Production efficiency is at least ${getGoldenText(amount)}`],

    // Modifier
    ["MsgProdEffBonus", (amount: string) => `${getGoldenText(amount)} Production efficiency`],

    ["development_cost", (amount: string) => `Development cost ${getGoldenText(amount)}`],
    ["local_development_cost", (yn: string, amount: string) => `Local development cost ${getGoldenText(amount)}${checkYesNo(yn) ? "" : " (replace=no)"}`],
    

    ["cb_on_religious_enemies", () => ` Gain permanent "Holy War" and "Purging of Heresy" Casus Belli against heathens and heretics respectively.`],
    ["missionaries", (amount: string) => `${getGoldenText(amount)} Missionaries`],
    ["missionary_maintenance_cost", (amount: string) => `${getGoldenText(amount)} Missionary Maintenance Cost`],
    ["stability_cost_modifier", (amount: string) => `${getGoldenText(amount)} Stability cost modifier`],

    ["global_missionary_strength", (amount: string) => `${getGoldenText(amount)} Missionary strength`],

    ["tolerance_heathen", (amount: string) => `${getGoldenText(amount)} Tolerance of heathens`],
    ["tolerance_heretic", (amount: string) => `${getGoldenText(amount)} Tolerance of heretics`],
    ["tolerance_own", (amount: string) => `${getGoldenText(amount)} Tolerance of the true faith`],


    //TODO:
    ["papal_influence", (amount: string) => `Papal influence is at least ${getGoldenText(amount)}`],
    // Compare to scope
    ["MsgScopepapal_influence", (amount: string) => `Papal influence is at least ${getGoldenText(amount)}`],

    //TODO: modifier - same name as trigger
    ["MsgYearlyPapalInfluence", (amount: string) => `${getGoldenText(amount)} Yearly papal influence`],


    ["devotion", (amount: string) => `${getGoldenText(amount)} Yearly devotion`],
    ["monthly_fervor_increase", (amount: string) => `${getGoldenText(amount)} Monthly fervor`],
    ["church_power_modifier", (amount: string) => `${getGoldenText(amount)} Church power`],
    
    ["power_projection", (amount: string, inNotScope: boolean, currentScope: string) => `${getGoldenText(currentScope)}'s Power Projection is ${inNotScope ? "less then" : "at least"} ${getGoldenText(amount)}.`],
    ["prestige", (amount: string, inNotScope: boolean) => `Prestige is ${inNotScope ? "less then" : "at least"} ${getGoldenText(amount)}`],
    ["innovativeness", (amount: string, inNotScope: boolean) => `Innovativeness is ${inNotScope ? "less then" : "at least"} ${getGoldenText(amount)}`],
    // TODO: modifer - same name as trigger
    ["MsgYearlyPrestige", (amount: string) => `${getGoldenText(amount)} Yearly prestige`],

    ["global_heretic_missionary_strength", (amount: string) => `${getGoldenText(amount)} Missionary strength vs heretics`],
    ["culture_conversion_cost", (amount: string) => `${getGoldenText(amount)} Culture conversion cost`],

    // @ts-ignore
    ["has_opinion_modifier", (modifier: string, who: string) => `Has the opinion modifier ${getGoldenText(modifier)}`],
    // @ts-ignore
    ["has_opinion", (who: string, value: string, inNotScope: boolean, currentScope: string, topRoot: string) =>  `${getGoldenText(who)}'s opinion of ${getGoldenText(topRoot)} is at least ${getGoldenText(value)}.`],
    // @ts-ignore
    ["reverse_has_opinion", (who: string, value: string, inNotScope: boolean, currentScope: string) =>  `${getGoldenText(who)}'s opinion of ${getGoldenText(currentScope)} is at least ${getGoldenText(value)}.`],

    ["normal_or_historical_nations", (yn: string) => `${checkYesNo(yn) ? "Playing" : "Not playing"} with normal or historical nations`],
    ["is_playing_custom_nation", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} playing a custom nation`],
    ["is_religion_enabled", (what: string) => `The ${getGoldenText(what)} religion is enabled`],
    ["capital", (what: string) => `Capital is ${getGoldenText(what)}`],
    ["full_idea_group", (what: string, _: boolean, currentScope: string) => `${currentScope} has completed ${getGoldenText(what)}`],
    ["trade_income_percentage", (amount: string) => `Trade accounts for at least ${getGoldenText(amount)} of national income`],

    ["religious_unity", (amount: string) => `Religious unity is at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))}`],
    // TODO: modifier - same as trigger
    ["Msgreligious_unitybonus", (amount: string) => `Religious unity is at least ${getGoldenText(amount)}`],

    ["adm_power", (amount: string) => `Has at least ${getGoldenText(amount)} administrative power`],
    ["dip_power", (amount: string) => `Has at least ${getGoldenText(amount)} diplomatic power`],
    ["mil_power", (amount: string) => `Has at least ${getGoldenText(amount)} military power`],

    ["government_rank", (rank: string) => `Government rank is at least ${toNumber(rank) == 3 ? "Empire" : toNumber(rank) == 2 ? "Kingdom" : "Duchy" }`],
    ["set_government_rank", (rank: string) =>  `Set government rank to ${toNumber(rank) == 3 ? "Empire" : toNumber(rank) == 2 ? "Kingdom" : "Duchy" }`],

    ["overextension_percentage", (amount: string, inNotScope: boolean) => `Overextension is ${inNotScope ? "Less" : "at least"} ${getGoldenText(amount)}`],
    ["is_random_new_world", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} playing with a Random New World`],
    ["is_colonial_nation", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} a colonial nation`],
    ["is_former_colonial_nation", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} a former colonial nation`],
    ["is_free_or_tributary_trigger", (yn: string) => `Is${checkYesNo(yn) ? "" : " neither"} independent or a tributary`],
    ["is_nomad", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} a steppe horde`],
    ["is_religion_reformed", (yn: string) => `The country's religion has${checkYesNo(yn) ? "" : " not"} been reformed`],
    ["change_tag", (who: string) => `Country becomes ${getGoldenText(who)}`],
    ["set_in_empire", (yn: string) => `Province ${checkYesNo(yn) ? "joins" : "leaves"} the Holy Roman Empire`],
    ["has_secondary_religion", (yn: string) => `${checkYesNo(yn) ? "Has" : "Does not have"} a secondary religion`],
    ["secondary_religion", (what: string) => `Secondary religion is ${getGoldenText(what)}`],
    ["is_defender_of_faith", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} Defender of the Faith`],
    ["legitimacy_or_horde_unity", (amount: string) => `Legitimacy or Horde unity is at least ${getGoldenText(amount)}`],
    ["check_variable", (what: string, amount: string) => `Value of variable ${getGoldenText(what)} is at least ${getGoldenText(amount)}`],
    ["change_technology_group", (what: string) => `Change technology group to ${getGoldenText(what)}`],
    ["change_unit_type", (what: string) => `Change units to ${getGoldenText(what)}`],

    // TODO: Events ?
    ["MsgNoBaseWeight", () => "(no base weight?)"],
    ["MsgAIBaseWeight", (amount: string) => `Base weight: ${getGoldenText(amount)}`],
    ["MsgAIFactorOneline", (factor: string, multiplier: string) => `${factor}: ${multiplier}`],
    ["MsgAIFactorHeader", (multiplier: string) => `${multiplier}:`],


    ["luck", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} a lucky nation`],
    ["commandant", (what: string, level: string) => `Has a level ${level} ${getGoldenText(what)} advisor`],
    ["num_of_royal_marriages", (amount: string) => `Has at least ${getGoldenText(amount)} royal ${pluralOrSingle(amount, "marriage", "marriages")}`],
    ["is_bankrupt", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} bankrupt`],
    ["num_of_colonial_subjects", (amount: string) => `Has at least ${getGoldenText(amount)} colonial ${pluralOrSingle(amount, "subject", "subjects")}`],

    //TODO:
    ["trade_efficiency", (amount: string) => `Trade efficiency is at least ${getGoldenText(amount)}`],
    // modifier - same as trigger
    ["MsgTradeEfficiencyBonus", (amount: string) => `${getGoldenText(amount)} Trade efficiency`],

    ["has_wartaxes", (yn: string) => `Has${checkYesNo(yn) ? "" : " not"} raised war taxes`],
    ["revolt_percentage", (amount: string) => `At least ${getGoldenText(amount)} of provinces are in revolt`],
    ["has_any_disaster", (yn: string) => `${checkYesNo(yn) ? "Has" : "Does not have"} an ongoing disaster`],
    ["has_active_policy", (what: string) => `Has enacted the policy "${getGoldenText(what)}"`],
    ["treasury", (amount: string) => `Has at least ${getGoldenText(amount)} ducats`],
    ["has_parliament", (yn: string) => `The country ${checkYesNo(yn) ? "has" : "does not have"} a parliament`],

    ["has_truce", (yn: string) => `The country ${yn === "yes" ? "has" : "does not have"} a truce with another country`],
    ["num_of_rebel_controlled_provinces", (amount: string) => `At least ${getGoldenText(amount)} provinces are controlled by rebels`],

    ["num_of_provinces_owned_or_owned_by_non_sovereign_subjects_with", (value: string) => `${getGoldenText(value)} provinces (current: #) owned by you or your non-tributary subjects with:`],
    
    ["fort_level", (amount: string) => `Fort level is at least ${getGoldenText(amount)}`],
    ["has_trade_modifier", (who: string, key: string) => `${getGoldenText(who)} has trade modifier ${getGoldenText(key)}`],
    ["is_month", (what: string) => `Month is ${getGoldenText(what)}`],
    ["is_sea", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} sea`],
    ["heavy_ship", (whom: string) => `Create a heavy ship belonging to ${getGoldenText(whom)}`],
    ["light_ship", (whom: string) => `Create a light ship belonging to ${getGoldenText(whom)}`],
    ["galley", (whom: string) => `Create a galley belonging to ${getGoldenText(whom)}`],
    ["has_merchant", (who: string) => `${getGoldenText(who)} has a merchant present`],
    ["num_of_colonies", (amount: string) => `Has at least ${getGoldenText(amount)} colonies`],

    // TODO:
    ["change_primary_culture", (what: string) => `Change culture to ${getGoldenText(what)}`],
    // to scope
    ["Msgchange_primary_culture", (what: string) => `Change culture to that of ${getGoldenText(what)}`],

    // TODO:
    ["change_culture", (whom: string) => `Change culture to ${getGoldenText(whom)}`],
    // to scope
    ["Msgchange_culture", (whom: string) => `Change culture to that of ${getGoldenText(whom)}`],

    ["naval_forcelimit", (amount: string) => `Naval forcelimit is at least ${getGoldenText(amount)}`],
    ["naval_forcelimit_scope", (scope: string, inNotScope: boolean) => `Has a Naval Force Limit ${inNotScope ? "less" : "at least"} that of ${getGoldenText(scope)} (#)`],

    ["has_naval_doctrine", (name: string) => `Has naval doctrine${getGoldenText(name == "any" ? "" : " "+name)}`],
    ["blockade", (amount: string) => `Is at least ${getGoldenText(amount)} blockaded`],
    ["create_alliance", (whom: string) => `Create alliance with ${getGoldenText(whom)}`],
    ["add_unrest", (amount: string) => `${getGoldenText(amount)} ${getGoldenText(amount)} unrest`],
    ["gold_income_percentage", (amount: string) => `At least ${getGoldenText(amount)}% of the country's income is from Gold`],
    ["is_tribal", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} tribal`],
    ["set_capital", (what: string) => `Change capital to ${getGoldenText(what)}`],
    
    ["colonial_region", (where: string) => `Is in colonial region ${getGoldenText(where)}`],
    ["junior_union_with", (whom: string) => `Is the junior partner in a personal union with ${getGoldenText(whom)}`],
    ["senior_union_with", (whom: string) => `Is the senior partner in a personal union with ${getGoldenText(whom)}`],
    ["vassal_of", (whom: string) => `Is a vassal of ${getGoldenText(whom)}`],
    ["overlord_of", (whom: string) => `Is the overlord of ${getGoldenText(whom)}`],
    ["change_province_name", (what: string) => `Rename province to ${getGoldenText(what)}`],
    ["rename_capital", (what: string) => `Rename provincial capital to ${getGoldenText(what)}`],
    ["owns_or_vassal_of", (where: string) => `Owns ${getGoldenText(where)} or is overlord of its owner`],
    ["range", (whom: string) => `Is within colonial range of ${getGoldenText(whom)}`],
    ["has_great_project", (type: string, tier: string) => `Have the great project ${getGoldenText(type)} at  ${getGoldenText("Tier " + tier)}`],
    ["has_construction", (what: string) => `Is constructing a ${getGoldenText(what)}`],
    ["add_great_project", (what: string) => `Begin constructing the ${getGoldenText(what)}`],
    ["cancel_construction", () => `Cancel construction`],
    ["years_of_income", (amount: string) => `Treasury contains at least ${getGoldenText(amount)} years' worth of income`],
    ["liberty_desire", (amount: string, inNotScope: boolean) => `Liberty desire is ${inNotScope ? "less than" : "at least"} ${getGoldenText(amount)}`],
    ["add_liberty_desire", (amount: string) => `Gain ${getGoldenText(amount)} liberty desire`],
    ["colonial_parent", () => `This country's colonial parent:`],
    ["always", (yn: string) => `${yn == "yes" ? `${getGreenTextHtml("Always")}` : `${getRedTextHtml("Never")}`}`],

    // TODO: Not used ?
    ["MsgCapitalCultureDominant", () => `The capital's culture is dominant in the country`],

    ["num_of_unions", (amount: string) => `Has at least ${getGoldenText(amount)} personal unions`],
    ["num_of_vassals", (amount: string) => `Has at least ${getGoldenText(amount)} vassals`],
    ["free_vassal", (whom: string) => `Release vassal ${getGoldenText(whom)} as an independent country`],
    ["has_missionary", (yn: string) => `${checkYesNo(yn) ? "Has" : "Does not have"} an active missionary`],
    ["navy_size_percentage", (amount: string) => `Total navy size at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))} of the force limit`],
    ["is_force_converted", (yn: string) => `Was${checkYesNo(yn) ? "" : " not"} force converted`],
    ["allows_female_emperor", (yn: string) => `The Emperor may${checkYesNo(yn) ? "" : " not"} be female`],
    ["imperial_influence", (amount: string) => `Imperial Authority is at least ${getGoldenText(amount)}`],
    ["has_female_heir", (yn: string) => `${checkYesNo(yn) ? "Has" : "Does not have"} a female heir`],
    ["MsgPiety", (amount: string) => `Piety is at least ${getGoldenText(amount)}`],
    ["is_tutorial_active", (yn: string) => `Is${checkYesNo(yn) ? "" : " not"} in the tutorial`],
    ["add_fervor", (amount: string) => `Gain ${getGoldenText(amount)} fervor`],
    ["add_church_power", (amount: string) => `Gain ${getGoldenText(amount)} church power`],
    ["vassal_income", (amount: string) => `${getGoldenText(amount)}% Income from vassals`],
    ["fabricate_claims_cost", (amount: string) => `${getGoldenText(amount)}% Cost to fabricate claims`],
    ["fabricate_claims_time", (amount: string) => `${getGoldenText(amount)}% Time to fabricate claims`],
    ["diplomatic_annexation_cost", (amount: string) => `${getGoldenText(amount)}% Diplomatic annexation cost`],
    ["ae_impact", (amount: string) => `${getGoldenText(amount)}% Aggressive expansion impact`],
    ["diplomatic_reputation", (amount: string) => `${getGoldenText(amount)} Diplomatic reputation`],
    ["envoy_travel_time", (amount: string) => `${getGoldenText(amount)}% Envoy travel time`],
    ["diplomatic_upkeep", (amount: string) => `${getGoldenText(amount)} Diplomatic relations`],
    ["vassal_forcelimit_bonus", (amount: string) => `${getGoldenText(amount)} Vassal force limit contribution`],
    ["unjustified_demands", (amount: string) => `${getGoldenText(amount)}% Unjustified demands`],
    ["infantry_power", (amount: string) => `${getGoldenText(amount)}% Infantry combat ability`],
    ["cavalry_power", (amount: string) => `${getGoldenText(amount)}% Cavalry combat ability`],
    ["artillery_power", (amount: string) => `${getGoldenText(amount)}% Artillery combat ability`],
    ["ship_durability", (amount: string) => `${getGoldenText(amount)}% Ship durability`],
    ["land_morale", (amount: string) => `${getGoldenText(amount)}% Morale of armies`],

    ["naval_morale", (amount: string) => `${getGoldenText(amount)} Morale of navies`],
    ["naval_attrition", (amount: string) => `${getGoldenText(amount)}% Naval attrition`],
    ["discipline", (amount: string) => `${getGoldenText(amount)}% Discipline`],
    ["global_manpower_modifier", (amount: string) => `${getGoldenText(amount)} National manpower modifier`],
    ["manpower_recovery_speed", (amount: string) => `${getGoldenText(amount)} Manpower recovery speed`],
    ["possible_mercenaries", (amount: string) => `${getGoldenText(amount)}% Available mercenaries`],
    ["garrison_size", (amount: string) => `${getGoldenText(amount)}% Garrison size`],
    ["land_attrition", (amount: string) => `${getGoldenText(amount)}% Land attrition`],
    ["land_forcelimit_modifier", (amount: string) => `${getGoldenText(amount)}% Land force limit modifier`],
    ["prestige_decay", (amount: string) => `${getGoldenText(amount)}% Prestige decay`],
    ["mercenary_cost", (amount: string) => `${getGoldenText(amount)}% Mercenary cost`],
    ["technology_cost", (amount: string) => `${getGoldenText(amount)}% Technology cost`],
    ["advisor_pool", (amount: string) => `${getGoldenText(amount)} Possible advisors`],
    ["inflation_action_cost", (amount: string) => `${getGoldenText(amount)}% Reduce inflation cost`],
    ["free_leader_pool", (amount: string) => `${getGoldenText(amount)} Leader(s) without upkeep`],
    ["advisor_cost", (amount: string) => `${getGoldenText(amount)}% Advisor costs`],
    ["core_creation", (amount: string) => `${getGoldenText(amount)}% Core creation cost`],
    ["merc_maintenance_modifier", (amount: string) => `${getGoldenText(amount)}% Mercenary maintenance modifier`],
    ["adm_tech_cost_modifier", (amount: string) => `${getGoldenText(amount)}% Administrative technology cost`],
    ["dip_tech_cost_modifier", (amount: string) => `${getGoldenText(amount)}% Diplomatic technology cost`],
    ["global_trade_goods_size_modifier", (amount: string) => `${getGoldenText(amount)}% Goods produced modifier`],
    ["leader_naval_fire", (amount: string) => `${getGoldenText(amount)} Naval leader fire`],
    ["leader_naval_shock", (amount: string) => `${getGoldenText(amount)} Naval leader shock`],
    ["prestige_from_land", (amount: string) => `${getGoldenText(amount)}% Prestige from land battles`],
    ["prestige_from_naval", (amount: string) => `${getGoldenText(amount)}% Prestige from naval battles`],
    ["diplomats", (amount: string) => `${getGoldenText(amount)} Diplomats`],
    ["war_exhaustion_cost", (amount: string) => `${getGoldenText(amount)}% Cost of reducing war exhaustion`],
    ["improve_relation_modifier", (amount: string) => `${getGoldenText(amount)}% Improve relations`],
    ["province_warscore_cost", (amount: string) => `${getGoldenText(amount)}% Province warscore cost`],
    ["reduced_stab_impacts", () => "Lowered impact on stability from diplomatic actions"],
    ["global_unrest", (amount: string) => `${getGoldenText(amount)}% National unrest`],
    ["years_of_nationalism", (amount: string) => `${getGoldenText(amount)} Years of separatism`],
    ["accepted_culture_threshold", (amount: string) => `${getGoldenText(amount)}% Accepted culture threshold`],
    ["relations_decay_of_me", (amount: string) => `${getGoldenText(amount)}% Better relations over time`],
    ["idea_cost", (amount: string) => `${getGoldenText(amount)}% Idea cost`],
    ["merchants", (amount: string) => `${getGoldenText(amount)} Merchants`],
    ["global_regiment_recruit_speed", (amount: string) => `${getGoldenText(amount)}% Recruitment time`],
    ["global_ship_recruit_speed", (amount: string) => `${getGoldenText(amount)}% Shipbuilding time`],
    ["global_trade_power", (amount: string) => `${getGoldenText(amount)}% Global trade power`],
    ["hostile_attrition", (amount: string) => `${getGoldenText(amount)}% Embargo efficiency`],
    ["privateer_efficiency", (amount: string) => `${getGoldenText(amount)}% Privateer efficiency`],
    ["global_spy_defence", (amount: string) => `${getGoldenText(amount)}% National spy defence`],
    ["may_sabotage_reputation", () => "May sabotage reputation"],
    ["spy_offence", (amount: string) => `${getGoldenText(amount)}% Spy offense`],
    ["discovered_relations_impact", (amount: string) => `${getGoldenText(amount)}% Covert action relation impact`],
    ["may_study_technology", () => "May study technology"],
    ["may_sow_discontent", () => "May sow discontent"],
    ["may_agitate_for_liberty", () => "May agitate for liberty"],
    ["may_infiltrate_administration", () => "May infiltrate administration"],
    ["rebel_support_efficiency", (amount: string) => `${getGoldenText(amount)}% Rebel support efficiency`],
    ["army_tradition_decay", (amount: string) => `${getGoldenText(amount)}% Army tradition decay`],
    ["navy_tradition_decay", (amount: string) => `${getGoldenText(amount)}% Navy tradition decay`],
    ["infantry_cost", (amount: string) => `${getGoldenText(amount)}% Infantry cost`],
    ["cavalry_cost", (amount: string) => `${getGoldenText(amount)}% Cavalry cost`],
    ["artillery_cost", (amount: string) => `${getGoldenText(amount)}% Artillery cost`],
    ["mil_tech_cost_modifier", (amount: string) => `${getGoldenText(amount)}% Military technology cost`],
    ["enemy_core_creation", (amount: string) => `${getGoldenText(amount)}% Hostile core-creation cost on us`],
    ["caravan_power", (amount: string) => `${getGoldenText(amount)}% Caravan power`],
    ["leader_land_fire", (amount: string) => `${getGoldenText(amount)} Land leader fire`],
    ["leader_land_shock", (amount: string) => `${getGoldenText(amount)} Land leader shock`],
    ["leader_land_manuever", (amount: string) => `${getGoldenText(amount)} Land leader maneuver`],
    ["leader_land_siege", (amount: string) => `${getGoldenText(amount)} Leader siege`],
    ["defensiveness", (amount: string) => `${getGoldenText(amount)}% Fort defense`],
    ["fort_maintenance_modifier", (amount: string) => `${getGoldenText(amount)}% Fort maintenance`],
    ["reinforce_speed", (amount: string) => `${getGoldenText(amount)}% Reinforce speed`],
    ["hostile_attrition", (amount: string) => `${getGoldenText(amount)}% Attrition for enemies`],
    ["siege_ability", (amount: string) => `${getGoldenText(amount)}% Siege ability`],
    ["recover_army_morale_speed", (amount: string) => `${getGoldenText(amount)}% Recover army morale speed`],
    ["trade_range_modifier", (amount: string) => `${getGoldenText(amount)}% Trade range`],
    ["trade_steering", (amount: string) => `${getGoldenText(amount)}% Trade steering`],

    ["absolutism", (amount: string) => `Absolutism is at least ${getGoldenText(amount)}`],
    ["add_absolutism", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} absolutism`],
    ["max_absolutism", (amount: string) => `${getGoldenText(amount)} Maximum absolutism`],
    ["yearly_absolutism", (amount: string) => `${getGoldenText(amount)} Yearly absolutism`],
    ["current_age", (what: string) => `It is currently the ${getGoldenText(what)}`],
    ["accepted_culture", (what: string) => `${getGoldenText(what)} is accepted culture`],
    ["calc_true_if", (amount: string) => `At least ${getGoldenText(amount)} of the following are true:`],

    ["add_construction_progress", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} progress towards completing the great project`],
    ["add_harmonization_progress", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} progress towards harmonization`],
    ["add_heir_support", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} support for our heir`],
    ["add_nationalism", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} years of separatism`],
    ["authority", (amount: string) => `Authority is at least ${getGoldenText(amount)}`],
    ["add_colonysize", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} population`],
    ["add_corruption", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} corruption`],
    ["add_devastation", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} devastation`],
    ["devastation", (amount: string, inNotScope: boolean) => `Devastation ${inNotScope ? "Less" : "More"} than ${getGoldenText(amount)}.`],
    ["add_harmony", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} harmony`],
    ["add_militarised_society", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} militarization`],
    ["add_prosperity", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} progress towards prosperity`],
    ["add_splendor", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} splendor`],
    ["add_tariff_value", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} tariffs`],
    ["add_yearly_sailors", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} year's worth of sailors`],

    // TODO
    ["administrative_efficiency", (amount: string) => `Administrative efficiency is at least ${getGoldenText(amount)}`],
    // modifier - same as trigger
    ["Msgadministrative_efficiency", (amount: string) => `${getGoldenText(amount)} administrative efficiency`],

    ["add_disaster_modifier", () => "disaster modifier"],
    ["add_claim", (who: string) => `${getGoldenText(who)} gains a claim on this province`],
    ["add_claim", (where: string) => `Gain a claim on ${getGoldenText(where)}`],
    ["add_accepted_culture", (what: string) => `Gain ${getGoldenText(what)} as an accepted culture`],
    ["add_building", (what: string) => `Build ${getGoldenText(what)}`],
    ["has_manufactory_trigger", () => `Have any ${getGoldenText("Manufactory")}.`],
    ["has_tax_building_trigger", () => `Has a ${getGoldenText("Temple")} or a ${getGoldenText("Cathedral")} building.`],
    ["has_dock_building_trigger", () => `Has a ${getGoldenText("Dock")} or a ${getGoldenText("Drydock")} building.`],
    ["has_shipyard_building_trigger", () => `Has a ${getGoldenText("Shipyard")} or a ${getGoldenText("Grand Shipyard")} building.`],
    ["has_trade_building_trigger", () => `Has a ${getGoldenText("Marketplace")}, a ${getGoldenText("Trade Depot")} or a ${getGoldenText("Stock Exchange")} building.`],
    ["has_manpower_building_trigger", () => `Has a ${getGoldenText("Barracks")} or a ${getGoldenText("Training field")} building.`],
    ["has_courthouse_building_trigger", () => `Has a ${getGoldenText("Courthouse")} or a ${getGoldenText("Town hall")} building.`],
    ["has_production_building_trigger", () => `Has a ${getGoldenText("Workshop")} or a ${getGoldenText("Counting House")} building.`],
    ["has_fort_building_trigger", () => `Has a ${getGoldenText("Fort")} building.`],
    
    ["add_harmonized_religion", (what: string) => `Gain ${getGoldenText(what)} as a harmonized religion`],
    ["add_heir_personality", (what: string) => `Heir gains the personality trait ${getGoldenText(what)}`],
    ["add_queen_personality", (what: string) => `Consort gains the personality trait ${getGoldenText(what)}`],
    ["add_ruler_personality", (what: string) => `Ruler gains the personality trait ${getGoldenText(what)}`],
    ["add_reform_center", (what: string) => `Create a ${getGoldenText(what)} Center of Reformation`],
    ["add_historical_rival", (who: string) => `Add ${getGoldenText(who)} as a historical rival`],
    ["add_truce_with", (who: string) => `Create a truce with ${getGoldenText(who)}`],

    ["add_sailors", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} sailors`],
    //TODO: find text in game
    ["add_yearly_sailors", (amount: string) => `${gainOrLose(amount)} sailors equal to ${getGoldenText(amount)} of maximum`],

    ["army_professionalism", (amount: string) => `Army professionalism is at least ${getGoldenText(amount)}`],
    // TODO: Not used ?
    ["MsgArmyProfessionalismAs", (whom: string) => `Army professionalism is at least that of ${getGoldenText(whom)}`],

    ["add_army_professionalism", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} army professionalism`],
    ["sailors_percentage", (amount: string) => `Have at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))} of your Sailors Forcelimit`],
    ["global_sailors_modifier", (amount: string) => `${getGoldenText(amount)} National sailors modifier`],

    ["corruption", (amount: string, inNotScope: boolean) => `Corruption is ${inNotScope ? "less than" : "at least"} ${getGoldenText(amount)}`],
    ["add_incident_variable_value", (amount: string) => `The country moves towards the ${toNumber(amount) < 0 ? "Open" : "Isolationist"} end of the current incident by ${getGoldenText(Math.abs(toNumber(amount)).toString())}`],
    ["add_institution_embracement", (what: string, amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} progress towards the ${getGoldenText(what)} institution`],
    ["add_isolationism", (amount: string) => `Become ${getGoldenText(amount)} steps more ${toNumber(amount) < 0 ? "Open" : "Isolationist"}`],
    ["add_mandate", (amount: string) => `${gainOrLose(amount)} ${getGoldenText(amount)} Mandate`],

    // TODO: scripted effects
    ["add_mandate_effect", () => "{{add mandate effect}}"],
    ["MsgAddMandateLargeEffect", () => "{{add mandate effect|large=yes}}"],
    ["MsgAddMeritocracyEffect", () => "{{add meritocracy effect}}"],
    ["MsgAddMeritocracyLargeEffect", () => "{{add meritocracy effect|large=yes}}"],    
    ["add_mutual_opinion_modifier_effect", (modid: string, what: string, whom: string) => `This country and ${getGoldenText(whom)} gain opinion modifier ${textInQuotes(what)} <!-- ${modid} --> towards each other`],
    ["MsgMutualOpinionDur", (what: string, whom: string, days: string) => `This country and ${getGoldenText(whom)} gain opinion modifier ${textInQuotes(what)} towards each other for ${getGoldenText(days)} ${pluralOrSingle(days, "day", "days")}`],

    ["add_next_institution_embracement", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} progress towards the next non-present institution`],
    ["add_spy_network_from", (whom: string, amount: string) => `${getGoldenText(whom)} ${gainOrLose(amount)} ${coloredNumber(amount)} spy network strength`],
    ["add_spy_network_in", (whom: string, amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} spy network strength in ${getGoldenText(whom)}`],
    ["event_target", (tag: string) => `Event target ${tag}:`],

    //TODO: Find the actual effects(MOS)
    ["MsgEventTargetVar", (tag: string) => `event target ${tag}`],
    ["MsgSudebnikProgress", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} Sudebnik progress`],
    ["MsgOprichninaProgress", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} Oprichnina progress`],
    ["MsgStreltsyProgress", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} Streltsy progress`],

    //TODO: scripted effects
    ["add_loot_from_province_effect", () => "Gain ducats and military power scaling with province development"],
    ["MsgAddEstateLoyaltyEffect", (whom: string) => `{{add estate loyalty effect|${getGoldenText(whom)}}}`],
    ["MsgReduceEstateLoyaltyEffect", (whom: string) => `{{add estate loyalty effect|${getGoldenText(whom)}|reduce}}`],
    ["add_stability_or_adm_power", () => "{{add stability or adm power}}"],

    // @ts-ignore
    ["add_trust", (who: string, value: string, mutual: string) => `Gain ${coloredNumber(value)} trust towards ${getGoldenText(who)}`],
    ["save_event_target_as", (name: string) => `Save as event target named ${getGoldenText(name)}`],
    ["has_saved_event_target", (name: string) => `An event target named ${getGoldenText(name)} has been saved`],
    ["remove_claim", (who: string) => `${getGoldenText(who)} loses their claim on this province`],

    ["yearly_tribal_allegiance", (amount: string) => `${coloredNumberSigned(amount)} {{DLC-only|Yearly tribal allegiance}}`],
    ["tribal_allegiance", (amount: string) => `{{DLC-only|Tribal allegiance}} is at least ${getGoldenText(amount)}`],
    ["add_tribal_allegiance", (amount: string) => `${gainOrLose(amount)} ${coloredNumber(amount)} {{DLC-only|tribal allegiance}}`],
    ["army_size_percentage", (amount: string) => `Army size is at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))} of force limit`],

    // use add_unit_construction instead
    // ["MsgBuildHeavyShips", (amount: string, speed: string, cost: string) => `Build ${reducedNum(plainNum, amount)} heavy ships at ${plainPc(cost)} of normal cost, taking ${plainPc(speed)} of normal time`],
    // ["MsgBuildLightShips", (amount: string, speed: string, cost: string) => `Build ${reducedNum(plainNum, amount)} light ships at ${plainPc(cost)} of normal cost, taking ${plainPc(speed)} of normal time`],
    // ["MsgBuildGalleys", (amount: string, speed: string, cost: string) => `Build ${reducedNum(plainNum, amount)} galleys at ${plainPc(cost)} of normal cost, taking ${plainPc(speed)} of normal time`],
    // ["MsgBuildTransports", (amount: string, speed: string, cost: string) => `Build ${reducedNum(plainNum, amount)} transports at ${plainPc(cost)} of normal cost, taking ${plainPc(speed)} of normal time`],

    ["global_own_trade_power", (amount: string) => `${coloredPercentageSigned(amount)} Domestic trade power`],
    ["embracement_cost", (amount: string) => `${displayPercentageSigned(amount)} Institution embracement cost`],
    ["global_tax_income", (amount: string) => `${coloredNumberSigned(amount)} Tax income`],
    ["heavy_ship_cost", (amount: string) => `${displayPercentageSigned(amount)} Heavy ship cost`],
    ["heir_chance", (amount: string) => `${coloredPercentageSigned(amount)} Chance of new heir`],
    ["global_institution_spread", (amount: string) => `${coloredPercentageSigned(amount)} Institution spread`],
    ["fire_damage", (amount: string) => `${coloredPercentageSigned(amount)} Land fire damage`],
    ["local_build_cost", (amount: string) => `${displayPercentageSigned(amount)} Local construction cost`],
    ["local_culture_conversion_cost", (amount: string) => `${displayPercentageSigned(amount)} Local culture conversion cost`],
    ["local_defensiveness", (amount: string) => `${coloredPercentageSigned(amount)} Local defensiveness`],
    ["trade_goods_size", (amount: string) => `${coloredNumberSigned(amount)} Local goods produced`],
    ["trade_goods_size_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Local goods produced modifier`],
    ["local_hostile_movement_speed", (amount: string) => `${displayPercentageSigned(amount)} Local hostile movement speed`],
    ["local_institution_spread", (amount: string) => `${coloredPercentageSigned(amount)} Local institution spread`],
    ["local_unrest", (amount: string) => `${numberSigned(amount)} Local unrest`],
    ["local_manpower_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Local manpower modifier`],
    ["local_missionary_strength", (amount: string) => `${coloredPercentageSigned(amount)} Local missionary strength`],
    ["local_monthly_devastation", (amount: string) => `${numberSigned(amount)} Monthly devastation`],
    ["local_production_efficiency", (amount: string) => `${coloredPercentageSigned(amount)} Local production efficiency`],
    ["local_colonial_growth", (amount: string) => `${coloredNumberSigned(amount)} Local settler increase`],
    ["local_state_maintanance_modifier", (amount: string) => `${displayPercentageSigned(amount)} State maintenance`],
    ["local_tax_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Local tax modifier`],
    
    ["province_trade_power", (amount: string, inNotScope: boolean) => `Province trade power ${inNotScope ? "less" : "at least"} ${getGoldenText(amount)}`],
    ["province_trade_power_value", (amount: string) => `${coloredNumberSigned(amount)} Local trade power`],
    ["province_trade_power_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Local trade power modifier`],
    ["num_accepted_cultures", (amount: string) => `${coloredNumberSigned(amount)} Max promoted cultures`],

    ["mercenary_discipline", (amount: string) => `${coloredPercentageSigned(amount)} Mercenary discipline`],
    ["meritocracy", (amount: string) => `Meritocracy is at least ${getGoldenText(amount)}`],
    ["global_prov_trade_power_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Provincial trade power modifier`],
    ["raze_power_gain", (amount: string) => `${coloredPercentageSigned(amount)} Razing power gain`],
    ["recover_navy_morale_speed", (amount: string) => `${coloredPercentageSigned(amount)} Recover navy morale speed`],
    ["state_maintenance_modifier", (amount: string) => `${displayPercentageSigned(amount)} State maintenance`],
    ["reduced_liberty_desire", (amount: string) => `-${displayPercentage(amount)} Liberty desire in subjects`],
    ["tax_income", (amount: string) => `${coloredNumberSigned(amount)} Tax income`],
    ["global_foreign_trade_power", (amount: string) => `${coloredPercentageSigned(amount)} Trade power abroad`],
    ["trade_value_modifier", (amount: string) => `${coloredPercentageSigned(amount)} Trade value modifier`],
    ["yearly_army_professionalism", (amount: string) => `${coloredPercentageSigned(amount)} Yearly army professionalism`],
    ["yearly_corruption", (amount: string) => `${numberSigned(amount)} Yearly corruption`],
    ["meritocracy", (amount: string) => `${coloredNumberSigned(amount)} Yearly meritocracy`],

    // TODO: scripted effects
    ["MsgAddInnovativenessBigEffect", () => "If DLC Rule Britannia is active, gain innovativeness"],
    ["MsgAddInnovativenessSmallEffect", () => "If DLC Rule Britannia is active, gain innovativeness"],
    ["MsgAddReformProgressMediumEffect", () => "If DLC  Dharma is active, gain reform progress"],
    ["MsgAddReformProgressSmallEffect", () => "If DLC Dharma is active, gain reform progress"],
    ["MsgBoostBureaucratsEffect", () => "If DLC Mandate of Heaven is 'not' active, the Grand Secretariat faction gains '10' influence"],
    ["MsgBoostBureaucratsLargeEffect", () => "If DLC  Mandate of Heaven is 'not' active, the  Grand Secretariat faction gains '15' influence"],
    ["MsgBoostEunuchsEffect", () => "If DLC Mandate of Heaven is 'not' active, the Offices of Maritime Trade faction gains '10' influence"],
    ["MsgBoostEunuchsLargeEffect", () => "If DLC Mandate of Heaven is 'not' active, the Offices of Maritime Trade faction gains '15' influence"],
    ["MsgBoostTemplesEffect", () => "If DLC Mandate of Heaven is 'not' active, the Commanderies of the Five Armies faction gains '10' influence"],
    ["MsgBoostTemplesLargeEffect", () => "If DLC Mandate of Heaven is ''not'' active, the Commanderies of the Five Armies faction gains '''15''' influence"],
    ["MsgCheckIfNonStateAdvisorEffect", () => "Randomly set a country flag to determine the religion (state, secondary, tertiary, or Jewish) of an advisor based on location of the capital and state religion group"],
    ["MsgEraseAdvisorFlagsEffect", () => "Forget the choice of religion for an advisor"],
    ["MsgIncreaseHeirAdmEffect", () => "Heir gains administrative skill, or gain administrative power if skill is already 6"],
    ["MsgIncreaseHeirDipEffect", () => "Heir gains diplomatic skill, or gain diplomatic power if skill is already 6"],
    ["MsgIncreaseHeirMilEffect", () => "Heir gains military skill, or gain military power if skill is already 6"],
    ["MsgIncreaseLegitimacyMediumEffect", () => "Gain legitimacy, horde unity, devotion, or republican tradition as appropriate"],
    ["MsgIncreaseLegitimacySmallEffect", () => "Gain legitimacy, horde unity, devotion, or republican tradition as appropriate"],
    ["MsgMoveCapitalEffect", () => "Province becomes the new capital. If it was in the empire and the country isn't, it is removed from the empire."],
    ["MsgReduceBureaucratsEffect", () => "If DLC Mandate of Heaven is ''not'' active, the Grand Secretariat faction loses 10 influence"],
    ["MsgReduceEunuchsEffect", () => "If DLC Mandate of Heaven is ''not'' active, the Offices of Maritime Trade faction loses 10 influence"],
    ["MsgReduceTemplesEffect", () => "If DLC Mandate of Heaven is ''not'' active, the Commanderies of the Five Armies faction loses 10 influence"],
    ["MsgReduceLegitimacyEffect", () => "Lose legitimacy, horde unity, devotion, or republican tradition as appropriate"],
    ["MsgReduceLegitimacySmallEffect", () => "Lose legitimacy, horde unity, devotion, or republican tradition as appropriate"],
    ["MsgReduceMandateEffect", () => "If the country is the Emperor of China and DLC Mandate of Heaven is active, lose mandate"],
    ["MsgReduceMandateLargeEffect", () => "If the country is the Emperor of China and DLC Mandate of Heaven is active, lose mandate"],
    ["MsgReduceMeritocracyEffect", () => "If the country is the Emperor of China and DLC Mandate of Heaven is active, lose meritocracy"],
    ["MsgReduceMeritocracyLargeEffect", () => "If the country is the Emperor of China and DLC Mandate of Heaven is active, lose meritocracy"],
    ["MsgReduceReformProgressSmallEffect", () => "If DLC Dharma is active, lose eform progress"],
    ["MsgReduceReformProgressBigEffect", () => "If DLC Dharma is active, lose reform progress"],
    ["MsgRemoveAdvisorAdmEffect", () => "The currently employed administrative advisor leaves the country's court."],
    ["MsgDivorceConsortEffect", () => "Attempt to divorce the consort. The consort's family may be offended by this, spoiling relations, giving them a casus belli, or angering local nobles."],

    ["has_dlc", (what: string) => `Has dlc ${getGoldenText(what)}`],
    ["add_government_reform", (what: string) => `Enact government reform ${getGoldenText(what)}`],
    ["add_center_of_trade_level", (amount: string) => `Gain a level ${getGoldenText(amount)} Center of Trade`],
    ["ruler_age", (amount: string) => `Ruler is at least ${getGoldenText(amount)} years old`],
    ["is_hegemon", () => `Is hegemon`],
    ["is_hegemon_of_type", (type: string) => `Is ${getGoldenText(type)} Hegemon`],
    ["num_of_buildings_in_province", (amount: string) => `Has at least ${getGoldenText(amount)} buildings`],
    ["num_of_owned_provinces_with", (value: string) => `${getGoldenText(value)} owned provinces (current: #) with:`],
    ["average_autonomy_above_min", (value: string, inNotScope: boolean) => `Average autonomy above minimum ${inNotScope ? "is less then" : "is greater then"} ${getGoldenText(displayPercentage(value))}`],

    ["num_of_galley", (number: string) => `Have at least ${getGoldenText(number)} galleys`],
    ["num_of_galley_scope", (scope: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "more or equal"} galleys than ${getGoldenText(scope)} (#)`],

    ["is_great_power", () => `Is great power`],
    ["is_enemy", (who: string, inNotScope: boolean) => `${inNotScope ? "Does not view" : "Views"} ${getGoldenText(who)} as an enemy.`],
    ["same_trade_node_as", (what: string) => `In trade node ${getGoldenText(what)}`],
    ["national_focus", (what: string) => `Has focused ${getGoldenText(what)}`],
    ["trade_share", (country: string, share: string) => `${getGoldenText(country)} has ${getGoldenText(displayPercentage(share))} or more trade power.`],
    ["heavy_ship_fraction", (amount: string) => `Heavy ship fraction at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))}`],
    ["galley_fraction", (amount: string) => `Galley fraction at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))}`],
    ["light_ship_fraction", (amount: string) => `Light ship fraction at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))}`],
    ["transport_fraction", (amount: string) => `Transport ship fraction at least ${getGoldenText(displayPercentage(numberFromPercetage(amount)))}`],
    ["navy_size", (amount: string) => `Have at least ${getGoldenText(amount)} ships`],
    ["is_subject_of_type", (type: string) => `Is a ${getGoldenText(type)}`],
    ["has_institution", (what: string) => `Has embraced ${getGoldenText(what)}`],

    // Special units
    ["num_of_cavalry", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} cavalry`],
    ["num_of_infantry", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} infantry`],
    ["num_of_artillery", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} artillery`],
    ["num_of_caravel", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} caravel`],
    ["num_of_cawa", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} cawa`],
    ["num_of_carolean", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} carolean`],
    ["num_of_cossacks", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} cossack`],
    ["num_of_galleon", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} galleon`],
    ["num_of_galleass", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} galleas`],
    ["num_of_geobukseon", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} geobukseon`],
    ["num_of_hussars", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} hussar`],
    ["num_of_mamluks", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} mamluks`],
    ["num_of_man_of_war", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} Man-o-war`],
    ["num_of_marines", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} marines`],
    ["num_of_musketeers", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} musketeer`],
    ["num_of_qizilbash", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} qizilbash`],
    ["num_of_rajput", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} rajput`],
    ["num_of_samurai", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} samurai`],
    ["num_of_streltsy", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} streltsy`],
    ["num_of_tercio", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} tercio`],
    ["num_of_voc_indiamen", (amount: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "at least"} ${getGoldenText(toThousands(amount))} indiamen`],
    ["num_of_janissaries", (amount: string, inNotScope: boolean) => `Has ${inNotScope ? "less" : "at least"} ${getGoldenText(amount)} Janissary regiments.`],
    
    ["has_state_edict", (what: string) => `Has state edict ${getGoldenText(what)}`],
    ["home_trade_node", () => `Home trade node`],
    ["highest_value_trade_node", (yn: string) => `${ifElseThenYesNo(yn, "Is", "Is not")} the highest valued trade node in the world.`],
    ["ruler_has_personality", (name: string) => `Current ruler is ${name}`],
    ["army_size", (value: string) => `Have an army equal or larger than ${getGoldenText(value+"k")}`],
    ["has_final_tier_reforms_trigger", () => `Has completed all government reforms.`],
    ["has_age_ability", (name: string) => `Have the '${getGoldenText(name)}' ability.`],
    ["in_golden_age", (yn: string, _: boolean, currentScope: string) => `${getGoldenText(currentScope)} ${ifElseThenYesNo(yn, "Is", "not")} in a Golden Era.`],
    ["invested_papal_influence", (amount: string) => `Invested Papal Influence at least ${getGoldenText(amount)}.`],
    ["revolutionary_zeal", (amount: string) => `Has at least ${getGoldenText(amount)} Revolutionary Zeal`],
    ["monthly_mil", (amount: string, _: boolean, currentScope: string) => `${currentScope} gains at least ${getGoldenText(amount)} military power per month.`],
    ["monthly_dip", (amount: string, _: boolean, currentScope: string) => `${currentScope} gains at least ${getGoldenText(amount)} diplomatic power per month.`],
    ["monthly_adm", (amount: string, _: boolean, currentScope: string) => `${currentScope} gains at least ${getGoldenText(amount)} administrative power per month.`],
    ["has_commanding_three_star", () => `Have a 3-Star general or admiral in command`],
    ["development_in_provinces", (value: string) => `${value} development (current #) in owned provinces with:`],
    ["mission_completed", (name: string) => `Completed mission ${getGoldenText(getMissionNameText(name, localisationFileId))}`],
    ["num_of_admirals", (number: string) => `Number of admirals at least ${getGoldenText(number)}`],
    ["num_of_generals", (number: string) => `Number of generals at least ${getGoldenText(number)}`],
    ["has_flagship", () => `Country has a Flagship`],
    ["trade_node_value", (amount: string) => `Trade Node value is at least ${amount}`],
    ["num_of_units_in_province", (who: string, amount: string) => `${getGoldenText(who)}: At least ${amount} regiments present`],
    ["local_autonomy_above_min", (value: string, inNotScope: boolean) => `Local autonomy above minimum ${inNotScope ? "is less then" : "is greater then"} ${getGoldenText(displayPercentage(value))}`],
    ["great_power_rank", (value: string, inNotScope: boolean) => `Has a Great Power rank ${inNotScope ? "better" : "worse"} than ${getGoldenText(value)}`],
    ["government_reform_progress", (amount: string, inNotScope: boolean) => `Government Reform Progress is ${inNotScope ? "less" : "at least"} ${getGoldenText(amount)}.`],
    ["has_pasha", (inNotScope: boolean) => `Province(s) ${inNotScope ? "not have" : "has"} a Pasha.`],
    ["owns_or_non_sovereign_subject_of", (what: string, inNotScope: boolean, currentScope: string) => `${getGoldenText(mapProvinceName(what))} ${inNotScope ? "not owned" : "owned"} by ${currentScope} or its non-Tributary Subjects.`],
    ["has_government_attribute", (what: string, inNotScope: boolean) => `${inNotScope ? "Has not" : "Has"} government attribute ${getGoldenText(mapProvinceName(what))}`],
    ["has_mil_advisor_1", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Military")} Advisor with at least Skill ${getGoldenText("1")}`],
    ["has_mil_advisor_2", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Military")} Advisor with at least Skill ${getGoldenText("2")}`],
    ["has_mil_advisor_3", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Military")} Advisor with at least Skill ${getGoldenText("3")}`],
    ["has_dip_advisor_1", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Diplomatic")} Advisor with at least Skill ${getGoldenText("1")}`],
    ["has_dip_advisor_2", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Diplomatic")} Advisor with at least Skill ${getGoldenText("2")}`],
    ["has_dip_advisor_3", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Diplomatic")} Advisor with at least Skill ${getGoldenText("3")}`],
    ["has_adm_advisor_1", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Administrative")} Advisor with at least Skill ${getGoldenText("1")}`],
    ["has_adm_advisor_2", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Administrative")} Advisor with at least Skill ${getGoldenText("2")}`],
    ["has_adm_advisor_3", (inNotScope: boolean) => `${inNotScope ? "Is not" : "Is"} employing a ${getGoldenText("Administrative")} Advisor with at least Skill ${getGoldenText("3")}`],
    ["has_adm_advisor", (yesno: string) => `${ifElseThenYesNo(yesno, "Is", "Is NOT")} employing an ${getGoldenText("Administrative")} Advisor.`],
    ["has_dip_advisor", (yesno: string) => `${ifElseThenYesNo(yesno, "Is", "Is NOT")} employing an ${getGoldenText("Diplomatic")} Advisor.`],
    ["has_mil_advisor", (yesno: string) => `${ifElseThenYesNo(yesno, "Is", "Is NOT")} employing an ${getGoldenText("Military")} Advisor.`],
    ["has_been_insulted_by_root", (yesno: string, _: boolean, __: string, topRoot: string) => `${ifElseThenYesNo(yesno, "Has", "Has not")} been insulted by ${getGoldenText(topRoot)}`],
    ["has_won_war_against", (max_years_since: string, who: string, inNotScope: boolean) => `${inNotScope ? "Lost" : "Won"} a war against ${getGoldenText(who)} in the last ${getGoldenText(max_years_since)} years.`],
    ["is_capital_of", (whom: string, inNotScope: boolean, currentScope: string) => `${getGoldenText(currentScope)} ${inNotScope ? "is NOT" : "is"} the capital of ${getGoldenText(whom)}`],
    ["has_saved_global_event_target", (what: string, inNotScope: boolean) => `${inNotScope ? "Has NOT" : "Has"} global event target ${getGoldenText(what)} set`],
    ["is_prosperous", (inNotScope: boolean) => `${inNotScope ? "Is NOT" : "Is"} prosperous.`],
    ["has_reform", (what: string, inNotScope: boolean) => `${inNotScope ? "Has NOT" : "Has"} enacted Government Reform ${getGoldenText(what)}.`],
    // @ts-ignore
    ["has_completed_idea_group_of_category", (mil_ideas: string, dip_ideas: string, adm_ideas: string, inNotScope: boolean) => `${inNotScope ? "Has NOT" : "Has"} completed one ${getGoldenText(ifElseThenYesNo(mil_ideas, "Military", ifElseThenYesNo(dip_ideas, "Diplomatic", "Administrative")) )} Idea Group.`],
    ["reform_level", (level: string, inNotScope: boolean) => `${inNotScope ? "Has NOT" : "Has"} reached level ${getGoldenText(level)} in Government Reforms.`],
    ["transports_in_province", (value: string, inNotScope: boolean, currentScope: string) => `${inNotScope ? "Have NOT" : "Have"} at least ${getGoldenText(value)} transports ${getGoldenText(currentScope)}`],
    ["transports_in_province_scope", (scope: string, inNotScope: boolean, currentScope: string) => `${getGoldenText(scope)} ${inNotScope ? "NOT have" : "have"} transport in ${getGoldenText(currentScope)}.`],
    ["trading_bonus", (trade_goods: string, value: string) => `Trading ${ifElseThenYesNo(value, "enough", "NOT enough")} of ${getGoldenText(trade_goods)} to get extra bonus`],
    ["country_or_subject_holds", (who: string) => `Owned by ${getGoldenText(who)} or its Subjects.`],
    ["legitimacy_equivalent", (value: string, inNotScope: boolean) => `Have legitimacy ${inNotScope ? "less than" : "of at least"} ${getGoldenText(value)}`],
    ["legitimacy_equivalent_scope", (scope: string, inNotScope: boolean) => `Have ${inNotScope ? "less" : "more"} than ${getGoldenText(scope)}`],
    ["crown_land_share", (value: string, inNotScope: boolean) => `Land owned by the crown ${inNotScope ? "less" : "at least"} ${getGoldenText(displayPercentage(value))}`],
    
    //Custom trigger keys
    // @ts-ignore
    ["area_trigger", (area: string, type: string) => `All provinces in the ${area} area:`],
    // @ts-ignore
    ["region_trigger", (region: string, type: string) => `All provinces in the region ${region}:`],
    ["custom_trigger_tooltip", (tooltip: string) => `${getCustomTooltipText(tooltip)}`]
]);

function getGreenTextHtml(text: string) : string {
    return `<span style=\'color: limegreen;\'>${text}</span>`;
}

function getRedTextHtml(text: string) : string {
    return `<span style=\'color: red;\'>${text}</span>`;
}

function toThousands(amount: string) : string {
    var number = toNumber(amount);
    return (number * 1000).toString();
}

function gainOrLose(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0 ) {
            return 'Gain';
        }
        else {
            return 'Lose';
        }
    }

    return amount;
}

function coloredNumber(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0 ) {
            return getGreenTextHtml(amount);
        }
        else {
            return getRedTextHtml(amount);
        }
    }

    return amount;
}

function coloredNumberSigned(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0 ) {
            return `+${getGreenTextHtml(amount)}`;
        }
        else {
            return `-${getRedTextHtml(amount)}`;
        }
    }

    return amount;
}

function numberSigned(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0 ) {
            return `+${amount}`;
        }
        else {
            return `-${amount}`;
        }
    }

    return amount;
}

function coloredPercentage(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0) {
            return displayPercentage(`${getGreenTextHtml(amount)}`);
        }
        else {
            return displayPercentage(`${getRedTextHtml(amount)}`);
        }
    }

    return amount;
}

function coloredPercentageSigned(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0) {
            return displayPercentage(`+${getGreenTextHtml(amount)}`);
        }
        else {
            return displayPercentage(`-${getRedTextHtml(amount)}`);
        }
    }

    return amount;
}

function displayPercentageSigned(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 0) {
            return displayPercentage(`+${amount}`);
        }
        else {
            return displayPercentage(`-${amount}`);
        }
    }

    return amount;
}

function displayPercentage(text: string) : string {
    return `${text}%`;
}

function numberToPercentage(amount: string) : number {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
       return amountNumber / 100;
    }

    return 0;
}

function pluralOrSingle(amount: string, single: string, pluralOrSingle: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
        if(amountNumber > 1 ) {
            return pluralOrSingle;
        }
        else {
            return single;
        }
    }

    return amount;
}

function textInQuotes(text: string) : string {
    return `"${text}"`;
}

function numberFromPercetage(amount: string) : string {
    var amountNumber = Number(amount);
    if(!Number.isNaN(amountNumber)) {
       return (amountNumber * 100).toString();
    }

    return amount;
}

function ifElseThen(input: boolean, met: string, unmet: string) : string {
    return input ? met : unmet;
}

function ifElseThenYesNo(input: string, met: string, unmet: string) : string {
    return checkYesNo(input) ? met : unmet;
}

function toNumber(amount: string) : number {
    var amountNumber = Number(amount);
    if(Number.isNaN(amountNumber)) {
        return 0;
    }

    return amountNumber;
}

function checkYesNo(text: string) : boolean {
    return text == "yes";
}



export function getMessageForMissionTrigger(missionNode : MissionNode, missionTree: MissionTree) : string {
    var result = "";
    if(!missionNode){
        return result;
    }

    localisationFileId = missionTree.localisationFileId;

    if(missionNode.requiredMissionIds) {
        for(var missionId of missionNode.requiredMissionIds) {
            result += getNoIcon();
            result += `Completed Mission ${getGoldenText(getMissionNameText(missionId, missionTree.localisationFileId))}<br>`;
        }
    }

    if(missionNode.builtTrigger) {
        var counter = 0;
        for(var entry of missionNode.builtTrigger.missionTriggerEntries) {
            if(entry.key != "if" && entry.key != "else" && entry.key != "else_if") {
                result += getNoIcon();
            }

            // result += getMessageForTreeEntry(entry, 0, missionTree?.tag ?? "ROOT", missionTree.tag ?? "ROOT", false);
            result += getMessageForTreeEntry(entry, 0, missionTree?.tags[0] ?? "ROOT",  missionTree?.tags[0] ?? "ROOT", false);
            if(counter < missionNode.builtTrigger.missionTriggerEntries.length - 1) {
                result += '<br>';
            }
        }
    }

    return result.replace(/(<br>\s*)+/g, "<br>");
}

var localisationFileId = "";
function getCustomTooltipText(key: string) : string {
    if(key == "selectable_mission_trigger_tt") {
        return `This mission cannot be completed as it is a ${getGoldenText("Branching Mission")}.`
    }

    var translation = getLocalisationKeyTranslation(key, localisationFileId);;
    return translation.replace(/\\n/g, "<br>").replace(/§Y(.*?)§!/g, (_, match) => getGoldenText(match));
}

function getTagName(key: string) : string {
    // if(countryTagToCountry.value.has(key)) {
    //     return countryTagToCountry.value.get(key)?.name ?? key;
    // }

    return key;
}

export function getMessageForMissionEffect(missionNode : MissionNode) : string {
    var result = "";
    if(!missionNode){
        return result;
    }

    if(missionNode.builtEffect) {
        var counter = 0;
        for(var entry of missionNode.builtEffect.missionEffectEntries) {
            if(entry.key != "if" && entry.key != "else") {
                result += getNoIcon();
            }

            result += getMessageForTreeEntry(entry, 0, "ROOT", "ROOT", false);
            if(counter < missionNode.builtEffect.missionEffectEntries.length - 1) {
                result += '<br>';
            }
        }
    }

    return result.replace(/(<br>\s*)+/g, "<br>");
}

export function getMessageFunctionForStatement(statement: Statement) : Function | undefined {
    if(statement) {
        var statementKey = statement.key?.toLowerCase();
        if(statementKey && messageKeyToMessage.has(statementKey)) {
            return messageKeyToMessage.get(statementKey);
        }
    }
    
    return undefined;
}

export function getMessageFunctionForStatementByKey(key: string) : Function | undefined {
    var statementKey = key.toLowerCase();
    if(statementKey && messageKeyToMessage.has(statementKey)) {
        return messageKeyToMessage.get(statementKey);
    }
    
    return undefined;
}

function mapProvinceName(provinceId: string) : string {
    // if(provinceIdToProvince.value.has(provinceId)) {
    //     return provinceIdToProvince.value.get(provinceId)?.name ?? provinceId;
    // }

    return provinceId;
}

export function getMessageForStatement(statement: Statement, inNotScope: boolean, currentScope: string, topRoot: string) : string {
    var statementKey = statement.key;
    var statementValue = statement.value;

    if(statementValue == "ROOT") {
        statementValue = topRoot;
    }

    var scopeName = statementValue;
    // if(countryTagToCountry.value.has(scopeName)) {
    //     scopeName = countryTagToCountry.value.get(scopeName)?.name ?? scopeName;
    // }

    if(scopeName != statementValue) {
        statementValue = scopeName;
        var statementFunction = getMessageFunctionForStatementByKey(`${statementKey}_scope`);
    }
    
    if(!statementFunction)  {
        var statementFunction = getMessageFunctionForStatement(statement);
    }
    
    if(statementFunction) {
        return statementFunction.call(statement, ...[statementValue, inNotScope, getTagName(currentScope), getTagName(topRoot)]);
    }

    return `${statementKey} ${getGoldenText(statement.value)}`;
}

export function getMessageForTreeEntry(treeEntry: TreeItemEntry, level: number, currentRoot: string, topRoot: string, inNotScope: boolean) : string {
    if(treeEntry.type == TreeItemType.Statement) {
        return getMessageForStatement(treeEntry.statement, inNotScope, currentRoot, topRoot);
    }
    else if(treeEntry.type == TreeItemType.Clause) {
        var clauseKey = treeEntry?.key?.toLowerCase();
        var clauseKeyOriginial = treeEntry?.key;
        var result = '';

        var childEntriesToRender = deepClone(treeEntry.childEntries);

        var replacedKey = ""
        // if(nameToAreaMap.value.has(clauseKeyOriginial)) {
        //     clauseKey = "area_trigger";
        //     replacedKey = clauseKeyOriginial;
        // }
        // else if(nameToRegionMap.value.has(clauseKeyOriginial)) {
        //     clauseKey = "region_trigger";
        //     replacedKey = clauseKeyOriginial;
        // }

        if(clauseKey == "any_ally") {
            currentRoot = "(The ally)";
        }

        if(treeEntry && clauseKey && messageKeyToMessage.has(clauseKey)) {
            var messageFunction = messageKeyToMessage.get(clauseKey);
            if(messageFunction) {
                var params = getArrowFunctionParams(messageFunction);
                if(params.length == 0) {
                    if(clauseKey == "not") {
                        var notClauseResult = "";
                        var renderKey = true;
                        for(var child of childEntriesToRender) {
                            if(child.type == TreeItemType.Statement && child.statement) {
                                var statementFunction = getMessageFunctionForStatement(child.statement);
                                if(statementFunction) {
                                    var statementArrowFunctionParams = getArrowFunctionParams(statementFunction);
                                    if(statementArrowFunctionParams.includes('inNotScope')) {
                                        notClauseResult += getMessageForStatement(child.statement, true, currentRoot, topRoot);
                                        // notClauseResult += statementFunction.call(treeEntry, child.statement.value, true, getTagName(topRoot), getTagName(currentRoot));
                                        renderKey = false;
                                    }
                                    else {
                                        notClauseResult += "<br>";
                                        notClauseResult += getTabCharacters(level + 1);
                                        notClauseResult += getMessageForStatement(child.statement, false, currentRoot, topRoot);
                                        // notClauseResult += statementFunction.call(treeEntry, child.statement.value, false, getTagName(topRoot), getTagName(currentRoot));
                                    }
                                }
                            }
                            else {
                                notClauseResult += getMessageForTreeEntry(child, level + 1, currentRoot, topRoot, true);
                            }

                            // renderKey = false;
                            var indexOfTheChild = childEntriesToRender.indexOf(child);
                            childEntriesToRender.splice(indexOfTheChild, 1);
                        }

                        if(renderKey) {
                            // result += "MISSING inNotScope!";
                            
                            result += messageFunction.call(treeEntry);
                        }

                        result += notClauseResult;
                    }
                    else if(clauseKey == "limit") {
                        var counter = 0;
                        for(var limitChild of childEntriesToRender) {
                            if(limitChild.type == TreeItemType.Statement && limitChild.statement) {
                                var index = childEntriesToRender.indexOf(limitChild);
                                childEntriesToRender.splice(index, 1);
                                if(level < 2) {
                                    if(counter == 0){
                                        result += getTabCharacters(level);
                                    }
                                    else {
                                        result += getTabCharacters(level + 1);
                                    }
                                }

                                result += getMessageForStatement(limitChild.statement, false, currentRoot, topRoot);
                                if(counter < childEntriesToRender.length - 1) {
                                    result += '<br>'
                                }
                            }
                            else {
                                result += getMessageForTreeEntry(limitChild, level, currentRoot, topRoot, inNotScope);
                            }

                            counter++;
                        }
                        result += '<br>'
                        result += getTabCharacters(level - 1);
                        result += getHighlightText('Then:');
                    }
                    else {
                        result +=  messageKeyToMessage.get(clauseKey)?.call(treeEntry);
                    }
                }
                else {
                    var functionParamsSorted: any[] = new Array();
                    if(replacedKey){
                        functionParamsSorted.push(replacedKey);
                    }

                    for(var param of params) {
                        var childEntryParam = childEntriesToRender.firstOrDefault(x => x.statement?.key == param);
                        if(childEntryParam) {
                            var index = childEntriesToRender.indexOf(childEntryParam);
                            childEntriesToRender.splice(index, 1);
                            
                            var statementValue = childEntryParam?.statement?.value;
                            if(statementValue == "ROOT") {
                                statementValue = getTagName(currentRoot);
                            }
                            else {
                                statementValue = getTagName(statementValue);
                            }

                            functionParamsSorted.push(statementValue);
                        }
                        else if(param == "inNotScope") {
                            functionParamsSorted.push(inNotScope);
                        }
                        else if(param == "topRoot") {
                            functionParamsSorted.push(getTagName(topRoot));
                        }
                        else if(param == "currentScope") {
                            functionParamsSorted.push(getTagName(currentRoot));
                        }
                        else {
                            functionParamsSorted.push(undefined);
                        }
                    }
 
                    result += messageFunction.call(treeEntry, ...functionParamsSorted);
                }
            }
        }
        // else if(provinceIdToProvince.value.has(clauseKeyOriginial)) {
        //     currentRoot = provinceIdToProvince.value.get(clauseKeyOriginial)?.name ?? clauseKeyOriginial;
        //     result += currentRoot;
        // }
        // else if(countryTagToCountry.value.has(clauseKeyOriginial)) {
        //     currentRoot = countryTagToCountry.value.get(clauseKeyOriginial)?.name ?? clauseKeyOriginial;
        //     result += `${currentRoot}:`;
        // }
        else if(clauseKeyOriginial == "ROOT") {
            result += getTagName(topRoot);
        }
        else if (keyAvailableTreeItemMap.has(clauseKeyOriginial)){
            result += (keyAvailableTreeItemMap.get(clauseKeyOriginial) as TreeItemOption).Label;
        }

        else {
            result += `${clauseKeyOriginial}`;
        }

        result += '<br>';

        var skipChildren = false;
        if(clauseKey == "custom_trigger_tooltip"){
            skipChildren = true;
        }

        if(!skipChildren) {
            var counter = 0;
            var countOfStatements = childEntriesToRender.filter(x=> x.type == TreeItemType.Statement).length;
            for(var child of childEntriesToRender) {
                if(child.type == TreeItemType.Statement) {
                    result += getTabCharacters(level + 1);
                    result += getMessageForStatement(child.statement, false, currentRoot, topRoot);

                    if(counter < countOfStatements || countOfStatements == 1) {
                        result += '<br>';
                    }

                    counter++;
                }
                else {
                    result += getTabCharacters(level + 1);
                    result += getMessageForTreeEntry(child, level + 1, currentRoot, topRoot, inNotScope);
                }
            }
        }

        return result;
    }

    return '';
}

function getTabCharacters(level: number) : string {
    return '&nbsp;&nbsp;&nbsp;'.repeat(level);
}

function getNoIcon() : string {
    return "<span class='no-icon'></span>";
}