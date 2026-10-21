import {ELITE_ENTRY_PRICE,CANNON_COSTS,UPGRADE_PRICE_MULTIPLIER,ELITE_ECONOMY_VERSION,migrateElitePoints} from './economy';
import {migrateQuestRules,type SavedQuests} from './quest-migration';
import {ELITE_CANNON_CAPACITY,ELITE_REWARDS,cumulativeEliteBonus,eliteBonusText} from './elite-progression';
import {drawMysticPlayerMarker} from './player-marker';
import {PIRATE_RAGE_DESIGN,loadSpecialDesign,saveSpecialDesign,loadDesignOwned,saveDesignOwned,type SpecialDesignId} from './special-designs';
import {loadFestival,saveFestival,festivalStatus,claimFestival,FESTIVAL_REWARDS,FESTIVAL_GRAND,FESTIVAL_DAYS,type FestivalReward} from './festival';
import {drawFlare,drawShotSprite,drawPuff,drawGlint} from './shotArt';
import './storageMigration';
import {session} from './session';
import {guildOnline,loadMyGuild,searchGuilds,myApplications,createGuild,applyGuild,cancelApply,answerApplication,kickMember,setMemberRole,leaveGuild,disbandGuild,canManage,canKick,canDisband,type MyGuild,type GuildInfo,loadGuildIslands,buildIslandTower} from './guild-net';
import {CANNONS,salvoDamage,reloadTime,rangeOf,type Loadout} from './combat';
import './style.css';
import './rage-ui.css';
import './hud-v2.css';
import {ACTIONS,loadSettings,saveSettings,keyLabel,normalizeKey,DEFAULT_BINDS,type ActionId} from './settings';
import {playBossMusic,stopBossMusic,playBossHorn,setAudio,unlockAudio,playCannon,playEnemyCannon,playHit,playExplosion,playCoins,playSpeed,playRage,playShield,playSplash,playLevelUp,playMapJump,playSink,playHeal,playClick} from './audio';
import {drawSeaSparkle,drawNpcShip,drawChestSprite,drawIslandSprite,drawFleetBase,drawBastion,drawBuiltTower,drawMineSprite,seaTilePattern,islandSheetUrl,shipLabelOffset,shipDrawSize,portraitStyle,preload,fleetBaseUrl,fleetTowerUrl,setTowerTheme,TOWER_LABEL_OFFSET,FLEET_ART,drawFleetOccluder} from './sprites';
import {MAPS,GRID,THEMES,NPCS,QUESTS,QUEST_COOLDOWN_MS,FLEET,FLEET_SCALE,WORLD_WIDTH,WORLD_HEIGHT,MAX_LEVEL,xpNeed,neighbor,bossFor,BOSS_KILLS,BOSS_ATLAS,BOSS_ATLAS_COLS,MAP_KEYS,type BossDef,type MapDef,tierOf,fleetTower,fleetReward,PORTRAIT_COUNT,PORTRAIT_COLS,PORTRAIT_ATLAS,coordLabel,GRID_COLS,GRID_ROWS,CELL_W,CELL_H,colName,rowName,type MapKey,type WorldIsland,type NpcDef,type Dir,type QuestDef} from './campaign';
import {ACHIEVEMENTS,loadAchievements,saveAchievements,unlockReached,achievementBonus,bonusText,badgeStyle,MAIN_COLLECTION,type AchStat} from './achievements';
import {loadDaily,saveDaily,dailyStatus,claimDaily,dailyReward} from './daily';
import {TREASURE_PARTS,PART_CHANCE,DIG_RADIUS,DIG_SECONDS,TREASURE_ICON,loadTreasure,saveTreasure,treasureReward} from './treasure';
import {EQUIPMENT,EQUIP_SLOTS,RARITY_NAMES,equipById,equipStatText,equipTotals,equipIconStyle,type EquipSlot} from './equipment';
import {PEARL_PACKS,SHOPIER_LINKS,packTotal,priceText} from './pearlShop';
import {isNativeApp,openExternal,SITE_URL} from './native';
import {iapAvailable,iapInit,iapPrice,iapBuy} from './iap';
import {BOARDS,rankRows,rankPage,RANK_PAGE_SIZE,type BoardId,type RankPlayer,type RankFleet,type RankRow} from './leaderboard';
import {redeem,loadRedeemed,saveRedeemed,rewardText,normalizeCode,type CouponReward} from './coupons';
import {supa} from './supabase';
import {newPvpBudget,pvpClamp,type PvpBudget} from './pvp';
import {loadLevelQuest,saveLevelQuest,levelQuestDone,levelQuestKill,levelQuestGoal,needsLevelQuest,levelQuestMap} from './level-quest';
import {SPY_COST,SPY_SHIELD_PRICE,loadSpy,sendSpy,type SpyRival} from './spy';
import {sendReport,sendLs,sendDom,netStatus,netError,startNet,joinSea,sendState,sendFire,sendSunk,sendChat,sendBid,sendKnownBids,myNetId,sharedBosses,sendBossKill,sendBossHit,sendTowerHit,sendTowerBuilt,sendGuildRefresh,sendSiegeHit,sendSpyNet,sendKill,sendSalvo,sendUse,sendQuestDone,sendChest,sendDig,sendSparkle,sendNpcHits,sendLoadout,sendAttack,type NetNpc,type NetLootSpots,type NetTreasure,type NetDig,type NetLoot,type NetSiegeEnd,type NetSpy,type NetState,type NetHandlers,type NetBoss,type NetIsland,type NetSiege,type NetBid} from './net';
import {AUCTION_MS,loadAuction,saveAuction,emptyAuction,auctionHour,auctionEnds,lotsFor,minNextBid,applyBid,wonLots,auctionId,type LotDef,type Bid} from './auction';
import {loadMentorship,saveMentorship,canMentor,apprenticeBlock,pairBlock,acceptRequest,rejectRequest,removeApprentice,onOwnLevel,claimReward,GRADUATE_LEVEL,MAX_APPRENTICES,TOGETHER_XP_BONUS,APPRENTICE_MAX_LEVEL} from './mentorship';
import {INSIGNIA_SHEET,INSIGNIA_W,INSIGNIA_H,insigniaTier,loadRivalSinks,saveRivalSinks} from './insignia';
import {loadLog,saveLog,addLog,daySummary,LOG_KINDS,type LogKind,type LogEntry} from './logbook';
import {IRON_START,IRON_PRICE,BALL_DAMAGE,CHAIN_SLOW,FIRE_NPC_FACTOR,EXPLOSIVE_PLAYER_FACTOR,leechHeal,repairAmount,ELITE_POINTS_PER_BALL,IRON_EP_PER_BALL,ELITE_MAX_LEVEL,questEp,bossEp,eliteLevelEp,eliteLevelFromEp,ABILITIES,SPECIAL_AMMO,MINE,SPEED_BOOST,VISION_RADIUS,COMPASS,CONSUMABLES,AMMO_PRICES,SUPPLY_PRICES,loadArsenal,saveArsenal,type AbilityId,type SpecialAmmo,type ConsumableId,type SupplyId,type Price,priceOf} from './arsenal';
import {loadFleetOwners,saveFleetOwners,loadRuins,markRuin,ruinLeft,ruinLabel,clearRuins} from './conquest';
import {RIVAL_SP,battleRank,loadRivalLog,claimRivalSp,dayKey,RANK_SHEET,RANK_COLS,RANK_ICONS,rankIcon,BATTLE_RANKS} from './battle';
import {setupChat,blockedList,setBlocked} from './chat';
import {DOM_TEAMS,DOM_ZONE,DOM_BASE,type DomTeam} from './domination';
import {openDomLobby,closeDomLobby,domLobbyMsg,renderDomHud,showDomResult,type DomLobby,type DomRun,type DomEnd} from './dom-ui';
import {LS_SHIP,LS_LOADOUT,LS_HP,LS_SPEED,LS_FOG_DPS,LS_ITEMS,LS_PICK_R,LS_SPEED_MS,LS_SPEED_BOOST,LS_DROP_PICK_R,LS_DROP_FALL_MS,lsEmptyInv,lsZoneAt,type LsFog,type LsInv,type LsItem,type LsDrop} from './cursed';
import {openArena,openLsLobby,closeLsLobby,lsLobbyMsg,renderLsHud,showLsResult,type LsLobby,type LsRun,type LsOut} from './ls-ui';
import {SIEGE_MS,HERO_DAMAGE,WALL_TOWERS,INNER_TOWERS,gateOf,gateLeft,siegeWindow,newSiege,loadSiege,saveSiege,siegePhase,siegeStats,siegeProgress,contribReward,earnsChest,victoryChest,ranking,loadTitle,grantTitle,HERO_TITLE,type SiegeSave} from './siege';
import {dayEvent,spMult,xpMult,epMult,goldMult,sparkleMult,bossKillsNeeded} from './events';
import {TALENTS,OFFICERS,OFFICER_MAX_RANK,officerCost,officerSlots,talentPoints,loadCrew,saveCrew,spentPoints,computeBonus,type TalentId,type OfficerId} from './crew';
import {FLEET_MASK} from './fleetMask';
import {drawVfx} from './vfx';
import {fleetTowerRegen,playerBaseHp,HULL_HP,damageScale} from './fleetBalance';
import {towerContains,towerMuzzle} from './towerGeometry';
import {loadGuild,saveGuild,islandSlots,towerTypeCost,tagError,canBuild,TOWER_TYPES,ROLE_NAMES,TOWER_SLOTS,type TowerType,type GuildRole,GUILD_NAME_MAX,GUILD_TAG_MAX,type Guild} from './guild';
import {loadProfile,saveProfile,nickError,rankOf,NICK_CHANGE_COST,NICK_COOLDOWN_MS,NICK_MAX} from './profile';
import {createChest,chestRewardText,CHEST_PICKUP_RADIUS,CHEST_CLICK_RADIUS,DRIFT_RESPAWN_SECONDS,type LootChest} from './loot';
import {ELITE_SHIPS,ELITE_DIR16,eliteById,type EliteShipId} from './elite-ships';
import {isoAdvance,straightStep,dir16Toward,type IsoMove,type IsoFace} from './iso-move';
import {spawnText,spawnSoul,spawnRage,clearRageFx,screenTint,updateAbilityFx,drawAbilityFx} from './abilityFx';
import {newRage,rageActive,rageReady,gainRage,startRage,rageSalvo,tickRage,RAGE_MAX,RAGE_SPEED,RAGE_SALVOS,RAGE_PER_RIVAL,RAGE_PER_BOSS} from './rage';

type Vec = { x: number; y: number };
type AmmoKind = 'iron'|'chain'|SpecialAmmo;
const isSpecial=(a:string):a is SpecialAmmo=>a in SPECIAL_AMMO;
type CannonKind = 'cast'|'long'|'rapid'|'heavy';
type CannonStock=Record<CannonKind,number>;
type Shot = Vec & { net?:boolean; noHome?:boolean; captain?:Enemy; foe?:Enemy; powder?:boolean; vx:number; vy:number; life:number; owner:'player'|'enemy'; damage:number; hit:boolean; ammo:AmmoKind; target?:Target; slow?:number; splash?:number; visual?:'spit'; age?:number; flight?:number; arc?:number; trail?:number };
type SalvoRound = { powder?:boolean; delay:number; target:Target; side:number; slot:number; damage:number; ammo:AmmoKind };
type EnemyRole='light'|'heavy';
// Test kaptanı: elit gemili, oyuncu gibi savaşan yapay rakip (yalnız test modunda 1/1'de)
type Captain={elite:EliteShipId;ammo:AmmoKind;ammoClock:number;foe:Enemy|null;orbit:Vec|null;orbitClock:number};
type Enemy = Vec & { kind:'ship'; net?:{id:string;tx:number;ty:number}; dir16?:number; remoteShip?:string; remote?:{id:string;tx:number;ty:number;vx:number;vy:number;seen:number;sp:number;tag:string|null;adm?:boolean;tm?:string}; captain?:Captain; pvp?:PvpBudget; frozen?:number; iso?:IsoMove|null; isoT?:Vec; face?:IsoFace; def?:NpcDef; boss?:BossDef; shared?:string; share?:number; shareN?:number; serverDown?:boolean; lastHp?:number; summoned?:boolean; escortsCalled?:boolean; burnTimer?:number; burnDps?:number; tower?:boolean; towerIndex?:number; lastHitBy?:'player'|'captain'; siege?:boolean; commander?:boolean;  hitRadius?:number; fireRange?:number; rewardXp?:number; role:EnemyRole; angle:number; hp:number; maxHp:number; cooldown:number; speed:number; damage:number; reload:number; rewardGold:number; rewardFame:number; color:string; name:string; tier:number; aggro:boolean; wander:number; slowTimer:number; homeX:number; homeY:number; combatTimer:number };
type ParticleKind='flare'|'ember'|'glint'|'wisp'|'foam'|'smoke'|'spark'|'damage'|'flash'|'splinter'|'bubble'|'plank'|'firePuff'|'target'|'poison'|'soul'|'shock';
// z: su üstünden yükseklik (ekranda yukarı kayar); vz ile savrulan parçalar suya düşer
type Particle = Vec & { vx:number; vy:number; life:number; maxLife:number; kind:ParticleKind; text?:string; color?:string; z?:number; vz?:number; rot?:number; vr?:number; size?:number; variant?:number };
type Wreck = Vec & { image:HTMLCanvasElement; t:number };
const wrecks:Wreck[]=[];
type Target = Enemy;
type UpgradeKind = 'hull'|'damage'|'range'|'reload'|'speed'|'repair';
type QuickItemId = 'iron'|'chain'|SpecialAmmo|'mine'|'powder'|'shield'|'repairkit'|'speed'|'compass';
type ShipSelection='starter'|EliteShipId;
const ELITE_ONE_PRICE=ELITE_ENTRY_PRICE;
// Test süresince elit gemiler ve 8. seviyeye kadar tüm haritalar açık.
const ELITE_TEST_MODE=false;
// Top türleri ortak savaş dosyasında (src/combat.ts); oyun sunucusu da aynısını kullanır
const UPGRADES:Record<UpgradeKind,{name:string;description:string;effect:string;pearls:number}>={
  hull:{name:'Güçlendirilmiş Gövde',description:'Geminin azami gövde dayanıklılığını artırır.',effect:'+15.000 gövde · top kapasitesi sabit',pearls:8},
  damage:{name:'Top Güvertesi',description:'Her borda atışının verdiği hasarı artırır.',effect:'+%11 hasar',pearls:10},
  range:{name:'Uzun Namlular',description:'Tüm top türlerinin etkili menzilini artırır.',effect:'+18 menzil',pearls:9},
  reload:{name:'Tecrübeli Topçular',description:'Topların yeniden dolma süresini azaltır.',effect:'-%4 dolum',pearls:12},
  speed:{name:'Yeni Yelken Takımı',description:'Geminin ulaşabileceği azami hızı artırır.',effect:'+5 hız',pearls:9},
  repair:{name:'Usta Marangozlar',description:'Açık denizde yapılan tamirin hızını artırır.',effect:'+%4 tamir',pearls:7}
};
const QUICK_ITEMS:Record<QuickItemId,{name:string;icon:string;category:'ammo'|'consumable';description:string}>={
  iron:{name:'Demir Gülle',icon:'iron',category:'ammo',description:'Standart top güllesi; altınla ucuza alınır (1.000 gülle = 10 altın).'},chain:{name:'Zincir Güllesi',icon:'chain',category:'ammo',description:'Oyuncuları 3 saniye %40 yavaşlatır; NPC\'ye etki etmez.'},
  fire:{name:'Ateş Güllesi',icon:'damage',category:'ammo',description:'NPC ve canavarlara %40 fazla hasar.'},
  explosive:{name:'Patlayıcı Gülle',icon:'damage',category:'ammo',description:'Oyunculara %40 fazla hasar.'},breaker:{name:'Kule Kırıcı',icon:'iron',category:'ammo',description:'Kulelere 2,6 kat hasar.'},leech:{name:'Can Emici',icon:'damage',category:'ammo',description:'Yalnız oyunculardan şansla can çalar.'},heal:{name:'Şifa Güllesi',icon:'repairkit',category:'ammo',description:'Hasar vermez; oyuncuların ve dost kulelerin canını doldurur. NPC\'ye sıkılamaz.'},
  repairkit:{name:'Tamir Sandığı',icon:'repairkit',category:'consumable',description:'Açık deniz tamirini başlatır.'},speed:{name:'Hız İksiri',icon:'speed',category:'consumable',description:'İçince 1,5 sn boyunca hız %55 artar; her kullanımda 1 adet harcar.'},
  compass:{name:'Pusula',icon:'compass',category:'consumable',description:'Basınca 8 saniye boyunca haritadaki bütün gemileri ve canavarları mini haritada gösterir. 20 saniyede bir kullanılır, her kullanımda 1 adet harcar.'},
  powder:{name:'Kara Barut',icon:'damage',category:'consumable',description:CONSUMABLES.powder.description},shield:{name:'Kalkan',icon:'hull',category:'consumable',description:CONSUMABLES.shield.description},mine:{name:'Deniz Mayını',icon:'hull',category:'consumable',description:'Kıçtan mayın bırakır.'}
};
const AMMO_ROW=6;
const QUICK_TIPS:Record<QuickItemId,string>={iron:'Altınla',heal:'Can doldurur',chain:'Yavaşlatır',fire:'NPC +%40',explosive:'Oyuncu +%40',breaker:'Kule ×2,6',leech:'Can çalar',repairkit:'Tamir',speed:'Hızlandırır',compass:'Herkesi gösterir',powder:'Hasar artar',shield:'Hasar azalır',mine:'Mayın bırakır'};

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-shell">
    <canvas id="sea"></canvas><div class="info-strip"><form class="coord-go" id="coordGo" autocomplete="off"><span>Koordinata git</span><input id="goCol" inputmode="numeric" maxlength="2" placeholder="55" aria-label="Sütun (00–60)"/><input id="goRow" maxlength="2" placeholder="AN" aria-label="Satır (AA–CZ)"/><button type="submit">GİT</button></form><form class="coord-go spy-go" id="spyGo" autocomplete="off"><input id="spyNick" maxlength="20" placeholder="Rakip adı" aria-label="Rakip kaptan adı"/><button type="submit">CASUS</button></form><button class="net-pill" id="netPill" type="button" hidden><i></i><span id="netText">Bağlanıyor…</span></button><span class="strip-res"><i class="sprite icon-gold"></i><b id="stripGold">0</b><i class="sprite icon-pearl"></i><b id="stripPearls">0</b><button id="stripPearlPlus" aria-label="İnci satın al">+</button></span></div><div class="grain"></div>
    <section class="hud">
      <div class="corner-buttons"><button class="round-button" id="openShop" aria-label="Market"><img src="/assets/icon-market-v2.webp" alt="" draggable="false"/></button><button class="round-button logout-button" id="logoutCorner" aria-label="Çıkış yap" title="Çıkış yap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 8l4 4-4 4M18 12H9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="round-button" id="openMenu" aria-label="Menü"><img src="/assets/icon-menu-v2.webp" alt="" draggable="false"/></button></div>
      <nav class="shop-tabs" id="shopTabs"><button id="openEliteShips" data-shop="eliteShipOverlay"><img class="nav-img" id="shipNavIcon" alt="" draggable="false"/><span>TERSANE</span></button><button id="openEquipShop" data-shop="equipShopOverlay"><i class="nav-img equip-nav"></i><span>DONANIM</span></button><button id="openCannonShop" data-shop="cannonShopOverlay"><img class="nav-img" src="/assets/cannon-cast-v1.webp" alt="" draggable="false"/><span>TOPLAR</span></button><button id="openShip" data-shop="shipOverlay"><img class="nav-img" src="/assets/icon-inventory-v3.webp" alt="" draggable="false"/><span>ENVANTER</span></button><button id="openMarket" data-shop="marketOverlay"><img class="nav-img" src="/assets/ammo-fire-v2.webp" alt="" draggable="false"/><span>GÜLLELER</span></button><button id="openLoadoutTab" data-shop="supplyOverlay"><img class="nav-img" src="/assets/icon-chest-v2.webp" alt="" draggable="false"/><span>MALZEMELER</span></button><button id="openAuction" data-shop="auctionOverlay"><img class="nav-img" src="/assets/icon-gold-v1.webp" alt="" draggable="false"/><span>İHALE</span></button><button id="openPearlShop" data-shop="pearlShopOverlay"><img class="nav-img" src="/assets/icon-pearl-v1.webp" alt="" draggable="false"/><span>MAĞAZA</span></button><button class="shop-close" id="closeShopTabs" aria-label="Marketi kapat">×</button></nav>
      <div class="captain-overlay menu-overlay mentor-overlay" id="mentorOverlay"><section class="captain-profile menu-window mentor-window"><header><img class="menu-logo" src="/assets/icon-mentor-v1.webp" alt="" draggable="false"/><div><span class="eyebrow">Usta ve çırak</span><h2>KAPTAN &amp; MUÇO</h2></div><button id="closeMentorship" aria-label="Kapat">×</button></header><div id="mentorPanel"></div></section></div><div class="captain-overlay menu-overlay" id="menuOverlay"><section class="captain-profile menu-window"><header><img class="menu-logo" src="/assets/logo-pirate-rage-v1.webp" alt="Pirate Rage: Korsan Öfkesi" draggable="false"/><div><span class="eyebrow">Kaptan köşkü</span><h2>MENÜ</h2></div><button id="closeMenu" aria-label="Menüyü kapat">×</button></header><div class="menu-grid"><button id="openCaptain"><img src="/assets/icon-hat-v2.webp" alt="" draggable="false"/><span>KAPTAN PROFİLİ</span></button><button id="openGuild"><img src="/assets/icon-fleet-v1.webp" alt="" draggable="false"/><span>FİLO</span></button><button id="openDevelopment"><img src="/assets/icon-anvil-v2.webp" alt="" draggable="false"/><span>GELİŞTİRME</span></button><button id="openCrew"><img src="/assets/crew-helmsman-v1.webp" alt="" draggable="false"/><span>TAYFA</span></button><button id="openDaily"><img src="/assets/icon-chest-v2.webp" alt="" draggable="false"/><span>GÜNLÜK ÖDÜL</span></button><button id="openMenuQuests"><img src="/assets/icon-scroll-v2.webp" alt="" draggable="false"/><span>GÖREVLER</span></button><button id="openMenuWorld"><img id="menuWorldIcon" alt="" draggable="false"/><span>DÜNYA HARİTASI</span></button><button id="openLog"><img src="/assets/icon-treasure-map-v3.webp" alt="" draggable="false"/><span>SEYİR DEFTERİ</span></button><button id="openRanks"><img src="/assets/icon-flag-v1.webp" alt="" draggable="false"/><span>SIRALAMALAR</span></button><button id="openCoupon"><img src="/assets/icon-pearl-v1.webp" alt="" draggable="false"/><span>KUPON KODU</span></button><button id="openMentorship"><img src="/assets/icon-mentor-v1.webp" alt="" draggable="false"/><span>KAPTAN &amp; MUÇO</span></button><button id="openSettings"><img src="/assets/icon-gear-v2.webp" alt="" draggable="false"/><span>AYARLAR</span></button></div></section></div>
      <div class="resources"><div class="resource compact"><i class="sprite icon-gold"></i><span>ALTIN</span><b id="gold">000</b></div><div class="resource compact pearl" id="pearlResource" title="İnci satın al"><i class="sprite icon-pearl"></i><span>İNCİ</span><b id="pearls">000</b><em class="pearl-plus">+</em></div></div>
      <div class="panel quest" hidden><span class="eyebrow">Aktif görev</span><h3 id="questTitle">Görev seçilmedi</h3><p id="questDescription">Kaptan, yapmak istediğin görevi görev defterinden seçebilirsin.</p><div class="progress" id="quest">Hazır olduğunda bir görev başlat</div><button class="quest-open" id="openQuests">GÖREVLERİ AÇ</button></div>
      <section class="combat-targets" id="combatTargets" aria-live="polite"></section>
      <div class="hud-dock"><div class="dock-status"><div class="status-pair"><div class="status-line hp-line"><span>HP</span><i><em id="hpHudBar"></em></i><b id="hpHudText">100 / 100</b></div></div><div class="dock-center"><button class="recenter" id="recenterShip" aria-label="Gemiyi haritada ortala">✥</button></div><div class="status-pair"><div class="status-line battle-line"><span>SP</span><i><em id="battleBar"></em></i><b id="battleText">0 / 100</b></div></div></div></div><div class="slot-bar" id="ammoBar" data-bar="ammo"><div class="bar-grip" title="Tutup sürükle · çift tık: eski yerine"><button class="bar-toggle" aria-label="Gülle yuvalarını aç/kapat" title="Aç/kapat"><i></i></button></div><div class="bar-slots" id="ammoSlots"></div></div><div class="slot-bar" id="itemBar" data-bar="item"><div class="bar-grip" title="Tutup sürükle · çift tık: eski yerine"><button class="bar-toggle" aria-label="Malzeme yuvalarını aç/kapat" title="Aç/kapat"><i></i></button></div><div class="bar-slots" id="itemSlots"></div></div><div class="ammo-picker" id="ammoPicker"></div><div class="top-status" id="topStatus"><div class="status-line xp-line"><span>TP</span><i><em id="xpHudBar"></em></i><b id="xpHudText">0 / 100</b></div><b class="top-level" id="level" title="Kaptan seviyesi">1</b><div class="status-line elite-line"><span>EP</span><i><em id="eliteBar"></em></i><b id="eliteText">0 / 100</b></div></div>
      <div class="combat-controls" id="combatControls"><button class="combat-action attack" id="attack" title="Saldır"><b><img src="/assets/icon-attack-v2.webp" alt="" draggable="false"/></b><span id="attackLabel">SALDIR</span><small id="reloadText">HAZIR</small></button><button class="combat-action speed ability" id="ability-speed" title="Hız İksiri"><b><img src="/assets/icon-speed-potion-v2.webp" alt="" draggable="false"/></b><span>HIZ</span><small data-bind="speed"></small></button><button class="combat-action mine ability" id="ability-mine" title="Deniz Mayını"><b><img src="/assets/icon-mine-v2.webp" alt="" draggable="false"/></b><span>MAYIN</span><small data-bind="mine"></small></button><button class="combat-action rage" id="rageButton" title="Korsan Öfkesi — bar dolunca bas: 2 salvo %25 hasar, %15 hız"><b><img src="/assets/icon-app-192.png" alt="" draggable="false"/></b><span>KORSAN ÖFKESİ</span><small id="rageTime">%0</small></button></div>
      <div class="map-cluster"><div class="map-badge" id="mapBadge"><strong id="mapName"></strong><small id="mapSubtitle"></small><b class="map-coord" id="mapCoord" title="Konum koordinatı">1/1 - 00AA</b></div><canvas id="minimap" width="188" height="133"></canvas><button class="world-map-button" id="openWorldMap" aria-label="Dünya haritalarını görüntüle"><img id="worldMapIcon" alt="" draggable="false"/><span>DÜNYA</span></button><button class="quest-bust" id="openQuestTop" aria-label="Görevler"><img src="/assets/quest-captain-v2.webp" alt="" draggable="false"/><span>GÖREVLER</span><small id="questBadge"></small></button><div class="panel zoom-controls"><button id="zoomOut" aria-label="Uzaklaştır">−</button><span id="zoomValue">70%</span><button id="zoomIn" aria-label="Yakınlaştır">+</button></div></div>
      <div class="sink-notices" id="sinkNotices" role="status" aria-live="polite"></div>
      <div class="toast" id="toast"></div>
      <div class="portal-prompt" id="portalPrompt"></div><div class="quest-overlay daily-overlay" id="dailyOverlay"><section class="daily-window"><header><div><span class="eyebrow">Her gün gel, ödül büyüsün</span><h2>GÜNLÜK ÖDÜL</h2></div><button id="closeDaily" aria-label="Kapat">×</button></header><div class="daily-grid" id="dailyGrid"></div><p class="daily-note" id="dailyNote"></p></section></div><button class="dig-prompt" id="digPrompt"><img src="/assets/icon-treasure-map-v3.webp" alt="" draggable="false"/><span>HAZİNEYİ KAZ</span><i><em id="digBar"></em></i></button><div class="event-panel" id="eventPanel"></div><div class="quest-overlay world-overlay" id="worldMapOverlay"><section class="world-scroll" aria-label="Dünya haritası"><button class="scroll-close" id="closeWorldMap" aria-label="Dünya haritasını kapat">×</button><div class="world-chart" id="worldChart"></div><button class="world-dom" id="worldDom">⚔ ARENA · DENİZ HAKİMİYETİ · LANETLİ SULAR</button><div id="worldInfo" hidden></div></section></div><div class="quest-overlay" id="questOverlay"><section class="quest-log"><header><div><span class="eyebrow">Kaptanın görev defteri</span><h2>DENİZ GÖREVLERİ</h2></div><button id="closeQuests" aria-label="Görevleri kapat">×</button></header><p class="quest-intro">1 aktif görev · Tekrar süresi: ${QUEST_COOLDOWN_MS/3_600_000} saat</p><div class="quest-list" id="questList"></div></section></div>
      <div class="captain-overlay" id="captainOverlay"><section class="captain-profile"><header><div><span class="eyebrow">Oyuncu profili</span><h2 id="captainName">KAPTAN</h2></div><button id="closeCaptain" aria-label="Kaptan profilini kapat">×</button></header><div class="captain-tab" id="captainTab-profile"><div class="captain-identity"><div class="captain-portrait"><img src="/assets/icon-hat-v2.webp" alt="" draggable="false"/><b id="captainLevel">1</b></div><div><span>AMİRAL GEMİSİ</span><strong>Yedi Deniz</strong><small>Gölgeler Denizi Kaptanı</small></div></div><div class="captain-nick" id="captainNick"></div><div class="captain-stat-grid"><article><span>TECRÜBE PUANI</span><b id="xpText">0 / 100</b><i class="xp"><em id="xpBar"></em></i></article><article><span>HP · CAN PUANI</span><b id="hpText">100 / 100</b><i class="hp"><em id="hpBar" style="width:100%"></em></i></article><article><span>ELİT PUAN</span><b id="profileElite">0 / 100</b><i class="elite"><em id="profileEliteBar"></em></i></article><article><span>SAVAŞ PUANI</span><b id="profileBattle">0 / 500</b><i class="battle"><em id="profileBattleBar"></em></i></article></div><div class="bonus-summary" id="bonusSummary"></div><section class="rank-medals"><header><span class="eyebrow">Savaş rütbesi madalyaları</span><p class="ach-summary" id="rankMedalSummary"></p></header><div class="rank-medal-grid" id="rankMedals"></div></section><section class="captain-medals"><header><span class="eyebrow">Madalyalar ve kalıcı bonuslar</span><p class="ach-summary" id="achSummary"></p></header><div class="ach-grid" id="achGrid"></div></section></div></section></div><div class="captain-overlay" id="guildOverlay"><section class="captain-profile crew-window guild-window"><header><div><span class="eyebrow">Filo hazinesi ve ada kuleleri</span><h2>FİLO</h2></div><button id="closeGuild" aria-label="Filo penceresini kapat">×</button></header><div id="guildPanel"></div></section></div><div class="captain-overlay" id="crewOverlay"><section class="captain-profile crew-window"><header><div><span class="eyebrow">Geminin subayları</span><h2>TAYFA</h2></div><button id="closeCrew" aria-label="Tayfayı kapat">×</button></header><div id="crewPanel"></div></section></div><div class="quest-overlay" id="logOverlay"><section class="quest-log log-window"><header><div><span class="eyebrow">Kaptanın günlüğü</span><h2>SEYİR DEFTERİ</h2></div><button id="closeLog" aria-label="Seyir defterini kapat">×</button></header><div id="logPanel"></div></section></div><div class="quest-overlay" id="rankOverlay"><section class="quest-log rank-log"><header><div><span class="eyebrow">Denizlerin en iyileri</span><h2>SIRALAMALAR</h2></div><button id="closeRanks" aria-label="Sıralamaları kapat">×</button></header><div id="rankPanel"></div></section></div><div class="quest-overlay" id="couponOverlay"><section class="quest-log coupon-log"><header><div><span class="eyebrow">Etkinlik ödülleri</span><h2>KUPON KODU</h2></div><button id="closeCoupon" aria-label="Kupon penceresini kapat">×</button></header><p class="quest-intro">Etkinliklerde ve duyurularda paylaşılan kodu gir, ödülün hemen hesabına eklensin. Her kod bir kez kullanılır.</p><div class="coupon-form"><input id="couponInput" maxlength="32" placeholder="KUPON KODU" autocomplete="off" spellcheck="false"/><button id="couponRedeem">KULLAN</button></div><p class="coupon-result" id="couponResult"></p></section></div><div class="quest-overlay" id="settingsOverlay"><section class="quest-log settings-log"><header><div><span class="eyebrow">Oyun tercihleri</span><h2>AYARLAR</h2></div><button id="closeSettings" aria-label="Ayarları kapat">×</button></header><div id="settingsPanel"></div></section></div>
      <div class="ship-overlay" id="eliteShipOverlay"><section class="ship-menu elite-ship-window"><header><div><span class="eyebrow">Filo tersanesi</span><h2>TERSANE</h2></div></header><div class="elite-ship-layout"><div class="elite-ship-grid" id="eliteShipGrid"></div><aside class="elite-ship-detail" id="eliteShipDetail"></aside></div></section></div><div class="ship-overlay" id="shipOverlay"><section class="ship-menu inv-window"><header><div class="inv-top"><img src="/assets/cannon-cast-v1.webp" alt="" draggable="false"/><span id="shipSummary"></span></div><h2>ENVANTER</h2></header><div class="inv-modes"><button data-inv-mode="cannon">TOPLAR</button><button data-inv-mode="equip">DONANIM</button></div><div class="inv-body"><aside class="inv-captain"><img src="/assets/captain-bust-v1.webp" alt="" draggable="false"/></aside><section class="inv-panel"><header><span>Depo</span><button class="inv-arrow to-depot" id="invToDepot" title="Seçili topu depoya al">⬅</button></header><div class="inv-grid" id="invDepot" data-side="depot"></div></section><section class="inv-panel"><header><button class="inv-arrow to-ship" id="invToShip" title="Seçili topu gemiye al">➡</button><span>Gemi</span></header><div class="inv-grid" id="invShip" data-side="ship"></div></section><aside class="inv-info"><header>Bilgi</header><div id="cannonRows"></div></aside></div></section></div><div class="market-overlay" id="equipShopOverlay"><section class="market-menu"><header><div><span class="eyebrow">Gemi ustası</span><h2>DONANIM</h2></div></header><div class="market-list" id="equipShopList"></div></section></div><div class="market-overlay" id="cannonShopOverlay"><section class="market-menu cannon-shop"><header><div><span class="eyebrow">Topçu dökümhanesi</span><h2>TOPLAR</h2></div></header><div class="market-list" id="cannonShopList"></div></section></div>
      <div class="development-overlay" id="developmentOverlay"><section class="development-menu"><header><div><span class="eyebrow">Kaptanın gelişim planı</span><h2>GELİŞTİRME</h2></div><button id="closeDevelopment" aria-label="Geliştirmeyi kapat">×</button></header><div id="talentPanel"><div class="dev-tree" id="upgradeList"></div><div class="upgrade-confirm" id="upgradeConfirm"></div></div></section></div>
      <div class="market-overlay" id="marketOverlay"><section class="market-menu"><header><div><span class="eyebrow">Tüccar loncası</span><h2>GÜLLELER</h2></div></header><div class="market-list" id="marketList"></div></section></div><div class="market-overlay" id="supplyOverlay"><section class="market-menu"><header><div><span class="eyebrow">Sarf malzemeleri</span><h2>MALZEMELER</h2></div></header><div class="market-list" id="supplyList"></div></section></div><div class="market-overlay" id="auctionOverlay"><section class="market-menu"><header><div><span class="eyebrow">Altın ihalesi · her saat yenilenir</span><h2>İHALE</h2><p>En yüksek altın teklifini veren kazanır. Teklif verdiğin altın hemen harcanır; teklifin geçilirse ya da ihaleyi kaybedersen altın geri verilmez. <b id="auctionTimer"></b></p></div></header><div class="market-list" id="auctionList"></div><div class="auction-last" id="auctionLast"></div></section></div><div class="market-overlay" id="pearlShopOverlay"><section class="market-menu pearl-shop"><header><div><span class="eyebrow">Kaptanın hazinesi</span><h2>İNCİ HAZİNESİ</h2><p>İnciyle elit gülleler, malzemeler ve elit gemiler alınır. Büyük paketlerde bonus inci artar.</p></div></header><h3 class="pearl-title">İNCİ PAKETLERİ</h3><div class="pearl-packs" id="pearlPacks"></div><p class="pearl-note" id="pearlNote"></p></section></div><div class="buy-confirm" id="buyConfirm"></div><div class="loadout-overlay" id="loadoutOverlay"><section class="loadout-menu"><header><div><span class="eyebrow">Sarf malzemeleri</span><h2 id="loadoutTitle">MALZEMELER</h2></div><button id="closeLoadout">×</button></header><p id="loadoutHint">Sarf malzemeleri alt sıraya yerleşir. Sürükleyip bırak ya da önce eşyaya, sonra yuvaya dokun. Kara Barut ve Kalkan yuvaya dokununca açılır/kapanır.</p><div class="loadout-items" id="loadoutItems"></div><div class="loadout-slots" id="loadoutSlots"></div></section></div>
    </section>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#sea')!;
// alpha:false → tuval opak; tarayıcı arka planla karıştırmaz (daha hızlı birleştirme)
const ctx = canvas.getContext('2d',{alpha:false})!;
const minimap = document.querySelector<HTMLCanvasElement>('#minimap')!;
const mini = minimap.getContext('2d')!;
// Mini harita da cihaz piksel oranında çizilir (çizim kodu 188×133 koordinatlarıyla çalışmaya devam eder)
{const k=Math.min(3,Math.max(1,devicePixelRatio||1));minimap.width=188*k;minimap.height=133*k;}
document.documentElement.style.setProperty('--starter-ship','url("/assets/starter-art-v2.webp")');
// Başlangıç gemisinin 3D modelden 16 yönlü görünüşü (elitlerle aynı kare düzeni)
const STARTER_DIR16='/assets/starter-dir16-v1.webp';
const ADMIN_DIR16='/assets/admin-dir16-v1.webp';
// Başlangıç gemisi "Yedi Deniz": 8 yönlü sayfa (4 × 2, 256 px; elitlerle aynı kare sırası)
document.documentElement.style.setProperty('--pirate-icons','url("/assets/pirate-ui-icons-v1.webp")');
([['/assets/icon-world-v2.webp','worldMapIcon'],['/assets/icon-world-v2.webp','menuWorldIcon'],['/assets/icon-ship-nav-v2.webp','shipNavIcon']] as const).forEach(([src,id])=>{const img=document.getElementById(id) as HTMLImageElement|null;if(img)img.src=src;});
const cannonAssetSources:Record<CannonKind,string>={cast:'/assets/cannon-cast-v1.webp',long:'/assets/cannon-long-v1.webp',rapid:'/assets/cannon-rapid-v1.webp',heavy:'/assets/cannon-heavy-v1.webp'};
const rasterItemAssets:Partial<Record<QuickItemId,string>>={};
(Object.keys(SPECIAL_AMMO) as SpecialAmmo[]).forEach(k=>{rasterItemAssets[k]=SPECIAL_AMMO[k].icon;});rasterItemAssets.mine=ABILITIES.mine.icon;rasterItemAssets.shield=CONSUMABLES.shield.icon;rasterItemAssets.powder=CONSUMABLES.powder.icon;rasterItemAssets.speed=ABILITIES.speed.icon;rasterItemAssets.repairkit='/assets/icon-repair-v2.webp';
rasterItemAssets.iron='/assets/ammo-iron-v2.webp';rasterItemAssets.compass=COMPASS.icon;rasterItemAssets.chain='/assets/ammo-chain-v2.webp';
// Elit gemiler: tersane kartındaki tasarımın birebir aynısı, gemi başına temiz raster (384 px, pruva sol-aşağı).
// Gemi görselleri aynı dosya adıyla yenilendiğinde tarayıcı önbelleği eskisini göstermesin diye sürüm eki (görsel değişince artır)
const SHIP_ART_REV='9';
const eliteArtUrl=(id:string)=>`${eliteById(id).asset}?r=${SHIP_ART_REV}`;
const ui = (id:string) => document.getElementById(id)!;
const keys = new Set<string>();
const QUEST_STORAGE='yedi-deniz-quests-v2';
const ACCOUNT_STORAGE='yedi-deniz-account-v1';
let storedQuests:SavedQuests|null=null;
let storedAccount:{pearls?:number;gold:number;wood?:number;fame:number;level:number;maxHp:number;hp:number;chainAmmo:number;ironAmmo?:number;elitePoints?:number;eliteEconomyVersion?:number;battlePoints?:number;cannonType?:CannonKind;cannonInventory?:CannonStock;mountedCannons?:CannonStock;equipOwned?:Record<string,number>;equipped?:Partial<Record<EquipSlot,string|null>>;quickSlots?:Array<QuickItemId|null>;quickKnown?:QuickItemId[];upgrades:Record<UpgradeKind,number>;eliteShip?:EliteShipId;activeShip?:ShipSelection;elitePurchased?:boolean;currentMap?:MapKey}|null=null;
try{storedQuests=migrateQuestRules(JSON.parse(localStorage.getItem(QUEST_STORAGE)||'null'));if(storedQuests)localStorage.setItem(QUEST_STORAGE,JSON.stringify(storedQuests));}catch{storedQuests=null;}
try{storedAccount=JSON.parse(localStorage.getItem(ACCOUNT_STORAGE)||'null');if(storedAccount){storedAccount.elitePoints=migrateElitePoints(storedAccount.elitePoints??0,storedAccount.eliteEconomyVersion);storedAccount.eliteEconomyVersion=ELITE_ECONOMY_VERSION;}}catch{storedAccount=null;}
const storedActive=storedQuests?.active&&QUESTS.some(q=>q.id===storedQuests!.active)?storedQuests.active:null;
const HP_PER_HULL=HULL_HP,BASE_CANNONS=100;
// Test kaptanları (ADM): 8. seviye tam gelişmiş oyuncu ölçeğinde
const TEST_CAPTAIN_HP=Math.round(playerBaseHp(8,10)*1.2),TEST_CAPTAIN_DMG=Math.round(1100*damageScale(8));
const upgrades:Record<UpgradeKind,number>={hull:storedAccount?.upgrades?.hull||0,damage:storedAccount?.upgrades?.damage||0,range:storedAccount?.upgrades?.range||0,reload:storedAccount?.upgrades?.reload||0,speed:storedAccount?.upgrades?.speed||0,repair:storedAccount?.upgrades?.repair||0};
// Test aşamasında tüm inci geliştirmeleri en üst seviyededir
if(ELITE_TEST_MODE)for(const k of Object.keys(upgrades) as UpgradeKind[])upgrades[k]=10;
const defaultCannonStock:CannonStock={cast:20,long:6,rapid:4,heavy:2};
const defaultMountedCannons:CannonStock={cast:50,long:0,rapid:0,heavy:0};
const cannonInventory:CannonStock={...defaultCannonStock,...storedAccount?.cannonInventory};
const mountedCannons:CannonStock={...defaultMountedCannons,...storedAccount?.mountedCannons};
// Donanım: depodaki parça sayıları ve gemideki yuvalar
const equipOwned:Record<string,number>={...storedAccount?.equipOwned};
const equipped:Partial<Record<EquipSlot,string|null>>={...storedAccount?.equipped};
// Kaldırılan orta kademe (nadir) donanım: eski kayıtlarda kalan parçalar silinir, takılıysa çıkarılır
for(const id of Object.keys(equipOwned))if(!equipById(id))delete equipOwned[id];
for(const k of Object.keys(equipped) as EquipSlot[])if(equipped[k]&&!equipById(equipped[k]!))equipped[k]=null;
const equipBonus=()=>equipTotals(equipped);
// Başarımlar: sayaçlar ve açılan madalyaların kalıcı bonusları (altın, TP, hasar, can)
const ach=loadAchievements();let achBonusCache=achievementBonus(ach);
const achBonus=()=>achBonusCache;
// VİP: %10 fazla tecrübe; hareket halinde tamir
// Kaptan & Muço: ustası aynı denizdeyken muço daha çok TP kazanır. Diğer oyuncular sunucu gelince görünür; o zamana dek yakında usta yok.
let mentorship=loadMentorship();
const mentorNearby=()=>false;
const xpGain=(n:number)=>Math.round(n*(1+achBonus().xp)*xpMult()*(mentorship.mentor&&mentorNearby()?1+TOGETHER_XP_BONUS:1)),goldGainAch=(n:number)=>Math.round(n*(1+achBonus().gold)*goldMult());
// Yöneticinin kendi ekranında etkinlik canı (sunucudan); 1. seviye denizlerde ya da veri gelmezse kendi canı görünür
let adminEv:{hp:number;max:number;at:number}|null=null;
function adminEvHp(){return session.isAdmin&&adminEv&&mapDef().tier>=2&&performance.now()-adminEv.at<5000?adminEv:null;}
const state = { pearls:storedAccount?.pearls??30, gold:storedAccount?.gold??40, fame:storedAccount?.fame??0, level:ELITE_TEST_MODE?MAX_LEVEL:Math.min(MAX_LEVEL,storedAccount?.level??1), hp:storedAccount?.hp??Infinity, maxHp:storedAccount?.maxHp??100, elitePoints:storedAccount?.elitePoints??0,battlePoints:storedAccount?.battlePoints??0,cannon:18, cannonType:storedAccount?.cannonType&&CANNONS[storedAccount.cannonType]?storedAccount.cannonType:'cast' as CannonKind, activeQuest:storedActive as string|null, ammo:'iron' as AmmoKind, chainAmmo:storedAccount?.chainAmmo??2000,ironAmmo:storedAccount?.ironAmmo??IRON_START, attacking:false, repairing:false, invulnerable:0 };
let levelQuest=loadLevelQuest(state.level),levelQuestNoticed=false;
// Seviye görevi açık mı: TP dolmuş ama görev bitmemiş
const levelQuestOpen=()=>state.fame>=xpNeed(state.level)&&!levelQuestDone(levelQuest);
function levelQuestHit(kind:'npc'|'monster',id:string,tier:number){
  if(levelQuestMap(levelQuest.level)!==currentMap&&state.fame>=xpNeed(state.level)&&!levelQuestDone(levelQuest)&&tier===levelQuest.level){toast(`Seviye görevi ${levelQuestMap(levelQuest.level)} haritasında · bu batırma sayılmadı`);return;}
  if(!levelQuestKill(levelQuest,kind,id,tier,state.fame>=xpNeed(state.level),currentMap))return;saveLevelQuest(levelQuest);
  const g=levelQuestGoal(levelQuest.level);
  if(levelQuestDone(levelQuest))rewardNotice(`Seviye görevi tamamlandı · Seviye ${levelQuest.level+1} açılıyor`,'gain');
  else toast(`Seviye görevi · ${levelQuest.ships}/${g.ships} ağır gemi`);
}
function levelQuestHtml(){
  if(!needsLevelQuest(state.level)||!Number.isFinite(xpNeed(state.level)))return'';
  const g=levelQuestGoal(state.level),open=levelQuestOpen(),L=state.level;
  return`<article class="quest-entry level-quest ${open?'active':''}"><div class="quest-number">★</div><div class="quest-copy"><span>SEVİYE GÖREVİ · ${L} → ${L+1}</span><h3>${open?'Seviye görevi hazır':'TP dolunca açılır'}</h3><p>${levelQuestMap(L)} haritasında ${g.ships} ağır gemi batır. Görev bitene kadar kazandığın TP birikir.</p><b>${levelQuest.ships}/${g.ships} Ağır gemi</b></div></article>`;
}
// Eski ölçekli kayıtlar (100 canlı, 18 toplu gemi) bir kez Seafight ölçeğine taşınır: can formülden hesaplanır,
// gemiye en az 50 döküm top yerleştirilir.
if(storedAccount&&storedAccount.maxHp<5000){const total=(Object.keys(mountedCannons) as CannonKind[]).reduce((sum,kind)=>sum+mountedCannons[kind],0);if(total<50)mountedCannons.cast+=50-total;state.hp=Infinity;}
state.maxHp=playerBaseHp(state.level,upgrades.hull);
state.cannon=(Object.keys(mountedCannons) as CannonKind[]).reduce((sum,kind)=>sum+mountedCannons[kind],0);
let elitePurchased=storedAccount?.elitePurchased===true;
let activeEliteShip:EliteShipId=storedAccount?.eliteShip&&ELITE_SHIPS.some(s=>s.id===storedAccount!.eliteShip)?storedAccount.eliteShip:'phantom';
// Test modunda elit satın alınmış sayılmaz; seçilen elit gemi yine de yeniden yüklemede korunur
let activeShip:ShipSelection=(elitePurchased||ELITE_TEST_MODE)&&storedAccount?.activeShip&&ELITE_SHIPS.some(s=>s.id===storedAccount!.activeShip)?storedAccount.activeShip:'starter';
let designOwned=ELITE_TEST_MODE||loadDesignOwned();
let activeSpecialDesign=designOwned?loadSpecialDesign():null;
let previewShip:ShipSelection|SpecialDesignId=activeSpecialDesign??activeShip;
// Özel tasarım yalnızca görünümü değiştirir; seçili geminin gücü ve donanımı korunur.
const quickSlots:Array<QuickItemId|null>=Array(12).fill(null);
{const stored=(storedAccount?.quickSlots??['iron','chain','fire','breaker','speed','powder','shield','mine']).filter((id):id is QuickItemId=>!!id&&id!=='repairkit'&&id in QUICK_ITEMS);
  const place=(id:QuickItemId)=>{if(quickSlots.includes(id))return;const row=QUICK_ITEMS[id].category==='ammo'?0:AMMO_ROW;for(let i=row;i<row+AMMO_ROW;i++)if(!quickSlots[i]){quickSlots[i]=id;return;}};
  stored.forEach(place);place('compass');(['iron','chain','fire','breaker','speed','powder','shield','mine'] as QuickItemId[]).forEach(id=>{if(!storedAccount?.quickSlots)place(id);});
  // Oyuna yeni eklenen malzeme bara bir kez kendiliğinden yerleşir; oyuncu sonra kaldırırsa geri gelmez
  const known=new Set(storedAccount?.quickKnown??[]);for(const id of Object.keys(QUICK_ITEMS) as QuickItemId[])if(id!=='repairkit'&&!known.has(id)&&!quickSlots.includes(id)){place(id);if(!quickSlots.includes(id)){const free=quickSlots.indexOf(null);if(free>=0)quickSlots[free]=id;}}}
const quickKnown=(Object.keys(QUICK_ITEMS) as QuickItemId[]);
const arsenal=loadArsenal();
// Eski kayıtlarda gülle stoğu salvo sayısıydı; artık her top 1 gülle harcar. Stoklar bir kez 50 topluk salvoya göre çevrilir.
if(!arsenal.ballsV1){for(const k of ['fire','explosive','breaker','leech'] as const)arsenal[k]*=50;state.chainAmmo*=50;arsenal.ballsV1=true;saveArsenal(arsenal);}
// Kara Barut eski kayıtlarda da sarf sırasına bir kez yerleşir
if(!quickSlots.includes('powder')){const free=quickSlots.findIndex((v,k)=>k>=AMMO_ROW&&!v);if(free>=0)quickSlots[free]='powder';}
// Açık/kapalı sarf malzemeleri
const consumableOn:Record<ConsumableId,boolean>={powder:false,shield:false};
const crew=loadCrew();
// Test aşaması (ELITE_TEST_MODE): her açılışta bol stok ve tam gelişmiş gemi. Değerler yalnızca alt sınırdır;
// harcadıkça azalır, sayfa yenilenince yeniden dolar.
if(ELITE_TEST_MODE){const M=5_000_000;
  for(const k of ['fire','explosive','breaker','leech','heal','powder','shield','speed','mine','compass'] as const)arsenal[k]=Math.max(arsenal[k],M);saveArsenal(arsenal);
  state.chainAmmo=Math.max(state.chainAmmo,M);state.ironAmmo=Math.max(state.ironAmmo,M);state.gold=Math.max(state.gold,M);state.pearls=Math.max(state.pearls,M);
  state.fame=Math.max(state.fame,100_000_000);state.battlePoints=Math.max(state.battlePoints,BATTLE_RANKS[BATTLE_RANKS.length-1].sp);state.elitePoints=Math.max(state.elitePoints,200_000_000);
  for(const id of Object.keys(TALENTS) as TalentId[])crew.talents[id]=TALENTS[id].max;
  for(const id of Object.keys(OFFICERS) as OfficerId[])crew.officers[id]=OFFICER_MAX_RANK;
  crew.active=(Object.keys(OFFICERS) as OfficerId[]).filter(id=>crew.active.includes(id)).concat((Object.keys(OFFICERS) as OfficerId[]).filter(id=>!crew.active.includes(id))).slice(0,officerSlots(state.level));saveCrew(crew);}
let bonus=computeBonus(crew);
// Test aşamasında gemi her zaman yuvası kadar ağır topla dolu; top satın almak gerekmez
function fillTestCannons(){if(!ELITE_TEST_MODE)return;for(const k of Object.keys(mountedCannons) as CannonKind[]){cannonInventory[k]+=k==='heavy'?Math.max(0,mountedCannons[k]-cannonCapacity()):mountedCannons[k];mountedCannons[k]=0;}mountedCannons.heavy=cannonCapacity();cannonInventory.heavy=Math.max(cannonInventory.heavy,5000);state.cannonType='heavy';state.cannon=mountedCannonCount();}
if(!arsenal.seeded){for(const item of ['fire','breaker','shield','mine'] as QuickItemId[]){const row=QUICK_ITEMS[item].category==='ammo'?0:AMMO_ROW;if(quickSlots.includes(item))continue;for(let i=row;i<row+AMMO_ROW;i++)if(!quickSlots[i]){quickSlots[i]=item;break;}}arsenal.seeded=true;saveArsenal(arsenal);}
// Yeni gülleler (patlayıcı, kule kırıcı, can emici) bir kez hızlı yuvalara yerleşir; yer yoksa MALZEMELER'den eklenir
if(!arsenal.seededV2){for(const item of ['explosive','breaker','leech'] as QuickItemId[]){if(quickSlots.includes(item))continue;const free=quickSlots.findIndex((v,k)=>k<AMMO_ROW&&!v);if(free>=0)quickSlots[free]=item;}arsenal.seededV2=true;saveArsenal(arsenal);}
const questProgress:Record<string,number>={...storedQuests?.progress};
const questCooldownUntil:Record<string,number>={...storedQuests?.cooldowns};
if(state.activeQuest!==null&&(questCooldownUntil[state.activeQuest]??0)>Date.now())state.activeQuest=null;
const player = { x:WORLD_WIDTH/2, y:WORLD_HEIGHT/2, angle:-Math.PI/2, speed:0, cooldown:0 };
let destination:Vec|null=null;
let routeTarget:Vec|null=null;
let selected:Target|null=null;
const camera = { x:player.x, y:player.y, zoom:.7, targetZoom:.7 };
// Serbest bakış: oyuncu haritayı sürükleyince ya da mini haritada gezinince kamera bu noktaya bakar
let freeLook:Vec|null=null;
function lookAt(x:number,y:number,snap=false){freeLook={x:clamp(x,0,WORLD_WIDTH),y:clamp(y,0,WORLD_HEIGHT)};if(snap){camera.x=freeLook.x;camera.y=freeLook.y;}}
const shots:Shot[]=[]; const enemies:Enemy[]=[];
const salvoQueue:SalvoRound[]=[];
const particles:Particle[]=[];
const WORLD_STORAGE='yedi-deniz-world-v2';
let currentMap:MapKey=(()=>{try{const k=(storedAccount?.currentMap||localStorage.getItem(WORLD_STORAGE)) as MapKey|null;if(k&&k in MAPS&&tierOf(k)<=state.level)return k;}catch{}return'1/1';})();
// Büyük Kuşatma sürerken (siege dolu) deniz Kara Kale'ye dönüşür; currentMap oyuncunun geldiği deniz olarak kalır.
let siege:SiegeSave|null=null,siegeOrigin:{map:MapKey;x:number;y:number}|null=null;
const SIEGE_MAP:MapDef={...MAPS['7/1'],name:'Kara Kale',description:'Büyük Kuşatma: bütün kaptanlar birlikte Kara Kale\'ye saldırır.',safe:false,npcs:[],npcCount:0,heavyShare:0,islands:[],labels:[],fleet:{x:3000,y:1800,name:'Kara Kale'},spawn:{x:3000,y:2850}};
// Kuşatma gemileri normal haritanın boş NPC listesinden bağımsızdır.
const SIEGE_COMMANDER:BossDef={...bossFor('8/2'),name:'Kara Kale Komutanı'};
const SIEGE_GUARD:NpcDef={...NPCS['n8-2-heavy'],name:'Kara Kale Muhafızı'};
// Deniz Hakimiyeti maçı sürerken (dom dolu) deniz boş bir savaş alanına dönüşür (ada ve filo adası yok); currentMap geldiğin deniz olarak kalır.
let dom:DomRun|null=null,domOrigin:{x:number;y:number}|null=null;
const DOM_MAP:MapDef={...MAPS['4/1'],name:'Deniz Hakimiyeti',description:'3’e 3 takım savaşı',safe:false,npcs:[],npcCount:0,heavyShare:0,islands:[],labels:[],spawn:DOM_BASE.r};
// Lanetli Sular maçı sürerken (ls dolu) deniz adasız karanlık bir savaş alanıdır; herkes eşit gemiyle
let ls:LsRun|null=null,lsOrigin:{x:number;y:number}|null=null;
const LS_MAP:MapDef={...MAPS['7/1'],name:'Lanetli Sular',description:'Hayatta kalma',safe:false,npcs:[],npcCount:0,heavyShare:0,islands:[],labels:[],spawn:{x:3000,y:2000}};
const mapDef=()=>siege?SIEGE_MAP:dom?DOM_MAP:ls?LS_MAP:MAPS[currentMap];
const isAlly=(o:Target|Vec)=>(!!siege&&(o as Enemy).kind==='ship'&&!!(o as Enemy).captain)||(!!dom&&!!(o as Enemy).remote?.tm&&(o as Enemy).remote!.tm===dom.team);
const theme=()=>THEMES[mapDef().tier];
const hasFleetIsland=()=>!dom&&!ls&&mapDef().tier>=2;
// Canavarlar oyundan kaldırıldı: haritalarda canavar doğmaz
const lootChests:LootChest[]=[];
const SPARKLE_COUNT=12,SPARKLE_PICKUP=40,SPARKLE_RESPAWN=4;
const sparkles:{sid?:number;x:number;y:number;seed:number;born:number}[]=[];
const sparkleQueue:number[]=[];
const abilityTimers:Record<AbilityId,{active:number;cooldown:number}>={speed:{active:0,cooldown:0},mine:{active:0,cooldown:0}};
const mines:{x:number;y:number;life:number;arm:number}[]=[];
const abilityActive=(id:AbilityId)=>abilityTimers[id].active>0;
let glintClock=0;
// Korsan Öfkesi (src/rage.ts): bütün gemilerin ortak etkin yeteneği
const rage=newRage();let rageEmber=0,playerHitClock=99;
const abilityQueue:{t:number;fn:()=>void}[]=[];
const eliteEnabled=()=>activeShip!=='starter';
const eliteShip=()=>eliteById(activeEliteShip);
const earnedEliteLevel=()=>ELITE_TEST_MODE?15:elitePurchased?eliteLevelFromEp(state.elitePoints):0;
const eliteBonus=()=>cumulativeEliteBonus(earnedEliteLevel());
// Elit ilerlemesi tasarımdan bağımsızdır; kaptan ve gövde seviyesi +2.500 can verir.
const baseMaxHp=()=>playerBaseHp(state.level,upgrades.hull);
// Oyuncu–oyuncu savaşında bu geminin hasar bütçesi (en az 20 sn'de batırılabilir)
const playerPvp:PvpBudget={pool:Infinity,t:0};
const effectiveMaxHp=()=>ls?LS_HP:Math.round(state.maxHp*(1+equipBonus().hp+achBonus().hp+eliteBonus().hp));
if(!Number.isFinite(state.hp)||state.hp>effectiveMaxHp())state.hp=effectiveMaxHp();
let driftClock=0;
let collisionNotice=0;
const islands:WorldIsland[]=[];
let jumpPrompt:{dir:Dir;to:MapKey}|null=null;
const fleetOwners=loadFleetOwners();
// Çevrim içi (VPS) adalar paylaşılır: sahibi sunucudan gelir. Bağlantı yoksa eski yerel kayıt kullanılır.
const islandNet:Partial<Record<MapKey,NetIsland>>={};
const myGuildId=()=>cloudGuild?.info.id??0;
const netIsland=(key:MapKey)=>sharedBosses()?islandNet[key]:undefined;
const fleetOwner=(key?:MapKey)=>{if(!key&&siege)return'npc';const k=key??currentMap,n=netIsland(k);if(n)return n.guild&&n.guild===myGuildId()?'player':'npc';if(session.account)return'npc';return fleetOwners[k]??'npc';};
const ownTowers:{x:number;y:number;cooldown:number;slot:number;type:TowerType}[]=[];
let guild:Guild|null=loadGuild();
let buildType:TowerType='cannon';
let focusedFoundation:string|null=null;
const profile=loadProfile();
const chat=setupChat(()=>({nick:profile.nick,tag:guild?.tag??null,adm:session.isAdmin}),(tab,who,text)=>{const g=/^\/git\s+(\d\/\d)$/i.exec(text.trim());if(session.isAdmin&&g){adminTeleport(g[1]);return;}if(tab==='global')sendChat({nick:who,text,at:Date.now()});},(nick,why)=>{if(!session.account){toast('Bildirim için giriş yapmalısın');return;}sendReport(nick,why);});
function escapeHtml(t:string){return t.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
// HUD 10 Hz güncellenir; DOM yalnız içerik değişince yazılır (her karede yeniden kurmak donmaya yol açıyordu)
const towerRuins=loadRuins();
let eventPanelClock=0,towersDestroyedHere=0,uiClock=0,eventPanelHtml='',combatTargetsHtml='',combatTargetsTop='';
let mapFade=0;

// Retina ekranlarda çizim yoğunluğu 1,5× ile sınırlı: piksel yükü 2×'e göre %44 daha az, görüntü yine keskin
// Çözünürlük: cihaz piksel oranı (telefonlarda 2–3) en çok 2,5'e kadar kullanılır, toplam piksel ~2,4 milyonla sınırlanır;
// küçük ekranlı telefonlarda keskin, büyük masaüstü ekranlarda yine hızlı kalır.
// Uyarlanır çözünürlük: oyun akıcı değilse (FPS < 45) tavan 2,5 → 2 → 1,5'e iner; telefon güçlüyse keskin kalır.
let dprCap=2.5,fpsFrames=0,fpsClock=0,slowChecks=0;
// Ayarlar → Görüntü kalitesi: Otomatik (uyarlanır), Yüksek (her zaman en keskin), Pil tasarrufu (1,5×)
const qualityCap=()=>settings.quality==='high'?3:settings.quality==='saver'?1.5:dprCap;
function watchFps(dt:number){fpsFrames++;fpsClock+=dt;if(fpsClock<2)return;const fps=fpsFrames/fpsClock;fpsFrames=0;fpsClock=0;
  if(settings.quality==='auto'&&fps<45&&dprCap>1.5&&Math.min(devicePixelRatio,dprCap)>1.5){if(++slowChecks>=2){dprCap=Math.max(1.5,dprCap-.5);slowChecks=0;resize();}}else slowChecks=0;}
function resize(){ const d=Math.max(1,Math.min(devicePixelRatio,qualityCap(),settings.quality==='high'?99:Math.sqrt(2_400_000/(innerWidth*innerHeight)))); canvas.width=innerWidth*d; canvas.height=innerHeight*d; ctx.setTransform(d,0,0,d,0,0);
  // Boyut değişince ayarlar sıfırlanır: büyük görseller küçültülürken yüksek kaliteli yumuşatma (daha keskin gemi/ada)
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high'; }
addEventListener('resize',resize);
const settings=loadSettings();setAudio(settings.sound,settings.volume,settings.music);
resize();
let rebinding:ActionId|null=null;
const held=(action:ActionId,...extra:string[])=>keys.has(settings.binds[action])||extra.some(k=>keys.has(k));
function closeAllOverlays(){ui('menuOverlay').classList.remove('open');closeMentorship();closePearlShop();closeWorldMap();closeQuestLog();closeEliteShips();closeShipMenu();closeMarket();closeCaptainProfile();closeDevelopment();closeCrew();closeGuild();closeSettings();closeLoadout();}
function runAction(action:ActionId){
  if(action==='attack')toggleAttack();else if(action==='rage')activateRage();else if(action==='recenter')recenterShip();
  else if(action==='jump')useJump();else if(action==='speed')activateAbility('speed');else if(action==='shield')toggleConsumable('shield');else if(action==='mine')dropMine();else if(action==='compass')useCompass();
  else if(action==='map'){ui('worldMapOverlay').classList.contains('open')?closeWorldMap():openWorldMap();}
  else if(action==='zoomIn')setZoom(camera.targetZoom+.1);else if(action==='zoomOut')setZoom(camera.targetZoom-.1);
  else if(action.startsWith('ammo'))useQuickSlot(Number(action.slice(4))-1);else if(action.startsWith('item'))useQuickSlot(AMMO_ROW+Number(action.slice(4))-1);
}
addEventListener('keydown',e=>{
  unlockAudio();const key=normalizeKey(e);
  if(rebinding){e.preventDefault();if(key!=='escape'){for(const a of ACTIONS)if(settings.binds[a.id]===key)settings.binds[a.id]='';settings.binds[rebinding]=key;saveSettings(settings);renderQuickSlots();refreshBindHints();}rebinding=null;renderSettings();return;}
  if(e.target instanceof HTMLInputElement)return;
  // Tab: yakındaki hedefler arasında sırayla geçiş (Shift+Tab geri)
  if(e.key==='Tab'){e.preventDefault();cycleTarget(e.shiftKey?-1:1);return;}
  if(key==='enter'&&!Object.values(settings.binds).includes('enter')){e.preventDefault();chat.open();(document.getElementById('chatInput') as HTMLInputElement|null)?.focus();return;}
  keys.add(key);
  if(key==='escape'){closeAllOverlays();return;}
  if(e.repeat)return;
  const action=(Object.keys(settings.binds) as ActionId[]).find(a=>settings.binds[a]===key)??(key==='='?'zoomIn':undefined);
  if(action&&!['forward','back','left','right'].includes(action)){e.preventDefault();runAction(action);}
});
addEventListener('keyup',e=>{keys.delete(normalizeKey(e));keys.delete(e.key.toLowerCase());});
addEventListener('pointerdown',e=>{unlockAudio();if((e.target as HTMLElement).closest?.('button'))playClick();},{capture:true});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('beforeunload',saveAccount);
function worldClick(e:{clientX:number;clientY:number}){
  const world={x:(e.clientX-innerWidth/2)/camera.zoom+camera.x,y:(e.clientY-innerHeight/2)/camera.zoom+camera.y};
  if(hasFleetIsland()&&fleetOwner()==='player'&&guild){
    const f=mapDef().fleet,slots=islandSlots(guild,currentMap);
    const slot=FLEET.towers.map(([dx,dy],i)=>({x:f.x+dx,y:f.y+dy,i})).sort((a,b)=>b.y-a.y).find(t=>towerContains(world,t,!!slots[t.i]))?.i;
    if(slot!==undefined&&state.ammo==='heal'&&slots[slot]&&netIsland(currentMap)){towerHealSlot=slot;towerHealClock=0;toast(`Kaide ${slot+1}: şifa güllesiyle onarılıyor · menzilde kal`);return;}
    if(slot!==undefined){focusedFoundation=`${currentMap}:${slot}`;openGuild();document.querySelector(`[data-foundation="${focusedFoundation}"]`)?.scrollIntoView({block:'center'});toast(slots[slot]?`${TOWER_TYPES[slots[slot]!.type].name} · Kaide ${slot+1}`:`Kaide ${slot+1}: kule tipini seçip DİK düğmesine bas`);return;}
  }
  const towerHit=enemies.filter(n=>n.tower&&towerContains(world,n)).sort((a,b)=>b.y-a.y)[0];
  const hit=towerHit??enemies.filter(n=>(state.ammo==='heal'?n.kind==='ship'&&!!n.captain:!isAlly(n))&&dist(n,world)<Math.max(42,n.hitRadius??0)).sort((a,b)=>dist(a,world)-dist(b,world))[0];
  if(hit){if(hit!==selected){selected=hit;state.attacking=false;attackChase=false;ui('attack').classList.remove('active');}else if(!state.attacking)toggleAttack();}
  else{const glint=sparkles.find(g=>dist(g,world)<34);if(glint){routeTarget={x:glint.x,y:glint.y};destination=routeVia(routeTarget);attackChase=false;return;}const chest=lootChests.find(c=>dist(c,world)<CHEST_CLICK_RADIUS);routeTarget=chest?{x:chest.x,y:chest.y}:navigablePoint(world);destination=routeVia(routeTarget);attackChase=false;}
}
// Harita gezinme: sol tuşa basılı tutup sürükleyince kamera gemiden ayrılır (✥ ile geri döner);
// sürüklemeden bırakılan tık, hedef seçimi/rota olarak işlenir.
// Dokunmatik ekranda iki parmakla sıkıştırınca yakınlaştırma/uzaklaştırma; ikinci parmak değince dokunuş tık sayılmaz.
{let press:{x:number;y:number;cx:number;cy:number;id:number}|null=null,panning=false,pinch:{d:number;z:number}|null=null;
  const touches=new Map<number,{x:number;y:number}>();
  const spread=()=>{const [a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1;};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;
    if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){press=null;panning=false;canvas.classList.remove('panning');pinch={d:spread(),z:camera.targetZoom};return;}if(touches.size>2)return;}
    press={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,id:e.pointerId};panning=false;});
  canvas.addEventListener('pointermove',e=>{const t=touches.get(e.pointerId);if(t){t.x=e.clientX;t.y=e.clientY;if(pinch&&touches.size>=2){setZoom(pinch.z*spread()/pinch.d);return;}}
    if(!press||e.pointerId!==press.id)return;const dx=e.clientX-press.x,dy=e.clientY-press.y;
    if(!panning&&Math.hypot(dx,dy)>(e.pointerType==='touch'?14:8)){panning=true;try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.classList.add('panning');}
    if(panning)lookAt(press.cx-dx/camera.zoom,press.cy-dy/camera.zoom,true);});
  const end=(e:PointerEvent)=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;if(!press||e.pointerId!==press.id)return;const was=panning;press=null;panning=false;canvas.classList.remove('panning');if(!was&&e.type==='pointerup')worldClick(e);};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);}

// Mini harita: tıklayıp sürükleyerek haritada gezinme (görüş penceresi o noktaya taşınır)
{let down=false;const at=(e:PointerEvent)=>{const r=minimap.getBoundingClientRect();lookAt((e.clientX-r.left)/r.width*WORLD_WIDTH,(e.clientY-r.top)/r.height*WORLD_HEIGHT,true);};
  minimap.addEventListener('pointerdown',e=>{down=true;try{minimap.setPointerCapture(e.pointerId);}catch{}at(e);});
  minimap.addEventListener('pointermove',e=>{if(down)at(e);});
  const up=()=>{down=false;};minimap.addEventListener('pointerup',up);minimap.addEventListener('pointercancel',up);}
ui('attack').onclick=toggleAttack;
// Küçük ekranlar (telefon, tablet): arayüz en az 1180 × 640'lık sanal bir alana göre dizilip orantılı küçültülür.
// Böylece telefonda da masaüstündeki yerleşim korunur; ölçek --ui değişkeniyle CSS'e verilir (bkz. .hud, .chat).
let uiScale=1;
// Dokunmatik ekranlarda (telefon) sanal alan 880 × 480: yazılar ve düğmeler parmakla okunup basılabilecek boyda kalır.
// Web ve mobil aynı HUD düzenini kullanır (sol altta gülle düğmesi, soldaki hedef listesi, aynı çerçeveler)
const MOBILE_HUD=true;
function fitHud(){const [vw,vh]=MOBILE_HUD?[880,480]:[1180,640];uiScale=Math.max(.5,Math.min(1,innerWidth/vw,innerHeight/vh));document.documentElement.style.setProperty('--ui',String(uiScale));document.documentElement.classList.toggle('touch',MOBILE_HUD);}
fitHud();
// Günün etkinliği: mini haritada dünya ikonunun yanında kısa rozet (ör. "İnci ×2"); tıklayınca haftalık takvim açılır
const DAY_SHORT:Record<string,string>={sp:'SP ×2',tp:'TP +%50',ep:'EP +%50',boss:'Boss ×2',gold:'Altın +%50',pearl:'İnci ×2',siege:'Kuşatma'};
const dayEventEl=document.createElement('button');dayEventEl.className='day-badge';dayEventEl.type='button';document.querySelector('.map-cluster')!.append(dayEventEl);
const dayPop=document.createElement('div');dayPop.className='day-pop';document.querySelector('.map-cluster')!.append(dayPop);
dayEventEl.onclick=e=>{e.stopPropagation();renderDayPop();dayPop.classList.toggle('open');};
addEventListener('pointerdown',e=>{if(!dayPop.contains(e.target as Node)&&e.target!==dayEventEl)dayPop.classList.remove('open');});
let dayEventText='';
function renderDayPop(){const today=dayEvent()?.id,w=siegeWindow(),join=w.open||ELITE_TEST_MODE;
  dayPop.innerHTML=`<h4>HAFTALIK ETKİNLİKLER</h4><ul>${[1,2,3,4,5,6,0].map(d=>{const ev=dayEvent(new Date(2026,9,4+d));return ev?`<li class="${ev.id===today?'on':''}"><b>${ev.day}</b><span>${ev.name}</span><small>${ev.desc}</small></li>`:'';}).join('')}</ul>${join?`<button data-siege-join>${w.open?'KUŞATMAYA KATIL':'TEST · KUŞATMA'}</button>`:''}<button data-dom-join>⚔ ARENA</button>`;
  {const d=dayPop.querySelector('[data-dom-join]') as HTMLButtonElement|null;if(d)d.onclick=()=>{dayPop.classList.remove('open');openArenaModes();};}
  const b=dayPop.querySelector('[data-siege-join]') as HTMLButtonElement|null;if(b)b.onclick=()=>{dayPop.classList.remove('open');enterSiege();};}
function renderDayEvent(force=false){const ev=dayEvent(),w=siegeWindow();
  const t=ev?`${DAY_SHORT[ev.id]}${ev.id==='siege'&&w.open?' · AÇIK':''}`:'Etkinlik';
  if(t===dayEventText&&!force)return;dayEventText=t;dayEventEl.textContent=t;dayEventEl.classList.toggle('on',!!ev);dayEventEl.classList.toggle('live',ev?.id==='siege'&&w.open);
  dayEventEl.title=ev?`${ev.day} · ${ev.name}: ${ev.desc}`:'Haftalık etkinlikler';}
setInterval(renderDayEvent,15000);
// Telefonda ekran yatay açılır: ilk dokunuşta tam ekrana geçip yönü yataya kilitler (Android). iPhone Safari kilidi desteklemez.
{const lock=()=>{const o=screen.orientation as ScreenOrientation&{lock?:(o:string)=>Promise<void>};if(!matchMedia('(pointer:coarse)').matches||!o?.lock)return;
  const go=()=>o.lock!('landscape').catch(()=>{});if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen({navigationUI:'hide'}).then(go,go);else go();};
  addEventListener('pointerdown',lock,{once:true});}
// HUD çerçeveleri: alt bar (HP/SP), gülle çerçevesi ve malzeme çerçevesi. Her biri kendi tutamağından tek başına taşınır.
// Bir çerçeve başka bir çerçevenin kenarına yaklaştırılıp bırakılınca ona yapışır ve grup olur; alt bar tutulup taşınınca
// ona bağlı tüm çerçeveler birlikte gelir. Gülle/malzeme çerçevesi tek tutulunca gruptan ayrılır (ona bağlı olanlar yerinde
// kalır ve bir üstteki çerçeveye bağlanır). Ekranın sol/sağ kenarına bırakılan çerçeve dikey sütuna dönüşür.
// Konumlar, yönler, açık/kapalı durumu ve bağlar saklanır; tutamağa çift tık o çerçeveyi varsayılan yerine döndürür.
{type FrameId='dock'|'ammo'|'item';
  const EL:Record<FrameId,HTMLElement>={dock:document.querySelector('.hud-dock') as HTMLElement,ammo:ui('ammoBar'),item:ui('itemBar')};
  // gülle/malzeme çerçevesi tutamaktan ya da yuvalar dışındaki kenarından tutulur
  const GRIP:Record<FrameId,HTMLElement>={dock:EL.dock.querySelector('.dock-status') as HTMLElement,ammo:EL.ammo,item:EL.item};
  const IDS:FrameId[]=['dock','ammo','item'],DEFAULT_LINK:Record<FrameId,FrameId|null>={dock:null,ammo:'dock',item:'ammo'};
  const POS=(id:FrameId)=>id==='dock'?'yedi-deniz-dock-pos':`yedi-deniz-bar-${id}`,LINKS='yedi-deniz-frame-links',EDGE=90,SNAP=26,GAP=2;
  let link:Record<FrameId,FrameId|null>={...DEFAULT_LINK};
  try{const l=JSON.parse(localStorage.getItem(LINKS)||'null');if(l)link={dock:null,ammo:l.ammo??null,item:l.item??null};}catch{}
  const rect=(id:FrameId)=>EL[id].getBoundingClientRect();
  // x,y ekran pikseli; çerçevenin kendi konumu ölçeklenmiş arayüz pikselinde saklanır (uiScale)
  const place=(id:FrameId,x:number,y:number)=>{const e=EL[id],w=e.offsetWidth,h=e.offsetHeight,k=uiScale;e.classList.add('moved');e.style.left=`${clamp(x/k,0,Math.max(0,innerWidth/k-w))}px`;e.style.top=`${clamp(y/k,0,Math.max(0,innerHeight/k-h))}px`;};
  const kids=(id:FrameId)=>IDS.filter(k=>link[k]===id);
  const tree=(id:FrameId):FrameId[]=>kids(id).flatMap(k=>[k,...tree(k)]);
  const save=()=>{try{for(const id of IDS){const e=EL[id];localStorage.setItem(POS(id),JSON.stringify({x:e.classList.contains('moved')?parseFloat(e.style.left):null,y:parseFloat(e.style.top),v:e.classList.contains('vertical'),c:e.classList.contains('collapsed')}));}localStorage.setItem(LINKS,JSON.stringify(link));}catch{}};
  // kenara bırakılan çerçeve dikey, ortaya bırakılan yatay olur (yalnız gülle/malzeme)
  const orient=(id:FrameId)=>{if(id==='dock')return;const e=EL[id],r=rect(id),v=r.left<EDGE||r.right>innerWidth-EDGE;if(v===e.classList.contains('vertical'))return;const cx=r.left+r.width/2,cy=r.top+r.height/2;e.classList.toggle('vertical',v);
    const n=rect(id);place(id,r.left<EDGE?r.left:r.right>innerWidth-EDGE?r.right-n.width:cx-n.width/2,cy-n.height/2);};
  // en yakın kenara yapış: alt/üst kenara (ortalanarak) ya da sol/sağ kenara (üstleri hizalı)
  const snap=(id:FrameId)=>{const r=rect(id);let best:{d:number;to:FrameId;x:number;y:number}|null=null;
    for(const t of IDS){if(t===id)continue;const q=rect(t),hOver=Math.min(r.right,q.right)-Math.max(r.left,q.left),vOver=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top),cx=q.left+q.width/2-r.width/2;
      const opts:[number,number,number,boolean][]=[[Math.abs(r.top-q.bottom),cx,q.bottom+GAP,hOver>-SNAP],[Math.abs(r.bottom-q.top),cx,q.top-r.height-GAP,hOver>-SNAP],[Math.abs(r.left-q.right),q.right+GAP,q.top,vOver>-SNAP],[Math.abs(r.right-q.left),q.left-r.width-GAP,q.top,vOver>-SNAP]];
      for(const [d,x,y,ok] of opts)if(ok&&d<SNAP&&(!best||d<best.d))best={d,to:t,x,y};}
    if(best){place(id,best.x,best.y);link[id]=best.to;}};
  for(const id of IDS){try{const p=JSON.parse(localStorage.getItem(POS(id))||'null');if(p){if(id!=='dock'){EL[id].classList.toggle('vertical',!!p.v);EL[id].classList.toggle('collapsed',!!p.c);}if(p.x!=null&&Number.isFinite(p.x))requestAnimationFrame(()=>place(id,p.x*uiScale,p.y*uiScale));}}catch{}}
  for(const id of ['ammo','item'] as FrameId[])(EL[id].querySelector('.bar-toggle') as HTMLElement).onclick=()=>{EL[id].classList.toggle('collapsed');closeAmmoPicker();save();};
  let drag:{id:FrameId;dx:number;dy:number;group:{id:FrameId;ox:number;oy:number}[]}|null=null;
  for(const id of IDS){const grip=GRIP[id];
    // dokunmatikte parmak çoğu zaman yuvaya denk gelir: yuva/düğme üstünde 0,35 sn basılı tutunca da sürükleme başlar
    let hold=0,holdAt:{x:number;y:number}|null=null,eatClick=false;
    grip.addEventListener('pointerdown',e=>{if((e.target as HTMLElement).closest('button')){if(e.pointerType!=='touch')return;holdAt={x:e.clientX,y:e.clientY};clearTimeout(hold);
        hold=window.setTimeout(()=>{if(!holdAt)return;eatClick=true;startDrag(e);navigator.vibrate?.(15);},350);return;}
      startDrag(e);});
    grip.addEventListener('pointermove',e=>{if(holdAt&&Math.hypot(e.clientX-holdAt.x,e.clientY-holdAt.y)>10){holdAt=null;clearTimeout(hold);}});
    for(const t of ['pointerup','pointercancel'])grip.addEventListener(t,()=>{holdAt=null;clearTimeout(hold);});
    grip.addEventListener('click',e=>{if(eatClick){eatClick=false;e.stopPropagation();e.preventDefault();}},true);
    const startDrag=(e:PointerEvent)=>{const r=rect(id);closeAmmoPicker();
      // tek tutulan gülle/malzeme çerçevesi gruptan ayrılır; ona bağlı olanlar bir üstteki çerçeveye geçer
      if(id!=='dock'){for(const k of kids(id))link[k]=link[id];link[id]=null;}
      const group=id==='dock'?tree('dock').map(k=>{const q=rect(k);return{id:k,ox:q.left-r.left,oy:q.top-r.top};}):[];
      for(const g of group)place(g.id,r.left+g.ox,r.top+g.oy);
      drag={id,dx:e.clientX-r.left,dy:e.clientY-r.top,group};try{grip.setPointerCapture(e.pointerId);}catch{}EL[id].classList.add('dragging');grip.classList.add('dragging');};
    // grup taşınırken tüm grubun kutusu ekranda kalacak şekilde sınırlanır (çerçeveler üst üste binmez)
    grip.addEventListener('pointermove',e=>{if(!drag||drag.id!==id)return;const k=uiScale,w=EL[id].offsetWidth*k,h=EL[id].offsetHeight*k;let x0=0,y0=0,x1=w,y1=h;
      for(const g of drag.group){x0=Math.min(x0,g.ox);y0=Math.min(y0,g.oy);x1=Math.max(x1,g.ox+EL[g.id].offsetWidth*k);y1=Math.max(y1,g.oy+EL[g.id].offsetHeight*k);}
      const x=clamp(e.clientX-drag.dx,-x0,Math.max(-x0,innerWidth-x1)),y=clamp(e.clientY-drag.dy,-y0,Math.max(-y0,innerHeight-y1));
      place(id,x,y);for(const g of drag.group)place(g.id,x+g.ox,y+g.oy);});
    const stop=()=>{if(!drag||drag.id!==id)return;drag=null;EL[id].classList.remove('dragging');grip.classList.remove('dragging');if(id!=='dock'){orient(id);snap(id);}save();};
    grip.addEventListener('pointerup',stop);grip.addEventListener('pointercancel',stop);
    grip.addEventListener('dblclick',e=>{if((e.target as HTMLElement).closest('button'))return;const el=EL[id];el.classList.remove('moved','vertical');el.style.left='';el.style.top='';link[id]=DEFAULT_LINK[id];
      if(id==='dock')for(const k of tree('dock')){EL[k].classList.remove('moved','vertical');EL[k].style.left='';EL[k].style.top='';}save();});}
  addEventListener('resize',()=>{fitHud();for(const id of IDS)if(EL[id].classList.contains('moved'))place(id,parseFloat(EL[id].style.left)*uiScale,parseFloat(EL[id].style.top)*uiScale);});}
ui('ability-speed').onclick=()=>activateAbility('speed');ui('ability-mine').onclick=dropMine;ui('rageButton').onclick=activateRage;
function recenterShip(){freeLook=null;camera.x=player.x;camera.y=player.y;toast('Kamera gemiye ortalandı');}
ui('recenterShip').onclick=recenterShip;{// Üst çerçeve: solda casus, ortada seviye + TP + HP + SP; koordinata git mini haritanın üstünde. Orta bar kaldırıldı:
  // EP tersanedeki elit ilerleme çubuğunda gösterilir.
  const top=ui('topStatus'),stats=document.createElement('div');stats.className='strip-stats';
  const xp=top.querySelector('.xp-line'),hp=document.querySelector('.hud-dock .hp-line'),sp=document.querySelector('.hud-dock .battle-line');
  stats.append(ui('level'));if(xp)stats.append(xp);if(hp)stats.append(hp);if(sp)stats.append(sp);ui('spyGo').after(stats);top.classList.add('retired');
  // Koordinata git: bilgisayarda mini haritanın üstünde; telefonda küçülen mini harita kümesinin dışında, tam boyutta (parmakla dokunulabilir)
  const cluster=document.querySelector('.map-cluster')!,placeCoord=()=>{const go=ui('coordGo'),host=innerWidth<=700?document.querySelector('.hud')!:cluster;if(go.parentElement!==host)host.prepend(go);};
  placeCoord();addEventListener('resize',placeCoord);
  const arena=document.createElement('button');arena.className='world-map-button arena-button';arena.setAttribute('aria-label','Arena');arena.innerHTML='<img src="/assets/arena-icon-v1.webp" alt="" draggable="false"/><span>ARENA</span>';
  arena.onclick=()=>openArenaModes();cluster.append(arena);}
  // Altın ve inci: üst çerçeveden alınıp mağaza/tersane sekmelerinin sol başına (menü açıkken görünür)
  {const res=document.querySelector('.strip-res');if(res){res.classList.add('tabs-res');ui('shopTabs').prepend(res);}}{const rc=ui('recenterShip');rc.className='combat-action recenter-btn';rc.innerHTML='<b><svg viewBox="0 0 48 48" width="70%" height="70%" aria-hidden="true"><g fill="none" stroke="#ffe09b" stroke-width="3" stroke-linecap="round"><circle cx="24" cy="24" r="12"/><circle cx="24" cy="24" r="4" fill="#ffe09b"/><path d="M24 4v40M4 24h40M9.9 9.9l28.2 28.2M38.1 9.9 9.9 38.1"/></g><g fill="#ffe09b"><circle cx="24" cy="4" r="2.6"/><circle cx="24" cy="44" r="2.6"/><circle cx="4" cy="24" r="2.6"/><circle cx="44" cy="24" r="2.6"/><circle cx="9.9" cy="9.9" r="2.6"/><circle cx="38.1" cy="38.1" r="2.6"/><circle cx="38.1" cy="9.9" r="2.6"/><circle cx="9.9" cy="38.1" r="2.6"/></g></svg></b><span>GEMİ</span>';rc.title='Gemiyi ortala';ui('combatControls').appendChild(rc);}
ui('openWorldMap').onclick=openWorldMap;ui('closeWorldMap').onclick=closeWorldMap;
ui('worldMapOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('worldMapOverlay'))closeWorldMap();});
ui('openCaptain').onclick=openCaptainProfile;
ui('closeCaptain').onclick=closeCaptainProfile;
ui('openGuild').onclick=openGuild;ui('closeGuild').onclick=closeGuild;ui('guildOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('guildOverlay'))closeGuild();});
ui('openCrew').onclick=openCrew;ui('closeCrew').onclick=closeCrew;ui('crewOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('crewOverlay'))closeCrew();});
ui('openLog').onclick=openLogbook;ui('closeLog').onclick=closeLogbook;ui('logOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('logOverlay'))closeLogbook();});
ui('openRanks').onclick=openRanks;ui('closeRanks').onclick=closeRanks;ui('rankOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('rankOverlay'))closeRanks();});
ui('openCoupon').onclick=openCoupon;ui('closeCoupon').onclick=closeCoupon;ui('couponOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('couponOverlay'))closeCoupon();});
ui('couponRedeem').onclick=redeemCoupon;ui('couponInput').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')redeemCoupon();});
ui('openSettings').onclick=openSettings;ui('openMentorship').onclick=openMentorship;ui('closeMentorship').onclick=closeMentorship;ui('mentorOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('mentorOverlay'))closeMentorship();});ui('closeSettings').onclick=closeSettings;ui('settingsOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('settingsOverlay'))closeSettings();});
ui('captainOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('captainOverlay'))closeCaptainProfile();});
ui('zoomOut').onclick=()=>setZoom(camera.targetZoom-.1);
ui('zoomIn').onclick=()=>setZoom(camera.targetZoom+.1);
ui('openQuests').onclick=openQuestLog;
ui('openQuestTop').onclick=openQuestLog;
ui('closeQuests').onclick=closeQuestLog;
ui('questOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('questOverlay'))closeQuestLog();});
ui('openEliteShips').onclick=openEliteShips;ui('openShip').onclick=openShipMenu;

ui('digPrompt').onclick=startDig;ui('openDaily').onclick=openDaily;ui('closeDaily').onclick=closeDaily;ui('dailyOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('dailyOverlay'))closeDaily();});ui('equipShopOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('equipShopOverlay'))closeEquipShop();});ui('cannonShopOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('cannonShopOverlay'))closeCannonShop();});
ui('shipOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('shipOverlay'))closeShipMenu();});
ui('openDevelopment').onclick=openDevelopment;
ui('closeDevelopment').onclick=closeDevelopment;
ui('developmentOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('developmentOverlay'))closeDevelopment();});
ui('openMarket').onclick=openMarket;

ui('marketOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('marketOverlay'))closeMarket();});
ui('supplyOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('supplyOverlay'))closeSupply();});
// Tab yakındaki rakipleri sırayla işaretler (yakından uzağa)
function cycleTarget(dir:number){
  const reach=Math.max(900,effectiveRange()*1.6);
  const list:Target[]=enemies.filter(t=>targetExists(t)&&Math.hypot(t.x-player.x,t.y-player.y)<=reach)
    .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
  if(!list.length)return;
  const i=selected?list.indexOf(selected):-1;
  const next=i<0?list[0]:list[(i+dir+list.length)%list.length];
  if(next!==selected){selected=next;attackChase=false;updateUI();}
}
// Fare tekerleği haritayı yakınlaştırır / uzaklaştırır (yalnızca masaüstü; dokunmatikte tekerlek yok)
canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(camera.targetZoom+(e.deltaY<0?.1:-.1));},{passive:false});
ui('closeLoadout').onclick=closeLoadout;
ui('loadoutOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('loadoutOverlay'))closeLoadout();});
// Sağ üst: market (sekmeli gemi/top/mühimmat pencereleri) ve menü (profil, filo, geliştirme, tayfa, ayarlar)
const SHOP_OVERLAYS=['eliteShipOverlay','equipShopOverlay','cannonShopOverlay','shipOverlay','marketOverlay','supplyOverlay','auctionOverlay','pearlShopOverlay'];
// Shared frame and one persistent close control for all six shop sections.
SHOP_OVERLAYS.forEach(id=>{ui(id).classList.add('shop-overlay');ui(id).querySelector('section')!.classList.add('shop-window');});
const SHOP_OPEN:Record<string,()=>void>={eliteShipOverlay:openEliteShips,equipShopOverlay:openEquipShop,cannonShopOverlay:openCannonShop,shipOverlay:openShipMenu,marketOverlay:openMarket,supplyOverlay:openSupply,auctionOverlay:openAuction,pearlShopOverlay:openPearlShop};
let lastShop='marketOverlay';
function closeShops(){closeAuction();closePearlShop();closeEliteShips();closeEquipShop();closeCannonShop();closeShipMenu();closeMarket();closeSupply();closeLoadout();closeBuy();}
function showShop(id:string){closeShops();closeMenu();lastShop=id;SHOP_OPEN[id]();}
function syncShopTabs(){const open=SHOP_OVERLAYS.find(id=>ui(id).classList.contains('open'));ui('shopTabs').classList.toggle('open',!!open);document.body.classList.toggle('shop-open',!!open);
  document.querySelectorAll<HTMLButtonElement>('#shopTabs [data-shop]').forEach(b=>b.classList.toggle('active',b.dataset.shop===open));}
const shopWatch=new MutationObserver(syncShopTabs);SHOP_OVERLAYS.forEach(id=>shopWatch.observe(ui(id),{attributes:true,attributeFilter:['class']}));
document.querySelectorAll<HTMLButtonElement>('#shopTabs [data-shop]').forEach(b=>b.onclick=()=>showShop(b.dataset.shop!));
// Koordinata git: 55 AN → o hücrenin ortasına rota çizilir
{const col=ui('goCol') as HTMLInputElement,row=ui('goRow') as HTMLInputElement;
  col.oninput=()=>{col.value=col.value.replace(/\D/g,'').slice(0,2);if(col.value.length===2)row.focus();};
  row.oninput=()=>{row.value=row.value.toLocaleUpperCase('tr-TR').replace(/İ/g,'I').replace(/[^A-Z]/g,'').slice(0,2);};
  for(const el of [col,row])el.addEventListener('keydown',e=>{e.stopPropagation();});
  ui('coordGo').onsubmit=e=>{e.preventDefault();const c=Number(col.value),r=row.value;
    const ri=r.length===2?(r.charCodeAt(0)-65)*26+(r.charCodeAt(1)-65):-1;
    if(col.value===''||!(c>=0&&c<GRID_COLS)||!(ri>=0&&ri<GRID_ROWS)){toast(`Geçersiz koordinat · sütun 00–${GRID_COLS-1}, satır AA–${rowName(GRID_ROWS-1)}`);return;}
    routeTarget=navigablePoint({x:(c+.5)*CELL_W,y:(ri+.5)*CELL_H});destination=routeVia(routeTarget);attackChase=false;
    toast(`Rota: ${colName(c)} ${rowName(ri)}`);(document.activeElement as HTMLElement|null)?.blur();};}
// ---------------------------------------------------------------- Çevrim içi deniz
const NET_ELITES=new Set(Object.keys(ELITE_DIR16));
function remoteOf(id:string){return enemies.find(e=>e.remote?.id===id);}
function applyIslandSlots(k:MapKey){const n=islandNet[k];if(n&&guild&&n.guild===myGuildId())applyIsland(n);}
// Ada bilgisi gelince kendi filonun adasıysa filo paneline (kule canları, yıkık kaideler) işlenir
function applyIsland(n:NetIsland){const k=n.key as MapKey;islandNet[k]=n;
  if(guild&&n.guild&&n.guild===myGuildId()){guild.towers[k]=n.towers.map(t=>t?{type:'cannon' as TowerType,hp:t[0],maxHp:t[1]}:null);towerRuins[k]=Object.fromEntries(Object.entries(n.ruins).map(([a,b])=>[Number(a),b]));}
  else if(guild&&guild.towers[k])delete guild.towers[k];
  if(k===currentMap&&!siege){enemies.splice(0,enemies.length,...enemies.filter(e=>!e.tower));if(selected&&(selected as Enemy).tower){selected=null;state.attacking=false;}setupFleetIsland();}
  if(ui('guildOverlay').classList.contains('open'))renderGuild();}
const netHandlers:NetHandlers={
  siegeState:d=>applySiegeState(d),
  siegeHp:list=>{if(siege&&siegeOnline)siegeApplyHp(list);},
  siegeDown:i=>{if(!siege||!siegeOnline)return;const e=enemies.find(x=>x.siege&&siegePiece(x)===i);if(e){e.serverDown=true;sinkEnemy(e);}},
  siegeRank:d=>{if(!siege||!siegeOnline)return;SIEGE_PARTICIPANTS=Math.max(1,d.n);siege.contrib=Object.fromEntries(d.top);siege.contrib[profile.nick]=d.mine;},
  siegeEnd:d=>{if(!siege||!siegeOnline)return;serverSiegeChest=d.chest??null;SIEGE_PARTICIPANTS=Math.max(1,d.n);siege.contrib=Object.fromEntries(d.top);siege.contrib[profile.nick]=d.mine;
    if(siege.result)return;if(d.won){const e=enemies.find(x=>x.commander);if(e){e.serverDown=true;sinkEnemy(e);return;}siege.result='won';saveSiege(siege);stopBossMusic();finishSiege(true);}
    else{siege.result='lost';saveSiege(siege);stopBossMusic();finishSiege(false);}},
  island:n=>applyIsland(n),
  towerHp:(key,list)=>{const n=islandNet[key as MapKey];if(!n)return;for(const [slot,hp] of list){const t=n.towers[slot];if(t)t[0]=hp;
    const gs=guild?.towers[key as MapKey]?.[slot];if(gs&&n.guild===myGuildId())gs.hp=hp;
    if(key===currentMap){const e=enemies.find(x=>x.tower&&!x.siege&&x.towerIndex===slot);if(e){e.hp=Math.max(1,hp);e.lastHp=e.hp;}}}},
  towerDown:(key,slot)=>{const n=islandNet[key as MapKey];if(n){n.towers[slot]=null;n.ruins[slot]=Date.now();applyIslandSlots(key as MapKey);}
    if(key!==currentMap)return;const e=enemies.find(x=>x.tower&&!x.siege&&x.towerIndex===slot);
    if(e){e.serverDown=true;const j=enemies.indexOf(e);enemies.splice(j,1);if(selected===e){selected=null;state.attacking=false;ui('attack').classList.remove('active');}burst(e.x,e.y,true);playExplosion();splashAt(e.x,e.y,190);
      const left=enemies.filter(x=>x.tower&&!x.siege).length;toast(left?`${mapDef().fleet.name}: ${left} kule kaldı`:`${mapDef().fleet.name} düştü!`);}
    else if(fleetOwner()==='player'){toast(`${mapDef().fleet.name}: ${slot+1}. kaidedeki kulen yıkıldı!`);setupFleetIsland();}},
  islandCaptured:d=>{const name=MAPS[d.key as MapKey]?.fleet.name??d.key;
    if(d.by===myNetId){const r=fleetReward(MAPS[d.key as MapKey].tier);state.gold+=r.gold;state.fame+=r.xp;saveAccount();rewardNotice(`${name} filona katıldı · +${fmt(r.gold)} altın · +${fmt(r.xp)} TP kazanıldı`,'battle',{xp:r.xp,gold:r.gold});}
    else rewardNotice(`[${d.tag}] filosu ${d.key} ${name} adasını ele geçirdi`,'battle');},
  islandAlert:key=>{toast(`⚠ ${key} ${MAPS[key as MapKey]?.fleet.name??''} adana saldırı var!`);},
  boss:b=>{if(siege||b.sea!==seaKey())return;spawnBoss(b);},
  bossHp:(id,hp)=>{const e=activeBoss();if(e?.shared!==id||hp>=e.hp)return;e.hp=Math.max(1,hp);e.lastHp=e.hp;},
  bossDown:d=>{const e=activeBoss();if(e?.shared!==d.id)return;e.share=d.share;e.shareN=d.n;e.serverDown=true;e.hp=0;sinkEnemy(e);},
  bossGone:id=>{const e=activeBoss();if(e?.shared!==id)return;enemies.splice(enemies.indexOf(e),1);if(selected===e){selected=null;state.attacking=false;ui('attack').classList.remove('active');}stopBossMusic();toast(`${e.name} sulara gömülüp kayboldu`);},
  state:(n:NetState)=>{if((siege&&!siegeOnline)||n.id===myNetId)return;let e=remoteOf(n.id);
    if(!e){if(n.nick===undefined||n.ship===undefined)return;/* kimliği bilinmeyen kaptan ilk tam mesajla görünür */
      e={kind:'ship',role:'heavy',x:n.x,y:n.y,angle:0,hp:n.hp,maxHp:n.maxHp??n.hp,cooldown:99,speed:0,damage:0,reload:99,rewardGold:0,rewardFame:0,color:'#79372f',name:n.nick,tier:8,aggro:false,wander:0,slowTimer:0,homeX:n.x,homeY:n.y,combatTimer:0,hitRadius:44,
      captain:{elite:(NET_ELITES.has(n.ship)?n.ship:'phantom') as EliteShipId,ammo:'iron',ammoClock:99,foe:null,orbit:null,orbitClock:0},remote:{id:n.id,tx:n.x,ty:n.y,vx:0,vy:0,seen:0,sp:n.sp??0,tag:n.tag??null}} as Enemy;enemies.push(e);}
    const r=e.remote!;r.tx=n.x;r.ty=n.y;r.vx=n.vx??0;r.vy=n.vy??0;r.seen=performance.now();e.hp=n.hp;e.face={east:n.east,north:n.north};e.dir16=n.d16;
    if(n.adm!==undefined)r.adm=!!n.adm;if(n.tm!==undefined)r.tm=n.tm;if(n.sp!==undefined)r.sp=n.sp;if(n.maxHp!==undefined)e.maxHp=n.maxHp;if(n.tag!==undefined)r.tag=n.tag;if(n.nick!==undefined)e.name=(r.tag?`[${r.tag}]`:'')+n.nick;
    if(n.ship!==undefined){e.remoteShip=n.ship;e.captain!.elite=(NET_ELITES.has(n.ship)?n.ship:'phantom') as EliteShipId;}},
  leave:id=>{const e=remoteOf(id);if(e){enemies.splice(enemies.indexOf(e),1);if(selected===e){selected=null;state.attacking=false;}}},
  fire:f=>{const e=remoteOf(f.from);if(!e)return;
    if(f.ammo==='heal'){healFlights.push({x:f.x,y:f.y,to:f.to,amount:f.damage,life:3,age:0});return;}const a=Math.atan2(f.ty-f.y,f.tx-f.x);muzzleFlash(f.x+Math.cos(a)*30,f.y+Math.sin(a)*30-10,a,44);playEnemyCannon(dist(e,player),(e.x-player.x)/600);
    if(f.to!==myNetId||state.invulnerable>0)return;const b=Math.atan2(player.y-f.y,player.x-f.x);
    shots.push({x:f.x,y:f.y,vx:Math.cos(b)*420,vy:Math.sin(b)*420,life:2.4,owner:'enemy',damage:f.damage,hit:false,ammo:f.ammo as AmmoKind,captain:e});},
  sunk:k=>{const e=remoteOf(k.victim);if(e){burst(e.x,e.y,true);playExplosion();splashAt(e.x,e.y,190);enemies.splice(enemies.indexOf(e),1);if(selected===e){selected=null;state.attacking=false;ui('attack').classList.remove('active');}}
    if(k.by===myNetId&&ls){ls.kills++;rewardNotice(`${k.victimNick} kaptanını lanetli sulara gömdün`,'battle');}
    else if(k.by===myNetId&&dom){gainRage(rage,RAGE_PER_RIVAL);rewardNotice(`${k.victimNick} kaptanını batırdın`,'battle');}
    else if(k.by===myNetId){gainRage(rage,RAGE_PER_RIVAL);const sp=claimRivalSp(rivalLog,k.victimNick)?gainSp(RIVAL_SP*spMult()):0;sinkNotice(k.victimNick,sp);rivalSinks++;saveRivalSinks(rivalSinks);saveAccount();}
    else if(k.victim!==myNetId)rewardNotice(`${k.byNick}, ${k.victimNick} kaptanını batırdı`,'battle');},
  spy:r=>onSpyReport(r),
  npcList:l=>onNpcList(l),npcSpawn:n=>{if(!netNpcs()||npcById(n.id))return;const e=npcFromNet(n);if(e)enemies.push(e);},npcPos:d=>onNpcPos(d),loot:d=>onLootSpots(d),mine:d=>{if(d.by!==myNetId)mines.push({x:d.x,y:d.y,life:ABILITIES.mine.duration,arm:MINE.armSeconds});},mboom:d=>onMineBoom(d.x,d.y),mhit:d=>{if(state.invulnerable>0)return;shots.push({x:player.x,y:player.y,vx:0,vy:0,life:.1,owner:'enemy',damage:d.dmg,hit:false,ammo:'iron',noHome:true});},npcShare:d=>{const e=npcById(d.id);if(e)e.share=d.share;},npcDie:id=>onNpcDie(id),
  chestReward:r=>applyLoot(r,r.kind==='gilded'?'Yaldızlı sandık':'Ahşap sandık'),
  sparkleReward:r=>applyLoot(r,'Pırıltı'),
  treasure:t=>onTreasureState(t),
  dig:d=>onDig(d),
  // Sunucu imkânsız hızı kabul etmez: gemi son geçerli konumuna döner
  pos:p=>{player.x=p.x;player.y=p.y;player.speed=0;destination=null;routeTarget=null;},
  // Sunucu ölümsüz kalan gemiyi batırır (canı hasara rağmen düşmüyorsa)
  forceSink:d=>{if(state.hp<=0)return;state.hp=0;respawn();showSunkBy(d.byNick);},
  chat:(c:{nick:string;text:string;at:number;adm?:boolean})=>chat.receive(c.nick,c.text,c.at,!!c.adm),
  arew:(d:{xp?:number;ep?:number;pearls?:number})=>{aevGain.xp+=d.xp??0;aevGain.ep+=d.ep??0;aevGain.pearls+=d.pearls??0;if(!aevGainTimer)aevGainTimer=setTimeout(()=>{aevGainTimer=0;const g=aevGain,p=[g.xp?`+${fmt(g.xp)} TP`:'',g.ep?`+${fmt(g.ep)} EP`:'',g.pearls?`+${fmt(g.pearls)} İnci`:''].filter(Boolean).join(' · ');aevGain={xp:0,ep:0,pearls:0};if(p)rewardNotice(`Yönetici gemisine hasar · ${p}`,'battle');},4000) as unknown as number;},
  dom:d=>onDomNet(d),
  muted:left=>{const t=left>=86_400_000?`${Math.ceil(left/86_400_000)} gün`:left>=3_600_000?`${Math.ceil(left/3_600_000)} saat`:`${Math.ceil(left/60_000)} dakika`;chat.system(`Sohbet cezan var · ${t} sonra yazabilirsin (Oyun Kuralları)`);toast(`Sohbet cezası: ${t}`);},
  reported:()=>{toast('Bildirimin yönetime iletildi, teşekkürler');},
  ls:d=>onLsNet(d),
  ahp:d=>{adminEv={...d,at:performance.now()};},
  aboom:(id:string)=>{const e=remoteOf(id);if(e){burst(e.x,e.y,true);burst(e.x,e.y,true);playExplosion();splashAt(e.x,e.y,220);}},
  bid:b=>receiveBid(b),
  bidAsk:hour=>{auctionTick();const bids=Object.values(auction.top);if(hour===auction.hour&&bids.length)sendKnownBids(bids);},
  bidKnown:bids=>{for(const b of bids)receiveBid(b);},
};
startNet(netHandlers);if(session.account)setTimeout(()=>{void refreshCloudGuild();},2000);
let netClock=0,netFullClock=0,netHp=0,netIdent='',shipDir16=8;const netPrev={x:0,y:0},netVel={x:0,y:0},netSent={x:0,y:0};let ldKey='',ldClock=0;
function netTick(dt:number){joinSea(siege?(sharedBosses()?'siege':null):dom?`dom-${dom.id}`:ls?`ls-${ls.id}`:currentMap);{const ix=(player.x-netPrev.x)/Math.max(dt,1e-3),iy=(player.y-netPrev.y)/Math.max(dt,1e-3),ok=Math.hypot(ix,iy)<600;netVel.x=netVel.x*.8+(ok?ix:0)*.2;netVel.y=netVel.y*.8+(ok?iy:0)*.2;}netPrev.x=player.x;netPrev.y=player.y;
  // 16 yönlü tasarımlar: görünüş ortalama gidiş yönünden (çapraz adımlar yumuşatılmış hız). Ekranda dikey hız yarı ölçekli → ×2
  if(Math.hypot(netVel.x,netVel.y)>25)shipDir16=(8+Math.round(Math.atan2(netVel.y*2,netVel.x)/(Math.PI/8))+16)%16;
  // Gönderim sıklığı: hareket/savaşta 10/sn, dururken 1/sn; haritada 30'dan fazla kaptan varsa oranla seyrekleşir (100 kişide ~3/sn).
  // Kimlik bilgileri 2 sn'de bir ya da değişince gönderilir. Alıcı tarafta konum hızla ileri tahmin edildiği için hareket akıcı kalır.
  netClock-=dt;netFullClock-=dt;if(netClock>0)return;
  const others=enemies.reduce((n,e)=>n+(e.remote?1:0),0),moving=Math.hypot(netVel.x,netVel.y)>15||state.attacking||Math.round(state.hp)!==netHp,crowd=Math.max(1,others/30);
  const hp=Math.max(0,Math.round(state.hp));netHp=Math.round(state.hp);const d16=dir16Sprite()?shipDir16:undefined;
  netClock=moving?Math.min(.35,.1*crowd):1;
  const f=isoFace,ship=activeShip==='starter'?'starter':String(activeShip),ident=`${profile.nick}|${guild?.tag??''}|${ship}|${effectiveMaxHp()}|${battleRank(state.battlePoints).index}|${state.level}`;
  const msg:NetState={id:myNetId,x:Math.round(player.x),y:Math.round(player.y),east:f.east,north:f.north,hp,t:Date.now(),vx:Math.round(netVel.x),vy:Math.round(netVel.y),d16};
  if(netFullClock<=0||ident!==netIdent){netFullClock=2;netIdent=ident;Object.assign(msg,{nick:profile.nick,tag:guild?.tag??null,ship,maxHp:effectiveMaxHp(),sp:state.battlePoints,level:state.level});}
  // Donanım: değişince ya da 10 sn'de bir sunucuya (atış hasarını sunucu bununla hesaplar)
  {const ld={mt:mountedCannons,type:state.cannonType,eq:equipped,act:crew.active,hero:!!heroTitle,ach:!!ach.collectionComplete,tal:crew.talents},k=JSON.stringify(ld);ldClock-=1;if(k!==ldKey||ldClock<=0){ldKey=k;ldClock=30;sendLoadout(ld);}}
  // Yeniden doğma, liman ya da harita geçişi gibi ani konum değişimi: sunucuya ışınlanma olarak bildirilir
  if(Math.hypot(player.x-netSent.x,player.y-netSent.y)>700)msg.tp=1;netSent.x=player.x;netSent.y=player.y;
  sendState(msg);
  {const others=enemies.filter(e=>e.remote),pill=ui('netPill');pill.dataset.status=netStatus;
    ui('netText').textContent=netStatus==='ok'?`Çevrim içi · ${others.length} kaptan`:netStatus==='error'?'Bağlantı yok':netStatus==='off'?'Çevrim dışı':'Bağlanıyor…';
    pill.title=netStatus==='error'?netError:others.map(e=>`${e.name} · ${coordLabel(e)}`).join('\n')||'Bu haritada başka kaptan yok';}
  netWarnTick();
  const now=performance.now();for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.remote&&now-e.remote.seen>6000){enemies.splice(i,1);if(selected===e){selected=null;state.attacking=false;}}}}
// Sunucu bağlantısı yokken herkese görünen uyarı (3 sn'den uzun kopukluk); oyun kendiliğinden yeniden bağlanır
const netWarn=document.createElement('div');netWarn.className='net-warn';netWarn.hidden=true;document.body.append(netWarn);let netDownSince=0;
function netWarnTick(){if(!session.account){netWarn.hidden=true;return;}const down=!sharedBosses();
  if(!down){netDownSince=0;netWarn.hidden=true;return;}if(!netDownSince)netDownSince=performance.now();
  if(performance.now()-netDownSince>3000){netWarn.hidden=false;const t='Oyun sunucusuna bağlanılamıyor · yeniden deneniyor…';if(netWarn.textContent!==t)netWarn.textContent=t;}}
// Casus: rakip kaptanın konumu (oyundaysa şimdiki, değilse son çıkış yaptığı harita ve koordinat)
const spyStore=loadSpy();
const OFFLINE_SPOTS:Record<string,[string,string]>={ADM_AHMET:['8/2','31BK'],'ADM_YASİN':['7/1','12AF'],ADM_DOGAN:['6/2','47CC']};
function spyRivals():SpyRival[]{return TEST_RANKERS.map(r=>{const live=enemies.find(e=>e.captain&&e.name===r.nick);
  return live?{nick:r.nick,online:true,map:currentMap,coord:coordLabel(live)}:{nick:r.nick,online:false,map:OFFLINE_SPOTS[r.nick]?.[0]??'1/1',coord:OFFLINE_SPOTS[r.nick]?.[1]??'00AA'};});}
{const nick=ui('spyNick') as HTMLInputElement;nick.addEventListener('keydown',e=>e.stopPropagation());
  ui('spyGo').onsubmit=e=>{e.preventDefault();const name=nick.value.trim();if(!name){toast('Rakip kaptanın adını yaz');return;}
    if(state.pearls<SPY_COST){toast(`Casus için ${SPY_COST} inci gerekli`);return;}
    if(session.account){if(!sharedBosses()){toast('Casus için oyun sunucusuna bağlı olmalısın');return;}nick.blur();
      spyDialog('CASUS GÖNDER',`<b>${escapeHtml(name)}</b> kaptanına <b>${SPY_COST} inci</b> karşılığında casus gönderilsin mi?`,'GÖNDER',()=>{sendSpyNet(name);nick.value='';});return;}
    if(!spyRivals().some(x=>x.nick.toLocaleUpperCase('tr-TR')===name.toLocaleUpperCase('tr-TR'))){toast(`"${name}" adında bir kaptan bulunamadı`);return;}
    nick.blur();
    spyDialog('CASUS GÖNDER',`<b>${escapeHtml(name)}</b> kaptanına <b>${SPY_COST} inci</b> karşılığında casus gönderilsin mi?`,'GÖNDER',()=>{
      if(state.pearls<SPY_COST){toast(`Casus için ${SPY_COST} inci gerekli`);return;}
      const r=sendSpy(spyStore,name,spyRivals());if(r.kind==='unknown')return;
      state.pearls-=SPY_COST;saveAccount();updateUI();const n=escapeHtml(r.rival!.nick);nick.value='';
      if(r.kind==='blocked'){addLog(logbook,{t:Date.now(),kind:'battle',text:`Casus yakalandı · ${r.rival!.nick}`});saveLog(logbook);spyDialog('CASUS YAKALANDI',`<b>${n}</b> gemisindeki Casus Kalkanı casusunu yakaladı.<br><small>Konum öğrenilemedi, inci harcandı.</small>`);return;}
      const rv=r.rival!;addLog(logbook,{t:Date.now(),kind:'battle',text:`Casus raporu · ${rv.nick} · ${rv.map} ${rv.coord}`});saveLog(logbook);
      spyDialog('CASUS RAPORU',rv.online?`<b>${n}</b> şu an oyunda.<div class="spy-loc"><span>Harita</span><b>${rv.map}</b><span>Koordinat</span><b>${rv.coord}</b></div>`:`<b>${n}</b> şu an oyunda değil. Son çıkış yaptığı yer:<div class="spy-loc"><span>Harita</span><b>${rv.map}</b><span>Koordinat</span><b>${rv.coord}</b></div>`);
    });};}
// Sunucudan casus raporu: bedel cüzdandan düştü (yerelde de düşülür, eşitlemede harcama sayılmaz)
function onSpyReport(r:NetSpy){
  if(r.status==='unknown'){toast('Bu adda bir kaptan bulunamadı');return;}if(r.status==='poor'){toast(`Casus için ${SPY_COST} inci gerekli`);return;}if(r.status==='error'){toast('Casus gönderilemedi, sonra tekrar dene');return;}
  state.pearls=Math.max(0,state.pearls-SPY_COST);session.pearlServerAdd?.(-SPY_COST);saveAccount();updateUI();const n=escapeHtml(r.nick??'');
  if(r.status==='blocked'){addLog(logbook,{t:Date.now(),kind:'battle',text:`Casus yakalandı · ${r.nick}`});saveLog(logbook);spyDialog('CASUS YAKALANDI',`<b>${n}</b> gemisindeki Casus Kalkanı casusunu yakaladı.<br><small>Konum öğrenilemedi, inci harcandı.</small>`);return;}
  if(!r.map||r.x==null||r.y==null){spyDialog('CASUS RAPORU',`<b>${n}</b> şu an oyunda değil ve son konumu bilinmiyor.`);return;}
  const coord=r.map==='kale'?'':coordLabel({x:r.x,y:r.y});addLog(logbook,{t:Date.now(),kind:'battle',text:`Casus raporu · ${r.nick} · ${r.map} ${coord}`});saveLog(logbook);
  const loc=`<div class="spy-loc"><span>Harita</span><b>${escapeHtml(r.map==='kale'?'Kara Kale':r.map)}</b>${coord?`<span>Koordinat</span><b>${coord}</b>`:''}</div>`;
  spyDialog('CASUS RAPORU',r.online?`<b>${n}</b> şu an oyunda.${loc}`:`<b>${n}</b> şu an oyunda değil. Son çıkış yaptığı yer:${loc}`);}
function spyDialog(title:string,html:string,ok='TAMAM',onOk?:()=>void){
  let el=document.getElementById('spyDialog');if(!el){el=document.createElement('div');el.id='spyDialog';el.className='spy-dialog';document.body.append(el);}
  el.innerHTML=`<section><h3>${title}</h3><p>${html}</p><footer>${onOk?'<button data-x>VAZGEÇ</button>':''}<button data-ok>${ok}</button></footer></section>`;el.classList.add('open');
  const close=()=>el!.classList.remove('open');
  el.querySelector<HTMLButtonElement>('[data-ok]')!.onclick=()=>{close();onOk?.();};
  const x=el.querySelector<HTMLButtonElement>('[data-x]');if(x)x.onclick=close;
  el.onclick=e=>{if(e.target===el)close();};}
// Çevrim içi kaptan listesi: dokununca en yakın kaptana rota çizilir
// Bağlantı göstergesi (kaç kaptan çevrim içi) oyunda gösterilmez; sayı yalnızca yönetim panelinde (yerel geliştirmede açık)
if(import.meta.env.DEV)ui('netPill').hidden=false;
ui('netPill').onclick=()=>{const others=enemies.filter(e=>e.remote);if(netStatus!=='ok'){toast(netStatus==='error'?`Sunucuya bağlanılamadı (${netError})`:'Sunucuya bağlanılıyor…');return;}
  if(!others.length){toast(`${currentMap} haritasında başka kaptan yok`);return;}
  const t=others.sort((a,b)=>dist(a,player)-dist(b,player))[0];routeTarget=navigablePoint({x:t.x,y:t.y});destination=routeVia(routeTarget);attackChase=false;
  toast(`${others.map(e=>`${e.name} (${coordLabel(e)})`).join(' · ')} · rota: ${t.name}`);};
ui('stripPearlPlus').onclick=()=>document.getElementById('pearlResource')?.click();ui('openShop').onclick=()=>showShop(lastShop);
// Mağaza sekmesi (İnci Hazinesi): gerçek parayla VİP ve inci paketleri (src/pearlShop.ts)
function openPearlShop(){renderPearlShop();ui('pearlShopOverlay').classList.add('open');}
function closePearlShop(){ui('pearlShopOverlay').classList.remove('open');}
function renderPearlShop(){
  ui('pearlPacks').innerHTML=PEARL_PACKS.map(p=>`<article class="pearl-pack${p.tag?' tagged':''}" data-pack="${p.id}">${p.tag?`<i class="pack-tag">${p.tag}</i>`:''}<img src="/assets/icon-pearl-v1.webp" alt="" draggable="false"/><h4>${p.name}</h4><strong>${fmt(packTotal(p))} İnci</strong><small>${p.bonus?`${fmt(p.pearls)} + <b>${fmt(p.bonus)} bonus</b>`:'&nbsp;'}</small><button ${isNativeApp()&&!iapPrice(p.id)?'disabled':''}>${isNativeApp()?iapPrice(p.id)??'—':priceText(p.price)}</button></article>`).join('');
  ui('pearlNote').textContent=isNativeApp()?(iapAvailable()?'Ödemeler App Store / Google Play üzerinden alınır; inci birkaç saniye içinde hesabına eklenir.':'Uygulama içi satın alma yakında açılacak.'):Object.values(SHOPIER_LINKS).some(Boolean)?`Ödemeler Shopier güvenli ödeme sayfasından alınır. Sipariş notuna oyuncu numaranı yaz: ${session.account?.playerNo??''}`:ELITE_TEST_MODE?'Test modu: ödeme alınmaz, paket hemen hesabına eklenir.':'Ödemeler güvenli ödeme sağlayıcısı üzerinden alınır.';
  ui('pearlPacks').querySelectorAll<HTMLElement>('[data-pack]').forEach(el=>el.querySelector('button')!.onclick=()=>buyPearlPack(el.dataset.pack!));}
function buyPearlPack(id:string){const p=PEARL_PACKS.find(x=>x.id===id);if(!p)return;
  // Mağaza uygulamasında yalnızca App Store / Google Play ödemesi (dış ödeme sayfasına yönlendirme yok)
  if(isNativeApp()){if(!iapAvailable()||!iapPrice(p.id)){toast('Uygulama içi satın alma yakında açılacak');return;}
    void iapBuy(p.id).then(r=>{if(r==='ok'){playCoins();rewardNotice(`${p.name} satın alındı · inci birkaç saniye içinde hesabına eklenecek`,'shop');}else if(r==='error')toast('Ödeme tamamlanamadı, tekrar dene');});return;}
  const link=SHOPIER_LINKS[p.id];
  if(link&&session.account){const no=session.account.playerNo;
    if(!confirm(`${p.name} · ${priceText(p.price)}\n\nShopier güvenli ödeme sayfası açılacak.\nÖDEMEDE SİPARİŞ NOTUNA OYUNCU NUMARANI YAZ: ${no}\n(ya da oyundaki e-postanla öde)\n\nÖdeme tamamlanınca inci birkaç dakika içinde hesabına eklenir.`))return;
    void openExternal(link);return;}
  if(!ELITE_TEST_MODE){toast('Ödeme sistemi yakında açılacak');return;}
  state.pearls+=packTotal(p);saveAccount();updateUI();playCoins();rewardNotice(`${p.name} satın alındı · +${fmt(packTotal(p))} inci`,'shop');}
ui('pearlResource').onclick=()=>showShop('pearlShopOverlay');
if(session.account&&iapAvailable())void iapInit(session.account.uid).then(()=>{if(ui('pearlShopOverlay').classList.contains('open'))renderPearlShop();});
ui('pearlShopOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('pearlShopOverlay'))closePearlShop();});ui('closeShopTabs').onclick=closeShops;
function openMenu(){closeShops();closePearlShop();ui('menuOverlay').classList.add('open');}
function closeMenu(){ui('menuOverlay').classList.remove('open');}
ui('openMenu').onclick=openMenu;ui('logoutCorner').onclick=requestLogout;if(!session.logout)ui('logoutCorner').hidden=true;ui('closeMenu').onclick=closeMenu;ui('menuOverlay').addEventListener('pointerdown',e=>{if(e.target===ui('menuOverlay'))closeMenu();});
ui('openMenuQuests').onclick=openQuestLog;ui('openMenuWorld').onclick=openWorldMap;
// menüdeki bir kutuya tıklanınca hedef pencere açılır, menü kapanır
document.querySelectorAll<HTMLButtonElement>('.menu-grid button').forEach(b=>b.addEventListener('click',closeMenu));

function spawnEnemy(){
  if(netNpcs())return; // hesapla oynarken NPC'ler oyun sunucusundan gelir
  const map=mapDef();if(regularEnemyCount()>=map.npcCount)return;
  const available=map.npcs.map(id=>NPCS[id]).filter(def=>!!def.sprite);if(!available.length)return;
  const missing=available.filter(def=>!enemies.some(e=>!e.tower&&!e.boss&&e.def?.id===def.id));
  const pool=missing.length?missing:available;
  const def=pool[Math.floor(Math.random()*pool.length)],p=randomSeaPoint(520);
  enemies.push(makeShip(def,p.x,p.y,Math.random()*Math.PI*2));
}
function makeShip(def:NpcDef,x:number,y:number,angle:number):Enemy{
  return{kind:'ship',def,role:def.role,x,y,angle,hp:def.hp,maxHp:def.hp,cooldown:Math.random()*2,speed:def.speed+Math.random()*4,damage:def.damage,reload:def.reload,rewardGold:def.gold,rewardFame:def.xp,color:'#79372f',name:def.name,tier:def.tier,aggro:false,wander:Math.random()*6,slowTimer:0,homeX:x,homeY:y,combatTimer:0};
}
const regularEnemyCount=()=>enemies.filter(e=>!e.tower&&!e.boss).length;
// Adalardan, filo adasından ve oyuncudan uzak rastgele deniz noktası
// Çıkış: 15 sn hasar almadan beklenir; vurulursa geri sayım baştan başlar.
const LOGOUT_SAFE=15;let logoutPending=false,logoutShown=-1;
function tickLogout(){
  if(!logoutPending)return;const left=Math.ceil(LOGOUT_SAFE-playerHitClock);
  if(left<=0){logoutPending=false;ui('logoutCorner').classList.remove('pending');toast('Çıkış yapılıyor…');void session.logout?.();return;}
  if(left!==logoutShown){logoutShown=left;toast(left===LOGOUT_SAFE&&logoutShown>0?'Hasar aldın — çıkış sayacı yeniden başladı':`Çıkış: ${left} sn (hasar alma)`);}
}
function requestLogout(){
  if(!session.logout)return;if(logoutPending){logoutPending=false;ui('logoutCorner').classList.remove('pending');toast('Çıkış iptal edildi');return;}
  logoutPending=true;logoutShown=-1;ui('logoutCorner').classList.add('pending');tickLogout();
}
function randomSeaPoint(minPlayerDist:number){
  for(let tries=0;tries<60;tries++){const p={x:160+Math.random()*(WORLD_WIDTH-320),y:160+Math.random()*(WORLD_HEIGHT-320)};const f=mapDef().fleet;
    if(hasFleetIsland()&&dist(p,f)<FLEET.islandR+100)continue;if(islands.some(i=>dist(p,i)<i.r+60))continue;if(dist(p,player)<minPlayerDist)continue;return p;}
  return{x:160+Math.random()*(WORLD_WIDTH-320),y:160+Math.random()*(WORLD_HEIGHT-320)};
}
function setupFleetIsland(){
  const map=mapDef(),f=map.fleet;ownTowers.length=0;towersDestroyedHere=0;if(!hasFleetIsland())return;
  // Kendi adanda yalnızca filonun diktiği kuleler vardır; boş kaideler FİLO sekmesinden inciyle doldurulur.
  if(fleetOwner()==='player'){if(guild){const slots=islandSlots(guild,currentMap);FLEET.towers.forEach(([dx,dy],i)=>{const t=slots[i];if(t)ownTowers.push({x:f.x+dx,y:f.y+dy,cooldown:Math.random()*2,slot:i,type:t.type});});}return;}
  if(siege){spawnSiegeTowers();return;}
  const n=netIsland(currentMap);if(n){n.towers.forEach((t,i)=>{if(t)spawnRivalTower(i,t[0],n.tag);});return;}
  if(session.account)return; // hesaplı oyunda kuleler yalnızca sunucudan gelir
  FLEET.towers.forEach((_,i)=>{if(!ruinLeft(towerRuins,currentMap,i))spawnRivalTower(i);});
}
// Rakip filo kulesi; yıkılan kaidedeki kule 1 saat dolmadan geri gelmez (reviveRivalTowers)
function spawnRivalTower(i:number,hp?:number,tag=''){const map=mapDef(),f=map.fleet,t=fleetTower(map.tier),[dx,dy]=FLEET.towers[i];
  const tower:Enemy={kind:'ship',role:'heavy',tower:true,towerIndex:i,x:f.x+dx,y:f.y+dy,angle:0,hp:hp??t.hp,maxHp:t.hp,cooldown:Math.random()*2,speed:0,damage:t.damage,reload:t.reload,rewardGold:0,rewardFame:0,color:'#555',name:tag?`[${tag}] Kulesi`:'ADM Kulesi',tier:map.tier,aggro:false,wander:0,slowTimer:0,homeX:f.x+dx,homeY:f.y+dy,combatTimer:0,hitRadius:34,fireRange:t.range};enemies.push(tower);
}
function reviveRivalTowers(){if(siege||!hasFleetIsland()||fleetOwner()==='player'||netIsland(currentMap))return;
  FLEET.towers.forEach((_,i)=>{if(!ruinLeft(towerRuins,currentMap,i)&&!enemies.some(e=>e.tower&&e.towerIndex===i))spawnRivalTower(i);});}
// ---------------------------------------------------------------- Harita bossları
// Sayaç haritaya özeldir ve kalıcıdır; yalnızca o haritanın en güçlü NPC'si (ağır gemi) sayılır.
// Boss çıkıp yenilmeden haritadan çıkılırsa, haritaya dönünce yeniden belirir.
const BOSS_STORAGE='yedi-deniz-bosses-v1';
type BossProgress={kills:number;pending:boolean};
const bossProgress:Record<string,BossProgress>=(()=>{try{return JSON.parse(localStorage.getItem(BOSS_STORAGE)||'{}')||{};}catch{return{};}})();
const bossOf=(key:MapKey)=>bossProgress[key]??(bossProgress[key]={kills:0,pending:false});
const saveBosses=()=>{try{localStorage.setItem(BOSS_STORAGE,JSON.stringify(bossProgress));}catch{}};
const activeBoss=()=>enemies.find(e=>e.boss);
function spawnBoss(net?:NetBoss){
  if(activeBoss())return;const b=bossFor(currentMap);if(!b.sprite)return;const p=net?{x:net.x,y:net.y}:randomSeaPoint(700);
  const e=makeShip(b as unknown as NpcDef,p.x,p.y,Math.random()*6);e.boss=b;e.hitRadius=64;e.speed=b.speed;e.color='#2f5a4a';
  if(net){e.shared=net.id;e.maxHp=net.maxHp;e.hp=Math.max(1,net.hp);e.lastHp=e.hp;}enemies.push(e);
  toast(`${b.name} ${mapDef().name} sularında belirdi!`);rewardNotice(`Boss ${b.name} belirdi`,'battle');playBossHorn();playBossMusic(mapDef().tier);
}
function countBossKill(e:Enemy){
  if(siege)return;
  const b=bossFor(currentMap);if(e.def?.id!==b.trigger||e.summoned)return;
  // Çevrim içi: batırmalar deniz için ortak sayılır, boss'u sunucu çıkarır ve herkese gösterir
  if(session.account){if(sharedBosses())sendBossKill(bossKillsNeeded(BOSS_KILLS));return;}
  const st=bossOf(currentMap);if(st.pending)return;
  st.kills++;if(st.kills>=bossKillsNeeded(BOSS_KILLS)){st.kills=0;st.pending=true;spawnBoss();}saveBosses();
}
function bossFire(e:Enemy){
  const base=Math.atan2(player.y-e.y,player.x-e.x),enraged=e.hp<e.maxHp*.5;playEnemyCannon(dist(e,player)*.6,(e.x-player.x)/600);
  muzzleFlash(e.x+Math.cos(base)*30,e.y+Math.sin(base)*30,base,84);
  for(const off of enraged?[-.24,-.12,0,.12,.24]:[-.15,0,.15])shots.push({x:e.x,y:e.y,vx:Math.cos(base+off)*280,vy:Math.sin(base+off)*280,life:2.2,owner:'enemy',damage:e.damage*(.85+Math.random()*.3)*(enraged?.8:1),hit:false,ammo:'iron'});
  e.cooldown=e.reload*(enraged?.8:1);
  if(enraged&&!e.escortsCalled){e.escortsCalled=true;const def=NPCS[mapDef().npcs[1]];for(let k=0;k<2;k++){const ship=makeShip(def,e.x+(k?70:-70),e.y+50,e.angle);ship.aggro=true;ship.combatTimer=20;ship.summoned=true;ship.name=`${e.name} Muhafızı`;enemies.push(ship);}toast(`${e.name} muhafızlarını çağırdı!`);}
}
// Boss ödülü: TP ve altın havuzu katılımcı sayısıyla büyür (5 kaptana kadar, kişi başı +%60) ve hasar payına göre bölünür.
// İnci, EP, öfke ve başarım: hasarın en az %3'ünü veren her kaptana tam verilir. Tek başına kesen havuzun tamamını alır.
const BOSS_MIN_SHARE=.03;
const bossPool=(n:number)=>1+.6*(Math.min(5,Math.max(1,n))-1);
function defeatBoss(e:Enemy){
  const b=e.boss!;stopBossMusic();bossOf(currentMap).pending=false;saveBosses();
  for(let n=0;n<3;n++)setTimeout(()=>{burst(e.x+(Math.random()-.5)*80,e.y+(Math.random()-.5)*50,true);playExplosion();},n*260);
  const share=e.shared?e.share??0:1,pool=e.shared?bossPool(e.shareN??1):1;
  if(share<=0){rewardNotice(`${b.name} batırıldı · bu savaşa katkın olmadı`,'battle');return;}
  const xp=xpGain(Math.round(b.xp*pool*share)),gold=goldGainAch(Math.round(NPCS[b.trigger].gold*20*pool*share));state.fame+=xp;state.gold+=gold;
  const full=share>=BOSS_MIN_SHARE,bEp=full?bossEp(b.tier):0;
  if(full){gainElitePoints(bEp);gainRage(rage,RAGE_PER_BOSS);bumpAch('boss');serverPearls(b.pearls);}
  saveAccount();
  const part=e.shared&&(e.shareN??1)>1?` · payın %${Math.round(share*100)} (${e.shareN} kaptan)`:'';
  rewardNotice(`${b.name} batırıldı${part} · +${fmt(xp)} TP · +${fmt(gold)} altın${full?` · +${fmt(b.pearls)} inci · +${fmt(bEp)} EP`:''} kazanıldı`,'battle',{xp,gold,sink:true});
}
// Sunucu NPC'leri: yerel kopyada verilen hasar (salvo, yanma, mayın) biriktirilip 0,25 sn'de bir gönderilir; can ve batış sunucudan
const netNpcs=()=>!!session.account&&!siege;
let npcHitClock=0;const npcHitPending=new Map<string,number>();
function npcNetTick(dt:number){if(!netNpcs()||session.account){npcHitPending.clear();return;}for(const e of enemies){if(!e.net)continue;if(e.lastHp!==undefined&&e.hp<e.lastHp)npcHitPending.set(e.net.id,(npcHitPending.get(e.net.id)??0)+e.lastHp-e.hp);e.lastHp=e.hp;}
  npcHitClock-=dt;if(npcHitClock<=0&&npcHitPending.size){npcHitClock=.25;sendNpcHits([...npcHitPending].map(([id,d])=>[id,Math.round(d)]));npcHitPending.clear();}}
function npcFromNet(n:NetNpc):Enemy|null{const def=NPCS[n.d];if(!def)return null;const e=makeShip(def,n.x,n.y,Math.random()*Math.PI*2);e.net={id:n.id,tx:n.x,ty:n.y};e.hp=n.hp;e.maxHp=n.max;e.lastHp=n.hp;e.homeX=n.x;e.homeY=n.y;return e;}
const npcById=(id:string)=>enemies.find(e=>e.net?.id===id);
function onNpcList(list:NetNpc[]){if(!netNpcs())return;for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.net||(!e.tower&&!e.boss&&!e.captain&&!e.remote&&!e.commander&&e.def)){if(selected===enemies[i]){selected=null;state.attacking=false;}enemies.splice(i,1);}}
  for(const n of list){const e=npcFromNet(n);if(e)enemies.push(e);}}
// Sunucunun ateşlediği NPC güllesi: hedef bu oyuncuysa gülle oyuncuya uçar (hasar oyunun kurallarıyla, kalkan vb. dahil)
function npcShot(id:string,to:string,dmg:number){const e=npcById(id);if(!e)return;const tx=to===myNetId?player:enemies.find(x=>x.remote?.id===to);if(!tx)return;
  const a=Math.atan2(tx.y-e.y,tx.x-e.x);if(dist(e,player)<900)playEnemyCannon(dist(e,player),(e.x-player.x)/600);muzzleFlash(e.x+Math.cos(a)*16,e.y+Math.sin(a)*16,a,36);
  if(to!==myNetId||state.invulnerable>0)return;e.aggro=true;e.combatTimer=4;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:2.2,owner:'enemy',damage:dmg,hit:false,ammo:'iron'});}
function onNpcPos(d:{p:[string,number,number][];h:[string,number][];f?:[string,string,number][]}){for(const [id,to,dmg] of d.f??[])npcShot(id,to,dmg);for(const [id,x,y] of d.p){const e=npcById(id);if(e?.net){e.net.tx=x;e.net.ty=y;}}for(const [id,hp] of d.h){const e=npcById(id);if(e){e.hp=Math.max(1,hp);e.lastHp=e.hp;}}}
function onNpcDie(id:string){const e=npcById(id);if(!e)return;e.serverDown=true;e.hp=0;e.lastHp=0;npcHitPending.delete(id);sinkEnemy(e);}
// Paylaşılan boss: yerel kopyada verilen hasar biriktirilip sunucuya gönderilir; can sunucudan gelir, batışı sunucu bildirir
let bossHitPending=0,bossHitClock=0;
function sharedBossTick(dt:number){const e=activeBoss();if(!e?.shared||session.account){bossHitPending=0;return;}
  if(e.lastHp!==undefined&&e.hp<e.lastHp)bossHitPending+=e.lastHp-e.hp;e.lastHp=e.hp;
  bossHitClock-=dt;if(bossHitClock<=0&&bossHitPending>0){bossHitClock=.3;const d=Math.min(80000,bossHitPending);bossHitPending-=d;sendBossHit(d);}}
const seaKey=()=>`sea-${currentMap.replace('/','-')}`;
// Paylaşılan ada kuleleri: yerelde verilen hasar kaide kaide biriktirilip sunucuya gönderilir
const towerPending=new Map<number,number>();let towerSendClock=0;
function sharedTowerTick(dt:number){if(siege||!netIsland(currentMap)||session.account){towerPending.clear();return;}
  for(const e of enemies){if(!e.tower||e.siege||e.towerIndex===undefined)continue;if(e.lastHp!==undefined&&e.hp<e.lastHp)towerPending.set(e.towerIndex,(towerPending.get(e.towerIndex)??0)+e.lastHp-e.hp);e.lastHp=e.hp;}
  towerSendClock-=dt;if(towerSendClock>0||!towerPending.size)return;towerSendClock=.3;
  for(const [slot,d] of towerPending){const n=Math.min(400000,d);sendTowerHit(slot,n);if(d>n)towerPending.set(slot,d-n);else towerPending.delete(slot);}}
// Şifa ile kule tamiri: kendi adanda şifa güllesi seçiliyken kuleye tıklanınca menzilde kaldıkça salvo salvo doldurulur.
// Kuleye şifa, salvonun gücünün 2,6 katıdır (kule kırıcı gibi); oyuncu şifasındaki 15 bin sınırı kuleler için yoktur.
let towerHealSlot:number|null=null,towerHealClock=0;
function stopTowerHeal(msg?:string){if(towerHealSlot===null)return;towerHealSlot=null;if(msg)toast(msg);}
function towerHealTick(dt:number){if(towerHealSlot===null)return;const slot=towerHealSlot,n=netIsland(currentMap),f=mapDef().fleet;
  if(!n||fleetOwner()!=='player'||!n.towers[slot]){stopTowerHeal();return;}
  const [hp,max]=n.towers[slot]!,[dx,dy]=FLEET.towers[slot],at={x:f.x+dx,y:f.y+dy};
  if(state.ammo!=='heal'){stopTowerHeal();return;}if(hp>=max){stopTowerHeal('Kule tam canında');return;}
  if(dist(player,at)>effectiveRange()+80){return;}
  towerHealClock-=dt;if(towerHealClock>0)return;const cannon=CANNONS[state.cannonType];towerHealClock=cannon.reload;
  const loaded=Math.min(state.cannon,arsenal.heal);if(loaded<=0){stopTowerHeal('Şifa güllesi tükendi');renderQuickSlots();return;}
  arsenal.heal-=loaded;if(session.account)sendAttack({k:'t',id:String(slot),a:'heal',n:loaded,i:0,p:0,r:0});else sendSalvo('heal',loaded,0,0);saveArsenal(arsenal);renderQuickSlots();
  const amount=Math.round(loaded*BALL_DAMAGE*(1+upgrades.damage*.11)*cannon.damage*bonus.damage*(1+equipBonus().damage+achBonus().damage+eliteBonus().damage)*2.6);
  if(!session.account)sendTowerHit(slot,amount,true);healText(at.x,at.y-40,amount);playHeal();}
function populateMap(){
  stopBossMusic();abilityQueue.length=0;
  const map=mapDef();islands.splice(0,islands.length,...map.islands.map(i=>({...i})));
  enemies.length=0;shots.length=0;salvoQueue.length=0;particles.length=0;wrecks.length=0;lootChests.length=0;sparkles.length=0;sparkleQueue.length=0;mines.length=0;driftClock=DRIFT_RESPAWN_SECONDS;
  setTowerTheme(theme().fleet);
  preload([...(hasFleetIsland()?[fleetBaseUrl(theme().fleet),fleetTowerUrl(theme().fleet)]:[]),...(siege?[SIEGE_COMMANDER.sprite,SIEGE_GUARD.sprite]:[]),...map.npcs.map(id=>NPCS[id].sprite),...new Set(map.islands.map(i=>islandSheetUrl(i.look)))]);
  setupFleetIsland();
  for(let i=0;i<map.npcCount;i++)spawnEnemy();
  if(ls){ui('mapName').textContent=LS_MAP.name;ui('mapSubtitle').textContent='HAYATTA KALMA';ui('mapBadge').className='map-badge danger-3';return;}
  if(dom){ui('mapName').textContent=DOM_MAP.name;ui('mapSubtitle').textContent=DOM_TEAMS[dom.team].name.toLocaleUpperCase('tr');ui('mapBadge').className='map-badge danger-3';return;}
  if(siege){spawnSiegeAllies();ui('mapName').textContent=map.name;ui('mapSubtitle').textContent='BÜYÜK KUŞATMA';ui('mapBadge').className='map-badge danger-3';renderSiegeHud();return;}
  if(bossOf(currentMap).pending&&!session.account)spawnBoss(); // hesaplı oyunda boss sunucudan gelir
  spawnTestCaptains();
  if(!session.account){
  for(let i=0;i<3;i++){const p=randomSeaPoint(0);lootChests.push(createChest('drift',p.x,p.y,bonus.gilded,map.tier));}
  for(let i=0;i<SPARKLE_COUNT*sparkleMult();i++)spawnSparkle();}
  ui('mapName').textContent=`${map.key} · ${map.name}`;ui('mapSubtitle').textContent=map.safe?'SAVAŞA KAPALI':`${theme().name.toLocaleUpperCase('tr')} · SEVİYE ${map.tier}`;ui('mapBadge').className=`map-badge ${map.safe?'safe':'danger-'+Math.min(3,Math.ceil(map.tier/3))}`;
}
// Yönetici ışınlanması: dünya haritasındaki düğme ya da sohbette "/git 3/1"
function adminTeleport(key:string){const m=MAPS[key as MapKey];if(!session.isAdmin||!m){toast('Böyle bir deniz yok');return;}if(siege||dom||ls){toast('Kuşatma ya da arena maçı sırasında ışınlanılamaz');return;}enterMap(m.key,navigablePoint({x:WORLD_WIDTH/2,y:WORLD_HEIGHT/2}));toast(`${m.key} ${m.name} denizine ışınlandın`);}
// Yönetici her denize girebilir (etkinlik için ışınlanır) ve hasar almaz
const mapLvl=()=>session.isAdmin?MAX_LEVEL:state.level;
function enterMap(key:MapKey,at:Vec){
  currentMap=key;fleetSafe=null;fleetFields.clear();try{localStorage.setItem(WORLD_STORAGE,key);}catch{}populateMap();
  player.x=at.x;player.y=at.y;player.speed=0;destination=null;selected=null;state.attacking=false;ui('attack').classList.remove('active');
  camera.x=player.x;camera.y=player.y;freeLook=null;jumpPrompt=null;jumpLockUntil=performance.now()+JUMP_LOCK_MS;mapFade=1;updateJumpPrompt();playMapJump();
  rewardNotice(`${mapDef().key} ${mapDef().name} · ${mapDef().safe?'savaşa kapalı':'seviye '+mapDef().tier}`,'none');
}
function inCombat(){return enemies.some(e=>e.aggro&&!e.tower&&dist(e,player)<520);}
// Harita kenarına yanaşınca komşu denize atlama
const EDGE=110;
function edgeDir():Dir|null{if(player.y<EDGE)return'north';if(player.y>WORLD_HEIGHT-EDGE)return'south';if(player.x<EDGE)return'west';if(player.x>WORLD_WIDTH-EDGE)return'east';return null;}
function useJump(){
  if(!jumpPrompt){toast('Harita atlamak için denizin kenarına yanaş');return;}const target=MAPS[jumpPrompt.to];
  if(mapLvl()<target.tier){toast(`${target.key} ${target.name} için Seviye ${target.tier} gerekli`);return;}
  if(inCombat()){toast('Savaş sırasında harita atlanamaz');return;}
  const dir=jumpPrompt.dir,inset=40,at={x:dir==='west'?WORLD_WIDTH-inset:dir==='east'?inset:player.x,y:dir==='north'?WORLD_HEIGHT-inset:dir==='south'?inset:player.y};
  enterMap(target.key,at);
}
// Atladıktan sonra gemi karşı kenara yapışık doğar; 3 sn yeniden atlanamaz
const JUMP_LOCK_MS=3000;let jumpLockUntil=0;
function updateJumpPrompt(){
  const dir=siege||dom||ls||performance.now()<jumpLockUntil?null:edgeDir(),to=dir?neighbor(currentMap,dir):null,next=dir&&to?{dir,to}:null,el=ui('portalPrompt');
  if(!next){jumpPrompt=null;el.classList.remove('visible');el.innerHTML='';return;}
  if(next.to===jumpPrompt?.to&&next.dir===jumpPrompt?.dir)return;jumpPrompt=next;
  const target=MAPS[next.to],locked=mapLvl()<target.tier,arrow={north:'↑',south:'↓',east:'→',west:'←'}[next.dir];
  el.innerHTML=`<span>HARİTA ATLA ${arrow}</span><strong>${target.key} · ${target.name}</strong><small>${locked?`Seviye ${target.tier} gerekli`:target.safe?'Savaşa kapalı deniz':`${THEMES[target.tier].name} · Seviye ${target.tier}`}</small><button ${locked?'disabled':''}>HARİTA ATLA <kbd>${keyLabel(settings.binds.jump)}</kbd></button>`;
  el.classList.add('visible');el.querySelector('button')!.onclick=()=>useJump();
}
populateMap();
function randomSafePlayerPoint(){
  for(let tries=0;tries<140;tries++){
    const p=randomSeaPoint(0);
    const fleetSafe=!hasFleetIsland()||dist(p,mapDef().fleet)>FLEET.islandR+760;
    const hostileSafe=!enemies.some(e=>dist(e,p)<760);
    if(fleetSafe&&hostileSafe)return p;
  }
  return{x:WORLD_WIDTH*.18,y:WORLD_HEIGHT*.18};
}
{const loginSpot=randomSafePlayerPoint();player.x=loginSpot.x;player.y=loginSpot.y;camera.x=player.x;camera.y=player.y;}
function clamp(n:number,a:number,b:number){return Math.max(a,Math.min(b,n));}
function dist(a:Vec,b:Vec){return Math.hypot(a.x-b.x,a.y-b.y);}
// Filo adası: görselden üretilen seyir maskesi (src/fleetMask.ts). Kara hücreleri geçilmez; açık deniz, kanal ve
// lagün suyu seyredilebilir. Test süresince tüm filo adalarına girilebilir (FLEET_TEST_ENTRY).
const FLEET_TEST_ENTRY=true;
const FM_N=FLEET_MASK.n,FM_CELL=FLEET_MASK.cell*FLEET_SCALE,FM_HALF=FM_N*FM_CELL/2;
const FLEET_GRID=(()=>{const g=new Uint8Array(FM_N*FM_N);let k=0;for(const part of FLEET_MASK.rle.split(',')){const v=+part[0],n=parseInt(part.slice(1),36);g.fill(v,k,k+n);k+=n;}return g;})();
const fleetGrid=()=>FLEET_GRID;
const fleetEnterable=()=>hasFleetIsland()&&(siege?siegePhase(siege)>=2:fleetOwner()==='player'||FLEET_TEST_ENTRY);
function fleetCellOf(p:Vec){const f=mapDef().fleet;return{i:Math.floor((p.x-f.x+FM_HALF)/FM_CELL),j:Math.floor((p.y-f.y+FM_HALF)/FM_CELL)};}
function fleetCellValue(i:number,j:number){return i<0||j<0||i>=FM_N||j>=FM_N?1:fleetGrid()[j*FM_N+i];}
// 0 kara, 1 açık deniz, 2 lagün/kanal (adanın içi)
function fleetNav(p:Vec){if(!hasFleetIsland())return 1;const c=fleetCellOf(p);return fleetCellValue(c.i,c.j);}
function fleetCellCenter(i:number,j:number):Vec{const f=mapDef().fleet;return{x:f.x-FM_HALF+(i+.5)*FM_CELL,y:f.y-FM_HALF+(j+.5)*FM_CELL};}
function nearestFleetWater(p:Vec){const c=fleetCellOf(p);for(let r=1;r<=30;r++){let best:Vec|null=null,bd=Infinity;for(let j=c.j-r;j<=c.j+r;j++)for(let i=c.i-r;i<=c.i+r;i++){if(Math.max(Math.abs(i-c.i),Math.abs(j-c.j))!==r||!fleetCellValue(i,j))continue;const q=fleetCellCenter(i,j),d=dist(q,p);if(d<bd){bd=d;best=q;}}if(best)return best;}return null;}
let fleetSafe:Vec|null=null;
function fleetCollision(p:Vec):{x:number;y:number;name:string}|null{
  if(!hasFleetIsland())return null;const f=mapDef().fleet;
  if(!fleetEnterable()){const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),outR=FLEET.islandR+14;return d<outR?{x:f.x+Math.cos(a)*outR,y:f.y+Math.sin(a)*outR,name:f.name}:null;}
  if(fleetNav(p))return null;
  // Oyuncu için kıyı boyunca kayma: son güvenli konumdan yalnızca x ya da y hareketi denenir.
  if(p===player&&fleetSafe&&dist(fleetSafe,p)<40){for(const c of [{x:p.x,y:fleetSafe.y},{x:fleetSafe.x,y:p.y},fleetSafe])if(fleetNav(c))return{...c,name:f.name};}
  const w=nearestFleetWater(p);return w?{...w,name:f.name}:null;
}
// Geminin gövde genişliği kadar kalın çizgi: merkez ve iki yandaki paralel çizgiler açık olmalı.
function fleetWideLine(a:Vec,b:Vec){const d=dist(a,b)||1,nx=-(b.y-a.y)/d*10,ny=(b.x-a.x)/d*10;return fleetClearLine(a,b)&&fleetClearLine({x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny})&&fleetClearLine({x:a.x-nx,y:a.y-ny},{x:b.x-nx,y:b.y-ny});}
function fleetClearLine(a:Vec,b:Vec){const d=dist(a,b),n=Math.ceil(d/6);for(let k=1;k<=n;k++){const t=k/n;if(!fleetNav({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;}
// Maske üzerinde yol bulma: ızgara çevresine deniz payı eklenir (PAD); maliyet kıyıya yakın hücrelerde artar, böylece
// rota kıyıdan uzak ve dar geçitlerin ortasından geçer. Hedef değişmedikçe mesafe alanı önbellekte tutulur.
const FM_PAD=16,PN=FM_N+FM_PAD*2;
const fleetPads:Record<string,{grid:Uint8Array;clear:Uint8Array}>=Object.fromEntries(Object.entries({shared:FLEET_GRID}).map(([key,source])=>{
  const grid=new Uint8Array(PN*PN).fill(1);
  for(let j=0;j<FM_N;j++)for(let i=0;i<FM_N;i++)grid[(j+FM_PAD)*PN+i+FM_PAD]=source[j*FM_N+i];
  const clear=new Uint8Array(PN*PN);
  for(let j=0;j<PN;j++)for(let i=0;i<PN;i++){
    if(!grid[j*PN+i])continue;let r=1;
    search:for(;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const x=i+dx,y=j+dy;if(x>=0&&y>=0&&x<PN&&y<PN&&!grid[y*PN+x])break search;
    }
    clear[j*PN+i]=r;
  }
  return[key,{grid,clear}];
}));
const padGrid=()=>fleetPads.shared.grid;
const padClear=()=>fleetPads.shared.clear;
function padCellOf(p:Vec){const c=fleetCellOf(p);return{i:clamp(c.i+FM_PAD,0,PN-1),j:clamp(c.j+FM_PAD,0,PN-1)};}
function padCenter(i:number,j:number){return fleetCellCenter(i-FM_PAD,j-FM_PAD);}
function padNearestOpen(c:{i:number;j:number}){if(padGrid()[c.j*PN+c.i])return c;for(let r=1;r<30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const i=c.i+dx,j=c.j+dy;if(i>=0&&j>=0&&i<PN&&j<PN&&padGrid()[j*PN+i])return{i,j};}return c;}
// hedef hücresine göre mesafe alanları (en son 8 hedef önbellekte)
const fleetFields=new Map<string,Float32Array>();
function buildFleetField(t:{i:number;j:number}){
  const D=new Float32Array(PN*PN).fill(Infinity),heap:number[]=[],push=(k:number)=>{heap.push(k);let n=heap.length-1;while(n>0){const p=(n-1)>>1;if(D[heap[p]]<=D[heap[n]])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}},
    pop=()=>{const top=heap[0],last=heap.pop()!;if(heap.length){heap[0]=last;let n=0;for(;;){const l=n*2+1,r=l+1;let m=n;if(l<heap.length&&D[heap[l]]<D[heap[m]])m=l;if(r<heap.length&&D[heap[r]]<D[heap[m]])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
  const s0=t.j*PN+t.i;D[s0]=0;push(s0);
  while(heap.length){const k=pop(),x=k%PN,y=(k-x)/PN;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=PN||ny>=PN)continue;const j=ny*PN+nx;if(!padGrid()[j])continue;if(dx&&dy&&(!padGrid()[y*PN+nx]||!padGrid()[ny*PN+x]))continue;
    const cl=padClear()[j],cost=(dx&&dy?1.414:1)*(cl>=3?1:cl===2?1.8:3.5),nd=D[k]+cost;if(nd<D[j]){D[j]=nd;push(j);}}}
  return D;
}
// from: yolu bulunacak gemi (varsayılan oyuncu); kuşatmada müttefik kaptanlar da kullanır
// Küçük adalar: hedefe giden doğru bir adanın içinden geçiyorsa gemi adanın çevresinde yörüngeye alınır.
// Dolanma yönü (saat yönü / tersi) hedef başına bir kez seçilir ve korunur; böylece gemi yarı yolda fikir değiştirip
// iki yan arasında gidip gelmez. Ara nokta her karede gemiden ileri doğru kayar, doğru açılınca doğrudan hedefe gidilir.
const detourSides=new WeakMap<Vec,Map<number,number>>();
function islandDetour(from:Vec,target:Vec):Vec{
  const dx=target.x-from.x,dy=target.y-from.y,L2=dx*dx+dy*dy;if(L2<1)return target;
  let best:{t:number;i:number}|null=null;
  islands.forEach((island,i)=>{const block=island.r*.72+28+22;
    const t=((island.x-from.x)*dx+(island.y-from.y)*dy)/L2;
    // yalnız doğrunun iç kısmı adaya giriyorsa engel say: gemi ya da hedef kıyıdaysa uç noktalar sayılmaz
    if(t<=0||t>=1)return;const d=Math.hypot(from.x+dx*t-island.x,from.y+dy*t-island.y);
    if(d<block&&(!best||t<best.t))best={t,i};});
  if(!best)return target;
  const bi=(best as {t:number;i:number}).i,island=islands[bi],R=island.r*.72+28+60;
  const as=Math.atan2(from.y-island.y,from.x-island.x),at=Math.atan2(target.y-island.y,target.x-island.x);
  let sides=detourSides.get(target);if(!sides){sides=new Map();detourSides.set(target,sides);}
  let side=sides.get(bi);
  if(side===undefined){let diff=at-as;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;side=diff>=0?1:-1;sides.set(bi,side);}
  // kalan yay seçilen yönde ölçülür; uzaktaki gemi teğet noktasına, kıyıdaki gemi ~35° ileriye yönelir
  let rem=(at-as)*side;while(rem<0)rem+=Math.PI*2;while(rem>Math.PI*2)rem-=Math.PI*2;if(rem>Math.PI*1.6)rem=0;
  const D=Math.hypot(from.x-island.x,from.y-island.y),step=Math.max(.6,D>R?Math.acos(R/D):0),a=as+side*Math.min(rem,step);
  return{x:island.x+Math.cos(a)*R,y:island.y+Math.sin(a)*R};
}
function routeVia(target:Vec,from:Vec=player):Vec{const way=fleetRoute(target,from);return way===target?islandDetour(from,target):way;}
function fleetRoute(target:Vec,from:Vec):Vec{
  if(!fleetEnterable()||fleetWideLine(from,target))return target;
  const t=padNearestOpen(padCellOf(target)),key=`${currentMap}:${t.i},${t.j}`;
  let D=fleetFields.get(key);if(!D){D=buildFleetField(t);fleetFields.set(key,D);if(fleetFields.size>8)fleetFields.delete(fleetFields.keys().next().value!);}let c=padNearestOpen(padCellOf(from));if(!Number.isFinite(D[c.j*PN+c.i]))return target;
  // Yol boyunca kalın çizgiyle görülebilen en uzak hücre; kıyıya çok yakınken ince çizgiye, o da olmazsa sıradaki hücreye düşülür.
  let way:Vec|null=null,first:Vec|null=null;
  for(let step=0;step<80;step++){const here=D[c.j*PN+c.i];if(here<=0){if(fleetWideLine(from,target)||(!way&&fleetClearLine(from,target)))return target;break;}let next=c,nd=here;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=c.i+dx,j=c.j+dy;if(i<0||j<0||i>=PN||j>=PN)continue;const v=D[j*PN+i];if(v<nd){nd=v;next={i,j};}}
    if(next===c)break;c=next;const cand=padCenter(c.i,c.j);if(!first)first=cand;
    if(fleetWideLine(from,cand))way=cand;else if(!way&&step<3&&fleetClearLine(from,cand))way=cand;else if(way||step>=3)break;}
  return way??first??target;
}
function insideOwnLagoon(p:Vec){return hasFleetIsland()&&fleetOwner()==='player'&&fleetNav(p)===2;}
function navigablePoint(point:Vec){
  const fc=fleetCollision(point);if(fc)return{x:fc.x,y:fc.y};
  for(const island of islands){const shore=island.r*.72+38,d=dist(point,island);if(d<shore){const a=Math.atan2(point.y-island.y,point.x-island.x);return{x:island.x+Math.cos(a)*shore,y:island.y+Math.sin(a)*shore};}}
  return{x:clamp(point.x,25,WORLD_WIDTH-25),y:clamp(point.y,25,WORLD_HEIGHT-25)};
}
function resolveIslandCollision(){
  const fc=fleetCollision(player);if(!fc&&hasFleetIsland())fleetSafe={x:player.x,y:player.y};if(fc){const hard=!fleetSafe||(fc.x!==player.x&&fc.y!==player.y);player.x=fc.x;player.y=fc.y;player.speed*=hard?.5:.9;if(!routeTarget)destination=null;if(collisionNotice<=0){toast(fleetEnterable()?`${fc.name} karasına çıkılamaz — lagüne doğu ve batı kapılarından girilir`:`${fc.name} rakip filonun adası — içeri girilemez`);collisionNotice=2;}}
  for(const island of islands){const shore=island.r*.72+28,d=dist(player,island);if(d<shore){const a=d>.01?Math.atan2(player.y-island.y,player.x-island.x):player.angle-Math.PI/2;player.x=island.x+Math.cos(a)*shore;player.y=island.y+Math.sin(a)*shore;player.speed*=.28;destination=null;if(collisionNotice<=0){toast(`${island.name} kıyısına daha fazla yaklaşamazsın`);collisionNotice=2;}}}
}
function setZoom(value:number){camera.targetZoom=clamp(value,.5,1.15);ui('zoomValue').textContent=`${Math.round(camera.targetZoom*100)}%`;}
function targetExists(t:Target){return enemies.includes(t);}

// Saldırı menzil dışından başlatılırsa gemi hedefe yaklaşır; kaptan rota verirse yaklaşma biter.
let attackChase=false;
function toggleAttack(){if(!selected||!targetExists(selected)){toast('Önce bir hedef seç');return;}state.attacking=!state.attacking;attackChase=state.attacking&&dist(player,selected)>effectiveRange();if(state.attacking){state.repairing=false;fireAtTarget();}ui('attack').classList.toggle('active',state.attacking);toast(state.attacking?'Otomatik saldırı başladı':'Saldırı durduruldu');}
function toggleRepair(){
  if(ls){toast('Lanetli Sular\'da tamir kullanılamaz · herkes eşit gemiyle savaşır');return;}
  if(state.hp>=effectiveMaxHp()){toast('Gövde zaten tamamen sağlam');return;}
  const danger=enemies.some(e=>e.aggro&&dist(e,player)<520);
  if(danger||state.attacking){toast('Savaş durumundayken tamir yapılamaz');return;}
  if(dom){toast('Deniz Hakimiyeti\'nde tamir yapılamaz');return;}
  state.repairing=!state.repairing;toast(state.repairing?'Açık deniz tamiri başladı':'Tamir durduruldu');
}

// Hesapla oynarken hasarı oyun sunucusunun hesapladığı hedefler: NPC, paylaşılan boss, kuşatma, ada kulesi, oyuncu
function netTarget(t:Target|null):{k:string;id:string}|null{if(!session.account||!t||t.kind!=='ship')return null;
  if(t.net)return{k:'n',id:t.net.id};if(t.boss&&t.shared)return{k:'b',id:t.shared};if(t.siege&&siegeOnline&&(t.tower||t.commander))return{k:'s',id:String(siegePiece(t))};
  if(t.tower&&!t.siege&&t.towerIndex!==undefined)return{k:'t',id:String(t.towerIndex)};if(t.remote){if(t.remote.adm&&mapDef().tier<2){toast('Yönetici gemisi bu denizde korunuyor');return null;}return{k:'p',id:t.remote.id};}return null;}
function fireAtTarget(){
  if(!selected||player.cooldown>0||dist(player,selected)>effectiveRange())return;
  // Şifa yalnız oyunculara (ve dost kulelere); hasar veren gülle dosta sıkılamaz
  const friendTarget=selected.kind==='ship'&&!!selected.captain;
  if(ls){lsFire();return;}
  if(state.ammo==='heal'&&dom){toast('Deniz Hakimiyeti\'nde şifa güllesi kullanılamaz');stopAttack();return;}
  if(state.ammo==='heal'&&!friendTarget){toast('Şifa Güllesi yalnız oyunculara ve dost kulelere sıkılır');stopAttack();return;}
  if(state.ammo!=='heal'&&isAlly(selected)){stopAttack();return;}
  if(state.ammo==='chain'&&state.chainAmmo<=0){state.ammo='iron';toast('Zincir güllesi tükendi');}
  if(isSpecial(state.ammo)&&arsenal[state.ammo]<=0){toast(`${SPECIAL_AMMO[state.ammo].name} tükendi`);if(state.ammo==='heal'){stopAttack();renderQuickSlots();return;}state.ammo='iron';renderQuickSlots();}
  // Seafight mantığı: her top 1 gülle harcar. Stok top sayısından azsa kalan toplar demir gülle atar; demir de biterse o toplar ateş etmez.
  const stock=state.ammo==='chain'?state.chainAmmo:isSpecial(state.ammo)?arsenal[state.ammo]:0,loaded=Math.min(state.cannon,stock);
  const ironUsed=state.ammo==='heal'?0:Math.min(state.cannon-loaded,state.ironAmmo);
  if(loaded+ironUsed<=0){toast('Demir gülle bitti — marketten altınla alabilirsin');stopAttack();return;}
  const fx=Math.sin(player.angle),fy=-Math.cos(player.angle),tx=selected.x-player.x,ty=selected.y-player.y;
  const powderF=state.ammo==='heal'?1:useConsumable('powder'),side=fx*ty-fy*tx>0?-1:1,rageF=rageSalvo(rage),damage=salvoDamage(myLoadout(),state.ammo,loaded,ironUsed,powderF>1,rageF>1);
  // Şifa salvosu en çok 13–15 bin can doldurur (top sayısına göre daha az olabilir)
  const amount=state.ammo==='heal'?Math.round(Math.min(damage,(selected.maxHp||163000)*(.08+Math.random()*.012))):damage;
  salvoQueue.push({delay:0,target:selected,side,slot:0,damage:amount,ammo:state.ammo,powder:powderF>1});
  {const tg=netTarget(selected);if(tg)sendAttack({...tg,a:state.ammo,n:loaded,i:ironUsed,p:powderF>1?1:0,r:rageF>1?1:0});else sendSalvo(state.ammo,loaded,ironUsed,powderF>1?1:0);}
  if(ironUsed){state.ironAmmo-=ironUsed;gainElitePoints(ironUsed*IRON_EP_PER_BALL);if(state.ironAmmo<=0)toast('Demir gülle bitti — marketten altınla alabilirsin');}
  if(state.ammo==='chain'){state.chainAmmo-=loaded;gainElitePoints(loaded*ELITE_POINTS_PER_BALL.chain);bumpAch('eliteBalls',loaded);}
  else if(isSpecial(state.ammo)){arsenal[state.ammo]-=loaded;saveArsenal(arsenal);gainElitePoints(loaded*ELITE_POINTS_PER_BALL[state.ammo]);bumpAch('eliteBalls',loaded);}
  saveAccount();renderQuickSlots();
  player.cooldown=reloadTime(myLoadout(),state.ammo);
}
function stopAttack(){state.attacking=false;attackChase=false;ui('attack').classList.remove('active');}
function gainElitePoints(ep:number){
  if(dom||ls)return;// Deniz Hakimiyeti / Lanetli Sular: maçta elit puan ilerlemez, maç sonunda sunucu verir
  ep*=epMult();if(ep<=0)return;const before=eliteLevelFromEp(state.elitePoints);state.elitePoints=Math.round((state.elitePoints+ep)*1000)/1000;const after=eliteLevelFromEp(state.elitePoints);saveAccount();
  if(after>before&&elitePurchased){const ship=ELITE_SHIPS.find(x=>x.level===after);rewardNotice(`Elit ${after} açıldı${ship?` · ${ship.name} tersanede`:''}`);}
}
// Elit puan çubuğu: mevcut elit seviyesinden bir sonrakine ilerleme
// Tersanedeki elit puan çubuğu: solda bulunulan elit seviye ve EP'si, sağda sonraki seviye, ortada mevcut EP
function eliteEpBar(){const ep=Math.floor(state.elitePoints),lvl=eliteLevelFromEp(ep),max=lvl>=ELITE_MAX_LEVEL,lo=eliteLevelEp(Math.max(1,lvl)),hi=max?lo:eliteLevelEp(Math.max(1,lvl)+1),pct=max?100:Math.max(0,Math.min(100,(ep-lo)/Math.max(1,hi-lo)*100));
  const f=(n:number)=>n.toLocaleString('tr-TR');
  return`<section class="ep-progress"><div class="ep-ends"><span><b>ELİT ${Math.max(1,lvl)}</b>${f(lo)} EP</span><span>${max?'<b>EN YÜKSEK SEVİYE</b>':`<b>ELİT ${Math.max(1,lvl)+1}</b>${f(hi)} EP`}</span></div><i><em style="width:${pct}%"></em><strong>${f(ep)} EP</strong></i>${elitePurchased||ELITE_TEST_MODE?'':'<small>Elit gemiler elit lisansı satın alınınca açılır; EP biriktirmeye şimdiden başlayabilirsin.</small>'}</section>`;}
function eliteProgress(){const lvl=eliteLevelFromEp(state.elitePoints),lo=eliteLevelEp(lvl),hi=lvl>=ELITE_MAX_LEVEL?lo:eliteLevelEp(lvl+1);
  return{text:lvl>=ELITE_MAX_LEVEL?Math.floor(state.elitePoints).toLocaleString('tr-TR'):`${Math.floor(state.elitePoints).toLocaleString('tr-TR')} / ${hi.toLocaleString('tr-TR')}`,pct:lvl>=ELITE_MAX_LEVEL?100:Math.min(100,(state.elitePoints-lo)/(hi-lo)*100)};}
function releaseSalvo(round:SalvoRound){
  if(!targetExists(round.target))return;
  const d=dist(player,round.target);
  const a=Math.atan2(round.target.y-player.y,round.target.x-player.x);
  const fx=Math.sin(player.angle),fy=-Math.cos(player.angle),rx=Math.cos(player.angle),ry=Math.sin(player.angle),speed=510;
  const tx=(round.target.x-player.x)/Math.max(1,d),ty=(round.target.y-player.y)/Math.max(1,d),forwardDot=fx*tx+fy*ty;
  const muzzle=forwardDot>.55?{x:fx*24,y:fy*24}:forwardDot<-.55?{x:-fx*20,y:-fy*20}:{x:rx*round.side*18,y:ry*round.side*18};
  const x=player.x+muzzle.x,y=player.y+muzzle.y;
  {const t=round.target as Enemy;if(!session.account&&t.kind==='ship'&&t.remote)sendFire({from:myNetId,to:t.remote.id,x,y,tx:t.x,ty:t.y,damage:round.damage,ammo:round.ammo});}
  shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:Math.max(1.1,d/speed+.5),owner:'player',damage:round.damage,hit:false,ammo:round.ammo,target:round.target,powder:round.powder,net:!!netTarget(round.target)});
  playCannon(state.cannonType,round.ammo==='heal'?'iron':round.ammo);
  muzzleFlash(x,y,Math.atan2(muzzle.y,muzzle.x));
}
// NPC ve canavar atış menzili: başlangıç topunun (Döküm 390) altında, oyuncu vuramadığı yerden hasar yemesin
const NPC_FIRE_RANGE=360;
// Güvenli haritalar dışında NPC, oyuncu menzile girince saldırır; oyuncu menzilden çıkınca birkaç saniye sonra vazgeçer
function proximityAggro(u:{aggro:boolean;combatTimer:number},d:number){
  if(d>=NPC_FIRE_RANGE||mapDef().safe||state.hp<=0||state.invulnerable>0)return;
  if(!u.aggro){u.aggro=true;u.combatTimer=4;}else u.combatTimer=Math.max(u.combatTimer,4);
}
function enemyFire(e:Enemy){
  if(e.boss){bossFire(e);return;}
  const a=Math.atan2(player.y-e.y,player.x-e.x);playEnemyCannon(dist(e,player),(e.x-player.x)/600);
  shots.push({x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:2.2,owner:'enemy',damage:e.damage*(.85+Math.random()*.3),hit:false,ammo:'iron'}); e.cooldown=e.reload+Math.random()*.55;muzzleFlash(e.x+Math.cos(a)*16,e.y+Math.sin(a)*16,a,36);
}
// Batınca bulunduğun denizde, düşmanlardan uzak rastgele bir noktada %10 gövdeyle yeniden doğ.
// Batınca kısa yazı: kimin batırdığı (oyuncu gülleleri kaptanı taşır; diğerlerinde en yakın saldıran düşman)
function killerNear(){let best='',bd=Infinity;
  for(const e of enemies)if(e.aggro||e.tower){const d=dist(e,player);if(d<bd){bd=d;best=e.name;}}
  return best||'düşman';}
function showSunkBy(name:string){rewardNotice(`${name} tarafından batırıldın`,'battle');}
function respawn(){
  if(siege){siegeRespawn();return;}
  if(dom){domRespawn();return;}
  if(ls){lsDied();return;}
  const deathMap=currentMap;
  currentMap=deathMap;
  try{localStorage.setItem(WORLD_STORAGE,deathMap);}catch{}
  const spot=randomSafePlayerPoint();
  player.x=spot.x;player.y=spot.y;player.speed=0;destination=null;routeTarget=null;camera.x=player.x;camera.y=player.y;freeLook=null;
  fleetSafe={x:spot.x,y:spot.y};collisionNotice=0;
  state.hp=Math.max(1,Math.round(effectiveMaxHp()*.1));state.repairing=true;state.invulnerable=4;state.attacking=false;selected=null;shots.length=0;salvoQueue.length=0;
  enemies.forEach(e=>{e.aggro=false;e.combatTimer=0;});ui('attack').classList.remove('active');
  mapFade=1;playSplash();saveAccount();toast(`Gemin battı — ${mapDef().key} ${coordLabel(player)} konumunda %10 gövdeyle yeniden doğdun`);
}
// Vuruş: parlak çekirdek ışığı, patlama animasyonu, savrulup suya düşen tahta kıymıkları, parlak korlar ve açık renkli barut dumanı
// Damage numbers provide impact feedback; no burst particles are allocated.
function burst(_x:number,_y:number,_large=false){}
// Iska: suya düşen güllenin su sütunu ve köpük halkası
// Oyuncuya uzaklığa göre ses seviyesi (0..1)
function earGain(p:Vec){return Math.max(0,Math.min(1,1.15-dist(p,player)/900));}
function splashAt(x:number,y:number,_size=110){const eg=earGain({x,y});if(eg>.05)playSplash(eg*.8);}
// Özel güllelerin isabet etkisi: can emici şansa bağlı olarak oyuncuyu onarır (src/arsenal.ts LEECH)
function ammoImpact(s:Shot,target:Target,hit:number){
  if(s.owner!=='player')return;
  if(s.ammo==='leech'){const heal=leechHeal(hit,target.kind==='ship'&&!!target.captain,effectiveMaxHp());if(heal<=0)return;playHeal();state.hp=Math.min(effectiveMaxHp(),state.hp+heal);healText(player.x,player.y,heal);
    for(let n=0;n<4;n++){const a=Math.atan2(player.y-target.y,player.x-target.x)+(Math.random()-.5)*.8,sp=dist(player,target)/.7;particles.push({x:target.x,y:target.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.7,maxLife:.7,kind:'soul',z:18,size:26});}}
}
// Namlu alevi ve top dumanı
function muzzleFlash(x:number,y:number,angle:number,size=40){particles.push({x,y,vx:0,vy:0,life:.2,maxLife:.2,kind:'flash',rot:angle,size,z:6});for(let n=0;n<2;n++)particles.push({x,y,vx:Math.cos(angle)*(30+n*25)+(Math.random()-.5)*10,vy:Math.sin(angle)*(30+n*25)+(Math.random()-.5)*10,life:.9+Math.random()*.4,maxLife:1.3,kind:'wisp',z:6,size:9+n*5});}
const WRECK_TIME=1.1;
const MAX_WRECKS=24;
// Hasar yazısı: verdiğin hasar barut açıkken sarı, kapalıyken kırmızı; aldığın hasar kalkan açıkken mavi, kapalıyken kırmızı
const DMG_GOLD='#ffd23a',DMG_RED='#ff4a3a',DMG_BLUE='#5fb8ff';
let playerSlow=0,repairClock=0;
// Hasar almadan bu kadar saniye geçince otomatik tamir başlar (tamir butonu yok)
const AUTO_REPAIR_DELAY=3;
function healText(x:number,y:number,value:number){particles.push({x,y:y-14,vx:0,vy:-22,life:1.1,maxLife:1.1,kind:'damage',color:'#5ee07a',text:`+${Math.round(value).toLocaleString('tr-TR')}`});}
function damageText(x:number,y:number,value:number,color=DMG_GOLD){particles.push({x,y,vx:0,vy:-24,life:1,maxLife:1,kind:'damage',color,text:`-${Math.round(value).toLocaleString('tr-TR')}`});}
let toastTimer=0;
function toast(msg:string){ui('toast').textContent=msg;ui('toast').classList.add('show');toastTimer=2.2;}
// Üstte küçük bildirim satırları (en çok 3, 4 sn) ve seyir defteri kaydı. kind 'none' yalnız gösterir, deftere yazmaz.
const logbook=loadLog();
function rewardNotice(msg:string,kind:LogKind|'none'='gain',data:Partial<LogEntry>={}){
  const text=msg.replace(/\s{3,}/g,' · '),feed=ui('sinkNotices'),line=document.createElement('div');
  line.textContent=text;feed.appendChild(line);while(feed.children.length>3)feed.firstElementChild!.remove();setTimeout(()=>line.remove(),4000);
  if(kind!=='none'){addLog(logbook,{t:Date.now(),kind,text,...data});saveLog(logbook);if(ui('logOverlay').classList.contains('open'))renderLogbook();}
}
function sinkNotice(name:string,sp:number){
  rewardNotice(sp>0?`${name} batırıldı · +${fmt(sp)} SP kazanıldı`:`${name} batırıldı · günlük SP sınırına ulaşıldı`,'battle',{sp,sink:true});
}
function saveQuestState(){localStorage.setItem(QUEST_STORAGE,JSON.stringify({rulesVersion:2,active:state.activeQuest,progress:questProgress,cooldowns:questCooldownUntil}));}
function saveAccount(){localStorage.setItem(ACCOUNT_STORAGE,JSON.stringify({pearls:state.pearls,gold:state.gold,fame:state.fame,level:state.level,maxHp:state.maxHp,hp:state.hp,chainAmmo:state.chainAmmo,ironAmmo:state.ironAmmo,elitePoints:state.elitePoints,eliteEconomyVersion:ELITE_ECONOMY_VERSION,battlePoints:state.battlePoints,cannonType:state.cannonType,cannonInventory,mountedCannons,equipOwned,equipped,quickSlots,quickKnown,upgrades,eliteShip:activeEliteShip,activeShip,elitePurchased,currentMap}));try{localStorage.setItem(WORLD_STORAGE,currentMap);}catch{}}
// Atışı etkileyen her şey tek yerde: oyun hasarı bununla hesaplar, aynı bilgiler oyun sunucusuna da bildirilir
function myLoadout():Loadout{if(ls)return LS_LOADOUT;const eq=equipBonus(),el=eliteBonus();return{cannons:state.cannon,type:state.cannonType,upDamage:upgrades.damage,upReload:upgrades.reload,upRange:upgrades.range,
  crewDamage:bonus.damage,crewReload:bonus.reload,crewRange:bonus.range,equipDamage:eq.damage,equipReload:eq.reload,equipRange:eq.range,achDamage:achBonus().damage,eliteDamage:el.damage,eliteReload:el.reload,hero:heroDamage()};}
function effectiveRange(){return rangeOf(myLoadout());}
function effectiveSpeed(){if(ls)return LS_SPEED*(abilityActive('speed')?LS_SPEED_BOOST:1)*(playerSlow>0?CHAIN_SLOW.factor:1);return(128+upgrades.speed*5)*bonus.speed*(1+equipBonus().speed+eliteBonus().speed)*(abilityActive('speed')?SPEED_BOOST:1)*(rageActive(rage)?RAGE_SPEED:1)*(playerSlow>0?CHAIN_SLOW.factor:1);}
function cannonCapacity(){return earnedEliteLevel()>0?ELITE_CANNON_CAPACITY:BASE_CANNONS;}
function mountedCannonCount(){return (Object.keys(mountedCannons) as CannonKind[]).reduce((sum,kind)=>sum+mountedCannons[kind],0);}
function cannonAsset(kind:CannonKind){
  return cannonAssetSources[kind]?`<img src="${cannonAssetSources[kind]}" alt="${CANNONS[kind].name} Top" draggable="false"/>`:'<span class="asset-loading"></span>';
}
function cooldownText(until:number){const minutes=Math.max(1,Math.ceil((until-Date.now())/60000)),hours=Math.floor(minutes/60),mins=minutes%60;return hours>0?`${hours} sa ${mins} dk`:`${mins} dk`;}
let pendingUpgrade:UpgradeKind|null=null;
function upgradeCost(kind:UpgradeKind){return Math.round(UPGRADES[kind].pearls*UPGRADE_PRICE_MULTIPLIER*(1+upgrades[kind]*.55));}
function upgradeIcon(kind:UpgradeKind){return `<i class="sprite icon-${kind}"></i>`;}
function openShipMenu(){pendingUpgrade=null;invSelected=state.cannonType;renderShipMenu();ui('shipOverlay').classList.add('open');}
function closeShipMenu(){pendingUpgrade=null;ui('shipOverlay').classList.remove('open');}
// Envanter (Seafight tarzı): solda depo, sağda gemi ızgarası; küçük top simgeleri adetleriyle durur.
// Simgeye dokunup adet yazılır, oklarla taşınır; ya da simge öteki tarafa sürüklenir (sağa: gemiye, sola: depoya).
let invSelected:CannonKind='cast',invMode:'cannon'|'equip'='cannon',invEquipSel:string|null=null;
const INV_CELLS=9;
function renderShipMenu(){
  document.querySelectorAll<HTMLButtonElement>('[data-inv-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.invMode===invMode);b.onclick=()=>{invMode=b.dataset.invMode as typeof invMode;renderShipMenu();};});
  if(invMode==='equip'){renderEquipInventory();return;}
  state.cannon=mountedCannonCount();const activeCannon=CANNONS[state.cannonType],kinds=Object.keys(CANNONS) as CannonKind[];
  ui('shipSummary').innerHTML=`<b>${state.cannon} / ${cannonCapacity()}</b><small>SALVO HASARI ${fmt(Math.round(state.cannon*BALL_DAMAGE*(1+equipBonus().damage+achBonus().damage+eliteBonus().damage+heroDamage())*(1+upgrades.damage*.11)*activeCannon.damage*bonus.damage))}</small>`;
  const tiles=(side:'depot'|'ship')=>{const list=kinds.filter(k=>(side==='ship'?mountedCannons[k]:cannonInventory[k])>0);
    return list.map(k=>`<button class="inv-tile ${invSelected===k?'selected':''} ${side==='ship'&&state.cannonType===k?'active':''}" data-inv="${k}" data-side="${side}" title="${CANNONS[k].name} Top">${cannonAsset(k)}<b>${fmt(side==='ship'?mountedCannons[k]:cannonInventory[k])}</b>${side==='ship'&&state.cannonType===k?'<i>AKTİF</i>':''}</button>`).join('')+'<span class="inv-empty"></span>'.repeat(Math.max(0,INV_CELLS-list.length));};
  ui('invDepot').innerHTML=tiles('depot');ui('invShip').innerHTML=tiles('ship');
  const c=CANNONS[invSelected],active=state.cannonType===invSelected,prev=(document.getElementById('invAmount') as HTMLInputElement|null)?.value??'1';
  ui('cannonRows').innerHTML=`<div class="inv-info-art">${cannonAsset(invSelected)}</div><h3>${c.name} Top</h3>
    <dl><dt>Hasar</dt><dd>×${c.damage.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})}</dd><dt>Menzil</dt><dd>${c.range}</dd><dt>Dolum</dt><dd>${c.reload.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} sn</dd><dt>Depoda</dt><dd>${fmt(cannonInventory[invSelected])}</dd><dt>Gemide</dt><dd>${fmt(mountedCannons[invSelected])}</dd></dl>
    <label class="inv-amount"><span>Adet</span><input type="number" min="1" value="${prev}" id="invAmount"/><button type="button" id="invAll" title="Hepsini seç">HEPSİ</button></label>
    <button class="inv-equip" id="invEquip" ${mountedCannons[invSelected]<=0||active?'disabled':''}>${active?'AKTİF TOP':'AKTİF YAP'}</button>`;
  const amount=()=>Math.max(1,Math.floor(Number((ui('invAmount') as HTMLInputElement).value)||1));
  ui('invAll').onclick=()=>{(ui('invAmount') as HTMLInputElement).value=String(Math.max(cannonInventory[invSelected],mountedCannons[invSelected],1));};
  ui('invToShip').onclick=()=>{if(cannonInventory[invSelected]<=0){toast('Depoda bu toptan yok');return;}moveCannon(invSelected,true,amount());};
  ui('invToDepot').onclick=()=>{if(mountedCannons[invSelected]<=0){toast('Gemide bu toptan yok');return;}moveCannon(invSelected,false,amount());};
  ui('invEquip').onclick=()=>equipCannon(invSelected);
  bindCannonDrag();
}
// Donanım bölümü: depoda sahip olunan parçalar, gemide 4 yuva (yelken, pruva heykeli, gövde zırhı, top kundağı)
function renderEquipInventory(){
  const b=equipBonus();ui('shipSummary').innerHTML=`<b>${EQUIP_SLOTS.filter(s=>equipped[s.id]).length} / ${EQUIP_SLOTS.length}</b><small>TAKILI DONANIM</small>`;
  const owned=EQUIPMENT.filter(e=>(equipOwned[e.id]??0)>0);
  ui('invDepot').innerHTML=owned.map(e=>`<button class="inv-tile equip-tile rarity-${e.rarity} ${invEquipSel===e.id?'selected':''}" data-inv="${e.id}" data-side="depot" title="${e.name}">${equipIcon(e.id)}<b>${fmt(equipOwned[e.id])}</b></button>`).join('')+'<span class="inv-empty"></span>'.repeat(Math.max(0,INV_CELLS-owned.length));
  ui('invShip').innerHTML=EQUIP_SLOTS.map(sl=>{const id=equipped[sl.id],e=id?equipById(id):undefined;
    return e?`<button class="inv-tile equip-tile rarity-${e.rarity} ${invEquipSel===e.id?'selected':''}" data-inv="${e.id}" data-side="ship" title="${e.name}">${equipIcon(e.id)}<small class="slot-name">${sl.name}</small></button>`:`<span class="inv-empty equip-slot"><small>${sl.name}</small></span>`;}).join('');
  const e=invEquipSel?equipById(invEquipSel):undefined;
  ui('cannonRows').innerHTML=e?`<div class="inv-info-art">${equipIcon(e.id,'equip-icon big')}</div><h3>${e.name}</h3><dl><dt>Yuva</dt><dd>${EQUIP_SLOTS.find(s=>s.id===e.slot)!.name}</dd><dt>Nadirlik</dt><dd class="rarity-text-${e.rarity}">${RARITY_NAMES[e.rarity]}</dd><dt>Etki</dt><dd>${equipStatText(e.stats)}</dd><dt>Depoda</dt><dd>${fmt(equipOwned[e.id]??0)}</dd><dt>Gemide</dt><dd>${equipped[e.slot]===e.id?'Takılı':'—'}</dd></dl>
    <button class="inv-equip" id="invEquipToggle">${equipped[e.slot]===e.id?'YUVADAN ÇIKAR':'GEMİYE TAK'}</button>`
    :`<h3>Donanım</h3><p class="inv-hint">Bir parçaya dokun. Sağa sürükle ya da ➡ ile gemiye tak; ⬅ ile depoya al.</p><dl><dt>Hız</dt><dd>+%${Math.round(b.speed*100)}</dd><dt>Top hasarı</dt><dd>+%${Math.round(b.damage*100)}</dd><dt>Can</dt><dd>+%${Math.round(b.hp*100)}</dd><dt>Dolum</dt><dd>−%${Math.round(b.reload*100)}</dd><dt>Menzil</dt><dd>+${b.range}</dd></dl>`;
  const toggle=document.getElementById('invEquipToggle');if(toggle&&e)toggle.onclick=()=>equipped[e.slot]===e.id?unequipSlot(e.slot):equipItem(e.id);
  ui('invToShip').onclick=()=>{if(!e)return;equipItem(e.id);};ui('invToDepot').onclick=()=>{if(!e)return;if(equipped[e.slot]===e.id)unequipSlot(e.slot);else toast('Bu parça gemide takılı değil');};
  bindCannonDrag();
}
function equipItem(id:string){
  const e=equipById(id);if(!e)return;if((equipOwned[id]??0)<=0){toast('Depoda bu parçadan yok — DONANIM sekmesinden alabilirsin');return;}
  const prev=equipped[e.slot];if(prev===id)return;const oldMax=effectiveMaxHp();if(prev)equipOwned[prev]=(equipOwned[prev]??0)+1;equipOwned[id]-=1;equipped[e.slot]=id;
  state.hp=Math.min(effectiveMaxHp(),state.hp*effectiveMaxHp()/oldMax);saveAccount();renderShipMenu();updateUI();toast(`${e.name} takıldı`);
}
function unequipSlot(slot:EquipSlot){
  const id=equipped[slot];if(!id)return;const oldMax=effectiveMaxHp();equipped[slot]=null;equipOwned[id]=(equipOwned[id]??0)+1;
  state.hp=Math.min(effectiveMaxHp(),state.hp*effectiveMaxHp()/oldMax);saveAccount();renderShipMenu();updateUI();toast(`${equipById(id)?.name} depoya alındı`);
}
function bindCannonDrag(){
  document.querySelectorAll<HTMLElement>('.inv-tile').forEach(tile=>tile.onpointerdown=ev=>{
    if(ev.button>0)return;const kind=tile.dataset.inv as CannonKind,fromShip=tile.dataset.side==='ship',equipMode=invMode==='equip';ev.preventDefault();
    if(equipMode){if(invEquipSel!==tile.dataset.inv){invEquipSel=tile.dataset.inv!;renderShipMenu();}}else if(invSelected!==kind){invSelected=kind;renderShipMenu();}
    const target=ui(fromShip?'invDepot':'invShip'),ghost=document.createElement('div');let moved=false;ghost.className='cannon-drag-ghost';ghost.innerHTML=equipMode?equipIcon(tile.dataset.inv!):cannonAsset(kind);
    const over=(e:PointerEvent)=>{const r=target.getBoundingClientRect(),dx=e.clientX-ev.clientX;return(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)||(fromShip?dx<-70:dx>70);};
    const move=(e:PointerEvent)=>{if(!moved&&Math.hypot(e.clientX-ev.clientX,e.clientY-ev.clientY)>6){moved=true;document.body.append(ghost);}if(!moved)return;ghost.style.transform=`translate(${e.clientX-32}px,${e.clientY-28}px)`;target.classList.toggle('drop-target',over(e));};
    const up=(e:PointerEvent)=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);ghost.remove();target.classList.remove('drop-target');
      if(moved&&e.type!=='pointercancel'&&over(e)){if(equipMode){const it=equipById(tile.dataset.inv!);if(it){if(fromShip)unequipSlot(it.slot);else equipItem(it.id);}return;}const input=document.getElementById('invAmount') as HTMLInputElement|null;moveCannon(kind,!fromShip,Math.max(1,Math.floor(Number(input?.value)||1)));}};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  });
}
// Top dükkânı: toplar altınla alınır ve depoya gider.
// Döküm top altınla; uzun, seri ve ağır toplar inciyle alınır (inci fiyatı sırasıyla artar).
const CANNON_PRICES:Record<CannonKind,Price>=CANNON_COSTS;
function equipIcon(id:string,cls='equip-icon'){const e=equipById(id);return e?`<i class="${cls} rarity-${e.rarity}" style="${equipIconStyle(e)}"></i>`:'';}
function openEquipShop(){renderEquipShop();ui('equipShopOverlay').classList.add('open');}
function closeEquipShop(){ui('equipShopOverlay').classList.remove('open');}
function renderEquipShop(){
  renderBuyRows('equipShopList',EQUIPMENT.map(e=>({id:e.id,name:e.name,art:`<div class="ammo-icon equip-shop-art rarity-${e.rarity}">${equipIcon(e.id)}<b>${fmt(equipOwned[e.id]??0)}</b></div>`,
    desc:`${EQUIP_SLOTS.find(s=>s.id===e.slot)!.name} · ${RARITY_NAMES[e.rarity]} · ${equipStatText(e.stats)}`,note:`Depoda ${fmt(equipOwned[e.id]??0)}${equipped[e.slot]===e.id?' · Gemide takılı':''} · ENVANTER → DONANIM'dan gemiye tak`,unit:e.price,
    give:(n:number)=>{equipOwned[e.id]=(equipOwned[e.id]??0)+n;},after:renderEquipShop})));
}
function openCannonShop(){renderCannonShop();ui('cannonShopOverlay').classList.add('open');}
function closeCannonShop(){ui('cannonShopOverlay').classList.remove('open');}
function renderCannonShop(){
  renderBuyRows('cannonShopList',(Object.keys(CANNONS) as CannonKind[]).map(kind=>{const c=CANNONS[kind];return{id:kind,name:`${c.name} Top`,art:`<div class="ammo-icon cannon-shop-art">${cannonAsset(kind)}</div>`,
    desc:`Hasar ×${c.damage.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} · Menzil ${c.range} · Dolum ${c.reload.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} sn`,note:`Depoda ${fmt(cannonInventory[kind])} · Gemide ${fmt(mountedCannons[kind])} · Toplar depoya gider`,unit:CANNON_PRICES[kind],
    give:(n:number)=>{cannonInventory[kind]+=n;},after:renderCannonShop};}));
}
// Gemi değişince (ör. elitten başlangıç gemisine) yuva sayısı düşebilir; taşan toplar depoya iner.
function fitCannonsToCapacity(){
  if(ELITE_TEST_MODE){fillTestCannons();return;}
  let over=mountedCannonCount()-cannonCapacity();if(over<=0)return;
  for(const kind of ['cast','long','rapid','heavy'] as CannonKind[]){if(kind===state.cannonType)continue;const n=Math.min(over,mountedCannons[kind]);mountedCannons[kind]-=n;cannonInventory[kind]+=n;over-=n;if(over<=0)break;}
  if(over>0){const n=Math.min(over,mountedCannons[state.cannonType]-1);mountedCannons[state.cannonType]-=n;cannonInventory[state.cannonType]+=n;}
  state.cannon=mountedCannonCount();toast('Yeni geminin top yuvası daha az — fazla toplar depoya indirildi');
}
function moveCannon(kind:CannonKind,toShip:boolean,amount=1){
  if(toShip){amount=Math.min(amount,cannonInventory[kind],cannonCapacity()-mountedCannonCount());if(amount<=0){toast(`Gemide yer yok (${cannonCapacity()} top sınırı)`);return;}cannonInventory[kind]-=amount;mountedCannons[kind]+=amount;}
  else{amount=Math.min(amount,mountedCannons[kind],mountedCannonCount()-1);if(amount<=0){toast('Gemide en az 1 top kalmalı');return;}mountedCannons[kind]-=amount;cannonInventory[kind]+=amount;if(state.cannonType===kind&&mountedCannons[kind]===0){state.cannonType=(Object.keys(mountedCannons) as CannonKind[]).find(type=>mountedCannons[type]>0)||'cast';}}
  state.cannon=mountedCannonCount();saveAccount();renderShipMenu();updateUI();
}
function openEliteShips(){previewShip=activeSpecialDesign??activeShip;shipyardTab=activeSpecialDesign?'special':'elite';renderEliteShips();ui('eliteShipOverlay').classList.add('open');}
function closeEliteShips(){ui('eliteShipOverlay').classList.remove('open');}
function equipStarterShip(){
  activeSpecialDesign=null;saveSpecialDesign(null);const oldMax=effectiveMaxHp();activeShip='starter';state.hp=Math.min(effectiveMaxHp(),Math.max(1,state.hp*effectiveMaxHp()/oldMax));fitCannonsToCapacity();saveAccount();renderEliteShips();updateUI();toast('Başlangıç gemisi seçildi');
}
function purchaseEliteOne(){
  if(elitePurchased)return;
  if(state.pearls<ELITE_ONE_PRICE){toast(`Elit 1 için ${fmt(ELITE_ONE_PRICE)} İnci gerekli`);return;}
  activeSpecialDesign=null;saveSpecialDesign(null);state.pearls-=ELITE_ONE_PRICE;elitePurchased=true;activeEliteShip='phantom';activeShip='phantom';previewShip='phantom';saveAccount();renderEliteShips();updateUI();rewardNotice('Elit 1 açıldı · Hayalet Kadırga','shop');toast('Hayalet Kadırga satın alındı');
}
// Tersane iki sekmeli: ELİT GEMİLER (başlangıç + 15 elit) ve ÖZEL GEMİLER (yalnızca görünüm tasarımları). Kartlarda kısa yazı.
let shipyardTab:'elite'|'special'='elite';
function renderEliteShips(){
  const isDesign=(id:string)=>id==='pirate-rage';
  const unlocked=ELITE_TEST_MODE?ELITE_MAX_LEVEL:elitePurchased?eliteLevelFromEp(state.elitePoints):0;
  const card=(id:string,name:string,art:string,requirement:string,effect:string,active:boolean,locked=false,label='SEÇ')=>
    `<article class="elite-card ${active?'active':''} ${previewShip===id?'previewed':''} ${locked?'locked':''}"><button class="ship-preview-button" data-preview="${id}" aria-label="${name} önizle" aria-pressed="${previewShip===id}">${art}<strong>${name}</strong></button><p class="ship-requirement">${requirement}</p><p class="ship-effect">${effect}</p><button class="ship-select" data-select-ship="${id}" ${locked||active&&!isDesign(id)?'disabled':''}>${active?(isDesign(id)?'ÇIKAR':'SEÇİLİ'):label}</button></article>`;
  const special=card('pirate-rage','Pirate Rage',`<img class="elite-art" src="${PIRATE_RAGE_DESIGN.card}" alt="" draggable="false"/>`,designOwned?'Özel tasarım':'Açılış Festivali ödülü',designOwned?'Sadece görünüm':'7 festival gününün hepsinde giriş yapana verilir',activeSpecialDesign==='pirate-rage',!designOwned);
  const starter=card('starter','Yedi Deniz','<span class="starter-ship-art" role="img" aria-label="Başlangıç gemisi"></span>','0 EP','Başlangıç gemisi',activeShip==='starter'&&!activeSpecialDesign);
  const cards=ELITE_SHIPS.map(ship=>{
    const purchase=ship.level===1&&!elitePurchased&&!ELITE_TEST_MODE;
    const requirement=`${eliteLevelEp(ship.level).toLocaleString('tr-TR')} EP${purchase?` · ${fmt(ELITE_ONE_PRICE)} İnci`:''}`;
    return card(ship.id,ship.name,`<img class="elite-art" src="${eliteArtUrl(ship.id)}" alt="" draggable="false"/>`,requirement,eliteBonusText(ELITE_REWARDS[ship.level],true,true),activeShip===ship.id&&!activeSpecialDesign,ship.level>unlocked&&!purchase,purchase?'SATIN AL':'SEÇ');
  }).join('');
  const grid=ui('eliteShipGrid'),scroll=ui('eliteShipGrid').parentElement!.scrollTop;
  const tab=(id:typeof shipyardTab,label:string)=>`<button data-shipyard-tab="${id}" class="${shipyardTab===id?'active':''}">${label}</button>`;
  grid.innerHTML=`<nav class="shipyard-tabs">${tab('elite','ELİT GEMİLER')}${tab('special','ÖZEL GEMİLER')}</nav>`+(shipyardTab==='special'?special:eliteEpBar()+starter+cards);
  grid.querySelectorAll<HTMLButtonElement>('[data-shipyard-tab]').forEach(b=>b.onclick=()=>{shipyardTab=b.dataset.shipyardTab as typeof shipyardTab;grid.parentElement!.scrollTop=0;renderEliteShips();});
  ui('eliteShipDetail').hidden=true;ui('eliteShipDetail').innerHTML='';
  grid.parentElement!.scrollTop=scroll;
  grid.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach(button=>button.onclick=()=>{
    previewShip=button.dataset.preview as ShipSelection|SpecialDesignId;
    grid.querySelectorAll<HTMLElement>('.elite-card').forEach(el=>el.classList.toggle('previewed',el.contains(button)));
    grid.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  });
  grid.querySelectorAll<HTMLButtonElement>('[data-select-ship]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.selectShip!;
    if(id==='pirate-rage'){if(!designOwned){toast('Pirate Rage, Açılış Festivali\'nin son ödülü');return;}activeSpecialDesign=activeSpecialDesign==='pirate-rage'?null:'pirate-rage';saveSpecialDesign(activeSpecialDesign);previewShip='pirate-rage';renderEliteShips();toast(activeSpecialDesign?'Pirate Rage tasarımı seçildi':'Geminin kendi görünümü seçildi');return;}
    if(id==='starter'){previewShip='starter';equipStarterShip();return;}
    const ship=ELITE_SHIPS.find(s=>s.id===id);if(!ship)return;
    if(ship.level===1&&!elitePurchased&&!ELITE_TEST_MODE){purchaseEliteOne();return;}
    if(ship.level>unlocked)return;
    activeSpecialDesign=null;saveSpecialDesign(null);const oldMax=effectiveMaxHp();activeEliteShip=ship.id;activeShip=ship.id;previewShip=ship.id;
    state.hp=Math.min(effectiveMaxHp(),Math.max(1,state.hp*effectiveMaxHp()/oldMax));fitCannonsToCapacity();saveAccount();renderEliteShips();updateUI();toast(`${ship.name} seçildi`);
  });
}
function openDevelopment(){pendingUpgrade=null;renderUpgrades();ui('developmentOverlay').classList.add('open');}
function closeDevelopment(){pendingUpgrade=null;ui('developmentOverlay').classList.remove('open');}
const DEV_BRANCHES:{name:string;icon:string;nodes:({kind:'pearl';id:UpgradeKind}|{kind:'point';id:TalentId})[]}[]=[
  {name:'Topçuluk',icon:'/assets/cannon-heavy-v1.webp',nodes:[{kind:'pearl',id:'damage'},{kind:'pearl',id:'range'},{kind:'pearl',id:'reload'},{kind:'point',id:'sapper'}]},
  {name:'Denizcilik',icon:'/assets/icon-ship-nav-v2.webp',nodes:[{kind:'pearl',id:'hull'},{kind:'pearl',id:'speed'},{kind:'pearl',id:'repair'},{kind:'point',id:'tough'},{kind:'point',id:'windcaller'}]},
  {name:'Yağma',icon:'/assets/icon-chest-v2.webp',nodes:[{kind:'point',id:'scavenger'},{kind:'point',id:'bounty'}]},
];
function renderUpgrades(){
  const free=talentPoints(state.level)-spentPoints(crew);
  ui('upgradeList').innerHTML=`<p class="talent-points">İnci: <b>${fmt(state.pearls)}</b> · Uzmanlık puanı: <b>${Math.max(0,free)}</b> <small>İnci ile temel güçler, seviye başına kazanılan uzmanlık puanıyla özel uzmanlıklar açılır.</small>${spentPoints(crew)>0?'<button id="resetTalents">PUANLARI SIFIRLA · 5 İNCİ</button>':''}</p><div class="talent-branches">${DEV_BRANCHES.map(branch=>`<section class="talent-branch"><header><img src="${branch.icon}" alt=""/><h3>${branch.name}</h3></header>${branch.nodes.map(node=>{
    if(node.kind==='pearl'){const item=UPGRADES[node.id],level=upgrades[node.id],maxed=level>=10;return`<button class="talent pearl-node ${level?'owned':''} ${maxed?'maxed':''} ${pendingUpgrade===node.id?'selected':''}" data-upgrade="${node.id}" ${maxed?'disabled':''}><span class="talent-icon">${upgradeIcon(node.id)}</span><span><strong>${item.name}</strong><small>${item.effect} / seviye</small></span><b>${level}/10<em>${maxed?'AZAMİ':`◈ ${fmt(upgradeCost(node.id))}`}</em></b></button>`;}
    const t=TALENTS[node.id],rank=crew.talents[node.id]||0,maxed=rank>=t.max;return`<button class="talent ${rank?'owned':''} ${maxed?'maxed':''}" data-talent="${node.id}" ${free<=0||maxed?'disabled':''}><img src="${t.icon}" alt=""/><span><strong>${t.name}</strong><small>${t.per} / kademe</small></span><b>${rank}/${t.max}<em>1 PUAN</em></b></button>`;}).join('')}</section>`).join('')}</div>`;
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button=>button.onclick=()=>requestUpgrade(button.dataset.upgrade as UpgradeKind));
  document.querySelectorAll<HTMLButtonElement>('[data-talent]').forEach(b=>b.onclick=()=>{const id=b.dataset.talent as TalentId;if(talentPoints(state.level)-spentPoints(crew)<=0)return;crew.talents[id]=(crew.talents[id]||0)+1;refreshBonus();renderUpgrades();toast(`${TALENTS[id].name} ${crew.talents[id]}. kademe`);});
  const reset=document.getElementById('resetTalents');if(reset)reset.onclick=()=>{if(state.pearls<5){toast('Sıfırlamak için 5 İnci gerekli');return;}state.pearls-=5;crew.talents={};saveAccount();refreshBonus();renderUpgrades();updateUI();toast('Uzmanlık puanları iade edildi');};
  if(!pendingUpgrade){ui('upgradeConfirm').classList.remove('visible');ui('upgradeConfirm').innerHTML='';return;}
  const item=UPGRADES[pendingUpgrade],cost=upgradeCost(pendingUpgrade);ui('upgradeConfirm').classList.add('visible');ui('upgradeConfirm').innerHTML=`<div><strong>${item.name} yükseltmesini onaylıyor musun?</strong><span>${fmt(cost)} İnci harcanacak.</span></div><button id="confirmUpgrade">SATIN AL</button><button id="cancelUpgrade">VAZGEÇ</button>`;
  ui('confirmUpgrade').onclick=buyUpgrade;ui('cancelUpgrade').onclick=()=>{pendingUpgrade=null;renderUpgrades();};
}
function equipCannon(kind:CannonKind){
  if(mountedCannons[kind]<=0){toast('Önce bu topu gemiye yerleştir');return;}
  state.cannonType=kind;player.cooldown=0;saveAccount();renderShipMenu();updateUI();toast(`${CANNONS[kind].name} Top kuşanıldı`);
}
function requestUpgrade(kind:UpgradeKind){pendingUpgrade=kind;renderUpgrades();}
function buyUpgrade(){
  if(!pendingUpgrade)return;const kind=pendingUpgrade,cost=upgradeCost(kind);
  if(state.pearls<cost){toast('Bu geliştirme için yeterli İncin yok');return;}
  state.pearls-=cost;upgrades[kind]++;
  if(kind==='hull'){state.maxHp=baseMaxHp();state.hp=Math.min(effectiveMaxHp(),state.hp+HP_PER_HULL);}
  pendingUpgrade=null;saveAccount();renderUpgrades();updateUI();rewardNotice(`${UPGRADES[kind].name} geliştirildi · seviye ${upgrades[kind]}`,'shop');
}
// Ortak satın alma satırı: adet kutusu + anlık toplam; SATIN AL onay penceresi açar, onaylanınca alınır.
type BuyRow={id:string;name:string;art:string;desc:string;note?:string;unit:Price;give:(n:number)=>void;after:()=>void};
const CURRENCY_NAME={gold:'altın',pearls:'inci'} as const;
const wallet=(c:Price['currency'])=>c==='gold'?state.gold:state.pearls;
const BUY_MAX=100000;
const fmt=(n:number)=>n.toLocaleString('tr-TR');
// Malzeme barında kısa sayı: 950 · 5k · 12,5k · 5m · 1,2b
const short=(n:number)=>{const a=Math.abs(n),u:[number,string][]=[[1e9,'b'],[1e6,'m'],[1e3,'k']];for(const [v,s] of u)if(a>=v){const x=Math.floor(n/v*10)/10;return`${x.toLocaleString('tr-TR',{maximumFractionDigits:x>=100?0:1})}${s}`;}return String(Math.floor(n));};
let pendingBuy:{row:BuyRow;qty:number}|null=null;
function renderBuyRows(listId:string,rows:BuyRow[]){
  const list=ui(listId);
  list.innerHTML=rows.map(r=>`<article class="market-item buy-row" data-row="${r.id}">${r.art}<div><h4>${r.name}</h4><details class="buy-details"><summary>Özellikler</summary><p>${r.desc}</p>${r.note?`<small>${r.note}</small>`:''}</details><em class="${r.unit.currency}">${r.unit.per&&r.unit.per>1?`${fmt(r.unit.per)} adet = `:''}${fmt(r.unit.amount)} ${CURRENCY_NAME[r.unit.currency]}</em></div><div class="buy-box"><input type="number" inputmode="numeric" min="1" max="${BUY_MAX}" placeholder="Adet" aria-label="${r.name} adedi"/><span class="buy-total">Toplam: —</span><button disabled>SATIN AL</button></div></article>`).join('');
  list.querySelectorAll<HTMLElement>('.buy-row').forEach((el,i)=>{const r=rows[i],input=el.querySelector('input')!,total=el.querySelector<HTMLElement>('.buy-total')!,btn=el.querySelector('button')!;
    const qty=()=>{const n=Math.floor(Number(input.value));return Number.isFinite(n)&&n>0?Math.min(BUY_MAX,n):0;};
    const sync=()=>{const n=qty(),cost=priceOf(r.unit,n);total.textContent=n?`Toplam: ${fmt(cost)} ${CURRENCY_NAME[r.unit.currency]}`:'Toplam: —';total.classList.toggle('short',cost>wallet(r.unit.currency));btn.disabled=!n;};
    input.oninput=sync;input.onkeydown=e=>{if(e.key==='Enter'&&qty())askBuy(r,qty());};btn.onclick=()=>askBuy(r,qty());});
}
function askBuy(row:BuyRow,qty:number){
  if(!qty)return;const cur=row.unit.currency,cn=CURRENCY_NAME[cur],have=wallet(cur),cost=priceOf(row.unit,qty),box=ui('buyConfirm'),enough=have>=cost;pendingBuy={row,qty};
  box.innerHTML=`<section><h3>SATIN ALMAYI ONAYLA</h3><p><b>${fmt(qty)} × ${row.name}</b></p><dl><dt>Birim fiyat</dt><dd>${row.unit.per&&row.unit.per>1?`${fmt(row.unit.per)} adet = `:''}${fmt(row.unit.amount)} ${cn}</dd><dt>Toplam</dt><dd class="total ${cur}">${fmt(cost)} ${cn}</dd><dt>Bakiyen</dt><dd>${fmt(have)} ${cn}</dd><dt>Kalan</dt><dd class="${enough?'':'short'}">${enough?`${fmt(have-cost)} ${cn}`:`Yetersiz ${cn}`}</dd></dl><div><button id="buyOk" ${enough?'':'disabled'}>ONAYLA</button><button id="buyCancel">VAZGEÇ</button></div></section>`;
  box.classList.add('open');ui('buyOk').onclick=confirmBuy;ui('buyCancel').onclick=closeBuy;
}
function closeBuy(){pendingBuy=null;ui('buyConfirm').classList.remove('open');}
function confirmBuy(){
  if(!pendingBuy)return;const {row,qty}=pendingBuy,cur=row.unit.currency,cost=priceOf(row.unit,qty);
  if(wallet(cur)<cost){toast(`Yeterli ${CURRENCY_NAME[cur]} yok`);closeBuy();return;}
  if(cur==='gold')state.gold-=cost;else state.pearls-=cost;row.give(qty);saveArsenal(arsenal);saveAccount();closeBuy();playCoins();renderQuickSlots();updateUI();row.after();rewardNotice(`${fmt(qty)} ${row.name} satın alındı · −${fmt(cost)} ${cur==='gold'?'altın':'inci'}`,'shop');
}
function openMarket(){renderMarket();ui('marketOverlay').classList.add('open');}
function closeMarket(){ui('marketOverlay').classList.remove('open');}
function renderMarket(){
  renderBuyRows('marketList',[{id:'iron',name:QUICK_ITEMS.iron.name,art:`<div class="ammo-icon">${itemAsset('iron')}<b>${quickCount('iron')}</b></div>`,desc:'Standart top güllesi. Her top her salvoda 1 gülle harcar; demir gülle bitince toplar ateş etmez.',unit:IRON_PRICE,give:(n:number)=>{state.ironAmmo+=n;},after:renderMarket},...(Object.keys(AMMO_PRICES) as (keyof typeof AMMO_PRICES)[]).map(id=>({id,name:QUICK_ITEMS[id].name,art:`<div class="ammo-icon">${itemAsset(id)}<b>${quickCount(id)}</b></div>`,
    desc:id==='chain'?`${QUICK_ITEMS.chain.description} · Her gülle ${ELITE_POINTS_PER_BALL.chain.toLocaleString('tr-TR',{maximumFractionDigits:4})} EP`:`${SPECIAL_AMMO[id].description} · Her gülle ${ELITE_POINTS_PER_BALL[id].toLocaleString('tr-TR',{maximumFractionDigits:4})} EP`,unit:AMMO_PRICES[id],give:(n:number)=>{if(id==='chain')state.chainAmmo+=n;else arsenal[id]+=n;},after:renderMarket}))]);
}
function openSupply(){renderSupply();ui('supplyOverlay').classList.add('open');}
function closeSupply(){ui('supplyOverlay').classList.remove('open');}
function renderSupply(){
  renderBuyRows('supplyList',[...(Object.keys(SUPPLY_PRICES) as SupplyId[]).map(id=>({id,name:QUICK_ITEMS[id].name,art:`<div class="ammo-icon">${itemAsset(id)}<b>${fmt(arsenal[id])}</b></div>`,
    desc:QUICK_ITEMS[id].description,unit:SUPPLY_PRICES[id] as Price,give:(n:number)=>{arsenal[id]+=n;},after:renderSupply})),
    {id:'spyShield',name:'Casus Kalkanı',art:`<div class="ammo-icon"><img class="raster-item" src="/assets/icon-shield-v3.webp" alt=""/><b>${fmt(arsenal.spyShield)}</b></div>`,desc:'Gemine gönderilen her casusu yakalar ve 1 hak harcar; hakların bitince sonraki casus konumunu öğrenir. Örn. 10 hak → 10 casus engellenir, 11. casus konumunu bulur.',unit:{amount:SPY_SHIELD_PRICE,currency:'pearls'},give:(n:number)=>{arsenal.spyShield+=n;},after:renderSupply}]);
}
// ---------------------------------------------------------------- Altın ihalesi (src/auction.ts)
let auction=loadAuction(Date.now());
// Hesapla girişte ihale kimliği hesap kimliğidir; teklifler ve kazanan sunucuda belirlenir (supabase/migrations/004_auction.sql)
const bidderId=session.account?.uid??auctionId;
const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const lotName=(l:LotDef)=>l.kind==='cannon'?`${CANNONS[l.item as CannonKind].name} Topu`:QUICK_ITEMS[l.item as QuickItemId].name;
const lotArt=(l:LotDef)=>l.kind==='cannon'?`<img class="raster-item" src="/assets/cannon-${l.item}-v1.webp" alt="" draggable="false"/>`:itemAsset(l.item as QuickItemId);
function giveLot(l:LotDef){if(l.kind==='cannon')cannonInventory[l.item as CannonKind]+=l.qty;else arsenal[l.item as SpecialAmmo|SupplyId]+=l.qty;}
// Saat dolunca: kazanılan lotlar verilir, yeni ihale başlar. Kaybedilen tekliflerin altını yanar (iade yok).
let bidBusy=false;
// İhale tabloları henüz kurulmadıysa (fonksiyon yok) eski yerel ihale sürer
const noRpc=(e:{code?:string})=>e.code==='PGRST202'||e.code==='42883';
// Sunucudaki güncel en yüksek teklifler (sayfa açılışı, ihale penceresi, saat başı)
async function loadAuctionTops(){const sb=supa();if(!sb||!session.account)return;const h=auction.hour;
  const {data}=await sb.from('auction_top').select('lot,user_id,nick,amount,at').eq('hour',h);if(!data||auction.hour!==h)return;
  for(const r of data){const cur=auction.top[r.lot];if(cur&&cur.id===r.user_id&&cur.amount===r.amount)continue;
    const mine=auction.mine[r.lot];if(cur?.id===bidderId&&r.user_id!==bidderId&&mine){delete auction.mine[r.lot];rewardNotice(`İhalede teklifin geçildi · verdiğin ${fmt(mine)} altın yandı`,'shop');}
    auction.top[r.lot]={hour:h,lot:r.lot,amount:Number(r.amount),id:r.user_id,nick:r.nick,at:Date.parse(r.at)};}
  saveAuction(auction);if(ui('auctionOverlay').classList.contains('open'))renderAuction();}
// Biten ihale: ödül sunucuda bir kez onaylanırsa verilir. Kaybedilen tekliflerin altını geri verilmez.
async function claimAuction(a:typeof auction,won:LotDef[]){const sb=supa();if(!sb)return;
  for(const [k,v] of Object.entries(a.mine)){const l=won.find(x=>x.key===k);
    if(l){const {data,error}=await sb.rpc('auction_claim',{p_hour:a.hour,p_lot:k});if(data===true||(error&&noRpc(error))){giveLot(l);rewardNotice(`İhaleyi kazandın · ${fmt(l.qty)} ${lotName(l)} · ${fmt(v)} altın`,'shop');continue;}}
}saveArsenal(arsenal);saveAccount();renderQuickSlots();updateUI();}
function auctionTick(){const h=auctionHour(Date.now());if(auction.hour===h)return;
  const won=wonLots(auction,bidderId);if(session.account){void claimAuction(auction,won);auction=emptyAuction(h);saveAuction(auction);void loadAuctionTops();void loadLastWinners();if(ui('auctionOverlay').classList.contains('open'))renderAuction();return;}
  for(const l of won){giveLot(l);rewardNotice(`İhaleyi kazandın · ${fmt(l.qty)} ${lotName(l)} · ${fmt(auction.mine[l.key])} altın`,'shop');}
  if(won.length){saveArsenal(arsenal);saveAccount();renderQuickSlots();updateUI();}
  auction=emptyAuction(h);saveAuction(auction);if(ui('auctionOverlay').classList.contains('open'))renderAuction();}
function receiveBid(b:NetBid){auctionTick();const r=applyBid(auction,b,bidderId);if(!r.accepted)return;
  if(r.refund)rewardNotice(`İhalede teklifin geçildi · verdiğin ${fmt(r.refund)} altın yandı`,'shop');
  saveAuction(auction);if(ui('auctionOverlay').classList.contains('open'))renderAuction();}
function placeBid(l:LotDef,amount:number){auctionTick();const top=auction.top[l.key],min=minNextBid(l,top);
  // Teklif tutarları gizli: düşük teklif reddedilir ama en yüksek tutar söylenmez
  if(!(amount>=min)){toast(top?(top.id===bidderId?'Zaten öndesin; yükseltmek için daha yüksek bir tutar yaz':'Teklifin en yüksek tekliften düşük, daha yüksek bir tutar dene'):'Teklif tutarını yaz');return;}
  const prev=top?.id===bidderId?auction.mine[l.key]??0:0,cost=amount-prev;if(state.gold<cost){toast('Yeterli altın yok');return;}
  if(session.account&&bidBusy)return;
  if(session.account){const sb=supa();if(!sb)return;bidBusy=true;void sb.rpc('auction_bid',{p_hour:auction.hour,p_lot:l.key,p_amount:amount}).then(({error})=>{bidBusy=false;if(error&&!noRpc(error)){toast(error.message.replace(/^.*?: /,'')||'Teklif verilemedi');void loadAuctionTops();return;}commitBid(l,amount,cost);});return;}
  commitBid(l,amount,cost);}
function commitBid(l:LotDef,amount:number,cost:number){if(state.gold<cost){toast('Yeterli altın yok');return;}
  const b:Bid={hour:auction.hour,lot:l.key,amount,id:bidderId,nick:profile.nick,at:Date.now()};if(!applyBid(auction,b,bidderId).accepted){toast('Teklif geçersiz');return;}
  state.gold-=cost;econServerSpent('gold',cost);auction.mine[l.key]=amount;saveAuction(auction);saveAccount();sendBid(b);playCoins();updateUI();renderAuction();toast(`${fmt(amount)} altın teklif verdin · ${lotName(l)}`);}
// Bir önceki saatin ihalesini kazananlar (lot başına kaptan adı)
let lastWinners:{hour:number;rows:{lot:string;nick:string}[]}|null=null;
async function loadLastWinners(){const sb=supa();if(!sb||!session.account)return;const h=auction.hour-1;if(lastWinners?.hour===h)return;
  const {data}=await sb.from('auction_top').select('lot,nick').eq('hour',h);lastWinners={hour:h,rows:(data??[]) as {lot:string;nick:string}[]};renderLastWinners();}
function renderLastWinners(){const el=document.getElementById('auctionLast');if(!el)return;const w=lastWinners;if(!w||w.hour!==auction.hour-1||!w.rows.length){el.innerHTML='';return;}
  const lots=lotsFor(w.hour),at=new Date(w.hour*AUCTION_MS).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  el.innerHTML=`<small>Önceki ihale (${at}) kazananları</small>`+lots.map(l=>{const r=w.rows.find(x=>x.lot===l.key);return r?`<span>${fmt(l.qty)} × ${lotName(l)} · <b>${esc(r.nick)}</b></span>`:'';}).join('');}
function openAuction(){auctionTick();void loadAuctionTops();void loadLastWinners();renderAuction();ui('auctionOverlay').classList.add('open');}
function closeAuction(){ui('auctionOverlay').classList.remove('open');}
function renderAuctionTimer(){const left=Math.max(0,auctionEnds(auction.hour)-Date.now()),m=Math.floor(left/60000),sec=Math.floor(left/1000)%60;ui('auctionTimer').textContent=`Kalan süre: ${m}:${String(sec).padStart(2,'0')}`;}
function renderAuction(){renderAuctionTimer();renderLastWinners();const list=ui('auctionList'),lots=lotsFor(auction.hour);
  list.innerHTML=lots.map(l=>{const top=auction.top[l.key],mine=top?.id===bidderId;
    return`<article class="market-item buy-row auction-lot${mine?' leading':''}" data-lot="${l.key}"><div class="ammo-icon">${lotArt(l)}<b>${fmt(l.qty)}</b></div><div><h4>${fmt(l.qty)} × ${lotName(l)}</h4>
      <small>${top?`En yüksek teklif: <b class="${mine?'auction-mine':''}">${esc(String(top.nick??''))}</b>`:'Henüz teklif yok · ilk teklifi sen ver'}</small>${mine?`<em class="gold">Senin teklifin: ${fmt(auction.mine[l.key]??top.amount)} altın</em>`:''}</div>
      <div class="buy-box"><input type="number" inputmode="numeric" min="1" step="1" placeholder="Altın" aria-label="${lotName(l)} teklifi"/><button>TEKLİF</button></div></article>`;}).join('');
  list.querySelectorAll<HTMLElement>('.auction-lot').forEach(el=>{const l=lots.find(x=>x.key===el.dataset.lot)!,input=el.querySelector('input')!,go=()=>placeBid(l,Math.floor(Number(input.value)));
    el.querySelector('button')!.onclick=go;input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')go();};});}
setInterval(()=>{auctionTick();if(ui('auctionOverlay').classList.contains('open'))renderAuctionTimer();},1000);
let loadoutTab:'ammo'|'consumable'='ammo';
let pendingQuickItem:QuickItemId|null=null;
function quickCount(item:QuickItemId){if(item==='iron')return short(state.ironAmmo);if(item==='chain')return short(state.chainAmmo);if(isSpecial(item)||item==='mine'||item==='powder'||item==='shield'||item==='speed'||item==='compass')return short(arsenal[item]);return'';}
function slotKey(index:number){return keyLabel(settings.binds[(index<AMMO_ROW?`ammo${index+1}`:`item${index-AMMO_ROW+1}`) as ActionId]);}
function itemAsset(item:QuickItemId){return rasterItemAssets[item]?`<img class="raster-item" src="${rasterItemAssets[item]}" alt="${QUICK_ITEMS[item].name}" draggable="false"/>`:`<i class="sprite icon-${QUICK_ITEMS[item].icon}"></i>`;}
function quickSlotHtml(item:QuickItemId|null,index:number){const row=index<AMMO_ROW?'ammo-row':'item-row',key=slotKey(index),k=key==='—'?'':key;
  return item?`<button class="quick-slot ${row} ${item===state.ammo||((item==='powder'||item==='shield')&&consumableOn[item])?'active':''}" data-quick-slot="${index}" data-quick-item="${item}" aria-label="${QUICK_ITEMS[item].name}">${itemAsset(item)}<b>${quickCount(item)}</b><kbd>${k}</kbd></button>`:`<button class="quick-slot ${row} empty" data-quick-slot="${index}" title="${index<AMMO_ROW?'Gülle yuvası':'Sarf yuvası'}"><span>+</span><kbd>${k}</kbd></button>`;}
// Sohbet düğmesi mobilde büyük gülle düğmesinin hemen üstünde durur (ölçekten bağımsız, gerçek konuma göre)
function placeChatAboveDock(){const chat=document.querySelector<HTMLElement>('.chat'),main=document.getElementById('mobMain');if(!chat||!main)return;
  requestAnimationFrame(()=>{const r=main.getBoundingClientRect();chat.style.left=`${Math.max(4,r.left+r.width/2-22)}px`;chat.style.bottom=`${innerHeight-r.top+22}px`;});}
addEventListener('resize',()=>{if(MOBILE_HUD)placeChatAboveDock();});
// Mobil dokunmatik: tüm gülle ve malzemeler tek sırada, soldaki büyük düğme seçili gülleyi gösterir ve sırayı açıp kapatır
let mobileTrayOpen=false;
function renderMobileDock(){if(!MOBILE_HUD)return;let dock=document.getElementById('mobileDock');
  if(!dock){ui('ammoBar').parentElement!.insertAdjacentHTML('beforeend','<div class="mobile-dock" id="mobileDock"><button class="mob-main" id="mobMain"></button><div class="mob-tray" id="mobTray"></div></div>');dock=ui('mobileDock');
    ui('mobMain').onclick=()=>{mobileTrayOpen=!mobileTrayOpen;renderMobileDock();};document.body.classList.add('touch-ui');}
  placeChatAboveDock();
  ui('mobMain').innerHTML=`${itemAsset(state.ammo)}<b>${quickCount(state.ammo)}</b>`;dock.classList.toggle('open',mobileTrayOpen);
  ui('mobTray').innerHTML=quickSlots.map((item,i)=>item?`<button class="${item===state.ammo||((item==='powder'||item==='shield')&&consumableOn[item])?'active':''}" data-mob-slot="${i}" data-quick-item="${item}" title="${QUICK_ITEMS[item].name}">${itemAsset(item)}<b>${quickCount(item)}</b></button>`:'').join('');
  ui('mobTray').querySelectorAll<HTMLButtonElement>('[data-mob-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.mobSlot),ammo=i<AMMO_ROW;useQuickSlot(i);if(ammo){mobileTrayOpen=false;renderMobileDock();}});}
function renderQuickSlots(){renderMobileDock();
  ui('ammoSlots').innerHTML=quickSlots.slice(0,AMMO_ROW).map((item,i)=>quickSlotHtml(item,i)).join('');
  ui('itemSlots').innerHTML=quickSlots.slice(AMMO_ROW).map((item,i)=>quickSlotHtml(item,i+AMMO_ROW)).join('');
  document.querySelectorAll<HTMLButtonElement>('.slot-bar [data-quick-slot]').forEach(slot=>{const index=Number(slot.dataset.quickSlot);slot.onclick=()=>{if(index<AMMO_ROW&&!pendingQuickItem){if(quickSlots[index])useQuickSlot(index);openAmmoPicker(index);}else useQuickSlot(index);};slot.ondragover=e=>e.preventDefault();slot.ondrop=e=>{e.preventDefault();const item=e.dataTransfer?.getData('text/quick-item') as QuickItemId;if(item&&QUICK_ITEMS[item])assignQuickSlot(index,item);};});
}
// Gülle seçme sekmesi: numaralı gülle yuvasına dokununca tüm gülleler küçük bir sekmede açılır; seçilen gülle o yuvaya
// yerleşir ve atış güllesi olur (başka yuvadaysa iki yuva yer değiştirir).
let pickerSlot=-1;
function closeAmmoPicker(){pickerSlot=-1;ui('ammoPicker').classList.remove('open');}
function openAmmoPicker(index:number){
  const picker=ui('ammoPicker');if(pickerSlot===index&&picker.classList.contains('open')){closeAmmoPicker();return;}pickerSlot=index;
  const ammo=(Object.keys(QUICK_ITEMS) as QuickItemId[]).filter(id=>QUICK_ITEMS[id].category==='ammo');
  picker.innerHTML=`<small>${index+1}. YUVA</small><div>${ammo.map(id=>`<button class="${quickSlots[index]===id?'current':''}" data-pick="${id}" title="${QUICK_ITEMS[id].name}">${itemAsset(id)}<b>${quickCount(id)}</b></button>`).join('')}</div>`;
  picker.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.pick as QuickItemId,old=quickSlots[index],from=quickSlots.indexOf(id);
    // seçilen gülle başka yuvadaysa iki yuva yer değiştirir; böylece hiçbir gülle bardan kaybolmaz
    if(old!==id){assignQuickSlot(index,id);if(from>=0&&old){quickSlots[from]=old;saveAccount();renderQuickSlots();}}useQuickSlot(index);closeAmmoPicker();});
  const bar=ui('ammoBar'),slot=bar.querySelector(`[data-quick-slot="${index}"]`) as HTMLElement,r=slot.getBoundingClientRect(),vertical=bar.classList.contains('vertical');
  picker.classList.toggle('side',vertical);picker.classList.add('open');const k=uiScale,pw=picker.offsetWidth*k,ph=picker.offsetHeight*k;
  let x=vertical?(r.left<innerWidth/2?r.right+8:r.left-pw-8):r.left+r.width/2-pw/2,y=vertical?r.top+r.height/2-ph/2:r.top-ph-8;
  if(!vertical&&y<4)y=r.bottom+8;
  picker.style.left=`${clamp(x,4,innerWidth-pw-4)/k}px`;picker.style.top=`${clamp(y,4,innerHeight-ph-4)/k}px`;}
addEventListener('pointerdown',e=>{if(pickerSlot<0)return;const t=e.target as HTMLElement;if(t.closest('#ammoPicker')||t.closest('#ammoBar [data-quick-slot]'))return;closeAmmoPicker();},true);
addEventListener('keydown',e=>{if(e.key==='Escape')closeAmmoPicker();});
function useQuickSlot(index:number){
  if(ls){toast('Lanetli Sular\'da eşya ve gülle seçimi kullanılamaz · herkes eşit gemiyle savaşır');return;}
  if(pendingQuickItem){assignQuickSlot(index,pendingQuickItem);return;}
  const item=quickSlots[index];if(!item){openLoadout(index<AMMO_ROW?'ammo':'consumable');return;}
  if(item==='iron'||item==='chain'){state.ammo=item;toast(`${QUICK_ITEMS[item].name} seçildi`);}
  else if(isSpecial(item)){if(arsenal[item]<=0){toast(`${QUICK_ITEMS[item].name} kalmadı — marketten alabilirsin`);}else{state.ammo=item;toast(`${QUICK_ITEMS[item].name} seçildi`);}}
  else if(item==='repairkit')toggleRepair();else if(item==='speed')activateAbility('speed');else if(item==='powder'||item==='shield')toggleConsumable(item);else if(item==='mine')dropMine();else if(item==='compass')useCompass();
  renderQuickSlots();
}
function assignQuickSlot(index:number,item:QuickItemId){if((index<AMMO_ROW)!==(QUICK_ITEMS[item].category==='ammo')){toast(index<AMMO_ROW?'Üst sıraya yalnızca gülle konabilir':'Alt sıraya yalnızca sarf malzemesi konabilir');return;}const prev=quickSlots.indexOf(item);if(prev>=0&&prev!==index)quickSlots[prev]=null;quickSlots[index]=item;pendingQuickItem=null;saveAccount();renderQuickSlots();if(ui('loadoutOverlay').classList.contains('open'))renderLoadout();toast(`${QUICK_ITEMS[item].name} ${index+1}. yuvaya yerleştirildi`);}
function openLoadout(tab:typeof loadoutTab='ammo'){loadoutTab=tab;pendingQuickItem=null;renderLoadout();ui('loadoutOverlay').classList.add('open');}
function closeLoadout(){pendingQuickItem=null;ui('loadoutOverlay').classList.remove('open');}
function renderLoadout(){
  // Boş gülle yuvasına dokununca aynı pencere gülle yerleşimi için açılır; MALZEMELER sekmesi yalnızca sarf gösterir
  const ammoMode=loadoutTab==='ammo';ui('loadoutTitle').textContent=ammoMode?'GÜLLE YUVALARI':'SARF YUVALARI';
  ui('loadoutHint').textContent=ammoMode?'Gülleler üst sıraya yerleşir. Sürükleyip bırak ya da önce gülleye, sonra yuvaya dokun.':'Sarf malzemeleri alt sıraya yerleşir. Sürükleyip bırak ya da önce eşyaya, sonra yuvaya dokun. Kara Barut ve Kalkan yuvaya dokununca açılır/kapanır.';
  const items=(Object.keys(QUICK_ITEMS) as QuickItemId[]).filter(id=>QUICK_ITEMS[id].category===loadoutTab);
  ui('loadoutItems').innerHTML=items.map(id=>`<button draggable="true" data-loadout-item="${id}" class="${pendingQuickItem===id?'selected':''}">${itemAsset(id)}<span>${QUICK_ITEMS[id].name}</span><small>${QUICK_ITEMS[id].description}</small><b>${quickCount(id)}</b></button>`).join('');
  ui('loadoutSlots').innerHTML=quickSlots.map((item,index)=>(index<AMMO_ROW)!==ammoMode?'':`${index===0?'<h4>GÜLLE SIRASI</h4>':index===AMMO_ROW?'<h4>SARF SIRASI</h4>':''}<button data-editor-slot="${index}" class="${pendingQuickItem&&(index<AMMO_ROW)===(QUICK_ITEMS[pendingQuickItem].category==='ammo')?'ready':''} ${index<AMMO_ROW?'ammo-row':'item-row'}">${item?`${itemAsset(item)}<span>${index+1}</span>`:`<b>+</b><span>${index+1}</span>`}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-loadout-item]').forEach(button=>{const item=button.dataset.loadoutItem as QuickItemId;button.onclick=()=>{pendingQuickItem=item;renderLoadout();};button.ondragstart=e=>e.dataTransfer?.setData('text/quick-item',item);});
  document.querySelectorAll<HTMLButtonElement>('[data-editor-slot]').forEach(button=>{const index=Number(button.dataset.editorSlot);button.onclick=()=>{if(pendingQuickItem)assignQuickSlot(index,pendingQuickItem);};button.ondragover=e=>e.preventDefault();button.ondrop=e=>{e.preventDefault();const item=e.dataTransfer?.getData('text/quick-item') as QuickItemId;if(item&&QUICK_ITEMS[item])assignQuickSlot(index,item);};});
}
let pendingCancel:string|null=null;
let chartSelection:MapKey|null=null;
function openWorldMap(){chartSelection=currentMap;renderWorldMap();ui('worldMapOverlay').classList.add('open');}
function closeWorldMap(){ui('worldMapOverlay').classList.remove('open');}
function renderWorldMap(){
  const chart=ui('worldChart');
  // Seafight tarzı küçük pafta: sol üstte adaya sahip filonun kısaltması, sağ üstte bulunduğun denizin sancağı, ortada deniz kodu, altta adı
  chart.innerHTML=`<div class="world-grid">${GRID.flat().map(key=>{const m=MAPS[key],locked=mapLvl()<m.tier,here=key===currentMap,owned=fleetOwner(key)==='player',t=THEMES[m.tier];
    const tag=owned?(guild?`[${escapeHtml(guild.tag)}]`:'SEN'):'';
    return`<button class="world-tile ${here?'here':''} ${locked?'locked':''} ${m.safe?'safe':''} ${chartSelection===key?'selected':''}" data-chart="${key}" style="--tile:${t.sea[0]};--tile2:${t.sea[1]};--tint:${t.tint}"><span class="wt-tag">${tag}</span>${here?'<img class="wt-flag" src="/assets/icon-flag-v1.webp" alt="Buradasın" draggable="false"/>':''}<b>${key}</b><strong>${m.name}</strong></button>`;}).join('')}</div>`;
  chart.querySelectorAll<HTMLButtonElement>('[data-chart]').forEach(b=>b.onclick=()=>{chartSelection=b.dataset.chart as MapKey;renderWorldMap();});
  const m=MAPS[chartSelection??currentMap],locked=mapLvl()<m.tier,npcs=m.npcs.map(id=>NPCS[id].name).join(', ');
  ui('worldInfo').innerHTML=`<div><span class="eyebrow">${m.key} · ${THEMES[m.tier].name}</span><h3>${m.name}</h3><p>${m.description}</p><dl><div><dt>Seviye</dt><dd>${m.tier}+</dd></div><div><dt>Gemiler</dt><dd>${npcs}</dd></div><div><dt>Filo adası</dt><dd>${fleetOwner(m.key)==='player'?'<b class="safe">Senin</b>':'<b class="danger">Rakip</b>'}</dd></div></dl></div>${session.isAdmin?(m.key!==currentMap?'<button id="worldTeleport">IŞINLAN (YÖNETİCİ)</button>':'<button disabled>BİR DENİZ SEÇ · IŞINLAN</button>'):`<button disabled>${m.key===currentMap?'ŞU AN BURADASIN':locked?`SEVİYE ${m.tier} GEREKLİ`:'KENARLARDAN GEÇİŞ'}</button>`}`;
  {const tp=document.getElementById('worldTeleport');if(tp)tp.onclick=()=>{closeWorldMap();adminTeleport(m.key);};}
}
function openQuestLog(){renderQuestLog();ui('questOverlay').classList.add('open');}
function closeQuestLog(){pendingCancel=null;ui('questOverlay').classList.remove('open');}
function openCaptainProfile(){renderNick();updateUI();renderBonusSummary();renderAchievements();saveAchievements(ach);ui('captainOverlay').classList.add('open');}
function refreshBonus(){bonus=computeBonus(crew);saveCrew(crew);renderBonusSummary();}
function renderBonusSummary(){
  const pct=(v:number)=>`${v>=1?'+':''}${Math.round((v-1)*100)}%`;
  ui('bonusSummary').innerHTML=`<span class="eyebrow">Geliştirme, uzmanlık ve tayfa bonusları</span><div><b>Hasar ${pct(bonus.damage*(1+upgrades.damage*.11))}</b><b>Dolum ${pct(Math.max(.6,1-upgrades.reload*.04)*bonus.reload)}</b><b>Menzil +${upgrades.range*18+bonus.range}</b><b>Hız ${pct(bonus.speed*(104+upgrades.speed*5)/104)}</b><b>Alınan hasar ${pct(bonus.taken)}</b><b>Tamir ${pct(bonus.repair)}</b></div><p>Elit ${earnedEliteLevel()} kalıcı toplamı: ${eliteBonusText(eliteBonus())||'henüz yok'}</p><p>Ana madalya koleksiyonu: ${bonusText(achBonus())||'17 madalya tamamlanınca +%5 hasar ve +%5 can'}</p>`;
}
// ---------------------------------------------------------------- Kaptan adı (nick): ilk ad ücretsiz, sonra inciyle ve 1 gün arayla
function renderNick(){
  ui('captainName').textContent=profile.nick.toLocaleUpperCase('tr');
  const wait=profile.named?profile.changedAt+NICK_COOLDOWN_MS-Date.now():0,cost=profile.named?NICK_CHANGE_COST:0,h=Math.ceil(wait/3600000);
  ui('captainNick').innerHTML=`<div><span>KAPTAN ADI</span><strong>${guild?`<em class="guild-tag">[${escapeHtml(guild.tag)}]</em>`:''}${escapeHtml(profile.nick)}</strong>${heroTitle?`<em class="hero-title">★ ${heroTitle.name} · +%3 hasar · ${Math.ceil((heroTitle.until-Date.now())/86_400_000)} gün</em>`:''}${session.account?`<small class="player-no">OYUNCU NO #${session.account.playerNo}</small>`:''}<small>${rankOf(state.level)} · ${profile.named?`Değiştirme ücreti ${NICK_CHANGE_COST} İnci · iki değişiklik arası 1 gün`:'İlk adını ücretsiz belirleyebilirsin'}</small></div>
    <div class="nick-form"><input id="nickInput" maxlength="${NICK_MAX}" placeholder="Yeni kaptan adı" ${wait>0?'disabled':''}/><button id="nickSave" ${wait>0?'disabled':''}>${wait>0?`${h} SAAT SONRA`:cost?`DEĞİŞTİR · ${fmt(cost)} İNCİ`:'ADI KAYDET'}</button></div>`;
  const btn=document.getElementById('nickSave') as HTMLButtonElement|null;if(!btn||wait>0)return;
  btn.onclick=async()=>{const n=(ui('nickInput') as HTMLInputElement).value.trim(),err=nickError(n);if(err){toast(err);return;}if(n===profile.nick){toast('Bu zaten senin adın');return;}
    if(cost&&state.pearls<cost){toast(`Ad değiştirmek için ${fmt(cost)} inci gerekli`);return;}
    if(session.rename){btn.disabled=true;const bad=await session.rename(n);btn.disabled=false;if(bad){toast(bad);return;}}state.pearls-=cost;profile.nick=n;profile.changedAt=Date.now();profile.named=true;saveProfile(profile);saveAccount();updateUI();renderNick();rewardNotice(`Kaptan adı: ${n}${cost?` · −${fmt(cost)} inci`:''}`,'other');};
}
// Gemi altındaki ad: [FİLO TAG] nick, altında rütbe
// Kuşatma Kahramanı unvanı (bir hafta): ad altın çerçeveli bir levhada, altında unvan yazısı
let heroTitle=loadTitle();setInterval(()=>{heroTitle=loadTitle();},60000);
// Kuşatma Kahramanı: süre boyunca %3 ek top hasarı
function heroDamage(){return heroTitle?HERO_DAMAGE:0;}
// Kaptan adı: kalın, altın degradeli ve koyu kahve kontürlü yazı ([TAG] ad). Oyuncu ve diğer kaptanlar aynı stili kullanır.
// rank: savaş rütbesi sırası (BATTLE_RANKS); rozeti adın sağında, yazıdan biraz büyük çizilir
const rankSheet=new Image();rankSheet.src=RANK_SHEET;
function drawRankBadge(c:CanvasRenderingContext2D,rank:number,x:number,y:number,size:number){if(!rankSheet.complete||!rankSheet.naturalWidth)return false;
  const i=rankIcon(rank),cell=rankSheet.naturalWidth/RANK_COLS;c.drawImage(rankSheet,(i%RANK_COLS)*cell,Math.floor(i/RANK_COLS)*cell,cell,cell,x,y-size/2,size,size);return true;}
// Kaptan adı (gölgeli, degrade yazı + rütbe rozeti) her karede yeniden çizilince kalabalık haritada kareyi yiyordu:
// etiket ekran ölçeğinde bir kez ayrı tuvale çizilir, sonra tek drawImage ile basılır.
const nameCache=new Map<string,{c:HTMLCanvasElement;w:number;pad:number;h:number;sc:number}>();
function renderCaptainName(tag:string,nick:string,size:number,rank:number,sc:number,adm=false){
  const m=document.createElement('canvas').getContext('2d')!,font=`900 ${size}px Inter, "Arial Black", sans-serif`;m.font=font;
  const text=tag?`${tag} ${nick}`:nick,w=m.measureText(text).width,bs=rank>=0?Math.round(size*2.6):0,pad=8,tw=w+(bs?bs+3:0),h=Math.max(bs,size*1.6)+pad*2;
  const c=document.createElement('canvas');c.width=Math.ceil((tw+pad*2)*sc);c.height=Math.ceil(h*sc);const g=c.getContext('2d')!;g.scale(sc,sc);
  const y=h/2;g.font=font;g.textBaseline='middle';g.textAlign='left';g.lineJoin='round';if(bs)drawRankBadge(g,rank,pad,y,bs);const tx=pad+(bs?bs+3:0);
  // Yönetici adı altın-kırmızı, kırmızı parıltılı
  const gr=g.createLinearGradient(0,y-size*.55,0,y+size*.55);if(adm){gr.addColorStop(0,'#ffe98a');gr.addColorStop(.45,'#ff9a1f');gr.addColorStop(1,'#d3160c');}else{gr.addColorStop(0,'#fff6c2');gr.addColorStop(.45,'#ffd34d');gr.addColorStop(1,'#d98a16');}
  g.shadowColor=adm?'#ff2a10':'#000c';g.shadowBlur=(adm?9:5)*sc;g.shadowOffsetY=1.5*sc;g.lineWidth=Math.max(3,size*.26);g.strokeStyle=adm?'#3a0503':'#2b1606';g.strokeText(text,tx,y);
  g.shadowColor='transparent';g.fillStyle=gr;g.fillText(text,tx,y);return{c,w,pad,h,sc};}
function drawCaptainName(x:number,y:number,tag:string,nick:string,size=17,rank=-1,adm=false){
  const t=ctx.getTransform(),sc=Math.min(4,Math.max(.5,Math.round(Math.hypot(t.a,t.b)*4)/4)),ready=rank<0||(rankSheet.complete&&rankSheet.naturalWidth>0);
  const key=`${size}|${rank}|${sc}|${tag}|${nick}|${adm?1:0}`;let l=ready?nameCache.get(key):undefined;
  if(!l){l=renderCaptainName(tag,nick,size,rank,sc,adm);if(ready){if(nameCache.size>300)nameCache.clear();nameCache.set(key,l);}}
  // Ad gemiye ortalı; rütbe rozeti adın soluna taşar
  const bs=rank>=0?Math.round(size*2.6):0;ctx.drawImage(l.c,x-l.w/2-(bs?bs+3:0)-l.pad,y-l.h/2,l.c.width/l.sc,l.c.height/l.sc);return l.w;}
// Güverte işareti: adın altında ortalı; kademesi batırılan rakip sayısına göre (sayı yazılmaz)
let rivalSinks=ELITE_TEST_MODE?Math.max(loadRivalSinks(),12_500):loadRivalSinks();
const insigniaImg=new Image();insigniaImg.src=INSIGNIA_SHEET;
// Telefonda 512 px'lik işaret tek adımda ~100 px'e inince kırık görünüyordu: her kademe için yarıya yarıya küçültülmüş kopyalar
// bir kez hazırlanır, çizimde ekrandaki gerçek piksel boyuna en yakın (ondan büyük) kopya seçilir.
const insigniaMips:HTMLCanvasElement[][]=[];
function insigniaLevels(t:number){let lv=insigniaMips[t];if(lv)return lv;lv=[];let src:CanvasImageSource=insigniaImg,sx=0,sy=t*INSIGNIA_H,w=INSIGNIA_W,h=INSIGNIA_H;
  while(w>=64){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d')!;g.imageSmoothingQuality='high';g.drawImage(src,sx,sy,w*(src===insigniaImg?1:2),h*(src===insigniaImg?1:2),0,0,w,h);
    lv.push(c);src=c;sx=0;sy=0;w=Math.round(w/2);h=Math.round(h/2);}
  return insigniaMips[t]=lv;}
// Boyut ad yazısına göre dengeli: oyuncu 96 px, diğer kaptanlar 84 px genişlik (önceden 140/115 px, ad ve gemiden büyük duruyordu)
function drawInsignia(x:number,y:number,count:number,w=96){if(!insigniaImg.complete||!insigniaImg.naturalWidth)return;
  const t=insigniaTier(count),h=w*INSIGNIA_H/INSIGNIA_W,m=ctx.getTransform(),px=w*Math.hypot(m.a,m.b),lv=insigniaLevels(t);
  let pick=lv[0];for(const c of lv)if(c.width>=px)pick=c;
  ctx.save();ctx.imageSmoothingQuality='high';ctx.drawImage(pick,x-w/2,y,w,h);ctx.restore();}
function drawPlayerLabel(){
  const p=worldToScreen(player),y=p.y+60,tag=guild?`[${guild.tag}]`:'',nick=profile.nick;
  drawCaptainName(p.x,y,tag,nick,17,battleRank(state.battlePoints).index,session.isAdmin);drawInsignia(p.x,y+11,rivalSinks);
}
// ---------------------------------------------------------------- Filo: hazine, bağış ve kule dikme
function openGuild(){renderGuild();ui('guildOverlay').classList.add('open');void refreshCloudGuild();}
// Ortak filo: hesapla girişte filo bilgisi sunucudan gelir; yerel kayıt (hazine, kuleler) aynı filo için korunur
let cloudGuild:MyGuild|null=null,guildTab:'create'|'search'='search',guildResults:GuildInfo[]|null=null,guildApplied:number[]=[],guildBusy=false;
async function refreshCloudGuild(){if(!guildOnline())return;
  try{cloudGuild=await loadMyGuild();}catch{toast('Filo bilgisi alınamadı');return;}
  if(cloudGuild){const c=cloudGuild.info;if(!guild||guild.tag!==c.tag||guild.name!==c.name){guild={name:c.name,tag:c.tag,role:cloudGuild.role,treasury:0,donated:0,created:Date.now(),towers:{}};for(const k of ownedFleetIslands())islandSlots(guild,k);}else guild.role=cloudGuild.role;saveGuild(guild);}
  else if(guild){guild=null;saveGuild(null);}
  else{guildApplied=await myApplications().catch(()=>[]);if(guildTab==='search'&&!guildResults)guildResults=await searchGuilds('').catch(()=>[]);}
  sendGuildRefresh();
  // Filonun adaları (ziyaret edilmemiş olsa da panelde görünsün); güncel deniz sunucudan zaten canlı gelir
  if(cloudGuild){const rows=await loadGuildIslands(cloudGuild.info.id).catch(()=>[]);for(const r of rows){const k=r.map_key as MapKey;if(!MAPS[k]||(k===currentMap&&islandNet[k]))continue;const max=fleetTower(MAPS[k].tier).hp;
    islandNet[k]={key:k,guild:Number(r.guild_id),tag:cloudGuild.info.tag,towers:Array.from({length:TOWER_SLOTS},(_,i)=>{const t=r.towers?.[i];return t?[Math.min(max,t.hp),max] as [number,number]:null;}),ruins:r.ruins??{}};}}
  for(const n of Object.values(islandNet))if(n)applyIsland(n);
  if(ui('guildOverlay').classList.contains('open'))renderGuild();}
async function guildAction(run:()=>Promise<string|null>,ok:string){if(guildBusy)return;guildBusy=true;const err=await run().catch(e=>String(e?.message??e));guildBusy=false;if(err){toast(err);return;}if(ok)rewardNotice(ok,'other');await refreshCloudGuild();renderGuild();}
function dropGuild(msg:string){guild=null;cloudGuild=null;saveGuild(null);setupFleetIsland();rewardNotice(msg,'other');renderGuild();}
function closeGuild(){ui('guildOverlay').classList.remove('open');focusedFoundation=null;}
function ownedFleetIslands(){return(Object.keys(MAPS) as MapKey[]).filter(k=>MAPS[k].tier>=2&&fleetOwner(k)==='player');}
function renderGuild(){
  const panel=ui('guildPanel');
  if(!guild){const tabs=`<div class="guild-tabs"><button data-gtab="search" class="${guildTab==='search'?'on':''}">FİLO ARA</button><button data-gtab="create" class="${guildTab==='create'?'on':''}">FİLO KUR</button></div>`;
    if(guildTab==='search'){
      const list=!guildOnline()?`<p class="guild-empty">Filo aramak ve başvurmak için hesabınla giriş yapmalısın.</p>`:guildResults===null?`<p class="guild-empty">Filolar yükleniyor…</p>`:guildResults.length?guildResults.map(r=>{const ap=guildApplied.includes(r.id);return`<div class="guild-result"><b><em class="guild-tag">[${escapeHtml(r.tag)}]</em> ${escapeHtml(r.name)}</b><small>${r.members} / 50 üye</small><button data-apply="${r.id}" class="${ap?'applied':''}" ${r.members>=50&&!ap?'disabled':''}>${ap?'BAŞVURULDU · İPTAL':r.members>=50?'DOLU':'FİLOYA BAŞVUR'}</button></div>`;}).join(''):`<p class="guild-empty">Filo bulunamadı.</p>`;
      panel.innerHTML=`${tabs}<div class="guild-search"><div class="guild-search-row"><input id="guildQuery" maxlength="24" placeholder="Filo adı veya kısaltması"/><button id="guildFind">ARA</button></div><div class="guild-results">${list}</div><small class="guild-hint">Başvurun filo başkanı ya da yardımcısı onaylayınca filoya katılırsın. Aynı anda en fazla 5 başvuru yapabilirsin.</small></div>`;
      panel.querySelectorAll<HTMLButtonElement>('[data-gtab]').forEach(b=>b.onclick=()=>{guildTab=b.dataset.gtab as 'create'|'search';renderGuild();});
      const q=ui('guildQuery') as HTMLInputElement,find=async()=>{if(!guildOnline())return;guildResults=null;renderGuild();guildResults=await searchGuilds(q.value).catch(()=>[]);const v=q.value;renderGuild();(ui('guildQuery') as HTMLInputElement).value=v;};
      ui('guildFind').onclick=()=>void find();q.onkeydown=e=>{if(e.key==='Enter')void find();};
      panel.querySelectorAll<HTMLButtonElement>('[data-apply]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.apply);void guildAction(()=>guildApplied.includes(id)?cancelApply(id):applyGuild(id),guildApplied.includes(id)?'Başvuru geri çekildi':'Filoya başvuruldu');});
      return;}
    panel.innerHTML=`${tabs}<div class="guild-create"><p>Henüz bir filon yok. Filo kurduğunda <b>filo başkanı</b> sen olursun. Filo üyeleri hazineye <b>inci bağışlar</b>. Başkan da bu hazineyle filo adalarındaki boş kaidelere kule diker.</p><div class="guild-create-row"><label>Kısaltma (tag)<input id="guildTag" maxlength="${GUILD_TAG_MAX}" placeholder="Ör. TC★"/></label><label>Filo adı<input id="guildName" maxlength="${GUILD_NAME_MAX}" placeholder="Ör. Türk Korsanları"/></label></div><small class="guild-hint">Kısaltma gemi adının önünde görünür: <b>[TC★]${escapeHtml(profile.nick)}</b></small><button id="guildCreate">FİLO KUR</button></div>`;
    const tagInput=ui('guildTag') as HTMLInputElement;tagInput.oninput=()=>{tagInput.value=tagInput.value.toLocaleUpperCase('tr').replace(/\*/g,'★');};
    panel.querySelectorAll<HTMLButtonElement>('[data-gtab]').forEach(b=>b.onclick=()=>{guildTab=b.dataset.gtab as 'create'|'search';renderGuild();});
    ui('guildCreate').onclick=()=>{const name=(ui('guildName') as HTMLInputElement).value.trim(),tag=tagInput.value.trim(),te=tagError(tag);if(te){toast(te);return;}if(name.length<3){toast('Filo adı en az 3 harf olmalı');return;}if(guildOnline()){void guildAction(()=>createGuild(tag,name),`[${tag}] ${name} filosu kuruldu`);return;}const g:Guild={name,tag,role:'leader',treasury:0,donated:0,created:Date.now(),towers:{}};guild=g;for(const k of ownedFleetIslands())islandSlots(g,k);saveGuild(g);setupFleetIsland();rewardNotice(`[${tag}] ${name} filosu kuruldu`,'other');renderGuild();};return;}
  const g=guild,islands=ownedFleetIslands(),map=mapDef(),here=hasFleetIsland()?map.fleet.name:'',allowed=canBuild(g.role);
  // Kule resmi: tek tip filo kulesi
  const art=(_slot:number,_type:TowerType,ghost=false)=>`<i class="tower-art ${ghost?'ghost':''}"></i>`;
  const islandHtml=islands.length?islands.map(k=>{const m=MAPS[k],slots=islandSlots(g,k),cost=towerTypeCost(m.tier,buildType),built=slots.filter(Boolean).length;
    return`<article class="guild-island"><header><div><span class="eyebrow">${m.key} · Seviye ${m.tier}</span><h4>${m.fleet.name}</h4></div><b>${built} / ${TOWER_SLOTS} kule</b></header><div class="tower-slots">${slots.map((t,i)=>t?`<div class="tower-slot built">${art(i,t.type)}<small>${TOWER_TYPES[t.type].name}</small><em><span style="width:${Math.round(t.hp/t.maxHp*100)}%"></span></em></div>`:(ruin=>ruin?`<button class="tower-slot empty ruined" disabled title="Yıkılan kule 1 saat dolmadan yeniden dikilemez">${art(i,buildType,true)}<small>Kaide ${i+1} · yıkık</small><b>${ruinLabel(ruin)} sonra</b></button>`:`<button class="tower-slot empty" data-build="${k}:${i}" ${!allowed||(netIsland(k)?state.pearls:g.treasury)<cost?'disabled':''}>${art(i,buildType,true)}<small>Kaide ${i+1}</small><b>${allowed?`DİK · ${fmt(cost)} İnci`:'YETKİ YOK'}</b></button>`)(ruinLeft(towerRuins,k,i))).join('')}</div></article>`;}).join('')
    :`<p class="guild-empty">Filonun henüz bir adası yok. Filo adaları 2. seviye ve üstü denizlerdedir. Bir adanın son kulesini yıkan kaptanın filosu adayı alır; kaideler boşalır ve başkan ile yardımcı inciyle kule diker. Kulesiz kalan ada 1 saat içinde kule dikilmezse sahipsiz kalır. Hasarlı kuleler yalnızca şifa güllesiyle onarılır: şifa güllesini seçip kuleye tıkla.</p>`;
  const testClaim=FLEET_TEST_ENTRY&&!session.account&&!netIsland(currentMap)&&hasFleetIsland()&&fleetOwner()!=='player'?`<button class="guild-test" id="guildClaim">TEST: ${here} adasını filona kat</button>`:'';
  const testRole=FLEET_TEST_ENTRY&&!cloudGuild?`<label class="guild-test-role">TEST · rolün <select id="guildRole">${(Object.keys(ROLE_NAMES) as GuildRole[]).map(r=>`<option value="${r}" ${g.role===r?'selected':''}>${ROLE_NAMES[r]}</option>`).join('')}</select></label>`:'';
  panel.innerHTML=`<div class="guild-head"><div><span class="eyebrow">Filo</span><h3><em class="guild-tag">[${escapeHtml(g.tag)}]</em> ${escapeHtml(g.name)}</h3><small>${ROLE_NAMES[g.role]}: ${escapeHtml(profile.nick)} (sen) · Üye: ${cloudGuild?cloudGuild.members.length:1}</small></div><div class="guild-treasury"><span>FİLO HAZİNESİ</span><strong><i class="sprite icon-pearl"></i>${fmt(g.treasury)} İnci</strong><small>Senin bağışın: ${fmt(g.donated)} İnci</small></div></div>
    <div class="guild-members"><span class="eyebrow">Filo üyeleri ve yetkiler</span>${cloudGuild?cloudGuild.members.map(m=>{const me=m.uid===session.account?.uid;return`<div class="member-row ${me?'me':''}"><b>[${escapeHtml(g.tag)}]${escapeHtml(m.nick)}${me?' (sen)':''}</b><em class="role ${m.role}">${ROLE_NAMES[m.role]}</em><small>#${m.playerNo}</small><span class="member-actions">${g.role==='leader'&&!me&&m.role!=='leader'?`<button data-role="${m.uid}:${m.role==='deputy'?'member':'deputy'}" title="${m.role==='deputy'?'Üye yap':'Başkan yardımcısı yap'}">${m.role==='deputy'?'▼ ÜYE YAP':'▲ YARDIMCI YAP'}</button>`:''}${!me&&canKick(g.role,m.role)?`<button class="kick" data-kick="${m.uid}" title="Filodan at">✕</button>`:''}</span></div>`;}).join(''):`<div class="member-row"><b>[${escapeHtml(g.tag)}]${escapeHtml(profile.nick)}</b><em class="role ${g.role}">${ROLE_NAMES[g.role]}</em><small>Bağış: ${fmt(g.donated)} İnci</small></div>`}<p>Kule dikme yetkisi yalnızca <b>Filo Başkanı</b> ve <b>Başkan Yardımcısı</b>ndadır. Başkan, üyelerden birini yardımcı atar. Diğer üyeler hazineye inci bağışlar.</p>${testRole}</div>
    ${cloudGuild&&canManage(g.role)?`<div class="guild-apps"><span class="eyebrow">Başvurular (${cloudGuild.applications.length})</span>${cloudGuild.applications.length?cloudGuild.applications.map(a=>`<div class="member-row"><b>${escapeHtml(a.nick)}</b><small>#${a.playerNo}</small><span class="member-actions"><button class="accept" data-answer="${a.uid}:1">KABUL ET</button><button class="kick" data-answer="${a.uid}:0">REDDET</button></span></div>`).join(''):'<p>Bekleyen başvuru yok.</p>'}</div>`:''}
    <div class="guild-donate"><span>İnci bağışla <small>(elindeki: ${fmt(state.pearls)})</small></span>${[10,50,100].map(n=>`<button data-donate="${n}" ${state.pearls<n?'disabled':''}>+${n}</button>`).join('')}<input id="donateAmount" type="number" min="1" max="${state.pearls}" placeholder="Miktar"/><button id="donateCustom">BAĞIŞLA</button></div>
    ${testClaim}<div class="guild-islands">${islandHtml}</div>
    <div class="guild-leave"><button id="guildLeave">FİLODAN AYRIL</button>${canDisband(g.role)?'<button id="guildDisband" class="danger">FİLOYU KAPAT</button>':''}</div>`;
  ui('guildLeave').onclick=()=>{if(!confirm(g.role==='leader'?'Filodan ayrılırsan başkanlık yardımcına (yoksa en eski üyeye) geçer. Emin misin?':'Filodan ayrılmak istediğine emin misin?'))return;
    if(guildOnline())void guildAction(leaveGuild,'Filodan ayrıldın');else dropGuild('Filodan ayrıldın');};
  const dis=document.getElementById('guildDisband');if(dis)dis.onclick=()=>{if(!confirm(`[${g.tag}] ${g.name} filosu kalıcı olarak kapatılacak ve bütün üyeler filodan çıkacak. Emin misin?`))return;
    if(guildOnline())void guildAction(disbandGuild,'Filo kapatıldı');else dropGuild('Filo kapatıldı');};
  panel.querySelectorAll<HTMLButtonElement>('[data-kick]').forEach(b=>b.onclick=()=>{const m=cloudGuild?.members.find(x=>x.uid===b.dataset.kick);if(!m||!confirm(`${m.nick} filodan atılsın mı?`))return;void guildAction(()=>kickMember(m.uid),`${m.nick} filodan atıldı`);});
  panel.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(b=>b.onclick=()=>{const [uid,r]=b.dataset.role!.split(':') as [string,'deputy'|'member'];void guildAction(()=>setMemberRole(uid,r),r==='deputy'?'Başkan yardımcısı atandı':'Yardımcılıktan alındı');});
  panel.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>b.onclick=()=>{const [uid,ok]=b.dataset.answer!.split(':');void guildAction(()=>answerApplication(uid,ok==='1'),ok==='1'?'Başvuru kabul edildi':'Başvuru reddedildi');});
  const donate=(n:number)=>{n=Math.floor(n);if(!(n>0)){toast('Geçerli bir miktar gir');return;}if(state.pearls<n){toast('Yeterli incin yok');return;}state.pearls-=n;g.treasury+=n;g.donated+=n;saveGuild(g);saveAccount();updateUI();playCoins();rewardNotice(`Filo hazinesine ${fmt(n)} inci bağışlandı`,'other');renderGuild();};
  // Restore the selected foundation after type changes, donations and construction.
  panel.querySelectorAll<HTMLElement>('.guild-island').forEach((article,index)=>{
    article.querySelectorAll<HTMLElement>('.tower-slot').forEach((slot,i)=>{
      const key=`${islands[index]}:${i}`;slot.dataset.foundation=key;
      slot.classList.toggle('chosen-foundation',key===focusedFoundation);
    });
  });
  panel.querySelectorAll<HTMLButtonElement>('[data-donate]').forEach(b=>b.onclick=()=>donate(Number(b.dataset.donate)));
  ui('donateCustom').onclick=()=>donate(Number((ui('donateAmount') as HTMLInputElement).value));
  panel.querySelectorAll<HTMLButtonElement>('[data-build]').forEach(b=>b.onclick=()=>{if(!canBuild(g.role)){toast('Kule dikme yetkisi yalnızca başkan ve yardımcısında');return;}
    const [k,i]=b.dataset.build!.split(':') as [MapKey,string],m=MAPS[k],type=buildType,cost=towerTypeCost(m.tier,type),slots=islandSlots(g,k);
    if(slots[+i]){toast('Bu kaidede zaten bir kule var');renderGuild();return;}
    const ruin=ruinLeft(towerRuins,k,+i);if(ruin){toast(`Bu kaidedeki kule yıkıldı; ${ruinLabel(ruin)} sonra yeniden dikilebilir`);renderGuild();return;}
    if(netIsland(k)){if(state.pearls<cost){toast(`${fmt(cost)} inci gerekli`);return;}b.disabled=true;void buildIslandTower(k,+i).then(r=>{if('error' in r){toast(r.error);renderGuild();return;}
      state.pearls-=r.cost;session.pearlServerAdd?.(-r.cost);saveAccount();updateUI();sendTowerBuilt(k);playCoins();rewardNotice(`${m.fleet.name}: ${+i+1}. kaideye ${TOWER_TYPES[type].name} dikildi · −${fmt(r.cost)} inci`,'shop');});return;}
    if(g.treasury<cost){toast(`Filo hazinesinde ${fmt(cost)} inci gerekli`);return;}g.treasury-=cost;const hp=fleetTower(m.tier).hp;slots[+i]={hp,maxHp:hp,type};saveGuild(g);if(k===currentMap)setupFleetIsland();playCoins();rewardNotice(`${m.fleet.name}: ${+i+1}. kaideye ${TOWER_TYPES[type].name} dikildi · −${fmt(cost)} inci`,'shop');renderGuild();});
  const role=document.getElementById('guildRole') as HTMLSelectElement|null;if(role)role.onchange=()=>{g.role=role.value as GuildRole;saveGuild(g);renderGuild();toast(`Test: rolün ${ROLE_NAMES[g.role]}`);};
  const claim=document.getElementById('guildClaim');if(claim)claim.onclick=()=>{fleetOwners[currentMap]='player';saveFleetOwners(fleetOwners);clearRuins(towerRuins,currentMap);g.towers[currentMap]=Array(TOWER_SLOTS).fill(null);saveGuild(g);enemies.splice(0,enemies.length,...enemies.filter(e=>!e.tower));setupFleetIsland();rewardNotice(`Test · ${map.fleet.name} filona katıldı`,'other');renderGuild();};
}
function openCrew(){renderCrew();ui('crewOverlay').classList.add('open');}
function closeCrew(){ui('crewOverlay').classList.remove('open');}
function renderCrew(){
  const slots=officerSlots(state.level);
  ui('crewPanel').innerHTML=`<p class="talent-points">Görevdeki subaylar: <b>${crew.active.length} / ${slots}</b> <small>Yuvalar 3. ve 6. seviyede açılır. Yalnızca görevdeki subaylar bonus verir.</small></p><div class="officer-grid">${(Object.keys(OFFICERS) as OfficerId[]).map(id=>{const o=OFFICERS[id],rank=crew.officers[id]||0,active=crew.active.includes(id),cost=officerCost(rank),maxed=rank>=OFFICER_MAX_RANK;
    return`<article class="officer ${active?'active':''} ${rank?'hired':''}"><img src="${o.icon}" alt=""/><div><span>${o.title}</span><h4>${o.name}</h4><small>${o.per} / rütbe</small><i>${'★'.repeat(rank)}${'☆'.repeat(OFFICER_MAX_RANK-rank)}</i></div><footer>${rank?`<button data-officer-toggle="${id}">${active?'GÖREVDEN AL':'GÖREVE AL'}</button>`:''}<button data-officer-rank="${id}" ${maxed?'disabled':''}>${maxed?'AZAMİ RÜTBE':rank?`RÜTBE ↑ ${fmt(cost)} ALTIN`:`İŞE AL · ${fmt(cost)} ALTIN`}</button></footer></article>`;}).join('')}</div>`;
  document.querySelectorAll<HTMLButtonElement>('[data-officer-rank]').forEach(b=>b.onclick=()=>{const id=b.dataset.officerRank as OfficerId,rank=crew.officers[id]||0,cost=officerCost(rank);if(rank>=OFFICER_MAX_RANK)return;if(state.gold<cost){toast('Yeterli altının yok');return;}state.gold-=cost;crew.officers[id]=rank+1;if(!rank&&crew.active.length<officerSlots(state.level))crew.active.push(id);saveAccount();refreshBonus();renderCrew();updateUI();rewardNotice(`${OFFICERS[id].name} ${rank?`${rank+1}. rütbeye yükseldi`:'tayfaya katıldı'}`,'shop');});
  document.querySelectorAll<HTMLButtonElement>('[data-officer-toggle]').forEach(b=>b.onclick=()=>{const id=b.dataset.officerToggle as OfficerId,i=crew.active.indexOf(id);if(i>=0)crew.active.splice(i,1);else{if(crew.active.length>=officerSlots(state.level)){toast('Boş subay yuvası yok');return;}crew.active.push(id);}refreshBonus();renderCrew();});
}
// Profilde rütbe madalyaları: kazanılanlar parlak, sıradaki vurgulu, kalanlar soluk (SP eşiğiyle)
function renderRankMedals(){const cur=battleRank(state.battlePoints).index;
  ui('rankMedalSummary').textContent=`${cur+1} / ${BATTLE_RANKS.length} madalya · ${BATTLE_RANKS[cur].name}`;
  ui('rankMedals').innerHTML=BATTLE_RANKS.map((r,i)=>`<div class="rank-medal ${i<=cur?'earned':''} ${i===cur+1?'next':''}" title="${r.name} · ${fmt(r.sp)} SP">${rankBadgeHtml(i)}<b>${r.name}</b><small>${fmt(r.sp)} SP</small></div>`).join('');}
// HTML içinde rütbe rozeti (profil, sıralama)
function rankBadgeHtml(rank:number){const i=rankIcon(rank),rows=Math.ceil(RANK_ICONS/RANK_COLS);
  return`<i class="rank-badge" style="background-image:url(${RANK_SHEET});background-size:${RANK_COLS*100}% ${rows*100}%;background-position:${(i%RANK_COLS)/(RANK_COLS-1)*100}% ${Math.floor(i/RANK_COLS)/Math.max(1,rows-1)*100}%"></i>`;}
// ---------------------------------------------------------------- Seyir defteri
// Yeniden eskiye; gün değişince tarih başlığı. Üstte bugünün özeti (batırma, TP, altın, SP).
let logFilter:LogKind|'all'='all';
function renderLogbook(){const sum=daySummary(logbook),rows=logbook.filter(e=>logFilter==='all'||e.kind===logFilter).slice().reverse();
  const day=(t:number)=>new Date(t).toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'}),time=(t:number)=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  let last='',list='';for(const e of rows){const d=day(e.t);if(d!==last){list+=`<h4 class="log-day">${d}</h4>`;last=d;}list+=`<div class="log-row ${e.kind}"><time>${time(e.t)}</time><span>${escapeHtml(e.text)}</span></div>`;}
  ui('logPanel').innerHTML=`<div class="log-summary"><span>BUGÜN</span><b>${fmt(sum.sinks)} batırma</b><b>+${fmt(sum.xp)} TP</b><b>+${fmt(sum.gold)} altın</b><b>+${fmt(sum.sp)} SP</b></div>
    <div class="rank-tabs log-tabs">${LOG_KINDS.map(k=>`<button data-log-kind="${k.id}" class="${k.id===logFilter?'active':''}">${k.name}</button>`).join('')}</div>
    <div class="log-list">${list||'<p class="rank-empty">Henüz kayıt yok. Batırdığın gemiler, kazançların ve alışverişlerin burada görünür.</p>'}</div>`;
  ui('logPanel').querySelectorAll<HTMLButtonElement>('[data-log-kind]').forEach(b=>b.onclick=()=>{logFilter=b.dataset.logKind as typeof logFilter;renderLogbook();});}
function openLogbook(){renderLogbook();ui('logOverlay').classList.add('open');}
function closeLogbook(){ui('logOverlay').classList.remove('open');}
// ---------------------------------------------------------------- Sıralamalar
// Sunucu gelene kadar tablo bu tarayıcıdaki kaptandan (test modunda test kaptanları da) kurulur.
let rankBoard:BoardId='xp',rankPageNo=0;
const TEST_RANKERS:RankPlayer[]=[
  {nick:'ADM_AHMET',tag:'TC★',fleet:'Türk Korsanları',level:8,xp:4_200_000,ep:3_100_000,sp:61_000,npc:8_400,monster:410,boss:14,treasure:31},
  {nick:'ADM_YASİN',tag:'TC★',fleet:'Türk Korsanları',level:7,xp:2_900_000,ep:1_450_000,sp:23_500,npc:5_100,monster:260,boss:7,treasure:18},
  {nick:'ADM_DOGAN',tag:'KRK',fleet:'Kara Kartallar',level:6,xp:900_000,ep:640_000,sp:9_800,npc:3_300,monster:120,boss:3,treasure:9},
];
function rankData(){const me:RankPlayer={nick:profile.nick,tag:guild?.tag??null,fleet:guild?.name??null,level:state.level,xp:state.fame,ep:state.elitePoints,sp:state.battlePoints,npc:ach.stats.npc,monster:ach.stats.monster,boss:ach.stats.boss,treasure:ach.stats.treasure,me:true};
  // Sunucu sıralaması 6 saatte bir donar: kendi satırın da o anki değerlerle durur (puanlar herkes için aynı anda hesaplanır)
  const players=serverRanks?serverRanks:[me,...(ELITE_TEST_MODE?TEST_RANKERS:[])],fleets:RankFleet[]=[];
  for(const p of players){if(!p.tag||!p.fleet)continue;let f=fleets.find(x=>x.tag===p.tag);if(!f){f={tag:p.tag,name:p.fleet,members:[]};fleets.push(f);}f.members.push(p);if(p.me)f.me=true;}
  return{players,fleets};}
// Her sayfada 100 sıra; liste pencere içinde kayar, altta sayfa düğmeleri ve "Sıram" kısayolu
function renderRanks(){const {players,fleets}=rankData(),board=BOARDS.find(b=>b.id===rankBoard)!,all=rankRows(rankBoard,players,fleets),pg=rankPage(all,rankPageNo);rankPageNo=pg.page;
  const tabs=(fleet:boolean)=>BOARDS.filter(b=>b.fleet===fleet).map(b=>`<button data-board="${b.id}" class="${b.id===rankBoard?'active':''}">${b.name}</button>`).join('');
  const mine=all.findIndex(r=>r.me),from=pg.page*RANK_PAGE_SIZE;
  const row=(r:RankRow)=>`<div class="rank-row ${r.me?'me':''} ${r.rank<=3?'top'+r.rank:''}"><b>${r.rank}</b><span><span>${r.tag?`<em class="guild-tag">[${escapeHtml(r.tag)}]</em>`:''}${escapeHtml(r.name)}${r.sp!==undefined?rankBadgeHtml(battleRank(r.sp).index):''}${r.me?' <i>(sen)</i>':''}</span><small>${escapeHtml(r.sub)}</small></span><strong>${fmt(r.score)} <small>${board.unit}</small></strong></div>`;
  ui('rankPanel').innerHTML=`<div class="rank-tabs"><span>OYUNCU</span>${tabs(false)}</div><div class="rank-tabs"><span>FİLO</span>${tabs(true)}</div>
    <p class="quest-intro">${board.desc}. ${ELITE_TEST_MODE?'Test modu: örnek kaptanlar listede. ':''}${rankAt?`Sıralama 6 saatte bir yenilenir · son güncelleme ${rankAt.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · sonraki ${new Date(rankAt.getTime()+6*3600e3).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`:'Sıralama 6 saatte bir yenilenir.'}</p>
    <div class="rank-table" id="rankTable">${pg.rows.length?pg.rows.map(row).join(''):`<p class="rank-empty">${board.fleet?'Henüz sıralamada filo yok. Bir filo kur ya da bir filoya katıl.':'Henüz sıralamada kimse yok.'}</p>`}</div>
    <div class="rank-pager"><button data-page="${pg.page-1}" ${pg.page<=0?'disabled':''}>‹ ÖNCEKİ</button><span>Sayfa ${pg.page+1} / ${pg.pages}${all.length?` · ${fmt(from+1)}–${fmt(from+pg.rows.length)}. sıra`:''}</span>${mine>=0?`<button data-page="${Math.floor(mine/RANK_PAGE_SIZE)}" class="rank-mine">SIRAM: ${fmt(all[mine].rank)}</button>`:''}<button data-page="${pg.page+1}" ${pg.page>=pg.pages-1?'disabled':''}>SONRAKİ ›</button></div>`;
  ui('rankPanel').querySelectorAll<HTMLButtonElement>('[data-board]').forEach(b=>b.onclick=()=>{rankBoard=b.dataset.board as BoardId;rankPageNo=0;renderRanks();});
  ui('rankPanel').querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b=>b.onclick=()=>{rankPageNo=Number(b.dataset.page);renderRanks();
    const me=ui('rankTable').querySelector<HTMLElement>('.rank-row.me');if(b.classList.contains('rank-mine')&&me)me.scrollIntoView({block:'center'});else ui('rankTable').scrollTop=0;});}
// Hesapla oynarken sıralama sunucudaki değerlerden gelir (rank_players); bağlantı yoksa yalnız bu kaptan görünür
// Yönetici etkinliği: hasar ödülleri 4 sn'de bir tek bildirimde toplanır
let aevGain={xp:0,ep:0,pearls:0},aevGainTimer=0;
let serverRanks:RankPlayer[]|null=null,rankAt:Date|null=null;
async function loadServerRanks(){const sb=supa();if(!sb||!session.account)return;const {data,error}=await sb.rpc('rank_players');if(error||!Array.isArray(data))return;
  serverRanks=(data as (RankPlayer&{me:boolean})[]).map(r=>({nick:r.nick,tag:r.tag,fleet:r.fleet,level:Number(r.level),xp:Number(r.xp),ep:Number(r.ep),sp:Number(r.sp),npc:Number(r.npc),monster:Number(r.monster),boss:Number(r.boss),treasure:Number(r.treasure),me:r.me}));
  {const at=(data[0] as {at?:string}|undefined)?.at;rankAt=at?new Date(at):null;}
  if(ui('rankOverlay').classList.contains('open'))renderRanks();}
function openRanks(){rankPageNo=0;renderRanks();ui('rankOverlay').classList.add('open');void loadServerRanks();}
function closeRanks(){ui('rankOverlay').classList.remove('open');}
// ---------------------------------------------------------------- Kupon kodu
const redeemedCoupons=loadRedeemed();
function openCoupon(){(ui('couponInput') as HTMLInputElement).value='';ui('couponResult').textContent='';ui('couponResult').className='coupon-result';ui('couponOverlay').classList.add('open');setTimeout(()=>(ui('couponInput') as HTMLInputElement).focus(),50);}
function closeCoupon(){ui('couponOverlay').classList.remove('open');}
// Hesapla girişte kupon sunucuda kontrol edilir (kullanım sınırı, hesap başına bir kez); inci doğrudan cüzdana eklenir
// Test modunda her açılışta bol inci verildiği için cüzdan eşitlemesi kapalı
session.pearlSyncOff=ELITE_TEST_MODE;
// ---------------------------------------------------------------- Sunucu ekonomisi
// Altın, TP, EP, SP, seviye, gülleler, malzemeler, toplar, geliştirmeler, donanım ve elit gemi sunucuda tutulur (010_economy.sql).
// Oyun her değişimi kazanç (g) ya da harcama (s) olarak biriktirir; eşitlemede sunucu kabul ettiği değerleri döner, fark buraya uygulanır.
const ECON_STATS=['npc','heavy','monster','boss','chest','treasure','quest','eliteBalls'] as const;
const ECON_AMMO=['fire','explosive','breaker','leech','heal','mine','powder','shield','speed','compass','spyShield'] as const;
function econFlat():Record<string,number>{const f:Record<string,number>={gold:state.gold,xp:state.fame,ep:state.elitePoints,sp:state.battlePoints,level:state.level,chain:state.chainAmmo,iron:state.ironAmmo,elite:elitePurchased?1:0};
  for(const c of Object.keys(cannonInventory) as CannonKind[])f['c_'+c]=cannonInventory[c]+mountedCannons[c];
  for(const u of Object.keys(upgrades) as UpgradeKind[])f['u_'+u]=upgrades[u];
  for(const q of EQUIPMENT)f['e_'+q.id]=(equipOwned[q.id]??0)+Object.values(equipped).filter(x=>x===q.id).length;
  for(const a of ECON_AMMO)f['a_'+a]=arsenal[a];
  f.design=designOwned?1:0;for(const o of Object.keys(OFFICERS) as OfficerId[])f['o_'+o]=crew.officers[o]??0;for(const t of ECON_STATS)f['st_'+t]=ach.stats[t]??0;
  for(const k in f)f[k]=Math.max(0,Math.round(f[k]||0));return f;}
function econAdjust(k:string,d:number){if(!d)return;
  if(k==='gold')state.gold=Math.max(0,state.gold+d);else if(k==='xp')state.fame=Math.max(0,state.fame+d);else if(k==='ep')state.elitePoints=Math.max(0,state.elitePoints+d);
  else if(k==='sp')state.battlePoints=Math.max(0,state.battlePoints+d);else if(k==='level')state.level=Math.max(1,Math.min(MAX_LEVEL,state.level+d));
  else if(k==='chain')state.chainAmmo=Math.max(0,state.chainAmmo+d);else if(k==='iron')state.ironAmmo=Math.max(0,state.ironAmmo+d);else if(k==='elite')elitePurchased=elitePurchased?d>-1:d>0;
  else if(k.startsWith('c_')){const c=k.slice(2) as CannonKind;if(!(c in cannonInventory))return;if(d>0)cannonInventory[c]+=d;else{const a=Math.min(cannonInventory[c],-d);cannonInventory[c]-=a;mountedCannons[c]=Math.max(0,mountedCannons[c]-(-d-a));}}
  else if(k.startsWith('u_')){const u=k.slice(2) as UpgradeKind;if(u in upgrades){upgrades[u]=Math.max(0,Math.min(10,upgrades[u]+d));if(u==='hull')state.maxHp=baseMaxHp();}}
  else if(k.startsWith('e_')){const id=k.slice(2);let left=(equipOwned[id]??0)+d;if(left<0){for(const sl of Object.keys(equipped) as EquipSlot[])if(left<0&&equipped[sl]===id){equipped[sl]=null;left++;}}equipOwned[id]=Math.max(0,left);}
  else if(k.startsWith('a_')){const a=k.slice(2) as typeof ECON_AMMO[number];if(a in arsenal)arsenal[a]=Math.max(0,arsenal[a]+d);}
  else if(k==='design'){designOwned=designOwned?d>-1:d>0;saveDesignOwned();}
  else if(k.startsWith('o_')){const o=k.slice(2) as OfficerId;if(o in OFFICERS){crew.officers[o]=Math.max(0,Math.min(OFFICER_MAX_RANK,(crew.officers[o]??0)+d));if(!crew.officers[o])crew.active=crew.active.filter(x=>x!==o);saveCrew(crew);bonus=computeBonus(crew);}}
  else if(k.startsWith('st_')){const t=k.slice(3) as typeof ECON_STATS[number];if(t in ach.stats){ach.stats[t]=Math.max(0,(ach.stats[t]??0)+d);saveAchievements(ach);}}}
// Sunucunun saydığı seviye görevi batırmaları (014): seviye ancak sunucu onaylayınca atlanır, TP boşa gitmez
let serverLqk:number|null=null;
// Veritabanının kendisi düştüğü harcama (ihale teklifi): yerelde de düşülür ama eşitlemede ikinci kez bildirilmez
function econServerSpent(k:string,n:number){if(econOn&&session.account)econLast[k]=(econLast[k]??0)-n;}
let econOn=false,econLast:Record<string,number>={},econG:Record<string,number>={},econS:Record<string,number>={},pearlLast=state.pearls,pearlG=0,pearlS=0;
function econTick(){if(!econOn)return;const f=econFlat();for(const k in f){const d=f[k]-(econLast[k]??f[k]);if(d>0)econG[k]=(econG[k]??0)+d;else if(d<0)econS[k]=(econS[k]??0)-d;}econLast=f;
  const dp=state.pearls-pearlLast;if(dp>0)pearlG+=dp;else if(dp<0)pearlS-=dp;pearlLast=state.pearls;}
function econSettle(){econLast=econFlat();pearlLast=state.pearls;saveAccount();saveArsenal(arsenal);updateUI();renderQuickSlots();}
if(session.account&&session.econStart&&!ELITE_TEST_MODE){econOn=true;const st=session.econStart.state,cur=econFlat();
  for(const k in st)econAdjust(k,Math.round(st[k])-(cur[k]??0));state.pearls=session.econStart.pearls;if(st.lqk!==undefined)serverLqk=Number(st.lqk);
  // Başarımlar ve yetenekler sunucudaki değerlerden türetilir: elle eklenen açılmış başarım ya da fazla yetenek puanı silinir
  ach.unlocked=ach.unlocked.filter(id=>{const d=ACHIEVEMENTS.find(a=>a.id===id);return!!d&&(d.stat==='level'||d.stat==='daily'||ach.stats[d.stat]>=d.goal);});if(!MAIN_COLLECTION.every(id=>ach.unlocked.includes(id)))ach.collectionComplete=false;saveAchievements(ach);achBonusCache=achievementBonus(ach);
  void loadServerClaims();
  if(spentPoints(crew)>talentPoints(state.level)){crew.talents={};saveCrew(crew);}crew.active=crew.active.filter(o=>(crew.officers[o]??0)>0).slice(0,officerSlots(state.level));saveCrew(crew);bonus=computeBonus(crew);
  // Açılışta ekran henüz kurulmadı: değerler kaydedilir, ekran oyun kurulunca güncellenir
  econLast=econFlat();pearlLast=state.pearls;saveAccount();saveArsenal(arsenal);setTimeout(()=>{updateUI();renderQuickSlots();},0);setInterval(econTick,250);
  session.pearlServerAdd=n=>{pearlLast+=n;};
  session.econCollect=()=>{econTick();const items:Record<string,{v:number;g:number;s:number}>={};for(const k in econLast)items[k]={v:econLast[k],g:econG[k]??0,s:econS[k]??0};
    const b={items,pearlG,pearlS,sent:{...econLast},pearlSent:state.pearls};econG={};econS={};pearlG=0;pearlS=0;return b;};
  session.econRestore=b=>{for(const k in b.items){econG[k]=(econG[k]??0)+b.items[k].g;econS[k]=(econS[k]??0)+b.items[k].s;}pearlG+=b.pearlG;pearlS+=b.pearlS;};
  session.econApply=(b,st2,pearls)=>{econTick();if(st2.lqk!==undefined)serverLqk=Number(st2.lqk);for(const k in st2)econAdjust(k,Math.round(st2[k])-(b.sent[k]??Math.round(st2[k])));state.pearls=Math.max(0,state.pearls+pearls-b.pearlSent);econSettle();};}
session.onPearlFix=d=>{state.pearls=Math.max(0,state.pearls+d);saveAccount();updateUI();};
async function redeemCoupon(){const input=ui('couponInput') as HTMLInputElement,out=ui('couponResult');
  if(session.account){const sb=supa();if(!sb)return;if(normalizeCode(input.value).length<4){out.textContent='Kupon kodunu gir';out.className='coupon-result bad';return;}
    const {data,error}=await sb.rpc('coupon_redeem',{p_code:input.value});if(error){out.textContent=error.message.replace(/^.*?: /,'')||'Kupon kullanılamadı';out.className='coupon-result bad';return;}
    const w=(data??{}) as CouponReward;session.pearlServerAdd?.(w.pearls??0);applyCoupon(w);return;}
  const r=await redeem(input.value,redeemedCoupons,dayKey());
  if(!r.ok){out.textContent=r.error;out.className='coupon-result bad';return;}
  saveRedeemed(redeemedCoupons);applyCoupon(r.coupon.reward);}
function applyCoupon(w:CouponReward){const input=ui('couponInput') as HTMLInputElement,out=ui('couponResult');state.pearls+=w.pearls??0;state.gold+=w.gold??0;state.fame+=w.xp??0;state.elitePoints+=w.ep??0;
  for(const [k,n] of Object.entries(w.items??{})){const v=Math.max(0,Math.floor(Number(n)||0));if(!v)continue;if(k==='iron')state.ironAmmo+=v;else if(k==='chain')state.chainAmmo+=v;else if(k in arsenal)(arsenal as unknown as Record<string,number>)[k]+=v;}
  if(w.design==='pirate-rage'){designOwned=true;saveDesignOwned();}
  saveArsenal(arsenal);renderQuickSlots();
  saveAccount();updateUI();playCoins();input.value='';out.textContent=`Kupon kullanıldı: ${rewardText(w)}`;out.className='coupon-result ok';rewardNotice(`Kupon kullanıldı · ${rewardText(w)}`);}
function openSettings(){rebinding=null;renderSettings();ui('settingsOverlay').classList.add('open');}
function closeSettings(){rebinding=null;ui('settingsOverlay').classList.remove('open');}
function refreshBindHints(){document.querySelectorAll<HTMLElement>('[data-bind]').forEach(el=>{el.textContent=keyLabel(settings.binds[el.dataset.bind as ActionId]);});}
function renderSettings(){
  const groups=[...new Set(ACTIONS.map(a=>a.group))];
  ui('settingsPanel').innerHTML=`<section class="settings-block"><h3>SES</h3><div class="sound-row"><button id="soundToggle" class="${settings.sound?'on':''}">${settings.sound?'SES AÇIK':'SES KAPALI'}</button><label>Efekt sesi<input id="soundVolume" type="range" min="0" max="100" value="${Math.round(settings.volume*100)}" ${settings.sound?'':'disabled'}/></label><label>Müzik sesi<input id="musicVolume" type="range" min="0" max="100" value="${Math.round(settings.music*100)}" ${settings.sound?'':'disabled'}/></label></div></section><section class="settings-block"><h3>GÖRÜNÜM</h3><div class="quality-row"><span>Görüntü kalitesi</span>${(['auto','high','saver'] as const).map(q=>`<button data-quality="${q}" class="${settings.quality===q?'on':''}">${q==='auto'?'OTOMATİK':q==='high'?'YÜKSEK':'PİL TASARRUFU'}</button>`).join('')}</div><p class="quality-note">${settings.quality==='auto'?'Cihazın hızına göre en keskin görüntü seçilir.':settings.quality==='high'?'Her zaman en keskin görüntü (zayıf cihazda yavaşlayabilir).':'Daha az pil ve ısınma, biraz daha yumuşak görüntü.'}</p><label class="settings-check"><input type="checkbox" id="hideOthersInsignia" ${settings.hideOthersInsignia?'checked':''}/><span>Diğer oyuncuların güverte işaretlerini ve rütbe rozetlerini gizle</span></label></section>${session.passwordReset?`<section class="settings-block"><h3>HESAP</h3><div class="sound-row"><button id="pwReset">ŞİFRE DEĞİŞTİR</button><button id="deleteAccount" class="danger">HESABIMI SİL</button></div><div class="settings-legal"><a href="/kurallar/" data-legal>Oyun Kuralları</a><a href="/sartlar/" data-legal>Hizmet Sözleşmesi</a><a href="/gizlilik/" data-legal>Gizlilik Politikası</a><a href="mailto:destek@piraterage.com">Destek: destek@piraterage.com</a>${blockedList().length?`<button id="unblockAll">ENGELLENEN ${blockedList().length} OYUNCUNUN ENGELİNİ KALDIR</button>`:''}</div><p class="quality-note">E-posta adresine şifre değiştirme bağlantısı gönderilir. Bağlantıya tıklayıp yeni şifreni belirleyebilirsin. Hesabını silersen kaptanın, incilerin ve bütün oyun verin kalıcı olarak silinir.</p></section>`:''}
  <section class="settings-block keybinds-block"><h3>KLAVYE KISAYOLLARI <button id="resetBinds">VARSAYILANA DÖN</button></h3><p>Değiştirmek istediğin eyleme tıkla, sonra yeni tuşa bas. ESC iptal eder. Ok tuşları her zaman haritayı kaydırmak için de çalışır.</p>${groups.map(g=>`<h4>${g}</h4><div class="bind-grid">${ACTIONS.filter(a=>a.group===g).map(a=>`<button class="bind ${rebinding===a.id?'listening':''}" data-rebind="${a.id}"><span>${a.label}</span><kbd>${rebinding===a.id?'TUŞA BAS…':keyLabel(settings.binds[a.id])}</kbd></button>`).join('')}</div>`).join('')}</section>`;
  ui('soundToggle').onclick=()=>{settings.sound=!settings.sound;setAudio(settings.sound,settings.volume,settings.music);saveSettings(settings);renderSettings();};
  (ui('soundVolume') as HTMLInputElement).oninput=e=>{settings.volume=Number((e.target as HTMLInputElement).value)/100;setAudio(settings.sound,settings.volume,settings.music);saveSettings(settings);};
  (ui('musicVolume') as HTMLInputElement).oninput=e=>{settings.music=Number((e.target as HTMLInputElement).value)/100;setAudio(settings.sound,settings.volume,settings.music);saveSettings(settings);};
  document.querySelectorAll<HTMLButtonElement>('[data-quality]').forEach(b=>b.onclick=()=>{settings.quality=b.dataset.quality as typeof settings.quality;dprCap=2.5;saveSettings(settings);resize();renderSettings();});
  document.querySelectorAll<HTMLAnchorElement>('#settingsPanel a[data-legal]').forEach(a=>a.onclick=e=>{e.preventDefault();const path=a.getAttribute('href')!;if(isNativeApp())void openExternal(SITE_URL+path);else window.open(path,'_blank','noopener');});
  {const ub=document.getElementById('unblockAll');if(ub)ub.onclick=()=>{setBlocked([]);toast('Engeller kaldırıldı');renderSettings();};}
  {const del=document.getElementById('deleteAccount') as HTMLButtonElement|null;if(del&&session.deleteAccount)del.onclick=async()=>{
    if(!confirm('Hesabın kalıcı olarak silinecek: kaptanın, incilerin, gemilerin ve bütün oyun verin geri getirilemez. Devam etmek istiyor musun?'))return;
    if((prompt('Onaylamak için SİL yaz')||'').trim().toLocaleUpperCase('tr')!=='SİL'){toast('Hesap silme iptal edildi');return;}
    del.disabled=true;const bad=await session.deleteAccount!();if(bad){del.disabled=false;toast(bad);return;}alert('Hesabın silindi.');location.href=location.pathname;};}
  const pw=document.getElementById('pwReset') as HTMLButtonElement|null;if(pw)pw.onclick=async()=>{pw.disabled=true;const bad=await session.passwordReset!();if(bad){pw.disabled=false;toast(bad);return;}pw.textContent='MAİL GÖNDERİLDİ';toast('Şifre değiştirme bağlantısı e-postana gönderildi');};
  (ui('hideOthersInsignia') as HTMLInputElement).onchange=e=>{settings.hideOthersInsignia=(e.target as HTMLInputElement).checked;saveSettings(settings);};
  ui('resetBinds').onclick=()=>{settings.binds={...DEFAULT_BINDS};saveSettings(settings);renderQuickSlots();refreshBindHints();renderSettings();toast('Kısayollar varsayılana döndü');};
  document.querySelectorAll<HTMLButtonElement>('[data-rebind]').forEach(b=>b.onclick=()=>{rebinding=b.dataset.rebind as ActionId;renderSettings();});
}
// ---- Kaptan & Muço (ayarlar)
// Test modunda örnek istekler (sunucu gelene kadar arayüzü denemek için)
if(session.account)setTimeout(()=>{void loadServerMentor();},3000);
if(ELITE_TEST_MODE&&!mentorship.requests.length&&!mentorship.apprentices.length){mentorship.requests=[{nick:'Acemi_Deniz',level:2},{nick:'TayfaAli',level:4},{nick:'MiçoKaan',level:5}];saveMentorship(mentorship);}
function openMentorship(){renderMentorship();ui('mentorOverlay').classList.add('open');void loadServerMentor();}
// Hesapla oynarken usta-çırak sunucuda (012_mentorship.sql): istekler, bağlar ve sandıklar sunucudan gelir
let mentorServer=false,mentorSent:string[]=[];
type ServerMentor={mentor:{nick:string;level:number}|null;graduated:boolean;hadMentor:boolean;apprentices:{nick:string;level:number}[];graduates:number;requests:{nick:string;level:number}[];sent:string[];pending:{key:string;label:string;gold:number;pearls:number}[];claimed:number};
async function mentorRpc(fn:string,args?:Record<string,unknown>):Promise<unknown>{const sb=supa();if(!sb||!session.account)return undefined;const {data,error}=await sb.rpc(fn,args);
  if(error?.code==='PGRST202'){mentorServer=false;return undefined;}if(error){toast(error.message.replace(/^.*?: /,''));return null;}return data;}
async function loadServerMentor(){const d=await mentorRpc('mentor_get') as ServerMentor|null|undefined;if(!d)return;mentorServer=true;mentorSent=d.sent??[];
  mentorship={mentor:d.mentor,apprentices:d.apprentices.map(a=>({...a,rewarded:[]})),requests:d.requests,lockedOut:d.hadMentor||state.level>APPRENTICE_MAX_LEVEL,graduated:d.graduated,graduates:Number(d.graduates)||0,
    pending:d.pending.map(r=>({...r,gold:Number(r.gold),pearls:Number(r.pearls)})),claimed:Array.from({length:Number(d.claimed)||0},(_,i)=>`#${i}`)};saveMentorship(mentorship);
  if(ui('mentorOverlay').classList.contains('open'))renderMentorship();}
function closeMentorship(){ui('mentorOverlay').classList.remove('open');}
function renderMentorship(){ui('mentorPanel').innerHTML=mentorshipHtml();bindMentorship();}
function mentorshipHtml(){
  const m=mentorship,lv=state.level,esc=escapeHtml;
  const role=m.mentor?`Muço · Ustan: <b>${esc(m.mentor.nick)}</b> (Sv. ${m.mentor.level})`:canMentor(lv)?`Usta Kaptan · ${m.apprentices.length}/${MAX_APPRENTICES} muço${m.graduates?` · ${m.graduates} mezun`:''}`:apprenticeBlock(m,lv)??'Bir usta kaptana çıraklık isteği gönderebilirsin';
  const reqs=m.requests.length?m.requests.map(r=>{const block=pairBlock(m,lv,r);return`<div class="mate-row"><span><b>${esc(r.nick)}</b> · Sv. ${r.level}</span>${block?`<em title="${esc(block)}">${esc(block)}</em>`:''}<span class="mate-btns"><button data-mate-accept="${esc(r.nick)}" ${block?'disabled':''}>KABUL</button><button data-mate-reject="${esc(r.nick)}">REDDET</button></span></div>`;}).join(''):'<p class="mate-empty">Bekleyen çıraklık isteği yok.</p>';
  const apps=m.apprentices.length?m.apprentices.map(a=>`<div class="mate-row"><span><b>${esc(a.nick)}</b> · Sv. ${a.level}</span><span class="mate-btns"><button data-mate-remove="${esc(a.nick)}">ÇIKAR</button></span></div>`).join(''):'<p class="mate-empty">Henüz muçon yok.</p>';
  // Ödüller sandık olarak: kilitli / hazır (parlar) / alındı; sandığa tıklayınca içeriği ve TALEP ET görünür
  const chest=(key:string,lvl:number,g:{gold:number;pearls:number},title:string,locked:string)=>{const pend=m.pending.some(r=>r.key===key),done=m.claimed.includes(key);
    return`<button class="mate-chest ${done?'done':pend?'ready':'locked'}" data-chest="${esc(key)}" data-chest-title="${esc(title)}" data-chest-gold="${g.gold}" data-chest-pearls="${g.pearls}" data-chest-state="${done?'done':pend?'ready':'locked'}" data-chest-locked="${esc(locked)}" title="${esc(title)}"><img src="/assets/icon-chest-v2.webp" alt="" draggable="false"/><b>${lvl}</b>${done?'<i>✓</i>':''}</button>`;};
  // Yalnız kazanılmış (talep edilmemiş) sandıklar listelenir; alınan sandık listeden düşer
  const earned=m.pending.map(r=>{const lv=Number(r.key.slice(r.key.lastIndexOf('-')+1))||0;return chest(r.key,lv,r,r.label,'');}).join('');
  const rewards=`<h4>Kazanılan sandıklar${m.claimed.length?` <small>(${m.claimed.length} sandık alındı)</small>`:''}</h4>${earned?`<div class="mate-chests">${earned}</div><div class="mate-chest-info" id="mateChestInfo"><p class="mate-empty">İçinde ne olduğunu görmek için bir sandığa dokun.</p></div>`:'<p class="mate-empty">Muço ya da muçon her seviye atladığında buraya bir ödül sandığı düşer.</p>'}`;
  const ask=mentorServer&&!m.mentor&&!m.lockedOut&&!m.graduated&&lv<=APPRENTICE_MAX_LEVEL?`<h4>Ustaya çıraklık isteği</h4><div class="coupon-form"><input id="mateAskNick" maxlength="20" placeholder="Usta kaptanın adı" autocomplete="off" spellcheck="false"/><button id="mateAsk">GÖNDER</button></div>${mentorSent.length?`<p class="mate-empty">Bekleyen isteklerin: ${mentorSent.map(esc).join(', ')}</p>`:''}`:'';
  return `<p class="mate-role">${role}</p>${ask}${canMentor(lv)&&!m.mentor?`<h4>Muçoların</h4>${apps}<h4>Çıraklık istekleri</h4>${reqs}`:''}${rewards}`;
}
function bindMentorship(){
  const askBtn=document.getElementById('mateAsk');if(askBtn)askBtn.onclick=async()=>{const n=(ui('mateAskNick') as HTMLInputElement).value.trim();if(!n)return;if(await mentorRpc('mentor_request',{p_nick:n})!==null){toast(`${n} kaptanına istek gönderildi`);void loadServerMentor();}};
  if(mentorServer){
    const claimS=async(key:string)=>{const r=await mentorRpc('mentor_claim',{p_key:key}) as {label:string;gold:number;pearls:number}|null|undefined;if(!r)return;const g=Number(r.gold),p=Number(r.pearls);
      state.gold+=g;state.pearls+=p;session.pearlServerAdd?.(p);saveAccount();updateUI();rewardNotice(`${r.label} · +${g.toLocaleString('tr-TR')} altın · +${p.toLocaleString('tr-TR')} inci`,'gain');void loadServerMentor();};
    document.querySelectorAll<HTMLButtonElement>('[data-chest]').forEach(b=>b.onclick=()=>{const d=b.dataset,info=ui('mateChestInfo');
      document.querySelectorAll('.mate-chest.picked').forEach(x=>x.classList.remove('picked'));b.classList.add('picked');
      info.innerHTML=`<img src="/assets/icon-chest-v2.webp" alt=""/><div><b>${escapeHtml(d.chestTitle!)}</b><span>◈ ${Number(d.chestGold).toLocaleString('tr-TR')} altın · ${Number(d.chestPearls).toLocaleString('tr-TR')} inci</span></div><button data-mate-claim="${escapeHtml(d.chest!)}">TALEP ET</button>`;
      info.querySelector<HTMLButtonElement>('[data-mate-claim]')?.addEventListener('click',()=>{void claimS(d.chest!);});});
    document.querySelectorAll<HTMLButtonElement>('[data-mate-accept]').forEach(b=>b.onclick=async()=>{const n=b.dataset.mateAccept!;if(await mentorRpc('mentor_answer',{p_nick:n,p_accept:true})!==null){toast(`${n} artık muçon`);void loadServerMentor();}});
    document.querySelectorAll<HTMLButtonElement>('[data-mate-reject]').forEach(b=>b.onclick=async()=>{await mentorRpc('mentor_answer',{p_nick:b.dataset.mateReject!,p_accept:false});void loadServerMentor();});
    document.querySelectorAll<HTMLButtonElement>('[data-mate-remove]').forEach(b=>b.onclick=async()=>{const n=b.dataset.mateRemove!;if(!confirm(`${n} muçoluktan çıkarılsın mı?`))return;if(await mentorRpc('mentor_remove',{p_nick:n})!==null){toast(`${n} muçoluktan çıkarıldı`);void loadServerMentor();}});
    return;}
  const claim=(key:string)=>{const r=claimReward(mentorship,key);if(!r)return;state.gold+=r.gold;state.pearls+=r.pearls;saveMentorship(mentorship);saveAccount();updateUI();rewardNotice(`${r.label} · +${r.gold.toLocaleString('tr-TR')} altın · +${r.pearls.toLocaleString('tr-TR')} inci`,'gain');renderMentorship();};
  document.querySelectorAll<HTMLButtonElement>('[data-chest]').forEach(b=>b.onclick=()=>{const d=b.dataset,info=ui('mateChestInfo');
    document.querySelectorAll('.mate-chest.picked').forEach(x=>x.classList.remove('picked'));b.classList.add('picked');
    const st=d.chestState==='done'?'<i class="got">ÖDÜL ALINDI</i>':d.chestState==='ready'?`<button data-mate-claim="${escapeHtml(d.chest!)}">TALEP ET</button>`:`<i>${escapeHtml(d.chestLocked!)}</i>`;
    info.innerHTML=`<img src="/assets/icon-chest-v2.webp" alt=""/><div><b>${escapeHtml(d.chestTitle!)}</b><span>◈ ${Number(d.chestGold).toLocaleString('tr-TR')} altın · ${Number(d.chestPearls).toLocaleString('tr-TR')} inci</span></div>${st}`;
    info.querySelector<HTMLButtonElement>('[data-mate-claim]')?.addEventListener('click',()=>claim(d.chest!));});
  document.querySelectorAll<HTMLButtonElement>('[data-mate-accept]').forEach(b=>b.onclick=()=>{const n=b.dataset.mateAccept!,err=acceptRequest(mentorship,state.level,n);if(err){toast(err);return;}saveMentorship(mentorship);toast(`${n} artık muçon`);renderMentorship();});
  document.querySelectorAll<HTMLButtonElement>('[data-mate-reject]').forEach(b=>b.onclick=()=>{rejectRequest(mentorship,b.dataset.mateReject!);saveMentorship(mentorship);renderMentorship();});
  document.querySelectorAll<HTMLButtonElement>('[data-mate-remove]').forEach(b=>b.onclick=()=>{const n=b.dataset.mateRemove!;if(!confirm(`${n} muçoluktan çıkarılsın mı?`))return;removeApprentice(mentorship,n);saveMentorship(mentorship);toast(`${n} muçoluktan çıkarıldı`);renderMentorship();});
}
function closeCaptainProfile(){ui('captainOverlay').classList.remove('open');}
const tierQuests=()=>QUESTS.filter(q=>q.map===currentMap);
const questUnit=(q:QuestDef)=>q.kind==='npc'?'Gemi':q.kind==='sparkle'?'Pırıltı':'Sandık';
function renderQuestLog(){
  ui('questList').innerHTML=levelQuestHtml()+`<p class="quest-tier">${currentMap} · ${mapDef().name}</p>`+tierQuests().map((quest,index)=>{
    const cooling=(questCooldownUntil[quest.id]??0)>Date.now(),active=state.activeQuest===quest.id,progress=questProgress[quest.id]??0;
    const status=cooling?cooldownText(questCooldownUntil[quest.id]):active?'İPTAL':progress>0?'DEVAM':'BAŞLAT';
    const action=pendingCancel===quest.id?`<div class="cancel-confirm"><strong>Emin misin?</strong><button data-confirm-cancel="${quest.id}">İPTALİ ONAYLA</button><button data-keep-quest="${quest.id}">VAZGEÇ</button></div>`:`<button data-quest="${quest.id}" ${cooling?'disabled':''}>${status}</button>`;
    return `<article class="quest-entry ${active?'active':''} ${cooling?'completed':''}"><div class="quest-number">${String(index+1).padStart(2,'0')}</div><div class="quest-copy"><span>${cooling?'BEKLEMEDE':quest.kind==='npc'?'GEMİ AVI':quest.kind==='sparkle'?'PIRILTI':'GANİMET'}</span><h3>${quest.title.split(': ').pop()}</h3><p>${quest.description}</p><div class="quest-rewards"><b>${quest.gold.toLocaleString('tr-TR')} ALTIN</b><b>${quest.xp.toLocaleString('tr-TR')} TP</b><b>◈ ${fmt(quest.pearls)} İNCİ</b></div><small>${cooling?'Yeniden açılmasına: '+cooldownText(questCooldownUntil[quest.id]):`${Math.min(progress,quest.required)} / ${quest.required} ${questUnit(quest)}`}</small></div>${action}</article>`;
  }).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-quest]').forEach(button=>button.onclick=()=>{const id=button.dataset.quest!;state.activeQuest===id?requestQuestCancel(id):startQuest(id);});
  document.querySelectorAll<HTMLButtonElement>('[data-confirm-cancel]').forEach(button=>button.onclick=()=>cancelQuest(button.dataset.confirmCancel!));
  document.querySelectorAll<HTMLButtonElement>('[data-keep-quest]').forEach(button=>button.onclick=()=>{pendingCancel=null;renderQuestLog();});
}
const questById=(id:string)=>QUESTS.find(q=>q.id===id)!;
// Kaldırılan canavar görevleri eski kayıtlarda etkin kalmışsa bırakılır
if(state.activeQuest!==null&&!QUESTS.some(q=>q.id===state.activeQuest)){state.activeQuest=null;}
function startQuest(id:string){
  if((questCooldownUntil[id]??0)>Date.now())return;
  if(state.activeQuest!==null){toast(`Önce ${questById(state.activeQuest).title} görevini iptal et`);return;}
  state.activeQuest=id;saveQuestState();closeQuestLog();toast(`${questById(id).title} görevi başladı`);updateUI();
}
function requestQuestCancel(id:string){if(state.activeQuest!==id)return;pendingCancel=id;renderQuestLog();}
function cancelQuest(id:string){
  if(state.activeQuest!==id)return;
  state.activeQuest=null;questProgress[id]=0;questCooldownUntil[id]=Date.now()+QUEST_COOLDOWN_MS;pendingCancel=null;saveQuestState();renderQuestLog();toast(`${questById(id).title} iptal edildi — ${QUEST_COOLDOWN_MS/3_600_000} saat sonra yeniden açılacak`);updateUI();
}
function recordQuestProgress(kind:QuestDef['kind'],id:string){
  if(state.activeQuest===null)return;
  const quest=questById(state.activeQuest);
  if(quest&&quest.map!==currentMap&&quest.kind===kind&&kind==='npc'&&quest.ids.includes(id)){toast(`Görev ${quest.map} haritasında · bu batırma sayılmadı`);return;}
  if(!quest||quest.map!==currentMap||quest.kind!==kind||!quest.ids.includes(id))return;
  questProgress[quest.id]=(questProgress[quest.id]??0)+1;saveQuestState();
  if(questProgress[quest.id]<quest.required)return;
  sendQuestDone(quest.id);state.gold+=goldGainAch(quest.gold);state.fame+=xpGain(quest.xp);serverPearls(quest.pearls);bumpAch('quest');const qEp=questEp(quest.tier);gainElitePoints(qEp);
  rewardNotice(`Görev tamamlandı: ${quest.title} · +${fmt(quest.gold)} altın · +${fmt(quest.pearls)} inci · +${fmt(quest.xp)} TP · +${fmt(qEp)} EP`,'gain',{xp:quest.xp,gold:quest.gold});
  toast(`${quest.title} tamamlandı`);questProgress[quest.id]=0;questCooldownUntil[quest.id]=Date.now()+QUEST_COOLDOWN_MS;state.activeQuest=null;saveQuestState();saveAccount();
}
// Her seviye atlayışta küçük hediye: inci ve Ateş Güllesi (yeni seviyeyle büyür)
const levelGift=(level:number)=>({pearls:50*level,fire:300*level});
let levelUpTimer=0;
function showLevelUp(level:number){
  let el=document.getElementById('levelUpSplash');
  if(!el){el=document.createElement('div');el.id='levelUpSplash';el.className='levelup-splash';document.body.append(el);el.onclick=()=>el!.classList.remove('open');}
  el.innerHTML=`<div class="lu-rays"></div><div class="lu-card"><i class="lu-badge" style="background-position:${(Math.min(MAX_LEVEL,level)-1)/7*100}% 0"></i><span>YENİ SEVİYE</span><h2>SEVİYE ${level}</h2><p>+${(playerBaseHp(level,0)-playerBaseHp(level-1,0)).toLocaleString('tr-TR')} gövde · +1 uzmanlık puanı · yeni denizler açıldı</p><p class="lu-gift"><img src="/assets/icon-pearl-v1.webp" alt=""/>+${fmt(levelGift(level).pearls)} İnci <img src="/assets/ammo-fire-v2.webp" alt=""/>+${fmt(levelGift(level).fire)} Ateş Güllesi</p></div>`;
  el.classList.remove('open');void el.offsetWidth;el.classList.add('open');
  clearTimeout(levelUpTimer);levelUpTimer=window.setTimeout(()=>el!.classList.remove('open'),3800);
}
if(matchMedia('(hover:hover)').matches){const tip=document.createElement('div');tip.className='qtip-float';document.body.append(tip);
  document.addEventListener('pointerover',e=>{const el=(e.target as HTMLElement).closest?.<HTMLElement>('.slot-bar [data-quick-item]');if(!el){tip.classList.remove('show');return;}const it=el.dataset.quickItem as QuickItemId,r=el.getBoundingClientRect();tip.innerHTML=`<b>${QUICK_ITEMS[it].name}</b>${QUICK_TIPS[it]}`;tip.style.left=`${r.left+r.width/2}px`;tip.style.top=`${r.top-6}px`;tip.classList.add('show');});}
function updateDots(){try{
  const daily1=dailyStatus(daily).canClaim||!!(festival&&festivalStatus(festival).canClaim),mate=mentorship.pending.length>0,quest=state.activeQuest===null||levelQuestOpen();
  const set=(id:string,on:boolean)=>document.getElementById(id)?.classList.toggle('has-dot',on);
  set('openDaily',daily1);set('openMentorship',mate);set('openMenuQuests',quest);set('openQuestTop',quest);set('openMenu',daily1||mate);
}catch{}}
// Telefonda üst çerçevedeki TP / HP / SP sayıları kısaltılır (54.000 → 54b, 1.250.000 → 1,3M) ki çubuğa sığsın
function compactBarTexts(){if(innerWidth>700)return;const short=(m:string)=>{const n=Number(m.replace(/\./g,''));return n>=1e6?`${(n/1e6).toLocaleString('tr-TR',{maximumFractionDigits:1})}M`:n>=1e4?`${Math.floor(n/1e3)}b`:m;};
  for(const id of ['xpHudText','hpHudText','battleText']){const el=ui(id);el.textContent=(el.textContent??'').replace(/\d{1,3}(?:\.\d{3})+/g,short).replace(/ \/ /g,'/');}}
function updateUI(){
  ui('stripGold').textContent=state.gold.toLocaleString('tr-TR');ui('stripPearls').textContent=state.pearls.toLocaleString('tr-TR');
  updateDots();
  // Saldırı sürerken SALDIR, gövde tamken (tamir yokken) TAMİR soluk görünür
  ui('attack').classList.toggle('dim',state.attacking);document.getElementById('repair')?.classList.toggle('dim',!state.repairing&&state.hp>=effectiveMaxHp());
  ui('pearls').textContent=state.pearls<1000?String(state.pearls).padStart(3,'0'):fmt(state.pearls);ui('gold').textContent=state.gold<1000?String(state.gold).padStart(3,'0'):fmt(state.gold);
  if(MOBILE_HUD&&document.getElementById('mobMain')){const c=ui('mobMain').querySelector('b');if(c)c.textContent=quickCount(state.ammo);}document.querySelectorAll<HTMLElement>('.slot-bar [data-quick-item],#mobTray [data-quick-item]').forEach(slot=>{const item=slot.dataset.quickItem as QuickItemId;const count=slot.querySelector('b');if(count)count.textContent=quickCount(item);slot.classList.toggle('active',item===state.ammo||((item==='powder'||item==='shield')&&consumableOn[item]));});
  ui('hpText').textContent=`${Math.ceil(state.hp).toLocaleString('tr-TR')} / ${effectiveMaxHp().toLocaleString('tr-TR')}`; (ui('hpBar') as HTMLElement).style.width=`${state.hp/effectiveMaxHp()*100}%`;
  const need=xpNeed(state.level);ui('xpText').textContent=Number.isFinite(need)?`${state.fame.toLocaleString('tr-TR')} / ${need.toLocaleString('tr-TR')}`:state.fame.toLocaleString('tr-TR');(ui('xpBar') as HTMLElement).style.width=`${Number.isFinite(need)?Math.min(100,state.fame/need*100):100}%`;ui('level').textContent=String(state.level);ui('level').style.backgroundPosition=`${(Math.min(MAX_LEVEL,Math.max(1,state.level))-1)/7*100}% 0`;ui('level').style.setProperty('--lvp',`${Number.isFinite(need)?Math.min(100,state.fame/need*100):100}%`);ui('level').title=Number.isFinite(need)?`Seviye ${state.level} · sonraki seviyeye %${Math.floor(Math.min(100,state.fame/need*100))}`:`Seviye ${state.level} · en yüksek seviye`;ui('captainLevel').textContent=String(state.level);ui('profileElite').textContent=eliteProgress().text;{const br=battleRank(state.battlePoints);ui('profileBattle').innerHTML=`${rankBadgeHtml(br.index)}${br.name} · ${spText()}`;}(ui('profileEliteBar') as HTMLElement).style.width=`${eliteProgress().pct}%`;(ui('profileBattleBar') as HTMLElement).style.width=`${battleRank(state.battlePoints).pct}%`;
  (ui('xpHudBar') as HTMLElement).style.width=`${Number.isFinite(need)?Math.min(100,state.fame/need*100):100}%`;ui('xpHudText').textContent=Number.isFinite(need)?`${state.fame.toLocaleString('tr-TR')} / ${need.toLocaleString('tr-TR')}`:state.fame.toLocaleString('tr-TR');{const lq=levelQuestOpen();ui('xpHudBar').parentElement!.parentElement!.classList.toggle('lq-ready',lq);if(lq){const g=levelQuestGoal(state.level);ui('xpHudText').textContent=`SEVİYE GÖREVİ ${levelQuest.ships+levelQuest.monsters}/${g.ships+g.monsters}`;}}{const ev=adminEvHp(),hp=ev?ev.hp:state.hp,mx=ev?ev.max:effectiveMaxHp();(ui('hpHudBar') as HTMLElement).style.width=`${Math.max(0,hp/mx*100)}%`;{const t=`${Math.ceil(hp).toLocaleString('tr-TR')} / ${mx.toLocaleString('tr-TR')}`,el=ui('hpHudText');if(el.textContent!==t){el.textContent=t;el.classList.toggle('long',t.length>15);}}}(ui('eliteBar') as HTMLElement).style.width=`${eliteProgress().pct}%`;ui('eliteText').textContent=eliteProgress().text;(ui('battleBar') as HTMLElement).style.width=`${battleRank(state.battlePoints).pct}%`;ui('battleText').textContent=spText();compactBarTexts();
  const quest=state.activeQuest===null?null:questById(state.activeQuest);ui('questTitle').textContent=quest?.title||'Görev seçilmedi';ui('questDescription').textContent=quest?.description||'Kaptan, yapmak istediğin görevi görev defterinden seçebilirsin.';ui('quest').textContent=quest?`${questProgress[quest.id]??0} / ${quest.required} ${questUnit(quest)}`:'Hazır olduğunda bir görev başlat';ui('questBadge').textContent=quest?`${questProgress[quest.id]??0}/${quest.required}`:'';ui('openQuestTop').classList.toggle('has-quest',!!quest);
  ui('reloadText').textContent=player.cooldown>0?`${player.cooldown.toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})} sn`:'HAZIR';ui('attack').classList.toggle('reloading',player.cooldown>0);
  ui('attackLabel').textContent=state.attacking?'SALDIRIYI İPTAL ET':'SALDIR';ui('attack').classList.toggle('active',state.attacking);
  document.getElementById('repair')?.classList.toggle('active',state.repairing);
  {const b=ui('rageButton'),on=rageActive(rage),ready=rageReady(rage);b.classList.toggle('active',on);b.classList.toggle('ready',ready);
    b.style.setProperty('--rage',(on?1:rage.meter/RAGE_MAX).toFixed(3));ui('rageTime').textContent=on?`${rage.salvos}/${RAGE_SALVOS} SALVO`:ready?'HAZIR':`%${Math.floor(rage.meter)}`;}
  renderCombatTargets();
}

let visibleCombatTargets:Target[]=[];
function renderCombatTargets(){
  const targets:Target[]=[];
  const add=(target:Target|null)=>{if(target&&targetExists(target)&&!targets.includes(target))targets.push(target);};
  add(selected);enemies.forEach(enemy=>{if(enemy.aggro)add(enemy);});
  visibleCombatTargets=targets.slice(0,5);
  const root=ui('combatTargets');root.classList.toggle('visible',visibleCombatTargets.length>0);
  // sağda, olay panelinin (hazine vb.) hemen altında dur; konum yalnız panel değişince okunur
  if(root.style.top!==combatTargetsTop)root.style.top=combatTargetsTop;
  // Seafight usulü küçük kart: simge, [TAG] ad, sayılı can çubuğu. Savaştaki hedefin kenarı kırmızı.
  const html=visibleCombatTargets.map((target,index)=>{const active=target===selected;const fighting=target.aggro||(active&&state.attacking);const portrait=target.def?.portrait??-1;return `<button class="combat-target ${active?'selected':''} ${fighting?'fighting':''}" data-combat-target="${index}"><span class="target-portrait ${target.kind} ${target.kind==='ship'?target.role:''}">${target.kind==='ship'&&target.boss?`<i class="portrait-art" style="${portraitStyle(BOSS_ATLAS,target.boss.portrait,MAP_KEYS.length,BOSS_ATLAS_COLS)}"></i>`:portrait>=0?`<i class="portrait-art" style="${portraitStyle(PORTRAIT_ATLAS,portrait,PORTRAIT_COUNT,PORTRAIT_COLS)}"></i>`:target.kind==='ship'&&target.captain?`<i class="portrait-art tower-art" style="background-image:url(${eliteArtUrl(target.captain.elite)})"></i>`:`<i class="portrait-art tower-art" style="background-image:url(${fleetTowerUrl(theme().fleet)})"></i>`}</span><span class="target-info"><strong>${target.name}</strong><i><em style="width:${Math.max(0,target.hp/target.maxHp*100)}%"></em><b>${fmt(Math.ceil(target.hp))} / ${fmt(target.maxHp)}</b></i></span></button>`;}).join('');
  if(html===combatTargetsHtml)return;combatTargetsHtml=html;root.innerHTML=html;
  root.querySelectorAll<HTMLButtonElement>('[data-combat-target]').forEach(button=>button.onpointerdown=()=>{const target=visibleCombatTargets[Number(button.dataset.combatTarget)];if(target){selected=target;updateUI();}});
}

// Seafight usulü gemi: son baktığı çapraz yüz (dururken de korunur)
const isoFace={east:false,north:false};let isoMove:IsoMove|null=null;
// Bütün gemiler (başlangıç gemisi dahil) Seafight usulü 4 çaprazda merdiven hareketiyle gider
const isoShip=()=>true;
// 16 yönlü görseli olan gemi (özel tasarım ya da elit): hedefe dümdüz gider, görünüş gidiş yönünden seçilir
const dir16Sprite=()=>ls?LS_SHIP:dom?DOM_TEAMS[dom.team].ship:session.isAdmin?ADMIN_DIR16:activeSpecialDesign?PIRATE_RAGE_DESIGN.dir16:eliteEnabled()?ELITE_DIR16[eliteShip().id]??null:STARTER_DIR16;
// Düz gidiş (16 yönlü gemiler): yerde sabit hız, ekranda dikey bileşen yarı ölçekli (çapraz hareketle aynı perspektif)
function straightAdvance(px:number,py:number,tx:number,ty:number,V:number,dt:number){
  const dx=tx-px,dy=ty-py,gx=dx,gy=dy*2,g=Math.hypot(gx,gy);
  if(g<1)return{m:null,mx:0,my:0,done:true};
  const step=Math.min(g,V*dt),mx=gx/g*step,my=gy/g*step/2;
  shipDir16=(8+Math.round(Math.atan2(gy,gx)/(Math.PI/8))+16)%16;isoFace.east=gx>=0;isoFace.north=gy<0;
  return{m:null,mx,my,done:false};}
function update(dt:number){updateHealFlights(dt);{const rc=document.getElementById('recenterShip');if(rc){const away=!!freeLook&&dist(freeLook,player)>60;if(rc.classList.contains('show')!==away)rc.classList.toggle('show',away);}}
    // W-A-S-D (ve oklar) gemiyi yürütmez: gemi yerinde kalırken harita kayar, oyuncu tıklayacağı yeri önceden görür. V gemiye geri ortalar.
    {const px=(held('right','arrowright')?1:0)-(held('left','arrowleft')?1:0),py=(held('back','arrowdown')?1:0)-(held('forward','arrowup')?1:0);
      if(px||py){const base=freeLook??camera,n=Math.hypot(px,py),v=520*dt/camera.zoom;lookAt(base.x+px/n*v,base.y+py/n*v);}
      }
    const turn=0,thrust=0;
    // Deniz Hakimiyeti: batıp doğan gemi 5 sn kıpırdayamaz
    if(domFreeze>0){domFreeze-=dt;routeTarget=null;destination=null;isoMove=null;player.speed=0;}
    if(routeTarget){if(dist(player,routeTarget)<14)routeTarget=null;else destination=routeVia(routeTarget);}
    if(destination&&!thrust&&!turn&&isoShip()){
      // Seafight usulü: 8 yön, dikey hız yarı, anlık kalkış/duruş; açı yalnızca iz ve efektler için tutulur
      const V=effectiveSpeed()*1.8,st=dir16Sprite()?straightAdvance(player.x,player.y,destination.x,destination.y,V,dt):isoAdvance(isoMove,player.x,player.y,destination.x,destination.y,V,dt,isoFace);isoMove=st.m;
      // Açı ve hız bu adımın hareketini verecek şekilde ayarlanır; taşıma aşağıdaki ortak satırda yapılır
      if(st.done){destination=null;player.speed=0;isoMove=null;}else if(st.mx||st.my){player.angle=Math.atan2(st.mx,-st.my);player.speed=Math.hypot(st.mx,st.my)/Math.max(dt,1e-3);}else player.speed=0;
    }
    else if(destination&&!thrust&&!turn){
      const d=dist(player,destination),desired=Math.atan2(destination.y-player.y,destination.x-player.x)+Math.PI/2;
      const delta=Math.atan2(Math.sin(desired-player.angle),Math.cos(desired-player.angle));
      player.angle+=clamp(delta,-4.6*dt,4.6*dt);
      // Dönüşte hız az düşer (90° dönüşte %80, tam geri dönüşte %45); varışta son 80 birimde yavaşlar
      const alignment=1-.55*Math.pow(Math.abs(delta)/Math.PI,1.5),arrival=clamp(d/80,.25,1);
      const targetSpeed=effectiveSpeed()*alignment*arrival;
      player.speed+=(targetSpeed-player.speed)*Math.min(1,dt*(targetSpeed<player.speed?3.2:4.4));
      if(d<7){destination=null;player.speed=0;}
    }
    else {
      player.angle+=turn*3.2*dt;if(thrust>0&&isoShip()){const fx=Math.sin(player.angle),fy=-Math.cos(player.angle);if(Math.abs(fx)>.15)isoFace.east=fx>0;if(Math.abs(fy)>.15)isoFace.north=fy<0;}
      const targetSpeed=thrust>0?effectiveSpeed()*(turn?.88:1):0;
      player.speed+=(targetSpeed-player.speed)*Math.min(1,dt*(thrust>0?4:3.8));
    }
    player.speed=clamp(player.speed,0,isoShip()&&destination?effectiveSpeed()*2.2:effectiveSpeed()+4);
    player.x=clamp(player.x+Math.sin(player.angle)*player.speed*dt,25,WORLD_WIDTH-25);player.y=clamp(player.y-Math.cos(player.angle)*player.speed*dt,25,WORLD_HEIGHT-25);resolveIslandCollision();
  updateAbilityFx(dt);
  player.cooldown=Math.max(0,player.cooldown-dt);updateRage(dt);state.invulnerable=Math.max(0,state.invulnerable-dt);collisionNotice=Math.max(0,collisionNotice-dt);// Kamera gemiyi izler; oyuncu kamerayı kaydırırsa (serbest bakış) orada kalır, gemiye kendiliğinden dönmez — GEMİ / V ile ortalanır
  {const f=cinematic.focus??freeLook??player;const cf=f===player?Math.min(1,dt*12):Math.min(1,dt*3);camera.x+=(f.x-camera.x)*cf;camera.y+=(f.y-camera.y)*cf;}camera.zoom+=(camera.targetZoom-camera.zoom)*Math.min(1,dt*7);
  for(let i=salvoQueue.length-1;i>=0;i--){salvoQueue[i].delay-=dt;if(salvoQueue[i].delay<=0){releaseSalvo(salvoQueue[i]);salvoQueue.splice(i,1);}}
  // Otomatik tamir: gemi durur, saldırmaz ve 3 sn hasar almazsa gövde kendiliğinden onarılmaya başlar
  // Tamir yalnızca gemi dururken ve saldırmıyorken sürer; hareket ya da saldırı başlayınca kendiliğinden durur
  const repairIdle=!state.attacking&&!destination&&player.speed<5;
  if(state.repairing&&!repairIdle){state.repairing=false;repairClock=0;document.getElementById('repair')?.classList.remove('active');}
  if((dom||ls)&&state.repairing){state.repairing=false;document.getElementById('repair')?.classList.remove('active');}
  if(!dom&&!ls&&repairIdle&&!state.repairing&&state.hp>0&&state.hp<effectiveMaxHp()&&playerHitClock>=AUTO_REPAIR_DELAY){state.repairing=true;document.getElementById('repair')?.classList.add('active');}
  playerSlow=Math.max(0,playerSlow-dt);
  // Tamir saniyede bir kez sabit miktar ekler ve yeşil "+N" yazısıyla gösterir
  if(state.repairing){repairClock+=dt;while(repairClock>=1&&state.repairing){repairClock-=1;
    const amt=repairAmount((1+upgrades.repair*.04)*bonus.repair*(1+eliteBonus().repair),effectiveMaxHp()),before=state.hp;
    state.hp=Math.min(effectiveMaxHp(),state.hp+amt);if(state.hp>before)healText(player.x,player.y,state.hp-before);
    if(state.hp>=effectiveMaxHp()){state.repairing=false;saveAccount();document.getElementById('repair')?.classList.remove('active');rewardNotice('Gövde tamamen onarıldı','none');}}}else repairClock=0;
  // Saldırı: kaptan hareket etse de hedef menzildeyken ateş sürer; hedef menzilden çıkınca saldırı durur
  // ve menzile tekrar girildiğinde SALDIR'a yeniden basmak gerekir.
  if(state.attacking&&selected){
    const d=dist(player,selected),cannonRange=effectiveRange();
    if(d>cannonRange){
      if(attackChase){const away=Math.atan2(player.y-selected.y,player.x-selected.x);routeTarget=null;destination=routeVia(navigablePoint({x:selected.x+Math.cos(away)*(cannonRange-35),y:selected.y+Math.sin(away)*(cannonRange-35)}));}
      else{state.attacking=false;ui('attack').classList.remove('active');toast('Hedef menzil dışına çıktı — saldırı durdu');}
    }else{
      if(attackChase){attackChase=false;destination=null;routeTarget=null;}
      // Rota verilmediyse gemi yerinde durur ve ateş eder (kendiliğinden süzülmez)
      fireAtTarget();
    }
  }
  player.angle=Math.atan2(Math.sin(player.angle),Math.cos(player.angle));
  for(const e of enemies){
    if(e.tower){if(siege)updateSiegeTower(e,dt);else updateTower(e,dt);continue;}
    if(e.remote){const r=e.remote,age=Math.min(.6,(performance.now()-r.seen)/1000),px=r.tx+r.vx*age,py=r.ty+r.vy*age,k=Math.min(1,dt*18);
      if(Math.hypot(px-e.x,py-e.y)>400){e.x=px;e.y=py;}else{e.x+=(px-e.x)*k;e.y+=(py-e.y)*k;}continue;}
    if(e.net){const n=e.net,dx=n.tx-e.x,dy=n.ty-e.y,dd=Math.hypot(dx,dy);if(dd>400){e.x=n.tx;e.y=n.ty;}else if(dd>.5){const k=Math.min(1,dt*6);e.x+=dx*k;e.y+=dy*k;}
      if(dd>3){e.face={east:dx>0,north:dy<0};e.dir16=dir16Toward(dx,dy);e.angle=Math.atan2(dx,-dy);}
      e.slowTimer=Math.max(0,e.slowTimer-dt);continue;} // ateşine sunucu karar verir (npos.f)
    if(e.captain){if(siege)updateSiegeCaptain(e,dt);else updateCaptain(e,dt);continue;}
    if(e.commander){updateCommander(e,dt);continue;}
    if((e.frozen??0)>0){e.frozen=Math.max(0,e.frozen!-dt);e.cooldown=Math.max(e.cooldown,.5);continue;}
    const d=dist(e,player);e.wander+=dt;e.slowTimer=Math.max(0,e.slowTimer-dt);proximityAggro(e,d);if(e.aggro){e.combatTimer-=dt;if(e.combatTimer<=0||Math.hypot(e.x-e.homeX,e.y-e.homeY)>680)e.aggro=false;}
    const homeDistance=Math.hypot(e.x-e.homeX,e.y-e.homeY);
    const target=e.aggro?Math.atan2(player.y-e.y,player.x-e.x)+Math.PI/2:homeDistance>90?Math.atan2(e.homeY-e.y,e.homeX-e.x)+Math.PI/2:e.angle+Math.sin(e.wander*.35)*.008;
    e.angle+=Math.atan2(Math.sin(target-e.angle),Math.cos(target-e.angle))*dt*(e.aggro?.8:.25);
    // Seafight usulü: NPC de oyuncu gibi yalnızca 4 çaprazda, merdiven adımlarıyla gider; hedef rota açısının 320 birim ilerisidir
    if(!e.aggro||d>240){const slow=e.slowTimer>0?.55:1,want={x:clamp(e.x+Math.sin(e.angle)*320,40,WORLD_WIDTH-40),y:clamp(e.y-Math.cos(e.angle)*320,40,WORLD_HEIGHT-40)};
      if(!e.isoT||dist(e.isoT,want)>60){e.isoT=want;e.iso=null;}
      e.face??={east:Math.sin(e.angle)>=0,north:Math.cos(e.angle)>0};
      const V=e.speed*(e.aggro?1:.45)*slow*1.4;
      // 16 yönlü görseli olan NPC hedefe dümdüz gider (elit gemiler gibi); diğerleri çapraz merdiven
      const st=e.def?.sprite.includes('-dir16-')?straightStep(e.x,e.y,e.isoT.x,e.isoT.y,V,dt):isoAdvance(e.iso??null,e.x,e.y,e.isoT.x,e.isoT.y,V,dt,e.face);
      if('m' in st)e.iso=st.m;else if(st.dir>=0)e.dir16=st.dir;
      if(st.done)e.isoT=undefined;else{e.x=clamp(e.x+st.mx,40,WORLD_WIDTH-40);e.y=clamp(e.y+st.my,40,WORLD_HEIGHT-40);}}
    else{e.face={east:player.x>e.x,north:player.y<e.y};e.dir16=dir16Toward(player.x-e.x,player.y-e.y);}/* menzilde durup ateş ederken oyuncuya döner */ if(e.aggro&&d<NPC_FIRE_RANGE&&e.cooldown<=0)enemyFire(e);e.cooldown-=dt;
  }
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];
    if(s.foe){if(enemies.includes(s.foe)){const a=Math.atan2(s.foe.y-s.y,s.foe.x-s.x),sp=Math.hypot(s.vx,s.vy);s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp;s.life=Math.max(s.life,.12);}}
    else if(s.owner==='enemy'&&!s.noHome&&state.invulnerable<=0){const a=Math.atan2(player.y-s.y,player.x-s.x),speed=Math.max(Math.hypot(s.vx,s.vy),Math.abs(player.speed)+220);s.vx=Math.cos(a)*speed;s.vy=Math.sin(a)*speed;s.life=Math.max(s.life,.12);}
    if(s.owner==='player'&&s.target&&targetExists(s.target)){const a=Math.atan2(s.target.y-s.y,s.target.x-s.x),speed=Math.hypot(s.vx,s.vy);s.vx=Math.cos(a)*speed;s.vy=Math.sin(a)*speed;s.life=Math.max(s.life,.12);}
    if(s.flight===undefined){const aim=s.owner==='player'?s.target:s.foe??player,sp=Math.max(1,Math.hypot(s.vx,s.vy)),d=aim&&targetExistsOrPlayer(aim)?dist(s,aim):sp*s.life;s.flight=Math.max(.15,Math.min(s.life,d/sp));s.age=0;s.arc=Math.min(80,d*.13)*(s.splash?2.2:1);
      if(s.splash&&aim)particles.push({x:aim.x,y:aim.y,vx:0,vy:0,life:s.flight,maxLife:s.flight,kind:'target',size:120});}
    s.age=(s.age??0)+dt;s.trail=(s.trail??0)-dt;
    if(s.trail<=0){s.trail=.08;const z=shotHeight(s);
      if(s.visual==='spit')particles.push({x:s.x,y:s.y,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,life:.4,maxLife:.4,kind:'bubble',z,size:14});
      else if(s.ammo==='fire')particles.push({x:s.x,y:s.y,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,life:.3,maxLife:.3,kind:'spark',z:z+4,size:8});}
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(s.owner==='player'){
      for(let j=enemies.length-1;j>=0&&s.life>0;j--){
        const e=enemies[j];
        // Şifa güllesi yalnız hedefindeki oyuncuya işler (yoldaki gemilere çarpmaz); uzak oyuncunun canını kendi oyunu doldurur
        if(s.ammo==='heal'){if(e!==s.target||dist(s,e)>=(e.hitRadius??25))continue;s.hit=true;s.life=0;const amt=Math.max(0,Math.min(s.damage,e.maxHp-e.hp));if(!e.remote)e.hp+=amt;healText(e.x,e.y,e.remote?s.damage:amt);playHeal();continue;}
        if(isAlly(e))continue;
        if(e.remote&&dist(s,e)<(e.hitRadius??25)){s.hit=true;s.life=0;burst(e.x,e.y);playHit();continue;}
        if(s.net&&!e.remote&&dist(s,e)<(e.hitRadius??25)){s.hit=true;s.life=0;e.aggro=true;e.combatTimer=12;e.lastHitBy='player';burst(e.x,e.y);playHit();damageText(e.x,e.y,Math.round(s.damage*(s.ammo==='fire'?FIRE_NPC_FACTOR:1)),s.powder?DMG_GOLD:DMG_RED);continue;}
        if(dist(s,e)<(e.hitRadius??25)){const rawHit=(s.damage*(s.ammo==='breaker'&&e.tower?SPECIAL_AMMO.breaker.towerFactor:1)*(s.ammo==='fire'&&!e.tower&&!e.captain?FIRE_NPC_FACTOR:1)*(s.ammo==='explosive'&&e.captain?EXPLOSIVE_PLAYER_FACTOR:1));const hit=e.captain?pvpClamp(e.pvp??=newPvpBudget(e.maxHp,performance.now()/1000),e.maxHp,rawHit,performance.now()/1000):rawHit;s.hit=true;if(s.slow)e.slowTimer=Math.max(e.slowTimer,s.slow);if(s.splash)towerSplash(s,e);e.aggro=true;e.lastHitBy='player';e.combatTimer=12;if(s.ammo==='chain'&&e.captain)e.slowTimer=CHAIN_SLOW.seconds;e.hp-=hit;siegeHit(e,hit,profile.nick);damageText(e.x,e.y,hit,s.powder?DMG_GOLD:DMG_RED);burst(e.x,e.y);playHit();ammoImpact(s,e,hit);s.life=0;
          if(e.hp<=0)sinkEnemy(e);
        }
      }
    }else if(s.foe){if(enemies.includes(s.foe)&&dist(s,s.foe)<(s.foe.hitRadius??30)){s.hit=true;s.life=0;captainHit(s.foe,s,s.captain??null);}}
    else if(state.invulnerable<=0&&!session.isAdmin&&dist(s,player)<22){
      s.hit=true;s.life=0;
      // Hayalet Kadırga pasifi %10 ihtimalle gülleyi savuşturur
      {
      state.repairing=false;playerHitClock=0;
      const shieldF=ls?1:useConsumable('shield'),rawTaken=ls?s.damage:s.damage*bonus.taken*shieldF*eliteTakenMult(),taken=s.captain?pvpClamp(playerPvp,effectiveMaxHp(),rawTaken,performance.now()/1000):rawTaken;
      state.hp-=taken;damageText(player.x,player.y,Math.round(taken),shieldF<1?DMG_BLUE:DMG_RED);playHit(true);burst(player.x,player.y);
      if(s.captain&&s.ammo==='chain')playerSlow=CHAIN_SLOW.seconds;
      if(s.captain&&s.ammo==='leech'&&enemies.includes(s.captain)){const c=s.captain,h=leechHeal(taken,true,c.maxHp);if(h>0){c.hp=Math.min(c.maxHp,c.hp+h);spawnSoul(player,c);}}
      }
      if(state.hp<=0){
        const killer=s.captain?.name??killerNear();if(s.captain?.remote)sendSunk({victim:myNetId,by:s.captain.remote.id,victimNick:profile.nick,byNick:s.captain.name});
        respawn();showSunkBy(killer);
        // Respawn empties shots. Stop reading this volley, then finish UI/draw normally.
        break;
      }
    }
    if(s.life<=0){if(!s.hit)splashAt(s.x,s.y,s.splash?160:110);shots.splice(i,1);}
  }
  updateLootChests(dt);updateTreasure(dt);updateSparkles(dt);updateArsenal(dt);updateEvents(dt);
  if(insideOwnLagoon(player)&&state.hp<effectiveMaxHp()){state.hp=Math.min(effectiveMaxHp(),state.hp+effectiveMaxHp()*.06*dt);if(state.hp>=effectiveMaxHp())saveAccount();}
  updateJumpPrompt();updateCoordBadge();mapFade=Math.max(0,mapFade-dt*1.6);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.life-=dt;if(p.vr)p.rot=(p.rot??0)+p.vr*dt;
    if(p.vz!==undefined){p.z=(p.z??0)+p.vz*dt;p.vz-=340*dt;if(p.z<=0){p.z=0;p.vz=undefined;p.vx*=.25;p.vy*=.25;p.vr=(p.vr??0)*.1;if(p.kind==='splinter')particles.push({x:p.x,y:p.y,vx:0,vy:0,life:.4,maxLife:.4,kind:'foam',size:20,variant:0});}}
    if(p.life<=0)particles.splice(i,1);}
  for(let i=wrecks.length-1;i>=0;i--){wrecks[i].t+=dt;if(wrecks[i].t>=WRECK_TIME)wrecks.splice(i,1);}
  netTick(dt);compassReveal=Math.max(0,compassReveal-dt);compassCooldown=Math.max(0,compassCooldown-dt);compassPulse=Math.max(0,compassPulse-dt*.8);
  let need=xpNeed(state.level);if(state.fame>=need&&!levelQuestDone(levelQuest)&&!levelQuestNoticed){levelQuestNoticed=true;const g=levelQuestGoal(state.level);rewardNotice(`TP doldu · Seviye görevi: ${levelQuestMap(state.level)} haritasında ${g.ships} ağır gemi ve ${g.monsters} canavar`,'gain');toast('Seviye görevi hazır · Görevler');}
  while(state.fame>=need&&levelQuestDone(levelQuest)&&(serverLqk===null||state.level<2||serverLqk>=levelQuestGoal(state.level).ships)){if(serverLqk!==null)serverLqk=0;state.fame-=need;state.level++;levelQuest=loadLevelQuest(state.level);saveLevelQuest(levelQuest);levelQuestNoticed=false;setAch('level',state.level);if(mentorServer)void loadServerMentor();else{const rw=onOwnLevel(mentorship,state.level);for(const r of rw)rewardNotice(`${r.level>=GRADUATE_LEVEL?'Mezuniyet':'Muço'} ödülü hazır · Kaptan & Muço penceresinden talep et`,'gain');saveMentorship(mentorship);}state.maxHp=baseMaxHp();state.hp=effectiveMaxHp();const gift=levelGift(state.level);serverPearls(gift.pearls);arsenal.fire+=gift.fire;saveArsenal(arsenal);renderQuickSlots();saveAccount();playLevelUp();rewardNotice(`Seviye ${state.level} oldun · +${(playerBaseHp(state.level,0)-playerBaseHp(state.level-1,0)).toLocaleString('tr-TR')} azami gövde · +1 uzmanlık puanı · +${fmt(gift.pearls)} inci · +${fmt(gift.fire)} Ateş Güllesi · ${state.level}/1 açıldı`);toast(`Seviye ${state.level}! Yeni denizler açıldı`);showLevelUp(state.level);need=xpNeed(state.level);}
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui('toast').classList.remove('show');}uiClock-=dt;if(uiClock<=0){uiClock=.1;updateUI();};
}

// ---------------------------------------------------------------- Lanetli Sular: Hayatta Kalma (src/cursed.ts, src/ls-ui.ts)
// Herkes eşit gemiyle (LS_LOADOUT, LS_HP) halkadaki yerinde doğar; demir gülle bedavadır. Sis, can ve eleme sunucuda; batan elenir.
let lsHudClock=0;const lsPicking=new Set<number>(),lsDropPicking=new Set<number>();const lsDropImg=new Image();lsDropImg.src='/assets/icon-chest-v2.webp';
const lsHooks={leave:()=>leaveLs(),ammo:(a:'iron'|'chain'|'fire'|'explosive')=>{if(!ls)return;ls.ammo=a;state.ammo=a;renderLsHud(ls,lsHooks);},
  powder:()=>{if(!ls)return;ls.powder=!ls.powder;renderLsHud(ls,lsHooks);},speed:()=>{if(ls&&ls.inv.speed>0)sendLs('speed');}};
const lsItemImg:Partial<Record<LsItem,HTMLImageElement>>={};
function lsImg(k:LsItem){let im=lsItemImg[k];if(!im){im=new Image();im.src=LS_ITEMS[k].icon;lsItemImg[k]=im;}return im;}
// Eşyaları toplama: üstünden geçince sunucuya bildirilir (mesafeyi sunucu denetler)
function lsPickTick(){if(!ls||ls.dead)return;const now=Date.now()+ls.off;
  for(const d of ls.drops){if(now<d.land||lsDropPicking.has(d.id))continue;if(Math.hypot(player.x-d.x,player.y-d.y)<LS_DROP_PICK_R){lsDropPicking.add(d.id);sendLs('dpick',{id:d.id});}}for(const it of ls.items){if(lsPicking.has(it[0]))continue;if(Math.hypot(player.x-it[2],player.y-it[3])<LS_PICK_R){lsPicking.add(it[0]);sendLs('pick',{id:it[0]});}}}
function drawLsItems(){if(!ls)return;const t=performance.now()/1000;
  // Lanetli sandık: düşerken hedef halkası ve geri sayım, indikten sonra ışık sütunu (görüş sisinden bağımsız görünür)
  {const now=Date.now()+ls.off;for(const d of ls.drops){const p=worldToScreen(d),left=d.land-now;ctx.save();
    if(left>0){const k=1-left/LS_DROP_FALL_MS;ctx.strokeStyle='#ffd56a';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.ellipse(p.x,p.y,70,26,0,0,7);ctx.stroke();ctx.setLineDash([]);
      const y=p.y-60-(1-k)*500;if(lsDropImg.complete)ctx.drawImage(lsDropImg,p.x-30,y-30,60,60);ctx.fillStyle='#ffe9a8';ctx.font='800 22px Inter';ctx.textAlign='center';ctx.fillText(`${Math.ceil(left/1000)}`,p.x,p.y+8);}
    else{const g=ctx.createLinearGradient(p.x,p.y-420,p.x,p.y);g.addColorStop(0,'rgba(255,214,106,0)');g.addColorStop(1,`rgba(255,214,106,${.35+.15*Math.sin(t*4)})`);ctx.fillStyle=g;ctx.fillRect(p.x-24,p.y-420,48,420);
      ctx.fillStyle='rgba(255,214,106,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y+16,46,16,0,0,7);ctx.fill();if(lsDropImg.complete)ctx.drawImage(lsDropImg,p.x-34,p.y-44+Math.sin(t*2)*3,68,68);}
    ctx.restore();}}for(const it of ls.items){if(!seenOnMap({x:it[2],y:it[3]}))continue;const p=worldToScreen({x:it[2],y:it[3]}),im=lsImg(it[1]),bob=Math.sin(t*2.4+it[0])*4;
  ctx.save();ctx.globalAlpha=.55+.25*Math.sin(t*3+it[0]);ctx.fillStyle='#b47bff';ctx.beginPath();ctx.ellipse(p.x,p.y+14,26,9,0,0,7);ctx.fill();ctx.globalAlpha=1;
  if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-22,p.y-30+bob,44,44);ctx.restore();}}
function openArenaModes(){openArena(openDom,()=>{if(ls){toast('Zaten Lanetli Sular maçındasın');return;}openLsLobby(domBlocked);});}
function onLsNet(d:Record<string,unknown>&{k:string}){
  if(d.k==='lobby'){lsLobbyMsg(d as unknown as LsLobby);return;}
  if(d.k==='err'){toast(String(d.msg||''));return;}
  if(d.k==='start'){if(dom||ls||siege)return;enterLs(d as unknown as {id:string;spawn:{x:number;y:number};n:number;fog:LsFog&{now:number};items:LsRun['items'];drops?:LsDrop[]});return;}
  if(!ls)return;
  if(d.k==='fog'){const f=d.fog as LsFog&{now:number};ls.off=f.now-Date.now();ls.fog=f;ls.alive=Number(d.n)||ls.alive;if(f.phase>0)toast('Lanetli sis daralıyor! Beyaz halkanın içine gir');renderLsHud(ls,lsHooks);return;}
  if(d.k==='alive'){ls.alive=Number(d.n)||0;if(d.out)rewardNotice(`${d.by?`${d.by}, `:''}${d.out} ${d.by?'kaptanını batırdı':'lanetli sulara gömüldü'} · ${ls.alive} kaptan kaldı`,'battle');renderLsHud(ls,lsHooks);return;}
  if(d.k==='drops'){ls.drops=(d.drops as LsDrop[])??[];for(const id of [...lsDropPicking])if(!ls.drops.some(x=>x.id===id))lsDropPicking.delete(id);
    if(d.fresh){toast('Lanetli sandık düşüyor! Haritadaki altın halkaya ilk ulaşan alır');playMapJump();}if(d.by)rewardNotice(`${d.by} lanetli sandığı aldı`,'battle');return;}
  if(d.k==='items'){ls.items=d.items as LsRun['items'];for(const id of [...lsPicking])if(!ls.items.some(x=>x[0]===id))lsPicking.delete(id);return;}
  if(d.k==='inv'){ls.inv=d.inv as LsInv;if(d.got){const g=LS_ITEMS[d.got as LsItem];rewardNotice(`${g.name} +${fmt(g.qty)}`,'none');playCoins();}
    if(d.drop){rewardNotice('Lanetli sandık senin! Patlayıcı, ateş, zincir gülle, barut, kalkan ve hız iksiri','battle');playLevelUp();}
    if(d.speed){abilityTimers.speed.active=LS_SPEED_MS/1000;toast('Hız iksiri içildi');}if(ls.ammo!=='iron'&&ls.inv[ls.ammo]<=0){ls.ammo='iron';state.ammo='iron';}renderLsHud(ls,lsHooks);return;}
  if(d.k==='burn'){if(ls.dead)return;const dmg=Number(d.dmg)||0;state.hp-=dmg;state.repairing=false;damageText(player.x,player.y,dmg,DMG_RED);return;}
  if(d.k==='out'){const o=d as unknown as LsOut;ls.dead=true;renderLsHud(ls,lsHooks);playLevelUp();showLsResult(o,leaveLs);}}
function enterLs(st:{id:string;spawn:{x:number;y:number};n:number;fog:LsFog&{now:number};items:LsRun['items'];drops?:LsDrop[]}){lsPicking.clear();lsDropPicking.clear();closeLsLobby();sendLs('watch',{on:false});
  lsOrigin={x:player.x,y:player.y};ls={id:st.id,n:st.n,alive:st.n,fog:st.fog,off:st.fog.now-Date.now(),start:st.fog.at,kills:0,dead:false,inv:lsEmptyInv(),items:st.items??[],drops:st.drops??[],ammo:'iron',powder:true};
  fleetSafe=null;fleetFields.clear();populateMap();state.ammo='iron';
  player.x=st.spawn.x;player.y=st.spawn.y;player.speed=0;destination=null;routeTarget=null;selected=null;state.attacking=false;ui('attack').classList.remove('active');
  camera.x=player.x;camera.y=player.y;freeLook=null;state.hp=LS_HP;state.invulnerable=0;state.repairing=false;shots.length=0;salvoQueue.length=0;mapFade=1;playMapJump();renderLsHud(ls,lsHooks);
  rewardNotice('Lanetli Sular başladı · son kalan kaptan ol!','battle');}
function lsDied(){if(!ls)return;ls.dead=true;state.hp=1;state.invulnerable=9999;state.attacking=false;selected=null;destination=null;routeTarget=null;player.speed=0;ui('attack').classList.remove('active');playSplash();toast('Gemin battı — elendin, sıran hesaplanıyor…');}
function leaveLs(){if(!ls)return;if(!ls.dead)sendLs('leave');document.querySelector('.dom-result')?.remove();ls=null;renderLsHud(null,lsHooks);
  const o=lsOrigin;lsOrigin=null;fleetSafe=null;fleetFields.clear();populateMap();if(o){player.x=o.x;player.y=o.y;}state.invulnerable=2;state.hp=Math.min(state.hp>1?state.hp:effectiveMaxHp(),effectiveMaxHp());
  player.speed=0;destination=null;routeTarget=null;selected=null;state.attacking=false;ui('attack').classList.remove('active');camera.x=player.x;camera.y=player.y;freeLook=null;mapFade=1;playMapJump();}
// Eşit atış: herkes 40 demir gülle, aynı hasar ve dolum; stok düşmez, hasarı sunucu hesaplar
function lsFire(){if(!ls||ls.dead||!selected)return;if(!(selected as Enemy).remote){stopAttack();return;}
  const a=ls.ammo!=='iron'&&ls.inv[ls.ammo]>0?ls.ammo:'iron',loaded=a==='iron'?0:Math.min(LS_LOADOUT.cannons,ls.inv[a]),powder=ls.powder&&ls.inv.powder>0;
  const fx=Math.sin(player.angle),fy=-Math.cos(player.angle),tx=selected.x-player.x,ty=selected.y-player.y,side=fx*ty-fy*tx>0?-1:1;
  const damage=salvoDamage(LS_LOADOUT,a,loaded,LS_LOADOUT.cannons-loaded,powder,false);
  salvoQueue.push({delay:0,target:selected,side,slot:0,damage,ammo:a,powder});
  const tg=netTarget(selected);if(tg)sendAttack({...tg,a,n:loaded,i:LS_LOADOUT.cannons-loaded,p:powder?1:0,r:0});player.cooldown=reloadTime(LS_LOADOUT,a);}
// Lanetli sis: güvenli alanın dışı mor-karanlık; sonraki alan beyaz kesik halka
function drawLsFog(w:number,h:number){if(!ls)return;const now=Date.now()+ls.off,z=lsZoneAt(ls.fog,now),p=worldToScreen(z),px=worldToScreen({x:z.x+Math.max(1,z.r),y:z.y}),py=worldToScreen({x:z.x,y:z.y+Math.max(1,z.r)});
  const rx=Math.abs(px.x-p.x),ry=Math.abs(py.y-p.y),vw=w/camera.zoom,vh=h/camera.zoom,pulse=.5+.15*Math.sin(performance.now()/300);
  ctx.save();ctx.fillStyle=`rgba(46,10,78,${.55+pulse*.1})`;ctx.beginPath();ctx.rect(w/2-vw/2-10,h/2-vh/2-10,vw+20,vh+20);if(z.r>1)ctx.ellipse(p.x,p.y,rx,ry,0,0,7);ctx.fill('evenodd');
  if(z.r>1){ctx.strokeStyle='#b47bff';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,7);ctx.stroke();}
  const f=ls.fog;if(f.phase>0&&f.to.r>0){const q=worldToScreen(f.to),qx=Math.abs(worldToScreen({x:f.to.x+f.to.r,y:f.to.y}).x-q.x),qy=Math.abs(worldToScreen({x:f.to.x,y:f.to.y+f.to.r}).y-q.y);ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.setLineDash([14,10]);ctx.beginPath();ctx.ellipse(q.x,q.y,qx,qy,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();void LS_FOG_DPS;}
// ---------------------------------------------------------------- Deniz Hakimiyeti (src/domination.ts, src/dom-ui.ts)
// Giriş: dünya haritası ve haftalık etkinlikler. Sunucu maçı başlatınca boş savaş alanına geçilir, takımın üssünde doğulur;
// batınca üste tam gövdeyle doğulur. Maç bitince sonuç ekranından ya da AYRIL ile gelinen denize dönülür.
let domHudClock=0,domFreeze=0;
function domBlocked(){if(!session.account)return'HESAPLA GİRİŞ GEREKLİ';if(siege)return'KUŞATMADAN ÇIK';if(dom||ls)return'MAÇTASIN';if(inCombat())return'SAVAŞTAN ÇIK';return null;}
ui('worldDom').onclick=()=>{closeWorldMap();openArenaModes();};
function openDom(){if(dom){toast('Zaten Deniz Hakimiyeti maçındasın');return;}openDomLobby(domBlocked);}
function onDomNet(d:Record<string,unknown>&{k:string}){
  if(d.k==='lobby'){domLobbyMsg(d as unknown as DomLobby);return;}
  if(d.k==='err'){toast(String(d.msg||''));return;}
  if(d.k==='start'){if(dom||ls||siege)return;const st=d as unknown as {id:string;team:DomTeam;end:number;teams:{r:string[];b:string[]}};enterDom(st);return;}
  if(!dom)return;
  if(d.k==='tick'){const t=d as unknown as {s:[number,number];cap:number;own:DomTeam|null;c:boolean;n:[number,number];end:number};dom.s=t.s;dom.cap=t.cap;dom.own=t.own;dom.c=t.c;dom.n=t.n;dom.end=t.end;return;}
  if(d.k==='end'){const e=d as unknown as DomEnd;dom.done=true;dom.s=e.s;renderDomHud(dom,leaveDom);// inci ve EP sunucudan hesaba yazılır (ekonomi eşitlemesiyle gelir)
    playLevelUp();showDomResult(e,leaveDom);}}
function enterDom(st:{id:string;team:DomTeam;end:number;teams:{r:string[];b:string[]}}){closeDomLobby();sendDom('watch',{on:false});
  domOrigin={x:player.x,y:player.y};dom={id:st.id,team:st.team,end:st.end,teams:st.teams,s:[0,0],cap:0,own:null,c:false,n:[0,0],done:false};
  fleetSafe=null;fleetFields.clear();populateMap();domRespawn(true);playMapJump();renderDomHud(dom,leaveDom);
  rewardNotice(`Deniz Hakimiyeti başladı · takımın: ${DOM_TEAMS[st.team].name}`,'battle');}
function leaveDom(){if(!dom)return;domFreeze=0;if(!dom.done)sendDom('leave');document.querySelector('.dom-result')?.remove();dom=null;renderDomHud(null,leaveDom);
  const o=domOrigin;domOrigin=null;fleetSafe=null;fleetFields.clear();populateMap();if(o){player.x=o.x;player.y=o.y;}
  player.speed=0;destination=null;routeTarget=null;selected=null;state.attacking=false;ui('attack').classList.remove('active');camera.x=player.x;camera.y=player.y;freeLook=null;mapFade=1;playMapJump();}
function domRespawn(first=false){if(!dom)return;const b=DOM_BASE[dom.team];player.x=b.x+(Math.random()-.5)*160;player.y=b.y+(Math.random()-.5)*260;player.speed=0;destination=null;routeTarget=null;
  camera.x=player.x;camera.y=player.y;freeLook=null;state.hp=effectiveMaxHp();state.invulnerable=5;domFreeze=first?0:5;state.repairing=false;state.attacking=false;selected=null;shots.length=0;salvoQueue.length=0;ui('attack').classList.remove('active');mapFade=1;
  if(!first){playSplash();toast('Gemin battı — üssünde tam gövdeyle doğdun · 5 sn korunuyorsun, 5 sn sonra hareket edebilirsin');}}
// Hakimiyet Bölgesi: sahibinin renginde halka; çekişmeliyken altın sarısı yanıp söner. Üsler takım renginde işaretli.
function drawDomZone(){if(!dom)return;const z=DOM_ZONE,p=worldToScreen(z),px=worldToScreen({x:z.x+z.r,y:z.y}),py=worldToScreen({x:z.x,y:z.y+z.r}),rx=Math.abs(px.x-p.x),ry=Math.abs(py.y-p.y);
  const col=dom.c?(Math.floor(performance.now()/400)%2?'#ffd56a':'#ffffff'):dom.own?DOM_TEAMS[dom.own].color:'#f3d496';
  ctx.save();ctx.globalAlpha=.16;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,7);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle=col;ctx.lineWidth=4;ctx.setLineDash([22,14]);ctx.lineDashOffset=-performance.now()/40;ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.55;ctx.fillStyle=col;ctx.font='700 30px Cinzel';ctx.textAlign='center';ctx.fillText('HAKİMİYET BÖLGESİ',p.x,p.y+10);
  for(const t of ['r','b'] as DomTeam[]){const b=worldToScreen(DOM_BASE[t]),bx=Math.abs(worldToScreen({x:DOM_BASE[t].x+220,y:0}).x-b.x),by=Math.abs(worldToScreen({x:0,y:DOM_BASE[t].y+220}).y-worldToScreen({x:0,y:DOM_BASE[t].y}).y);
    ctx.globalAlpha=.12;ctx.fillStyle=DOM_TEAMS[t].color;ctx.beginPath();ctx.ellipse(b.x,b.y,bx,by,0,0,7);ctx.fill();ctx.globalAlpha=.5;ctx.font='700 20px Cinzel';ctx.fillText(DOM_TEAMS[t].name.toLocaleUpperCase('tr'),b.x,b.y-by-8);}
  ctx.restore();}
// ---------------------------------------------------------------- Büyük Kuşatma (src/siege.ts)
// Filo adası altyapısı Kara Kale olarak kullanılır. Test kaptanları sunucu gelene kadar diğer oyuncuların yerine
// müttefik olarak savaşır: oyuncu onlara, onlar oyuncuya saldırmaz. Kaleden yıkılan hiçbir şey onarılmaz.
let serverSiegeChest:NetSiegeEnd['chest']=null;
let SIEGE_PARTICIPANTS=4;const SIEGE_FIRE_RANGE=520;
// Ortak kuşatma (VPS): kale canı, katılımcı sayısı ve katkı sıralaması sunucudan gelir; yerelde verilen hasar parça parça gönderilir
let siegeOnline=false;const siegePending=new Map<number,number>();let siegeSendClock=0;
const siegePiece=(e:Enemy)=>e.commander?16:e.towerIndex;
function applySiegeState(d:NetSiege){if(!siege)return;siegeOnline=true;SIEGE_PARTICIPANTS=Math.max(1,d.n);siege.id=d.id;siege.end=d.end;
  if(d.result){siege.result=d.result;toast(d.result==='won'?'Kara Kale bu akşam düştü; gelecek Cuma yeniden kurulur':'Bu akşamki kuşatma sona erdi');leaveSiege();return;}
  siege.destroyed=d.hp.slice(0,16).map((h,i)=>h<=0?i:-1).filter(i=>i>=0);siege.commanderHp=d.hp[16];siege.contrib=Object.fromEntries(d.top);siege.contrib[profile.nick]=d.mine;siege.paid=Math.min(siege.paid,d.mine);
  enemies.splice(0,enemies.length,...enemies.filter(e=>!e.siege&&!(e.captain&&!e.remote)));spawnSiegeTowers();siegeApplyHp(d.hp.map((h,i)=>[i,h,d.max[i]]));saveSiege(siege);renderSiegeHud();}
function siegeApplyHp(list:[number,number,number][]){for(const [i,hp,max] of list){const e=enemies.find(x=>x.siege&&siegePiece(x)===i);if(!e)continue;e.maxHp=max;if(hp>0){e.hp=Math.max(1,hp);e.lastHp=e.hp;}}}
function siegeNetTick(dt:number){if(!siege||!siegeOnline||siege.result||session.account){siegePending.clear();return;}
  for(const e of enemies){if(!e.siege||(!e.tower&&!e.commander))continue;const i=siegePiece(e);if(i===undefined)continue;if(e.lastHp!==undefined&&e.hp<e.lastHp)siegePending.set(i,(siegePending.get(i)??0)+e.lastHp-e.hp);e.lastHp=e.hp;}
  siegeSendClock-=dt;if(siegeSendClock>0||!siegePending.size)return;siegeSendClock=.3;
  for(const [i,d] of siegePending){const n=Math.min(400000,d);sendSiegeHit(i,n);if(d>n)siegePending.set(i,d-n);else siegePending.delete(i);}}
let siegeHudClock=0,siegeSaveClock=0;
function siegeHit(t:Target,amount:number,who:string){if(!siege||t.kind!=='ship'||!t.siege||amount<=0)return;
  const eff=Math.max(0,amount+Math.min(0,t.hp));siege.contrib[who]=(siege.contrib[who]??0)+eff;}
function siegeTarget(i:number){const st=siegeStats(SIEGE_PARTICIPANTS),f=SIEGE_MAP.fleet,[dx,dy]=FLEET.towers[i],inner=INNER_TOWERS.includes(i),hp=inner?st.innerHp:st.wallHp;
  return{kind:'ship',role:'heavy',tower:true,towerIndex:i,siege:true,x:f.x+dx,y:f.y+dy,angle:0,hp,maxHp:hp,cooldown:1+Math.random()*2,speed:0,damage:Math.round(st.towerDamage*(inner?1.3:1)),reload:inner?1.9:2.3,rewardGold:0,rewardFame:0,color:'#555',
    name:inner?'Kara Kale İç Kulesi':`Kara Kale Sur Topu · ${gateOf(i)==='west'?'Batı':'Doğu'} Kapısı`,tier:8,aggro:false,wander:0,slowTimer:0,homeX:f.x+dx,homeY:f.y+dy,combatTimer:0,hitRadius:34,fireRange:inner?st.range+40:st.range} as Enemy;}
function spawnSiegeTowers(){if(!siege)return;for(let i=0;i<FLEET.towers.length;i++)if(!siege.destroyed.includes(i))enemies.push(siegeTarget(i));
  if(siegePhase(siege)===3)spawnCommander();}
// Lagünde (maske değeri 2) verilen noktaya en yakın, kıyıdan uzak deniz hücresi
function lagoonPoint(near:Vec):Vec{let best:Vec=near,bd=Infinity;const g=fleetGrid();
  for(let j=2;j<FM_N-2;j++)for(let i=2;i<FM_N-2;i++){if(g[j*FM_N+i]!==2)continue;let open=true;for(let dy=-2;dy<=2&&open;dy++)for(let dx=-2;dx<=2;dx++)if(!g[(j+dy)*FM_N+i+dx]){open=false;break;}
    if(!open)continue;const c=fleetCellCenter(i,j),d=dist(c,near);if(d<bd){bd=d;best=c;}}
  return best;}
function spawnCommander(){if(!siege||enemies.some(e=>e.commander))return;const st=siegeStats(SIEGE_PARTICIPANTS),f=SIEGE_MAP.fleet,p=lagoonPoint({x:f.x,y:f.y+210*FLEET_SCALE});
  const boss=SIEGE_COMMANDER;
  const e=makeShip(boss as unknown as NpcDef,p.x,p.y,0);Object.assign(e,{boss,commander:true,siege:true,hitRadius:64,speed:0,hp:siege.commanderHp??st.commanderHp,maxHp:st.commanderHp,damage:st.commanderDamage,reload:2.2,name:boss.name,aggro:true,combatTimer:999,cooldown:2,wander:14});
  enemies.push(e);siege.commanderHp=e.hp;saveSiege(siege);playBossHorn();playBossMusic(8);rewardNotice('3. aşama · Kara Kale komutanı sancak gemisiyle çıktı','battle');}
// Kuleler ve komutan en yakın saldırgana (oyuncu ya da müttefik kaptan) ateş eder
function siegeAttackers(from:Vec,range:number){const out:Vec[]=[];if(state.invulnerable<=0&&dist(from,player)<range)out.push(player);
  for(const a of enemies)if(isAlly(a)&&dist(a,from)<range)out.push(a);return out.sort((a,b)=>dist(a,from)-dist(b,from));}
function siegeShot(x:number,y:number,a:number,speed:number,damage:number,t:Vec,extra:Partial<Shot>={}){shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:Math.max(2.4,Math.hypot(t.x-x,t.y-y)/speed+.5),owner:'enemy',damage,hit:false,ammo:'iron',...(t===player?{}:{foe:t as Enemy}),...extra});}
function updateSiegeTower(e:Enemy,dt:number){e.cooldown-=dt;e.slowTimer=0;e.combatTimer=Math.max(0,e.combatTimer-dt);const R=towerReach(e),t=siegeAttackers(e,R)[0];
  e.aggro=!!t||e.combatTimer>0;if(!t||e.cooldown>0)return;const m=towerMuzzle(e),a=Math.atan2(t.y-m.y,t.x-m.x);muzzleFlash(m.x,m.y,a,60);
  for(const off of [-.05,.05])siegeShot(m.x,m.y,a+off,320,e.damage,t);if(dist(e,player)<900)playEnemyCannon(dist(e,player),(e.x-player.x)/600);e.cooldown=e.reload+Math.random()*.4;}
function updateCommander(e:Enemy,dt:number){if((e.frozen??0)>0){e.frozen=Math.max(0,e.frozen!-dt);return;}e.slowTimer=Math.max(0,e.slowTimer-dt);
  const t=siegeAttackers(e,Math.max(560,effectiveRange()+TOWER_REACH_MARGIN))[0];if(t)e.face={east:t.x>e.x,north:t.y<e.y};e.cooldown-=dt;e.wander-=dt;const enraged=e.hp<e.maxHp*.5;
  if(t&&e.cooldown<=0){const a=Math.atan2(t.y-e.y,t.x-e.x);muzzleFlash(e.x+Math.cos(a)*34,e.y+Math.sin(a)*34,a,84);playEnemyCannon(dist(e,player)*.6,(e.x-player.x)/600);
    for(const off of enraged?[-.24,-.12,0,.12,.24]:[-.15,0,.15])siegeShot(e.x,e.y,a+off,290,e.damage*(.85+Math.random()*.3),t);e.cooldown=e.reload*(enraged?.8:1);}
  // Yaylım ateşi: her 14 sn'de çevresine 16 gülle (hedef takibi yok)
  if(e.wander<=0){e.wander=14;spawnText(e,'YAYLIM ATEŞİ','#ffb070');playEnemyCannon(dist(e,player)*.5,(e.x-player.x)/600);
    for(let k=0;k<16;k++){const a=k/16*Math.PI*2;siegeShot(e.x,e.y,a,260,e.damage*.6,player,{noHome:true,life:2});}}
  // Canı yarıya inince iki muhafız gemisi çağırır (bir kez)
  if(enraged&&!e.escortsCalled){e.escortsCalled=true;for(const k of [-1,1]){const p=lagoonPoint({x:e.x+k*160,y:e.y});const ship=makeShip(SIEGE_GUARD,p.x,p.y,0);Object.assign(ship,{aggro:true,combatTimer:999,summoned:true,siege:true});enemies.push(ship);}
    rewardNotice('Komutan muhafızlarını çağırdı','none');}}
// Müttefik kaptanlar: o aşamanın hedeflerine saldırır; 1. aşamada kale çemberinin dışından dolaşır, sonra lagüne girer
function spawnSiegeAllies(){if(!siege||sharedBosses())return;const TEST_CAPTAINS:[string,EliteShipId][]=[['ADM_AHMET','magma'],['ADM_YASİN','tempest'],['ADM_DOGAN','glacial']],sp=SIEGE_MAP.spawn;
  TEST_CAPTAINS.forEach(([name,elite],i)=>{const x=sp.x+(i-1)*260,y=sp.y+60;
    enemies.push({kind:'ship',role:'heavy',x,y,angle:0,hp:TEST_CAPTAIN_HP,maxHp:TEST_CAPTAIN_HP,cooldown:1+i*.6,speed:150,damage:TEST_CAPTAIN_DMG,reload:2.3,rewardGold:0,rewardFame:0,color:'#2f6a5a',name,tier:8,aggro:false,wander:0,slowTimer:0,homeX:x,homeY:y,combatTimer:0,hitRadius:44,
      captain:{elite,ammo:'iron',ammoClock:2+i*2,foe:null,orbit:null,orbitClock:0},face:{east:true,north:true}});});}
function siegeFoes(){if(!siege)return[];const ph=siegePhase(siege);
  return enemies.filter(o=>o.siege&&(ph===1?o.tower&&WALL_TOWERS.includes(o.towerIndex!):ph===2?o.tower:!o.tower));}
function updateSiegeCaptain(e:Enemy,dt:number){const c=e.captain!,f=SIEGE_MAP.fleet,ring=FLEET.islandR+46;e.slowTimer=Math.max(0,e.slowTimer-dt);
  if((e.frozen??0)>0){e.frozen=Math.max(0,e.frozen!-dt);return;}
  const foes=siegeFoes();if(!c.foe||!enemies.includes(c.foe)||!foes.includes(c.foe)||Math.random()<dt*.15)c.foe=foes.sort((a,b)=>dist(a,e)-dist(b,e))[0]??null;
  const foe=c.foe,open=siegePhase(siege!)>=2;
  c.orbitClock-=dt;if(foe&&(!c.orbit||c.orbitClock<=0||dist(e,c.orbit)<30)){c.orbitClock=3+Math.random()*2;e.iso=null;
    if(!open){const a=Math.atan2(foe.y-f.y,foe.x-f.x)+(Math.random()-.5)*.3;c.orbit={x:f.x+Math.cos(a)*ring,y:f.y+Math.sin(a)*ring};}
    else{let pick:Vec|null=null;const a0=Math.random()*Math.PI*2;for(let k=0;k<16&&!pick;k++){const a=a0+k*Math.PI/8,r=150+Math.random()*120,q={x:foe.x+Math.cos(a)*r,y:foe.y+Math.sin(a)*r};if(fleetNav(q)===2)pick=q;}c.orbit=pick??lagoonPoint(foe);}}
  // ara nokta: kapalıyken çemberin çevresinden dolaş, açıkken lagün yol bulucusunu kullan
  let way:Vec|null=c.orbit;if(way){const ae=Math.atan2(e.y-f.y,e.x-f.x),at=Math.atan2(way.y-f.y,way.x-f.x),diff=Math.atan2(Math.sin(at-ae),Math.cos(at-ae));
    if(!open&&Math.abs(diff)>.35){const a=ae+Math.sign(diff)*.5;way={x:f.x+Math.cos(a)*ring,y:f.y+Math.sin(a)*ring};}
    else if(open)way=routeVia(way,e);}
  e.face??={east:true,north:true};if(way){const st=straightStep(e.x,e.y,way.x,way.y,e.speed*(e.slowTimer>0?.55:1)*1.4,dt);if(st.dir>=0)e.dir16=st.dir;
    if(st.done)e.iso=null;else{e.x=clamp(e.x+st.mx,40,WORLD_WIDTH-40);e.y=clamp(e.y+st.my,40,WORLD_HEIGHT-40);const back=fleetCollision(e);if(back){e.x=back.x;e.y=back.y;}}}
  for(const o of [player,...enemies.filter(x=>x.captain&&x!==e)] as Vec[]){const dx=e.x-o.x,dy=e.y-o.y,dd=Math.hypot(dx,dy)||1;if(dd<150){const k=(150-dd)*Math.min(1,dt*3);e.x+=dx/dd*k;e.y+=dy/dd*k*.6;}}
  c.ammoClock-=dt;if(c.ammoClock<=0){c.ammoClock=5+Math.random()*4;const all:AmmoKind[]=['iron','chain','fire','explosive','breaker','leech'];c.ammo=all[Math.floor(Math.random()*all.length)];}
  if(!foe)return;const d=dist(e,foe);e.cooldown-=dt;if(d<SIEGE_FIRE_RANGE&&e.cooldown<=0){captainFire(e,foe);e.cooldown=e.reload;}}
function siegeTowerDown(e:Enemy){if(!siege||e.towerIndex===undefined)return;const before=siegePhase(siege),i=e.towerIndex;if(!siege.destroyed.includes(i))siege.destroyed.push(i);saveSiege(siege);
  const after=siegePhase(siege);
  if(WALL_TOWERS.includes(i)){const g=gateOf(i),left=gateLeft(siege,g);toast(left?`${g==='west'?'Batı':'Doğu'} kapısında ${left} sur topu kaldı`:`${g==='west'?'BATI':'DOĞU'} KAPISI DÜŞTÜ`);if(!left)rewardNotice(`${g==='west'?'BATI':'DOĞU'} KAPISI DÜŞTÜ`);}
  else toast(`İç kule yıkıldı · ${INNER_TOWERS.filter(k=>!siege!.destroyed.includes(k)).length} kule kaldı`);
  if(before===1&&after===2){fleetFields.clear();rewardNotice('2. aşama · kapılar açıldı, lagüne gir ve iç kuleleri yık','battle');}
  if(after===3)spawnCommander();renderSiegeHud();}
// Katkı ödülü: ödenmemiş hasar kadar (ayrılınca ya da kuşatma bitince)
function payContribution(){if(!siege)return null;const dmg=siege.contrib[profile.nick]??0,unpaid=dmg-siege.paid;if(unpaid<=0)return null;
  const r=contribReward(unpaid,SIEGE_PARTICIPANTS,state.level),xp=xpGain(r.xp),gold=goldGainAch(r.gold);state.fame+=xp;state.gold+=gold;serverPearls(r.pearls);siege.paid=dmg;saveSiege(siege);saveAccount();
  return{xp,gold,pearls:r.pearls};}
function siegeWon(e:Enemy){if(!siege)return;stopBossMusic();siege.result='won';siege.commanderHp=0;saveSiege(siege);
  for(let n=0;n<4;n++)later(n*.25,()=>{burst(e.x+(Math.random()-.5)*90,e.y+(Math.random()-.5)*60,true);playExplosion();});
  enemies.splice(0,enemies.length,...enemies.filter(o=>!o.siege));finishSiege(true);}
function finishSiege(won:boolean){if(!siege)return;const reward=payContribution(),dmg=siege.contrib[profile.nick]??0,order=ranking(siege.contrib),rank=order.findIndex(([n])=>n===profile.nick)+1;
  let chest:ReturnType<typeof victoryChest>|null=null,title=false;
  if(session.account?!!serverSiegeChest:won&&earnsChest(dmg,SIEGE_PARTICIPANTS)){chest=session.account?serverSiegeChest as ReturnType<typeof victoryChest>:victoryChest(Math.random,state.level);serverSiegeChest=null;serverPearls(chest.pearls);
    for(const [k,n] of Object.entries(chest.ammo))arsenal[k as keyof typeof chest.ammo]+=n!;arsenal.speed+=chest.speed;arsenal.mine+=chest.mine;arsenal.powder+=chest.powder;arsenal.shield+=chest.shield;saveArsenal(arsenal);saveAccount();renderQuickSlots();}
  if(won&&rank>0&&rank<=3&&dmg>0){heroTitle=grantTitle();title=true;}
  playLevelUp();showSiegeResult(won,dmg,rank,order,reward,chest,title);renderSiegeHud();}
function siegeRespawn(){const sp=SIEGE_MAP.spawn;player.x=sp.x+(Math.random()-.5)*200;player.y=sp.y;player.speed=0;destination=null;routeTarget=null;camera.x=player.x;camera.y=player.y;freeLook=null;
  state.hp=effectiveMaxHp();state.invulnerable=10;state.attacking=false;selected=null;ui('attack').classList.remove('active');mapFade=1;playSplash();
  toast('Gemin battı — kuşatma limanında tam gövdeyle doğdun, 10 sn korunuyorsun');}
function updateSiege(dt:number){if(!siege)return;
  siegeSaveClock-=dt;if(siegeSaveClock<=0){siegeSaveClock=2;const c=enemies.find(e=>e.commander);if(c){siege.commanderHp=Math.max(0,c.hp);}saveSiege(siege);}
  if(!siege.result&&Date.now()>siege.end+(siegeOnline?60_000:0)){siege.result='lost';saveSiege(siege);stopBossMusic();finishSiege(false);}
  siegeHudClock-=dt;if(siegeHudClock<=0){siegeHudClock=.5;renderSiegeHud();}}
function siegeTimeLeft(){if(!siege)return'';const min=Math.max(0,Math.ceil((siege.end-Date.now())/60000));return min>=60?`${Math.floor(min/60)} sa ${min%60} dk`:`${min} dk`;}
const PHASE_NAMES=['','1. AŞAMA · DIŞ SURLAR','2. AŞAMA · İÇ KULELER','3. AŞAMA · KALE KOMUTANI','KALE DÜŞTÜ'];
// Üst şerit: aşama, kapılar, yıkılma oranı ve kalan süre
const siegeBar=document.createElement('div');siegeBar.className='siege-bar';document.querySelector('.hud')!.append(siegeBar);
renderDayEvent();
function renderSiegeHud(){siegeBar.classList.toggle('on',!!siege);dayEventEl.classList.toggle('hidden',!!siege);if(!siege)return;const ph=siegePhase(siege),pct=Math.round(siegeProgress(siege,SIEGE_PARTICIPANTS)*100);
  const detail=ph===1?`Batı kapısı: ${gateLeft(siege,'west')} top · Doğu kapısı: ${gateLeft(siege,'east')} top`:ph===2?`İç kuleler: ${INNER_TOWERS.filter(i=>!siege!.destroyed.includes(i)).length} / 4`:ph===3?'Komutanın sancak gemisini batır':siege.result==='won'?'Zafer!':'';
  const html=`<div><b>KARA KALE · ${siege.result==='lost'?'KUŞATMA BİTTİ':PHASE_NAMES[ph]}</b><small>${siege.result?'':`bitime ${siegeTimeLeft()}`}</small></div><div><span>${detail}</span><i><em style="width:${pct}%"></em></i><small>%${pct}</small></div><button data-siege-leave>AYRIL</button>`;
  if(siegeBar.dataset.html===html)return;siegeBar.dataset.html=html;siegeBar.innerHTML=html;(siegeBar.querySelector('[data-siege-leave]') as HTMLButtonElement).onclick=leaveSiege;}
// Sağ panel: komutan ve katkı sıralaması
function siegePanelRows(){if(!siege)return[];const rows:string[]=[],order=ranking(siege.contrib).slice(0,10),total=Object.values(siege.contrib).reduce((a,b)=>a+b,0)||1;
  rows.push(`<div class="event-row siege-board"><small>KATKI SIRALAMASI</small><ol>${order.map(([n,d])=>`<li class="${n===profile.nick?'me':''}"><b>${escapeHtml(n)}</b><em>${fmt(Math.round(d))}</em><span>%${Math.round(d/total*100)}</span></li>`).join('')||'<li><b>Henüz hasar yok</b></li>'}</ol></div>`);
  return rows;}
function showSiegeResult(won:boolean,dmg:number,rank:number,order:[string,number][],reward:{xp:number;gold:number;pearls:number}|null,chest:ReturnType<typeof victoryChest>|null,title:boolean){
  const el=document.createElement('div');el.className='siege-result';const ammoNames=chest?Object.entries(chest.ammo).map(([k,n])=>`${fmt(n)} ${SPECIAL_AMMO[k as keyof typeof chest.ammo].name}`).join(' · '):'';
  el.innerHTML=`<section><span class="eyebrow">BÜYÜK KUŞATMA</span><h2>${won?'KARA KALE DÜŞTÜ!':'KUŞATMA SONA ERDİ'}</h2><p>${won?'Kaptanlar kaleyi birlikte yıktı.':'Kale bu akşam ayakta kaldı; katkı ödülün verildi.'}</p>
    <dl><dt>Verdiğin hasar</dt><dd>${Math.round(dmg).toLocaleString('tr-TR')}</dd><dt>Sıran</dt><dd>${rank>0?`${rank}. / ${order.length}`:'—'}</dd>
    <dt>Katkı ödülü</dt><dd>${reward?`+${reward.xp.toLocaleString('tr-TR')} TP · +${reward.gold.toLocaleString('tr-TR')} Altın · +${fmt(reward.pearls)} İnci`:'—'}</dd>
    ${won?`<dt>Zafer sandığı</dt><dd>${chest?`+${fmt(chest.pearls)} İnci · ${ammoNames} · +${fmt(chest.speed)} Hız İksiri · +${fmt(chest.mine)} Mayın · +${fmt(chest.powder)} Barut · +${fmt(chest.shield)} Kalkan`:'Kalenin en az %2\'si kadar hasar gerekli'}</dd>`:''}</dl>
    ${title?`<div class="hero-award">★ ${HERO_TITLE.toLocaleUpperCase('tr')} ★<small>İlk 3'e girdin · bir sonraki kuşatmaya kadar %3 ek hasar</small></div>`:''}
    <ol>${order.slice(0,5).map(([n,d],i)=>`<li class="${n===profile.nick?'me':''}"><b>${i+1}. ${escapeHtml(n)}</b><em>${fmt(Math.round(d))}</em></li>`).join('')}</ol>
    <button data-close>LİMANA DÖN</button></section>`;
  document.querySelector('.hud')!.append(el);(el.querySelector('[data-close]') as HTMLButtonElement).onclick=()=>{el.remove();leaveSiege();};}
function canEnterSiege(){return siegeWindow().open||ELITE_TEST_MODE;}
function enterSiege(){if(siege)return;if(!canEnterSiege()){toast('Büyük Kuşatma her Cuma 20:00–22:00 arasında açılır');return;}
  // Kuşatma yalnızca oyun sunucusu (VPS) üzerinden: herkes aynı kaleyi görür; bağlantı yoksa tek kişilik kuşatma açılmaz
  if(!sharedBosses()){toast('Kuşatma için oyun sunucusuna bağlantı gerekli · bağlantı kurulunca tekrar dene');return;}if(inCombat()){toast('Savaş sırasında kuşatmaya geçilemez');return;}
  const w=siegeWindow(),id=w.open?w.id:`test-${w.id}`;let s=loadSiege();
  if(sharedBosses())s=newSiege(id,w.open?w.end:Date.now()+SIEGE_MS);
  else if(!s||s.id!==id||(!w.open&&(s.result||Date.now()>s.end)))s=newSiege(id,w.open?w.end:Date.now()+SIEGE_MS);
  if(s.result){toast(s.result==='won'?'Kara Kale bu akşam düştü; gelecek Cuma yeniden kurulur':'Bu akşamki kuşatma sona erdi');return;}
  siegeOrigin={map:currentMap,x:player.x,y:player.y};siege=s;saveSiege(s);fleetSafe=null;fleetFields.clear();populateMap();
  const sp=SIEGE_MAP.spawn;player.x=sp.x;player.y=sp.y;player.speed=0;destination=null;routeTarget=null;selected=null;state.attacking=false;ui('attack').classList.remove('active');camera.x=player.x;camera.y=player.y;freeLook=null;
  mapFade=1;playMapJump();eventPanelHtml='';rewardNotice('Büyük Kuşatma · Kara Kale','battle');toast('Batı ve doğu kapılarını koruyan sur toplarını yık');}
function leaveSiege(){if(!siege)return;siegeOnline=false;SIEGE_PARTICIPANTS=4;const r=siege.result?null:payContribution();document.querySelector('.siege-result')?.remove();stopBossMusic();
  const o=siegeOrigin;siege=null;siegeOrigin=null;fleetSafe=null;fleetFields.clear();populateMap();
  if(o){player.x=o.x;player.y=o.y;}player.speed=0;destination=null;routeTarget=null;selected=null;state.attacking=false;camera.x=player.x;camera.y=player.y;freeLook=null;
  mapFade=1;playMapJump();eventPanelHtml='';renderSiegeHud();renderDayEvent(true);if(r)rewardNotice(`Kuşatma katkısı · +${fmt(r.xp)} TP · +${fmt(r.gold)} altın · +${fmt(r.pearls)} inci kazanıldı`,'battle',{xp:r.xp,gold:r.gold});}
function sinkEnemy(e:Enemy){
  const j=enemies.indexOf(e);if(j<0)return;
  // Paylaşılan boss ve ada kulesi: batışı sunucu bildirir; o zamana kadar 1 canla ayakta kalır
  if(((e.boss&&e.shared)||(e.net&&!e.serverDown)||(e.tower&&!e.siege&&!!session.account)||(e.siege&&siegeOnline&&(e.tower||e.commander)))&&!e.serverDown){if(e.net&&!e.serverDown){e.hp=Math.max(1,e.hp);return;}e.hp=1;e.lastHp=1;return;}
  if(!e.tower)spawnWreck(e);
  if(e.captain){enemies.splice(j,1);if(selected===e){selected=null;state.attacking=false;ui('attack').classList.remove('active');}burst(e.x,e.y,true);playExplosion();playSink(earGain(e));splashAt(e.x,e.y,190);if(e.lastHitBy!=='captain'){gainRage(rage,RAGE_PER_RIVAL);const sp=claimRivalSp(rivalLog,e.name)?gainSp(RIVAL_SP*spMult()):0;sinkNotice(e.name,sp);rivalSinks++;saveRivalSinks(rivalSinks);saveAccount();}e.lastHitBy=undefined;
    const map=currentMap,inst=siege;later(5,()=>{if(currentMap!==map||siege!==inst)return;const a=Math.random()*Math.PI*2,p={x:clamp(e.homeX+Math.cos(a)*450,80,WORLD_WIDTH-80),y:clamp(e.homeY+Math.sin(a)*260,80,WORLD_HEIGHT-80)};Object.assign(e,{x:p.x,y:p.y,hp:e.maxHp,frozen:0,burnTimer:0,slowTimer:0});e.captain!.foe=null;enemies.push(e);spawnText(e,`${e.name} YENİDEN DENİZDE`,'#f1d08a');});return;}
  enemies.splice(j,1);if(selected===e){selected=null;state.attacking=false;ui('attack').classList.remove('active');}
  burst(e.x,e.y,true);playExplosion();playSink(earGain(e));splashAt(e.x,e.y,190);
  if(e.tower){destroyTower(e);return;}
  if(e.commander){siegeWon(e);return;}
  if(e.boss){defeatBoss(e);return;}
  // Sunucu NPC'si: ödül yalnız hasar payına göre; katkısı olmayan yalnız batışı görür
  if(e.net&&!((e.share??0)>0))return;
  // NPC tecrübe puanı ve altın verir; savaş puanı (SP) yalnızca rakip oyuncu batırınca gelir (src/battle.ts).
    const share=e.net?e.share??0:1,full=share>=.3,goldGain=goldGainAch(e.rewardGold*share*(1+bonus.bounty)),fame=xpGain(e.rewardFame*share);state.gold+=goldGain;state.fame+=fame;saveAccount();if(full){bumpAch('npc');if(e.role==='heavy')bumpAch('heavy');}
  rewardNotice(`${e.name} batırıldı · +${fmt(goldGain)} altın · +${fmt(fame)} TP kazanıldı`,'battle',{xp:fame,gold:goldGain,sink:true});if(e.def){if(!siege&&!e.net)sendKill(e.def.id);if(full){recordQuestProgress('npc',e.def.id);levelQuestHit('npc',e.def.id,e.def.tier);}}countBossKill(e);if(!e.summoned)setTimeout(spawnEnemy,1800);
}
// Savaş puanı kazancı; rütbe atlanırsa duyurulur
const spText=()=>{const r=battleRank(state.battlePoints);return r.next?`${fmt(state.battlePoints)} / ${fmt(r.next.sp)}`:fmt(state.battlePoints);};
const rivalLog=loadRivalLog();
function gainSp(n:number){const before=battleRank(state.battlePoints).index;state.battlePoints+=n;
  const r=battleRank(state.battlePoints);if(r.index>before){playLevelUp();rewardNotice(`Rütbe atladın: ${r.name} · ${r.index+1}. rütbe madalyası kazanıldı`,'battle');if(ui('captainOverlay').classList.contains('open'))renderRankMedals();}return n;}
// Kule menzili hiçbir zaman oyuncunun top menzilinin altında kalmaz: kuleye ateş edebilen gemiyi kule de vurur
// (uzun top + geliştirme + donanım kuleyi menzil dışından vuramaz). Saldırı altındaki kule yetenek menzilini (+150) de kapsar.
const TOWER_REACH_MARGIN=60,TOWER_ALERT_REACH=200;
function towerReach(e:Enemy){return Math.max(e.fireRange??460,effectiveRange()+(e.combatTimer>0?TOWER_ALERT_REACH:TOWER_REACH_MARGIN));}
function updateTower(e:Enemy,dt:number){
  const d=dist(e,player),reach=towerReach(e);e.cooldown-=dt;e.combatTimer=Math.max(0,e.combatTimer-dt);e.slowTimer=0;e.burnTimer=Math.max(0,(e.burnTimer??0));
  e.aggro=!mapDef().safe&&(d<reach+30||e.combatTimer>0);
  if(e.hp<e.maxHp)e.hp=Math.min(e.maxHp,e.hp+(e.siege?e.maxHp*(e.aggro?.004:.02):fleetTowerRegen(e.maxHp,e.combatTimer>0))*dt);
  if(e.aggro&&d<reach&&e.cooldown<=0&&state.invulnerable<=0){const muzzle=towerMuzzle(e),tx=muzzle.x,ty=muzzle.y,a=Math.atan2(player.y-ty,player.x-tx);
    muzzleFlash(tx,ty,a,60);for(const off of [-.05,.05])shots.push({x:tx,y:ty,vx:Math.cos(a+off)*320,vy:Math.sin(a+off)*320,life:Math.max(2.2,d/320+.5),owner:'enemy',damage:e.damage,hit:false,ammo:theme().fleet==='lava'?'fire':'iron'});
    playEnemyCannon(d,(e.x-player.x)/600);e.cooldown=e.reload+(e.siege?Math.random()*.4:0);}
}
function destroyTower(e:Enemy){
  if(siege){siegeTowerDown(e);return;}
  towersDestroyedHere++;if(e.towerIndex!==undefined)markRuin(towerRuins,currentMap,e.towerIndex);const left=enemies.filter(x=>x.tower).length,f=mapDef().fleet;
  toast(left?`${f.name}: ${left} kule kaldı`:`${f.name} düştü!`);
  if(left>0)return;
  fleetOwners[currentMap]='player';saveFleetOwners(fleetOwners);clearRuins(towerRuins,currentMap);if(guild){guild.towers[currentMap]=Array(TOWER_SLOTS).fill(null);saveGuild(guild);}const r=fleetReward(mapDef().tier);state.gold+=r.gold;state.fame+=r.xp;saveAccount();
  setupFleetIsland();rewardNotice(`${f.name} filona katıldı · +${fmt(r.gold)} altın · +${fmt(r.xp)} TP kazanıldı`,'battle',{xp:r.xp,gold:r.gold});
}
// Filonun diktiği kuleler: tek tip filo kulesi, menzildeki en yakın düşmana top atar.
function updateOwnTowers(dt:number){
  if(!hasFleetIsland()||fleetOwner()!=='player')return;const t=fleetTower(mapDef().tier);
  for(const tw of ownTowers){const def=TOWER_TYPES[tw.type],range=t.range*def.range;
    tw.cooldown-=dt;if(tw.cooldown>0)continue;
    const target=enemies.filter(e=>!e.tower&&dist(e,tw)<range).sort((a,b)=>dist(a,tw)-dist(b,tw))[0];
    if(!target)continue;tw.cooldown=t.reload*def.reload;const muzzle=towerMuzzle(tw),a=Math.atan2(target.y-muzzle.y,target.x-muzzle.x),speed=420;
    muzzleFlash(muzzle.x,muzzle.y,a,60);shots.push({x:muzzle.x,y:muzzle.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:2.8,owner:'player',damage:t.ownDamage*def.damage,hit:false,ammo:theme().fleet==='lava'?'fire':'iron',target});}
}
// Havan: isabet noktasının çevresindeki diğer düşmanlara %60 hasar
function towerSplash(s:Shot,hit:Target){burst(hit.x,hit.y,true);
  for(const o of [...enemies]){if(o===hit||isAlly(o)||(o.kind==='ship'&&o.tower)||dist(o,hit)>(s.splash??0))continue;const dmg=s.damage*.6;o.hp-=dmg;if(o.kind==='ship')o.lastHitBy='player';damageText(o.x,o.y,dmg);
    if(o.hp<=0)sinkEnemy(o);}}
let ruinClock=5;
function updateEvents(dt:number){
  ruinClock-=dt;if(ruinClock<=0){ruinClock=5;reviveRivalTowers();}

  updateOwnTowers(dt);
  if(siege)updateSiege(dt);
  if(ls)lsPickTick();
  if(ls){lsHudClock-=dt;if(lsHudClock<=0){lsHudClock=.5;renderLsHud(ls,lsHooks);}}
  if(dom){domHudClock-=dt;if(domHudClock<=0){domHudClock=.5;renderDomHud(dom,leaveDom);}}
  eventPanelClock-=dt;if(eventPanelClock>0)return;eventPanelClock=.25;
  const panel=ui('eventPanel'),rows:string[]=[];
  if(siege)rows.push(...siegePanelRows());else{
  const boss=activeBoss(),bd=bossFor(currentMap),bossArt=`<i class="event-art" style="${portraitStyle(BOSS_ATLAS,bd.portrait,MAP_KEYS.length,BOSS_ATLAS_COLS)}"></i>`;
  if(boss)rows.push(`<button class="event-row boss" data-event-route="boss">${bossArt}<span><small>HARİTA BOSSU · ${fmt(Math.round(dist(boss,player)))}m</small><strong>${bd.name}</strong><i><em style="width:${boss.hp/boss.maxHp*100}%"></em></i></span></button>`);
  if(treasure.active||treasure.parts>0){const a=treasure.active;rows.push(`<button class="event-row treasure" data-event-route="treasure"><img src="${TREASURE_ICON}" alt=""/><span><small>${a?'HAZİNE HARİTASI · HEDEF':'HAZİNE HARİTASI PARÇALARI'}</small><strong>${a?`${a.map} · ${a.label}`:`${treasure.parts} / ${TREASURE_PARTS} parça`}</strong>${a?'':`<i><em style="width:${treasure.parts/TREASURE_PARTS*100}%"></em></i>`}</span></button>`);}
  }
  const html=rows.join('');if(html===eventPanelHtml)return;eventPanelHtml=html;
  panel.innerHTML=html;panel.classList.toggle('visible',rows.length>0);
  combatTargetsTop=`${rows.length&&panel.offsetHeight?panel.offsetTop+panel.offsetHeight+4:panel.offsetTop}px`;
  panel.querySelectorAll<HTMLButtonElement>('[data-event-route]').forEach(b=>b.onclick=()=>{if(b.dataset.eventRoute==='treasure'){const a=treasure.active;if(!a){toast('Denizde sürüklenen sandıklardan parça topla');return;}if(a.map!==currentMap){toast(`Hazine ${a.map} ${MAPS[a.map].name} denizinde (${a.label})`);return;}}const f=mapDef().fleet,target=b.dataset.eventRoute==='treasure'?treasure.active!:b.dataset.eventRoute==='boss'?activeBoss():fleetEnterable()?{x:f.x+(player.x<f.x?-430:430),y:f.y-20}:{x:f.x,y:f.y+FLEET_ART.h/2+120};if(!target)return;routeTarget=navigablePoint({x:target.x,y:target.y});destination=routeVia(routeTarget);toast('Rota çizildi');});
}
// ---------------------------------------------------------------- Elit gemiler
// Elit gemilerin ayrı yetenekleri (pasifleri) kaldırıldı; yalnız seviye bonusları (ELITE_REWARDS, eliteBonus) geçerlidir.
function eliteTakenMult(){return 1-eliteBonus().defense;}
function later(t:number,fn:()=>void){abilityQueue.push({t,fn});}
// Korsan Öfkesi: bar dolunca basılır; sonraki 2 salvo %25 güçlü, gemi %15 hızlı ve alevler içinde (en çok 5 sn)
function activateRage(){
  if(ls){toast('Lanetli Sular\'da Korsan Öfkesi kullanılamaz · herkes eşit gemiyle savaşır');return;}
  if(rageActive(rage)){toast(`Korsan Öfkesi açık · ${rage.salvos} güçlü salvo kaldı`);return;}
  if(!startRage(rage)){toast(`Öfke barı dolmadı (%${Math.floor(rage.meter)}) — rakip oyuncu ve boss batırdıkça dolar`);return;}
  // Açılış efekti yalnızca 1 sn (kalabalıkta birçok oyuncu aynı anda basınca kasmasın); sonra 2 güçlü salvo boyunca kırmızı hız izi
  spawnText(player,'KORSAN ÖFKESİ!','#ff7a2a');spawnRage(player,1);screenTint(.3,'200,40,10');playRage();
  for(let n=0;n<14;n++){const a=Math.random()*Math.PI*2,sp=60+Math.random()*90;particles.push({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.5,life:.6+Math.random()*.4,maxLife:1,kind:'ember',z:10+Math.random()*30,size:10+Math.random()*14,color:n%2?'#ff6a1a':'#ffd27a'});}
}
function updateRage(dt:number){
  playerHitClock+=dt;tickLogout();sharedBossTick(dt);npcNetTick(dt);siegeNetTick(dt);sharedTowerTick(dt);towerHealTick(dt);
  for(let i=abilityQueue.length-1;i>=0;i--){const q=abilityQueue[i];q.t-=dt;if(q.t<=0){abilityQueue.splice(i,1);q.fn();}}
  const was=rageActive(rage);tickRage(rage,dt);
  // Öfke açıkken: Hız İksiri izinin kırmızı hali (gemi giderken)
  if(rageActive(rage)&&Math.abs(player.speed)>15){rageEmber-=dt;while(rageEmber<=0){rageEmber+=1/60;
    const fx=Math.sin(player.angle),fy=-Math.cos(player.angle),back=30+Math.random()*30,side=(Math.random()-.5)*36,r=Math.random();
    particles.push({x:player.x-fx*back-fy*side,y:player.y-fy*back*.5+fx*side*.5,vx:-fx*12+(Math.random()-.5)*10,vy:-fy*6-6-Math.random()*8,life:.5+Math.random()*.4,maxLife:.9,kind:'glint',z:4+Math.random()*34,size:8+Math.random()*14,color:r<.62?'#ff3a2a':r<.86?'#ffd0b0':'#ffb03a',rot:Math.random()*Math.PI});}}
  else if(was)clearRageFx();
}
function toggleConsumable(id:ConsumableId){
  if(ls){toast('Lanetli Sular\'da malzeme kullanılamaz · herkes eşit gemiyle savaşır');return;}
  const c=CONSUMABLES[id];if(!consumableOn[id]&&arsenal[id]<=0){toast(`${c.name} kalmadı — MALZEMELER'den alabilirsin`);return;}
  consumableOn[id]=!consumableOn[id];if(consumableOn[id]&&id==='shield')playShield();toast(`${c.name} ${consumableOn[id]?'açıldı':'kapatıldı'}`);renderQuickSlots();
}
// Açık sarf malzemesinden 1 adet harcar; bitince kendiliğinden kapanır. Çarpanı döndürür.
function useConsumable(id:ConsumableId){
  if(!consumableOn[id])return 1;if(arsenal[id]<=0){consumableOn[id]=false;renderQuickSlots();return 1;}
  arsenal[id]-=1;if(id==='shield')sendUse('shield');saveArsenal(arsenal);if(arsenal[id]<=0){consumableOn[id]=false;toast(`${CONSUMABLES[id].name} tükendi`);}renderQuickSlots();
  return CONSUMABLES[id].factor;
}
// Pusula: görüş sisini kısa süre kaldırır
let compassReveal=0,compassCooldown=0;
function useCompass(){
  if(ls){toast('Lanetli Sular\'da pusula kullanılamaz · herkes eşit gemiyle savaşır');return;}
  if(compassCooldown>0){toast(`Pusula ${Math.ceil(compassCooldown)} sn sonra hazır`);return;}
  if(arsenal.compass<=0){toast('Pusula kalmadı — Malzemeler\'den alabilirsin');return;}
  arsenal.compass--;sendUse('compass');saveArsenal(arsenal);renderQuickSlots();compassReveal=COMPASS.reveal;compassCooldown=COMPASS.cooldown;compassPulse=1;playClick();
  toast(`Pusula açıldı · ${COMPASS.reveal} sn boyunca bütün deniz görünür`);
}
let compassPulse=0;
// Mini haritada görünür mü: görüş dairesinin içinde ya da pusula açıkken
const seenOnMap=(p:Vec)=>compassReveal>0||dist(p,player)<=VISION_RADIUS;
function activateAbility(id:'speed'){
  if(ls){toast('Lanetli Sular\'da hız iksiri kullanılamaz · herkes eşit gemiyle savaşır');return;}
  const t=abilityTimers[id],a=ABILITIES[id];
  if(t.cooldown>0){toast(`${a.name} ${Math.ceil(t.cooldown)} sn sonra hazır`);return;}
  if(t.active>0){toast(`${a.name} zaten etkin`);return;}
  if(arsenal.speed<=0){toast(`${a.name} kalmadı — marketten alabilirsin`);return;}
  arsenal.speed--;sendUse('speed');saveArsenal(arsenal);renderQuickSlots();
  t.active=a.duration;t.cooldown=a.cooldown;// hız iksiri bekleme süresi sabit 30 sn (kaptan bonusları kısaltmaz)
  toast(`${a.name} içildi · kalan ${arsenal.speed.toLocaleString('tr-TR')}`);playSpeed();
  // içildiği an gemiyi saran kısa parıltı patlaması
  if(id==='speed')for(let n=0;n<26;n++){const ang=Math.random()*Math.PI*2,sp=40+Math.random()*70;particles.push({x:player.x,y:player.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp*.5,life:.5+Math.random()*.4,maxLife:.9,kind:'glint',z:10+Math.random()*40,size:8+Math.random()*12,color:n%3?'#5ff3ff':'#ffffff',rot:Math.random()*3});}
}
function dropMine(){
  if(ls){toast('Lanetli Sular\'da mayın kullanılamaz · herkes eşit gemiyle savaşır');return;}
  const t=abilityTimers.mine;
  if(mapDef().safe){toast('Güvenli sularda mayın bırakılamaz');return;}
  if(arsenal.mine<=0){toast('Deniz mayını kalmadı — marketten alabilirsin');return;}
  if(t.cooldown>0){toast(`Mayın ${Math.ceil(t.cooldown)} sn sonra hazır`);return;}
  if(mines.length>=MINE.maxActive){toast(`Aynı anda en fazla ${MINE.maxActive} mayın`);return;}
  const mx=player.x-Math.sin(player.angle)*42,my=player.y+Math.cos(player.angle)*42;
  arsenal.mine-=1;sendUse('mine',{x:Math.round(mx),y:Math.round(my)});saveArsenal(arsenal);renderQuickSlots();t.cooldown=ABILITIES.mine.cooldown*bonus.cooldown;
  playSplash();mines.push({x:mx,y:my,life:ABILITIES.mine.duration,arm:MINE.armSeconds});toast('Mayın bırakıldı');
}
// Hesaplı oyunda mayın sunucuda patlar: burada yalnızca görüntü
function onMineBoom(x:number,y:number){let bi=-1,bd=40;mines.forEach((m,i)=>{const d=Math.hypot(m.x-x,m.y-y);if(d<bd){bd=d;bi=i;}});if(bi>=0)mines.splice(bi,1);if(dist(player,{x,y})<1400){playExplosion();burst(x,y,true);burst(x,y,true);}}
function detonateMine(index:number){
  const mine=mines[index];mines.splice(index,1);playExplosion();burst(mine.x,mine.y,true);burst(mine.x,mine.y,true);
  const damage=Math.round((MINE.baseDamage+state.level*MINE.damagePerLevel)*bonus.mine);
  for(const e of [...enemies])if(dist(e,mine)<MINE.blastRadius&&!isAlly(e)){e.aggro=true;e.lastHitBy='player';e.combatTimer=12;e.hp-=damage;siegeHit(e,damage,profile.nick);damageText(e.x,e.y,damage);if(e.hp<=0)sinkEnemy(e);}
}
function updateArsenal(dt:number){
  for(const t of Object.values(abilityTimers)){t.active=Math.max(0,t.active-dt);t.cooldown=Math.max(0,t.cooldown-dt);}
  // Hız İksiri etkisi: gemi giderken kıçından süzülüp sönen parıltılı yıldız izi (turkuaz; arada beyaz ve altın)
  if(abilityActive('speed')&&Math.abs(player.speed)>15){glintClock-=dt;while(glintClock<=0){glintClock+=1/90;
    const fx=Math.sin(player.angle),fy=-Math.cos(player.angle),back=30+Math.random()*30,side=(Math.random()-.5)*36,r=Math.random();
    particles.push({x:player.x-fx*back-fy*side,y:player.y-fy*back*.5+fx*side*.5,vx:-fx*12+(Math.random()-.5)*10,vy:-fy*6-6-Math.random()*8,life:.55+Math.random()*.45,maxLife:1,kind:'glint',z:4+Math.random()*34,size:8+Math.random()*14,color:r<.62?'#5ff3ff':r<.86?'#ffffff':'#ffe08a',rot:Math.random()*Math.PI});}}
  for(let i=mines.length-1;i>=0;i--){const m=mines[i];m.life-=dt;m.arm=Math.max(0,m.arm-dt);if(m.life<=0){mines.splice(i,1);continue;}
    if(!session.account&&m.arm<=0&&(enemies.some(e=>dist(e,m)<MINE.triggerRadius)))detonateMine(i);}
  for(const id of ['speed','mine'] as AbilityId[]){const t=abilityTimers[id],button=document.getElementById(`ability-${id}`);if(!button)continue;
    const cd=Math.min(1,t.cooldown/(ABILITIES[id].cooldown*(id==='speed'?1:bonus.cooldown))),label=t.active>0&&id!=='mine'?`${Math.ceil(t.active)} SN`:t.cooldown>0?`${Math.ceil(t.cooldown)}`:'';// hazırken rozet boş kalır (miktar ve kısayol yazılmaz); yalnızca etkin süre ve bekleme sayılır
    button.style.setProperty('--cd',cd.toFixed(3));button.classList.toggle('active',t.active>0&&id!=='mine');const small=button.querySelector('small');if(small&&small.textContent!==label)small.textContent=label;}
}
// ---------------------------------------------------------------- Başarımlar
function bumpAch(stat:AchStat,n=1){ach.stats[stat]+=n;checkAchievements();}
function setAch(stat:AchStat,v:number){if(v>ach.stats[stat]){ach.stats[stat]=v;checkAchievements();}}
let achSaveAt=0;
function checkAchievements(){
  const fresh=unlockReached(ach);
  for(const d of fresh){if(!session.account)state.pearls+=d.pearls;rewardNotice(`Başarım açıldı: ${d.name} · +${fmt(d.pearls)} inci`);}
  if(fresh.length){const hadCollection=achBonusCache.damage>0;achBonusCache=achievementBonus(ach);if(!hadCollection&&achBonusCache.damage>0)rewardNotice('Ana madalya koleksiyonu tamamlandı · +%5 hasar · +%5 can');saveAccount();playLevelUp();saveAchievements(ach);return;}
  const now=performance.now();if(now-achSaveAt>2000){achSaveAt=now;saveAchievements(ach);}
}
function renderAchievements(){
  const b=achBonus();ui('achSummary').innerHTML=`<b>${ach.unlocked.length} / ${ACHIEVEMENTS.length}</b> madalya · Ana koleksiyon ödülü: ${bonusText(b)||'17 madalya tamamlanınca +%5 hasar ve +%5 can'}`;
  renderRankMedals();
  ui('achGrid').innerHTML=ACHIEVEMENTS.map((d,i)=>{const done=ach.unlocked.includes(d.id),v=Math.min(ach.stats[d.stat],d.goal);
    return`<article class="ach-card ${done?'done':''}"><i class="ach-badge" style="${badgeStyle(i)}"></i><div><h4>${d.name}</h4><p>${d.desc}</p><small>${fmt(d.pearls)} İnci</small><span class="ach-bar"><em style="width:${v/d.goal*100}%"></em></span><b>${done?'✓ AÇILDI':`${v.toLocaleString('tr-TR')} / ${d.goal.toLocaleString('tr-TR')}`}</b></div></article>`;}).join('');
}
setAch('level',state.level);
// ---------------------------------------------------------------- Günlük giriş ödülü
let daily=loadDaily();
// Günlük, festival ve kupon ödülleri için ortak yazı ve teslim
type BundleReward={gold?:number;pearls?:number;chain?:number;fire?:number;breaker?:number;explosive?:number;leech?:number;heal?:number;powder?:number;shield?:number;speed?:number;mine?:number;equip?:string;design?:boolean};
const BUNDLE_ITEMS=['fire','breaker','explosive','leech','heal','powder','shield','speed','mine'] as const;
function dailyText(r:BundleReward){return[r.gold&&`${r.gold.toLocaleString('tr-TR')} Altın`,r.pearls&&`${fmt(r.pearls)} İnci`,r.chain&&`${fmt(r.chain)} Zincir Güllesi`,...BUNDLE_ITEMS.map(k=>r[k]&&`${fmt(r[k]!)} ${QUICK_ITEMS[k].name}`),r.equip&&(r.equip==='epic'?'Destansı Donanım':'Sıradan Donanım'),r.design&&'PIRATE RAGE özel gemi tasarımı'].filter(Boolean) as string[];}
function giveBundle(r:BundleReward){if(r.gold)state.gold+=r.gold;if(r.pearls)state.pearls+=r.pearls;if(r.chain)state.chainAmmo+=r.chain;
  for(const k of BUNDLE_ITEMS)if(r[k])arsenal[k]+=r[k]!;
  let eq='';if(r.equip){const pool=EQUIPMENT.filter(e=>e.rarity===(r.equip==='epic'?2:0)),e=pool[Math.floor(Math.random()*pool.length)];if(e){equipOwned[e.id]=(equipOwned[e.id]??0)+1;eq=e.name;}}
  if(r.design){designOwned=true;saveDesignOwned();}
  saveArsenal(arsenal);saveAccount();renderQuickSlots();updateUI();return eq;}
const REWARD_ICONS:[string,string][]=[['Altın','icon-gold-v1'],['İnci','icon-pearl-v1'],['Zincir','ammo-chain-v2'],['Ateş','ammo-fire-v2'],['Alev','ammo-fire-v2'],['Patlayıcı','ammo-explosive-v2'],['Kule Kırıcı','ammo-breaker-v2'],['Barut','icon-powder-v4'],['Kalkan','icon-shield-v3'],['Hız','icon-speed-potion-v2'],['Can Emici','ammo-leech-v2'],['Şifa','ammo-heal-v1'],['Mayın','icon-mine-v2'],['Donanım','icon-anvil-v2']];
function rewardLi(t:string){const ic=REWARD_ICONS.find(([k])=>t.includes(k));return`<li>${ic?`<img src="/assets/${ic[1]}.webp" alt="" draggable="false"/>`:''}<span>${t}</span></li>`;}
function openDaily(){renderDaily();ui('dailyOverlay').classList.add('open');}
function closeDaily(){ui('dailyOverlay').classList.remove('open');}
function renderDaily(){
  renderFestival();
  const st=dailyStatus(daily);
  ui('dailyGrid').innerHTML=[1,2,3,4,5,6,7].map(d=>{const r=dailyReward(d,state.level),done=d<st.day||(d===st.day&&!st.canClaim),today=d===st.day&&st.canClaim;
    return`<article class="daily-day ${done?'done':''} ${today?'today':''} ${d===7?'grand':''}"><b>${d}. GÜN</b><ul>${dailyText(r).map(rewardLi).join('')}</ul>${today?'<button id="claimDaily">TOPLA</button>':done?'<span class="tick">✓ ALINDI</span>':'<span class="lock">SIRADA</span>'}</article>`;}).join('');
  ui('dailyNote').textContent=st.canClaim?'Bugünün ödülü hazır. Yarın gelmezsen takvim 1. güne döner.':'Bugünün ödülünü aldın. Yarın yeni ödül seni bekliyor.';
  const b=document.getElementById('claimDaily');if(b)b.onclick=claimToday;
}
// Hesapla oynarken günlük ve festival ödülünü sunucu hesaplar ve verir (011_economy_hardening.sql)
let claimRpc=true;
async function serverClaim(kind:'daily'|'festival'):Promise<{day:number;reward:BundleReward}|null|undefined>{const sb=supa();if(!sb)return null;
  const {data,error}=await sb.rpc('economy_claim',{p_kind:kind});if(error?.code==='PGRST202'){claimRpc=false;return undefined;}if(error||!data){const msg=error?.message.replace(/^.*?: /,'')||'Ödül alınamadı';toast(msg);if(/zaten/.test(msg))void loadServerClaims();return null;}
  const d=data as {day:number;reward:BundleReward};if(d.reward.pearls){session.pearlServerAdd?.(d.reward.pearls);}return d;}
async function loadServerClaims(){const sb=supa();if(!sb)return;const {data,error}=await sb.rpc('economy_claims_get');if(error?.code==='PGRST202')claimRpc=false;if(error||!data)return;
  const d=data as {today:string;festivalStart:string|null;claims:{kind:string;day:string;n:number}[]};
  const last=d.claims.filter(c=>c.kind==='daily').pop();daily=last?{last:last.day===d.today?dayKey(new Date()):last.day,streak:last.n}:{last:null,streak:0};saveDaily(daily);
  if(d.festivalStart){const f=d.claims.filter(c=>c.kind==='festival'&&c.day>=d.festivalStart!).map(c=>c.n);festival={start:d.festivalStart,claimed:f};saveFestival(festival);}else festival=null;
  if(ui('dailyOverlay').classList.contains('open'))renderDaily();}
let claimBusy=false;
async function claimToday(){
  const st=dailyStatus(daily);if(!st.canClaim||claimBusy)return;
  if(econOn&&claimRpc){claimBusy=true;const res=await serverClaim('daily').finally(()=>{claimBusy=false;});if(res===null)return;if(res){daily={last:dayKey(new Date()),streak:res.day};saveDaily(daily);setAch('daily',daily.streak);
    const eq=giveBundle(res.reward);playCoins();renderDaily();rewardNotice(`Günlük ödül · ${res.day}. gün · ${dailyText(res.reward).map(t=>t.endsWith(' Donanım')&&eq?eq:t).join(' · ')}`);return;}}
  const r=dailyReward(st.day,state.level);daily=claimDaily(daily);saveDaily(daily);setAch('daily',daily.streak);
  const eq=giveBundle(r);
  playCoins();renderDaily();
  rewardNotice(`Günlük ödül · ${st.day}. gün · ${dailyText(r).map(t=>t.endsWith(' Donanım')&&eq?eq:t).join(' · ')}`);
}
// ---- Açılış Festivali: ilk 7 gün, her gün giriş yapana özel ödül; 7/7 olana Pirate Rage tasarımı
let festival=loadFestival(ELITE_TEST_MODE);
const festivalText=(r:FestivalReward)=>dailyText(r);
function renderFestival(){
  let box=document.getElementById('festivalBox');
  const st=festival?festivalStatus(festival):null;
  if(!festival||!st||st.day<1||st.day>FESTIVAL_DAYS){box?.remove();return;}
  if(!box){box=document.createElement('div');box.id='festivalBox';box.className='festival-box';ui('dailyGrid').before(box);}
  const days=FESTIVAL_REWARDS.map((r,i)=>{const d=i+1,done=festival!.claimed.includes(d),today=d===st.day&&st.canClaim,missed=st.missed.includes(d),grand=d===FESTIVAL_DAYS;
    return`<article class="daily-day festival-day ${done?'done':''} ${today?'today':''} ${missed?'missed':''} ${grand?'grand':''}"><b>${d}. GÜN</b>${grand?`<img src="${PIRATE_RAGE_DESIGN.card}" alt="" draggable="false"/>`:''}<ul>${festivalText(r).filter(t=>!t.startsWith('PIRATE')).map(rewardLi).join('')}${grand?`<li class="design">7/7 BÜYÜK ÖDÜL</li>${festivalText(FESTIVAL_GRAND).filter(t=>!t.startsWith('PIRATE')).map(rewardLi).join('')}<li class="design">PIRATE RAGE</li>`:''}</ul>${today?'<button id="claimFestival">AL</button>':missed?'<em>KAÇIRILDI</em>':''}</article>`;}).join('');
  const note=st.grandLost?'Bir festival günü kaçırıldı: büyük ödül ve Pirate Rage tasarımı artık kazanılamaz. Kalan günlerin ödüllerini almaya devam edebilirsin.':`Festivalin ${st.day}. günü · ${festival.claimed.length}/${FESTIVAL_DAYS} gün. 7 günün hepsine gelen büyük ödülü ve Pirate Rage özel gemisini kazanır; bu ödüller bir daha verilmez.`;
  box.innerHTML=`<h3>AÇILIŞ FESTİVALİ</h3><div class="daily-grid">${days}</div><p class="daily-note">${note}</p><h3 class="festival-sub">GÜNLÜK ÖDÜL</h3>`;
  const b=document.getElementById('claimFestival');if(b)b.onclick=claimFestivalToday;
}
async function claimFestivalToday(){
  if(!festival||claimBusy)return;let r:FestivalReward|null;
  if(econOn&&claimRpc){if(!festivalStatus(festival).canClaim)return;claimBusy=true;const res=await serverClaim('festival').finally(()=>{claimBusy=false;});if(!res)return;festival.claimed.push(res.day);r=res.reward as FestivalReward;}
  else r=claimFestival(festival);if(!r)return;saveFestival(festival);
  giveBundle(r);playCoins();renderDaily();
  rewardNotice(`Açılış Festivali · ${festival.claimed.length}. ödül · ${festivalText(r).join(' · ')}`);
  if(r.design)toast('PIRATE RAGE özel gemisi senin! Tersane → Özel Gemiler');
}
// Oyun açılınca, bugünün günlük ya da festival ödülü alınmadıysa takvim kendiliğinden açılır
setTimeout(()=>{if(dailyStatus(daily).canClaim||(festival&&festivalStatus(festival).canClaim))openDaily();},1600);
// ---------------------------------------------------------------- Hazine avı
const treasure=loadTreasure();let dig:{t:number;x:number;y:number}|null=null;
function rollTreasurePart(){
  // Hesapla oynarken parça zarını, hazine yerini ve kazıyı oyun sunucusu yönetir
  if(session.account)return;
  if(Math.random()>=PART_CHANCE)return;treasure.parts++;
  if(treasure.parts>=TREASURE_PARTS&&!treasure.active){treasure.parts-=TREASURE_PARTS;treasure.active=pickTreasureSpot(currentMap);rewardNotice(`Hazine haritası tamamlandı · ${treasure.active.map} · ${treasure.active.label}`);toast(`Hazine ${MAPS[treasure.active.map].name} denizinde, ${treasure.active.label} koordinatında!`);}
  else toast(`Hazine haritası parçası bulundu (${Math.min(treasure.parts,TREASURE_PARTS)}/${TREASURE_PARTS})`);
  saveTreasure(treasure);
}
// Oyuncunun açabildiği denizlerden birinde, adalardan ve filo adasından uzak bir nokta
// Hazine, son parçanın bulunduğu denizde çıkar
function pickTreasureSpot(key:MapKey){
  const m=MAPS[key];
  for(let i=0;i<80;i++){const x=300+Math.random()*(WORLD_WIDTH-600),y=300+Math.random()*(WORLD_HEIGHT-600);
    if(m.islands.some(is=>Math.hypot(x-is.x,y-is.y)<is.r+90))continue;if(Math.hypot(x-m.fleet.x,y-m.fleet.y)<FLEET.islandR+160)continue;
    return{map:key,x,y,label:coordLabel({x,y})};}
  return{map:key,x:WORLD_WIDTH/2,y:WORLD_HEIGHT-400,label:coordLabel({x:WORLD_WIDTH/2,y:WORLD_HEIGHT-400})};
}
const canDig=()=>!!treasure.active&&treasure.active.map===currentMap&&dist(player,treasure.active)<DIG_RADIUS;
function startDig(){if(!canDig()||dig)return;dig={t:0,x:player.x,y:player.y};destination=null;routeTarget=null;player.speed=0;toast('Kazı başladı — gemiyi hareket ettirme');}
function updateTreasure(dt:number){
  const btn=ui('digPrompt');btn.classList.toggle('visible',canDig()||!!dig);
  if(!dig)return;if(Math.hypot(player.x-dig.x,player.y-dig.y)>25||!canDig()){dig=null;toast('Kazı yarıda kaldı');return;}
  dig.t+=dt;(ui('digBar') as HTMLElement).style.width=`${Math.min(100,dig.t/DIG_SECONDS*100)}%`;
  if(Math.random()<dt*10)particles.push({x:treasure.active!.x+(Math.random()-.5)*30,y:treasure.active!.y+(Math.random()-.5)*20,vx:(Math.random()-.5)*60,vy:-40-Math.random()*40,life:.6,maxLife:.6,kind:'foam'});
  if(dig.t<DIG_SECONDS)return;
  if(session.account){dig=null;sendDig();toast('Hazine açılıyor…');return;}
  const spot=treasure.active!,m=MAPS[spot.map],r=treasureReward(m.tier,NPCS[m.npcs[0]].gold);dig=null;giveTreasure(spot,r);}
function giveTreasure(spot:{x:number;y:number},r:ReturnType<typeof treasureReward>){
  treasure.active=null;treasure.found++;saveTreasure(treasure);bumpAch('treasure');
  state.gold+=r.gold;serverPearls(r.pearls);if(r.ammo==='chain')state.chainAmmo+=r.ammoQty;else arsenal[r.ammo]+=r.ammoQty;arsenal.powder+=r.powder;arsenal.shield+=r.shield;saveArsenal(arsenal);renderQuickSlots();saveAccount();playCoins();playLevelUp();
  for(let n=0;n<3;n++)burst(spot.x+(Math.random()-.5)*30,spot.y+(Math.random()-.5)*20,false);
  rewardNotice(`Hazine bulundu · +${fmt(r.gold)} altın · +${fmt(r.pearls)} inci · +${fmt(r.ammoQty)} ${QUICK_ITEMS[r.ammo].name} · +${fmt(r.powder)} kara barut · +${fmt(r.shield)} kalkan`,'gain',{gold:r.gold});
}
// Oyun sunucusunun cüzdana yazdığı inci: yerelde gösterilir ama eşitlemede kazanç olarak bildirilmez (çift sayılmasın)
function serverPearls(n:number){if(!n)return;state.pearls+=n;if(session.account)session.pearlServerAdd?.(n);}
// Sunucunun belirlediği sandık/pırıltı içeriği
function applyLoot(r:NetLoot,title:string){serverPearls(r.pearls??0);arsenal.powder+=r.powder??0;arsenal.shield+=r.shield??0;arsenal.speed+=r.speed??0;arsenal.mine+=r.mine??0;
  if(r.ammo&&r.ammoQty&&r.ammo in arsenal)(arsenal as unknown as Record<string,number>)[r.ammo]+=r.ammoQty;saveArsenal(arsenal);saveAccount();renderQuickSlots();
  const parts=[r.pearls&&`+${fmt(r.pearls)} inci`,r.powder&&`+${fmt(r.powder)} kara barut`,r.shield&&`+${fmt(r.shield)} kalkan`,r.ammo&&r.ammoQty&&`+${fmt(r.ammoQty)} ${QUICK_ITEMS[r.ammo as QuickItemId]?.name??r.ammo}`,r.speed&&`+${fmt(r.speed)} hız iksiri`,r.mine&&`+${fmt(r.mine)} mayın`].filter(Boolean);
  if(parts.length)rewardNotice(`${title} · ${parts.join(' · ')}`,'gain');}
// Sunucudan hazine durumu ve kazı sonucu
function onTreasureState(t:NetTreasure){const was=treasure.parts,had=!!treasure.active;treasure.parts=t.parts;treasure.active=t.spot?{...t.spot,map:t.spot.map as MapKey}:null;saveTreasure(treasure);
  if(!t.part)return;if(treasure.active&&!had){rewardNotice(`Hazine haritası tamamlandı · ${treasure.active.map} · ${treasure.active.label}`);toast(`Hazine ${treasure.active.map} denizinde · ${treasure.active.label}`);}
  else if(t.parts!==was)toast(`Hazine haritası parçası bulundu (${Math.min(t.parts,TREASURE_PARTS)}/${TREASURE_PARTS})`);}
function onDig(d:NetDig){if(!d.ok||!d.reward){toast(d.err==='yer'?'Hazine burada değil':'Hazine açılamadı');return;}const spot=treasure.active??player;giveTreasure(spot,d.reward as ReturnType<typeof treasureReward>);}
function drawTreasureMark(){
  const a=treasure.active;if(!a||a.map!==currentMap||dist(player,a)>380)return;const s=worldToScreen(a),t=performance.now()/1000;
  ctx.save();ctx.strokeStyle=`rgba(241,198,98,${.35+Math.sin(t*3)*.2})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y,DIG_RADIUS*camera.zoom,DIG_RADIUS*camera.zoom*.6,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#c0291a';ctx.lineWidth=6;ctx.lineCap='round';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(s.x-12,s.y-12);ctx.lineTo(s.x+12,s.y+12);ctx.moveTo(s.x+12,s.y-12);ctx.lineTo(s.x-12,s.y+12);ctx.stroke();ctx.restore();
}
function updateLootChests(dt:number){
  for(let i=lootChests.length-1;i>=0;i--){const c=lootChests[i];c.life-=dt;
    if(dist(c,player)<CHEST_PICKUP_RADIUS){lootChests.splice(i,1);playCoins();recordQuestProgress('chest',currentMap);if(session.account){sendChest(bonus.gilded,c.sid??0);bumpAch('chest');burst(c.x,c.y);continue;}rollTreasurePart();bumpAch('chest');state.pearls+=c.pearls;arsenal.powder+=c.powder;arsenal.shield+=c.shield;arsenal[c.ammo]+=c.ammoQty;arsenal.speed+=c.speed;arsenal.mine+=c.mine;saveArsenal(arsenal);saveAccount();renderQuickSlots();burst(c.x,c.y);rewardNotice(`${c.kind==='gilded'?'Yaldızlı sandık':'Ganimet sandığı'} toplandı · ${chestRewardText(c)}`,'gain');if(destination&&Math.hypot(destination.x-c.x,destination.y-c.y)<2)destination=null;continue;}
    if(c.life<=0)lootChests.splice(i,1);}
  driftClock-=dt;
  if(driftClock<=0&&!session.account){driftClock=DRIFT_RESPAWN_SECONDS;if(lootChests.filter(c=>c.source==='drift').length<4){const p=randomSeaPoint(260);lootChests.push(createChest('drift',p.x,p.y,bonus.gilded,mapDef().tier));}}
}
// Hesaplı oyunda sandık ve pırıltı yerlerini sunucu verir; alımda kimliği gönderilir

function onLootSpots(d:NetLootSpots){if(!session.account)return;const tier=mapDef().tier;
  const keepC=new Map(lootChests.filter(c=>c.sid).map(c=>[c.sid!,c]));for(let i=lootChests.length-1;i>=0;i--)if(lootChests[i].sid||lootChests[i].source==='drift')lootChests.splice(i,1);
  for(const [id,x,y] of d.ch){const c=keepC.get(id)??createChest('drift',x,y,bonus.gilded,tier);c.sid=id;c.life=c.maxLife=1e9;lootChests.push(c);}
  const keepS=new Map(sparkles.filter(g=>g.sid).map(g=>[g.sid!,g]));sparkles.length=0;
  for(const [id,x,y] of d.sp)sparkles.push(keepS.get(id)??{sid:id,x,y,seed:Math.random(),born:performance.now()});}
// Deniz pırıltıları (Seafight tarzı): denizde parlayan inciler; üzerinden geçince küçük ödül verir, yenisi rastgele yerde çıkar.
function spawnSparkle(){const p=randomSeaPoint(200);sparkles.push({x:p.x,y:p.y,seed:Math.random(),born:performance.now()});}
function updateSparkles(dt:number){
  for(let i=sparkles.length-1;i>=0;i--){const g=sparkles[i];if(dist(g,player)>SPARKLE_PICKUP)continue;
    // Pırıltı toplama sınırsız
    sparkles.splice(i,1);playCoins();
    // Pırıltı ödülü şansa bağlı, tek ödül (altın ve TP vermez):
    // %50 inci (1–2) · %15 kara barut · %15 kalkan · %15 özel gülle · %4 hız iksiri · %1 büyük ödül (5 inci + mayın)
    if(session.account){sendSparkle(g.sid??0);recordQuestProgress('sparkle',currentMap);for(let n=0;n<8;n++){const a=Math.random()*Math.PI*2,sp=30+Math.random()*50;particles.push({x:g.x,y:g.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.5,maxLife:.5,kind:'foam'});}if(routeTarget&&dist(routeTarget,g)<4){routeTarget=null;destination=null;}continue;}
    const tier=mapDef().tier,roll=Math.random(),kinds=['fire','explosive','breaker','leech'] as const,r=(a:number,b:number)=>a+Math.floor(Math.random()*(b-a+1));let label='';
    if(roll<.5){const n=r(1,2);state.pearls+=n;label=`+${n} İnci`;}
    else if(roll<.65){const n=r(2,5);arsenal.powder+=n;label=`+${n} Kara Barut`;}
    else if(roll<.8){const n=r(2,5);arsenal.shield+=n;label=`+${n} Kalkan`;}
    else if(roll<.95){const k=kinds[Math.floor(Math.random()*kinds.length)],n=30+15*tier;arsenal[k]+=n;label=`+${n} ${SPECIAL_AMMO[k].name}`;}
    else if(roll<.99){arsenal.speed+=1;label='+1 Hız İksiri';}
    else{state.pearls+=5;arsenal.mine+=1;label='BÜYÜK ÖDÜL · +5 İnci +1 Mayın';}
    saveArsenal(arsenal);renderQuickSlots();recordQuestProgress('sparkle',currentMap);saveAccount();playCoins();
    for(let n=0;n<8;n++){const a=Math.random()*Math.PI*2,sp=30+Math.random()*50;particles.push({x:g.x,y:g.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.5,maxLife:.5,kind:'foam'});}
    particles.push({x:g.x,y:g.y-10,vx:0,vy:-26,life:1.1,maxLife:1.1,kind:'damage',text:label});
    if(routeTarget&&dist(routeTarget,g)<4){routeTarget=null;destination=null;}
    sparkleQueue.push(SPARKLE_RESPAWN/sparkleMult());}
  for(let i=sparkleQueue.length-1;i>=0;i--){sparkleQueue[i]-=dt;if(sparkleQueue[i]<=0){sparkleQueue.splice(i,1);spawnSparkle();}}
}
function drawSparkle(g:{x:number;y:number;seed:number;born:number}){const s=worldToScreen(g),now=performance.now();drawSeaSparkle(ctx,s.x,s.y,now,g.seed,Math.min(1,(now-g.born)/600));}
function drawLootChest(c:LootChest){const s=worldToScreen(c),fading=c.life<6?(Math.floor(c.life*4)%2?.35:.85):1;drawChestSprite(ctx,c.kind,s.x,s.y,performance.now(),fading);}
// Harita kenarı: komşu deniz varsa parıldayan geçiş şeridi, yoksa sis duvarı
function drawMapEdges(){
  const t=performance.now()/1000;
  // Harita sınırının dışı deniz değil: simsiyah boşluk ve ince kenar çizgisi, oyuncu haritanın bittiğini görsün
  {const a=worldToScreen({x:0,y:0}),b=worldToScreen({x:WORLD_WIDTH,y:WORLD_HEIGHT}),w=innerWidth,h=innerHeight,vw=w/camera.zoom,vh=h/camera.zoom,L=w/2-vw/2-2,T=h/2-vh/2-2,R=w/2+vw/2+2,B=h/2+vh/2+2;
    ctx.fillStyle='#000';if(a.x>L)ctx.fillRect(L,T,a.x-L,B-T);if(b.x<R)ctx.fillRect(b.x,T,R-b.x,B-T);if(a.y>T)ctx.fillRect(L,T,R-L,a.y-T);if(b.y<B)ctx.fillRect(L,b.y,R-L,B-b.y);
    ctx.strokeStyle='rgba(232,200,130,.35)';ctx.lineWidth=2;ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
  for(const dir of ['north','south','east','west'] as Dir[]){const to=neighbor(currentMap,dir),open=!!to&&mapLvl()>=MAPS[to].tier;
    const a=worldToScreen({x:0,y:0}),b=worldToScreen({x:WORLD_WIDTH,y:WORLD_HEIGHT});const band=EDGE;
    const x0=dir==='east'?b.x-band:a.x,y0=dir==='south'?b.y-band:a.y,wd=dir==='east'||dir==='west'?band:b.x-a.x,ht=dir==='north'||dir==='south'?band:b.y-a.y;
    const g=dir==='north'?ctx.createLinearGradient(0,y0,0,y0+band):dir==='south'?ctx.createLinearGradient(0,y0+band,0,y0):dir==='west'?ctx.createLinearGradient(x0,0,x0+band,0):ctx.createLinearGradient(x0+band,0,x0,0);
    const c=!to?'8,18,22':open?'111,214,196':'224,122,95',al=!to?.55:.22+Math.sin(t*2)*.06;g.addColorStop(0,`rgba(${c},${al})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.fillRect(x0,y0,wd,ht);}
}
// Sinematik mod (yalnızca geliştirme): tanıtım videosu çekimi için cetveller gizlenir, kamera istenen noktayı izler
const cinematic:{on:boolean;focus:Vec|null}={on:false,focus:null};
function worldToScreen(v:Vec){return{x:v.x-camera.x+innerWidth/2,y:v.y-camera.y+innerHeight/2};}
// Gemi görselleri (16 yönlü şeritler) bir kez yüklenip saklanır
const eliteIsoImages=new Map<string,HTMLImageElement>();
function eliteIsoImage(src:string){let im=eliteIsoImages.get(src);if(!im){im=new Image();im.decoding='async';im.src=`${src}?r=${SHIP_ART_REV}`;eliteIsoImages.set(src,im);}return im;}
const shipAlpha=()=>1;
function drawEliteDirectionalShip(s:Vec){
  const f=playerShipFrame();if(!f)return false;
  {const [im,sx,sy,sw,sh,dx,dy,dw,dh]=f;if(!im.complete||!im.naturalWidth)return false;
    ctx.save();ctx.translate(s.x,s.y);ctx.globalAlpha=(state.invulnerable&&Math.floor(performance.now()/120)%2?.55:1)*shipAlpha();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Gölge bulanıklığı yok (keskin kenar); gemi altındaki su havuzu gölgeyi verir. Kaynak kare 512 px: yakınlaştırmada da net
    ctx.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);ctx.restore();return true;}
  return false;
}
// 16 yönlü görsel yüklenene kadar (ilk saniye) gemi çizilmez; eski 4 yönlü yedek görseller kaldırıldı
function drawPlayerShip(){drawEliteDirectionalShip(worldToScreen(player));}
function drawIsland(i:WorldIsland){const s=worldToScreen(i);if(drawIslandSprite(ctx,i,s.x,s.y))return;const g=ctx.createRadialGradient(s.x-20,s.y-30,10,s.x,s.y,i.r);g.addColorStop(0,'#617c4e');g.addColorStop(.5,'#3c593e');g.addColorStop(.66,'#b9a16b');g.addColorStop(.72,'#17434a');g.addColorStop(1,'#0b2b35');ctx.fillStyle=g;ctx.beginPath();for(let n=0;n<18;n++){const a=n/18*Math.PI*2,r=i.r*(.78+Math.sin(n*4.7)*.09);const x=s.x+Math.cos(a)*r,y=s.y+Math.sin(a)*r;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();for(let n=0;n<7;n++){const a=n*2.1,r=i.r*.38;ctx.fillStyle='#213c2d';ctx.beginPath();ctx.arc(s.x+Math.cos(a)*r,s.y+Math.sin(a)*r,7+n%3*2,0,7);ctx.fill();}}
// İç adanın arkasında bir gemi varsa kale ve üst kule kaideleri gemilerin üstüne yeniden çizilir; o kaidelerdeki kuleler de
function drawFleetOccluders(){if(!hasFleetIsland())return;const f=mapDef().fleet,behind=(v:Vec)=>Math.abs(v.x-f.x)<380&&v.y-f.y<-88&&v.y-f.y>-250;
  if(!behind(player)&&!enemies.some(e=>!e.tower&&behind(e)))return;const s=worldToScreen(f);drawFleetOccluder(ctx,theme().fleet,s.x,s.y);
  for(const e of enemies)if(e.tower&&(e.towerIndex===12||e.towerIndex===13)){const p=worldToScreen(e);drawBastion(ctx,e.towerIndex,p.x,p.y);}
  if(fleetOwner()==='player')for(const tw of ownTowers)if(tw.slot===12||tw.slot===13){const p=worldToScreen(tw);drawBuiltTower(ctx,TOWER_TYPES[tw.type].frame,tw.slot,p.x,p.y);}}
function drawFleetIsland(){
  if(!hasFleetIsland())return;const f=mapDef().fleet,s=worldToScreen(f),th=theme().fleet,owned=fleetOwner()==='player';
  const baseOk=drawFleetBase(ctx,th,s.x,s.y);
  if(owned)for(const tw of [...ownTowers].sort((a,b)=>a.y-b.y)){const p=worldToScreen(tw);drawBuiltTower(ctx,TOWER_TYPES[tw.type].frame,tw.slot,p.x,p.y);
    // Kendi filonun kulesi: lonca etiketiyle (ör. "T-C Kulesi") görselin altında
    if(guild){ctx.fillStyle='#bfe8c9';ctx.font='700 13px Inter';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=3;ctx.fillText(`${guild.tag} Kulesi`,p.x,p.y+TOWER_LABEL_BOTTOM+22);ctx.shadowBlur=0;}}
  if(!baseOk){ctx.fillStyle='#4a7a3c';ctx.beginPath();ctx.ellipse(s.x,s.y,FLEET_ART.w/2,FLEET_ART.h/2,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#3a3c42';ctx.lineWidth=18;ctx.beginPath();ctx.arc(s.x,s.y,FLEET.wallR,Math.PI/2+FLEET.gap/2,Math.PI/2-FLEET.gap/2+Math.PI*2);ctx.stroke();}
  ctx.textAlign='center';ctx.font='700 14px Cinzel';ctx.fillStyle=owned?'#f1d08a':'#f0b8a8';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(f.name,s.x,s.y-FLEET_ART.h/2-24);ctx.font='700 9px Inter';ctx.fillText(owned?'FİLO ADAN · LAGÜNDE ONARIM':fleetEnterable()?'RAKİP FİLO · TEST: GİRİŞ AÇIK (DOĞU VE BATI KAPILARI)':'RAKİP FİLO · GİRİŞ YASAK',s.x,s.y-FLEET_ART.h/2-10);ctx.shadowBlur=0;
}
// ---- atış ve savaş efektleri (src/vfx.ts atlası)
const UNDER=new Set<ParticleKind>(['foam','bubble','plank','target']);
function targetExistsOrPlayer(t:Target|typeof player){return t===player||targetExists(t as Target);}
function shotHeight(s:Shot){if(!s.flight)return 0;const p=Math.min(1,(s.age??0)/s.flight);return (s.arc??0)*4*p*(1-p);}
function drawShotShadow(s:Shot){const p=worldToScreen(s),h=shotHeight(s),k=1-Math.min(.5,h/160);drawVfx(ctx,'shadow',p.x,p.y+2,16*k,{alpha:.6*k});}
// Gülleler: kullanıcının mühimmat ikonlarıyla aynı tarzdaki uçuş görselleri (shotArt.ts); iz görselin içindedir.
// Şifa güllesi: uçarken küçük yeşil parıltılı gülle görseli
const healBallImg=new Image();healBallImg.src=SPECIAL_AMMO.heal.icon;
function drawHealBall(x:number,y:number,rot:number){ctx.save();ctx.translate(x,y);const g=ctx.createRadialGradient(0,0,2,0,0,20);g.addColorStop(0,'#8dffb488');g.addColorStop(1,'#8dffb400');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();
  if(healBallImg.complete&&healBallImg.naturalWidth){ctx.rotate(rot);ctx.drawImage(healBallImg,-15,-15,30,30);}ctx.restore();}
// Başka bir oyuncunun attığı şifa güllesi: yalnız görüntü olarak uçar, hedefe varınca (hedef bizsek) canı doldurur
const healFlights:{x:number;y:number;to:string;amount:number;life:number;age:number}[]=[];
function updateHealFlights(dt:number){for(let i=healFlights.length-1;i>=0;i--){const h=healFlights[i],t=h.to===myNetId?player:remoteOf(h.to);h.age+=dt;h.life-=dt;
  if(!t||h.life<=0){healFlights.splice(i,1);continue;}const d=Math.hypot(t.x-h.x,t.y-h.y),step=510*dt;
  if(d<=step+20){healFlights.splice(i,1);if(h.to===myNetId){const amt=Math.max(0,Math.min(h.amount,effectiveMaxHp()-state.hp));state.hp+=amt;healText(player.x,player.y,amt);playHeal();updateUI();}else healText(t.x,t.y,h.amount);continue;}
  h.x+=(t.x-h.x)/d*step;h.y+=(t.y-h.y)/d*step;}}
function drawShotBall(s:Shot){const p=worldToScreen(s),y=p.y-shotHeight(s),spin=(s.age??0)*16,a=Math.atan2(s.vy,s.vx);
  if(s.visual==='spit'){drawVfx(ctx,'spit',p.x,y,34,{rot:spin*.2});return;}
  if(s.ammo==='heal'){drawHealBall(p.x,y,spin*.15);return;}
  const look=s.owner==='enemy'&&!s.captain?(s.ammo==='fire'?'fire':'iron'):s.ammo==='chain'||s.ammo==='fire'||s.ammo==='explosive'||s.ammo==='breaker'||s.ammo==='leech'?s.ammo:'iron';
  drawShotSprite(ctx,look,p.x,y,a);}
function drawParticle(p:Particle){if(!onScreen(p,260))return;const s=worldToScreen(p),a=Math.max(0,Math.min(1,p.life/p.maxLife)),y=s.y-(p.z??0),size=p.size;
  switch(p.kind){
    case 'damage':ctx.globalAlpha=a;ctx.font='800 15px Inter';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000c';ctx.strokeText(p.text||'',s.x,y);ctx.fillStyle=p.color||DMG_GOLD;ctx.fillText(p.text||'',s.x,y);ctx.globalAlpha=1;return;
    case 'flash':drawShotSprite(ctx,'muzzle',s.x,y,p.rot??0,(size??40)/40*(.8+.35*(1-a)),Math.min(1,a*1.6));return;
    case 'smoke':drawVfx(ctx,'smoke',s.x,y,(size??22)*(1+(1-a)*1.1),{alpha:a*.75,variant:p.variant??0,rot:p.rot});return;
    case 'spark':drawVfx(ctx,'ember',s.x,y,size??12,{alpha:a});return;
    case 'flare':drawFlare(ctx,s.x,y,(size??80)*(.55+.45*(1-a)),Math.min(1,a*1.5));return;
    case 'ember':drawFlare(ctx,s.x,y,(size??7)*(1.2+.8*a),Math.min(1,a*1.4));return;
    case 'glint':drawGlint(ctx,s.x,y,(size??10)*(.5+.5*Math.sin(Math.min(1,a)*Math.PI)),p.color??'#5ff3ff',a,p.rot??0);return;
    case 'wisp':drawPuff(ctx,s.x,y,(size??6)*(.6+(1-a)*1.2),a*.45);return;
    case 'foam':drawVfx(ctx,'foam',s.x,y,(size??18)*(1+(1-a)*.8),{alpha:a*.85,variant:p.variant??0});return;
    case 'target':drawVfx(ctx,'target',s.x,y,(size??100)*(1.15-.15*(1-a)),{alpha:.55+.35*Math.sin(performance.now()/90)});return;
    case 'shock':drawVfx(ctx,'shock',s.x,y,(size??200)*(.4+.6*(1-a)),{alpha:a});return;
    case 'soul':drawVfx(ctx,'soul',s.x,y,size??24,{alpha:Math.min(1,a*1.8)});return;
    case 'splinter':drawVfx(ctx,'splinter',s.x,y,size??24,{rot:p.rot,alpha:Math.min(1,a*2),variant:p.variant??0});return;
    default:drawVfx(ctx,p.kind as 'bubble'|'plank'|'firePuff'|'poison',s.x,y,(size??18)*(p.kind==='firePuff'?.6+a*.6:1),{rot:p.rot,alpha:Math.min(1,a*1.6)});}}
// ---------------------------------------------------------------- Test kaptanları
// Yalnızca test modunda 1/1'de: elit gemili üç yapay kaptan birbirleriyle ve oyuncuyla serbest savaşır. Farklı gülleler
// seçer; batınca 5 sn sonra yeniden denize çıkar.
// (sabitler fonksiyon içinde: harita kurulumu bu bölümden önce de çalışabilir)
function spawnTestCaptains(){if(!ELITE_TEST_MODE||currentMap!=='1/1')return;
  const TEST_CAPTAINS:[string,EliteShipId][]=[['ADM_AHMET','magma'],['ADM_YASİN','tempest'],['ADM_DOGAN','glacial']];
  TEST_CAPTAINS.forEach(([name,elite],i)=>{const a=i/3*Math.PI*2,x=WORLD_WIDTH/2+Math.cos(a)*700,y=WORLD_HEIGHT/2+Math.sin(a)*380;
    enemies.push({kind:'ship',role:'heavy',x,y,angle:0,hp:TEST_CAPTAIN_HP,maxHp:TEST_CAPTAIN_HP,cooldown:1+i*.6,speed:150,damage:TEST_CAPTAIN_DMG,reload:2.3,rewardGold:0,rewardFame:0,color:'#79372f',name,tier:8,aggro:true,wander:0,slowTimer:0,homeX:x,homeY:y,combatTimer:999,hitRadius:44,
      captain:{elite,ammo:'iron',ammoClock:2+i*2,foe:null,orbit:null,orbitClock:0},face:{east:Math.cos(a)<0,north:Math.sin(a)>0}});});}
const captainFoeOf=(e:Enemy)=>e.captain!.foe&&enemies.includes(e.captain!.foe)?e.captain!.foe:null;
function updateCaptain(e:Enemy,dt:number){const c=e.captain!;e.slowTimer=Math.max(0,e.slowTimer-dt);
  if((e.frozen??0)>0){e.frozen=Math.max(0,e.frozen!-dt);return;}
  // hedef: en yakın rakip (diğer kaptanlar ve oyuncu); oyuncu hedefse foe boş kalır
  // oyuncu 1,6 kat uzak sayılır: kaptanlar önce birbirleriyle çatışır
  let best:Enemy|null=null,bd=dist(e,player)*1.6;for(const o of enemies)if(o!==e&&o.captain){const d=dist(e,o);if(d<bd){bd=d;best=o;}}
  if(c.foe!==best&&Math.random()<dt*.6)c.foe=best;const foe:Vec=captainFoeOf(e)??player,d=dist(e,foe);
  // hareket: uzaksa yaklaş, menzildeyse rakibin çevresinde dolaş (Seafight merdiven adımları)
  c.orbitClock-=dt;if(!c.orbit||c.orbitClock<=0||dist(e,c.orbit)<30){const r=d>560?Math.max(0,d-360):360+Math.random()*60,a=Math.atan2(e.y-foe.y,e.x-foe.x)+(Math.random()<.5?-1:1)*(.6+Math.random()*.6);
    c.orbit={x:clamp(foe.x+Math.cos(a)*r,80,WORLD_WIDTH-80),y:clamp(foe.y+Math.sin(a)*r,80,WORLD_HEIGHT-80)};c.orbitClock=2.5+Math.random()*2;e.iso=null;
    // savaş alanından (doğduğu yer) 650 birimden fazla uzaklaşmaz
    const hx=c.orbit.x-e.homeX,hy=c.orbit.y-e.homeY,hl=Math.hypot(hx,hy);if(hl>650){c.orbit.x=e.homeX+hx/hl*650;c.orbit.y=e.homeY+hy/hl*650;}}
  e.face??={east:true,north:false};const st=straightStep(e.x,e.y,c.orbit.x,c.orbit.y,e.speed*(e.slowTimer>0?.55:1)*1.4,dt);if(st.dir>=0)e.dir16=st.dir;
  if(st.done)c.orbitClock=0;else{e.x=clamp(e.x+st.mx,40,WORLD_WIDTH-40);e.y=clamp(e.y+st.my,40,WORLD_HEIGHT-40);}
  // üst üste binmesin: diğer kaptanlardan ve oyuncudan en az 170 birim uzak durur
  for(const o of [player,...enemies.filter(x=>x.captain&&x!==e)] as Vec[]){const dx=e.x-o.x,dy=e.y-o.y,dd=Math.hypot(dx,dy)||1;if(dd<170){const k=(170-dd)*Math.min(1,dt*3);e.x+=dx/dd*k;e.y+=dy/dd*k*.6;}}
  // gülle değiştirme
  c.ammoClock-=dt;if(c.ammoClock<=0){c.ammoClock=5+Math.random()*4;const all:AmmoKind[]=['iron','chain','fire','explosive','breaker','leech'];c.ammo=all[Math.floor(Math.random()*all.length)];}
  e.cooldown-=dt;if(d<470&&e.cooldown<=0)captainFire(e,foe);}
function captainFire(e:Enemy,foe:Vec){const c=e.captain!,a=Math.atan2(foe.y-e.y,foe.x-e.x),fe=captainFoeOf(e);
  playEnemyCannon(dist(e,player),(e.x-player.x)/600);muzzleFlash(e.x+Math.cos(a)*30,e.y+Math.sin(a)*30-10,a,44);
  for(let k=0;k<3;k++){const off=(k-1)*.06;later(k*.08,()=>{if(!enemies.includes(e))return;
    shots.push({x:e.x,y:e.y,vx:Math.cos(a+off)*300,vy:Math.sin(a+off)*300,life:2.4,owner:'enemy',damage:e.damage*(.85+Math.random()*.3)*(c.ammo==='iron'?1:1.4),hit:false,ammo:c.ammo,captain:e,foe:fe??undefined});});}
  e.cooldown=e.reload*(.9+Math.random()*.3);}
// kaptan güllesi başka bir kaptana isabet etti
function captainHit(t:Enemy,s:Shot,from:Enemy|null){const dmg=Math.round(s.damage);t.hp-=dmg;t.lastHitBy='captain';if(from)siegeHit(t,dmg,from.name);damageText(t.x,t.y,dmg,DMG_RED);burst(t.x,t.y);
  if(s.ammo==='chain')t.slowTimer=CHAIN_SLOW.seconds;
  if(s.ammo==='leech'&&from){const h=leechHeal(dmg,true,from.maxHp);if(h>0){from.hp=Math.min(from.maxHp,from.hp+h);spawnSoul(t,from);}}
  if(from&&t.captain&&!t.captain.foe)t.captain.foe=from;if(t.hp<=0)sinkEnemy(t);}
// Kaptan gemisi karesi: 16 yönlü görsel (çevrim içi oyuncu kendi yönünü gönderir; yoksa hızdan ya da son çaprazdan) ya da 4 çapraz
function captainFrame(e:Enemy):[HTMLImageElement,number,number,number,number]|null{const c=e.captain!,d16=e.remoteShip==='ls'?LS_SHIP:e.remoteShip==='dom-r'?DOM_TEAMS.r.ship:e.remoteShip==='dom-b'?DOM_TEAMS.b.ship:e.remoteShip==='admin'?ADMIN_DIR16:e.remoteShip==='starter'?STARTER_DIR16:ELITE_DIR16[c.elite];
  if(d16){const im=eliteIsoImage(d16);if(im.complete&&im.naturalWidth){const h=im.naturalHeight,r=e.remote;
    let k=e.dir16;if(k==null&&r&&Math.hypot(r.vx,r.vy)>25)k=(8+Math.round(Math.atan2(r.vy*2,r.vx)/(Math.PI/8))+16)%16;
    if(k==null){const f=e.face??{east:true,north:false};k=f.north?(f.east?6:2):(f.east?10:14);}
    return[im,k*h,h,166,.68];}}
  return null;}
// Ekranda çok kaptan varken (kalabalık harita) gövde dalgası ve rütbe nişanı atlanır; gemi, ad ve rozet kalır
let crowdedSea=false;
function drawCaptain(e:Enemy,s:Vec){const fr=captainFrame(e);if(!fr)return;const [im,sx,h,D,ky]=fr;
  if(!crowdedSea)drawHullWater(e,100);ctx.save();ctx.translate(s.x,s.y);if((e.frozen??0)>0)ctx.filter='saturate(.4) brightness(1.3) hue-rotate(160deg)';ctx.drawImage(im,sx,0,h,h,-D/2,-D*ky,D,D);ctx.restore();
  const top=-122;if(siege&&isAlly(e))drawHealthBar(s.x,s.y+44,80,e.hp/e.maxHp,'#4fd18a');else if(dom&&e.remote?.tm)drawHealthBar(s.x,s.y+44,80,e.hp/e.maxHp,DOM_TEAMS[e.remote.tm as DomTeam]?.color??'#ccc');{const sp=e.remote?.sp??TEST_RANKERS.find(r=>r.nick===e.name)?.sp??0,show=!settings.hideOthersInsignia;drawCaptainName(s.x,s.y+top-11,'',e.name,14,show?battleRank(sp).index:-1,!!e.remote?.adm);if(show&&!crowdedSea)drawInsignia(s.x,s.y+34,Math.round(sp/25),84);}}
// Capture once at death, then fade the same pose without new particles or assets.
function spawnWreck(o:Enemy){
  if(!onScreen(o,320))return;
  const image=document.createElement('canvas');image.width=image.height=384;
  const c=image.getContext('2d');if(!c)return;c.translate(192,230);
  let drawn=false;
  if(o.captain){const fr=captainFrame(o);if(fr){const [im,sx,h,D,ky]=fr;c.drawImage(im,sx,0,h,h,-D/2,-D*ky,D,D);drawn=true;}}
  else if(o.def)drawn=drawNpcShip(c,o.def.sprite,o.def.span,0,0,npcFaceAngle(o),performance.now(),o.dir16);
  if(!drawn)return;if(wrecks.length>=MAX_WRECKS)wrecks.shift();
  wrecks.push({x:o.x,y:o.y,image,t:0});
}
function drawWreck(w:Wreck){
  if(!onScreen(w,320))return;
  const s=worldToScreen(w),k=Math.min(1,w.t/WRECK_TIME),fade=k*k*(3-2*k);
  ctx.save();ctx.globalAlpha=1-fade;ctx.drawImage(w.image,s.x-192,s.y-230+k*12);ctx.restore();
}
// ---------------------------------------------------------------- Gemi–su etkileşimi
// Her geminin altında yalnızca önceden çizilmiş yumuşak su gölgesi (performans için dümen suyu izi ve köpük yok).
// Seafight gibi 2:1 izometrik kamera: deniz düzlemi yarıya basık (şamandıra halkaları ve dikey/yatay hız oranından ölçüldü)
const FLAT=.5;
const hullLength=(o:object)=>o===player?100:(o as Enemy).boss?165:(o as Enemy).def?(o as Enemy).def!.span*.6:60;
// Ekran dışı çizim atlanır: görüş alanı + pay (dünya birimi)
// NPC görünüşü: oyuncu gemisi gibi 4 çapraz; yön sayfasındaki KD/GD/GB/KB kareleri
// 4 çapraz yüzün 8 yönlü sayfadaki karşılığı (4 görünüşlü görseli olmayan gemiler için)
const isoFaceAngle=(f:IsoFace)=>f.north?(f.east?Math.PI/4:-Math.PI/4):(f.east?Math.PI*3/4:-Math.PI*3/4);
const npcFaceAngle=(e:Enemy)=>isoFaceAngle(e.face??{east:Math.sin(e.angle)>=0,north:Math.cos(e.angle)>0});
function onScreen(v:Vec,m:number){const hw=innerWidth/2/camera.zoom+m,hh=innerHeight/2/camera.zoom+m;return Math.abs(v.x-camera.x)<hw&&Math.abs(v.y-camera.y)<hh;}
const HULL_SHADOW=(()=>{const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d')!,r=g.createRadialGradient(64,64,6,64,64,64);
  r.addColorStop(0,'rgba(2,14,20,.34)');r.addColorStop(1,'rgba(2,14,20,0)');g.fillStyle=r;g.scale(1,.5);g.fillRect(0,0,128,128);return c;})();
function drawHullWater(o:{x:number;y:number;angle:number},L:number){
  const s=worldToScreen(o),fx=Math.sin(o.angle),fy=-Math.cos(o.angle)*FLAT,len=(L*.5*Math.hypot(fx,fy)+L*.14)*1.05,wid=L*.19*1.6;
  ctx.save();ctx.translate(s.x,s.y+4);ctx.rotate(Math.atan2(fy,fx));ctx.drawImage(HULL_SHADOW,-len,-wid,len*2,wid*2);ctx.restore();}
// Can çubuğu: çerçeveli, türüne göre renkli ve genişlikte
function drawHealthBar(x:number,y:number,width:number,frac:number,color:string){
  ctx.fillStyle='rgba(3,12,16,.85)';ctx.fillRect(x-width/2-2,y-2,width+4,10);ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(x-width/2,y,width,6);ctx.strokeStyle='rgba(232,200,130,.55)';ctx.lineWidth=1;ctx.strokeRect(x-width/2-2.5,y-2.5,width+5,11);
  const g=ctx.createLinearGradient(0,y,0,y+6);g.addColorStop(0,'#ffffff55');g.addColorStop(.5,'#ffffff00');g.addColorStop(1,'#00000040');ctx.fillStyle=color;ctx.fillRect(x-width/2,y,width*Math.max(0,Math.min(1,frac)),6);ctx.fillStyle=g;ctx.fillRect(x-width/2,y,width*Math.max(0,Math.min(1,frac)),6);}
// Boss: tema renkli nabız halesi, kara amiral sancağı ve geniş adlı can plakası
function drawBossAura(_e:Enemy,s:{x:number;y:number}){const t=performance.now()/1000,tint=theme().tint,g=ctx.createRadialGradient(s.x,s.y,30,s.x,s.y,170);
  g.addColorStop(0,tint+'00');g.addColorStop(.62,tint+Math.round((.09+Math.sin(t*2.6)*.04)*255).toString(16).padStart(2,'0'));g.addColorStop(1,tint+'00');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(s.x,s.y+8,170,170*FLAT,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=tint+'88';ctx.lineWidth=2;ctx.setLineDash([14,10]);ctx.lineDashOffset=t*30;ctx.beginPath();ctx.ellipse(s.x,s.y+8,150,150*FLAT,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
}
function drawBossFlag(s:{x:number;y:number},top:number){const t=performance.now()/1000,x=s.x+6,y=s.y+top-78;
  ctx.save();ctx.strokeStyle='#2a1a0e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+54);ctx.lineTo(x,y-4);ctx.stroke();
  ctx.fillStyle='#0c0c0e';ctx.beginPath();ctx.moveTo(x,y);for(let i=0;i<=10;i++){const u=i/10;ctx.lineTo(x+u*46,y+Math.sin(t*5+u*4)*3*u);}for(let i=10;i>=0;i--){const u=i/10;ctx.lineTo(x+u*46,y+28+Math.sin(t*5+u*4)*3*u);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8dcc0';const cx=x+20,cy=y+12+Math.sin(t*5+1.7)*1.5;ctx.beginPath();ctx.arc(cx,cy,5.5,0,Math.PI*2);ctx.fill();ctx.fillRect(cx-3.5,cy+3,7,4);ctx.fillStyle='#0c0c0e';ctx.beginPath();ctx.arc(cx-2,cy,1.5,0,7);ctx.arc(cx+2,cy,1.5,0,7);ctx.fill();
  ctx.strokeStyle='#e8dcc0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-8,cy+6);ctx.lineTo(cx+8,cy+12);ctx.moveTo(cx+8,cy+6);ctx.lineTo(cx-8,cy+12);ctx.stroke();ctx.restore();}
// Gemi altı: ad ve can çubuğunun konduğu yükseklik (görselin su çizgisinin hemen altı)
const shipBottom=(span:number)=>Math.round(shipDrawSize(span)*.24);
const TOWER_LABEL_BOTTOM=34;
function drawBossPlate(e:Enemy,s:{x:number;y:number},top:number){const W=190,x=s.x,y=s.y+top-10;
  ctx.save();ctx.fillStyle='rgba(8,10,12,.82)';ctx.strokeStyle='#f1c662';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-W/2,y-24,W,34,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f1c662';ctx.font='700 12px Cinzel';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.name,x,y-13);
  drawHealthBar(x,y-3,W-24,e.hp/e.maxHp,'#e0463a');ctx.fillStyle='#fff';ctx.font='700 8px Inter';ctx.fillText(`${Math.ceil(e.hp).toLocaleString('tr-TR')} / ${e.maxHp.toLocaleString('tr-TR')}`,x,y);ctx.restore();}
// Güneş parıltıları: dünya ızgarasına bağlı rastgele noktalarda kısa süreli yanıp sönen ışık kırpıntıları
// Seçim halkaları (geminin altında, deniz üstünde; hafif perspektif için elips).
// Hedef: mavi parlayan halka + 4 çentik + dönen sarı noktalı iç çember. Oyuncu: mor rün çemberi.
const RING_Y=.5;
function drawTargetMarker(t:Target){
  const s=worldToScreen(t),R=t.boss?100:Math.max(40,(t.def?.span??90)*.56),now=performance.now()/1000;
  ctx.save();ctx.translate(s.x,s.y+R*.18);ctx.scale(1,RING_Y);
  const g=ctx.createRadialGradient(0,0,R*.55,0,0,R*1.05);g.addColorStop(0,'rgba(40,90,255,0)');g.addColorStop(.8,'rgba(40,110,255,.28)');g.addColorStop(1,'rgba(40,110,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*1.05,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='#3d8bff';ctx.shadowBlur=14;ctx.strokeStyle='#4f95ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle='#bcd6ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,R-3,0,Math.PI*2);ctx.stroke();
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;ctx.save();ctx.rotate(a);ctx.fillStyle='#2a63d8';ctx.strokeStyle='#bcd6ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(R-7,0);ctx.lineTo(R+6,-6);ctx.lineTo(R+10,0);ctx.lineTo(R+6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.rotate(now*.6);ctx.strokeStyle='#f5d03a';ctx.lineWidth=3.2;ctx.lineCap='round';ctx.setLineDash([.1,9]);ctx.beginPath();ctx.arc(0,0,R*.8,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
// Halka geminin gövdesine ortalanır: o an çizilen kare (seçili gemi ve yönü) bir kez taranır, gövdenin (görselin alt
// kısmındaki opak bölge) ortası bulunur ve önbelleğe alınır. Böylece her gemide ve her yönde halka teknenin tam altında durur.
const hullCenters=new Map<string,Vec>();
function hullCenter(im:HTMLImageElement,sx:number,sy:number,sw:number,sh:number,dx:number,dy:number,dw:number,dh:number):Vec{
  const key=`${im.src}|${sx}|${sy}`;let c=hullCenters.get(key);if(c)return{x:dx+c.x*dw,y:dy+c.y*dh};
  const N=96,cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d',{willReadFrequently:true})!;g.drawImage(im,sx,sy,sw,sh,0,0,N,N);
  let a:Uint8ClampedArray;try{a=g.getImageData(0,0,N,N).data;}catch{return{x:dx+dw/2,y:dy+dh*.62};}
  let top=N,bot=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(a[(y*N+x)*4+3]>110){if(y<top)top=y;if(y>bot)bot=y;}
  if(bot<0){c={x:.5,y:.62};}else{// gövde: opak alanın alt %40'ı (direk ve yelkenler hariç)
    const from=bot-(bot-top)*.4;let sx2=0,sy2=0,n=0;for(let y=Math.floor(from);y<=bot;y++)for(let x=0;x<N;x++)if(a[(y*N+x)*4+3]>110){sx2+=x;sy2+=y;n++;}
    c={x:(sx2/n+.5)/N,y:(sy2/n+.5)/N};}
  hullCenters.set(key,c);return{x:dx+c.x*dw,y:dy+c.y*dh};}
// Şu an çizilen oyuncu gemisi karesi (drawPlayerShip ile aynı kaynak ve hedef dikdörtgeni)
function playerShipFrame():[HTMLImageElement,number,number,number,number,number,number,number,number]|null{
  const d16=dir16Sprite();if(d16){const im=eliteIsoImage(d16);
    if(im.complete&&im.naturalWidth){const c=im.naturalHeight,D=166;return[im,shipDir16*c,0,c,c,-D/2,-D*.68,D,D];}}
  return null;}
function drawPlayerMarker(){
  const s=worldToScreen(player),f=playerShipFrame(),o=f?hullCenter(...f):{x:0,y:10};
  drawMysticPlayerMarker(ctx,s.x+o.x,s.y+o.y,performance.now()/1000);
}

// Gemi ölçeği: gemiler, adları, rozetleri, can çubukları ve halkaları kendi noktaları etrafında birlikte küçültülür
// (kalabalık savaşta 30–40 gemi rahat görünsün diye). Kuleler, adalar ve efektler etkilenmez.
const SHIP_DRAW_SCALE:number=.72;
function atShipScale(o:Vec|null,fn:()=>void){if(!o||SHIP_DRAW_SCALE===1){fn();return;}const s=worldToScreen(o);ctx.save();ctx.translate(s.x,s.y);ctx.scale(SHIP_DRAW_SCALE,SHIP_DRAW_SCALE);ctx.translate(-s.x,-s.y);fn();ctx.restore();}
function draw(){
  const w=innerWidth,h=innerHeight,map=mapDef(),th=theme();if(!seaTilePattern(ctx)){const sea=ctx.createLinearGradient(0,0,0,h);sea.addColorStop(0,th.sea[0]);sea.addColorStop(1,th.sea[1]);ctx.fillStyle=sea;ctx.fillRect(0,0,w,h);}
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-w/2,-h/2);
  // Deniz: referanstan çıkarılmış kesintisiz doku, dünyaya sabitli tek katman
  const pattern=seaTilePattern(ctx);if(pattern){const vw=w/camera.zoom,vh=h/camera.zoom;pattern.setTransform(new DOMMatrix().translateSelf(-camera.x+w/2,-camera.y+h/2).scaleSelf(1.5,1.5));ctx.fillStyle=pattern;ctx.fillRect(w/2-vw/2,h/2-vh/2,vw,vh);}
  ctx.globalAlpha=.12;ctx.fillStyle=th.label;ctx.font='700 42px Cinzel';ctx.textAlign='center';for(const label of map.labels){const p=worldToScreen(label);ctx.fillText(label.text,p.x,p.y);}ctx.globalAlpha=1;
  drawMapEdges();if(dom)drawDomZone();if(ls)drawLsItems();islands.forEach(i=>{if(onScreen(i,i.r+260))drawIsland(i);});drawFleetIsland();lootChests.forEach(c=>{if(seenOnMap(c))drawLootChest(c);});drawTreasureMark();sparkles.forEach(g=>{if(seenOnMap(g))drawSparkle(g);});mines.forEach(m=>{if(!seenOnMap(m))return;const p=worldToScreen(m);drawMineSprite(ctx,p.x,p.y,performance.now(),m.arm>0,m.life<5);});
  particles.forEach(p=>{if(UNDER.has(p.kind))drawParticle(p);});wrecks.forEach(w=>atShipScale(w,()=>drawWreck(w)));shots.forEach(drawShotShadow);
  if(selected&&targetExists(selected)&&seenOnMap(selected))drawTargetMarker(selected);
  // Görüş sisi: gemiden uzaktaki NPC, kaptan, sandık ve pırıltı çizilmez (mini haritadan kamera kaydırılsa da)
  {const vis=enemies.filter(e=>onScreen(e,e.boss?420:300)&&(e.tower||e.boss||seenOnMap(e)));crowdedSea=vis.reduce((n,e)=>n+(e.captain?1:0),0)>30;
  vis.sort((a,b)=>a.y-b.y).forEach(e=>atShipScale(e.tower?null:e,()=>{const s=worldToScreen(e);if(e.captain){drawCaptain(e,s);return;}if(e.boss)drawBossAura(e,s);if(!e.tower)drawHullWater(e,hullLength(e));const raster=e.tower?drawBastion(ctx,e.towerIndex??0,s.x,s.y):e.def?drawNpcShip(ctx,e.def.sprite,e.def.span,s.x,s.y,npcFaceAngle(e),performance.now(),e.dir16):false;if(!raster)return;const top=raster?(e.tower?TOWER_LABEL_OFFSET:shipLabelOffset(e.def!.span)):-42;if(e.boss){drawBossFlag(s,top);drawBossPlate(e,s,shipBottom(e.def!.span)+34);return;}
    // Can çubuğu ve ad görselin altında: önce çubuk, altında ad
    const bottom=e.tower?TOWER_LABEL_BOTTOM:shipBottom(e.def!.span),bw=e.tower||e.role==='heavy'?72:56;drawHealthBar(s.x,s.y+bottom,bw,e.hp/e.maxHp,e.tower?'#f09a4f':e.role==='heavy'?'#f0584a':'#4fd0da');ctx.fillStyle='#e6dccb';ctx.font='700 13px Inter';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=3;ctx.fillText(e.name,s.x,s.y+bottom+22);ctx.shadowBlur=0;}));}
  atShipScale(player,()=>{drawPlayerMarker();drawHullWater(player,hullLength(player));drawPlayerShip();
});
  drawFleetOccluders();atShipScale(player,drawPlayerLabel);
  particles.forEach(p=>{if(!UNDER.has(p.kind)&&p.kind!=='damage')drawParticle(p);});shots.forEach(drawShotBall);for(const h of healFlights){const p=worldToScreen(h);drawHealBall(p.x,p.y-10,h.age*2.4);}
  drawAbilityFx(ctx,worldToScreen,innerWidth,innerHeight);
  drawVisionFog(w,h);if(ls)drawLsFog(w,h);
  particles.forEach(p=>{if(p.kind==='damage')drawParticle(p);});
  ctx.restore();
  if(mapFade>0){ctx.fillStyle=`rgba(2,10,14,${Math.min(1,mapFade)})`;ctx.fillRect(0,0,w,h);}
  drawMinimap();
}
// Ana ekranda görüş sisi: gemi çevresi açık, görüş sınırının dışı koyu (pusula açıkken kalkar)
function drawVisionFog(w:number,h:number){if(compassReveal>0)return;const p=worldToScreen(player),vw=w/camera.zoom,vh=h/camera.zoom;
  const g=ctx.createRadialGradient(p.x,p.y,VISION_RADIUS*.8,p.x,p.y,VISION_RADIUS*1.02);g.addColorStop(0,'rgba(4,10,14,0)');g.addColorStop(1,'rgba(4,10,14,.78)');
  ctx.fillStyle=g;ctx.fillRect(w/2-vw/2,h/2-vh/2,vw,vh);}
let lastCoord='';
function updateCoordBadge(){const text=`${siege?'KALE':dom?'HAKİMİYET':ls?'LANETLİ':currentMap} - ${coordLabel(player)}`;if(text!==lastCoord){lastCoord=text;ui('mapCoord').textContent=text;}}
// Mini harita renkleri: rakip oyuncu kırmızı, dost (aynı lonca ya da kuşatmada müttefik) koyu yeşil, NPC sarı, canavar lila, boss turuncu
const MINI_COLORS={rival:'#e8322b',friend:'#1e8a3e',npc:'#f2d23a',boss:'#ff8a1c'};
function miniColor(e:Enemy){if(e.boss)return MINI_COLORS.boss;if(!e.captain)return MINI_COLORS.npc;
  const friend=isAlly(e)||(!!guild&&!!e.remote?.tag&&e.remote.tag===guild.tag);return friend?MINI_COLORS.friend:MINI_COLORS.rival;}
function drawMinimap(){const W=188,H=133,sx=(x:number)=>x/WORLD_WIDTH*W,sy=(y:number)=>y/WORLD_HEIGHT*H,th=theme();
  mini.setTransform(minimap.width/W,0,0,minimap.height/H,0,0);mini.clearRect(0,0,W,H);void th;
  for(const dir of ['north','south','east','west'] as Dir[]){const to=neighbor(currentMap,dir);if(!to)continue;mini.fillStyle=mapLvl()>=MAPS[to].tier?'#6fd6c4aa':'#e07a5f88';if(dir==='north')mini.fillRect(W/2-14,0,28,2);if(dir==='south')mini.fillRect(W/2-14,H-2,28,2);if(dir==='west')mini.fillRect(0,H/2-12,2,24);if(dir==='east')mini.fillRect(W-2,H/2-12,2,24);}
  mini.save();mini.scale(W/WORLD_WIDTH,H/WORLD_HEIGHT);
  for(const i of islands)drawIslandSprite(mini,i,i.x,i.y);
  if(hasFleetIsland()){const f=mapDef().fleet;drawFleetBase(mini,th.fleet,f.x,f.y);}
  mini.restore();
  if(ls){const f=ls.fog,z=lsZoneAt(f,Date.now()+ls.off);mini.save();mini.fillStyle='#3a1260aa';mini.beginPath();mini.rect(0,0,W,H);mini.ellipse(sx(z.x),sy(z.y),Math.max(0,z.r)/WORLD_WIDTH*W,Math.max(0,z.r)/WORLD_HEIGHT*H,0,0,7);mini.fill('evenodd');mini.restore();
    for(const d of ls.drops){const on=Math.floor(performance.now()/300)%2===0;mini.fillStyle=on?'#ffd56a':'#fff6d0';mini.beginPath();mini.arc(sx(d.x),sy(d.y),3.5,0,7);mini.fill();}
    mini.fillStyle='#d6b4ff';for(const it of ls.items)if(seenOnMap({x:it[2],y:it[3]}))mini.fillRect(sx(it[2])-1,sy(it[3])-1,2,2);
    if(f.phase>0){mini.strokeStyle='#ffffffcc';mini.lineWidth=1;mini.beginPath();mini.ellipse(sx(f.to.x),sy(f.to.y),f.to.r/WORLD_WIDTH*W+.01,f.to.r/WORLD_HEIGHT*H+.01,0,0,7);mini.stroke();}}
  if(dom){const z=DOM_ZONE;mini.strokeStyle=dom.own?DOM_TEAMS[dom.own].color:'#f3d496';mini.lineWidth=1.5;mini.beginPath();mini.ellipse(sx(z.x),sy(z.y),z.r/WORLD_WIDTH*W,z.r/WORLD_HEIGHT*H,0,0,7);mini.stroke();
    for(const t of ['r','b'] as DomTeam[]){mini.fillStyle=DOM_TEAMS[t].color;mini.fillRect(sx(DOM_BASE[t].x)-3,sy(DOM_BASE[t].y)-3,6,6);}}
  // Görüş sisi: gemi çevresi açık, dışı koyu (pusula açıkken kalkar)
  if(compassReveal<=0){const cx=sx(player.x),cy=sy(player.y),rx=VISION_RADIUS/WORLD_WIDTH*W;
    const g=mini.createRadialGradient(cx,cy,rx*.82,cx,cy,rx*1.05);g.addColorStop(0,'#05080a00');g.addColorStop(1,'#0a141a99');
    mini.fillStyle=g;mini.fillRect(0,0,W,H);}
  if(compassPulse>0){const cx=sx(player.x),cy=sy(player.y);mini.strokeStyle=`rgba(255,214,120,${compassPulse})`;mini.lineWidth=1.5;mini.beginPath();mini.arc(cx,cy,(1-compassPulse)*W,0,7);mini.stroke();}
  mini.fillStyle='#f4f8ff';for(const g of sparkles)if(seenOnMap(g))mini.fillRect(sx(g.x)-.5,sy(g.y)-.5,1.5,1.5);
  for(const c of lootChests){if(!seenOnMap(c))continue;mini.fillStyle=c.kind==='gilded'?'#ffd46b':'#d9a95b';mini.fillRect(sx(c.x)-1,sy(c.y)-1,2,2);}
  for(const e of enemies){if(e.tower||(!e.boss&&!seenOnMap(e)))continue;mini.fillStyle=miniColor(e);const r=e.boss?5:e.captain?3.5:3;mini.fillRect(sx(e.x)-r/2,sy(e.y)-r/2,r,r);}
  mini.fillStyle='#f4dd9d';mini.beginPath();mini.arc(sx(player.x),sy(player.y),3,0,7);mini.fill();
  // görüş penceresi: kameranın ekranda gösterdiği alan
  const vw=innerWidth/camera.zoom,vh=innerHeight/camera.zoom;mini.strokeStyle=freeLook?'#ffe09bee':'#ffe09b88';mini.lineWidth=1.2;mini.strokeRect(sx(camera.x-vw/2),sy(camera.y-vh/2),vw/WORLD_WIDTH*W,vh/WORLD_HEIGHT*H);}
// manualClock (yalnızca geliştirme): tanıtım videosu kare kare çekilirken oyun dışarıdan adımlanır
let manualClock=false;
let last=performance.now();function loop(now:number){const raw=(now-last)/1000,dt=Math.min(.033,raw);last=now;if(raw<1)watchFps(raw);if(!manualClock){update(dt);draw();}requestAnimationFrame(loop);}fitCannonsToCapacity();saveAccount();renderQuickSlots();updateUI();requestAnimationFrame(loop);
// Açılış ekranı (index.html #splash): sayfa yüklenince ve en az 2 sn gösterildikten sonra söner
{const splash=document.getElementById('splash');if(splash){const shown=performance.now();let done=false;
  const hide=()=>{if(done)return;done=true;setTimeout(()=>{splash.classList.add('gone');setTimeout(()=>splash.remove(),700);},Math.max(0,2000-(performance.now()-shown)));};
  if(document.readyState==='complete')hide();else window.addEventListener('load',hide);setTimeout(hide,6000);}}
// Yalnızca geliştirme sunucusunda: tarayıcı testleri için durum erişimi.
if(import.meta.env.DEV)(window as any).__ky={net:netHandlers,isoFace,levelUp:showLevelUp,sunk:showSunkBy,setLevel:(l:number,f:number)=>{state.level=l;state.fame=f;levelQuest=loadLevelQuest(l);levelQuestNoticed=false;},lqKill:(k:"npc"|"monster",id:string,t:number)=>levelQuestHit(k,id,t),range:()=>effectiveRange(),spawnBoss:()=>spawnBoss(),elite:(id:EliteShipId)=>{activeEliteShip=id;activeShip=id;},rage:()=>{rage.meter=RAGE_MAX;activateRage();},get rageState(){return rage;},treasure,rollTreasurePart,manual:(on:boolean)=>{manualClock=on;},step:(dt:number)=>{update(dt);draw();},noFade:()=>{mapFade=0;},cinematic,makeShip,NPCS,state,player,camera,enemies,respawn,enterMap,mapDef,fleetOwner,lootChests,sparkles,sinkEnemy,burst,splashAt,enterSiege,leaveSiege,get siege(){return siege;},shots,particles,wrecks,select:(t:Target)=>{selected=t;state.attacking=true;},ammo:(id:AmmoKind)=>{state.ammo=id;renderQuickSlots();},potion:()=>activateAbility('speed'),setElite:(id:EliteShipId)=>{activeEliteShip=id;activeShip=id;fitCannonsToCapacity();},route:(v:Vec)=>{routeTarget=navigablePoint(v);destination=routeVia(routeTarget);},fleetNav,get routeTarget(){return routeTarget;},get selected(){return selected;},get destination(){return destination;}};
