// ==UserScript==
// @name			HW NEW YEAR SCRIPT
// @name:en			HW NEW YEAR SCRIPT
// @name:ru			HW NEW YEAR SCRIPT
// @namespace		HW NEW YEAR SCRIPT
// @version			1.002
// @description		Automation of actions for the game Hero Wars
// @description:en	Automation of actions for the game Hero Wars
// @description:ru	������������� �������� ��� ���� ������� �����
// @author			ZingerY
// @license 		Copyright ZingerY
// @homepage		http://ilovemycomp.narod.ru/HeroWarsHelper.user.js
// @icon			http://ilovemycomp.narod.ru/VaultBoyIco16.ico
// @icon64			http://ilovemycomp.narod.ru/VaultBoyIco64.png
// @encoding		utf-8
// @include			https://apps-1701433570146040.apps.fbsbx.com/*
// @include			https://*.nextersglobal.com/*
// @include			https://*.hero-wars*.com/*
// @match			https://www.solfors.com/
// @match			https://t.me/s/hw_ru
// @run-at			document-start
// @homepage		https://astrash.ru/scr/scr.js
// @downloadURL		https://astrash.ru/updates/scr/scr.js
// @updateURL                           https://astrash.ru/updates/scr/scr.js
// ==/UserScript==

(function() {
	/**
	 * Start script
	 *
	 * �������� ������
	 */
	console.log('Start ' + GM_info.script.name + ', v' + GM_info.script.version);
	/**
	 * Script info
	 *
	 * ���������� � �������
	 */
	const scriptInfo = (({name, version, author, homepage, lastModified}, updateUrl, source) =>
		({name, version, author, homepage, lastModified, updateUrl, source}))
	(GM_info.script, GM_info.scriptUpdateURL, arguments.callee.toString());
	/**
	 * If we are on the gifts page, then we collect and send them to the server
	 *
	 * ���� ��������� �� �������� ��������, �� �������� � ���������� �� �� ������
	 */
	if (['www.solfors.com', 't.me'].includes(location.host)) {
		setTimeout(sendCodes, 2000);
		return;
	}
	/**
	 * Information for completing daily quests
	 *
	 * ���������� ��� ���������� ���������� �������
	 */
	const questsInfo = {};
	/**
	 * Is the game data loaded
	 *
	 * ��������� �� ������ ����
	 */
	let isLoadGame = false;
	/**
	 * Headers of the last request
	 *
	 * ��������� ���������� �������
	 */
	let lastHeaders = {};
	/**
	 * Information about sent gifts
	 *
	 * ���������� �� ������������ ��������
	 */
	let freebieCheckInfo = null;
	/** ����
	 * missionTimer
	 *
	 * missionTimer
	 */
	let missionBattle = null;
	/**
	 * User data
	 *
	 * ������ ������������
	 */
	let userInfo;
	/**
	 * Original methods for working with AJAX
	 *
	 * ������������ ������ ��� ������ � AJAX
	 */
	const original = {
	open: XMLHttpRequest.prototype.open,
	send: XMLHttpRequest.prototype.send,
	setRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
	SendWebSocket: WebSocket.prototype.send,
	fetch: fetch,
};

    // Sentry blocking
// ���������� �����������
this.fetch = function (url, options) {
	/**
	 * Checking URL for blocking
	 * ��������� URL �� ����������
	 */
	if (url.includes('sentry.io')) {
		console.log('%cFetch blocked', 'color: red');
		console.log(url, options);
		const body = {
			id: md5(Date.now()),
		};
		let info = {};
		try {
			info = JSON.parse(options.body);
		} catch (e) {}
		if (info.event_id) {
			body.id = info.event_id;
		}
		/**
		 * Mock response for blocked URL
		 *
		 * ������ ����� ��� ���������������� URL
		 */
		const mockResponse = new Response('Custom blocked response', {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body,
		});
		return Promise.resolve(mockResponse);
	} else {
		/**
		 * Call the original fetch function for all other URLs
		 * �������� ������������ ������� fetch ��� ���� ������ URL
		 */
		return original.fetch.apply(this, arguments);
	}
};
	/**
	 * Decoder for converting byte data to JSON string
	 *
	 * ������� ��� �������������� �������� ������ � JSON ������
	 */
	const decoder = new TextDecoder("utf-8");
	/**
	 * Stores a history of requests
	 *
	 * ������ ������� ��������
	 */
	let requestHistory = {};
	/**
	 * URL for API requests
	 *
	 * URL ��� �������� � API
	 */
	let apiUrl = '';

	/**
	 * Connecting to the game code
	 *
	 * ����������� � ���� ����
	 */
	this.cheats = new hackGame();
	/**
	 * The function of calculating the results of the battle
	 *
	 * ������� ������� ����������� ���
	 */
	this.BattleCalc = cheats.BattleCalc;
	/**
	 * Sending a request available through the console
	 *
	 * �������� ������� ��������� ����� �������
	 */
	this.SendRequest = send;
	/**
	 * Simple combat calculation available through the console
	 *
	 * ������� ������ ��� ��������� ����� �������
	 */
	this.Calc = function (data) {
		const type = getBattleType(data?.type);
		return new Promise((resolve, reject) => {
			try {
				BattleCalc(data, type, resolve);
			} catch (e) {
				reject(e);
			}
		})
	}
	/**
	 * Short asynchronous request
	 * Usage example (returns information about a character):
	 * const userInfo = await Send('{"calls":[{"name":"userGetInfo","args":{},"ident":"body"}]}')
	 *
	 * �������� ����������� ������
	 * ������ ������������� (���������� ���������� � ���������):
	 * const userInfo = await Send('{"calls":[{"name":"userGetInfo","args":{},"ident":"body"}]}')
	 */
	this.Send = function (json, pr) {
		return new Promise((resolve, reject) => {
			try {
				send(json, resolve, pr);
			} catch (e) {
				reject(e);
			}
		})
	}

	const i18nLangData = {
		/* English translation by BaBa */
		en: {
			/* Checkboxes */
			SKIP_FIGHTS: 'Skip battle',
			SKIP_FIGHTS_TITLE: 'Skip battle in Outland and the arena of the titans, auto-pass in the tower and campaign',
			ENDLESS_CARDS: 'Infinite cards',
			ENDLESS_CARDS_TITLE: 'Disable Divination Cards wasting',
			AUTO_EXPEDITION: 'Auto Expedition',
			AUTO_EXPEDITION_TITLE: 'Auto-sending expeditions',
			CANCEL_FIGHT: 'Cancel battle',
			CANCEL_FIGHT_TITLE: 'The possibility of canceling the battle on VG',
			GIFTS: 'Gifts',
			GIFTS_TITLE: 'Collect gifts automatically',
			BATTLE_RECALCULATION: 'Battle recalculation',
			BATTLE_RECALCULATION_TITLE: 'Preliminary calculation of the battle',
			QUANTITY_CONTROL: 'Quantity control',
			QUANTITY_CONTROL_TITLE: 'Ability to specify the number of opened "lootboxes"',
			REPEAT_CAMPAIGN: 'Repeat missions',
			REPEAT_CAMPAIGN_TITLE: 'Auto-repeat battles in the campaign',
			DISABLE_DONAT: 'Disable donation',
			DISABLE_DONAT_TITLE: 'Removes all donation offers',
			DAILY_QUESTS: 'Quests',
			DAILY_QUESTS_TITLE: 'Complete daily quests',
			AUTO_QUIZ: 'AutoQuiz',
			AUTO_QUIZ_TITLE: 'Automatically receive correct answers to quiz questions',
			SECRET_WEALTH_CHECKBOX: 'Automatic purchase in the store "Secret Wealth" when entering the game',
			HIDE_SERVERS: 'Collapse servers',
			HIDE_SERVERS_TITLE: 'Hide unused servers',
			/* Input fields */
			HOW_MUCH_TITANITE: 'How much titanite to farm',
			COMBAT_SPEED: 'Combat Speed Multiplier',
			NUMBER_OF_TEST: 'Number of test fights',
			NUMBER_OF_AUTO_BATTLE: 'Number of auto-battle attempts',
			/* Buttons */
			RUN_SCRIPT: 'Run the',
			TO_DO_EVERYTHING: 'Do All',
			TO_DO_EVERYTHING_TITLE: 'Perform multiple actions of your choice',
			OUTLAND: 'Outland',
			OUTLAND_TITLE: 'Collect Outland',
			TITAN_ARENA: 'ToE',
			TITAN_ARENA_TITLE: 'Complete the titan arena',
			DUNGEON: 'Dungeon',
			DUNGEON_TITLE: 'Go through the dungeon',
			SEER: 'Seer',
			SEER_TITLE: 'Roll the Seer',
			TOWER: 'Tower',
			TOWER_TITLE: 'Pass the tower',
			EXPEDITIONS: 'Expeditions',
			EXPEDITIONS_TITLE: 'Sending and collecting expeditions',
			SYNC: 'Sync',
			SYNC_TITLE: 'Partial synchronization of game data without reloading the page',
			ARCHDEMON: 'Archdemon',
			ARCHDEMON_TITLE: 'Hitting kills and collecting rewards',
			ESTER_EGGS: 'Easter eggs',
			ESTER_EGGS_TITLE: 'Collect all Easter eggs or rewards',
			REWARDS: 'Rewards',
			REWARDS_TITLE: 'Collect all quest rewards',
			MAIL: 'Mail',
			MAIL_TITLE: 'Collect all mail, except letters with energy and charges of the portal',
			MINIONS: 'Minions',
			MINIONS_TITLE: 'Attack minions with saved packs',
			ADVENTURE: 'Adventure',
			ADVENTURE_TITLE: 'Passes the adventure along the specified route',
			STORM: 'Storm',
			STORM_TITLE: 'Passes the Storm along the specified route',
			SANCTUARY: 'Sanctuary',
			SANCTUARY_TITLE: 'Fast travel to Sanctuary',
			GUILD_WAR: 'Guild War',
			GUILD_WAR_TITLE: 'Fast travel to Guild War',
			SECRET_WEALTH: 'Secret Wealth',
			SECRET_WEALTH_TITLE: 'Buy something in the store "Secret Wealth"',
			/* Misc */
			BOTTOM_URLS: '<a href="https://t.me/+0oMwICyV1aQ1MDAy" target="_blank" title="Telegram"><svg style="margin: 2px;" width="20" height="20" viewBox="0 0 1000 1000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient x1="50%" y1="0%" x2="50%" y2="99.2583404%" id="linearGradient-1"><stop stop-color="#2AABEE" offset="0%"></stop><stop stop-color="#229ED9" offset="100%"></stop></linearGradient></defs><g id="Artboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><circle id="Oval" fill="url(#linearGradient-1)" cx="500" cy="500" r="500"></circle><path d="M226.328419,494.722069 C372.088573,431.216685 469.284839,389.350049 517.917216,369.122161 C656.772535,311.36743 685.625481,301.334815 704.431427,301.003532 C708.567621,300.93067 717.815839,301.955743 723.806446,306.816707 C728.864797,310.92121 730.256552,316.46581 730.922551,320.357329 C731.588551,324.248848 732.417879,333.113828 731.758626,340.040666 C724.234007,419.102486 691.675104,610.964674 675.110982,699.515267 C668.10208,736.984342 654.301336,749.547532 640.940618,750.777006 C611.904684,753.448938 589.856115,731.588035 561.733393,713.153237 C517.726886,684.306416 492.866009,666.349181 450.150074,638.200013 C400.78442,605.66878 432.786119,587.789048 460.919462,558.568563 C468.282091,550.921423 596.21508,434.556479 598.691227,424.000355 C599.00091,422.680135 599.288312,417.758981 596.36474,415.160431 C593.441168,412.561881 589.126229,413.450484 586.012448,414.157198 C581.598758,415.158943 511.297793,461.625274 375.109553,553.556189 C355.154858,567.258623 337.080515,573.934908 320.886524,573.585046 C303.033948,573.199351 268.692754,563.490928 243.163606,555.192408 C211.851067,545.013936 186.964484,539.632504 189.131547,522.346309 C190.260287,513.342589 202.659244,504.134509 226.328419,494.722069 Z" id="Path-3" fill="#FFFFFF"></path></g></svg></a>',
			GIFTS_SENT: 'Gifts sent!',
			DO_YOU_WANT: "Do you really want to do this?",
			BTN_RUN: 'Run',
			BTN_CANCEL: 'Cancel',
			BTN_OK: 'OK',
			MSG_HAVE_BEEN_DEFEATED: 'You have been defeated!',
			BTN_AUTO: 'Auto',
			MSG_YOU_APPLIED: 'You applied',
			MSG_DAMAGE: 'damage',
			MSG_CANCEL_AND_STAT: 'Auto (F5) and show statistic',
			MSG_REPEAT_MISSION: 'Repeat the mission?',
			BTN_REPEAT: 'Repeat',
			BTN_NO: 'No',
			MSG_SPECIFY_QUANT: 'Specify Quantity:',
			BTN_OPEN: 'Open',
			QUESTION_COPY: 'Question copied to clipboard',
			ANSWER_KNOWN: 'The answer is known',
			ANSWER_NOT_KNOWN: 'ATTENTION THE ANSWER IS NOT KNOWN',
			BEING_RECALC: 'The battle is being recalculated',
			THIS_TIME: 'This time',
			VICTORY: 'VICTORY',
			DEFEAT: 'DEFEAT',
			CHANCE_TO_WIN: "Chance to win",
			OPEN_DOLLS: 'nesting dolls recursively',
			SENT_QUESTION: 'Question sent',
			SETTINGS: 'Settings',
			MSG_BAN_ATTENTION: '<p style="color:red;">Using this feature may result in a ban.</p> Continue?',
			BTN_YES_I_AGREE: 'Yes, I understand the risks!',
			BTN_NO_I_AM_AGAINST: 'No, I refuse it!',
			VALUES: 'Values',
			EXPEDITIONS_SENT: 'Expeditions sent',
			TITANIT: 'Titanit',
			COMPLETED: 'completed',
			FLOOR: 'Floor',
			LEVEL: 'Level',
			BATTLES: 'battles',
			EVENT: 'Event',
			NOT_AVAILABLE: 'not available',
			NO_HEROES: 'No heroes',
			DAMAGE_AMOUNT: 'Damage amount',
			NOTHING_TO_COLLECT: 'Nothing to collect',
			COLLECTED: 'Collected',
			REWARD: 'rewards',
			REMAINING_ATTEMPTS: 'Remaining attempts',
			BATTLES_CANCELED: 'Battles canceled',
			MINION_RAID: 'Minion Raid',
			STOPPED: 'Stopped',
			REPETITIONS: 'Repetitions',
			MISSIONS_PASSED: 'Missions passed',
			STOP: 'stop',
			TOTAL_OPEN: 'Total open',
			OPEN: 'Open',
			ROUND_STAT: 'Damage statistics for ',
			BATTLE: 'battles',
			MINIMUM: 'Minimum',
			MAXIMUM: 'Maximum',
			AVERAGE: 'Average',
			NOT_THIS_TIME: 'Not this time',
			RETRY_LIMIT_EXCEEDED: 'Retry limit exceeded',
			SUCCESS: 'Success',
			RECEIVED: 'Received',
			LETTERS: 'letters',
			PORTALS: 'portals',
			ATTEMPTS: 'attempts',
			/* Quests */
			QUEST_10001: 'Upgrade the skills of heroes 3 times',
			QUEST_10002: 'Complete 10 missions',
			QUEST_10003: 'Complete 3 heroic missions',
			QUEST_10004: 'Fight 3 times in the Arena or Grand Arena',
			QUEST_10006: 'Use the exchange of emeralds 1 time',
			QUEST_10007: 'Perform 1 summon in the Solu Atrium',
			QUEST_10016: 'Send gifts to guildmates',
			QUEST_10018: 'Use an experience potion',
			QUEST_10019: 'Open 1 chest in the Tower',
			QUEST_10020: 'Open 3 chests in Outland',
			QUEST_10021: 'Collect 75 Titanite in the Guild Dungeon',
			QUEST_10021: 'Collect 150 Titanite in the Guild Dungeon',
			QUEST_10023: 'Upgrade Gift of the Elements by 1 level',
			QUEST_10024: 'Level up any artifact once',
			QUEST_10025: 'Start Expedition 1',
			QUEST_10026: 'Start 4 Expeditions',
			QUEST_10027: 'Win 1 battle of the Tournament of Elements',
			QUEST_10028: 'Level up any titan artifact',
			QUEST_10029: 'Unlock the Orb of Titan Artifacts',
			QUEST_10030: 'Upgrade any Skin of any hero 1 time',
			QUEST_10031: 'Win 6 battles of the Tournament of Elements',
			QUEST_10043: 'Start or Join an Adventure',
			QUEST_10044: 'Use Summon Pets 1 time',
			QUEST_10046: 'Open 3 chests in Adventure',
			QUEST_10047: 'Get 150 Guild Activity Points',
			NOTHING_TO_DO: 'Nothing to do',
			YOU_CAN_COMPLETE: 'You can complete quests',
			BTN_DO_IT: 'Do it',
			NOT_QUEST_COMPLETED: 'Not a single quest completed',
			COMPLETED_QUESTS: 'Completed quests',
			/* everything button */
			ASSEMBLE_OUTLAND: 'Assemble Outland',
			PASS_THE_TOWER: 'Pass the tower',
			CHECK_EXPEDITIONS: 'Check Expeditions',
			COMPLETE_TOE: 'Complete ToE',
			COMPLETE_DUNGEON: 'Complete the dungeon',
			COLLECT_MAIL: 'Collect mail',
			COLLECT_MISC: 'Collect some bullshit',
			COLLECT_MISC_TITLE: 'Collect Easter Eggs, Skin Gems, Keys, Arena Coins and Soul Crystal',
			COLLECT_QUEST_REWARDS: 'Collect quest rewards',
			MAKE_A_SYNC: 'Make a sync',

			RUN_FUNCTION: 'Run the following functions?',
			BTN_GO: 'Go!',
			PERFORMED: 'Performed',
			DONE: 'Done',
			ERRORS_OCCURRES: 'Errors occurred while executing',
			COPY_ERROR: 'Copy error information to clipboard',
			BTN_YES: 'Yes',
			ALL_TASK_COMPLETED: 'All tasks completed',

			UNKNOWN: 'unknown',
			ENTER_THE_PATH: 'Enter the path of adventure using commas or dashes',
			START_ADVENTURE: 'Start your adventure along this path!',
			INCORRECT_WAY: 'Incorrect path in adventure: {from} -> {to}',
			BTN_CANCELED: 'Canceled',
			MUST_TWO_POINTS: 'The path must contain at least 2 points.',
			MUST_ONLY_NUMBERS: 'The path must contain only numbers and commas',
			NOT_ON_AN_ADVENTURE: 'You are not on an adventure',
			YOU_IN_NOT_ON_THE_WAY: 'Your location is not on the way',
			ATTEMPTS_NOT_ENOUGH: 'Your attempts are not enough to complete the path, continue?',
			YES_CONTINUE: 'Yes, continue!',
			NOT_ENOUGH_AP: 'Not enough action points',
			ATTEMPTS_ARE_OVER: 'The attempts are over',
			MOVES: 'Moves',
			BUFF_GET_ERROR: 'Buff getting error',
			BATTLE_END_ERROR: 'Battle end error',
			AUTOBOT: 'Autobot',
			FAILED_TO_WIN_AUTO: 'Failed to win the auto battle',
			ERROR_OF_THE_BATTLE_COPY: 'An error occurred during the passage of the battle<br>Copy the error to the clipboard?',
			ERROR_DURING_THE_BATTLE: 'Error during the battle',
			NO_CHANCE_WIN: 'No chance of winning this fight: 0/',
			LOST_HEROES: 'You have won, but you have lost one or several heroes',
			VICTORY_IMPOSSIBLE: 'Is victory impossible, should we focus on the result?',
			FIND_COEFF: 'Find the coefficient greater than',
			BTN_PASS: 'PASS',
			BRAWLS: 'Brawls',
			BRAWLS_TITLE: 'Activates the ability to auto-brawl',
			START_AUTO_BRAWLS: 'Start Auto Brawls?',
			LOSSES: 'Losses',
			WINS: 'Wins',
			FIGHTS: 'Fights',
			STAGE: 'Stage',
			DONT_HAVE_LIVES: 'You don\'t have lives',
			LIVES: 'Lives',
			SECRET_WEALTH_ALREADY: 'Secret Wealth: Item for Pet Potions already purchased',
			SECRET_WEALTH_NOT_ENOUGH: 'Secret Wealth: Not Enough Pet Potion, You Have {available}, Need {need}',
			SECRET_WEALTH_UPGRADE_NEW_PET: 'Secret Wealth: After purchasing the Pet Potion, it will not be enough to upgrade a new pet',
			SECRET_WEALTH_PURCHASED: 'Secret wealth: Purchased {count} {name}',
			SECRET_WEALTH_CANCELED: 'Secret Wealth: Purchase Canceled',
			SECRET_WEALTH_BUY: 'You have {available} Pet Potion.<br>Do you want to buy {countBuy} {name} for {price} Pet Potion?',
			DAILY_BONUS: 'Daily bonus',
			DO_DAILY_QUESTS: 'Do daily quests',
			ACTIONS: 'Actions',
			ACTIONS_TITLE: 'Dialog box with various actions',
			OTHERS: 'Others',
			OTHERS_TITLE: 'Others',
			CHOOSE_ACTION: 'Choose an action',
			OPEN_LOOTBOX: 'You have {lootBox} boxes, should we open them?',
			STAMINA: 'Energy',
			BOXES_OVER: 'The boxes are over',
			NO_BOXES: 'No boxes',
			NO_MORE_ACTIVITY: 'No more activity for items today',
			EXCHANGE_ITEMS: 'Exchange items for activity points (max {maxActive})?',
			GET_ACTIVITY: 'Get Activity',
			NOT_ENOUGH_ITEMS: 'Not enough items',
			ACTIVITY_RECEIVED: 'Activity received',
			NO_PURCHASABLE_HERO_SOULS: 'No purchasable Hero Souls',
			PURCHASED_HERO_SOULS: 'Purchased {countHeroSouls} Hero Souls',
			NOT_ENOUGH_EMERALDS_540: 'Not enough emeralds, you need 540 you have {currentStarMoney}',
			CHESTS_NOT_AVAILABLE: 'Chests not available',
			OUTLAND_CHESTS_RECEIVED: 'Outland chests received',
			RAID_NOT_AVAILABLE: 'The raid is not available or there are no spheres',
			RAID_ADVENTURE: 'Raid {adventureId} adventure!',
			SOMETHING_WENT_WRONG: 'Something went wrong',
			ADVENTURE_COMPLETED: 'Adventure {adventureId} completed {times} times',
			CLAN_STAT_COPY: 'Clan statistics copied to clipboard',
			GET_ENERGY: 'Get Energy',
			GET_ENERGY_TITLE: 'Opens platinum boxes one at a time until you get 250 energy',
			ITEM_EXCHANGE: 'Item Exchange',
			ITEM_EXCHANGE_TITLE: 'Exchanges items for the specified amount of activity',
			BUY_SOULS: 'Buy souls',
			BUY_SOULS_TITLE: 'Buy hero souls from all available shops',
			BUY_OUTLAND: 'Buy Outland',
			BUY_OUTLAND_TITLE: 'Buy 9 chests in Outland for 540 emeralds',
			AUTO_RAID_ADVENTURE: 'Raid adventure',
			AUTO_RAID_ADVENTURE_TITLE: 'Raid adventure set number of times',
			CLAN_STAT: 'Clan statistics',
			CLAN_STAT_TITLE: 'Copies clan statistics to the clipboard',
			BTN_AUTO_F5: 'Auto (F5)',
			BOSS_DAMAGE: 'Boss Damage: ',
			NOTHING_BUY: 'Nothing to buy',
			LOTS_BOUGHT: '{countBuy} lots bought for gold',
			BUY_FOR_GOLD: 'Buy for gold',
			BUY_FOR_GOLD_TITLE: 'Buy items for gold in the Town Shop and in the Pet Soul Stone Shop',
			REWARDS_AND_MAIL: 'Rewars and Mail',
			REWARDS_AND_MAIL_TITLE: 'Collects rewards and mail',
			COLLECT_REWARDS_AND_MAIL: 'Collected {countQuests} rewards and {countMail} letters',
			TIMER_ALREADY: 'Timer already started {time}',
			NO_ATTEMPTS_TIMER_START: 'No attempts, timer started {time}',
			EPIC_BRAWL_RESULT: 'Wins: {wins}/{attempts}, Coins: {coins}, Streak: {progress}/{nextStage} [Close]{end}',
			ATTEMPT_ENDED: '<br>Attempts ended, timer started {time}',
			EPIC_BRAWL: 'Cosmic Battle',
			EPIC_BRAWL_TITLE: 'Spends attempts in the Cosmic Battle',
			RELOAD_GAME: 'Reload game',
			TIMER: 'Timer:',
			SHOW_ERRORS: 'Show errors',
			SHOW_ERRORS_TITLE: 'Show server request errors',
			ERROR_MSG: 'Error: {name}<br>{description}',
			EVENT_AUTO_BOSS: 'Maximum number of battles for calculation:</br>{length} ? {countTestBattle} = {maxCalcBattle}</br>If you have a weak computer, it may take a long time for this, click on the cross to cancel.</br>Should I search for the best pack from all or the first suitable one?',
			BEST_SLOW: 'Best (slower)',
			FIRST_FAST: 'First (faster)',
			FREEZE_INTERFACE: 'Calculating... <br>The interface may freeze.',
			ERROR_F12: 'Error, details in the console (F12)',
			FAILED_FIND_WIN_PACK: 'Failed to find a winning pack',
			BEST_PACK: 'Best pack:',
			BOSS_HAS_BEEN_DEF: 'Boss {bossLvl} has been defeated.',
			NOT_ENOUGH_ATTEMPTS_BOSS: 'Not enough attempts to defeat boss {bossLvl}, retry?',
			BOSS_VICTORY_IMPOSSIBLE: 'Based on the recalculation of {battles} battles, victory has not been achieved. Would you like to continue the search for a winning battle in real battles? <p style="color:red;">Using this feature may be considered as DDoS attack or HTTP flooding and result in permanent ban</p>',
			BOSS_HAS_BEEN_DEF_TEXT: 'Boss {bossLvl} defeated in<br>{countBattle}/{countMaxBattle} attempts<br>(Please synchronize or restart the game to update the data)',
			PLAYER_POS: 'Player positions:',
		},
		ru: {
			/* �������� */
			SKIP_FIGHTS: '������� ����',
			SKIP_FIGHTS_TITLE: '������� ���� � ���������� � ����� �������, ����������� � ����� � ��������',
			ENDLESS_CARDS: '����������� �����',
			ENDLESS_CARDS_TITLE: '��������� ����� ���� ������������',
			AUTO_EXPEDITION: '��������������',
			AUTO_EXPEDITION_TITLE: '������������ ����������',
			CANCEL_FIGHT: '������ ���',
			CANCEL_FIGHT_TITLE: '����������� ������ ��� �� ��, �� � � �������',
			GIFTS: '�������',
			GIFTS_TITLE: '�������� ������� �������������',
			BATTLE_RECALCULATION: '��������� ���',
			BATTLE_RECALCULATION_TITLE: '��������������� ������ ���',
			QUANTITY_CONTROL: '�������� ���-��',
			QUANTITY_CONTROL_TITLE: '����������� ��������� ���������� ����������� "���������"',
			REPEAT_CAMPAIGN: '������ � ��������',
			REPEAT_CAMPAIGN_TITLE: '���������� ���� � ��������',
			DISABLE_DONAT: '��������� �����',
			DISABLE_DONAT_TITLE: '������� ��� ����������� ������',
			DAILY_QUESTS: '������',
			DAILY_QUESTS_TITLE: '��������� ���������� ������',
			AUTO_QUIZ: '�������������',
			AUTO_QUIZ_TITLE: '�������������� ��������� ���������� ������� �� ������� ���������',
			SECRET_WEALTH_CHECKBOX: '�������������� ������� � �������� "������ ���������" ��� ������ � ����',
			HIDE_SERVERS: '�������� �������',
			HIDE_SERVERS_TITLE: '�������� �������������� �������',
			/* ���� ����� */
			HOW_MUCH_TITANITE: '������� ������ ��������',
			COMBAT_SPEED: '��������� ��������� ���',
			NUMBER_OF_TEST: '���������� �������� ����',
			NUMBER_OF_AUTO_BATTLE: '���������� ������� ��������',
			/* ������ */
			RUN_SCRIPT: '��������� ������',
			TO_DO_EVERYTHING: '������� ���',
			TO_DO_EVERYTHING_TITLE: '��������� ��������� ��������',
			OUTLAND: '����������',
			OUTLAND_TITLE: '������� ����������',
			TITAN_ARENA: '������ ������',
			TITAN_ARENA_TITLE: '��������������� ������� ������',
			DUNGEON: '����������',
			DUNGEON_TITLE: '��������������� ����������',
			DUNGEON2: '���������� ����',
			DUNGEON_FULL_TITLE: '���������� ��� ������� �������',
			STOP_DUNGEON: '���� ��������',
			STOP_DUNGEON_TITLE: '���������� ������� ����������',
			SEER: '��������',
			SEER_TITLE: '��������� ��������',
			TOWER: '�����',
			TOWER_TITLE: '��������������� �����',
			EXPEDITIONS: '����������',
			EXPEDITIONS_TITLE: '�������� � ���� ����������',
			SYNC: '�������������',
			SYNC_TITLE: '��������� ������������� ������ ���� ��� ������������ ���������',
			ARCHDEMON: '���������',
			ARCHDEMON_TITLE: '�������� ���� � �������� �������',
			ESTER_EGGS: '��������',
			ESTER_EGGS_TITLE: '������� ��� �������� ��� �������',
			REWARDS: '�������',
			REWARDS_TITLE: '������� ��� ������� �� �������',
			MAIL: '�����',
			MAIL_TITLE: '������� ��� �����, ����� ����� � �������� � �������� �������',
			MINIONS: '�����������',
			MINIONS_TITLE: '������� ������������ ������������ �������',
			ADVENTURE: '�����������',
			ADVENTURE_TITLE: '�������� ����������� �� ���������� ��������',
			STORM: '����',
			STORM_TITLE: '�������� ���� �� ���������� ��������',
			SANCTUARY: '���������',
			SANCTUARY_TITLE: '������� ������� � ���������',
			GUILD_WAR: '����� �������',
			GUILD_WAR_TITLE: '������� ������� � ����� �������',
			SECRET_WEALTH: '������ ���������',
			SECRET_WEALTH_TITLE: '������ ���-�� � �������� "������ ���������"',
			/* ������ */
			BOTTOM_URLS: '<a href="https://t.me/+q6gAGCRpwyFkNTYy" target="_blank" title="Telegram"><svg style="margin: 2px;" width="20" height="20" viewBox="0 0 1000 1000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient x1="50%" y1="0%" x2="50%" y2="99.2583404%" id="linearGradient-1"><stop stop-color="#2AABEE" offset="0%"></stop><stop stop-color="#229ED9" offset="100%"></stop></linearGradient></defs><g id="Artboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><circle id="Oval" fill="url(#linearGradient-1)" cx="500" cy="500" r="500"></circle><path d="M226.328419,494.722069 C372.088573,431.216685 469.284839,389.350049 517.917216,369.122161 C656.772535,311.36743 685.625481,301.334815 704.431427,301.003532 C708.567621,300.93067 717.815839,301.955743 723.806446,306.816707 C728.864797,310.92121 730.256552,316.46581 730.922551,320.357329 C731.588551,324.248848 732.417879,333.113828 731.758626,340.040666 C724.234007,419.102486 691.675104,610.964674 675.110982,699.515267 C668.10208,736.984342 654.301336,749.547532 640.940618,750.777006 C611.904684,753.448938 589.856115,731.588035 561.733393,713.153237 C517.726886,684.306416 492.866009,666.349181 450.150074,638.200013 C400.78442,605.66878 432.786119,587.789048 460.919462,558.568563 C468.282091,550.921423 596.21508,434.556479 598.691227,424.000355 C599.00091,422.680135 599.288312,417.758981 596.36474,415.160431 C593.441168,412.561881 589.126229,413.450484 586.012448,414.157198 C581.598758,415.158943 511.297793,461.625274 375.109553,553.556189 C355.154858,567.258623 337.080515,573.934908 320.886524,573.585046 C303.033948,573.199351 268.692754,563.490928 243.163606,555.192408 C211.851067,545.013936 186.964484,539.632504 189.131547,522.346309 C190.260287,513.342589 202.659244,504.134509 226.328419,494.722069 Z" id="Path-3" fill="#FFFFFF"></path></g></svg></a><a href="https://vk.com/invite/YNPxKGX" target="_blank" title="���������"><svg style="margin: 2px;" width="20" height="20" viewBox="0 0 101 100" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_2_40)"><path d="M0.5 48C0.5 25.3726 0.5 14.0589 7.52944 7.02944C14.5589 0 25.8726 0 48.5 0H52.5C75.1274 0 86.4411 0 93.4706 7.02944C100.5 14.0589 100.5 25.3726 100.5 48V52C100.5 74.6274 100.5 85.9411 93.4706 92.9706C86.4411 100 75.1274 100 52.5 100H48.5C25.8726 100 14.5589 100 7.52944 92.9706C0.5 85.9411 0.5 74.6274 0.5 52V48Z" fill="#0077FF"/><path d="M53.7085 72.042C30.9168 72.042 17.9169 56.417 17.3752 30.417H28.7919C29.1669 49.5003 37.5834 57.5836 44.25 59.2503V30.417H55.0004V46.8752C61.5837 46.1669 68.4995 38.667 70.8329 30.417H81.5832C79.7915 40.5837 72.2915 48.0836 66.9582 51.1669C72.2915 53.6669 80.8336 60.2086 84.0836 72.042H72.2499C69.7082 64.1253 63.3754 58.0003 55.0004 57.1669V72.042H53.7085Z" fill="white"/></g><defs><clipPath id="clip0_2_40"><rect width="100" height="100" fill="white" transform="translate(0.5)"/></clipPath></defs></svg></a>',
			GIFTS_SENT: '������� ����������!',
			DO_YOU_WANT: "�� ������������� ������ ��� �������?",
			BTN_RUN: '��������',
			BTN_CANCEL: '������',
			BTN_OK: '��',
			MSG_HAVE_BEEN_DEFEATED: '�� ��������� ���������!',
			BTN_AUTO: '����',
			MSG_YOU_APPLIED: '�� �������',
			MSG_DAMAGE: '�����',
			MSG_CANCEL_AND_STAT: '���� (F5) � �������� ����������',
			MSG_REPEAT_MISSION: '��������� ������?',
			BTN_REPEAT: '���������',
			BTN_NO: '���',
			MSG_SPECIFY_QUANT: '������� ����������:',
			BTN_OPEN: '�������',
			QUESTION_COPY: '������ ���������� � ����� ������',
			ANSWER_KNOWN: '����� ��������',
			ANSWER_NOT_KNOWN: '�������� ����� �� ��������',
			BEING_RECALC: '���� ��������� ���',
			THIS_TIME: '�� ���� ���',
			VICTORY: '<span style="color:green;">������</span>',
			DEFEAT: '<span style="color:red;">���������</span>',
			CHANCE_TO_WIN: '����� �� ������ <span style="color:red;">�� ������ ����������</span>',
			OPEN_DOLLS: '�������� ����������',
			SENT_QUESTION: '������ ���������',
			SETTINGS: '���������',
			MSG_BAN_ATTENTION: '<p style="color:red;">������������� ���� ������� ����� �������� � ����.</p> ����������?',
			BTN_YES_I_AGREE: '��, � ���� �� ���� ��� �����!',
			BTN_NO_I_AM_AGAINST: '���, � ����������� �� �����!',
			VALUES: '��������',
			EXPEDITIONS_SENT: '���������� ����������',
			TITANIT: '�������',
			COMPLETED: '���������',
			FLOOR: '����',
			LEVEL: '�������',
			BATTLES: '���',
			EVENT: '�����',
			NOT_AVAILABLE: '����������',
			NO_HEROES: '��� ������',
			DAMAGE_AMOUNT: '���������� �����',
			NOTHING_TO_COLLECT: '������ ��������',
			COLLECTED: '�������',
			REWARD: '������',
			REMAINING_ATTEMPTS: '�������� �������',
			BATTLES_CANCELED: '���� ��������',
			MINION_RAID: '���� ������������',
			STOPPED: '�����������',
			REPETITIONS: '����������',
			MISSIONS_PASSED: '������ ��������',
			STOP: '����������',
			TOTAL_OPEN: '����� �������',
			OPEN: '�������',
			ROUND_STAT: '���������� ����� ��',
			BATTLE: '����',
			MINIMUM: '�����������',
			MAXIMUM: '������������',
			AVERAGE: '�������',
			NOT_THIS_TIME: '�� � ���� ���',
			RETRY_LIMIT_EXCEEDED: '�������� ����� �������',
			SUCCESS: '�����',
			RECEIVED: '��������',
			LETTERS: '�����',
			PORTALS: '��������',
			ATTEMPTS: '�������',
			QUEST_10001: '������ ������ ������ 3 ����',
			QUEST_10002: '������ 10 ������',
			QUEST_10003: '������ 3 ����������� ������',
			QUEST_10004: '������� 3 ���� �� ����� ��� ����� �����',
			QUEST_10006: '��������� ����� ��������� 1 ���',
			QUEST_10007: '������� 1 ������ � ������� ���',
			QUEST_10016: '������� ������� ������������',
			QUEST_10018: '��������� ����� �����',
			QUEST_10019: '������ 1 ������ � �����',
			QUEST_10020: '������ 3 ������� � ����������',
			QUEST_10021: '������ 75 �������� � ���������� �������',
			QUEST_10021: '������ 150 �������� � ���������� �������',
			QUEST_10023: '�������� ��� ������ �� 1 �������',
			QUEST_10024: '������ ������� ������ ��������� ���� ���',
			QUEST_10025: '����� 1 ����������',
			QUEST_10026: '����� 4 ����������',
			QUEST_10027: '������ � 1 ��� ������� ������',
			QUEST_10028: '������ ������� ������ ��������� �������',
			QUEST_10029: '������ ����� ���������� �������',
			QUEST_10030: '������ ����� ������ ����� 1 ���',
			QUEST_10031: '������ � 6 ���� ������� ������',
			QUEST_10043: '����� ��� ������������ � �����������',
			QUEST_10044: '������������ �������� �������� 1 ���',
			QUEST_10046: '������ 3 ������� � ������������',
			QUEST_10047: '������ 150 ����� ���������� � �������',
			NOTHING_TO_DO: '������ ���������',
			YOU_CAN_COMPLETE: '����� ��������� ������',
			BTN_DO_IT: '��������',
			NOT_QUEST_COMPLETED: '�� ������ ������ �� ���������',
			COMPLETED_QUESTS: '��������� �������',
			/* everything button */
			ASSEMBLE_OUTLAND: '������� ����������',
			PASS_THE_TOWER: '������ �����',
			CHECK_EXPEDITIONS: '��������� ����������',
			COMPLETE_TOE: '������ ������ ������',
			COMPLETE_DUNGEON: '������ ����������',
			COMPLETE_RAID_NODES: '�����������',
			COLLECT_MAIL: '������� �����',
			COLLECT_MISC: '������� ������ �����',
			COLLECT_MISC_TITLE: '������� ��������, ����� ������, �����, ������ ����� � �������� ����',
			COLLECT_QUEST_REWARDS: '������� ������� �� ������',
			MAKE_A_SYNC: '������� ������������',

			RUN_FUNCTION: '��������� ��������� �������?',
			BTN_GO: '�������!',
			PERFORMED: '�����������',
			DONE: '���������',
			ERRORS_OCCURRES: '�������� ������ ��� ����������',
			COPY_ERROR: '����������� � ����� ���������� �� ������',
			BTN_YES: '��',
			ALL_TASK_COMPLETED: '��� ������ ���������',

			UNKNOWN: '����������',
			ENTER_THE_PATH: '������� ���� ����������� ����� ������� ��� ������',
			START_ADVENTURE: '������ ����������� �� ����� ����!',
			INCORRECT_WAY: '�������� ���� � �����������: {from} -> {to}',
			BTN_CANCELED: '��������',
			MUST_TWO_POINTS: '���� ������ �������� ������� �� 2� �����',
			MUST_ONLY_NUMBERS: '���� ������ ��������� ������ ����� � �������',
			NOT_ON_AN_ADVENTURE: '�� �� � �����������',
			YOU_IN_NOT_ON_THE_WAY: '��������� ���� ������ �������� ����� ������ ���������',
			ATTEMPTS_NOT_ENOUGH: '����� ������� �� ���������� ��� ���������� ����, ����������?',
			YES_CONTINUE: '��, ���������!',
			NOT_ENOUGH_AP: '������� �� ����������',
			ATTEMPTS_ARE_OVER: '������� �����������',
			MOVES: '����',
			BUFF_GET_ERROR: '������ ��� ��������� ����',
			BATTLE_END_ERROR: '������ ���������� ���',
			AUTOBOT: '�������',
			FAILED_TO_WIN_AUTO: '�� ������� �������� � �������',
			ERROR_OF_THE_BATTLE_COPY: '�������� ������ � �������� ����������� ���<br>����������� ������ � ����� ������?',
			ERROR_DURING_THE_BATTLE: '������ � �������� ����������� ���',
			NO_CHANCE_WIN: '��� ������ �������� � ���� ���: 0/',
			LOST_HEROES: '�� ��������, �� �������� ������ ��� ��������� ������!',
			VICTORY_IMPOSSIBLE: '������ �� ��������, ���� �� ���������?',
			FIND_COEFF: '����� ������������ ������ ���',
			BTN_PASS: '�������',
			BRAWLS: '���������',
			BRAWLS_TITLE: '�������� ����������� �������������',
			START_AUTO_BRAWLS: '��������� �������������?',
			LOSSES: '���������',
			WINS: '�����',
			FIGHTS: '����',
			STAGE: '������',
			DONT_HAVE_LIVES: '� ��� ��� ������',
			LIVES: '�����',
			SECRET_WEALTH_ALREADY: '������ ���������: ����� �� ����� �������� ��� ������',
			SECRET_WEALTH_NOT_ENOUGH: '������ ���������: �� ���������� ����� �������, � ��� {available}, ����� {need}',
			SECRET_WEALTH_UPGRADE_NEW_PET: '������ ���������: ����� ������� ����� ������� ����� �� ���������� ��� �������� ������ �������',
			SECRET_WEALTH_PURCHASED: '������ ���������: ������� {count} {name}',
			SECRET_WEALTH_CANCELED: '������ ���������: ������� ��������',
			SECRET_WEALTH_BUY: '� ��� {available} ����� �������.<br>�� ������ ������ {countBuy} {name} �� {price} ����� �������?',
			DAILY_BONUS: '���������� �������',
			DO_DAILY_QUESTS: '������� ���������� ������',
			ACTIONS: '��������',
			ACTIONS_TITLE: '���������� ���� � ���������� ����������',
			OTHERS: '������',
			OTHERS_TITLE: '���������� ���� � ��������������� ���������� ����������',
			CHOOSE_ACTION: '�������� ��������',
			OPEN_LOOTBOX: '� ��� {lootBox} ������, ��������?',
			STAMINA: '�������',
			BOXES_OVER: '����� �����������',
			NO_BOXES: '��� ������',
			NO_MORE_ACTIVITY: '������ ���������� �� �������� ������� �� ��������',
			EXCHANGE_ITEMS: '�������� �������� �� ���� ���������� (�� ����� {maxActive})?',
			GET_ACTIVITY: '�������� ����������',
			NOT_ENOUGH_ITEMS: '��������� ������������',
			ACTIVITY_RECEIVED: '�������� ����������',
			NO_PURCHASABLE_HERO_SOULS: '��� ��������� ��� ������� ��� ������',
			PURCHASED_HERO_SOULS: '������� {countHeroSouls} ��� ������',
			NOT_ENOUGH_EMERALDS_540: '������������ �����, ����� 540 � ��� {currentStarMoney}',
			CHESTS_NOT_AVAILABLE: '������� �� ��������',
			OUTLAND_CHESTS_RECEIVED: '�������� �������� ����������',
			RAID_NOT_AVAILABLE: '���� �� �������� ��� ���� ���',
			RAID_ADVENTURE: '���� {adventureId} �����������!',
			SOMETHING_WENT_WRONG: '���-�� ����� �� ���',
			ADVENTURE_COMPLETED: '����������� {adventureId} �������� {times} ���',
			CLAN_STAT_COPY: '�������� ���������� ����������� � ����� ������',
			GET_ENERGY: '�������� �������',
			GET_ENERGY_TITLE: '��������� ���������� �������� �� ����� �� ��������� 250 �������',
			ITEM_EXCHANGE: '����� ���������',
			ITEM_EXCHANGE_TITLE: '���������� �������� �� ��������� ���������� ����������',
			BUY_SOULS: '������ ����',
			BUY_SOULS_TITLE: '������ ���� ������ �� ���� ��������� ���������',
			BUY_OUTLAND: '������ ����������',
			BUY_OUTLAND_TITLE: '������ 9 �������� � ���������� �� 540 ���������',
			AUTO_RAID_ADVENTURE: '���� �����������',
			AUTO_RAID_ADVENTURE_TITLE: '���� ����������� �������� ���������� ���',
			CLAN_STAT: '�������� ����������',
			CLAN_STAT_TITLE: '�������� �������� ���������� � ����� ������',
			BTN_AUTO_F5: '���� (F5)',
			BOSS_DAMAGE: '���� �� �����: ',
			NOTHING_BUY: '������ ��������',
			LOTS_BOUGHT: '�� ������ ������� {countBuy} �����',
			BUY_FOR_GOLD: '������� �� ������',
			BUY_FOR_GOLD_TITLE: '������� �������� �� ������ � ��������� ����� � � �������� ������ ��� ��������',
			REWARDS_AND_MAIL: '������� � �����',
			REWARDS_AND_MAIL_TITLE: '�������� ������� � �����',
			COLLECT_REWARDS_AND_MAIL: '������� {countQuests} ������ � {countMail} �����',
			TIMER_ALREADY: '������ ��� �������',
			NO_ATTEMPTS_TIMER_START: '������� ���, ������� ������',
			EPIC_BRAWL_RESULT: '{i} ������: {wins}/{attempts}, ������: {coins}, �����: {progress}/{nextStage} [�������]{end}',
			ATTEMPT_ENDED: '<br>������� �����������, ������� ������ {time}',
			EPIC_BRAWL: '���������� �����',
			EPIC_BRAWL_TITLE: '������ ������� �� ���������� �����',
			RELOAD_GAME: '������������� ����',
			TIMER: '������:',
			SHOW_ERRORS: '���������� ������',
			SHOW_ERRORS_TITLE: '���������� ������ �������� � �������',
			ERROR_MSG: '������: {name}<br>{description}',
			EVENT_AUTO_BOSS: '������������ ���������� ���� ��� �������:</br>{length} * {countTestBattle} = {maxCalcBattle}</br>���� � ��� ������ ��������� �� ��� ����� ������������� ����� �������, ������� ������� ��� ������.</br>������ ������ ��� �� ���� ��� ������ ����������?',
			BEST_SLOW: '������ (��������)',
			FIRST_FAST: '������ (�������)',
			FREEZE_INTERFACE: '���� ������... <br> ��������� ����� ���������.',
			ERROR_F12: '������, ����������� � ������� (F12)',
			FAILED_FIND_WIN_PACK: '�������� ��� ����� �� �������',
			BEST_PACK: '��������� ���: ',
			BOSS_HAS_BEEN_DEF: '���� {bossLvl} ��������',
			NOT_ENOUGH_ATTEMPTS_BOSS: '��� ������ ����� ${bossLvl} �� ������� �������, ���������?',
			BOSS_VICTORY_IMPOSSIBLE: '�� ����������� ���������� {battles} ���� ������ �������� �� �������. �� ������ ���������� ����� ��������� ��� �� �������� ����? <p style="color:red;">������������� ���� ������� ����� ���� ��������� ��� DDoS ����� ��� HTTP-���� � �������� � ������������� ����</p>',
			BOSS_HAS_BEEN_DEF_TEXT: '���� {bossLvl} �������� ��<br>{countBattle}/{countMaxBattle} �������<br>(�������� ������������� ��� ������������� ���� ��� ���������� ������)',
			PLAYER_POS: '������� �������:',
		}
	}

	function getLang() {
		let lang = '';
		if (typeof NXFlashVars !== 'undefined') {
			lang = NXFlashVars.interface_lang
		}
		if (!lang) {
			lang = (navigator.language || navigator.userLanguage).substr(0, 2);
		}
		if (lang == 'ru') {
			return lang;
		}
		return 'en';
	}

	this.I18N = function (constant, replace) {
		const selectLang = getLang();
		if (constant && constant in i18nLangData[selectLang]) {
			const result = i18nLangData[selectLang][constant];
			if (replace) {
				return result.sprintf(replace);
			}
			return result;
		}
		return `% ${constant} %`;
	};

	String.prototype.sprintf = String.prototype.sprintf ||
		function () {
			"use strict";
			var str = this.toString();
			if (arguments.length) {
				var t = typeof arguments[0];
				var key;
				var args = ("string" === t || "number" === t) ?
					Array.prototype.slice.call(arguments)
					: arguments[0];

				for (key in args) {
					str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
				}
			}

			return str;
		};

	/**
	 * Checkboxes
	 *
	 * ��������
	 */
	const checkboxes = {
		passBattle: {
			label: I18N('SKIP_FIGHTS'),
			cbox: null,
			title: I18N('SKIP_FIGHTS_TITLE'),
			default: true
		},
		/*
	endlessCards: {
		label: I18N('ENDLESS_CARDS'),
		cbox: null,
		title: I18N('ENDLESS_CARDS_TITLE'),
		default: false
	},
	*/
		countControl: {
			label: I18N('QUANTITY_CONTROL'),
			cbox: null,
			title: I18N('QUANTITY_CONTROL_TITLE'),
			default: false
		},
		repeatMission: {
			label: I18N('REPEAT_CAMPAIGN'),
			cbox: null,
			title: I18N('REPEAT_CAMPAIGN_TITLE'),
			default: false
		},
		noOfferDonat: {
			label: I18N('DISABLE_DONAT'),
			cbox: null,
			title: I18N('DISABLE_DONAT_TITLE'),
			/**
			 * A crutch to get the field before getting the character id
			 *
			 * ������� ���� �������� ���� �� ��������� id ���������
			 */
			default: (() => {
				$result = false;
				try {
					$result = JSON.parse(localStorage[GM_info.script.name + ':noOfferDonat'])
				} catch(e) {
					$result = false;
				}
				return $result || true;
			})(),
		},
		dailyQuests: {
			label: I18N('DAILY_QUESTS'),
			cbox: null,
			title: I18N('DAILY_QUESTS_TITLE'),
			default: false
		},
		showErrors: {
			label: I18N('SHOW_ERRORS'),
			cbox: null,
			title: I18N('SHOW_ERRORS_TITLE'),
			default: false
		},
		hideServers: {
			label: I18N('HIDE_SERVERS'),
			cbox: null,
			title: I18N('HIDE_SERVERS_TITLE'),
			default: false
		},
	};
	/**
	 * Get checkbox state
	 *
	 * �������� ��������� ��������
	 */
	function isChecked(checkBox) {
		if (!(checkBox in checkboxes)) {
			return false;
		}
		return checkboxes[checkBox].cbox?.checked;
	}
	/**
	 * Input fields
	 *
	 * ���� �����
	 */
	const inputs = {
		speedBattle: {
			input: null,
			title: I18N('COMBAT_SPEED'),
			default: 5,
		},
	FPS: {
		input: null,
		title: 'FPS',
		default: 10,
	}
	}
	/**
	 * Checks the checkbox
	 *
	 * ��������� ������ ���� �����
	 */
	function getInput(inputName) {
	return inputs[inputName]?.input?.value;
}

/**
 * Control FPS
 *
 * �������� FPS
 */
let nextAnimationFrame = Date.now();
const oldRequestAnimationFrame = this.requestAnimationFrame;
this.requestAnimationFrame = async function (e) {
	const FPS = Number(getInput('FPS')) || -1;
	const now = Date.now();
	const delay = nextAnimationFrame - now;
	nextAnimationFrame = Math.max(now, nextAnimationFrame) + Math.min(1e3 / FPS, 1e3);
	if (delay > 0) {
		await new Promise((e) => setTimeout(e, delay));
	}
	oldRequestAnimationFrame(e);
};
	/**
	 * Button List
	 *
	 * ������ ��������
	 */
	const buttons = {
		getOutland: {
			name: '������� ���',
			title: '������� ���',
			func: testDoYourBest,
		},
		moveToUpperServer: {
			name: '������� �� ��������� ������',
			title: '������� �� ��������� ������',
			func: async function(  ){

				// if(checkboxes['sendNewYearGifts'].cbox.checked)
				// {
				// 	const serverInfo = getServers();
				//
				// 	if(parseInt(questsInfo['userGetInfo'].serverId) === serverInfo.serverId)
				// 	{
				// 		document.querySelector('.user-control-menu-button-label').click();
				//
				// 		await Sleep(3000);
				//
				// 		document.querySelector('.sidebar__profile-user-logout-button-label').click();
				//
				// 		await Sleep(2000);
				//
				// 		return;
				// 	}
				//
				// 	const servers = await Send({"calls" : [
				// 			{"name": "serverGetAll","args" : {}, "ident": "body"}
				// 		]})
				//
				// 	const users = servers.results[0].result.response.users;
				//
				// 	for( let user of users )
				// 	{
				// 		if(serverInfo.serverId === parseInt(user.serverId))
				// 		{
				// 			await Send({"calls":[{"name":"userChange","args":{"id": user.id },"ident":"body"}]});
				//
				// 			location.reload();
				// 			return;
				// 		}
				// 	}
				// }
				// else
				// {
					const servers = await Send({"calls" : [
							{"name": "serverGetAll","args" : {}, "ident": "body"}
						]})

					const users = servers.results[0].result.response.users;

					for( let user of users )
					{
						let notFarmed = localStorage.getItem('new-v-'+ (new Date()).toDateString()+'-' +user.id)

						if(notFarmed !== 'true')
						{
							await Send({"calls":[{"name":"userChange","args":{"id": user.id },"ident":"body"}]});

							location.reload();
							return;
						}
					}
				// }

				document.querySelector('.user-control-menu-button-label').click();

				await Sleep(2000);
                await popup.confirm("��� �������",[{ msg: I18N('BTN_OK'), result: 0 }]);


			},
		},
		newYearDecorateTree: {
			name: '�������� ����',
			title: '�������� ����',
			func: async function(){

				const response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

				let coin = parseInt(response.results[0].result.response.coin[17])

				if(coin > 0)
				{
					await Send({"calls":[{"name":"newYearDecorateTree","args":{"optionId":1,"amount":coin},"ident":"body"}]});
				}

				const userGetInfoResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				const emeralds = userGetInfoResponse.results[0].result.response.starMoney;

				if(emeralds > 100){

					const tries = Math.floor(emeralds / 100);

					await Send({"calls":[{"name":"newYearDecorateTree","args":{"optionId":2,"amount":tries},"ident":"body"}]});
				}
			}
		},
		doActions: {
			name: I18N('ACTIONS'),
			title: I18N('ACTIONS_TITLE'),
			func: async function () {
				const popupButtons = [
					{
						msg: I18N('OUTLAND'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('OUTLAND')}?`, getOutland);
						},
						title: I18N('OUTLAND_TITLE'),
					},
					{
						msg: I18N('TOWER'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('TOWER')}?`, testTower);
						},
						title: I18N('TOWER_TITLE'),
					},
					{
						msg: I18N('EXPEDITIONS'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('EXPEDITIONS')}?`, checkExpedition);
						},
						title: I18N('EXPEDITIONS_TITLE'),
					},
					{
						msg: I18N('MINIONS'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('MINIONS')}?`, testRaidNodes);
						},
						title: I18N('MINIONS_TITLE'),
					},
					{
						msg: I18N('ESTER_EGGS'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('ESTER_EGGS')}?`, offerFarmAllReward);
						},
						title: I18N('ESTER_EGGS_TITLE'),
					},
					{
						msg: I18N('STORM'),
						result: function () {
							testAdventure('solo');
						},
						title: I18N('STORM_TITLE'),
					},
					{
						msg: I18N('REWARDS'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('REWARDS')}?`, questAllFarm);
						},
						title: I18N('REWARDS_TITLE'),
					},
					{
						msg: I18N('MAIL'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('MAIL')}?`, mailGetAll);
						},
						title: I18N('MAIL_TITLE'),
					},
					{
						msg: I18N('SEER'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('SEER')}?`, rollAscension);
						},
						title: I18N('SEER_TITLE'),
					},
				];
				popupButtons.push({ result: false, isClose: true })
				const answer = await popup.confirm(`${I18N('CHOOSE_ACTION')}:`, popupButtons);
				if (typeof answer === 'function') {
					answer();
				}
			}
		},
		doOthers: {
			name: I18N('OTHERS'),
			title: I18N('OTHERS_TITLE'),
			func: async function () {
				const popupButtons = [
					{
						msg: I18N('GET_ENERGY'),
						result: farmStamina,
						title: I18N('GET_ENERGY_TITLE'),
					},
					{
						msg: I18N('ITEM_EXCHANGE'),
						result: fillActive,
						title: I18N('ITEM_EXCHANGE_TITLE'),
					},
					{
						msg: I18N('BUY_SOULS'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('BUY_SOULS')}?`, buyHeroFragments);
						},
						title: I18N('BUY_SOULS_TITLE'),
					},
					{
						msg: I18N('BUY_FOR_GOLD'),
						result: function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('BUY_FOR_GOLD')}?`, buyInStoreForGold);
						},
						title: I18N('BUY_FOR_GOLD_TITLE'),
					},
					{
						msg: I18N('BUY_OUTLAND'),
						result: function () {
							confShow(I18N('BUY_OUTLAND_TITLE') + '?', bossOpenChestPay);
						},
						title: I18N('BUY_OUTLAND_TITLE'),
					},
					{
						msg: I18N('AUTO_RAID_ADVENTURE'),
						result: autoRaidAdventure,
						title: I18N('AUTO_RAID_ADVENTURE_TITLE'),
					},
					{
						msg: I18N('CLAN_STAT'),
						result: clanStatistic,
						title: I18N('CLAN_STAT_TITLE'),
					},
					{
						msg: I18N('SECRET_WEALTH'),
						result: buyWithPetExperience,
						title: I18N('SECRET_WEALTH_TITLE'),
					},
					{
						msg: I18N('EPIC_BRAWL'),
						result: async function () {
							confShow(`${I18N('RUN_SCRIPT')} ${I18N('EPIC_BRAWL')}?`, () => {
								const brawl = new epicBrawl;
								brawl.start();
							});
						},
						title: I18N('EPIC_BRAWL_TITLE'),
					},
				];
				popupButtons.push({ result: false, isClose: true })
				const answer = await popup.confirm(`${I18N('CHOOSE_ACTION')}:`, popupButtons);
				if (typeof answer === 'function') {
					answer();
				}
			}
		},
		rewardsAndMailFarm: {
name: I18N('REWARDS_AND_MAIL'),
title: I18N('REWARDS_AND_MAIL_TITLE'),
func: rewardsAndMailFarm
},
		goToSanctuary: {
			name: I18N('SANCTUARY'),
			title: I18N('SANCTUARY_TITLE'),
			func: cheats.goSanctuary,
		},
		goToClanWar: {
			name: I18N('GUILD_WAR'),
			title: I18N('GUILD_WAR_TITLE'),
			func: cheats.goClanWar,
		},
		newDay: {
name: I18N('SYNC'),
title: I18N('SYNC_TITLE'),
func: cheats.refreshGame
},
        //������� ������
	absGift: {
		name: I18N('�������'),
		title: '�� ������ ������� �� ID',
		func: function () {
			confShow(`${I18N('RUN_SCRIPT')} ${I18N('New_Year_TITLE')}?`, absGift);
		},
	}
	}

	async function newYearDecorateTree(){

		const response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

		let coin = parseInt(response.results[0].result.response.coin[17])

		if(coin > 0)
		{
			await Send({"calls":[{"name":"newYearDecorateTree","args":{"optionId":1,"amount":coin},"ident":"body"}]});
		}

		const userGetInfoResponse = await Send( JSON.stringify( {
			calls: [
				{
					name: "userGetInfo",
					args: {},
					ident: "userGetInfo"
				}
			]
		} ) );

		const emeralds = userGetInfoResponse.results[0].result.response.starMoney;

		if(emeralds > 100){

			const tries = Math.floor(emeralds / 100);

			await Send({"calls":[{"name":"newYearDecorateTree","args":{"optionId":2,"amount":tries},"ident":"body"}]});
		}
	}

	function getServers() {

		// gifts: [
		//  6, ������ ����
		//  5, ������
		// 	4, ������
		// 	3, ������ �����
		// 	2, ����
		// 	1  �������
		// ]

		const serverId = 94;

		const servers = [
			{
				serverId: 94,
				userId: 1,
				clanId: 1,
				gifts: [
					3, // ������ �����
					2, // ����
					1  // �������
				]
			}
		];

		return {
			serverId,
			servers
		}
	}
	/**
	 * Display buttons
	 *
	 * ������� ��������
	 */
	function addControlButtons() {
		for (let name in buttons) {
			button = buttons[name];
			button['button'] = scriptMenu.addButton(button.name, button.func, button.title);
		}
	}
	/**
	 * Adds links
	 *
	 * ��������� ������
	 */
	function addBottomUrls() {
		scriptMenu.addHeader(I18N('BOTTOM_URLS'));
	}
	/**
	 * Stop repetition of the mission
	 *
	 * ���������� ������ ������
	 */
	let isStopSendMission = false;
	/**
	 * There is a repetition of the mission
	 *
	 * ���� ������ ������
	 */
	let isSendsMission = false;
	/**
	 * Data on the past mission
	 *
	 * ������ � ��������� �����
	 */
	let lastMissionStart = {}
	/**
 * Start time of the last battle in the company
 *
 * ����� ������ ���������� ��� � ��������
 */
let lastMissionBattleStart = 0;

	/**
	 * Data on the past attack on the boss
	 *
	 * ������ � ��������� ����� �� �����
	 */
	let lastBossBattle = {}
	/**
	 * Data for calculating the last battle with the boss
	 *
	 * ������ ��� ������� ���������� ��� � ������
	 */
	let lastBossBattleInfo = null;
	/**
	 * Ability to cancel the battle in Asgard
	 *
	 * ����������� �������� ��� � ��������
	 */
	let isCancalBossBattle = true;
	/**
	 * Information about the last battle
	 *
	 * ������ � ��������� �����
	 */
	let lastBattleArg = {}
	/**
	 * The name of the function of the beginning of the battle
	 *
	 * ��� ������� ������ ���
	 */
	let nameFuncStartBattle = '';
	/**
	 * The name of the function of the end of the battle
	 *
	 * ��� ������� ����� ���
	 */
	let nameFuncEndBattle = '';
	/**
	 * Data for calculating the last battle
	 *
	 * ������ ��� ������� ���������� ���
	 */
	let lastBattleInfo = null;
	/**
	 * The ability to cancel the battle
	 *
	 * ����������� �������� ���
	 */
	let isCancalBattle = true;

	/**
	 * Certificator of the last open nesting doll
	 *
	 * ������������ ��������� �������� ��������
	 */
	let lastRussianDollId = null;
	/**
	 * Cancel the training guide
	 *
	 * �������� ��������� �����������
	 */
	this.isCanceledTutorial = true;

	/**
	 * Data from the last question of the quiz
	 *
	 * ������ ���������� ������� ���������
	 */
	let lastQuestion = null;
	/**
	 * Answer to the last question of the quiz
	 *
	 * ����� �� ��������� ������ ���������
	 */
	let lastAnswer = null;
	/**
	 * Flag for opening keys or titan artifact spheres
	 *
	 * ���� �������� ������ ��� ���� ���������� �������
	 */
	let artifactChestOpen = false;
	/**
	 * The name of the function to open keys or orbs of titan artifacts
	 *
	 * ��� ������� �������� ������ ��� ���� ���������� �������
	 */
	let artifactChestOpenCallName = '';
	/**
	 * Data for the last battle in the dungeon
	 * (Fix endless cards)
	 *
	 * ������ ��� ���������� ��� � ��������
	 * (����������� ����������� ����)
	 */
	let lastDungeonBattleData = null;
	/**
	 * Start time of the last battle in the dungeon
	 *
	 * ����� ������ ���������� ��� � ����������
	 */
	let lastDungeonBattleStart = 0;
	/**
	 * Subscription end time
	 *
	 * ����� ��������� ��������
	 */
	let subEndTime = 0;
	/**
	 * Number of prediction cards
	 *
	 * ���������� ���� ������������
	 */
	let countPredictionCard = 0;

	/**
	 * Brawl pack
	 *
	 * ����� ��� ���������
	 */
	let brawlsPack = null;
	/**
	 * Autobrawl started
	 *
	 * ������������� ��������
	 */
	let isBrawlsAutoStart = false;
	/**
	 * Copies the text to the clipboard
	 *
	 * �������� ���� � ����� ������
	 * @param {*} text copied text // ���������� �����
	 */
	function copyText(text) {
		let copyTextarea = document.createElement("textarea");
		copyTextarea.style.opacity = "0";
		copyTextarea.textContent = text;
		document.body.appendChild(copyTextarea);
		copyTextarea.select();
		document.execCommand("copy");
		document.body.removeChild(copyTextarea);
		delete copyTextarea;
	}
	/**
	 * Returns the history of requests
	 *
	 * ���������� ������� ��������
	 */
	this.getRequestHistory = function() {
		return requestHistory;
	}
	/**
	 * Generates a random integer from min to max
	 *
	 * ���������� ��������� ����� ����� �� min �� max
	 */
	const random = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	/**
	 * Clearing the request history
	 *
	 * ������� ������ ��������
	 */
	setInterval(function () {
		let now = Date.now();
		for (let i in requestHistory) {
			if (now - i > 300000) {
				delete requestHistory[i];
			}
		}
	}, 300000);
	/**
	 * DOM Loading Event page
	 *
	 * ������� �������� DOM ������ ��������
	 */
	document.addEventListener("DOMContentLoaded", () => {
		/**
		 * Create the script interface
		 *
		 * �������� ��������� �������
		 */
		createInterface();
	});
	/**
	 * Gift codes collecting and sending codes
	 *
	 * ���� � �������� ����� ��������
	 */
	function sendCodes() {
		let codes = [], count = 0;
		if (!localStorage['giftSendIds']) {
			localStorage['giftSendIds'] = '';
		}
		document.querySelectorAll('a[target="_blank"]').forEach(e => {
			let url = e?.href;
			if (!url) return;
			url = new URL(url);
			let giftId = url.searchParams.get('gift_id');
			if (!giftId || localStorage['giftSendIds'].includes(giftId)) return;
			localStorage['giftSendIds'] += ';' + giftId;
			codes.push(giftId);
			count++;
		});

		if (codes.length) {
			localStorage['giftSendIds'] = localStorage['giftSendIds'].split(';').splice(-50).join(';');
			sendGiftsCodes(codes);
		}

		if (!count) {
			setTimeout(sendCodes, 2000);
		}
	}
	/**
	 * Checking sent codes
	 *
	 * �������� ������������ �����
	 */
	function checkSendGifts() {
		if (!freebieCheckInfo) {
			return;
		}

		let giftId = freebieCheckInfo.args.giftId;
		let valName = 'giftSendIds_' + userInfo.id;
		localStorage[valName] = localStorage[valName] ?? '';
		if (!localStorage[valName].includes(giftId)) {
			localStorage[valName] += ';' + giftId;
			sendGiftsCodes([giftId]);
		}
	}
	/**
	 * Sending codes
	 *
	 * �������� �����
	 */
	function sendGiftsCodes(codes) {
		fetch('https://zingery.ru/heroes/setGifts.php', {
			method: 'POST',
			body: JSON.stringify(codes)
		}).then(
			response => response.json()
		).then(
			data => {
				if (data.result) {
					console.log(I18N('GIFTS_SENT'));
				}
			}
		)
	}
	/**
	 * Displays the dialog box
	 *
	 * ���������� ���������� ����
	 */
	function confShow(message, yesCallback, noCallback) {
		let buts = [];
		message = message || I18N('DO_YOU_WANT');
		noCallback = noCallback || (() => {});
		if (yesCallback) {
			buts = [
				{ msg: I18N('BTN_RUN'), result: true},
				{ msg: I18N('BTN_CANCEL'), result: false},
			]
		} else {
			yesCallback = () => {};
			buts = [
				{ msg: I18N('BTN_OK'), result: true},
			];
		}
		popup.confirm(message, buts).then((e) => {
			if (e) {
				yesCallback();
			} else {
				noCallback();
			}
		});
	}
	/**
	 * Overriding/Proxying the Ajax Request Creation Method
	 *
	 * ��������������/���������� ����� �������� Ajax �������
	*/
XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
	this.uniqid = Date.now() + '_' + random(1000000, 10000000);
	this.errorRequest = false;
	if (method == 'POST' && url.includes('.nextersglobal.com/api/') && /api\/$/.test(url)) {
		if (!apiUrl) {
			apiUrl = url;
			const socialInfo = /heroes-(.+?)\./.exec(apiUrl);
			console.log(socialInfo);
		}
		requestHistory[this.uniqid] = {
			method,
			url,
			error: [],
			headers: {},
			request: null,
			response: null,
			signature: [],
			calls: {},
		};
	} else if (method == 'POST' && url.includes('error.nextersglobal.com/client/')) {
		this.errorRequest = true;
	}
	return original.open.call(this, method, url, async, user, password);
};
	/**
	 * Overriding/Proxying the header setting method for the AJAX request
	 *
	 * ��������������/���������� ����� ��������� ���������� ��� AJAX �������
	*/
XMLHttpRequest.prototype.setRequestHeader = function (name, value, check) {
	if (this.uniqid in requestHistory) {
		requestHistory[this.uniqid].headers[name] = value;
	} else {
		check = true;
	}

	if (name == 'X-Auth-Signature') {
		requestHistory[this.uniqid].signature.push(value);
		if (!check) {
			return;
		}
	}

	return original.setRequestHeader.call(this, name, value);
};
	/**
	 * Overriding/Proxying the AJAX Request Sending Method
	 *
	 * ��������������/���������� ����� �������� AJAX �������
	 */
XMLHttpRequest.prototype.send = async function (sourceData) {
	if (this.uniqid in requestHistory) {
		let tempData = null;
		if (getClass(sourceData) == "ArrayBuffer") {
			tempData = decoder.decode(sourceData);
		} else {
			tempData = sourceData;
		}
		requestHistory[this.uniqid].request = tempData;
		let headers = requestHistory[this.uniqid].headers;
		lastHeaders = Object.assign({}, headers);
			/**
			 * Game loading event
			 *
			 * ������� �������� ����
			 */
			if (headers["X-Request-Id"] > 2 && !isLoadGame) {
				isLoadGame = true;
				await lib.load();
				addControls();
				addControlButtons();
				addBottomUrls();
				absGift();
                         (async () => {
await farmBattlePass();
})();
				if (isChecked('sendExpedition')) {
					checkExpedition();
				}

				checkSendGifts();
				getAutoGifts();

				cheats.activateHacks();

				justInfo();
				if (isChecked('dailyQuests')) {
					testDailyQuests();
				}

				if (isChecked('secretWealth')) {
					buyWithPetExperienceAuto();
				}

				if (isChecked('buyForGold')) {
					buyInStoreForGold();
				}
			}
			/**
			 * Outgoing request data processing
			 *
			 * ��������� ������ ���������� �������
			 */
			sourceData = await checkChangeSend.call(this, sourceData, tempData);
			/**
			 * Handling incoming request data
			 *
			 * ��������� ������ ��������� �������
			 */
			const oldReady = this.onreadystatechange;
			this.onreadystatechange = async function (e) {
				if(this.readyState == 4 && this.status == 200) {
					isTextResponse = this.responseType === "text" || this.responseType === "";
					let response = isTextResponse ? this.responseText : this.response;
					requestHistory[this.uniqid].response = response;
					/**
					 * Replacing incoming request data
					 *
					 * ������� ������ ��������� �������
					 */
					if (isTextResponse) {
						await checkChangeResponse.call(this, response);
					}
					/**
					 * A function to run after the request is executed
					 *
					 * ������� ����������� ����� ��������� �������
					 */
					if (typeof this.onReadySuccess == 'function') {
						setTimeout(this.onReadySuccess, 500);
					}
				}
				if (oldReady) {
					return oldReady.apply(this, arguments);
				}
			}
		}
		if (this.errorRequest) {
			const oldReady = this.onreadystatechange;
			this.onreadystatechange = function () {
				Object.defineProperty(this, 'status', {
					writable: true
				});
				this.status = 200;
				Object.defineProperty(this, 'readyState', {
					writable: true
				});
				this.readyState = 4;
				Object.defineProperty(this, 'responseText', {
					writable: true
				});
				this.responseText = JSON.stringify({
					"result": true
				});
				return oldReady.apply(this, arguments);
			}
			this.onreadystatechange();
		} else {
			try {
				return original.send.call(this, sourceData);
			} catch(e) {
				debugger;
			}

		}
	};
	/**
	 * Processing and substitution of outgoing data
	 *
	 * ��������� � ������� ��������� ������
	 */
	async function checkChangeSend(sourceData, tempData) {
		try {
			/**
			 * A function that replaces battle data with incorrect ones to cancel combat�
			 *
			 * ������� ���������� ������ ��� �� �������� ��� ������ ���
			 */
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			/**
			 * Dialog window 2
			 *
			 * ���������� ���� 2
			 */
			const showMsg = async function (msg, ansF, ansS) {
				if (typeof popup == 'object') {
					return await popup.confirm(msg, [
						{msg: ansF, result: false},
						{msg: ansS, result: true},
					]);
				} else {
					return !confirm(`${msg}\n ${ansF} (${I18N('BTN_OK')})\n ${ansS} (${I18N('BTN_CANCEL')})`);
				}
			}
			/**
			 * Dialog window 3
			 *
			 * ���������� ���� 3
			 */
			const showMsgs = async function (msg, ansF, ansS, ansT) {
				return await popup.confirm(msg, [
					{msg: ansF, result: 0},
					{msg: ansS, result: 1},
					{msg: ansT, result: 2},
				]);
			}

			let changeRequest = false;
			testData = JSON.parse(tempData);
			for (const call of testData.calls) {
				if (!artifactChestOpen) {
					requestHistory[this.uniqid].calls[call.name] = call.ident;
				}
				/**
				 * Cancellation of the battle in adventures, on VG and with minions of Asgard
				 * ������ ��� � ������������, �� �� � � ������������� �������
				 */
				if ((call.name == 'adventure_endBattle' ||
						call.name == 'adventureSolo_endBattle' ||
						call.name == 'clanWarEndBattle' &&
						isChecked('cancelBattle') ||
						call.name == 'crossClanWar_endBattle' &&
						isChecked('cancelBattle') ||
						call.name == 'brawl_endBattle' ||
						call.name == 'towerEndBattle' ||
						call.name == 'invasion_bossEnd' ||
						call.name == 'bossEndBattle' ||
						call.name == 'clanRaid_endNodeBattle') &&
					isCancalBattle) {
					nameFuncEndBattle = call.name;
					if (!call.args.result.win) {
						let resultPopup = false;
						if (call.name == 'adventure_endBattle' ||
							call.name == 'invasion_bossEnd' ||
							call.name == 'bossEndBattle' ||
							call.name == 'adventureSolo_endBattle') {
							resultPopup = await showMsgs(I18N('MSG_HAVE_BEEN_DEFEATED'), I18N('BTN_OK'), I18N('BTN_CANCEL'), I18N('BTN_AUTO'));
						} else if (call.name == 'clanWarEndBattle' ||
							call.name == 'crossClanWar_endBattle') {
							resultPopup = await showMsg(I18N('MSG_HAVE_BEEN_DEFEATED'), I18N('BTN_OK'), I18N('BTN_AUTO_F5'));
						} else {
							resultPopup = await showMsg(I18N('MSG_HAVE_BEEN_DEFEATED'), I18N('BTN_OK'), I18N('BTN_CANCEL'));
						}
						if (resultPopup) {
							fixBattle(call.args.progress[0].attackers.heroes);
							fixBattle(call.args.progress[0].defenders.heroes);
							changeRequest = true;
							if (resultPopup > 1) {
								this.onReadySuccess = testAutoBattle;
								// setTimeout(bossBattle, 1000);
							}
						}
					} else if (call.args.result.stars < 3 && call.name == 'towerEndBattle') {
						resultPopup = await showMsg(I18N('LOST_HEROES'), I18N('BTN_OK'), I18N('BTN_CANCEL'), I18N('BTN_AUTO'));
						if (resultPopup) {
							fixBattle(call.args.progress[0].attackers.heroes);
							fixBattle(call.args.progress[0].defenders.heroes);
							changeRequest = true;
							if (resultPopup > 1) {
								this.onReadySuccess = testAutoBattle;
							}
						}
					}
					if (isChecked('autoBrawls') && !isBrawlsAutoStart && call.name == 'brawl_endBattle') {
						if (await popup.confirm(I18N('START_AUTO_BRAWLS'), [
							{ msg: I18N('BTN_NO'), result: false },
							{ msg: I18N('BTN_YES'), result: true },
						])) {
							this.onReadySuccess = testBrawls;
							isBrawlsAutoStart = true;
						}
					}
				}
				/**
				 * Save pack for Brawls
				 *
				 * ��������� ����� ��� ���������
				 */
				if (call.name == 'brawl_startBattle') {
					console.log(JSON.stringify(call.args));
					brawlsPack = call.args;
				}
				/**
				 * Canceled fight in Asgard
				 * ������ ��� � �������
				 */
				if (call.name == 'clanRaid_endBossBattle' &&
					isCancalBossBattle &&
					isChecked('cancelBattle')) {
					bossDamage = call.args.progress[0].defenders.heroes[1].extra;
					sumDamage = bossDamage.damageTaken + bossDamage.damageTakenNextLevel;
					let resultPopup = await showMsgs(
						`${I18N('MSG_YOU_APPLIED')} ${sumDamage.toLocaleString()} ${I18N('MSG_DAMAGE')}.`,
						I18N('BTN_OK'), I18N('BTN_AUTO_F5'), I18N('MSG_CANCEL_AND_STAT'))
					if (resultPopup) {
						fixBattle(call.args.progress[0].attackers.heroes);
						fixBattle(call.args.progress[0].defenders.heroes);
						changeRequest = true;
						if (resultPopup > 1) {
							this.onReadySuccess = testBossBattle;
							// setTimeout(bossBattle, 1000);
						}
					}
				}
				/**
				 * Save the Asgard Boss Attack Pack
				 * ��������� ����� ��� ����� ����� �������
				 */
				if (call.name == 'clanRaid_startBossBattle') {
					lastBossBattle = call.args;
				}
				/**
				 * Saving the request to start the last battle
				 * ���������� ������� ������ ���������� ���
				 */
				if (call.name == 'clanWarAttack' ||
					call.name == 'crossClanWar_startBattle' ||
					call.name == 'adventure_turnStartBattle' ||
					call.name == 'bossAttack' ||
					call.name == 'invasion_bossStart' ||
					call.name == 'towerStartBattle') {
					nameFuncStartBattle = call.name;
					lastBattleArg = call.args;
				}
				/**
				 * Disable spending divination cards
				 * ��������� ����� ���� ������������
				 */
				if (call.name == 'dungeonEndBattle') {
					if (call.args.isRaid) {
						if (countPredictionCard <= 0) {
							delete call.args.isRaid;
							changeRequest = true;
						} else if (countPredictionCard > 0) {
							countPredictionCard--;
						}
					}
					console.log(`Cards: ${countPredictionCard}`);
					/**
					 * Fix endless cards
					 * ����������� ����������� ����
					 */
					const lastBattle = lastDungeonBattleData;
					if (lastBattle && !call.args.isRaid) {
						if (changeRequest) {
							lastBattle.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];
						} else {
							lastBattle.progress = call.args.progress;
						}
						const result = await Calc(lastBattle);

						if (changeRequest) {
							call.args.progress = result.progress;
							call.args.result = result.result;
						}

						let timer = getTimer(result.battleTime);
						const period = Math.ceil((Date.now() - lastDungeonBattleStart) / 1000);
						console.log(timer, period);
						if (period < timer) {
							timer = timer - period;
							await countdownTimer(timer);
						}
					}
				}
				/**
				 * Quiz Answer
				 * ����� �� ���������
				 */
				if (call.name == 'quizAnswer') {
					/**
					 * Automatically changes the answer to the correct one if there is one.
					 * ������������� ������ ����� �� ���������� ���� �� ����
					 */
					if (lastAnswer && isChecked('getAnswer')) {
						call.args.answerId = lastAnswer;
						lastAnswer = null;
						changeRequest = true;
					}
				}
				/**
				 * Present
				 * �������
				 */
				if (call.name == 'freebieCheck') {
					freebieCheckInfo = call;
				}
				/** missionTimer */
			if (call.name == 'missionEnd' && missionBattle) {
				missionBattle.progress = call.args.progress;
				missionBattle.result = call.args.result;
				const result = await Calc(missionBattle);

				let timer = getTimer(result.battleTime) + 5;
				const period = Math.ceil((Date.now() - lastMissionBattleStart) / 1000);
				if (period < timer) {
					timer = timer - period;
					await countdownTimer(timer);
				}
				missionBattle = null;
			}
				/**
				 * Getting mission data for auto-repeat
				 * ��������� ������ ������ ��� �����������
				 */
				if (isChecked('repeatMission') &&
					call.name == 'missionEnd') {
					let missionInfo = {
						id: call.args.id,
						result: call.args.result,
						heroes: call.args.progress[0].attackers.heroes,
						count: 0,
					}
					setTimeout(async () => {
						if (!isSendsMission && await popup.confirm(I18N('MSG_REPEAT_MISSION'), [
							{ msg: I18N('BTN_REPEAT'), result: true},
							{ msg: I18N('BTN_NO'), result: false},
						])) {
							isStopSendMission = false;
							isSendsMission = true;
							sendsMission(missionInfo);
						}
					}, 0);
				}
				/**
				 * Getting mission data
				 * ��������� ������ ������
				 */
				if (call.name == 'missionStart') {
					lastMissionStart = call.args;
					lastMissionBattleStart = Date.now();
				}
				/**
				 * Specify the quantity for Titan Orbs and Pet Eggs
				 * ������� ���������� ��� ���� ������� � ��� �����
				  */
			if (isChecked('countControl') &&
				(call.name == 'pet_chestOpen' ||
				call.name == 'titanUseSummonCircle') &&
				call.args.amount > 1) {
				const startAmount = call.args.amount;
				const result = await popup.confirm(I18N('MSG_SPECIFY_QUANT'), [
					{ msg: I18N('BTN_OPEN'), isInput: true, default: 1},
					]);
				if (result) {
					const item = call.name == 'pet_chestOpen' ? { id: 90, type: 'consumable' } : { id: 13, type: 'coin' };
					cheats.updateInventory({
						[item.type]: {
							[item.id]: -(result - startAmount),
						},
					});
					call.args.amount = result;
					changeRequest = true;
				}
			}
			/**
				/**
				 * Specify the amount for keys and spheres of titan artifacts
				 * ������� ����������� ��� ������ � ���� ���������� �������
				 */
			if (isChecked('countControl') &&
				(call.name == 'artifactChestOpen' ||
				call.name == 'titanArtifactChestOpen') &&
				call.args.amount > 1 &&
				call.args.free &&
				!changeRequest) {
				artifactChestOpenCallName = call.name;
				const startAmount = call.args.amount;
				let result = await popup.confirm(I18N('MSG_SPECIFY_QUANT'), [
					{ msg: I18N('BTN_OPEN'), isInput: true, default: 1 },
				]);
				if (result) {
					const openChests = result;
					let sphere = result < 10 ? 1 : 10;
					call.args.amount = sphere;
					for (let count = openChests - sphere; count > 0; count -= sphere) {
						if (count < 10) sphere = 1;
						const ident = artifactChestOpenCallName + "_" + count;
						testData.calls.push({
							name: artifactChestOpenCallName,
							args: {
								amount: sphere,
								free: true,
							},
							ident: ident
						});
						if (!Array.isArray(requestHistory[this.uniqid].calls[call.name])) {
							requestHistory[this.uniqid].calls[call.name] = [requestHistory[this.uniqid].calls[call.name]];
						}
						requestHistory[this.uniqid].calls[call.name].push(ident);
					}

					const consumableId = call.name == 'artifactChestOpen' ? 45 : 55;
					cheats.updateInventory({
						consumable: {
							[consumableId]: -(openChests - startAmount),
						},
					});
					artifactChestOpen = true;
					changeRequest = true;
				}
			}
			if (call.name == 'consumableUseLootBox') {
				lastRussianDollId = call.args.libId;
				/**
					/**
					 * Specify quantity for gold caskets
					 * ������� ���������� ��� ������� ��������
					 */
					if (isChecked('countControl') &&
						call.args.libId == 148 &&
						call.args.amount > 1) {
						const result = await popup.confirm(I18N('MSG_SPECIFY_QUANT'), [
							{ msg: I18N('BTN_OPEN'), isInput: true, default: call.args.amount},
						]);
						call.args.amount = result;
						changeRequest = true;
					}
				}
				/**
				 * Adding a request to receive 26 store
				 * ���������� ������� �� ��������� 26 ��������
				 */
				if (call.name == 'registration') {
					/*
				testData.calls.push({
					name: "shopGet",
					args: {
						shopId: "26"
					},
					ident: "shopGet"
				});
				changeRequest = true;
				*/
				}
				/**
				 * Changing the maximum number of raids in the campaign
				 * ��������� ������������� ���������� ������ � ��������
				 */
				// if (call.name == 'missionRaid') {
				// 	if (isChecked('countControl') && call.args.times > 1) {
				// 		const result = +(await popup.confirm(I18N('MSG_SPECIFY_QUANT'), [
				// 			{ msg: I18N('BTN_RUN'), isInput: true, default: call.args.times },
				// 		]));
				// 		call.args.times = result > call.args.times ? call.args.times : result;
				// 		changeRequest = true;
				// 	}
				// }
			}

			let headers = requestHistory[this.uniqid].headers;
			if (changeRequest) {
				sourceData = JSON.stringify(testData);
				headers['X-Auth-Signature'] = getSignature(headers, sourceData);
			}

			let signature = headers['X-Auth-Signature'];
			if (signature) {
				original.setRequestHeader.call(this, 'X-Auth-Signature', signature);
			}
		} catch (err) {
			console.log("Request(send, " + this.uniqid + "):\n", sourceData, "Error:\n", err);
		}
		return sourceData;
	}
	/**
	 * Processing and substitution of incoming data
	 *
	 * ��������� � ������� �������� ������
	 */
	async function checkChangeResponse(response) {
		try {
			isChange = false;
			let nowTime = Math.round(Date.now() / 1000);
			callsIdent = requestHistory[this.uniqid].calls;
			respond = JSON.parse(response);
			/**
			 * If the request returned an error removes the error (removes synchronization errors)
			 * ���� ������ ������ ������ ������� ������ (������� ������ �������������)
			 */
			if (respond.error) {
				isChange = true;
				console.error(respond.error);
				if (isChecked('showErrors')) {
					popup.confirm(I18N('ERROR_MSG', {
						name: respond.error.name,
						description: respond.error.description,
					}));
				}
				delete respond.error;
				respond.results = [];
			}
			let mainReward = null;
			const allReward = {};
            let countTypeReward = 0;
			let readQuestInfo = false;
			for (const call of respond.results) {
				/**
				 * Obtaining initial data for completing quests
				 * ��������� �������� ������ ��� ���������� �������
				 */
				if (readQuestInfo) {
					questsInfo[call.ident] = call.result.response;
				}
				/**
				 * Getting a user ID
				 * ��������� ������������� ������������
				 */
				if (call.ident == callsIdent['registration']) {
					userId = call.result.response.userId;
					await openOrMigrateDatabase(userId);
					readQuestInfo = true;
				}
				/**
				 * Endless lives in brawls
				 * ����������� ����� � ����������
				 * (������ �� ��������)
				 */
				/*
			if (getSaveVal('autoBrawls') && call.ident == callsIdent['brawl_getInfo']) {
				brawl = call.result.response;
				if (brawl) {
					brawl.boughtEndlessLivesToday = 1;
					isChange = true;
				}
			}
			*/
				/**
			 * Hiding donation offers 1
			 * �������� ����������� ������ 1
			 */
			if (call.ident == callsIdent['billingGetAll'] && getSaveVal('noOfferDonat')) {
				const billings = call.result.response?.billings;
				const bundle = call.result.response?.bundle;
				if (billings && bundle) {
					call.result.response.billings = [];
					call.result.response.bundle = [];
					isChange = true;
				}
			}
			/**
			 * Hiding donation offers 2
			 * �������� ����������� ������ 2
			 */
			if (getSaveVal('noOfferDonat') &&
				(call.ident == callsIdent['offerGetAll'] ||
					call.ident == callsIdent['specialOffer_getAll'])) {
				let offers = call.result.response;
				if (offers) {
					call.result.response = offers.filter(e => !['addBilling', 'bundleCarousel'].includes(e.type) || ['idleResource'].includes(e.offerType));
					isChange = true;
				}
			}
			/**
			 * Hiding donation offers 3
			 * �������� ����������� ������ 3
			 */
			if (getSaveVal('noOfferDonat') && call.result?.bundleUpdate) {
				delete call.result.bundleUpdate;
				isChange = true;
			}
				/**
				 * Copies a quiz question to the clipboard
				 * �������� ������ ��������� � ����� ������ � �������� �� ���� ����� ���� ����
				 */
				if (call.ident == callsIdent['quizGetNewQuestion']) {
					let quest = call.result.response;
					console.log(quest.question);
					copyText(quest.question);
					setProgress(I18N('QUESTION_COPY'), true);
					quest.lang = null;
					if (typeof NXFlashVars !== 'undefined') {
						quest.lang = NXFlashVars.interface_lang;
					}
					lastQuestion = quest;
					if (isChecked('getAnswer')) {
						const answer = await getAnswer(lastQuestion);
						if (answer) {
							lastAnswer = answer;
							console.log(answer);
							setProgress(`${I18N('ANSWER_KNOWN')}: ${answer}`, true);
						} else {
							setProgress(I18N('ANSWER_NOT_KNOWN'), true);
						}
					}
				}
				/**
				 * Submits a question with an answer to the database
				 * ���������� ������ � ������� � ���� ������
				 */
				if (call.ident == callsIdent['quizAnswer']) {
					const answer = call.result.response;
					if (lastQuestion) {
						const answerInfo = {
							answer,
							question: lastQuestion,
							lang: null,
						}
						if (typeof NXFlashVars !== 'undefined') {
							answerInfo.lang = NXFlashVars.interface_lang;
						}
						lastQuestion = null;
						setTimeout(sendAnswerInfo, 0, answerInfo);
					}
				}
				/**
				 * Get user data
				 * �������� ������ ������������
				 */
				if (call.ident == callsIdent['userGetInfo']) {
					let user = call.result.response;
					userInfo = Object.assign({}, user);
					delete userInfo.refillable;
					if (!questsInfo['userGetInfo']) {
						questsInfo['userGetInfo'] = user;
					}
				}
				/**
				 * Start of the battle for recalculation
				 * ������ ��� ��� ����������
				 */
				if (call.ident == callsIdent['clanWarAttack'] ||
					call.ident == callsIdent['crossClanWar_startBattle'] ||
					call.ident == callsIdent['bossAttack'] ||
					call.ident == callsIdent['battleGetReplay'] ||
					call.ident == callsIdent['brawl_startBattle'] ||
					call.ident == callsIdent['adventureSolo_turnStartBattle'] ||
					call.ident == callsIdent['invasion_bossStart'] ||
					call.ident == callsIdent['towerStartBattle'] ||
					call.ident == callsIdent['adventure_turnStartBattle']) {
					let battle = call.result.response.battle || call.result.response.replay;
					if (call.ident == callsIdent['brawl_startBattle'] ||
						call.ident == callsIdent['bossAttack'] ||
						call.ident == callsIdent['towerStartBattle'] ||
						call.ident == callsIdent['invasion_bossStart']) {
						battle = call.result.response;
					}
					lastBattleInfo = battle;
					if (!isChecked('preCalcBattle')) {
						continue;
					}
					setProgress(I18N('BEING_RECALC'));
					let battleDuration = 120;
					try {
						const typeBattle = getBattleType(battle.type);
						battleDuration = +lib.data.battleConfig[typeBattle.split('_')[1]].config.battleDuration;
					} catch (e) { }
					//console.log(battle.type);
					function getBattleInfo(battle, isRandSeed) {
						return new Promise(function (resolve) {
							if (isRandSeed) {
								battle.seed = Math.floor(Date.now() / 1000) + random(0, 1e3);
							}
							BattleCalc(battle, getBattleType(battle.type), e => resolve(e));
						});
					}
					let actions = [getBattleInfo(battle, false)]
					const countTestBattle = getInput('countTestBattle');
					if (call.ident == callsIdent['battleGetReplay']) {
						battle.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];
					}
					for (let i = 0; i < countTestBattle; i++) {
						actions.push(getBattleInfo(battle, true));
					}
					Promise.all(actions)
						.then(e => {
							e = e.map(n => ({win: n.result.win, time: n.battleTime}));
							let firstBattle = e.shift();
							const timer = Math.floor(battleDuration - firstBattle.time);
							const min = ('00' + Math.floor(timer / 60)).slice(-2);
							const sec = ('00' + Math.floor(timer - min * 60)).slice(-2);
							const countWin = e.reduce((w, s) => w + s.win, 0);
							setProgress(`${I18N('THIS_TIME')} ${(firstBattle.win ? I18N('VICTORY') : I18N('DEFEAT'))} ${I18N('CHANCE_TO_WIN')}: ${Math.floor(countWin / e.length * 100)}% (${e.length}), ${min}:${sec}`, false, hideProgress)
						});
				}
				/**
				 * Start of the Asgard boss fight
				 * ������ ��� � ������ �������
				 */
				if (call.ident == callsIdent['clanRaid_startBossBattle']) {
					lastBossBattleInfo = call.result.response.battle;
					if (isChecked('preCalcBattle')) {
						const result = await Calc(lastBossBattleInfo).then(e => e.progress[0].defenders.heroes[1].extra);
						const bossDamage = result.damageTaken + result.damageTakenNextLevel;
						setProgress(I18N('BOSS_DAMAGE') + bossDamage.toLocaleString(), false, hideProgress);
					}
				}
				/**
				 * Cancel tutorial
				 * ������ ���������
				 */
				if (isCanceledTutorial && call.ident == callsIdent['tutorialGetInfo']) {
					let chains = call.result.response.chains;
					for (let n in chains) {
						chains[n] = 9999;
					}
					isChange = true;
				}
				/**
				 * Opening keys and spheres of titan artifacts
				 * �������� ������ � ���� ���������� �������
				 */
				if (artifactChestOpen &&
					(call.ident == callsIdent[artifactChestOpenCallName] ||
						(callsIdent[artifactChestOpenCallName] && callsIdent[artifactChestOpenCallName].includes(call.ident)))) {
					let reward = call.result.response[artifactChestOpenCallName == 'artifactChestOpen' ? 'chestReward' : 'reward'];

					reward.forEach(e => {
						for (let f in e) {
							if (!allReward[f]) {
								allReward[f] = {};
							}
							for (let o in e[f]) {
								if (!allReward[f][o]) {
									allReward[f][o] = e[f][o];
								} else {
									allReward[f][o] += e[f][o];
								}
							}
						}
					});

					if (!call.ident.includes(artifactChestOpenCallName)) {
						mainReward = call.result.response;
					}
				}

				/**
				 * Sum the result of opening Pet Eggs
				 * ������������ ���������� �������� ��� ��������
				 */
				if (isChecked('countControl') && call.ident == callsIdent['pet_chestOpen']) {
					const rewards = call.result.response.rewards;
					rewards.forEach(e => {
						for (let f in e) {
							if (!allReward[f]) {
								allReward[f] = {};
							}
							for (let o in e[f]) {
								if (!allReward[f][o]) {
									allReward[f][o] = e[f][o];
								} else {
									allReward[f][o] += e[f][o];
								}
							}
						}
					});
					call.result.response.rewards = [allReward];
					isChange = true;
				}
				/**
				 * Auto-repeat opening matryoshkas
				 * ���������� �������� ��������
				  */
			if (isChecked('countControl') && call.ident == callsIdent['consumableUseLootBox']) {
				let [countLootBox, lootBox] = Object.entries(call.result.response).pop();
				countLootBox = +countLootBox;
				let newCount = 0;
				if (lootBox?.consumable && lootBox.consumable[lastRussianDollId]) {
					newCount += lootBox.consumable[lastRussianDollId];
					delete lootBox.consumable[lastRussianDollId];
				}
				if (
					newCount &&
					(await popup.confirm(`${I18N('BTN_OPEN')} ${newCount} ${I18N('OPEN_DOLLS')}?`, [
						{ msg: I18N('BTN_OPEN'), result: true },
						{ msg: I18N('BTN_NO'), result: false, isClose: true },
					]))
				) {
					const recursionResult = await openRussianDolls(lastRussianDollId, newCount);
					countLootBox += +count;
					mergeItemsObj(lootBox, recursionResult);
					isChange = true;
				}

				if (this.massOpen) {
					if (
						await popup.confirm(I18N('OPEN_ALL_EQUIP_BOXES'), [
							{ msg: I18N('BTN_OPEN'), result: true },
							{ msg: I18N('BTN_NO'), result: false, isClose: true },
						])
					) {
						const consumable = await Send({ calls: [{ name: 'inventoryGet', args: {}, ident: 'inventoryGet' }] }).then((e) =>
							Object.entries(e.results[0].result.response.consumable)
						);
						const calls = [];
						const deleteItems = {};
						for (const [libId, amount] of consumable) {
							if (libId != this.massOpen && libId >= 362 && libId <= 389) {
								calls.push({
									name: 'consumableUseLootBox',
									args: { libId, amount },
									ident: 'consumableUseLootBox_' + libId,
								});
								deleteItems[libId] = -amount;
							}
						}
						const responses = await Send({ calls }).then((e) => e.results.map((r) => r.result.response).flat());

						for (const loot of responses) {
							const [count, result] = Object.entries(loot).pop();
							countLootBox += +count;

							mergeItemsObj(lootBox, result);
						}
						isChange = true;

						this.onReadySuccess = () => {
							cheats.updateInventory({ consumable: deleteItems });
							cheats.refreshInventory();
						};
					}
				}

				if (isChange) {
					call.result.response = {
						[countLootBox]: lootBox,
					};
				}
			}
				/**
				 * Dungeon recalculation (fix endless cards)
				 * ��������� �������� (����������� ����������� ����)
				 */
				if (call.ident == callsIdent['dungeonStartBattle']) {
					lastDungeonBattleData = call.result.response;
					lastDungeonBattleStart = Date.now();
				}
				/**
				 * Getting the number of prediction cards
				 * ��������� ���������� ���� ������������
				 */
				if (call.ident == callsIdent['inventoryGet']) {
					countPredictionCard = call.result.response.consumable[81] || 0;
				}
				/**
				 * Adding 26 and 28 store to other stores
				 * ���������� 26 � 28 �������� � ��������� ���������
				 */
				if (call.ident == callsIdent['shopGetAll']) {
					if (userInfo.level >= 10) {
						const result = await Send({ calls: [{ name: "shopGet", args: { shopId: "26" }, ident: "shopGet_26" }, { name: "shopGet", args: { shopId: "28" }, ident: "shopGet_28" }] }).then(e => e.results);
						call.result.response[26] = result[0].result.response;
						call.result.response[28] = result[1].result.response;
						isChange = true;
					}
				}
				/**
				 * Getting subscription status
				 * ��������� ��������� ��������
				 */
				if (call.ident == callsIdent['subscriptionGetInfo']) {
					const subscription = call.result.response.subscription;
					if (subscription) {
						subEndTime = subscription.endTime * 1000;
					}
				}
				/**
				 * Getting prediction cards
				 * ��������� ���� ������������
				 */
				if (call.ident == callsIdent['questFarm']) {
					const consumable = call.result.response?.consumable;
					if (consumable && consumable[81]) {
						countPredictionCard += consumable[81];
						console.log(`Cards: ${countPredictionCard}`);
					}
				}
				/**
				 * Hiding extra servers
				 * ������� ������ ��������
				 */
				if (call.ident == callsIdent['serverGetAll'] && isChecked('hideServers')) {
					let servers = call.result.response.users.map(s => s.serverId)
					call.result.response.servers = call.result.response.servers.filter(s => servers.includes(s.id));
					isChange = true;
				}
				/**
				 * Displays player positions in the adventure
				 * ���������� ������� ������� � �����������
				 */
				if (call.ident == callsIdent['adventure_getLobbyInfo']) {
					const users = Object.values(call.result.response.users);
					let msg = I18N('PLAYER_POS');
					for (const user of users) {
						msg += `<br>${user.user.name} - ${user.currentNode}`;
					}
					setProgress(msg, false, hideProgress);
				}
				/**
				 * Automatic launch of a raid at the end of the adventure
				 * �������������� ������ ����� ��� ��������� �����������
				 */
				if (call.ident == callsIdent['adventure_end']) {
					autoRaidAdventure()
				}
				/** �������� ����� ��������� */
			if (call.ident == callsIdent['missionRaid']) {
				if (call.result?.heroesMerchant) {
					delete call.result.heroesMerchant;
					isChange = true;
				}
			}
			/** missionTimer */
			if (call.ident == callsIdent['missionStart']) {
				missionBattle = call.result.response;
			}
			}

			if (mainReward && artifactChestOpen) {
				console.log(allReward);
				mainReward[artifactChestOpenCallName == 'artifactChestOpen' ? 'chestReward' : 'reward'] = [allReward];
				artifactChestOpen = false;
				artifactChestOpenCallName = '';
				isChange = true;
			}
		} catch(err) {
			console.log("Request(response, " + this.uniqid + "):\n", "Error:\n", response, err);
		}

		if (isChange) {
			Object.defineProperty(this, 'responseText', {
				writable: true
			});
			this.responseText = JSON.stringify(respond);
		}
	}

	/**
	 * Request an answer to a question
	 *
	 * ������ ������ �� ������
	 */
	async function getAnswer(question) {
		return new Promise((resolve, reject) => {
			fetch('https://zingery.ru/heroes/getAnswer.php', {
				method: 'POST',
				body: JSON.stringify(question)
			}).then(
				response => response.json()
			).then(
				data => {
					if (data.result) {
						resolve(data.result);
					} else {
						resolve(false);
					}
				}
			).catch((error) => {
				console.error(error);
				resolve(false);
			});
		})
	}

	/**
	 * Submitting a question and answer to a database
	 *
	 * �������� ������� � ������ � ���� ������
	 */
	function sendAnswerInfo(answerInfo) {
		fetch('https://zingery.ru/heroes/setAnswer.php', {
			method: 'POST',
			body: JSON.stringify(answerInfo)
		}).then(
			response => response.json()
		).then(
			data => {
				if (data.result) {
					console.log(I18N('SENT_QUESTION'));
				}
			}
		)
	}

	/**
	 * Returns the battle type by preset type
	 *
	 * ���������� ��� ��� �� ���� �������
	 */
	function getBattleType(strBattleType) {
		if (strBattleType.includes("invasion")) {
			return "get_invasion";
		}
		if (strBattleType.includes("boss")) {
			return "get_boss";
		}
		switch (strBattleType) {
			case "invasion":
				return "get_invasion";
			case "titan_pvp_manual":
				return "get_titanPvpManual";
			case "titan_pvp":
				return "get_titanPvp";
			case "titan_clan_pvp":
			case "clan_pvp_titan":
			case "clan_global_pvp_titan":
			case "brawl_titan":
			case "challenge_titan":
				return "get_titanClanPvp";
			case "clan_raid": // Asgard Boss // ���� �������
			case "adventure": // Adventures // �����������
			case "clan_global_pvp":
			case "clan_pvp":
			case "challenge":
				return "get_clanPvp";
			case "dungeon_titan":
			case "titan_tower":
				return "get_titan";
			case "tower":
			case "clan_dungeon":
				return "get_tower";
			case "pve":
				return "get_pve";
			case "pvp_manual":
				return "get_pvpManual";
			case "grand":
			case "arena":
			case "pvp":
				return "get_pvp";
			case "core":
				return "get_core";
			case "boss_10":
			case "boss_11":
			case "boss_12":
				return "get_boss";
			default:
				return "get_clanPvp";
		}
	}
	/**
	 * Returns the class name of the passed object
	 *
	 * ���������� �������� ������ ����������� �������
	 */
	function getClass(obj) {
		return {}.toString.call(obj).slice(8, -1);
	}
	/**
	 * Calculates the request signature
	 *
	 * ����������� ��������� �������
	 */
	this.getSignature = function(headers, data) {
		const sign = {
			signature: '',
			length: 0,
			add: function (text) {
				this.signature += text;
				if (this.length < this.signature.length) {
					this.length = 3 * (this.signature.length + 1) >> 1;
				}
			},
		}
		sign.add(headers["X-Request-Id"]);
		sign.add(':');
		sign.add(headers["X-Auth-Token"]);
		sign.add(':');
		sign.add(headers["X-Auth-Session-Id"]);
		sign.add(':');
		sign.add(data);
		sign.add(':');
		sign.add('LIBRARY-VERSION=1');
		sign.add('UNIQUE-SESSION-ID=' + headers["X-Env-Unique-Session-Id"]);

		return md5(sign.signature);
	}
	/**
	 * Creates an interface
	 *
	 * ������� ���������
	 */
	function createInterface() {
		scriptMenu.init({
			showMenu: true
		});
		scriptMenu.addHeader(GM_info.script.name, justInfo);
		scriptMenu.addHeader('v' + GM_info.script.version);
		scriptMenu.addEndFarmHeader('����� �������');
	}

	function addControls() {
		const checkboxDetails = scriptMenu.addDetails(I18N('SETTINGS'));
		for (let name in checkboxes) {
			checkboxes[name].cbox = scriptMenu.addCheckbox(checkboxes[name].label, checkboxes[name].title, checkboxDetails);
			/**
			 * Getting the state of checkboxes from storage
			 * �������� ��������� ��������� �� storage
			 */
			let val = storage.get(name, null);
			if (val != null) {
				checkboxes[name].cbox.checked = val;
			} else {
				storage.set(name, checkboxes[name].default);
				checkboxes[name].cbox.checked = checkboxes[name].default;
			}
			/**
			 * Tracing the change event of the checkbox for writing to storage
			 * ����������� ������� ��������� �������� ��� ������ � storage
			 */
			checkboxes[name].cbox.dataset['name'] = name;
			checkboxes[name].cbox.addEventListener('change', async function (event) {
				const nameCheckbox = this.dataset['name'];
				/*
			if (this.checked && nameCheckbox == 'cancelBattle') {
				this.checked = false;
				if (await popup.confirm(I18N('MSG_BAN_ATTENTION'), [
					{ msg: I18N('BTN_NO_I_AM_AGAINST'), result: true },
					{ msg: I18N('BTN_YES_I_AGREE'), result: false },
				])) {
					return;
				}
				this.checked = true;
			}
			*/
				storage.set(nameCheckbox, this.checked);
			})
		}

		const inputDetails = scriptMenu.addDetails(I18N('VALUES'));
		for (let name in inputs) {
			inputs[name].input = scriptMenu.addInputText(inputs[name].title, false, inputDetails);
			/**
			 * Get inputText state from storage
			 * �������� ��������� inputText �� storage
			 */
			let val = storage.get(name, null);
            //
                if (name == "FPS") {val=null;}
            //
			if (val != null) {
				inputs[name].input.value = val;
			} else {
				storage.set(name, inputs[name].default);
				inputs[name].input.value = inputs[name].default;
			}
			/**
			 * Tracing a field change event for a record in storage
			 * ����������� ������� ��������� ���� ��� ������ � storage
			 */
			inputs[name].input.dataset['name'] = name;
			inputs[name].input.addEventListener('input', function () {
				const inputName = this.dataset['name'];
				let value = +this.value;
				if (!value || Number.isNaN(value)) {
					value = storage.get(inputName, inputs[inputName].default);
					inputs[name].input.value = value;
				}
				storage.set(inputName, value);
			})
		}
	}

	/**
	 * Sending a request
	 *
	 * �������� �������
	 */
	function send(json, callback, pr) {
		if (typeof json == 'string') {
			json = JSON.parse(json);
		}
		for (const call of json.calls) {
			if (!call?.context?.actionTs) {
				call.context = {
					actionTs: performance.now()
				}
			}
		}
		json = JSON.stringify(json);
		/**
		 * We get the headlines of the previous intercepted request
		 * �������� ��������� ����������� ������������� �������
		 */
		let headers = lastHeaders;
		/**
		 * We increase the header of the query Certifier by 1
		 * ����������� ��������� ������������� ������� �� 1
		 */
		headers["X-Request-Id"]++;
		/**
		 * We calculate the title with the signature
		 * ����������� ��������� � ����������
		 */
		headers["X-Auth-Signature"] = getSignature(headers, json);
		/**
		 * Create a new ajax request
		 * ������� ����� AJAX ������
		 */
		let xhr = new XMLHttpRequest;
		/**
		 * Indicate the previously saved URL for API queries
		 * ��������� ����� ����������� URL ��� API ��������
		 */
		xhr.open('POST', apiUrl, true);
		/**
		 * Add the function to the event change event
		 * ��������� ������� � ������� ����� ������� �������
		 */
		xhr.onreadystatechange = function() {
			/**
			 * If the result of the request is obtained, we call the flask function
			 * ���� ��������� ������� ������� �������� ������ �������
			 */
			if(xhr.readyState == 4) {
				let randTimeout = Math.random() * 200 + 200;
				setTimeout(callback, randTimeout, xhr.response, pr);
			}
		};
		/**
		 * Indicate the type of request
		 * ��������� ��� �������
		 */
		xhr.responseType = 'json';
		/**
		 * We set the request headers
		 * ������ ��������� �������
		 */
		for(let nameHeader in headers) {
			let head = headers[nameHeader];
			xhr.setRequestHeader(nameHeader, head);
		}
		/**
		 * Sending a request
		 * ���������� ������
		 */
		xhr.send(json);
	}

	let hideTimeoutProgress = 0;
	/**
	 * Hide progress
	 *
	 * ������ ��������
	 */
	function hideProgress(timeout) {
		timeout = timeout || 0;
		clearTimeout(hideTimeoutProgress);
		hideTimeoutProgress = setTimeout(function () {
			scriptMenu.setStatus('');
		}, timeout);
	}
	/**
	 * Progress display
	 *
	 * ����������� ���������
	 */
	function setProgress(text, hide, onclick) {
		scriptMenu.setStatus(text, onclick);
		hide = hide || false;
		if (hide) {
			hideProgress(3000);
		}
	}

	/**
	 * Returns the timer value depending on the subscription
	 *
	 * ���������� �������� ������� � ����������� �� ��������
	 */
	function getTimer(time) {
		let speedDiv = 5;
		if (subEndTime < Date.now()) {
			speedDiv = 1.5;
		}
		return Math.max(Math.ceil(time / speedDiv + 1.5), 4);
	}


	/**
	 * Calculates HASH MD5 from string
	 *
	 * ����������� HASH MD5 �� ������
	 *
	 * [js-md5]{@link https://github.com/emn178/js-md5}
	 *
	 * @namespace md5
	 * @version 0.7.3
	 * @author Chen, Yi-Cyuan [emn178@gmail.com]
	 * @copyright Chen, Yi-Cyuan 2014-2017
	 * @license MIT
	 */
	!function(){"use strict";function t(t){if(t)d[0]=d[16]=d[1]=d[2]=d[3]=d[4]=d[5]=d[6]=d[7]=d[8]=d[9]=d[10]=d[11]=d[12]=d[13]=d[14]=d[15]=0,this.blocks=d,this.buffer8=l;else if(a){var r=new ArrayBuffer(68);this.buffer8=new Uint8Array(r),this.blocks=new Uint32Array(r)}else this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];this.h0=this.h1=this.h2=this.h3=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}var r="input is invalid type",e="object"==typeof window,i=e?window:{};i.JS_MD5_NO_WINDOW&&(e=!1);var s=!e&&"object"==typeof self,h=!i.JS_MD5_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;h?i=global:s&&(i=self);var f=!i.JS_MD5_NO_COMMON_JS&&"object"==typeof module&&module.exports,o="function"==typeof define&&define.amd,a=!i.JS_MD5_NO_ARRAY_BUFFER&&"undefined"!=typeof ArrayBuffer,n="0123456789abcdef".split(""),u=[128,32768,8388608,-2147483648],y=[0,8,16,24],c=["hex","array","digest","buffer","arrayBuffer","base64"],p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""),d=[],l;if(a){var A=new ArrayBuffer(68);l=new Uint8Array(A),d=new Uint32Array(A)}!i.JS_MD5_NO_NODE_JS&&Array.isArray||(Array.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)}),!a||!i.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW&&ArrayBuffer.isView||(ArrayBuffer.isView=function(t){return"object"==typeof t&&t.buffer&&t.buffer.constructor===ArrayBuffer});var b=function(r){return function(e){return new t(!0).update(e)[r]()}},v=function(){var r=b("hex");h&&(r=w(r)),r.create=function(){return new t},r.update=function(t){return r.create().update(t)};for(var e=0;e<c.length;++e){var i=c[e];r[i]=b(i)}return r},w=function(t){var e=eval("require('crypto')"),i=eval("require('buffer').Buffer"),s=function(s){if("string"==typeof s)return e.createHash("md5").update(s,"utf8").digest("hex");if(null===s||void 0===s)throw r;return s.constructor===ArrayBuffer&&(s=new Uint8Array(s)),Array.isArray(s)||ArrayBuffer.isView(s)||s.constructor===i?e.createHash("md5").update(new i(s)).digest("hex"):t(s)};return s};t.prototype.update=function(t){if(!this.finalized){var e,i=typeof t;if("string"!==i){if("object"!==i)throw r;if(null===t)throw r;if(a&&t.constructor===ArrayBuffer)t=new Uint8Array(t);else if(!(Array.isArray(t)||a&&ArrayBuffer.isView(t)))throw r;e=!0}for(var s,h,f=0,o=t.length,n=this.blocks,u=this.buffer8;f<o;){if(this.hashed&&(this.hashed=!1,n[0]=n[16],n[16]=n[1]=n[2]=n[3]=n[4]=n[5]=n[6]=n[7]=n[8]=n[9]=n[10]=n[11]=n[12]=n[13]=n[14]=n[15]=0),e)if(a)for(h=this.start;f<o&&h<64;++f)u[h++]=t[f];else for(h=this.start;f<o&&h<64;++f)n[h>>2]|=t[f]<<y[3&h++];else if(a)for(h=this.start;f<o&&h<64;++f)(s=t.charCodeAt(f))<128?u[h++]=s:s<2048?(u[h++]=192|s>>6,u[h++]=128|63&s):s<55296||s>=57344?(u[h++]=224|s>>12,u[h++]=128|s>>6&63,u[h++]=128|63&s):(s=65536+((1023&s)<<10|1023&t.charCodeAt(++f)),u[h++]=240|s>>18,u[h++]=128|s>>12&63,u[h++]=128|s>>6&63,u[h++]=128|63&s);else for(h=this.start;f<o&&h<64;++f)(s=t.charCodeAt(f))<128?n[h>>2]|=s<<y[3&h++]:s<2048?(n[h>>2]|=(192|s>>6)<<y[3&h++],n[h>>2]|=(128|63&s)<<y[3&h++]):s<55296||s>=57344?(n[h>>2]|=(224|s>>12)<<y[3&h++],n[h>>2]|=(128|s>>6&63)<<y[3&h++],n[h>>2]|=(128|63&s)<<y[3&h++]):(s=65536+((1023&s)<<10|1023&t.charCodeAt(++f)),n[h>>2]|=(240|s>>18)<<y[3&h++],n[h>>2]|=(128|s>>12&63)<<y[3&h++],n[h>>2]|=(128|s>>6&63)<<y[3&h++],n[h>>2]|=(128|63&s)<<y[3&h++]);this.lastByteIndex=h,this.bytes+=h-this.start,h>=64?(this.start=h-64,this.hash(),this.hashed=!0):this.start=h}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},t.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,r=this.lastByteIndex;t[r>>2]|=u[3&r],r>=56&&(this.hashed||this.hash(),t[0]=t[16],t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[14]=this.bytes<<3,t[15]=this.hBytes<<3|this.bytes>>>29,this.hash()}},t.prototype.hash=function(){var t,r,e,i,s,h,f=this.blocks;this.first?r=((r=((t=((t=f[0]-680876937)<<7|t>>>25)-271733879<<0)^(e=((e=(-271733879^(i=((i=(-1732584194^2004318071&t)+f[1]-117830708)<<12|i>>>20)+t<<0)&(-271733879^t))+f[2]-1126478375)<<17|e>>>15)+i<<0)&(i^t))+f[3]-1316259209)<<22|r>>>10)+e<<0:(t=this.h0,r=this.h1,e=this.h2,r=((r+=((t=((t+=((i=this.h3)^r&(e^i))+f[0]-680876936)<<7|t>>>25)+r<<0)^(e=((e+=(r^(i=((i+=(e^t&(r^e))+f[1]-389564586)<<12|i>>>20)+t<<0)&(t^r))+f[2]+606105819)<<17|e>>>15)+i<<0)&(i^t))+f[3]-1044525330)<<22|r>>>10)+e<<0),r=((r+=((t=((t+=(i^r&(e^i))+f[4]-176418897)<<7|t>>>25)+r<<0)^(e=((e+=(r^(i=((i+=(e^t&(r^e))+f[5]+1200080426)<<12|i>>>20)+t<<0)&(t^r))+f[6]-1473231341)<<17|e>>>15)+i<<0)&(i^t))+f[7]-45705983)<<22|r>>>10)+e<<0,r=((r+=((t=((t+=(i^r&(e^i))+f[8]+1770035416)<<7|t>>>25)+r<<0)^(e=((e+=(r^(i=((i+=(e^t&(r^e))+f[9]-1958414417)<<12|i>>>20)+t<<0)&(t^r))+f[10]-42063)<<17|e>>>15)+i<<0)&(i^t))+f[11]-1990404162)<<22|r>>>10)+e<<0,r=((r+=((t=((t+=(i^r&(e^i))+f[12]+1804603682)<<7|t>>>25)+r<<0)^(e=((e+=(r^(i=((i+=(e^t&(r^e))+f[13]-40341101)<<12|i>>>20)+t<<0)&(t^r))+f[14]-1502002290)<<17|e>>>15)+i<<0)&(i^t))+f[15]+1236535329)<<22|r>>>10)+e<<0,r=((r+=((i=((i+=(r^e&((t=((t+=(e^i&(r^e))+f[1]-165796510)<<5|t>>>27)+r<<0)^r))+f[6]-1069501632)<<9|i>>>23)+t<<0)^t&((e=((e+=(t^r&(i^t))+f[11]+643717713)<<14|e>>>18)+i<<0)^i))+f[0]-373897302)<<20|r>>>12)+e<<0,r=((r+=((i=((i+=(r^e&((t=((t+=(e^i&(r^e))+f[5]-701558691)<<5|t>>>27)+r<<0)^r))+f[10]+38016083)<<9|i>>>23)+t<<0)^t&((e=((e+=(t^r&(i^t))+f[15]-660478335)<<14|e>>>18)+i<<0)^i))+f[4]-405537848)<<20|r>>>12)+e<<0,r=((r+=((i=((i+=(r^e&((t=((t+=(e^i&(r^e))+f[9]+568446438)<<5|t>>>27)+r<<0)^r))+f[14]-1019803690)<<9|i>>>23)+t<<0)^t&((e=((e+=(t^r&(i^t))+f[3]-187363961)<<14|e>>>18)+i<<0)^i))+f[8]+1163531501)<<20|r>>>12)+e<<0,r=((r+=((i=((i+=(r^e&((t=((t+=(e^i&(r^e))+f[13]-1444681467)<<5|t>>>27)+r<<0)^r))+f[2]-51403784)<<9|i>>>23)+t<<0)^t&((e=((e+=(t^r&(i^t))+f[7]+1735328473)<<14|e>>>18)+i<<0)^i))+f[12]-1926607734)<<20|r>>>12)+e<<0,r=((r+=((h=(i=((i+=((s=r^e)^(t=((t+=(s^i)+f[5]-378558)<<4|t>>>28)+r<<0))+f[8]-2022574463)<<11|i>>>21)+t<<0)^t)^(e=((e+=(h^r)+f[11]+1839030562)<<16|e>>>16)+i<<0))+f[14]-35309556)<<23|r>>>9)+e<<0,r=((r+=((h=(i=((i+=((s=r^e)^(t=((t+=(s^i)+f[1]-1530992060)<<4|t>>>28)+r<<0))+f[4]+1272893353)<<11|i>>>21)+t<<0)^t)^(e=((e+=(h^r)+f[7]-155497632)<<16|e>>>16)+i<<0))+f[10]-1094730640)<<23|r>>>9)+e<<0,r=((r+=((h=(i=((i+=((s=r^e)^(t=((t+=(s^i)+f[13]+681279174)<<4|t>>>28)+r<<0))+f[0]-358537222)<<11|i>>>21)+t<<0)^t)^(e=((e+=(h^r)+f[3]-722521979)<<16|e>>>16)+i<<0))+f[6]+76029189)<<23|r>>>9)+e<<0,r=((r+=((h=(i=((i+=((s=r^e)^(t=((t+=(s^i)+f[9]-640364487)<<4|t>>>28)+r<<0))+f[12]-421815835)<<11|i>>>21)+t<<0)^t)^(e=((e+=(h^r)+f[15]+530742520)<<16|e>>>16)+i<<0))+f[2]-995338651)<<23|r>>>9)+e<<0,r=((r+=((i=((i+=(r^((t=((t+=(e^(r|~i))+f[0]-198630844)<<6|t>>>26)+r<<0)|~e))+f[7]+1126891415)<<10|i>>>22)+t<<0)^((e=((e+=(t^(i|~r))+f[14]-1416354905)<<15|e>>>17)+i<<0)|~t))+f[5]-57434055)<<21|r>>>11)+e<<0,r=((r+=((i=((i+=(r^((t=((t+=(e^(r|~i))+f[12]+1700485571)<<6|t>>>26)+r<<0)|~e))+f[3]-1894986606)<<10|i>>>22)+t<<0)^((e=((e+=(t^(i|~r))+f[10]-1051523)<<15|e>>>17)+i<<0)|~t))+f[1]-2054922799)<<21|r>>>11)+e<<0,r=((r+=((i=((i+=(r^((t=((t+=(e^(r|~i))+f[8]+1873313359)<<6|t>>>26)+r<<0)|~e))+f[15]-30611744)<<10|i>>>22)+t<<0)^((e=((e+=(t^(i|~r))+f[6]-1560198380)<<15|e>>>17)+i<<0)|~t))+f[13]+1309151649)<<21|r>>>11)+e<<0,r=((r+=((i=((i+=(r^((t=((t+=(e^(r|~i))+f[4]-145523070)<<6|t>>>26)+r<<0)|~e))+f[11]-1120210379)<<10|i>>>22)+t<<0)^((e=((e+=(t^(i|~r))+f[2]+718787259)<<15|e>>>17)+i<<0)|~t))+f[9]-343485551)<<21|r>>>11)+e<<0,this.first?(this.h0=t+1732584193<<0,this.h1=r-271733879<<0,this.h2=e-1732584194<<0,this.h3=i+271733878<<0,this.first=!1):(this.h0=this.h0+t<<0,this.h1=this.h1+r<<0,this.h2=this.h2+e<<0,this.h3=this.h3+i<<0)},t.prototype.hex=function(){this.finalize();var t=this.h0,r=this.h1,e=this.h2,i=this.h3;return n[t>>4&15]+n[15&t]+n[t>>12&15]+n[t>>8&15]+n[t>>20&15]+n[t>>16&15]+n[t>>28&15]+n[t>>24&15]+n[r>>4&15]+n[15&r]+n[r>>12&15]+n[r>>8&15]+n[r>>20&15]+n[r>>16&15]+n[r>>28&15]+n[r>>24&15]+n[e>>4&15]+n[15&e]+n[e>>12&15]+n[e>>8&15]+n[e>>20&15]+n[e>>16&15]+n[e>>28&15]+n[e>>24&15]+n[i>>4&15]+n[15&i]+n[i>>12&15]+n[i>>8&15]+n[i>>20&15]+n[i>>16&15]+n[i>>28&15]+n[i>>24&15]},t.prototype.toString=t.prototype.hex,t.prototype.digest=function(){this.finalize();var t=this.h0,r=this.h1,e=this.h2,i=this.h3;return[255&t,t>>8&255,t>>16&255,t>>24&255,255&r,r>>8&255,r>>16&255,r>>24&255,255&e,e>>8&255,e>>16&255,e>>24&255,255&i,i>>8&255,i>>16&255,i>>24&255]},t.prototype.array=t.prototype.digest,t.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(16),r=new Uint32Array(t);return r[0]=this.h0,r[1]=this.h1,r[2]=this.h2,r[3]=this.h3,t},t.prototype.buffer=t.prototype.arrayBuffer,t.prototype.base64=function(){for(var t,r,e,i="",s=this.array(),h=0;h<15;)t=s[h++],r=s[h++],e=s[h++],i+=p[t>>>2]+p[63&(t<<4|r>>>4)]+p[63&(r<<2|e>>>6)]+p[63&e];return t=s[h],i+=p[t>>>2]+p[t<<4&63]+"=="};var _=v();f?module.exports=_:(i.md5=_,o&&define(function(){return _}))}();

	/**
	 * Script for beautiful dialog boxes
	 *
	 * ������ ��� �������� ���������� ������
	 */
	const popup = new (function () {
		this.popUp,
			this.downer,
			this.middle,
			this.msgText,
			this.buttons = [];
		this.checkboxes = [];

		function init() {
			addStyle();
			addBlocks();
		}

		const addStyle = () => {
			let style = document.createElement('style');
			style.innerText = `
	.PopUp_ {
		position: absolute;
		min-width: 300px;
		max-width: 500px;
		max-height: 500px;
		background-color: #190e08e6;
		z-index: 10001;
		top: 169px;
		left: 345px;
		border: 3px #ce9767 solid;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 15px 12px;
	}

	.PopUp_back {
		position: absolute;
		background-color: #00000066;
		width: 100%;
		height: 100%;
		z-index: 10000;
		top: 0;
		left: 0;
	}

	.PopUp_close {
		width: 40px;
		height: 40px;
		position: absolute;
		right: -18px;
		top: -18px;
		border: 3px solid #c18550;
		border-radius: 20px;
		background: radial-gradient(circle, rgba(190,30,35,1) 0%, rgba(0,0,0,1) 100%);
		background-position-y: 3px;
		box-shadow: -1px 1px 3px black;
		cursor: pointer;
		box-sizing: border-box;
	}

	.PopUp_close:hover {
		filter: brightness(1.2);
	}

	.PopUp_crossClose {
		width: 100%;
		height: 100%;
		background-size: 65%;
		background-position: center;
		background-repeat: no-repeat;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%23f4cd73' d='M 0.826 12.559 C 0.431 12.963 3.346 15.374 3.74 14.97 C 4.215 15.173 8.167 10.457 7.804 10.302 C 7.893 10.376 11.454 14.64 11.525 14.372 C 12.134 15.042 15.118 12.086 14.638 11.689 C 14.416 11.21 10.263 7.477 10.402 7.832 C 10.358 7.815 11.731 7.101 14.872 3.114 C 14.698 2.145 13.024 1.074 12.093 1.019 C 11.438 0.861 8.014 5.259 8.035 5.531 C 7.86 5.082 3.61 1.186 3.522 1.59 C 2.973 1.027 0.916 4.611 1.17 4.873 C 0.728 4.914 5.088 7.961 5.61 7.995 C 5.225 7.532 0.622 12.315 0.826 12.559 Z'/%3e%3c/svg%3e")
	}

	.PopUp_blocks {
		width: 100%;
		height: 50%;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
	}

	.PopUp_blocks:last-child {
		margin-top: 25px;
	}

	.PopUp_buttons {
		display: flex;
		margin: 10px 12px;
		flex-direction: column;
	}

	.PopUp_button {
		background-color: #52A81C;
		border-radius: 5px;
		box-shadow: inset 0px -4px 10px, inset 0px 3px 2px #99fe20, 0px 0px 4px, 0px -3px 1px #d7b275, 0px 0px 0px 3px #ce9767;
		cursor: pointer;
		padding: 5px 15px 7px;
	}

	.PopUp_input {
		text-align: center;
		font-size: 16px;
		height: 27px;
		border: 1px solid #cf9250;
		border-radius: 9px 9px 0px 0px;
		background: transparent;
		color: #fce1ac;
		padding: 1px 10px;
		box-sizing: border-box;
		box-shadow: 0px 0px 4px, 0px 0px 0px 3px #ce9767;
	}

	.PopUp_checkboxes {
		display: flex;
		flex-direction: column;
		margin: 15px 15px -5px 15px;
		align-items: flex-start;
	}

	.PopUp_ContCheckbox {
		margin: 2px 0px;
	}

	.PopUp_checkbox {
		position: absolute;
		z-index: -1;
		opacity: 0;
	}
	.PopUp_checkbox+label {
		display: inline-flex;
		align-items: center;
		user-select: none;

		font-size: 15px;
		font-family: sans-serif;
		font-weight: 600;
		font-stretch: condensed;
		letter-spacing: 1px;
		color: #fce1ac;
		text-shadow: 0px 0px 1px;
	}
	.PopUp_checkbox+label::before {
		content: '';
		display: inline-block;
		width: 20px;
		height: 20px;
		border: 1px solid #cf9250;
		border-radius: 7px;
		margin-right: 7px;
	}
	.PopUp_checkbox:checked+label::before {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2388cb13' d='M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z'/%3e%3c/svg%3e");
	}

	.PopUp_input::placeholder {
		color: #fce1ac75;
	}

	.PopUp_input:focus {
		outline: 0;
	}

	.PopUp_input + .PopUp_button {
		border-radius: 0px 0px 5px 5px;
		padding: 2px 18px 5px;
	}

	.PopUp_button:hover {
		filter: brightness(1.2);
	}

	.PopUp_text {
		font-size: 22px;
		font-family: sans-serif;
		font-weight: 600;
		font-stretch: condensed;
		letter-spacing: 1px;
		text-align: center;
	}

	.PopUp_buttonText {
		color: #E4FF4C;
		text-shadow: 0px 1px 2px black;
	}

	.PopUp_msgText {
		color: #FDE5B6;
		text-shadow: 0px 0px 2px;
	}

	.PopUp_hideBlock {
		display: none;
	}
	`;
			document.head.appendChild(style);
		}

		const addBlocks = () => {
			this.back = document.createElement('div');
			this.back.classList.add('PopUp_back');
			this.back.classList.add('PopUp_hideBlock');
			document.body.append(this.back);

			this.popUp = document.createElement('div');
			this.popUp.classList.add('PopUp_');
			this.back.append(this.popUp);

			let upper = document.createElement('div')
			upper.classList.add('PopUp_blocks');
			this.popUp.append(upper);

			this.middle = document.createElement('div')
			this.middle.classList.add('PopUp_blocks');
			this.middle.classList.add('PopUp_checkboxes');
			this.popUp.append(this.middle);

			this.downer = document.createElement('div')
			this.downer.classList.add('PopUp_blocks');
			this.popUp.append(this.downer);

			this.msgText = document.createElement('div');
			this.msgText.classList.add('PopUp_text', 'PopUp_msgText');
			upper.append(this.msgText);
		}

		this.showBack = function () {
			this.back.classList.remove('PopUp_hideBlock');
		}

		this.hideBack = function () {
			this.back.classList.add('PopUp_hideBlock');
		}

		this.show = function () {
			if (this.checkboxes.length) {
				this.middle.classList.remove('PopUp_hideBlock');
			}
			this.showBack();
			this.popUp.classList.remove('PopUp_hideBlock');
			this.popUp.style.left = (window.innerWidth - this.popUp.offsetWidth) / 2 + 'px';
			this.popUp.style.top = (window.innerHeight - this.popUp.offsetHeight) / 3 + 'px';
		}

		this.hide = function () {
			this.hideBack();
			this.popUp.classList.add('PopUp_hideBlock');
		}

		this.addAnyButton = (option) => {
			const contButton = document.createElement('div');
			contButton.classList.add('PopUp_buttons');
			this.downer.append(contButton);

			let inputField = {
				value: option.result || option.default
			}
			if (option.isInput) {
				inputField = document.createElement('input');
				inputField.type = 'text';
				if (option.placeholder) {
					inputField.placeholder = option.placeholder;
				}
				if (option.default) {
					inputField.value = option.default;
				}
				inputField.classList.add('PopUp_input');
				contButton.append(inputField);
			}

			const button = document.createElement('div');
			button.classList.add('PopUp_button');
			button.title = option.title || '';
			contButton.append(button);

			const buttonText = document.createElement('div');
			buttonText.classList.add('PopUp_text', 'PopUp_buttonText');
			buttonText.innerText = option.msg;
			button.append(buttonText);

			return { button, contButton, inputField };
		}

		this.addCloseButton = () => {
			let button = document.createElement('div')
			button.classList.add('PopUp_close');
			this.popUp.append(button);

			let crossClose = document.createElement('div')
			crossClose.classList.add('PopUp_crossClose');
			button.append(crossClose);

			return { button, contButton: button };
		}

		this.addButton = (option, buttonClick) => {

			const { button, contButton, inputField } = option.isClose ? this.addCloseButton() : this.addAnyButton(option);

			button.addEventListener('click', () => {
				let result = '';
				if (option.isInput) {
					result = inputField.value;
				}
				buttonClick(result);
			});

			this.buttons.push(contButton);
		}

		this.clearButtons = () => {
			while (this.buttons.length) {
				this.buttons.pop().remove();
			}
		}

		this.addCheckBox = (checkBox) => {
			const contCheckbox = document.createElement('div');
			contCheckbox.classList.add('PopUp_ContCheckbox');
			this.middle.append(contCheckbox);

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.id = 'PopUpCheckbox' + this.checkboxes.length;
			checkbox.dataset.name = checkBox.name;
			checkbox.checked = checkBox.checked;
			checkbox.label = checkBox.label;
			checkbox.title = checkBox.title || '';
			checkbox.classList.add('PopUp_checkbox');
			contCheckbox.appendChild(checkbox)

			const checkboxLabel = document.createElement('label');
			checkboxLabel.innerText = checkBox.label;
			checkboxLabel.title = checkBox.title || '';
			checkboxLabel.setAttribute('for', checkbox.id);
			contCheckbox.appendChild(checkboxLabel);

			this.checkboxes.push(checkbox);
		}

		this.clearCheckBox = () => {
			this.middle.classList.add('PopUp_hideBlock');
			while (this.checkboxes.length) {
				this.checkboxes.pop().parentNode.remove();
			}
		}

		this.setMsgText = (text) => {
			this.msgText.innerHTML = text;
		}

		this.getCheckBoxes = () => {
			const checkBoxes = [];

			for (const checkBox of this.checkboxes) {
				checkBoxes.push({
					name: checkBox.dataset.name,
					label: checkBox.label,
					checked: checkBox.checked
				});
			}

			return checkBoxes;
		}

		this.confirm = async (msg, buttOpt, checkBoxes = []) => {
			this.clearButtons();
			this.clearCheckBox();
			return new Promise((complete, failed) => {
				this.setMsgText(msg);
				if (!buttOpt) {
					buttOpt = [{ msg: 'Ok', result: true, isInput: false }];
				}
				for (const checkBox of checkBoxes) {
					this.addCheckBox(checkBox);
				}
				for (let butt of buttOpt) {
					this.addButton(butt, (result) => {
						result = result || butt.result;
						complete(result);
						popup.hide();
					});
				}
				this.show();
			});
		}

		document.addEventListener('DOMContentLoaded', init);
	});
	/**
	 * Script control panel
	 *
	 * ������ ���������� ��������
	 */
	const scriptMenu = new (function () {

		this.mainMenu,
			this.buttons = [],
			this.checkboxes = [];
		this.option = {
			showMenu: false,
			showDetails: {}
		};

		this.init = function (option = {}) {
			this.option = Object.assign(this.option, option);
			this.option.showDetails = this.loadShowDetails();
			addStyle();
			addBlocks();
		}

		const addStyle = () => {
			style = document.createElement('style');
			style.innerText = `
	.scriptMenu_status {
		position: absolute;
		z-index: 10001;
		/* max-height: 30px; */
		top: -1px;
		left: 30%;
		cursor: pointer;
		border-radius: 0px 0px 10px 10px;
		background: #190e08e6;
		border: 1px #ce9767 solid;
		font-size: 18px;
		font-family: sans-serif;
		font-weight: 600;
		font-stretch: condensed;
		letter-spacing: 1px;
		color: #fce1ac;
		text-shadow: 0px 0px 1px;
		transition: 0.5s;
		padding: 2px 10px 3px;
	}
	.scriptMenu_statusHide {
		top: -35px;
		height: 30px;
		overflow: hidden;
	}
	.scriptMenu_label {
		position: absolute;
		top: 30%;
		left: -4px;
		z-index: 9999;
		cursor: pointer;
		width: 30px;
		height: 30px;
		background: radial-gradient(circle, #47a41b 0%, #1a2f04 100%);
		border: 1px solid #1a2f04;
		border-radius: 5px;
		box-shadow:
		inset 0px 2px 4px #83ce26,
		inset 0px -4px 6px #1a2f04,
		0px 0px 2px black,
		0px 0px 0px 2px	#ce9767;
	}
	.scriptMenu_label:hover {
	filter: brightness(1.2);
	}
	.scriptMenu_arrowLabel {
		width: 100%;
		height: 100%;
		background-size: 75%;
		background-position: center;
		background-repeat: no-repeat;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%2388cb13' d='M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z'/%3e%3cpath fill='%2388cb13' d='M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z'/%3e%3c/svg%3e");
		box-shadow: 0px 1px 2px #000;
		border-radius: 5px;
		filter: drop-shadow(0px 1px 2px #000D);
	}
	.scriptMenu_main {
		position: absolute;
		max-width: 285px;
		z-index: 9999;
		top: 50%;
		transform: translateY(-40%);
		background: #190e08e6;
		border: 1px #ce9767 solid;
		border-radius: 0px 10px 10px 0px;
		border-left: none;
		padding: 5px 10px 5px 5px;
		box-sizing: border-box;
		font-size: 15px;
		font-family: sans-serif;
		font-weight: 600;
		font-stretch: condensed;
		letter-spacing: 1px;
		color: #fce1ac;
		text-shadow: 0px 0px 1px;
		transition: 1s;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
	}
	.scriptMenu_showMenu {
		display: none;
	}
	.scriptMenu_showMenu:checked~.scriptMenu_main {
		left: 0px;
	}
	.scriptMenu_showMenu:not(:checked)~.scriptMenu_main {
		left: -300px;
	}
	.scriptMenu_divInput {
		margin: 2px;
	}
	.scriptMenu_divInputText {
		margin: 2px;
		align-self: center;
		display: flex;
	}
	.scriptMenu_checkbox {
		position: absolute;
		z-index: -1;
		opacity: 0;
	}
	.scriptMenu_checkbox+label {
		display: inline-flex;
		align-items: center;
		user-select: none;
	}
	.scriptMenu_checkbox+label::before {
		content: '';
		display: inline-block;
		width: 20px;
		height: 20px;
		border: 1px solid #cf9250;
		border-radius: 7px;
		margin-right: 7px;
	}
	.scriptMenu_checkbox:checked+label::before {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2388cb13' d='M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z'/%3e%3c/svg%3e");
	}
	.scriptMenu_close {
		width: 40px;
		height: 40px;
		position: absolute;
		right: -18px;
		top: -18px;
		border: 3px solid #c18550;
		border-radius: 20px;
		background: radial-gradient(circle, rgba(190,30,35,1) 0%, rgba(0,0,0,1) 100%);
		background-position-y: 3px;
		box-shadow: -1px 1px 3px black;
		cursor: pointer;
		box-sizing: border-box;
	}
	.scriptMenu_close:hover {
		filter: brightness(1.2);
	}
	.scriptMenu_crossClose {
		width: 100%;
		height: 100%;
		background-size: 65%;
		background-position: center;
		background-repeat: no-repeat;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%23f4cd73' d='M 0.826 12.559 C 0.431 12.963 3.346 15.374 3.74 14.97 C 4.215 15.173 8.167 10.457 7.804 10.302 C 7.893 10.376 11.454 14.64 11.525 14.372 C 12.134 15.042 15.118 12.086 14.638 11.689 C 14.416 11.21 10.263 7.477 10.402 7.832 C 10.358 7.815 11.731 7.101 14.872 3.114 C 14.698 2.145 13.024 1.074 12.093 1.019 C 11.438 0.861 8.014 5.259 8.035 5.531 C 7.86 5.082 3.61 1.186 3.522 1.59 C 2.973 1.027 0.916 4.611 1.17 4.873 C 0.728 4.914 5.088 7.961 5.61 7.995 C 5.225 7.532 0.622 12.315 0.826 12.559 Z'/%3e%3c/svg%3e")
	}
	.scriptMenu_button {
		user-select: none;
		border-radius: 5px;
		cursor: pointer;
		padding: 5px 14px 8px;
		margin: 4px;
		background: radial-gradient(circle, rgba(165,120,56,1) 80%, rgba(0,0,0,1) 110%);
		box-shadow: inset 0px -4px 6px #442901, inset 0px 1px 6px #442901, inset 0px 0px 6px, 0px 0px 4px, 0px 0px 0px 2px #ce9767;
	}
	.scriptMenu_button:hover {
		filter: brightness(1.2);
	}
	.scriptMenu_buttonText {
		color: #fce5b7;
		text-shadow: 0px 1px 2px black;
		text-align: center;
	}
	.scriptMenu_header {
		text-align: center;
		align-self: center;
		font-size: 15px;
		margin: 0px 15px;
	}
	.scriptMenu_header a {
		color: #fce5b7;
		text-decoration: none;
	}
	.scriptMenu_InputText {
		text-align: center;
		width: 130px;
		height: 24px;
		border: 1px solid #cf9250;
		border-radius: 9px;
		background: transparent;
		color: #fce1ac;
		padding: 0px 10px;
		box-sizing: border-box;
	}
	.scriptMenu_InputText:focus {
		filter: brightness(1.2);
		outline: 0;
	}
	.scriptMenu_InputText::placeholder {
		color: #fce1ac75;
	}
	.scriptMenu_Summary {
		cursor: pointer;
		margin-left: 7px;
	}
	.scriptMenu_Details {
		align-self: center;
	}
`;
			document.head.appendChild(style);
		}

		const addBlocks = () => {
			const main = document.createElement('div');
			document.body.appendChild(main);

			this.status = document.createElement('div');
			this.status.classList.add('scriptMenu_status');
			this.setStatus('');
			main.appendChild(this.status);

			const label = document.createElement('label');
			label.classList.add('scriptMenu_label');
			label.setAttribute('for', 'checkbox_showMenu');
			main.appendChild(label);

			const arrowLabel = document.createElement('div');
			arrowLabel.classList.add('scriptMenu_arrowLabel');
			label.appendChild(arrowLabel);

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.id = 'checkbox_showMenu';
			checkbox.checked = this.option.showMenu;
			checkbox.classList.add('scriptMenu_showMenu');
			main.appendChild(checkbox);

			this.mainMenu = document.createElement('div');
			this.mainMenu.classList.add('scriptMenu_main');
			main.appendChild(this.mainMenu);

			const closeButton = document.createElement('label');
			closeButton.classList.add('scriptMenu_close');
			closeButton.setAttribute('for', 'checkbox_showMenu');
			this.mainMenu.appendChild(closeButton);

			const crossClose = document.createElement('div');
			crossClose.classList.add('scriptMenu_crossClose');
			closeButton.appendChild(crossClose);
		}

		this.setStatus = (text, onclick) => {
			if (!text) {
				this.status.classList.add('scriptMenu_statusHide');
			} else {
				this.status.classList.remove('scriptMenu_statusHide');
				this.status.innerHTML = text;
			}

			if (typeof onclick == 'function') {
				this.status.addEventListener("click", onclick, {
					once: true
				});
			}
		}

		/**
		 * Adding a text element
		 *
		 * ���������� ���������� ��������
		 * @param {String} text text // �����
		 * @param {Function} func Click function // ������� �� �����
		 * @param {HTMLDivElement} main parent // ��������
		 */
		this.addHeader = (text, func, main) => {
			main = main || this.mainMenu;
			const header = document.createElement('div');
			header.classList.add('scriptMenu_header');
			header.innerHTML = text;
			if (typeof func == 'function') {
				header.addEventListener('click', func);
			}
			main.appendChild(header);
		}

		/**
		 * Adding a text element
		 *
		 * ���������� ���������� ��������
		 * @param {String} text text // �����
		 * @param {Function} func Click function // ������� �� �����
		 * @param {HTMLDivElement} main parent // ��������
		 */
		this.addEndFarmHeader = (text, func, main) => {
			main = main || this.mainMenu;
			const header = document.createElement('div');
			header.classList.add('scriptMenu_header');
			header.classList.add('endFarm_header');
			header.innerHTML = text;
			if (typeof func == 'function') {
				header.addEventListener('click', func);
			}
			main.appendChild(header);
		}

		/**
		 * Adding a button
		 *
		 * ���������� ������
		 * @param {String} text
		 * @param {Function} func
		 * @param {String} title
		 * @param {HTMLDivElement} main parent // ��������
		 */
		this.addButton = (text, func, title, main) => {
			main = main || this.mainMenu;
			const button = document.createElement('div');
			button.classList.add('scriptMenu_button');
			button.title = title;
			button.addEventListener('click', func);
			main.appendChild(button);

			const buttonText = document.createElement('div');
			buttonText.classList.add('scriptMenu_buttonText');
			buttonText.innerText = text;
			button.appendChild(buttonText);
			this.buttons.push(button);

			return button;
		}

		/**
		 * Adding checkbox
		 *
		 * ���������� ��������
		 * @param {String} label
		 * @param {String} title
		 * @param {HTMLDivElement} main parent // ��������
		 * @returns
		 */
		this.addCheckbox = (label, title, main) => {
			main = main || this.mainMenu;
			const divCheckbox = document.createElement('div');
			divCheckbox.classList.add('scriptMenu_divInput');
			divCheckbox.title = title;
			main.appendChild(divCheckbox);

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.id = 'scriptMenuCheckbox' + this.checkboxes.length;
			checkbox.classList.add('scriptMenu_checkbox');
			divCheckbox.appendChild(checkbox)

			const checkboxLabel = document.createElement('label');
			checkboxLabel.innerText = label;
			checkboxLabel.setAttribute('for', checkbox.id);
			divCheckbox.appendChild(checkboxLabel);

			this.checkboxes.push(checkbox);
			return checkbox;
		}

		/**
		 * Adding input field
		 *
		 * ���������� ���� �����
		 * @param {String} title
		 * @param {String} placeholder
		 * @param {HTMLDivElement} main parent // ��������
		 * @returns
		 */
		this.addInputText = (title, placeholder, main) => {
			main = main || this.mainMenu;
			const divInputText = document.createElement('div');
			divInputText.classList.add('scriptMenu_divInputText');
			divInputText.title = title;
			main.appendChild(divInputText);

			const newInputText = document.createElement('input');
			newInputText.type = 'text';
			if (placeholder) {
				newInputText.placeholder = placeholder;
			}
			newInputText.classList.add('scriptMenu_InputText');
			divInputText.appendChild(newInputText)
			return newInputText;
		}

		/**
		 * Adds a dropdown block
		 *
		 * ��������� �������������� ����
		 * @param {String} summary
		 * @param {String} name
		 * @returns
		 */
		this.addDetails = (summaryText, name = null) => {
			const details = document.createElement('details');
			details.classList.add('scriptMenu_Details');
			this.mainMenu.appendChild(details);

			const summary = document.createElement('summary');
			summary.classList.add('scriptMenu_Summary');
			summary.innerText = summaryText;
			if (name) {
				const self = this;
				details.open = this.option.showDetails[name];
				details.dataset.name = name;
				summary.addEventListener('click', () => {
					self.option.showDetails[details.dataset.name] = !details.open;
					self.saveShowDetails(self.option.showDetails);
				});
			}
			details.appendChild(summary);

			return details;
		}

		/**
		 * Saving the expanded state of the details blocks
		 *
		 * ���������� ��������� ������������ ������ details
		 * @param {*} value
		 */
		this.saveShowDetails = (value) => {
			localStorage.setItem('scriptMenu_showDetails', JSON.stringify(value));
		}

		/**
		 * Loading the state of expanded blocks details
		 *
		 * �������� ��������� ������������ ������ details
		 * @returns
		 */
		this.loadShowDetails = () => {
			let showDetails = localStorage.getItem('scriptMenu_showDetails');

			if (!showDetails) {
				return {};
			}

			try {
				showDetails = JSON.parse(showDetails);
			} catch (e) {
				return {};
			}

			return showDetails;
		}
	});
	/**
	 * Game Library
	 *
	 * ������� ����������
	 */
	class Library {
		defaultLibUrl = 'https://heroesru-a.akamaihd.net/vk/v1101/lib/lib.json';

		constructor() {
			if (!Library.instance) {
				Library.instance = this;
			}

			return Library.instance;
		}

		async load() {
			try {
				await this.getUrlLib();
				console.log(this.defaultLibUrl);
				this.data = await fetch(this.defaultLibUrl).then(e => e.json())
			} catch (error) {
				console.error('�� ������� ��������� ����������', error)
			}
		}

		async getUrlLib() {
			try {
				const db = new Database('hw_cache', 'cache');
				await db.open();
				const cacheLibFullUrl = await db.get('lib/lib.json.gz', false);
				this.defaultLibUrl = cacheLibFullUrl.fullUrl.split('.gz').shift();
			} catch(e) {}
		}

		getData(id) {
			return this.data[id];
		}
	}

	this.lib = new Library();
	/**
	 * Database
	 *
	 * ���� ������
	 */
	class Database {
		constructor(dbName, storeName) {
			this.dbName = dbName;
			this.storeName = storeName;
			this.db = null;
		}

		async open() {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(this.dbName);

				request.onerror = () => {
					reject(new Error(`Failed to open database ${this.dbName}`));
				};

				request.onsuccess = () => {
					this.db = request.result;
					resolve();
				};

				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains(this.storeName)) {
						db.createObjectStore(this.storeName);
					}
				};
			});
		}

		async set(key, value) {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction([this.storeName], 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const request = store.put(value, key);

				request.onerror = () => {
					reject(new Error(`Failed to save value with key ${key}`));
				};

				request.onsuccess = () => {
					resolve();
				};
			});
		}

		async get(key, def) {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction([this.storeName], 'readonly');
				const store = transaction.objectStore(this.storeName);
				const request = store.get(key);

				request.onerror = () => {
					resolve(def);
				};

				request.onsuccess = () => {
					resolve(request.result);
				};
			});
		}

		async delete(key) {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction([this.storeName], 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const request = store.delete(key);

				request.onerror = () => {
					reject(new Error(`Failed to delete value with key ${key}`));
				};

				request.onsuccess = () => {
					resolve();
				};
			});
		}
	}

	/**
	 * Returns the stored value
	 *
	 * ���������� ����������� ��������
	 */
	function getSaveVal(saveName, def) {
		const result = storage.get(saveName, def);
		return result;
	}

	/**
	 * Stores value
	 *
	 * ��������� ��������
	 */
	function setSaveVal(saveName, value) {
		storage.set(saveName, value);
	}

	/**
	 * Database initialization
	 *
	 * ������������� ���� ������
	 */
	const db = new Database(GM_info.script.name, 'settings');

	/**
	 * Data store
	 *
	 * ��������� ������
	 */
	const storage = {
		userId: 0,
		/**
		 * Default values
		 *
		 * �������� �� ���������
		 */
		values: [
			...Object.entries(checkboxes).map(e => ({ [e[0]]: e[1].default })),
			...Object.entries(inputs).map(e => ({ [e[0]]: e[1].default })),
		].reduce((acc, obj) => ({ ...acc, ...obj }), {}),
		name: GM_info.script.name,
		get: function (key, def) {
			if (key in this.values) {
				return this.values[key];
			}
			return def;
		},
		set: function (key, value) {
			this.values[key] = value;
			db.set(this.userId, this.values).catch(
				e => null
			);
			localStorage[this.name + ':' + key] = value;
		},
		delete: function (key) {
			delete this.values[key];
			db.set(this.userId, this.values);
			delete localStorage[this.name + ':' + key];
		}
	}

	/**
	 * Returns all keys from localStorage that start with prefix (for migration)
	 *
	 * ���������� ��� ����� �� localStorage ������� ���������� � prefix (��� ��������)
	 */
	function getAllValuesStartingWith(prefix) {
		const values = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key.startsWith(prefix)) {
				const val = localStorage.getItem(key);
				const keyValue = key.split(':')[1];
				values.push({ key: keyValue, val });
			}
		}
		return values;
	}

	/**
	 * Opens or migrates to a database
	 *
	 * ��������� ��� ��������� � ���� ������
	 */
	async function openOrMigrateDatabase(userId) {
		storage.userId = userId;
		try {
			await db.open();
		} catch(e) {
			return;
		}
		let settings = await db.get(userId, false);

		if (settings) {
			storage.values = settings;
			return;
		}

		const values = getAllValuesStartingWith(GM_info.script.name);
		for (const value of values) {
			let val = null;
			try {
				val = JSON.parse(value.val);
			} catch {
				break;
			}
			storage.values[value.key] = val;
		}
		await db.set(userId, storage.values);
	}

	/**
	 * Sending expeditions
	 *
	 * �������� ����������
	 */
	function checkExpedition() {
		return new Promise((resolve, reject) => {
			const expedition = new Expedition(resolve, reject);
			expedition.start();
		});
	}

	class Expedition {
		checkExpedInfo = {
			calls: [{
				name: "expeditionGet",
				args: {},
				ident: "expeditionGet"
			}, {
				name: "heroGetAll",
				args: {},
				ident: "heroGetAll"
			}]
		}

		constructor(resolve, reject) {
			this.resolve = resolve;
			this.reject = reject;
		}

		async start() {
			const data = await Send(JSON.stringify(this.checkExpedInfo));

			const expedInfo = data.results[0].result.response;
			const dataHeroes = data.results[1].result.response;
			const dataExped = { useHeroes: [], exped: [] };
			const calls = [];

			/**
			 * Adding expeditions to collect
			 * ��������� ���������� ��� �����
			 */
			for (var n in expedInfo) {
				const exped = expedInfo[n];
				const dateNow = (Date.now() / 1000);
				if (exped.status == 2 && exped.endTime != 0 && dateNow > exped.endTime) {
					calls.push({
						name: "expeditionFarm",
						args: { expeditionId: exped.id },
						ident: "expeditionFarm_" + exped.id
					});
				} else {
					dataExped.useHeroes = dataExped.useHeroes.concat(exped.heroes);
				}
				if (exped.status == 1) {
					dataExped.exped.push({ id: exped.id, power: exped.power });
				}
			}
			dataExped.exped = dataExped.exped.sort((a, b) => (b.power - a.power));

			/**
			 * Putting together a list of heroes
			 * �������� ������ ������
			 */
			const heroesArr = [];
			for (let n in dataHeroes) {
				const hero = dataHeroes[n];
				if (hero.xp > 0 && !dataExped.useHeroes.includes(hero.id)) {
					heroesArr.push({ id: hero.id, power: hero.power })
				}
			}

			/**
			 * Adding expeditions to send
			 * ��������� ���������� ��� ��������
			 */
			heroesArr.sort((a, b) => (a.power - b.power));
			for (const exped of dataExped.exped) {
				let heroesIds = this.selectionHeroes(heroesArr, exped.power);
				if (heroesIds && heroesIds.length > 4) {
					for (let q in heroesArr) {
						if (heroesIds.includes(heroesArr[q].id)) {
							delete heroesArr[q];
						}
					}
					calls.push({
						name: "expeditionSendHeroes",
						args: {
							expeditionId: exped.id,
							heroes: heroesIds
						},
						ident: "expeditionSendHeroes_" + exped.id
					});
				}
			}

			await Send(JSON.stringify({ calls }));
			this.end();
		}

		/**
		 * Selection of heroes for expeditions
		 *
		 * ������ ������ ��� ����������
		 */
		selectionHeroes(heroes, power) {
			const resultHeroers = [];
			const heroesIds = [];
			for (let q = 0; q < 5; q++) {
				for (let i in heroes) {
					let hero = heroes[i];
					if (heroesIds.includes(hero.id)) {
						continue;
					}

					const summ = resultHeroers.reduce((acc, hero) => acc + hero.power, 0);
					const need = Math.round((power - summ) / (5 - resultHeroers.length));
					if (hero.power > need) {
						resultHeroers.push(hero);
						heroesIds.push(hero.id);
						break;
					}
				}
			}

			const summ = resultHeroers.reduce((acc, hero) => acc + hero.power, 0);
			if (summ < power) {
				return false;
			}
			return heroesIds;
		}

		/**
		 * Ends expedition script
		 *
		 * ��������� ������ ����������
		 */
		end() {
			setProgress(I18N('EXPEDITIONS_SENT'), true);
			this.resolve()
		}
	}

	/**
	 * Walkthrough of the dungeon
	 *
	 * ����������� ����������
	 */
	function testDungeon() {
		return new Promise((resolve, reject) => {
			const dung = new executeDungeon(resolve, reject);
			const titanit = getInput('countTitanit');
			dung.start(titanit);
		});
	}

	/**
	 * Walkthrough of the dungeon
	 *
	 * ����������� ����������
	 */
	function executeDungeon(resolve, reject) {
		dungeonActivity = 0;
		maxDungeonActivity = 150;

		titanGetAll = [];

		teams = {
			heroes: [],
			earth: [],
			fire: [],
			neutral: [],
			water: [],
		}

		titanStats = [];

		titansStates = {};

		callsExecuteDungeon = {
			calls: [{
				name: "dungeonGetInfo",
				args: {},
				ident: "dungeonGetInfo"
			}, {
				name: "teamGetAll",
				args: {},
				ident: "teamGetAll"
			}, {
				name: "teamGetFavor",
				args: {},
				ident: "teamGetFavor"
			}, {
				name: "clanGetInfo",
				args: {},
				ident: "clanGetInfo"
			}, {
				name: "titanGetAll",
				args: {},
				ident: "titanGetAll"
			}, {
				name: "inventoryGet",
				args: {},
				ident: "inventoryGet"
			}]
		}

		this.start = function(titanit) {
			maxDungeonActivity = titanit || getInput('countTitanit');
			send(JSON.stringify(callsExecuteDungeon), startDungeon);
		}

		/**
		 * Getting data on the dungeon
		 *
		 * �������� ������ �� ����������
		 */
		function startDungeon(e) {
			res = e.results;
			dungeonGetInfo = res[0].result.response;
			if (!dungeonGetInfo) {
				endDungeon('noDungeon', res);
				return;
			}
			teamGetAll = res[1].result.response;
			teamGetFavor = res[2].result.response;
			dungeonActivity = res[3].result.response.stat.todayDungeonActivity;
			titanGetAll = Object.values(res[4].result.response);
			countPredictionCard = res[5].result.response.consumable[81];

			teams.hero = {
				favor: teamGetFavor.dungeon_hero,
				heroes: teamGetAll.dungeon_hero.filter(id => id < 6000),
				teamNum: 0,
			}
			heroPet = teamGetAll.dungeon_hero.filter(id => id >= 6000).pop();
			if (heroPet) {
				teams.hero.pet = heroPet;
			}

			teams.neutral = {
				favor: {},
				heroes: getTitanTeam(titanGetAll, 'neutral'),
				teamNum: 0,
			};
			teams.water = {
				favor: {},
				heroes: getTitanTeam(titanGetAll, 'water'),
				teamNum: 0,
			};
			teams.fire = {
				favor: {},
				heroes: getTitanTeam(titanGetAll, 'fire'),
				teamNum: 0,
			};
			teams.earth = {
				favor: {},
				heroes: getTitanTeam(titanGetAll, 'earth'),
				teamNum: 0,
			};


			checkFloor(dungeonGetInfo);
		}

		function getTitanTeam(titans, type) {
			switch (type) {
				case 'neutral':
					return titans.sort((a, b) => b.power - a.power).slice(0, 5).map(e => e.id);
				case 'water':
					return titans.filter(e => e.id.toString().slice(2, 3) == '0').map(e => e.id);
				case 'fire':
					return titans.filter(e => e.id.toString().slice(2, 3) == '1').map(e => e.id);
				case 'earth':
					return titans.filter(e => e.id.toString().slice(2, 3) == '2').map(e => e.id);
			}
		}

		function getNeutralTeam() {
			const titans = titanGetAll.filter(e => !titansStates[e.id]?.isDead)
			return titans.sort((a, b) => b.power - a.power).slice(0, 5).map(e => e.id);
		}

		function fixTitanTeam(titans) {
			titans.heroes = titans.heroes.filter(e => !titansStates[e]?.isDead);
			return titans;
		}

		/**
		 * Checking the floor
		 *
		 * ��������� ����
		 */
		async function checkFloor(dungeonInfo) {
			if (!('floor' in dungeonInfo) || dungeonInfo.floor?.state == 2) {
				saveProgress();
				return;
			}
			// console.log(dungeonInfo, dungeonActivity);
			setProgress(`${I18N('DUNGEON')}: ${I18N('TITANIT')} ${dungeonActivity}/${maxDungeonActivity}`);
			if (dungeonActivity >= maxDungeonActivity) {
				endDungeon('endDungeon', 'maxActive ' + dungeonActivity + '/' + maxDungeonActivity);
				return;
			}
			titansStates = dungeonInfo.states.titans;
			titanStats = titanObjToArray(titansStates);
			const floorChoices = dungeonInfo.floor.userData;
			const floorType = dungeonInfo.floorType;
			//const primeElement = dungeonInfo.elements.prime;
			if (floorType == "battle") {
				const calls = [];
				for (let teamNum in floorChoices) {
					attackerType = floorChoices[teamNum].attackerType;
					const args = fixTitanTeam(teams[attackerType]);
					if (attackerType == 'neutral') {
						args.heroes = getNeutralTeam();
					}
					if (!args.heroes.length) {
						continue;
					}
					args.teamNum = teamNum;
					calls.push({
						name: "dungeonStartBattle",
						args,
						ident: "body_" + teamNum
					})
				}
				if (!calls.length) {
					endDungeon('endDungeon', 'All Dead');
					return;
				}
				const battleDatas = await Send(JSON.stringify({ calls }))
					.then(e => e.results.map(n => n.result.response))
				const battleResults = [];
				for (n in battleDatas) {
					battleData = battleDatas[n]
					battleData.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];
					battleResults.push(await Calc(battleData).then(result => {
						result.teamNum = n;
						result.attackerType = floorChoices[n].attackerType;
						return result;
					}));
				}
				processingPromises(battleResults)
			}
		}

		function processingPromises(results) {
			let selectBattle = results[0];
			if (results.length < 2) {
				// console.log(selectBattle);
				if (!selectBattle.result.win) {
					endDungeon('dungeonEndBattle\n', selectBattle);
					return;
				}
				endBattle(selectBattle);
				return;
			}

			selectBattle = false;
			let bestState = -1000;
			for (const result of results) {
				const recovery = getState(result);
				if (recovery > bestState) {
					bestState = recovery;
					selectBattle = result
				}
			}
			// console.log(selectBattle.teamNum, results);
			if (!selectBattle || bestState <= -1000) {
				endDungeon('dungeonEndBattle\n', results);
				return;
			}

			startBattle(selectBattle.teamNum, selectBattle.attackerType)
				.then(endBattle);
		}

		/**
		 * Let's start the fight
		 *
		 * �������� ���
		 */
		function startBattle(teamNum, attackerType) {
			return new Promise(function (resolve, reject) {
				args = fixTitanTeam(teams[attackerType]);
				args.teamNum = teamNum;
				if (attackerType == 'neutral') {
					const titans = titanGetAll.filter(e => !titansStates[e.id]?.isDead)
					args.heroes = titans.sort((a, b) => b.power - a.power).slice(0, 5).map(e => e.id);
				}
				startBattleCall = {
					calls: [{
						name: "dungeonStartBattle",
						args,
						ident: "body"
					}]
				}
				send(JSON.stringify(startBattleCall), resultBattle, {
					resolve,
					teamNum,
					attackerType
				});
			});
		}
		/**
		 * Returns the result of the battle in a promise
		 *
		 * ��������� �������� ��� � ������
		 */
		function resultBattle(resultBattles, args) {
			battleData = resultBattles.results[0].result.response;
			battleType = "get_tower";
			if (battleData.type == "dungeon_titan") {
				battleType = "get_titan";
			}
			battleData.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];
			BattleCalc(battleData, battleType, function (result) {
				result.teamNum = args.teamNum;
				result.attackerType = args.attackerType;
				args.resolve(result);
			});
		}
		/**
		 * Finishing the fight
		 *
		 * ����������� ���
		 */
		async function endBattle(battleInfo) {
			if (battleInfo.result.win) {
				const args = {
					result: battleInfo.result,
					progress: battleInfo.progress,
				}
				if (countPredictionCard > 0) {
					args.isRaid = true;
				} else {
					const timer = getTimer(battleInfo.battleTime);
					console.log(timer);
					await countdownTimer(timer, `${I18N('DUNGEON')}: ${I18N('TITANIT')} ${dungeonActivity}/${maxDungeonActivity}`);
				}
				const calls = [{
					name: "dungeonEndBattle",
					args,
					ident: "body"
				}];
				lastDungeonBattleData = null;
				send(JSON.stringify({ calls }), resultEndBattle);
			} else {
				endDungeon('dungeonEndBattle win: false\n', battleInfo);
			}
		}

		/**
		 * Getting and processing battle results
		 *
		 * �������� � ������������ ���������� ���
		 */
		function resultEndBattle(e) {
			if ('error' in e) {
				popup.confirm(I18N('ERROR_MSG', {
					name: e.error.name,
					description: e.error.description,
				}));
				endDungeon('errorRequest', e);
				return;
			}
			battleResult = e.results[0].result.response;
			if ('error' in battleResult) {
				endDungeon('errorBattleResult', battleResult);
				return;
			}
			dungeonGetInfo = battleResult.dungeon ?? battleResult;
			dungeonActivity += battleResult.reward.dungeonActivity ?? 0;
			checkFloor(dungeonGetInfo);
		}

		/**
		 * Returns the coefficient of condition of the
		 * difference in titanium before and after the battle
		 *
		 * ���������� ����������� ��������� ������� ����� ���
		 */
		function getState(result) {
			if (!result.result.win) {
				return -1000;
			}

			let beforeSumFactor = 0;
			const beforeTitans = result.battleData.attackers;
			for (let titanId in beforeTitans) {
				const titan = beforeTitans[titanId];
				const state = titan.state;
				let factor = 1;
				if (state) {
					const hp = state.hp / titan.hp;
					const energy = state.energy / 1e3;
					factor = hp + energy / 20
				}
				beforeSumFactor += factor;
			}

			let afterSumFactor = 0;
			const afterTitans = result.progress[0].attackers.heroes;
			for (let titanId in afterTitans) {
				const titan = afterTitans[titanId];
				const hp = titan.hp / beforeTitans[titanId].hp;
				const energy = titan.energy / 1e3;
				const factor = hp + energy / 20;
				afterSumFactor += factor;
			}
			return afterSumFactor - beforeSumFactor;
		}

		/**
		 * Converts an object with IDs to an array with IDs
		 *
		 * ����������� ������ � ��������������� � ������ � ���������������
		 */
		function titanObjToArray(obj) {
			let titans = [];
			for (let id in obj) {
				obj[id].id = id;
				titans.push(obj[id]);
			}
			return titans;
		}

		function saveProgress() {
			let saveProgressCall = {
				calls: [{
					name: "dungeonSaveProgress",
					args: {},
					ident: "body"
				}]
			}
			send(JSON.stringify(saveProgressCall), resultEndBattle);
		}

		function endDungeon(reason, info) {
			console.warn(reason, info);
			setProgress(`${I18N('DUNGEON')} ${I18N('COMPLETED')}`, true);
			resolve();
		}
	}

	/**
	 * Passing the tower
	 *
	 * ����������� �����
	 */
	function testTower() {
		return new Promise((resolve, reject) => {
			tower = new executeTower(resolve, reject);
			tower.start();
		});
	}

	/**
	 * Passing the tower
	 *
	 * ����������� �����
	 */
	function executeTower(resolve, reject) {
		lastTowerInfo = {};

		scullCoin = 0;

		heroGetAll = [];

		heroesStates = {};

		argsBattle = {
			heroes: [],
			favor: {},
		};

		callsExecuteTower = {
			calls: [{
				name: "towerGetInfo",
				args: {},
				ident: "towerGetInfo"
			}, {
				name: "teamGetAll",
				args: {},
				ident: "teamGetAll"
			}, {
				name: "teamGetFavor",
				args: {},
				ident: "teamGetFavor"
			}, {
				name: "inventoryGet",
				args: {},
				ident: "inventoryGet"
			}, {
				name: "heroGetAll",
				args: {},
				ident: "heroGetAll"
			}]
		}

		buffIds = [
			{id: 0, cost: 0, isBuy: false},   // plug // ��������
			{id: 1, cost: 1, isBuy: true},    // 3% attack // 3% �����
			{id: 2, cost: 6, isBuy: true},    // 2% attack // 2% �����
			{id: 3, cost: 16, isBuy: true},   // 4% attack // 4% �����
			{id: 4, cost: 40, isBuy: true},   // 8% attack // 8% �����
			{id: 5, cost: 1, isBuy: true},    // 10% armor // 10% �����
			{id: 6, cost: 6, isBuy: true},    // 5% armor // 5% �����
			{id: 7, cost: 16, isBuy: true},   // 10% armor // 10% �����
			{id: 8, cost: 40, isBuy: true},   // 20% armor // 20% �����
			{ id: 9, cost: 1, isBuy: true },    // 10% protection from magic // 10% ������ �� �����
			{ id: 10, cost: 6, isBuy: true },   // 5% protection from magic // 5% ������ �� �����
			{ id: 11, cost: 16, isBuy: true },  // 10% protection from magic // 10% ������ �� �����
			{ id: 12, cost: 40, isBuy: true },  // 20% protection from magic // 20% ������ �� �����
			{ id: 13, cost: 1, isBuy: false },  // 40% health hero // 40% �������� �����
			{ id: 14, cost: 6, isBuy: false },  // 40% health hero // 40% �������� �����
			{ id: 15, cost: 16, isBuy: false }, // 80% health hero // 80% �������� �����
			{ id: 16, cost: 40, isBuy: false }, // 40% health to all heroes // 40% �������� ���� ������
			{ id: 17, cost: 1, isBuy: false },  // 40% energy to the hero // 40% ������� �����
			{ id: 18, cost: 3, isBuy: false },  // 40% energy to the hero // 40% ������� �����
			{ id: 19, cost: 8, isBuy: false },  // 80% energy to the hero // 80% ������� �����
			{ id: 20, cost: 20, isBuy: false }, // 40% energy to all heroes // 40% ������� ���� ������
			{ id: 21, cost: 40, isBuy: false }, // Hero Resurrection // ����������� �����
		]

		this.start = function () {
			send(JSON.stringify(callsExecuteTower), startTower);
		}

		/**
		 * Getting data on the Tower
		 *
		 * �������� ������ �� �����
		 */
		function startTower(e) {
			res = e.results;
			towerGetInfo = res[0].result.response;
			if (!towerGetInfo) {
				endTower('noTower', res);
				return;
			}
			teamGetAll = res[1].result.response;
			teamGetFavor = res[2].result.response;
			inventoryGet = res[3].result.response;
			heroGetAll = Object.values(res[4].result.response);

			scullCoin = inventoryGet.coin[7] ?? 0;

			argsBattle.favor = teamGetFavor.tower;
			argsBattle.heroes = heroGetAll.sort((a, b) => b.power - a.power).slice(0, 5).map(e => e.id);
			pet = teamGetAll.tower && teamGetAll.tower.filter(id => id >= 6000).pop();
			if (pet) {
				argsBattle.pet = pet;
			}

			checkFloor(towerGetInfo);
		}

		function fixHeroesTeam(argsBattle) {
			let fixHeroes = argsBattle.heroes.filter(e => !heroesStates[e]?.isDead);
			if (fixHeroes.length < 5) {
				heroGetAll = heroGetAll.filter(e => !heroesStates[e.id]?.isDead);
				fixHeroes = heroGetAll.sort((a, b) => b.power - a.power).slice(0, 5).map(e => e.id);
				Object.keys(argsBattle.favor).forEach(e => {
					if (!fixHeroes.includes(+e)) {
						delete argsBattle.favor[e];
					}
				})
			}
			argsBattle.heroes = fixHeroes;
			return argsBattle;
		}

		/**
		 * Check the floor
		 *
		 * ��������� ����
		 */
		function checkFloor(towerInfo) {
			lastTowerInfo = towerInfo;
			maySkipFloor = +towerInfo.maySkipFloor;
			floorNumber = +towerInfo.floorNumber;
			heroesStates = towerInfo.states.heroes;
			floorInfo = towerInfo.floor;

			/**
			 * Is there at least one chest open on the floor
			 * ������ �� �� ����� ���� ���� ������
			 */
			isOpenChest = false;
			if (towerInfo.floorType == "chest") {
				isOpenChest = towerInfo.floor.chests.reduce((n, e) => n + e.opened, 0);
			}

			setProgress(`${I18N('TOWER')}: ${I18N('FLOOR')} ${floorNumber}`);
			if (floorNumber > 49) {
				if (isOpenChest) {
					endTower('alreadyOpenChest 50 floor', floorNumber);
					return;
				}
			}
			/**
			 * If the chest is open and you can skip floors, then move on
			 * ���� ������ ������ � ����� ������� �����, �� ��������� ������
			 */
			if (towerInfo.mayFullSkip && +towerInfo.teamLevel == 130) {
				if (isOpenChest) {
					nextOpenChest(floorNumber);
				} else {
					nextChestOpen(floorNumber);
				}
				return;
			}

			// console.log(towerInfo, scullCoin);
			switch (towerInfo.floorType) {
				case "battle":
					if (floorNumber <= maySkipFloor) {
						skipFloor();
						return;
					}
					if (floorInfo.state == 2) {
						nextFloor();
						return;
					}
					startBattle().then(endBattle);
					return;
				case "buff":
					checkBuff(towerInfo);
					return;
				case "chest":
					openChest(floorNumber);
					return;
				default:
					console.log('!', towerInfo.floorType, towerInfo);
					break;
			}
		}

		/**
		 * Let's start the fight
		 *
		 * �������� ���
		 */
		function startBattle() {
			return new Promise(function (resolve, reject) {
				towerStartBattle = {
					calls: [{
						name: "towerStartBattle",
						args: fixHeroesTeam(argsBattle),
						ident: "body"
					}]
				}
				send(JSON.stringify(towerStartBattle), resultBattle, resolve);
			});
		}
		/**
		 * Returns the result of the battle in a promise
		 *
		 * ��������� �������� ��� � ������
		 */
		function resultBattle(resultBattles, resolve) {
			battleData = resultBattles.results[0].result.response;
			battleType = "get_tower";
			BattleCalc(battleData, battleType, function (result) {
				resolve(result);
			});
		}
		/**
		 * Finishing the fight
		 *
		 * ����������� ���
		 */
		function endBattle(battleInfo) {
			if (battleInfo.result.stars >= 3) {
				endBattleCall = {
					calls: [{
						name: "towerEndBattle",
						args: {
							result: battleInfo.result,
							progress: battleInfo.progress,
						},
						ident: "body"
					}]
				}
				send(JSON.stringify(endBattleCall), resultEndBattle);
			} else {
				endTower('towerEndBattle win: false\n', battleInfo);
			}
		}

		/**
		 * Getting and processing battle results
		 *
		 * �������� � ������������ ���������� ���
		 */
		function resultEndBattle(e) {
			battleResult = e.results[0].result.response;
			if ('error' in battleResult) {
				endTower('errorBattleResult', battleResult);
				return;
			}
			if ('reward' in battleResult) {
				scullCoin += battleResult.reward?.coin[7] ?? 0;
			}
			nextFloor();
		}

		function nextFloor() {
			nextFloorCall = {
				calls: [{
					name: "towerNextFloor",
					args: {},
					ident: "body"
				}]
			}
			send(JSON.stringify(nextFloorCall), checkDataFloor);
		}

		function openChest(floorNumber) {
			floorNumber = floorNumber || 0;
			openChestCall = {
				calls: [{
					name: "towerOpenChest",
					args: {
						num: 2
					},
					ident: "body"
				}]
			}
			send(JSON.stringify(openChestCall), floorNumber < 50 ? nextFloor : lastChest);
		}

		function lastChest() {
			endTower('openChest 50 floor', floorNumber);
		}

		function skipFloor() {
			skipFloorCall = {
				calls: [{
					name: "towerSkipFloor",
					args: {},
					ident: "body"
				}]
			}
			send(JSON.stringify(skipFloorCall), checkDataFloor);
		}

		function checkBuff(towerInfo) {
			buffArr = towerInfo.floor;
			promises = [];
			for (let buff of buffArr) {
				buffInfo = buffIds[buff.id];
				if (buffInfo.isBuy && buffInfo.cost <= scullCoin) {
					scullCoin -= buffInfo.cost;
					promises.push(buyBuff(buff.id));
				}
			}
			Promise.all(promises).then(nextFloor);
		}

		function buyBuff(buffId) {
			return new Promise(function (resolve, reject) {
				buyBuffCall = {
					calls: [{
						name: "towerBuyBuff",
						args: {
							buffId
						},
						ident: "body"
					}]
				}
				send(JSON.stringify(buyBuffCall), resolve);
			});
		}

		function checkDataFloor(result) {
			towerInfo = result.results[0].result.response;
			if ('reward' in towerInfo && towerInfo.reward?.coin) {
				scullCoin += towerInfo.reward?.coin[7] ?? 0;
			}
			if ('tower' in towerInfo) {
				towerInfo = towerInfo.tower;
			}
			if ('skullReward' in towerInfo) {
				scullCoin += towerInfo.skullReward?.coin[7] ?? 0;
			}
			checkFloor(towerInfo);
		}
		/**
		 * Getting tower rewards
		 *
		 * �������� ������� �����
		 */
		function farmTowerRewards(reason) {
			let { pointRewards, points } = lastTowerInfo;
			let pointsAll = Object.getOwnPropertyNames(pointRewards);
			let farmPoints = pointsAll.filter(e => +e <= +points && !pointRewards[e]);
			if (!farmPoints.length) {
				return;
			}
			let farmTowerRewardsCall = {
				calls: [{
					name: "tower_farmPointRewards",
					args: {
						points: farmPoints
					},
					ident: "tower_farmPointRewards"
				}]
			}

			if (scullCoin > 0 && reason == 'openChest 50 floor') {
				farmTowerRewardsCall.calls.push({
					name: "tower_farmSkullReward",
					args: {},
					ident: "tower_farmSkullReward"
				});
			}

			send(JSON.stringify(farmTowerRewardsCall), () => { });
		}

		function fullSkipTower() {
			/**
			 * Next chest
			 *
			 * ��������� ������
			 */
			function nextChest(n) {
				return {
					name: "towerNextChest",
					args: {},
					ident: "group_" + n + "_body"
				}
			}
			/**
			 * Open chest
			 *
			 * ������� ������
			 */
			function openChest(n) {
				return {
					name: "towerOpenChest",
					args: {
						"num": 2
					},
					ident: "group_" + n + "_body"
				}
			}

			const fullSkipTowerCall = {
				calls: []
			}

			let n = 0;
			for (let i = 0; i < 15; i++) {
				fullSkipTowerCall.calls.push(nextChest(++n));
				fullSkipTowerCall.calls.push(openChest(++n));
			}

			send(JSON.stringify(fullSkipTowerCall), data => {
				data.results[0] = data.results[28];
				checkDataFloor(data);
			});
		}

		function nextChestOpen(floorNumber) {
			const calls = [{
				name: "towerOpenChest",
				args: {
					num: 2
				},
				ident: "towerOpenChest"
			}];

			Send(JSON.stringify({ calls })).then(e => {
				nextOpenChest(floorNumber);
			});
		}

		function nextOpenChest(floorNumber) {
			if (floorNumber > 49) {
				endTower('openChest 50 floor', floorNumber);
				return;
			}
			if (floorNumber == 1) {
				fullSkipTower();
				return;
			}

			let nextOpenChestCall = {
				calls: [{
					name: "towerNextChest",
					args: {},
					ident: "towerNextChest"
				}, {
					name: "towerOpenChest",
					args: {
						num: 2
					},
					ident: "towerOpenChest"
				}]
			}
			send(JSON.stringify(nextOpenChestCall), checkDataFloor);
		}

		function endTower(reason, info) {
			console.log(reason, info);
			if (reason != 'noTower') {
				farmTowerRewards(reason);
			}
			setProgress(`${I18N('TOWER')} ${I18N('COMPLETED')}!`, true);
			resolve();
		}
	}

	function hackGame() {
		self = this;
		selfGame = null;
		bindId = 1e9;
		this.libGame = null;

		/**
		 * List of correspondence of used classes to their names
		 *
		 * ������ ������������ ������������ ������� �� ���������
		 */
		ObjectsList = [
			{name:"BattlePresets", prop:"game.battle.controller.thread.BattlePresets"},
			{name:"DataStorage", prop:"game.data.storage.DataStorage"},
			{name:"BattleConfigStorage", prop:"game.data.storage.battle.BattleConfigStorage"},
			{name:"BattleInstantPlay", prop:"game.battle.controller.instant.BattleInstantPlay"},
			{name:"MultiBattleResult", prop:"game.battle.controller.MultiBattleResult"},

			{name:"PlayerMissionData", prop:"game.model.user.mission.PlayerMissionData"},
			{name:"PlayerMissionBattle", prop:"game.model.user.mission.PlayerMissionBattle"},
			{name:"GameModel", prop:"game.model.GameModel"},
			{name:"CommandManager", prop:"game.command.CommandManager"},
			{name:"MissionCommandList", prop:"game.command.rpc.mission.MissionCommandList"},
			{name:"RPCCommandBase", prop:"game.command.rpc.RPCCommandBase"},
			{name:"PlayerTowerData", prop:"game.model.user.tower.PlayerTowerData"},
			{name:"TowerCommandList", prop:"game.command.tower.TowerCommandList"},
			{name:"PlayerHeroTeamResolver", prop:"game.model.user.hero.PlayerHeroTeamResolver"},
			{name:"BattlePausePopup", prop:"game.view.popup.battle.BattlePausePopup"},
			{name:"BattlePopup", prop:"game.view.popup.battle.BattlePopup"},
			{name:"DisplayObjectContainer", prop:"starling.display.DisplayObjectContainer"},
			{name:"GuiClipContainer", prop:"engine.core.clipgui.GuiClipContainer"},
			{name:"BattlePausePopupClip", prop:"game.view.popup.battle.BattlePausePopupClip"},
			{name:"ClipLabel", prop:"game.view.gui.components.ClipLabel"},
			{name:"ClipLabelBase", prop:"game.view.gui.components.ClipLabelBase"},
			{name:"Translate", prop:"com.progrestar.common.lang.Translate"},
			{name:"ClipButtonLabeledCentered", prop:"game.view.gui.components.ClipButtonLabeledCentered"},
			{name:"BattlePausePopupMediator", prop:"game.mediator.gui.popup.battle.BattlePausePopupMediator"},
			{name:"SettingToggleButton", prop:"game.mechanics.settings.popup.view.SettingToggleButton"},
			{name:"PlayerDungeonData", prop:"game.mechanics.dungeon.model.PlayerDungeonData"},
			{name:"NextDayUpdatedManager", prop:"game.model.user.NextDayUpdatedManager"},
			{name:"BattleController", prop:"game.battle.controller.BattleController"},
			{name:"BattleSettingsModel", prop:"game.battle.controller.BattleSettingsModel"},
			{name:"BooleanProperty", prop:"engine.core.utils.property.BooleanProperty"},
			{name:"RuleStorage", prop:"game.data.storage.rule.RuleStorage"},
			{name:"BattleConfig", prop:"battle.BattleConfig"},
			{name:"SpecialShopModel", prop:"game.model.user.shop.SpecialShopModel"},
			{name:"BattleGuiMediator", prop:"game.battle.gui.BattleGuiMediator"},
			{name:"BooleanPropertyWriteable", prop:"engine.core.utils.property.BooleanPropertyWriteable"},
			{ name: "BattleLogEncoder", prop: "battle.log.BattleLogEncoder" },
			{ name: "BattleLogReader", prop: "battle.log.BattleLogReader" },
			{ name: "PlayerSubscriptionInfoValueObject", prop: "game.model.user.subscription.PlayerSubscriptionInfoValueObject" },
		];

		/**
		 * Contains the game classes needed to write and override game methods
		 *
		 * �������� ������ ���� ����������� ��� ��������� � ������� ������� ����
		 */
		Game = {
			/**
			 * Function 'e'
			 * ������� 'e'
			 */
			bindFunc: function (a, b) {
				if (null == b)
					return null;
				null == b.__id__ && (b.__id__ = bindId++);
				var c;
				null == a.hx__closures__ ? a.hx__closures__ = {} :
					c = a.hx__closures__[b.__id__];
				null == c && (c = b.bind(a), a.hx__closures__[b.__id__] = c);
				return c
			},
		};

		/**
		 * Connects to game objects via the object creation event
		 *
		 * ������������ � �������� ���� ����� ������� �������� �������
		 */
		function connectGame() {
		for (let obj of ObjectsList) {
			/**
			 * https: //stackoverflow.com/questions/42611719/how-to-intercept-and-modify-a-specific-property-for-any-object
			 */
			Object.defineProperty(Object.prototype, obj.prop, {
				set: function (value) {
					if (!selfGame) {
						selfGame = this;
					}
					if (!Game[obj.name]) {
						Game[obj.name] = value;
					}
					// console.log('set ' + obj.prop, this, value);
					this[obj.prop + '_'] = value;
				},
				get: function () {
					// console.log('get ' + obj.prop, this);
					return this[obj.prop + '_'];
				}
			});
		}
	}

		/**
		 * Game.BattlePresets
		 * @param {bool} a isReplay
		 * @param {bool} b autoToggleable
		 * @param {bool} c auto On Start
		 * @param {object} d config
		 * @param {bool} f showBothTeams
		 */
		/**
		 * Returns the results of the battle to the callback function
		 * ���������� � ������� callback ���������� ���
		 * @param {*} battleData battle data ������ ���
		 * @param {*} battleConfig combat configuration type options:
		 *
		 * ��� ������������ ��� ��������:
		 *
		 * "get_invasion", "get_titanPvpManual", "get_titanPvp",
		 * "get_titanClanPvp","get_clanPvp","get_titan","get_boss",
		 * "get_tower","get_pve","get_pvpManual","get_pvp","get_core"
		 *
		 * You can specify the xYc function in the game.assets.storage.BattleAssetStorage class
		 *
		 * ����� �������� � ������ game.assets.storage.BattleAssetStorage ������� xYc
		 * @param {*} callback ������� � ������� ��������� ���������� ���
		 */
		this.BattleCalc = function (battleData, battleConfig, callback) {
		// battleConfig = battleConfig || getBattleType(battleData.type)
		if (!Game.BattlePresets) throw Error('Use connectGame');
		battlePresets = new Game.BattlePresets(battleData.progress, !1, !0, Game.DataStorage[getFn(Game.DataStorage, 24)][getF(Game.BattleConfigStorage, battleConfig)](), !1);
		let battleInstantPlay;
		if (battleData.progress?.length > 1) {
			battleInstantPlay = new Game.MultiBattleInstantReplay(battleData, battlePresets);
		} else {
			battleInstantPlay = new Game.BattleInstantPlay(battleData, battlePresets);
		}
		battleInstantPlay[getProtoFn(Game.BattleInstantPlay, 9)].add((battleInstant) => {
			const MBR_2 = getProtoFn(Game.MultiBattleResult, 2);
			const battleResults = battleInstant[getF(Game.BattleInstantPlay, 'get_result')]();
			const battleData = battleInstant[getF(Game.BattleInstantPlay, 'get_rawBattleInfo')]();
			const battleLogs = [];
			const timeLimit = battlePresets[getF(Game.BattlePresets, 'get_timeLimit')]();
			let battleTime = 0;
			let battleTimer = 0;
			for (const battleResult of battleResults[MBR_2]) {
				const battleLog = Game.BattleLogEncoder.read(new Game.BattleLogReader(battleResult));
				battleLogs.push(battleLog);
				const maxTime = Math.max(...battleLog.map((e) => (e.time < timeLimit && e.time !== 168.8 ? e.time : 0)));
				battleTimer += getTimer(maxTime)
				battleTime += maxTime;
			}
			callback({
				battleLogs,
				battleTime,
				battleTimer,
				battleData,
				progress: battleResults[getF(Game.MultiBattleResult, 'get_progress')](),
				result: battleResults[getF(Game.MultiBattleResult, 'get_result')](),
			});
		});
		battleInstantPlay.start();
	}

		/**
		 * Returns a function with the specified name from the class
		 *
		 * ���������� �� ������ ������� � ��������� ������
		 * @param {Object} classF Class // �����
		 * @param {String} nameF function name // ��� �������
		 * @param {String} pos name and alias order // ������� ����� � ����������
		 * @returns
		 */
		function getF(classF, nameF, pos) {
			pos = pos || false;
			let prop = Object.entries(classF.prototype.__properties__)
			if (!pos) {
				return prop.filter((e) => e[1] == nameF).pop()[0];
			} else {
				return prop.filter((e) => e[0] == nameF).pop()[1];
			}
		}

		/**
		 * Returns a function with the specified name from the class
		 *
		 * ���������� �� ������ ������� � ��������� ������
		 * @param {Object} classF Class // �����
		 * @param {String} nameF function name // ��� �������
		 * @returns
		 */
		function getFnP(classF, nameF) {
			let prop = Object.entries(classF.__properties__)
			return prop.filter((e) => e[1] == nameF).pop()[0];
		}

		/**
		 * Returns the function name with the specified ordinal from the class
		 *
		 * ���������� ��� ������� � �������� ���������� ������� �� ������
		 * @param {Object} classF Class // �����
		 * @param {Number} nF Order number of function // ���������� ����� �������
		 * @returns
		 */
		function getFn(classF, nF) {
			let prop = Object.keys(classF);
			return prop[nF];
		}

		/**
		 * Returns the name of the function with the specified serial number from the prototype of the class
		 *
		 * ���������� ��� ������� � �������� ���������� ������� �� ��������� ������
		 * @param {Object} classF Class // �����
		 * @param {Number} nF Order number of function // ���������� ����� �������
		 * @returns
		 */
		function getProtoFn(classF, nF) {
			let prop = Object.keys(classF.prototype);
			return prop[nF];
		}
		/**
		 * Description of replaced functions
		 *
		 * �������� ����������� �������
		 */
		replaceFunction = {
		company: function () {
			let PMD_12 = getProtoFn(Game.PlayerMissionData, 12);
			let oldSkipMisson = Game.PlayerMissionData.prototype[PMD_12];
			Game.PlayerMissionData.prototype[PMD_12] = function (a, b, c) {
				if (!isChecked('passBattle')) {
					oldSkipMisson.call(this, a, b, c);
					return;
				}

				try {
					this[getProtoFn(Game.PlayerMissionData, 9)] = new Game.PlayerMissionBattle(a, b, c);

					var a = new Game.BattlePresets(
						!1,
						!1,
						!0,
						Game.DataStorage[getFn(Game.DataStorage, 24)][getProtoFn(Game.BattleConfigStorage, 20)](),
						!1
					);
					a = new Game.BattleInstantPlay(c, a);
					a[getProtoFn(Game.BattleInstantPlay, 9)].add(Game.bindFunc(this, this.P$h));
					a.start();
				} catch (error) {
					console.error('company', error);
					oldSkipMisson.call(this, a, b, c);
				}
			};

				Game.PlayerMissionData.prototype.P$h = function (a) {
				let GM_2 = getFn(Game.GameModel, 2);
				let GM_P2 = getProtoFn(Game.GameModel, 2);
				let CM_20 = getProtoFn(Game.CommandManager, 20);
				let MCL_2 = getProtoFn(Game.MissionCommandList, 2);
				let MBR_15 = getF(Game.MultiBattleResult, 'get_result');
				let RPCCB_15 = getProtoFn(Game.RPCCommandBase, 16);
				let PMD_32 = getProtoFn(Game.PlayerMissionData, 32);
				Game.GameModel[GM_2]()[GM_P2][CM_20][MCL_2](a[MBR_15]())[RPCCB_15](Game.bindFunc(this, this[PMD_32]));
			};
			},
			tower: function() {
				let PTD_67 = getProtoFn(Game.PlayerTowerData, 67);
				let oldSkipTower = Game.PlayerTowerData.prototype[PTD_67];
				Game.PlayerTowerData.prototype[PTD_67] = function (a) {
					if (!isChecked('passBattle')) {
						oldSkipTower.call(this, a);
						return;
					}
					try {
						var p = new Game.BattlePresets(!1, !1, !0, Game.DataStorage[getFn(Game.DataStorage, 24)][getProtoFn(Game.BattleConfigStorage,17)](), !1);
						a = new Game.BattleInstantPlay(a, p);
						a[getProtoFn(Game.BattleInstantPlay,8)].add(Game.bindFunc(this, this.P$h));
						a.start()
					} catch (error) {
						console.error('tower', error)
						oldSkipMisson.call(this, a, b, c);
					}
				}

				Game.PlayerTowerData.prototype.P$h = function (a) {
				const GM_2 = getFnP(Game.GameModel, 'get_instance');
				const GM_P2 = getProtoFn(Game.GameModel, 2);
				const CM_29 = getProtoFn(Game.CommandManager, 29);
				const TCL_5 = getProtoFn(Game.TowerCommandList, 5);
				const MBR_15 = getF(Game.MultiBattleResult, 'get_result');
				const RPCCB_15 = getProtoFn(Game.RPCCommandBase, 17);
				const PTD_78 = getProtoFn(Game.PlayerTowerData, 78);
				Game.GameModel[GM_2]()[GM_P2][CM_29][TCL_5](a[MBR_15]())[RPCCB_15](Game.bindFunc(this, this[PTD_78]));
			};
			},
			// skipSelectHero: function() {
			// 	if (!HOST) throw Error('Use connectGame');
			// 	Game.PlayerHeroTeamResolver.prototype[getProtoFn(Game.PlayerHeroTeamResolver, 3)] = () => false;
			// },
			passBattle: function () {
			let BPP_4 = getProtoFn(Game.BattlePausePopup, 4);
			let oldPassBattle = Game.BattlePausePopup.prototype[BPP_4];
			Game.BattlePausePopup.prototype[BPP_4] = function (a) {
				if (!isChecked('passBattle')) {
					oldPassBattle.call(this, a);
					return;
				}
				try {
					Game.BattlePopup.prototype[getProtoFn(Game.BattlePausePopup, 4)].call(this, a);
					this[getProtoFn(Game.BattlePausePopup, 3)]();
					this[getProtoFn(Game.DisplayObjectContainer, 3)](this.clip[getProtoFn(Game.GuiClipContainer, 2)]());
					this.clip[getProtoFn(Game.BattlePausePopupClip, 1)][getProtoFn(Game.ClipLabelBase, 9)](
						Game.Translate.translate('UI_POPUP_BATTLE_PAUSE')
					);

					this.clip[getProtoFn(Game.BattlePausePopupClip, 2)][getProtoFn(Game.ClipButtonLabeledCentered, 2)](
						Game.Translate.translate('UI_POPUP_BATTLE_RETREAT'),
						((q = this[getProtoFn(Game.BattlePausePopup, 1)]), Game.bindFunc(q, q[getProtoFn(Game.BattlePausePopupMediator, 17)]))
					);
					this.clip[getProtoFn(Game.BattlePausePopupClip, 5)][getProtoFn(Game.ClipButtonLabeledCentered, 2)](
						this[getProtoFn(Game.BattlePausePopup, 1)][getProtoFn(Game.BattlePausePopupMediator, 14)](),
						this[getProtoFn(Game.BattlePausePopup, 1)][getProtoFn(Game.BattlePausePopupMediator, 13)]()
							? ((q = this[getProtoFn(Game.BattlePausePopup, 1)]), Game.bindFunc(q, q[getProtoFn(Game.BattlePausePopupMediator, 18)]))
							: ((q = this[getProtoFn(Game.BattlePausePopup, 1)]), Game.bindFunc(q, q[getProtoFn(Game.BattlePausePopupMediator, 18)]))
					);

					this.clip[getProtoFn(Game.BattlePausePopupClip, 5)][getProtoFn(Game.ClipButtonLabeledCentered, 0)][
						getProtoFn(Game.ClipLabelBase, 24)
					]();
					this.clip[getProtoFn(Game.BattlePausePopupClip, 3)][getProtoFn(Game.SettingToggleButton, 3)](
						this[getProtoFn(Game.BattlePausePopup, 1)][getProtoFn(Game.BattlePausePopupMediator, 9)]()
					);
					this.clip[getProtoFn(Game.BattlePausePopupClip, 4)][getProtoFn(Game.SettingToggleButton, 3)](
						this[getProtoFn(Game.BattlePausePopup, 1)][getProtoFn(Game.BattlePausePopupMediator, 10)]()
					);
					this.clip[getProtoFn(Game.BattlePausePopupClip, 6)][getProtoFn(Game.SettingToggleButton, 3)](
						this[getProtoFn(Game.BattlePausePopup, 1)][getProtoFn(Game.BattlePausePopupMediator, 11)]()
					);
				} catch (error) {
					console.error('passBattle', error);
					oldPassBattle.call(this, a);
				}
			};

			let retreatButtonLabel = getF(Game.BattlePausePopupMediator, 'get_retreatButtonLabel');
			let oldFunc = Game.BattlePausePopupMediator.prototype[retreatButtonLabel];
			Game.BattlePausePopupMediator.prototype[retreatButtonLabel] = function () {
				if (isChecked('passBattle')) {
					return I18N('BTN_PASS');
				} else {
					return oldFunc.call(this);
				}
			};
		},
			endlessCards: function() {
				let PDD_15 = getProtoFn(Game.PlayerDungeonData, 15);
				let oldEndlessCards = Game.PlayerDungeonData.prototype[PDD_15];
				Game.PlayerDungeonData.prototype[PDD_15] = function () {
					if (countPredictionCard <= 0) {
						return true;
					} else {
						return oldEndlessCards.call(this);
					}
				}
			},
            fixCompany: function () {
			const GameBattleView = selfGame['game.mediator.gui.popup.battle.GameBattleView'];
			const BattleThread = selfGame['game.battle.controller.thread.BattleThread'];
			const getOnViewDisposed = getF(BattleThread, 'get_onViewDisposed');
			const getThread = getF(GameBattleView, 'get_thread');
			const oldFunc = GameBattleView.prototype[getThread];
			GameBattleView.prototype[getThread] = function () {
				return (
					oldFunc.call(this) || {
						[getOnViewDisposed]: async () => {},
					}
				);
			};
		},

			speedBattle: function () {
				const get_timeScale = getF(Game.BattleController, "get_timeScale");
				const oldSpeedBattle = Game.BattleController.prototype[get_timeScale];
				Game.BattleController.prototype[get_timeScale] = function () {
					const speedBattle = Number.parseFloat(getInput('speedBattle'));
					if (!speedBattle) {
						return oldSpeedBattle.call(this);
					}
					try {
						const BC_12 = getProtoFn(Game.BattleController, 12);
						const BSM_12 = getProtoFn(Game.BattleSettingsModel, 12);
						const BP_get_value = getF(Game.BooleanProperty, "get_value");
						if (this[BC_12][BSM_12][BP_get_value]()) {
							return 0;
						}
						const BSM_2 = getProtoFn(Game.BattleSettingsModel, 2);
					const BC_49 = getProtoFn(Game.BattleController, 49);
					const BSM_1 = getProtoFn(Game.BattleSettingsModel, 1);
					const BC_14 = getProtoFn(Game.BattleController, 14);
					const BC_3 = getFn(Game.BattleController, 3);
						if (this[BC_12][BSM_2][BP_get_value]()) {
						var a = speedBattle * this[BC_49]();
					} else {
						a = this[BC_12][BSM_1][BP_get_value]();
						const maxSpeed = Math.max(...this[BC_14]);
						const multiple = a == this[BC_14].indexOf(maxSpeed) ? (maxSpeed >= 4 ? speedBattle : this[BC_14][a]) : this[BC_14][a];
						a = multiple * Game.BattleController[BC_3][BP_get_value]() * this[BC_49]();
					}
					const BSM_24 = getProtoFn(Game.BattleSettingsModel, 24);
					a > this[BC_12][BSM_24][BP_get_value]() && (a = this[BC_12][BSM_24][BP_get_value]());
					const DS_23 = getFn(Game.DataStorage, 23);
					const get_battleSpeedMultiplier = getF(Game.RuleStorage, 'get_battleSpeedMultiplier', true);
					var b = Game.DataStorage[DS_23][get_battleSpeedMultiplier]();
					const R_1 = getFn(selfGame.Reflect, 1);
					const BC_1 = getFn(Game.BattleController, 1);
					const get_config = getF(Game.BattlePresets, 'get_config');
					null != b &&
						(a = selfGame.Reflect[R_1](b, this[BC_1][get_config]().ident)
							? a * selfGame.Reflect[R_1](b, this[BC_1][get_config]().ident)
							: a * selfGame.Reflect[R_1](b, 'default'));
					return a;
				} catch (error) {
					console.error('passBatspeedBattletle', error);
					return oldSpeedBattle.call(this);
				}
			};
		},
			/**
			 * Remove the rare shop
			 *
			 * �������� �������� ������� ��������
			 */
			/*
		removeWelcomeShop: function () {
			let SSM_3 = getProtoFn(Game.SpecialShopModel, 3);
			const oldWelcomeShop = Game.SpecialShopModel.prototype[SSM_3];
			Game.SpecialShopModel.prototype[SSM_3] = function () {
				if (isChecked('noOfferDonat')) {
					return null;
				} else {
					return oldWelcomeShop.call(this);
				}
			}
		},
		*/

			/**
			 * Acceleration button without Valkyries favor
			 *
			 * ������ ��������� ��� ��������������� ���������
			 */
			battleFastKey: function () {
			const BGM_43 = getProtoFn(Game.BattleGuiMediator, 43);
			const oldBattleFastKey = Game.BattleGuiMediator.prototype[BGM_43];
			Game.BattleGuiMediator.prototype[BGM_43] = function () {
				let flag = true;
				//console.log(flag)
				if (!flag) {
					return oldBattleFastKey.call(this);
				}
				try {
					const BGM_9 = getProtoFn(Game.BattleGuiMediator, 9);
					const BGM_10 = getProtoFn(Game.BattleGuiMediator, 10);
					const BPW_0 = getProtoFn(Game.BooleanPropertyWriteable, 0);
					this[BGM_9][BPW_0](true);
					this[BGM_10][BPW_0](true);
				} catch (error) {
					console.error(error);
					return oldBattleFastKey.call(this);
					}
				}
			},
		}

		/**
		 * Starts replacing recorded functions
		 *
		 * ��������� ������ ���������� �������
		 */
		this.activateHacks = function () {
		if (!selfGame) throw Error('Use connectGame');
		for (let func in replaceFunction) {
			try {
				replaceFunction[func]();
			} catch (error) {
				console.error(error);
			}
		}
	}


		/**
		 * Returns the game object
		 *
		 * ���������� ������ ����
		 */
		this.getSelfGame = function () {
			return selfGame;
		}

		/**
		 * Updates game data
		 *
		 * ��������� ������ ����
		 */
		this.refreshGame = function () {
			(new Game.NextDayUpdatedManager)[getProtoFn(Game.NextDayUpdatedManager, 5)]();
			try {
				cheats.refreshInventory();
			} catch (e) { }
		}

		/**
		 * Update inventory
		 *
		 * ��������� ���������
		 */
		this.refreshInventory = async function () {
			const GM_INST = getFnP(Game.GameModel, "get_instance");
			const GM_0 = getProtoFn(Game.GameModel, 0);
			const P_24 = getProtoFn(selfGame["game.model.user.Player"], 24);
			const Player = Game.GameModel[GM_INST]()[GM_0];
			Player[P_24] = new selfGame["game.model.user.inventory.PlayerInventory"]
			Player[P_24].init(await Send('{"calls":[{"name":"inventoryGet","args":{},"ident":"inventoryGet"}]}').then(e => e.results[0].result.response))
		}

		/**
		 * Change the play screen on windowName
		 *
		 * ������� ����� ���� �� windowName
		 *
		 * Possible options:
		 *
		 * ��������� ��������:
		 *
		 * MISSION, ARENA, GRAND, CHEST, SKILLS, SOCIAL_GIFT, CLAN, ENCHANT, TOWER, RATING, CHALLENGE, BOSS, CHAT, CLAN_DUNGEON, CLAN_CHEST, TITAN_GIFT, CLAN_RAID, ASGARD, HERO_ASCENSION, ROLE_ASCENSION, ASCENSION_CHEST, TITAN_MISSION, TITAN_ARENA, TITAN_ARTIFACT, TITAN_ARTIFACT_CHEST, TITAN_VALLEY, TITAN_SPIRITS, TITAN_ARTIFACT_MERCHANT, TITAN_ARENA_HALL_OF_FAME, CLAN_PVP, CLAN_PVP_MERCHANT, CLAN_GLOBAL_PVP, CLAN_GLOBAL_PVP_TITAN, ARTIFACT, ZEPPELIN, ARTIFACT_CHEST, ARTIFACT_MERCHANT, EXPEDITIONS, SUBSCRIPTION, NY2018_GIFTS, NY2018_TREE, NY2018_WELCOME, ADVENTURE, ADVENTURESOLO, SANCTUARY, PET_MERCHANT, PET_LIST, PET_SUMMON, BOSS_RATING_EVENT, BRAWL
		 */
		this.goNavigtor = function (windowName) {
			let mechanicStorage = selfGame["game.data.storage.mechanic.MechanicStorage"];
			let window = mechanicStorage[windowName];
			let event = new selfGame["game.mediator.gui.popup.PopupStashEventParams"];
			let Game = selfGame['Game'];
			let navigator = getF(Game, "get_navigator")
			let navigate = getProtoFn(selfGame["game.screen.navigator.GameNavigator"], 18)
			let instance = getFnP(Game, 'get_instance');
			Game[instance]()[navigator]()[navigate](window, event);
		}

		/**
		 * Move to the sanctuary cheats.goSanctuary()
		 *
		 * ������������� � ��������� cheats.goSanctuary()
		 */
		this.goSanctuary = () => {
			this.goNavigtor("SANCTUARY");
		}

		/**
		 * Go to Guild War
		 *
		 * ������� � ����� �������
		 */
		this.goClanWar = function() {
			let instance = getFnP(selfGame["game.model.GameModel"], 'get_instance')
			let player = selfGame["game.model.GameModel"][instance]().A;
			let clanWarSelect = selfGame["game.mechanics.cross_clan_war.popup.selectMode.CrossClanWarSelectModeMediator"];
			new clanWarSelect(player).open();
		}

		/**
		 * Go to BrawlShop
		 *
		 * ������������� � BrawlShop
		 */
		this.goBrawlShop = () => {
			const instance = getFnP(selfGame["game.model.GameModel"], 'get_instance')
			const P_36 = getProtoFn(selfGame["game.model.user.Player"], 36);
			const PSD_0 = getProtoFn(selfGame["game.model.user.shop.PlayerShopData"], 0);
			const IM_0 = getProtoFn(selfGame["haxe.ds.IntMap"], 0);
			const PSDE_4 = getProtoFn(selfGame["game.model.user.shop.PlayerShopDataEntry"], 4);

			const player = selfGame["game.model.GameModel"][instance]().A;
			const shop = player[P_36][PSD_0][IM_0][1038][PSDE_4];
			const shopPopup = new selfGame["game.mechanics.brawl.mediator.BrawlShopPopupMediator"](player, shop)
			shopPopup.open(new selfGame["game.mediator.gui.popup.PopupStashEventParams"])
		}

		/**
		 * Game library availability tracker
		 *
		 * ������������ ����������� ������� ����������
		 */
		function checkLibLoad() {
			timeout = setTimeout(() => {
				if (Game.GameModel) {
					changeLib();
				} else {
					checkLibLoad();
				}
			}, 100)
		}

		/**
		 * Game library data spoofing
		 *
		 * ������� ������ ������� ����������
		 */
		function changeLib() {
		console.log('lib connect');
		const originalStartFunc = Game.GameModel.prototype.start;
		Game.GameModel.prototype.start = function (a, b, c) {
			self.libGame = b.raw;
			try {
				const levels = b.raw.seasonAdventure.level;
				for (const id in levels) {
					const level = levels[id];
					level.clientData.graphics.fogged = level.clientData.graphics.visible
				}
				const adv = b.raw.seasonAdventure.list[1];
				adv.clientData.asset = 'dialog_season_adventure_tiles';
			} catch (e) {
				console.warn(e);
			}
			originalStartFunc.call(this, a, b, c);
		}
	}
		/**
		 * Returns the value of a language constant
		 *
		 * ���������� �������� �������� ���������
		 * @param {*} langConst language constant // �������� ���������
		 * @returns
		 */
		this.translate = function (langConst) {
			return Game.Translate.translate(langConst);
		}

		connectGame();
		checkLibLoad();
	}

	/**
	 * Auto collection of gifts
	 *
	 * �������� ��������
	 */
	function getAutoGifts() {
		let valName = 'giftSendIds_' + userInfo.id;

		if (!localStorage['clearGift' + userInfo.id]) {
			localStorage[valName] = '';
			localStorage['clearGift' + userInfo.id] = '+';
		}

		if (!localStorage[valName]) {
			localStorage[valName] = '';
		}

		/**
		 * Submit a request to receive gift codes
		 *
		 * �������� ������� ��� ��������� ����� ��������
		 */
		fetch('https://zingery.ru/heroes/getGifts.php', {
			method: 'POST',
			body: JSON.stringify({scriptInfo, userInfo})
		}).then(
			response => response.json()
		).then(
			data => {
				let freebieCheckCalls = {
					calls: []
				}
				data.forEach((giftId, n) => {
					if (localStorage[valName].includes(giftId)) return;
					//localStorage[valName] += ';' + giftId;
					freebieCheckCalls.calls.push({
						name: "freebieCheck",
						args: {
							giftId
						},
						ident: giftId
					});
				});

				if (!freebieCheckCalls.calls.length) {
					return;
				}

				send(JSON.stringify(freebieCheckCalls), e => {
					let countGetGifts = 0;
					const gifts = [];
					for (check of e.results) {
						gifts.push(check.ident);
						if (check.result.response != null) {
							countGetGifts++;
						}
					}
					const saveGifts = localStorage[valName].split(';');
					localStorage[valName] = [...saveGifts, ...gifts].slice(-50).join(';');
					console.log(`${I18N('GIFTS')}: ${countGetGifts}`);
				});
			}
		)
	}

	/**
	 * To fill the kills in the Forge of Souls
	 *
	 * ������ ����� � ������� ���
	 */
	async function bossRatingEvent() {
		const topGet = await Send(JSON.stringify({ calls: [{ name: "topGet", args: { type: "bossRatingTop", extraId: 0 }, ident: "body" }] }));
		if (!topGet) {
			setProgress(`${I18N('EVENT')} ${I18N('NOT_AVAILABLE')}`, true);
			return;
		}
		const replayId = topGet.results[0].result.response[0].userData.replayId;
		const result = await Send(JSON.stringify({
			calls: [
				{ name: "battleGetReplay", args: { id: replayId }, ident: "battleGetReplay" },
				{ name: "heroGetAll", args: {}, ident: "heroGetAll" },
				{ name: "pet_getAll", args: {}, ident: "pet_getAll" },
				{ name: "offerGetAll", args: {}, ident: "offerGetAll" }
			]
		}));
		const bossEventInfo = result.results[3].result.response.find(e => e.offerType == "bossEvent");
		if (!bossEventInfo) {
			setProgress(`${I18N('EVENT')} ${I18N('NOT_AVAILABLE')}`, true);
			return;
		}
		const usedHeroes = bossEventInfo.progress.usedHeroes;
		const party = Object.values(result.results[0].result.response.replay.attackers);
		const availableHeroes = Object.values(result.results[1].result.response).map(e => e.id);
		const availablePets = Object.values(result.results[2].result.response).map(e => e.id);
		const calls = [];
		/**
		 * First pack
		 *
		 * ������ �����
		 */
		const args = {
			heroes: [],
			favor: {}
		}
		for (let hero of party) {
			if (hero.id >= 6000 && availablePets.includes(hero.id)) {
				args.pet = hero.id;
				continue;
			}
			if (!availableHeroes.includes(hero.id) || usedHeroes.includes(hero.id)) {
				continue;
			}
			args.heroes.push(hero.id);
			if (hero.favorPetId) {
				args.favor[hero.id] = hero.favorPetId;
			}
		}
		if (args.heroes.length) {
			calls.push({
				name: "bossRatingEvent_startBattle",
				args,
				ident: "body_0"
			});
		}
		/**
		 * Other packs
		 *
		 * ������ �����
		 */
		let heroes = [];
		let count = 1;
		while (heroId = availableHeroes.pop()) {
			if (args.heroes.includes(heroId) || usedHeroes.includes(heroId)) {
				continue;
			}
			heroes.push(heroId);
			if (heroes.length == 5) {
				calls.push({
					name: "bossRatingEvent_startBattle",
					args: {
						heroes: [...heroes],
						pet: availablePets[Math.floor(Math.random() * availablePets.length)]
					},
					ident: "body_" + count
				});
				heroes = [];
				count++;
			}
		}

		if (!calls.length) {
			setProgress(`${I18N('NO_HEROES')}`, true);
			return;
		}

		const resultBattles = await Send(JSON.stringify({ calls }));
		console.log(resultBattles);
		rewardBossRatingEvent();
	}

	/**
	 * Collecting Rewards from the Forge of Souls
	 *
	 * ���� ������� �� ������� ���
	 */
	function rewardBossRatingEvent() {
		let rewardBossRatingCall = '{"calls":[{"name":"offerGetAll","args":{},"ident":"offerGetAll"}]}';
		send(rewardBossRatingCall, function (data) {
			let bossEventInfo = data.results[0].result.response.find(e => e.offerType == "bossEvent");
			if (!bossEventInfo) {
				setProgress(`${I18N('EVENT')} ${I18N('NOT_AVAILABLE')}`, true);
				return;
			}

			let farmedChests = bossEventInfo.progress.farmedChests;
			let score = bossEventInfo.progress.score;
			setProgress(`${I18N('DAMAGE_AMOUNT')}: ${score}`);
			let revard = bossEventInfo.reward;

			let getRewardCall = {
				calls: []
			}

			let count = 0;
			for (let i = 1; i < 10; i++) {
				if (farmedChests.includes(i)) {
					continue;
				}
				if (score < revard[i].score) {
					break;
				}
				getRewardCall.calls.push({
					name: "bossRatingEvent_getReward",
					args: {
						rewardId: i
					},
					ident: "body_" + i
				});
				count++;
			}
			if (!count) {
				setProgress(`${I18N('NOTHING_TO_COLLECT')}`, true);
				return;
			}

			send(JSON.stringify(getRewardCall), e => {
				console.log(e);
				setProgress(`${I18N('COLLECTED')} ${e?.results?.length} ${I18N('REWARD')}`, true);
			});
		});
	}

	/**
	 * Collect Easter eggs and event rewards
	 *
	 * ������� �������� � ������� �������
	 */
	function offerFarmAllReward() {
		const offerGetAllCall = '{"calls":[{"name":"offerGetAll","args":{},"ident":"offerGetAll"}]}';
		return Send(offerGetAllCall).then((data) => {
			const offerGetAll = data.results[0].result.response.filter(e => e.type == "reward" && !e?.freeRewardObtained && e.reward && e.id != 83);
			if (!offerGetAll.length) {
				setProgress(`${I18N('NOTHING_TO_COLLECT')}`, true);
				return;
			}

			const calls = [];
			for (let reward of offerGetAll) {
				calls.push({
					name: "offerFarmReward",
					args: {
						offerId: reward.id
					},
					ident: "offerFarmReward_" + reward.id
				});
			}

			return Send(JSON.stringify({ calls })).then(e => {
				console.log(e);
				setProgress(`${I18N('COLLECTED')} ${e?.results?.length} ${I18N('REWARD')}`, true);
			});
		});
	}

	/**
	 * Assemble Outland
	 *
	 * ������� ����������
	 */
	function getOutland() {
		return new Promise(function (resolve, reject) {
			send('{"calls":[{"name":"bossGetAll","args":{},"ident":"bossGetAll"}]}', e => {
				let bosses = e.results[0].result.response;

				let bossRaidOpenChestCall = {
					calls: []
				};

				for (let boss of bosses) {
					if (boss.mayRaid) {
						bossRaidOpenChestCall.calls.push({
							name: "bossRaid",
							args: {
								bossId: boss.id
							},
							ident: "bossRaid_" + boss.id
						});
						bossRaidOpenChestCall.calls.push({
							name: "bossOpenChest",
							args: {
								bossId: boss.id,
								amount: 1,
								starmoney: 0
							},
							ident: "bossOpenChest_" + boss.id
						});
					} else if (boss.chestId == 1) {
						bossRaidOpenChestCall.calls.push({
							name: "bossOpenChest",
							args: {
								bossId: boss.id,
								amount: 1,
								starmoney: 0
							},
							ident: "bossOpenChest_" + boss.id
						});
					}
				}

				if (!bossRaidOpenChestCall.calls.length) {
					setProgress(`${I18N('OUTLAND')} ${I18N('NOTHING_TO_COLLECT')}`, true);
					resolve();
					return;
				}

				send(JSON.stringify(bossRaidOpenChestCall), e => {
					setProgress(`${I18N('OUTLAND')} ${I18N('COLLECTED')}`, true);
					resolve();
				});
			});
		});
	}

	/**
	 * Collect all rewards
	 *
	 * ������� ��� �������
	 */
	function questAllFarm() {
		return new Promise(function (resolve, reject) {
			let questGetAllCall = {
				calls: [{
					name: "questGetAll",
					args: {},
					ident: "body"
				}]
			}
			send(JSON.stringify(questGetAllCall), function (data) {
				let questGetAll = data.results[0].result.response;
				const questAllFarmCall = {
					calls: []
				}
				let number = 0;
				for (let quest of questGetAll) {
					if (quest.id < 1e6 && quest.state == 2) {
						questAllFarmCall.calls.push({
							name: "questFarm",
							args: {
								questId: quest.id
							},
							ident: `group_${number}_body`
						});
						number++;
					}
				}

				if (!questAllFarmCall.calls.length) {
					setProgress(`${I18N('COLLECTED')} ${number} ${I18N('REWARD')}`, true);
					resolve();
					return;
				}

				send(JSON.stringify(questAllFarmCall), function (res) {
					console.log(res);
					setProgress(`${I18N('COLLECTED')} ${number} ${I18N('REWARD')}`, true);
					resolve();
				});
			});
		})
	}

	/**
	 * Mission auto repeat
	 *
	 * ���������� ������
	 * isStopSendMission = false;
	 * isSendsMission = true;
	 **/
	this.sendsMission = async function (param) {
		if (isStopSendMission) {
			isSendsMission = false;
			console.log(I18N('STOPPED'));
			setProgress('');
			await popup.confirm(`${I18N('STOPPED')}<br>${I18N('REPETITIONS')}: ${param.count}`, [{
				msg: 'Ok',
				result: true
			}, ])
			return;
		}
		lastMissionBattleStart = Date.now();
		let missionStartCall = {
			"calls": [{
				"name": "missionStart",
				"args": lastMissionStart,
				"ident": "body"
			}]
		}
		/**
		 * Mission Request
		 *
		 * ������ �� ���������� �����
		 */
		SendRequest(JSON.stringify(missionStartCall), async e => {
					if (e['error']) {

						if(e['error']['name'] === 'NotEnough')
						{
							setProgress(`������ � ${args.id} ��������`, true);
							resolve();
						}

						console.log(e['error']);
						reject(e['error']);
						return;
					}
			/**
			 * Mission data calculation
			 *
			 * ������ ������ �����
			 */
			BattleCalc(e.results[0].result.response, 'get_tower', async r => {
			/** missionTimer */
			let timer = getTimer(r.battleTime);
			const period = Math.ceil((Date.now() - lastMissionBattleStart) / 1000);
			if (period < timer) {
				await countdownTimer(timer, `${I18N('MISSIONS_PASSED')}: ${param.count}`);
			}

			let missionEndCall = {
				"calls": [{
					"name": "missionEnd",
					"args": {
						"id": param.id,
						"result": r.result,
						"progress": r.progress
					},
					"ident": "body"
				}]
			}
				/**
				 * Mission Completion Request
				 *
				 * ������ �� ���������� ������
				 */
				SendRequest(JSON.stringify(missionEndCall), async (e) => {
				if (e['error']) {
					isSendsMission = false;
					console.log(e['error']);
					setProgress('');
					let msg = e['error'].name + ' ' + e['error'].description + `<br>${I18N('REPETITIONS')}: ${param.count}`;
					await popup.confirm(msg, [
						{msg: 'Ok', result: true},
					])
					return;
				}
				r = e.results[0].result.response;
				if (r['error']) {
					isSendsMission = false;
					console.log(r['error']);
					setProgress('');
					await popup.confirm(`<br>${I18N('REPETITIONS')}: ${param.count}` + ' 3 ' + r['error'], [
						{msg: 'Ok', result: true},
					])
					return;
				}

				param.count++;
				setProgress(`${I18N('MISSIONS_PASSED')}: ${param.count} (${I18N('STOP')})`, false, () => {
					isStopSendMission = true;
				});
				setTimeout(sendsMission, 1, param);
			});
		})
	});
}


	/**
	 * Recursive opening of russian dolls
	 *
	 * ����������� �������� ��������
	 */
	function openRussianDoll(id, count, sum) {
		sum = sum || 0;
		sum += count;
		send('{"calls":[{"name":"consumableUseLootBox","args":{"libId":'+id+',"amount":'+count+'},"ident":"body"}]}', e => {
			setProgress(`${I18N('OPEN')} ${count}`, true);
			let result = e.results[0].result.response;
			let newCount = 0;
			for(let n of result) {
				if (n?.consumable && n.consumable[id]) {
					newCount += n.consumable[id]
				}
			}
			if (newCount) {
				openRussianDoll(id, newCount, sum);
			} else {
				popup.confirm(`${I18N('TOTAL_OPEN')} ${sum}`);
			}
		})
	}

	/**
	 * Opening of russian dolls
	 *
	 * �������� ��������
	 */
async function openRussianDolls(libId, amount) {
	let sum = 0;
	const sumResult = {};
	let count = 0;

	while (amount) {
		sum += amount;
		setProgress(`${I18N('TOTAL_OPEN')} ${sum}`);
		const calls = [
			{
				name: 'consumableUseLootBox',
				args: { libId, amount },
				ident: 'body',
			},
		];
		const response = await Send(JSON.stringify({ calls })).then((e) => e.results[0].result.response);
		let [countLootBox, result] = Object.entries(response).pop();
		count += +countLootBox;
		let newCount = 0;

		if (result?.consumable && result.consumable[libId]) {
			newCount = result.consumable[libId];
			delete result.consumable[libId];
		}

		mergeItemsObj(sumResult, result);
		amount = newCount;
	}

	setProgress(`${I18N('TOTAL_OPEN')} ${sum}`, 5000);
	return [count, sumResult];
}

function mergeItemsObj(obj1, obj2) {
	for (const key in obj2) {
		if (obj1[key]) {
			if (typeof obj1[key] == 'object') {
				for (const innerKey in obj2[key]) {
					obj1[key][innerKey] = (obj1[key][innerKey] || 0) + obj2[key][innerKey];
				}
			} else {
				obj1[key] += obj2[key] || 0;
			}
		} else {
			obj1[key] = obj2[key];
		}
	}

	return obj1;
}

	/**
	 * Collect all mail, except letters with energy and charges of the portal
	 *
	 * ������� ��� �����, ����� ����� � �������� � �������� �������
	 */
	function mailGetAll() {
		const getMailInfo = '{"calls":[{"name":"mailGetAll","args":{},"ident":"body"}]}';

		return Send(getMailInfo).then(dataMail => {
			const letters = dataMail.results[0].result.response.letters;
			const letterIds = lettersFilter(letters);
			if (!letterIds.length) {
				setProgress(I18N('NOTHING_TO_COLLECT'), true);
				return;
			}

			const calls = [
				{ name: "mailFarm", args: { letterIds }, ident: "body" }
			];

			return Send(JSON.stringify({ calls })).then(res => {
				const lettersIds = res.results[0].result.response;
				if (lettersIds) {
					const countLetters = Object.keys(lettersIds).length;
					setProgress(`${I18N('RECEIVED')} ${countLetters} ${I18N('LETTERS')}`, true);
				}
			});
		});
	}

	/**
	 * Filters received emails
	 *
	 * ��������� ���������� ������
	 */
	function lettersFilter(letters) {
		const lettersIds = [];
		for (let l in letters) {
			letter = letters[l];
			const reward = letter.reward;
			/**
			 * Mail Collection Exceptions
			 *
			 * ���������� �� ���� �����
			 */
			const isFarmLetter = !(
				/** VIP Points // ��� ���� */
				(reward?.vipPoints ? reward.vipPoints : false)
			);
			if (isFarmLetter) {
				lettersIds.push(~~letter.id);
			}
		}
		return lettersIds;
	}

	/**
	 * Displaying information about the areas of the portal and attempts on the VG
	 *
	 * ����������� ���������� � ������ ������� � �������� �� ��
	 */
	async function justInfo() {
		return new Promise(async (resolve, reject) => {
			const calls = [{
				name: "userGetInfo",
				args: {},
				ident: "userGetInfo"
			},
				{
					name: "clanWarGetInfo",
					args: {},
					ident: "clanWarGetInfo"
				},
				{
					name: "titanArenaGetStatus",
					args: {},
					ident: "titanArenaGetStatus"
				}];
			const result = await Send(JSON.stringify({ calls }));
			const infos = result.results;
			const portalSphere = infos[0].result.response.refillable.find(n => n.id == 45);
			const clanWarMyTries = infos[1].result.response?.myTries ?? 0;
			const titansLevel = +(infos[2].result.response?.tier ?? 0);
			const titansStatus = infos[2].result.response?.status; //peace_time || battle

			const sanctuaryButton = buttons['goToSanctuary'].button;
			const clanWarButton = buttons['goToClanWar'].button;

			if (portalSphere.amount) {
				sanctuaryButton.style.color = portalSphere.amount >= 3 ? 'red' : 'brown';
				sanctuaryButton.title = `${I18N('SANCTUARY_TITLE')}\n${portalSphere.amount} ${I18N('PORTALS')}`;
			} else {
				sanctuaryButton.style.color = '';
				sanctuaryButton.title = I18N('SANCTUARY_TITLE');
			}
			if (clanWarMyTries) {
				clanWarButton.style.color = 'red';
				clanWarButton.title = `${I18N('GUILD_WAR_TITLE')}\n${clanWarMyTries}${I18N('ATTEMPTS')}`;
			} else {
				clanWarButton.style.color = '';
				clanWarButton.title = I18N('GUILD_WAR_TITLE');
			}

			if (titansLevel < 7 && titansStatus == 'battle') {
				const partColor = Math.floor(125 * titansLevel / 7);
				titansArenaButton.style.color = `rgb(255,${partColor},${partColor})`;
				titansArenaButton.title = `${I18N('TITAN_ARENA_TITLE')}\n${titansLevel} ${I18N('LEVEL')}`;
			} else {
				titansArenaButton.style.color = '';
				titansArenaButton.title = I18N('TITAN_ARENA_TITLE');
			}

			setProgress('<img src="https://zingery.ru/heroes/portal.png" style="height: 25px;position: relative;top: 5px;"> ' + `${portalSphere.amount} </br> ${I18N('GUILD_WAR')}: ${clanWarMyTries}`, true);
			resolve();
		});
	}

	async function buyWithPetExperience() {
		const itemLib = lib.getData('inventoryItem');
		const result = await Send('{"calls":[{"name":"inventoryGet","args":{},"ident":"inventoryGet"},{"name":"shopGet","args":{"shopId":"26"},"ident":"shopGet"}]}').then(e => e.results.map(n => n.result.response));
		const inventory = result[0];
		const slot = Object.values(result[1].slots).find(e => e.cost?.consumable?.[85]);

		const currentCount = inventory.consumable[85];
		const price = slot.cost.consumable[85];

		const typeBuyItem = Object.keys(slot.reward).pop();
		const itemIdBuyItem = Object.keys(slot.reward[typeBuyItem]).pop();
		const countBuyItem = slot.reward[typeBuyItem][itemIdBuyItem];
		const itemName = cheats.translate(`LIB_${typeBuyItem.toUpperCase()}_NAME_${itemIdBuyItem}`);

		if (slot.bought) {
			await popup.confirm(I18N('SECRET_WEALTH_ALREADY'), [
				{ msg: 'Ok', result: true },
			]);
			return;
		}

		const purchaseMsg = I18N('SECRET_WEALTH_BUY', { available: currentCount, countBuy: countBuyItem, name: itemName, price })
		const answer = await popup.confirm(purchaseMsg, [
			{ msg: I18N('BTN_NO'), result: false },
			{ msg: I18N('BTN_YES'), result: true },
		]);

		if (!answer) {
			setProgress(I18N('SECRET_WEALTH_CANCELED'), true);
			return;
		}

		if (currentCount < price) {
			const msg = I18N('SECRET_WEALTH_NOT_ENOUGH', { available: currentCount, need: price });
			await popup.confirm(msg, [
				{ msg: 'Ok', result: true },
			]);
			return;
		}

		const calls = [{
			name: "shopBuy",
			args: {
				shopId: 26,
				slot: slot.id,
				cost: slot.cost,
				reward: slot.reward
			},
			ident: "body"
		}];
		const bought = await Send(JSON.stringify({ calls })).then(e => e.results[0].result.response);

		const type = Object.keys(bought).pop();
		const itemId = Object.keys(bought[type]).pop();
		const count = bought[type][itemId];

		const resultMsg = I18N('SECRET_WEALTH_PURCHASED', { count, name: itemName });
		await popup.confirm(resultMsg, [
			{ msg: 'Ok', result: true },
		]);
	}

	async function buyWithPetExperienceAuto() {
		const itemLib = lib.getData('inventoryItem');
		const minCount = 450551;
		const result = await Send('{"calls":[{"name":"inventoryGet","args":{},"ident":"inventoryGet"},{"name":"shopGet","args":{"shopId":"26"},"ident":"shopGet"}]}').then(e => e.results.map(n => n.result.response));
		const inventory = result[0];
		const slot = Object.values(result[1].slots).find(e => e.cost?.consumable?.[85]);

		const currentCount = inventory.consumable[85];
		const price = slot.cost.consumable[85];

		if (slot.bought) {
			console.log(I18N('SECRET_WEALTH_ALREADY'));
			setProgress(I18N('SECRET_WEALTH_ALREADY'), true);
			return;
		}

		if (currentCount < price) {
			const msg = I18N('SECRET_WEALTH_NOT_ENOUGH', { available: currentCount, need: price });
			console.log(msg);
			setProgress(msg, true);
			return;
		}

		if ((currentCount - price) < minCount) {
			console.log(I18N('SECRET_WEALTH_UPGRADE_NEW_PET'));
			setProgress(I18N('SECRET_WEALTH_UPGRADE_NEW_PET'), true);
			return;
		}

		const calls = [{
			name: "shopBuy",
			args: {
				shopId: 26,
				slot: slot.id,
				cost: slot.cost,
				reward: slot.reward
			},
			ident: "body"
		}];
		const bought = await Send(JSON.stringify({ calls })).then(e => e.results[0].result.response);

		const type = Object.keys(bought).pop();
		const itemId = Object.keys(bought[type]).pop();
		const count = bought[type][itemId];
		const itemName = itemLib[type][itemId].label;

		const resultMsg = I18N('SECRET_WEALTH_PURCHASED', { count, name: itemName });
		console.log(resultMsg, bought);
		setProgress(resultMsg, true);
	}

	async function getDailyBonus() {
		const dailyBonusInfo = await Send(JSON.stringify({
			calls: [{
				name: "dailyBonusGetInfo",
				args: {},
				ident: "body"
			}]
		})).then(e => e.results[0].result.response);
		const { availableToday, availableVip, currentDay } = dailyBonusInfo;

		if (!availableToday) {
			console.log('��� �������');
			return;
		}

		const currentVipPoints = +userInfo.vipPoints;
		const dailyBonusStat = lib.getData('dailyBonusStatic');
		const vipInfo = lib.getData('level').vip;
		let currentVipLevel = 0;
		for (let i in vipInfo) {
			vipLvl = vipInfo[i];
			if (currentVipPoints >= vipLvl.vipPoints) {
				currentVipLevel = vipLvl.level;
			}
		}
		const vipLevelDouble = dailyBonusStat[`${currentDay}_0_0`].vipLevelDouble;

		const calls = [{
			name: "dailyBonusFarm",
			args: {
				vip: availableVip && currentVipLevel >= vipLevelDouble ? 1 : 0
			},
			ident: "body"
		}];

		const result = await Send(JSON.stringify({ calls }));
		if (result.error) {
			console.error(result.error);
			return;
		}

		const reward = result.results[0].result.response;
		const type = Object.keys(reward).pop();
		const itemId = Object.keys(reward[type]).pop();
		const count = reward[type][itemId];
		const itemName = cheats.translate(`LIB_${type.toUpperCase()}_NAME_${itemId}`);

		console.log(`���������� �������: �������� ${count} ${itemName}`, reward);
	}

	async function farmStamina() {
		const lootBox = await Send('{"calls":[{"name":"inventoryGet","args":{},"ident":"inventoryGet"}]}')
			.then(e => e.results[0].result.response.consumable[148]);

		/** �������� ������ ����� */
		if (!lootBox) {
			setProgress(I18N('NO_BOXES'), true);
			return;
		}

		const isOpening = await popup.confirm(I18N('OPEN_LOOTBOX', { lootBox }), [
			{ result: false, isClose: true },
			{ msg: I18N('BTN_YES'), result: true },
		]);

		if (!isOpening) {
			return;
		}

		for (let count = lootBox; count > 0; count--) {
			const result = await Send('{"calls":[{"name":"consumableUseLootBox","args":{"libId":148,"amount":1},"ident":"body"}]}')
				.then(e => e.results[0].result.response[0]);
			if ('stamina' in result) {
				setProgress(`${I18N('OPEN')}: ${lootBox - count}/${lootBox} ${I18N('STAMINA')} +${result.stamina}`, true);
				console.log('stamina +' + result.stamina);
				return;
			} else {
				setProgress(`${I18N('OPEN')}: ${lootBox - count}/${lootBox}`, false);
				console.log(result);
			}
		}

		setProgress(I18N('BOXES_OVER'), true);
	}

	async function fillActive() {
		const data = await Send(JSON.stringify({
			calls: [{
				name: "questGetAll",
				args: {},
				ident: "questGetAll"
			}, {
				name: "inventoryGet",
				args: {},
				ident: "inventoryGet"
			}, {
				name: "clanGetInfo",
				args: {},
				ident: "clanGetInfo"
			}
			]
		})).then(e => e.results.map(n => n.result.response));

		const quests = data[0];
		const inv = data[1];
		const stat = data[2].stat;
		const maxActive = 2000 - stat.todayItemsActivity;
		if (maxActive <= 0) {
			setProgress(I18N('NO_MORE_ACTIVITY'), true);
			return;
		}

		let countGetActive = 0;
		const quest = quests.find(e => e.id > 10046 && e.id < 10051);
		if (quest) {
			countGetActive = 1750 - quest.progress;
		}

		if (countGetActive <= 0) {
			countGetActive = maxActive;
		}
		console.log(countGetActive);

		countGetActive = +(await popup.confirm(I18N('EXCHANGE_ITEMS', { maxActive }), [
			{ result: false, isClose: true },
			{ msg: I18N('GET_ACTIVITY'), isInput: true, default: countGetActive.toString() },
		]));

		if (!countGetActive) {
			return;
		}

		if (countGetActive > maxActive) {
			countGetActive = maxActive;
		}

		const items = lib.getData('inventoryItem');

		let itemsInfo = [];
		for (let type of ['gear', 'scroll']) {
			for (let i in inv[type]) {
				const v = items[type][i]?.enchantValue || 0;
				itemsInfo.push({
					id: i,
					count: inv[type][i],
					v,
					type
				})
			}
			const invType = 'fragment' + type.toLowerCase().charAt(0).toUpperCase() + type.slice(1);
			for (let i in inv[invType]) {
				const v = items[type][i]?.fragmentEnchantValue || 0;
				itemsInfo.push({
					id: i,
					count: inv[invType][i],
					v,
					type: invType
				})
			}
		}
		itemsInfo = itemsInfo.filter(e => e.v < 4 && e.count > 200);
		itemsInfo = itemsInfo.sort((a, b) => b.count - a.count);
		console.log(itemsInfo);
		const activeItem = itemsInfo.shift();
		console.log(activeItem);
		const countItem = Math.ceil(countGetActive / activeItem.v);
		if (countItem > activeItem.count) {
			setProgress(I18N('NOT_ENOUGH_ITEMS'), true);
			console.log(activeItem);
			return;
		}

		await Send(JSON.stringify({
			calls: [{
				name: "clanItemsForActivity",
				args: {
					items: {
						[activeItem.type]: {
							[activeItem.id]: countItem
						}
					}
				},
				ident: "body"
			}]
		})).then(e => {
			/** TODO: ������� ���������� �������� */
			console.log(e);
			setProgress(`${I18N('ACTIVITY_RECEIVED')}: ` + e.results[0].result.response, true);
		});
	}

	async function buyHeroFragments() {
		const result = await Send('{"calls":[{"name":"inventoryGet","args":{},"ident":"inventoryGet"},{"name":"shopGetAll","args":{},"ident":"shopGetAll"}]}')
			.then(e => e.results.map(n => n.result.response));
		const inv = result[0];
		const shops = Object.values(result[1]).filter(shop => [4, 5, 6, 8, 9, 10, 17].includes(shop.id));
		const calls = [];

		for (let shop of shops) {
			const slots = Object.values(shop.slots);
			for (const slot of slots) {
				/* ��� ������� */
				if (slot.bought) {
					continue;
				}
				/* �� ���� ����� */
				if (!('fragmentHero' in slot.reward)) {
					continue;
				}
				const coin = Object.keys(slot.cost).pop();
				const coinId = Object.keys(slot.cost[coin]).pop();
				const stock = inv[coin][coinId] || 0;
				/* �� ������� �� ������� */
				if (slot.cost[coin][coinId] > stock) {
					continue;
				}
				inv[coin][coinId] -= slot.cost[coin][coinId];
				calls.push({
					name: "shopBuy",
					args: {
						shopId: shop.id,
						slot: slot.id,
						cost: slot.cost,
						reward: slot.reward,
					},
					ident: `shopBuy_${shop.id}_${slot.id}`,
				})
			}
		}

		if (!calls.length) {
			setProgress(I18N('NO_PURCHASABLE_HERO_SOULS'), true);
			return;
		}

		const bought = await Send(JSON.stringify({ calls })).then(e => e.results.map(n => n.result.response));
		if (!bought) {
			console.log('���-�� ����� �� ���')
			return;
		}

		let countHeroSouls = 0;
		for (const buy of bought) {
			countHeroSouls += +Object.values(Object.values(buy).pop()).pop();
		}
		console.log(countHeroSouls, bought, calls);
		setProgress(I18N('PURCHASED_HERO_SOULS', { countHeroSouls }), true);
	}

	/** ������� ������� ������� � ���������� �� 90 */
	async function bossOpenChestPay() {
		const info = await Send('{"calls":[{"name":"userGetInfo","args":{},"ident":"userGetInfo"},{"name":"bossGetAll","args":{},"ident":"bossGetAll"}]}')
			.then(e => e.results.map(n => n.result.response));

		const user = info[0];
		const boses = info[1];

		const currentStarMoney = user.starMoney;
		if (currentStarMoney < 540) {
			setProgress(I18N('NOT_ENOUGH_EMERALDS_540', { currentStarMoney }), true);
			return;
		}

		const calls = [];

		let n = 0;
		const amount = 1;
		for (let boss of boses) {
			const bossId = boss.id;
			if (boss.chestNum != 2) {
				continue;
			}
			for (const starmoney of [90, 90, 0]) {
				calls.push({
					name: "bossOpenChest",
					args: {
						bossId,
						amount,
						starmoney
					},
					ident: "bossOpenChest_" + (++n)
				});
			}
		}

		if (!calls.length) {
			setProgress(I18N('CHESTS_NOT_AVAILABLE'), true);
			return;
		}

		const result = await Send(JSON.stringify({ calls }));
		console.log(result);
		if (result?.results) {
			setProgress(`${I18N('OUTLAND_CHESTS_RECEIVED')}: ` + result.results.length, true);
		} else {
			setProgress(I18N('CHESTS_NOT_AVAILABLE'), true);
		}
	}

	async function autoRaidAdventure() {
		const calls = [
			{
				name: "userGetInfo",
				args: {},
				ident: "userGetInfo"
			},
			{
				name: "adventure_raidGetInfo",
				args: {},
				ident: "adventure_raidGetInfo"
			}
		];
		const result = await Send(JSON.stringify({ calls }))
			.then(e => e.results.map(n => n.result.response));

		const portalSphere = result[0].refillable.find(n => n.id == 45);
		const adventureRaid = Object.entries(result[1].raid).filter(e => e[1]).pop()
		const adventureId = adventureRaid ? adventureRaid[0] : 0;

		if (!portalSphere.amount || !adventureId) {
			setProgress(I18N('RAID_NOT_AVAILABLE'), true);
			return;
		}

		let countRaid = +(await popup.confirm(I18N('RAID_ADVENTURE', { adventureId }), [
			{ result: false, isClose: true },
			{ msg: '����', isInput: true, default: portalSphere.amount },
		]));

		if (!countRaid) {
			return;
		}

		if (countRaid > portalSphere.amount) {
			countRaid = portalSphere.amount;
		}

		const resultRaid = await Send(JSON.stringify({
			calls: [...Array(countRaid)].map((e, i) => ({
				name: "adventure_raid",
				args: {
					adventureId
				},
				ident: `body_${i}`
			}))
		})).then(e => e.results.map(n => n.result.response));

		if (!resultRaid.length) {
			console.log(resultRaid);
			setProgress(I18N('SOMETHING_WENT_WRONG'), true);
			return;
		}

		console.log(resultRaid, adventureId, portalSphere.amount);
		setProgress(I18N('ADVENTURE_COMPLETED', { adventureId, times: resultRaid.length }), true);
	}

	/** ������� ��� �������� ���������� � ������� �������� */
	async function clanStatistic() {
		const copy = function (text) {
			const copyTextarea = document.createElement("textarea");
			copyTextarea.style.opacity = "0";
			copyTextarea.textContent = text;
			document.body.appendChild(copyTextarea);
			copyTextarea.select();
			document.execCommand("copy");
			document.body.removeChild(copyTextarea);
			delete copyTextarea;
		}
		const calls = [
			{ name: "clanGetInfo", args: {}, ident: "clanGetInfo" },
			{ name: "clanGetWeeklyStat", args: {}, ident: "clanGetWeeklyStat" },
			{ name: "clanGetLog", args: {}, ident: "clanGetLog" },
		];

		const result = await Send(JSON.stringify({ calls }));

		const dataClanInfo = result.results[0].result.response;
		const dataClanStat = result.results[1].result.response;
		const dataClanLog = result.results[2].result.response;

		const membersStat = {};
		for (let i = 0; i < dataClanStat.stat.length; i++) {
			membersStat[dataClanStat.stat[i].id] = dataClanStat.stat[i];
		}

		const joinStat = {};
		historyLog = dataClanLog.history;
		for (let j in historyLog) {
			his = historyLog[j];
			if (his.event == 'join') {
				joinStat[his.userId] = his.ctime;
			}
		}

		const infoArr = [];
		const members = dataClanInfo.clan.members;
		for (let n in members) {
			var member = [
				n,
				members[n].name,
				members[n].level,
				dataClanInfo.clan.warriors.includes(+n) ? 1 : 0,
				(new Date(members[n].lastLoginTime * 1000)).toLocaleString().replace(',', ''),
				joinStat[n] ? (new Date(joinStat[n] * 1000)).toLocaleString().replace(',', '') : '',
				membersStat[n].activity.reverse().join('\t'),
				membersStat[n].adventureStat.reverse().join('\t'),
				membersStat[n].clanGifts.reverse().join('\t'),
				membersStat[n].clanWarStat.reverse().join('\t'),
				membersStat[n].dungeonActivity.reverse().join('\t'),
			];
			infoArr.push(member);
		}
		const info = infoArr.sort((a, b) => (b[2] - a[2])).map((e) => e.join('\t')).join('\n');
		console.log(info);
		copy(info);
		setProgress(I18N('CLAN_STAT_COPY'), true);
	}

	async function buyInStoreForGold() {
		const result = await Send('{"calls":[{"name":"shopGetAll","args":{},"ident":"body"},{"name":"userGetInfo","args":{},"ident":"userGetInfo"}]}').then(e => e.results.map(n => n.result.response));
		const shops = result[0];
		const user = result[1];
		let gold = user.gold;
		const calls = [];
		if (shops[17]) {
			const slots = shops[17].slots;
			for (let i = 1; i <= 2; i++) {
				if (!slots[i].bought) {
					const costGold = slots[i].cost.gold;
					if ((gold - costGold) < 0) {
						continue;
					}
					gold -= costGold;
					calls.push({
						name: "shopBuy",
						args: {
							shopId: 17,
							slot: i,
							cost: slots[i].cost,
							reward: slots[i].reward,
						},
						ident: 'body_' + i,
					})
				}
			}
		}
		const slots = shops[1].slots;
		for (let i = 4; i <= 6; i++) {
			if (!slots[i].bought && slots[i]?.cost?.gold) {
				const costGold = slots[i].cost.gold;
				if ((gold - costGold) < 0) {
					continue;
				}
				gold -= costGold;
				calls.push({
					name: "shopBuy",
					args: {
						shopId: 1,
						slot: i,
						cost: slots[i].cost,
						reward: slots[i].reward,
					},
					ident: 'body_' + i,
				})
			}
		}

		if (!calls.length) {
			setProgress(I18N('NOTHING_BUY'), true);
			return;
		}

		const resultBuy = await Send(JSON.stringify({ calls })).then(e => e.results.map(n => n.result.response));
		console.log(resultBuy);
		const countBuy = resultBuy.length;
		setProgress(I18N('LOTS_BOUGHT', { countBuy }), true);
	}

	function rewardsAndMailFarm() {
	return new Promise(function (resolve, reject) {
		let questGetAllCall = {
			calls: [{
				name: "questGetAll",
				args: {},
				ident: "questGetAll"
			}, {
				name: "mailGetAll",
				args: {},
				ident: "mailGetAll"
			}]
		}
		send(JSON.stringify(questGetAllCall), function (data) {
			if (!data) return;
			const questGetAll = data.results[0].result.response.filter((e) => e.state == 2);
			const questBattlePass = lib.getData('quest').battlePass;
			const questChainBPass = lib.getData('battlePass').questChain;
			const listBattlePass = lib.getData('battlePass').list;

			const questAllFarmCall = {
				calls: [],
			};
			const questIds = [];
			for (let quest of questGetAll) {
				if (quest.id >= 2001e4) {
					continue;
				}
				if (quest.id > 1e6 && quest.id < 2e7) {
					const questInfo = questBattlePass[quest.id];
					const chain = questChainBPass[questInfo.chain];
					if (chain.requirement?.battlePassTicket) {
						continue;
					}
					const battlePass = listBattlePass[chain.battlePass];
					const startTime = battlePass.startCondition.time.value * 1e3
					const endTime = new Date(startTime + battlePass.duration * 1e3);
					if (startTime > Date.now() || endTime < Date.now()) {
						continue;
					}
				}
				if (quest.id >= 2e7) {
					questIds.push(quest.id);
					continue;
				}
				questAllFarmCall.calls.push({
					name: 'questFarm',
					args: {
						questId: quest.id,
					},
					ident: `questFarm_${quest.id}`,
				});
			}

			if (questIds.length) {
				questAllFarmCall.calls.push({
					name: 'quest_questsFarm',
					args: { questIds },
					ident: 'quest_questsFarm',
				});
			}

			let letters = data?.results[1]?.result?.response?.letters;
			letterIds = lettersFilter(letters);

			if (letterIds.length) {
				questAllFarmCall.calls.push({
					name: 'mailFarm',
					args: { letterIds },
					ident: 'mailFarm',
				});
			}

			if (!questAllFarmCall.calls.length) {
				setProgress(I18N('NOTHING_TO_COLLECT'), true);
				resolve();
				return;
			}

			send(JSON.stringify(questAllFarmCall), async function (res) {
				let countQuests = 0;
				let countMail = 0;
				let questsIds = [];
				for (let call of res.results) {
					if (call.ident.includes('questFarm')) {
						countQuests++;
					} else if (call.ident.includes('questsFarm')) {
						countQuests += Object.keys(call.result.response).length;
					} else if (call.ident.includes('mailFarm')) {
						countMail = Object.keys(call.result.response).length;
					}

					const newQuests = call.result.newQuests;
					if (newQuests) {
						for (let quest of newQuests) {
							if ((quest.id < 1e6 || (quest.id >= 2e7 && quest.id < 2001e4)) && quest.state == 2) {
								questsIds.push(quest.id);
							}
						}
					}
				}

				while (questsIds.length) {
					const questIds = [];
					const calls = [];
					for (let questId of questsIds) {
						if (questId < 1e6) {
							calls.push({
								name: 'questFarm',
								args: {
									questId,
								},
								ident: `questFarm_${questId}`,
							});
							countQuests++;
						} else if (questId >= 2e7 && questId < 2001e4) {
							questIds.push(questId);
							countQuests++;
						}
					}
					calls.push({
						name: 'quest_questsFarm',
						args: { questIds },
						ident: 'body',
					});
					const results = await Send({ calls }).then((e) => e.results.map((e) => e.result));
					questsIds = [];
					for (const result of results) {
						const newQuests = result.newQuests;
						if (newQuests) {
							for (let quest of newQuests) {
								if (quest.state == 2) {
									questsIds.push(quest.id);
								}
							}
						}
					}
				}

				setProgress(I18N('COLLECT_REWARDS_AND_MAIL', { countQuests, countMail }), true);
				resolve();
			});
		});
	})
}

	class epicBrawl {
		timeout = null;
		time = null;

		constructor() {
			if (epicBrawl.inst) {
				return epicBrawl.inst;
			}
			epicBrawl.inst = this;
			return this;
		}
		runTimeout(func, timeDiff) {
		const worker = new Worker(URL.createObjectURL(new Blob([`
				self.onmessage = function(e) {
					const timeDiff = e.data;

					if (timeDiff > 0) {
						setTimeout(() => {
							self.postMessage(1);
							self.close();
						}, timeDiff);
					}
				};
			`])));
		worker.postMessage(timeDiff);
		worker.onmessage = () => {
			func();
		};
		return true;
	}

	timeDiff(date1, date2) {
		const date1Obj = new Date(date1);
		const date2Obj = new Date(date2);

		const timeDiff = Math.abs(date2Obj - date1Obj);

		const totalSeconds = timeDiff / 1000;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);

		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(seconds).padStart(2, '0');

		return `${formattedMinutes}:${formattedSeconds}`;
	}
		check() {
			console.log(new Date(this.time))
			if (Date.now() > this.time) {
				this.timeout = null;
				this.start()
				return;
			}
			this.timeout = this.runTimeout(() => this.check(), 6e4);
			return this.timeDiff(this.time, Date.now())
		}

async start() {
		if (this.timeout) {
			const time = this.timeDiff(this.time, Date.now());
			console.log(new Date(this.time))
			setProgress(I18N('TIMER_ALREADY', { time }), false, hideProgress);
			return;
		}
		setProgress(I18N('EPIC_BRAWL'), false, hideProgress);
		const teamInfo = await Send('{"calls":[{"name":"teamGetAll","args":{},"ident":"teamGetAll"},{"name":"teamGetFavor","args":{},"ident":"teamGetFavor"},{"name":"userGetInfo","args":{},"ident":"userGetInfo"}]}').then(e => e.results.map(n => n.result.response));
		const refill = teamInfo[2].refillable.find(n => n.id == 52)
		this.time = (refill.lastRefill + 3600) * 1000
		const attempts = refill.amount;
		if (!attempts) {
			console.log(new Date(this.time));
			const time = this.check();
			setProgress(I18N('NO_ATTEMPTS_TIMER_START', { time }), false, hideProgress);
			return;
		}

		if (!teamInfo[0].epic_brawl) {
			setProgress(I18N('NO_HEROES_PACK'), false, hideProgress);
			return;
		}

		const args = {
			heroes: teamInfo[0].epic_brawl.filter(e => e < 1000),
			pet: teamInfo[0].epic_brawl.filter(e => e > 6000).pop(),
			favor: teamInfo[1].epic_brawl,
		}

		let wins = 0;
		let coins = 0;
		let streak = { progress: 0, nextStage: 0 };
		for (let i = attempts; i > 0; i--) {
			const info = await Send(JSON.stringify({
				calls: [
					{ name: "epicBrawl_getEnemy", args: {}, ident: "epicBrawl_getEnemy" }, { name: "epicBrawl_startBattle", args, ident: "epicBrawl_startBattle" }
				]
			})).then(e => e.results.map(n => n.result.response));

			const { progress, result } = await Calc(info[1].battle);
			const endResult = await Send(JSON.stringify({ calls: [{ name: "epicBrawl_endBattle", args: { progress, result }, ident: "epicBrawl_endBattle" }, { name: "epicBrawl_getWinStreak", args: {}, ident: "epicBrawl_getWinStreak" }] })).then(e => e.results.map(n => n.result.response));

			const resultInfo = endResult[0].result;
			streak = endResult[1];

			wins += resultInfo.win;
			coins += resultInfo.reward ? resultInfo.reward.coin[39] : 0;

			console.log(endResult[0].result)
			if (endResult[1].progress == endResult[1].nextStage) {
				const farm = await Send('{"calls":[{"name":"epicBrawl_farmWinStreak","args":{},"ident":"body"}]}').then(e => e.results[0].result.response);
				coins += farm.coin[39];
			}

			setProgress(I18N('EPIC_BRAWL_RESULT', {
				i, wins, attempts, coins,
				progress: streak.progress,
				nextStage: streak.nextStage,
				end: '',
			}), false, hideProgress);
		}

		console.log(new Date(this.time));
		const time = this.check();
		setProgress(I18N('EPIC_BRAWL_RESULT', {
			wins, attempts, coins,
			i: '',
			progress: streak.progress,
			nextStage: streak.nextStage,
			end: I18N('ATTEMPT_ENDED', { time }),
		}), false, hideProgress);
	}
	}

	function Sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	function countdownTimer(seconds, message) {
		message = message || I18N('TIMER');
		const stopTimer = Date.now() + seconds * 1e3
		return new Promise(resolve => {
			const interval = setInterval(async () => {
				const now = Date.now();
				setProgress(`${message} ${((stopTimer - now) / 1000).toFixed(2)}`, false);
				if (now > stopTimer) {
					clearInterval(interval);
					setProgress('', 1);
					resolve();
				}
			}, 100);
		});
	}

	/** ������ ����� � ������� ���� */
	async function bossRatingEventSouls() {
		const data = await Send({
			calls: [
				{ name: "heroGetAll", args: {}, ident: "teamGetAll" },
				{ name: "offerGetAll", args: {}, ident: "offerGetAll" },
				{ name: "pet_getAll", args: {}, ident: "pet_getAll" },
			]
		});
		const bossEventInfo = data.results[1].result.response.find(e => e.offerType == "bossEvent");
		if (!bossEventInfo) {
			setProgress('����� ��������', true);
			return;
		}

		if (bossEventInfo.progress.score > 250) {
			setProgress('��� ����� ������ 250 ������');
			rewardBossRatingEventSouls();
			return;
		}
		const availablePets = Object.values(data.results[2].result.response).map(e => e.id);
		const heroGetAllList = data.results[0].result.response;
		const usedHeroes = bossEventInfo.progress.usedHeroes;
		const heroList = [];

		for (let heroId in heroGetAllList) {
			let hero = heroGetAllList[heroId];
			if (usedHeroes.includes(hero.id)) {
				continue;
			}
			heroList.push(hero.id);
		}

		if (!heroList.length) {
			setProgress('��� ������', true);
			return;
		}

		const pet = availablePets.includes(6005) ? 6005 : availablePets[Math.floor(Math.random() * availablePets.length)];
		const petLib = lib.getData('pet');
		let count = 1;

		for (const heroId of heroList) {
			const args = {
				heroes: [heroId],
				pet
			}
			/** ����� ������� ��� ����� */
			for (const petId of availablePets) {
				if (petLib[petId].favorHeroes.includes(heroId)) {
					args.favor = {
						[heroId]: petId
					}
					break;
				}
			}

			const calls = [{
				name: "bossRatingEvent_startBattle",
				args,
				ident: "body"
			}, {
				name: "offerGetAll",
				args: {},
				ident: "offerGetAll"
			}];

			const res = await Send({ calls });
			count++;

			if ('error' in res) {
				console.error(res.error);
				setProgress('������������� ���� � ���������� �����', true);
				return;
			}

			const eventInfo = res.results[1].result.response.find(e => e.offerType == "bossEvent");
			if (eventInfo.progress.score > 250) {
				break;
			}
			setProgress('���������� ������ ������: ' + eventInfo.progress.score + '<br>������������ ' + count + ' ������');
		}

		rewardBossRatingEventSouls();
	}
	/** ���� ������� �� ������� ��� */
	async function rewardBossRatingEventSouls() {
		const data = await Send({
			calls: [
				{ name: "offerGetAll", args: {}, ident: "offerGetAll" }
			]
		});

		const bossEventInfo = data.results[0].result.response.find(e => e.offerType == "bossEvent");
		if (!bossEventInfo) {
			setProgress('����� ��������', true);
			return;
		}

		const farmedChests = bossEventInfo.progress.farmedChests;
		const score = bossEventInfo.progress.score;
		// setProgress('���������� ������ ������: ' + score);
		const revard = bossEventInfo.reward;
		const calls = [];

		let count = 0;
		for (let i = 1; i < 10; i++) {
			if (farmedChests.includes(i)) {
				continue;
			}
			if (score < revard[i].score) {
				break;
			}
			calls.push({
				name: "bossRatingEvent_getReward",
				args: {
					rewardId: i
				},
				ident: "body_" + i
			});
			count++;
		}
		if (!count) {
			setProgress('������ ��������', true);
			return;
		}

		Send({ calls }).then(e => {
			console.log(e);
			setProgress('������� ' + e?.results?.length + ' ������', true);
		})
	}

	async function rollAscension() {
		const refillable = await Send({calls:[
				{
					name:"userGetInfo",
					args:{},
					ident:"userGetInfo"
				}
			]}).then(e => e.results[0].result.response.refillable);
		const i47 = refillable.find(i => i.id == 47);
		if (i47?.amount) {
			await Send({ calls: [{ name: "ascensionChest_open", args: { paid: false, amount: 1 }, ident: "body" }] });
			setProgress(I18N('DONE'), true);
		} else {
			setProgress(I18N('NOT_ENOUGH_AP'), true);
		}
	}
    /**
 * Collect gifts for the New Year
 *
 * ������� ������� �� ����� ���
 */
function getGiftNewYear() {
	Send({ calls: [{ name: "newYearGiftGet", args: { type: 0 }, ident: "body" }] }).then(e => {
		const gifts = e.results[0].result.response.gifts;
		const calls = gifts.filter(e => e.opened == 0).map(e => ({
			name: "newYearGiftOpen",
			args: {
				giftId: e.id
			},
			ident: `body_${e.id}`
		}));
		if (!calls.length) {
			setProgress(I18N('NY_NO_GIFTS'), 5000);
			return;
		}
		Send({ calls }).then(e => {
			console.log(e.results)
			const msg = I18N('NY_GIFTS_COLLECTED', { count: e.results.length });
			console.log(msg);
			setProgress(msg, 5000);
		});
	})
}

async function updateArtifacts() {
	const count = +await popup.confirm(I18N('SET_NUMBER_LEVELS'), [
		{ msg: I18N('BTN_GO'), isInput: true, default: 10 },
		{ result: false, isClose: true }
	]);
	if (!count) {
		return;
	}
	const quest = new questRun;
	await quest.autoInit();
	const heroes = Object.values(quest.questInfo['heroGetAll']);
	const inventory = quest.questInfo['inventoryGet'];
	const calls = [];
	for (let i = count; i > 0; i--) {
		const upArtifact = quest.getUpgradeArtifact();
		if (!upArtifact.heroId) {
			if (await popup.confirm(I18N('POSSIBLE_IMPROVE_LEVELS', { count: calls.length }), [
				{ msg: I18N('YES'), result: true },
				{ result: false, isClose: true }
			])) {
				break;
			} else {
				return;
			}
		}
		const hero = heroes.find(e => e.id == upArtifact.heroId);
		hero.artifacts[upArtifact.slotId].level++;
		inventory[upArtifact.costCurrency][upArtifact.costId] -= upArtifact.costValue;
		calls.push({
			name: "heroArtifactLevelUp",
			args: {
				heroId: upArtifact.heroId,
				slotId: upArtifact.slotId
			},
			ident: `heroArtifactLevelUp_${i}`
		});
	}

	if (!calls.length) {
		console.log(I18N('NOT_ENOUGH_RESOURECES'));
		setProgress(I18N('NOT_ENOUGH_RESOURECES'), false);
		return;
	}

	await Send(JSON.stringify({ calls })).then(e => {
		if ('error' in e) {
			console.log(I18N('NOT_ENOUGH_RESOURECES'));
			setProgress(I18N('NOT_ENOUGH_RESOURECES'), false);
		} else {
			console.log(I18N('IMPROVED_LEVELS', { count: e.results.length }));
			setProgress(I18N('IMPROVED_LEVELS', { count: e.results.length }), false);
		}
	});
}

window.sign = a => {
	const i = this['\x78\x79\x7a'];
	return md5([i['\x6e\x61\x6d\x65'], i['\x76\x65\x72\x73\x69\x6f\x6e'], i['\x61\x75\x74\x68\x6f\x72'], ~(a % 1e3)]['\x6a\x6f\x69\x6e']('\x5f'))
}

async function updateSkins() {
	const count = +await popup.confirm(I18N('SET_NUMBER_LEVELS'), [
		{ msg: I18N('BTN_GO'), isInput: true, default: 10 },
		{ result: false, isClose: true }
	]);
	if (!count) {
		return;
	}

	const quest = new questRun;
	await quest.autoInit();
	const heroes = Object.values(quest.questInfo['heroGetAll']);
	const inventory = quest.questInfo['inventoryGet'];
	const calls = [];
	for (let i = count; i > 0; i--) {
		const upSkin = quest.getUpgradeSkin();
		if (!upSkin.heroId) {
			if (await popup.confirm(I18N('POSSIBLE_IMPROVE_LEVELS', { count: calls.length }), [
				{ msg: I18N('YES'), result: true },
				{ result: false, isClose: true }
			])) {
				break;
			} else {
				return;
			}
		}
		const hero = heroes.find(e => e.id == upSkin.heroId);
		hero.skins[upSkin.skinId]++;
		inventory[upSkin.costCurrency][upSkin.costCurrencyId] -= upSkin.cost;
		calls.push({
			name: "heroSkinUpgrade",
			args: {
				heroId: upSkin.heroId,
				skinId: upSkin.skinId
			},
			ident: `heroSkinUpgrade_${i}`
		})
	}

	if (!calls.length) {
		console.log(I18N('NOT_ENOUGH_RESOURECES'));
		setProgress(I18N('NOT_ENOUGH_RESOURECES'), false);
		return;
	}

	await Send(JSON.stringify({ calls })).then(e => {
		if ('error' in e) {
			console.log(I18N('NOT_ENOUGH_RESOURECES'));
			setProgress(I18N('NOT_ENOUGH_RESOURECES'), false);
		} else {
			console.log(I18N('IMPROVED_LEVELS', { count: e.results.length }));
			setProgress(I18N('IMPROVED_LEVELS', { count: e.results.length }), false);
		}
	});
}

function getQuestionInfo(img, nameOnly = false) {
	const libHeroes = Object.values(lib.data.hero);
	const parts = img.split(':');
	const id = parts[1];
	switch (parts[0]) {
		case 'titanArtifact_id':
			return cheats.translate("LIB_TITAN_ARTIFACT_NAME_" + id);
		case 'titan':
			return cheats.translate("LIB_HERO_NAME_" + id);
		case 'skill':
			return cheats.translate("LIB_SKILL_" + id);
		case 'inventoryItem_gear':
			return cheats.translate("LIB_GEAR_NAME_" + id);
		case 'inventoryItem_coin':
			return cheats.translate("LIB_COIN_NAME_" + id);
		case 'artifact':
			if (nameOnly) {
				return cheats.translate("LIB_ARTIFACT_NAME_" + id);
			}
			heroes = libHeroes.filter(h => h.id < 100 && h.artifacts.includes(+id));
			return {
				/** ��� ���������� ���� ��������? */
				name: cheats.translate("LIB_ARTIFACT_NAME_" + id),
				/** ������ ����� ����������� ���� ��������? */
				heroes: heroes.map(h => cheats.translate("LIB_HERO_NAME_" + h.id))
			};
		case 'hero':
			if (nameOnly) {
				return cheats.translate("LIB_HERO_NAME_" + id);
			}
			artifacts = lib.data.hero[id].artifacts;
			return {
				/** ��� ����� ����� �����? */
				name: cheats.translate("LIB_HERO_NAME_" + id),
				/** ����� �������� ����������� ����� �����? */
				artifact: artifacts.map(a => cheats.translate("LIB_ARTIFACT_NAME_" + a))
			};
	}
}

function hintQuest(quest) {
	const result = {};
	if (quest?.questionIcon) {
		const info = getQuestionInfo(quest.questionIcon);
		if (info?.heroes) {
			/** ������ ����� ����������� ���� ��������? */
			result.answer = quest.answers.filter(e => info.heroes.includes(e.answerText.slice(1)));
		}
		if (info?.artifact) {
			/** ����� �������� ����������� ����� �����? */
			result.answer = quest.answers.filter(e => info.artifact.includes(e.answerText.slice(1)));
		}
		if (typeof info == 'string') {
			result.info = { name: info };
		} else {
			result.info = info;
		}
	}

	if (quest.answers[0]?.answerIcon) {
		result.answer = quest.answers.filter(e => quest.question.includes(getQuestionInfo(e.answerIcon, true)))
	}

	if ((!result?.answer || !result.answer.length) && !result.info?.name) {
		return false;
	}

	let resultText = '';
	if (result?.info) {
		resultText += I18N('PICTURE') + result.info.name;
	}
	console.log(result);
	if (result?.answer && result.answer.length) {
		resultText += I18N('ANSWER') + result.answer[0].id + (!result.answer[0].answerIcon ? ' - ' + result.answer[0].answerText : '');
	}

	return resultText;
}

async function farmBattlePass() {
	const isFarmReward = (reward) => {
		return !(reward?.buff || reward?.fragmentHero || reward?.bundleHeroReward);
	};

	const battlePassProcess = (pass) => {
		if (!pass.id) {return []}
		const levels = Object.values(lib.data.battlePass.level).filter(x => x.battlePass == pass.id)
		const last_level = levels[levels.length - 1];
		let actual = Math.max(...levels.filter(p => pass.exp >= p.experience).map(p => p.level))

		if (pass.exp > last_level.experience) {
			actual = last_level.level + (pass.exp - last_level.experience) / last_level.experienceByLevel;
		}
		const calls = [];
		for(let i = 1; i <= actual; i++) {
			const level = i >= last_level.level ? last_level : levels.find(l => l.level === i);
			const reward = {free: level?.freeReward, paid:level?.paidReward};

			if (!pass.rewards[i]?.free && isFarmReward(reward.free)) {
				const args = {level: i, free:true};
				if (!pass.gold) { args.id = pass.id }
				calls.push({ name: 'battlePass_farmReward', args, ident: `${pass.gold ? 'body' : 'spesial'}_free_${args.id}_${i}` });
			}
			if (pass.ticket && !pass.rewards[i]?.paid && isFarmReward(reward.paid)) {
				const args = {level: i, free:false};
				if (!pass.gold) { args.id = pass.id}
				calls.push({ name: 'battlePass_farmReward', args, ident: `${pass.gold ? 'body' : 'spesial'}_paid_${args.id}_${i}` });
			}
		}
		return calls;
	}

	const passes = await Send({
		calls: [
			{ name: 'battlePass_getInfo', args: {}, ident: 'getInfo' },
			{ name: 'battlePass_getSpecial', args: {}, ident: 'getSpecial' },
		],
	}).then((e) => [{...e.results[0].result.response?.battlePass, gold: true}, ...Object.values(e.results[1].result.response)]);

	const calls = passes.map(p => battlePassProcess(p)).flat()

	let results = await Send({calls});
	if (results.error) {
		console.log(results.error);
		setProgress(I18N('SOMETHING_WENT_WRONG'));
	}
}

async function sellHeroSoulsForGold() {
	let { fragmentHero, heroes } = await Send({
		calls: [
			{ name: 'inventoryGet', args: {}, ident: 'inventoryGet' },
			{ name: 'heroGetAll', args: {}, ident: 'heroGetAll' },
		],
	})
		.then((e) => e.results.map((r) => r.result.response))
		.then((e) => ({ fragmentHero: e[0].fragmentHero, heroes: e[1] }));

	const calls = [];
	for (let i in fragmentHero) {
		if (heroes[i] && heroes[i].star == 6) {
			calls.push({
				name: 'inventorySell',
				args: {
					type: 'hero',
					libId: i,
					amount: fragmentHero[i],
					fragment: true,
				},
				ident: 'inventorySell_' + i,
			});
		}
	}
	if (!calls.length) {
		console.log(0);
		return 0;
	}
	const rewards = await Send({ calls }).then((e) => e.results.map((r) => r.result?.response?.gold || 0));
	const gold = rewards.reduce((e, a) => e + a, 0);
	setProgress(I18N('GOLD_RECEIVED', { gold }), true);
}

	/**
	 * Attack of the minions of Asgard
	 *
	 * ����� ������������ �������
	 */
	function testRaidNodes() {
		return new Promise((resolve, reject) => {
			const tower = new executeRaidNodes(resolve, reject);
			tower.start();
		});
	}

	/**
	 * Attack of the minions of Asgard
	 *
	 * ����� ������������ �������
	 */
	function executeRaidNodes(resolve, reject) {
		let raidData = {
			teams: [],
			favor: {},
			nodes: [],
			attempts: 0,
			countExecuteBattles: 0,
			cancelBattle: 0,
		}

		callsExecuteRaidNodes = {
			calls: [{
				name: "clanRaid_getInfo",
				args: {},
				ident: "clanRaid_getInfo"
			}, {
				name: "teamGetAll",
				args: {},
				ident: "teamGetAll"
			}, {
				name: "teamGetFavor",
				args: {},
				ident: "teamGetFavor"
			}]
		}

		this.start = function () {
			send(JSON.stringify(callsExecuteRaidNodes), startRaidNodes);
		}

		function startRaidNodes(data) {
			res = data.results;
			clanRaidInfo = res[0].result.response;
			teamGetAll = res[1].result.response;
			teamGetFavor = res[2].result.response;

			let index = 0;
			for (let team of teamGetAll.clanRaid_nodes) {
				raidData.teams.push({
					data: {},
					heroes: team.filter(id => id < 6000),
					pet: team.filter(id => id >= 6000).pop(),
					battleIndex: index++
				});
			}
			raidData.favor = teamGetFavor.clanRaid_nodes;

			raidData.nodes = clanRaidInfo.nodes;
			raidData.attempts = clanRaidInfo.attempts;
			isCancalBattle = false;

			checkNodes();
		}

		function getAttackNode() {
			for (let nodeId in raidData.nodes) {
				let node = raidData.nodes[nodeId];
				let points = 0
				for (team of node.teams) {
					points += team.points;
				}
				let now = Date.now() / 1000;
				if (!points && now > node.timestamps.start && now < node.timestamps.end) {
					let countTeam = node.teams.length;
					delete raidData.nodes[nodeId];
					return {
						nodeId,
						countTeam
					};
				}
			}
			return null;
		}

        async function farmBattlePass() {
	const isFarmReward = (reward) => {
		return !(reward?.buff || reward?.fragmentHero || reward?.bundleHeroReward);
	};

	const battlePassProcess = (pass) => {
		if (!pass.id) {return []}
		const levels = Object.values(lib.data.battlePass.level).filter(x => x.battlePass == pass.id)
		const last_level = levels[levels.length - 1];
		let actual = Math.max(...levels.filter(p => pass.exp >= p.experience).map(p => p.level))

		if (pass.exp > last_level.experience) {
			actual = last_level.level + (pass.exp - last_level.experience) / last_level.experienceByLevel;
		}
		const calls = [];
		for(let i = 1; i <= actual; i++) {
			const level = i >= last_level.level ? last_level : levels.find(l => l.level === i);
			const reward = {free: level?.freeReward, paid:level?.paidReward};

			if (!pass.rewards[i]?.free && isFarmReward(reward.free)) {
				const args = {level: i, free:true};
				if (!pass.gold) { args.id = pass.id }
				calls.push({ name: 'battlePass_farmReward', args, ident: `${pass.gold ? 'body' : 'spesial'}_free_${args.id}_${i}` });
			}
			if (pass.ticket && !pass.rewards[i]?.paid && isFarmReward(reward.paid)) {
				const args = {level: i, free:false};
				if (!pass.gold) { args.id = pass.id}
				calls.push({ name: 'battlePass_farmReward', args, ident: `${pass.gold ? 'body' : 'spesial'}_paid_${args.id}_${i}` });
			}
		}
		return calls;
	}

	const passes = await Send({
		calls: [
			{ name: 'battlePass_getInfo', args: {}, ident: 'getInfo' },
			{ name: 'battlePass_getSpecial', args: {}, ident: 'getSpecial' },
		],
	}).then((e) => [{...e.results[0].result.response?.battlePass, gold: true}, ...Object.values(e.results[1].result.response)]);

	const calls = passes.map(p => battlePassProcess(p)).flat()

	let results = await Send({calls});
	if (results.error) {
		console.log(results.error);
		setProgress(I18N('SOMETHING_WENT_WRONG'));
	} else {
		setProgress(I18N('SEASON_REWARD_COLLECTED', {count: results.results.length}), true);
	}
}

		function checkNodes() {
			setProgress(`${I18N('REMAINING_ATTEMPTS')}: ${raidData.attempts}`);
			let nodeInfo = getAttackNode();
			if (nodeInfo && raidData.attempts) {
				startNodeBattles(nodeInfo);
				return;
			}

			endRaidNodes('EndRaidNodes');
		}

		function startNodeBattles(nodeInfo) {
			let {nodeId, countTeam} = nodeInfo;
			let teams = raidData.teams.slice(0, countTeam);
			let heroes = raidData.teams.map(e => e.heroes).flat();
			let favor = {...raidData.favor};
			for (let heroId in favor) {
				if (!heroes.includes(+heroId)) {
					delete favor[heroId];
				}
			}

			let calls = [{
				name: "clanRaid_startNodeBattles",
				args: {
					nodeId,
					teams,
					favor
				},
				ident: "body"
			}];

			send(JSON.stringify({calls}), resultNodeBattles);
		}

		function resultNodeBattles(e) {
			if (e['error']) {
				endRaidNodes('nodeBattlesError', e['error']);
				return;
			}

			console.log(e);
			let battles = e.results[0].result.response.battles;
			let promises = [];
			let battleIndex = 0;
			for (let battle of battles) {
				battle.battleIndex = battleIndex++;
				promises.push(calcBattleResult(battle));
			}

			Promise.all(promises)
				.then(results => {
					const endResults = {};
					let isAllWin = true;
					for (let r of results) {
						isAllWin &&= r.result.win;
					}
					if (!isAllWin) {
						cancelEndNodeBattle(results[0]);
						return;
					}
					raidData.countExecuteBattles = results.length;
					let timeout = 500;
					for (let r of results) {
						setTimeout(endNodeBattle, timeout, r);
						timeout += 500;
					}
				});
		}
		/**
		 * Returns the battle calculation promise
		 *
		 * ���������� ������ ������� ���
		 */
		function calcBattleResult(battleData) {
			return new Promise(function (resolve, reject) {
				BattleCalc(battleData, "get_clanPvp", resolve);
			});
		}
		/**
		 * Cancels the fight
		 *
		 * �������� ���
		 */
		function cancelEndNodeBattle(r) {
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			fixBattle(r.progress[0].attackers.heroes);
			fixBattle(r.progress[0].defenders.heroes);
			endNodeBattle(r);
		}
		/**
		 * Ends the fight
		 *
		 * ��������� ���
		 */
		function endNodeBattle(r) {
			let nodeId = r.battleData.result.nodeId;
			let battleIndex = r.battleData.battleIndex;
			let calls = [{
				name: "clanRaid_endNodeBattle",
				args: {
					nodeId,
					battleIndex,
					result: r.result,
					progress: r.progress
				},
				ident: "body"
			}]

			SendRequest(JSON.stringify({calls}), battleResult);
		}
		/**
		 * Processing the results of the battle
		 *
		 * ��������� ����������� ���
		 */
		function battleResult(e) {
			if (e['error']) {
				endRaidNodes('missionEndError', e['error']);
				return;
			}
			r = e.results[0].result.response;
			if (r['error']) {
				if (r.reason == "invalidBattle") {
					raidData.cancelBattle++;
					checkNodes();
				} else {
					endRaidNodes('missionEndError', e['error']);
				}
				return;
			}

			if (!(--raidData.countExecuteBattles)) {
				raidData.attempts--;
				checkNodes();
			}
		}
		/**
		 * Completing a task
		 *
		 * ���������� ������
		 */
		function endRaidNodes(reason, info) {
			isCancalBattle = true;
			let textCancel = raidData.cancelBattle ? ` ${I18N('BATTLES_CANCELED')}: ${raidData.cancelBattle}` : '';
			setProgress(`${I18N('MINION_RAID')} ${I18N('COMPLETED')}! ${textCancel}`, true);
			console.log(reason, info);
			resolve();
		}
	}

	/**
	 * Asgard Boss Attack Replay
	 *
	 * ������ ����� ����� �������
	 */
	function testBossBattle() {
		return new Promise((resolve, reject) => {
			const bossBattle = new executeBossBattle(resolve, reject);
			bossBattle.start(lastBossBattle, lastBossBattleInfo);
		});
	}

	/**
	 * Asgard Boss Attack Replay
	 *
	 * ������ ����� ����� �������
	 */
	function executeBossBattle(resolve, reject) {
		let lastBossBattleArgs = {};
		let reachDamage = 0;
		let countBattle = 0;
		let countMaxBattle = 10;
		let lastDamage = 0;

		this.start = function (battleArg, battleInfo) {
			lastBossBattleArgs = battleArg;
			preCalcBattle(battleInfo);
		}

		function getBattleInfo(battle) {
			return new Promise(function (resolve) {
				battle.seed = Math.floor(Date.now() / 1000) + random(0, 1e3);
				BattleCalc(battle, getBattleType(battle.type), e => {
					let extra = e.progress[0].defenders.heroes[1].extra;
					resolve(extra.damageTaken + extra.damageTakenNextLevel);
				});
			});
		}

		function preCalcBattle(battle) {
			let actions = [];
			const countTestBattle = getInput('countTestBattle');
			for (let i = 0; i < countTestBattle; i++) {
				actions.push(getBattleInfo(battle, true));
			}
			Promise.all(actions)
				.then(resultPreCalcBattle);
		}

		function fixDamage(damage) {
			for (let i = 1e6; i > 1; i /= 10) {
				if (damage > i) {
					let n = i / 10;
					damage = Math.ceil(damage / n) * n;
					break;
				}
			}
			return damage;
		}

		async function resultPreCalcBattle(damages) {
			let maxDamage = 0;
			let minDamage = 1e10;
			let avgDamage = 0;
			for (let damage of damages) {
				avgDamage += damage
				if (damage > maxDamage) {
					maxDamage = damage;
				}
				if (damage < minDamage) {
					minDamage = damage;
				}
			}
			avgDamage /= damages.length;
			console.log(damages.map(e => e.toLocaleString()).join('\n'), avgDamage, maxDamage);

			reachDamage = fixDamage(avgDamage);
			const result = await popup.confirm(
				`${I18N('ROUND_STAT')} ${damages.length} ${I18N('BATTLE')}:` +
				`<br>${I18N('MINIMUM')}: ` + minDamage.toLocaleString() +
				`<br>${I18N('MAXIMUM')}: ` + maxDamage.toLocaleString() +
				`<br>${I18N('AVERAGE')}: ` + avgDamage.toLocaleString()
				/*+ '<br>����� ����� ������ ��� ' + reachDamage.toLocaleString()*/
				, [
					{ msg: I18N('BTN_OK'), result: 0},
					/* {msg: '�������', isInput: true, default: reachDamage}, */
				])
			if (result) {
				reachDamage = result;
				isCancalBossBattle = false;
				startBossBattle();
				return;
			}
			endBossBattle(I18N('BTN_CANCEL'));
		}

		function startBossBattle() {
			countBattle++;
			countMaxBattle = getInput('countAutoBattle');
			if (countBattle > countMaxBattle) {
				setProgress('�������� ����� �������: ' + countMaxBattle, true);
				endBossBattle('�������� ����� �������: ' + countMaxBattle);
				return;
			}
			let calls = [{
				name: "clanRaid_startBossBattle",
				args: lastBossBattleArgs,
				ident: "body"
			}];
			send(JSON.stringify({calls}), calcResultBattle);
		}

		function calcResultBattle(e) {
			BattleCalc(e.results[0].result.response.battle, "get_clanPvp", resultBattle);
		}

		async function resultBattle(e) {
			let extra = e.progress[0].defenders.heroes[1].extra
			resultDamage = extra.damageTaken + extra.damageTakenNextLevel
			console.log(resultDamage);
			scriptMenu.setStatus(countBattle + ') ' + resultDamage.toLocaleString());
			lastDamage = resultDamage;
			if (resultDamage > reachDamage && await popup.confirm(countBattle + ') ���� ' + resultDamage.toLocaleString(), [
				{msg: '��', result: true},
				{msg: '�� ������', result: false},
			]))  {
				endBattle(e, false);
				return;
			}
			cancelEndBattle(e);
		}

		function cancelEndBattle (r) {
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			fixBattle(r.progress[0].attackers.heroes);
			fixBattle(r.progress[0].defenders.heroes);
			endBattle(r, true);
		}

		function endBattle(battleResult, isCancal) {
			let calls = [{
				name: "clanRaid_endBossBattle",
				args: {
					result: battleResult.result,
					progress: battleResult.progress
				},
				ident: "body"
			}];

			send(JSON.stringify({calls}), e => {
				console.log(e);
				if (isCancal) {
					startBossBattle();
					return;
				}
				scriptMenu.setStatus('���� ������ ������� ����: ' + lastDamage);
				setTimeout(() => {
					scriptMenu.setStatus('');
				}, 5000);
				endBossBattle('�����!');
			});
		}

		/**
		 * Completing a task
		 *
		 * ���������� ������
		 */
		function endBossBattle(reason, info) {
			isCancalBossBattle = true;
			console.log(reason, info);
			resolve();
		}
	}

	/**
	 * Auto-repeat attack
	 *
	 * ���������� �����
	 */
	function testAutoBattle() {
		return new Promise((resolve, reject) => {
			const bossBattle = new executeAutoBattle(resolve, reject);
			bossBattle.start(lastBattleArg, lastBattleInfo);
		});
	}

	/**
	 * Auto-repeat attack
	 *
	 * ���������� �����
	 */
	function executeAutoBattle(resolve, reject) {
		let battleArg = {};
		let countBattle = 0;
		let findCoeff = 0;
		let lastCalcBattle = null;

		this.start = function (battleArgs, battleInfo) {
			battleArg = battleArgs;
			preCalcBattle(battleInfo);
		}
		/**
		 * Returns a promise for combat recalculation
		 *
		 * ���������� ������ ��� ���������� ���
		 */
		function getBattleInfo(battle) {
			return new Promise(function (resolve) {
				battle.seed = Math.floor(Date.now() / 1000) + random(0, 1e3);
				Calc(battle).then(e => {
					e.coeff = calcCoeff(e, 'defenders');
					resolve(e);
				});
			});
		}
		/**
		 * Battle recalculation
		 *
		 * ��������� ���
		 */
		function preCalcBattle(battle) {
			let actions = [];
			const countTestBattle = getInput('countTestBattle');
			for (let i = 0; i < countTestBattle; i++) {
				actions.push(getBattleInfo(battle));
			}
			Promise.all(actions)
				.then(resultPreCalcBattle);
		}
		/**
		 * Processing the results of the battle recalculation
		 *
		 * ��������� ����������� ���������� ���
		 */
		async function resultPreCalcBattle(results) {
			let countWin = results.reduce((s, w) => w.result.win + s, 0);
			setProgress(`${I18N('CHANCE_TO_WIN')} ${Math.floor(countWin / results.length * 100)}% (${results.length})`, false, hideProgress);
			if (countWin > 0) {
				isCancalBattle = false;
				startBattle();
				return;
			}

			let minCoeff = 100;
			let maxCoeff = -100;
			let avgCoeff = 0;
			results.forEach(e => {
				if (e.coeff < minCoeff) minCoeff = e.coeff;
				if (e.coeff > maxCoeff) maxCoeff = e.coeff;
				avgCoeff += e.coeff;
			});
			avgCoeff /= results.length;

			if (nameFuncStartBattle == 'invasion_bossStart' ||
				nameFuncStartBattle == 'bossAttack') {
				const result = await popup.confirm(
					I18N('BOSS_VICTORY_IMPOSSIBLE', { battles: results.length }), [
						{ msg: I18N('BTN_CANCEL'), result: false },
						{ msg: I18N('BTN_DO_IT'), result: true },
					])
				if (result) {
					isCancalBattle = false;
					startBattle();
					return;
				}
				setProgress(I18N('NOT_THIS_TIME'), true);
				endAutoBattle('invasion_bossStart');
				return;
			}

			const result = await popup.confirm(
				I18N('VICTORY_IMPOSSIBLE') +
				`<br>${I18N('ROUND_STAT')} ${results.length} ${I18N('BATTLE')}:` +
				`<br>${I18N('MINIMUM')}: ` + minCoeff.toLocaleString() +
				`<br>${I18N('MAXIMUM')}: ` + maxCoeff.toLocaleString() +
				`<br>${I18N('AVERAGE')}: ` + avgCoeff.toLocaleString() +
				`<br>${I18N('FIND_COEFF')} ` + avgCoeff.toLocaleString(), [
					{ msg: I18N('BTN_CANCEL'), result: 0 },
					{ msg: I18N('BTN_GO'), isInput: true, default: Math.round(avgCoeff * 1000) / 1000 },
				])
			if (result) {
				findCoeff = result;
				isCancalBattle = false;
				startBattle();
				return;
			}
			setProgress(I18N('NOT_THIS_TIME'), true);
			endAutoBattle(I18N('NOT_THIS_TIME'));
		}

		/**
		 * Calculation of the combat result coefficient
		 *
		 * ������ ����������� ���������� ���
		 */
		function calcCoeff(result, packType) {
			let beforeSumFactor = 0;
			const beforePack = result.battleData[packType][0];
			for (let heroId in beforePack) {
				const hero = beforePack[heroId];
				const state = hero.state;
				let factor = 1;
				if (state) {
					const hp = state.hp / state.maxHp;
					const energy = state.energy / 1e3;
					factor = hp + energy / 20;
				}
				beforeSumFactor += factor;
			}

			let afterSumFactor = 0;
			const afterPack = result.progress[0][packType].heroes;
			for (let heroId in afterPack) {
				const hero = afterPack[heroId];
				const stateHp = beforePack[heroId]?.state?.hp || beforePack[heroId]?.stats?.hp;
				const hp = hero.hp / stateHp;
				const energy = hero.energy / 1e3;
				const factor = hp + energy / 20;
				afterSumFactor += factor;
			}
			const resultCoeff = -(afterSumFactor - beforeSumFactor);
			return Math.round(resultCoeff * 1000) / 1000;
		}
		/**
		 * Start battle
		 *
		 * ������ ���
		 */
		function startBattle() {
			countBattle++;
			const countMaxBattle = getInput('countAutoBattle');
			// setProgress(countBattle + '/' + countMaxBattle);
			if (countBattle > countMaxBattle) {
				setProgress(`${I18N('RETRY_LIMIT_EXCEEDED')}: ${countMaxBattle}`, true);
				endAutoBattle(`${I18N('RETRY_LIMIT_EXCEEDED')}: ${countMaxBattle}`)
				return;
			}
			let calls = [{
				name: nameFuncStartBattle,
				args: battleArg,
				ident: "body"
			}];
			send(JSON.stringify({
				calls
			}), calcResultBattle);
		}
		/**
		 * Battle calculation
		 *
		 * ������ ���
		 */
		async function calcResultBattle(e) {
		if (!e) {
			console.log('������ �� ���� ��������');
			if (dataNotEeceived < 10) {
				dataNotEeceived++;
				startBattle();
				return;
			}
			endAutoBattle('Error', '������ �� ���� �������� ' + dataNotEeceived + ' ���');
			return;
		}
		if ('error' in e) {
			if (e.error.description === 'too many tries') {
				invasionTimer += 100;
				countBattle--;
				countError++;
				console.log(`Errors: ${countError}`, e.error);
				startBattle();
				return;
			}
			const result = await popup.confirm(I18N('ERROR_DURING_THE_BATTLE') + '<br>' + e.error.description, [
				{ msg: I18N('BTN_OK'), result: false },
				{ msg: I18N('RELOAD_GAME'), result: true },
			]);
			endAutoBattle('Error', e.error);
			if (result) {
				location.reload();
			}
			return;
		}
		let battle = e.results[0].result.response.battle
		if (nameFuncStartBattle == 'towerStartBattle' ||
			nameFuncStartBattle == 'bossAttack' ||
			nameFuncStartBattle == 'invasion_bossStart') {
			battle = e.results[0].result.response;
		}
		lastBattleInfo = battle;
		BattleCalc(battle, getBattleType(battle.type), resultBattle);
	}
		/**
		 * Processing the results of the battle
		 *
		 * ��������� ����������� ���
		 */
		function resultBattle(e) {
			const isWin = e.result.win;
			if (isWin) {
				endBattle(e, false);
				return;
			}
			const countMaxBattle = getInput('countAutoBattle');
			if (findCoeff) {
				const coeff = calcCoeff(e, 'defenders');
				setProgress(`${countBattle}/${countMaxBattle}, ${coeff}`);
				if (coeff > findCoeff) {
					endBattle(e, false);
					return;
				}
			} else {
				setProgress(`${countBattle}/${countMaxBattle}`);
			}
			if (nameFuncStartBattle == 'towerStartBattle' ||
				nameFuncStartBattle == 'bossAttack' ||
				nameFuncStartBattle == 'invasion_bossStart') {
				startBattle();
				return;
			}
			cancelEndBattle(e);
		}
		/**
		 * Cancel fight
		 *
		 * ������ ���
		 */
		function cancelEndBattle(r) {
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			fixBattle(r.progress[0].attackers.heroes);
			fixBattle(r.progress[0].defenders.heroes);
			endBattle(r, true);
		}
		/**
		 * End of the fight
		 *
		 * ���������� ��� */
		function endBattle(battleResult, isCancal) {
			let calls = [{
				name: nameFuncEndBattle,
				args: {
					result: battleResult.result,
					progress: battleResult.progress
				},
				ident: "body"
			}];

			if (nameFuncStartBattle == 'invasion_bossStart') {
				calls[0].args.id = lastBattleArg.id;
			}

			send(JSON.stringify({
				calls
			}), async e => {
				console.log(e);
				if (isCancal) {
					startBattle();
					return;
				}

				setProgress(`${I18N('SUCCESS')}!`, 5000)
				if (nameFuncStartBattle == 'invasion_bossStart' ||
					nameFuncStartBattle == 'bossAttack') {
					const countMaxBattle = getInput('countAutoBattle');
					const bossLvl = lastCalcBattle.typeId >= 130 ? lastCalcBattle.typeId : '';
					const result = await popup.confirm(
						I18N('BOSS_HAS_BEEN_DEF_TEXT', { bossLvl, countBattle, countMaxBattle }), [
							{ msg: I18N('BTN_OK'), result: 0 },
							{ msg: I18N('MAKE_A_SYNC'), result: 1 },
							{ msg: I18N('RELOAD_GAME'), result: 2 },
						]);
					if (result) {
						if (result == 1) {
							cheats.refreshGame();
						}
						if (result == 2) {
							location.reload();
						}
					}

				}
				endAutoBattle(`${I18N('SUCCESS')}!`)
			});
		}
		/**
		 * Completing a task
		 *
		 * ���������� ������
		 */
		function endAutoBattle(reason, info) {
			isCancalBattle = true;
			console.log(reason, info);
			resolve();
		}
	}

	function testDailyQuests() {
		return new Promise((resolve, reject) => {
			const quests = new dailyQuests(resolve, reject);
			quests.init(questsInfo);
			quests.start();
		});
	}

	/**
	 * Automatic completion of daily quests
	 *
	 * �������������� ���������� ���������� �������
	 */
	class dailyQuests {
		/**
		 * Send(' {"calls":[{"name":"userGetInfo","args":{},"ident":"body"}]}').then(e => console.log(e))
		 * Send(' {"calls":[{"name":"heroGetAll","args":{},"ident":"body"}]}').then(e => console.log(e))
		 * Send(' {"calls":[{"name":"titanGetAll","args":{},"ident":"body"}]}').then(e => console.log(e))
		 * Send(' {"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]}').then(e => console.log(e))
		 * Send(' {"calls":[{"name":"questGetAll","args":{},"ident":"body"}]}').then(e => console.log(e))
		 * Send(' {"calls":[{"name":"bossGetAll","args":{},"ident":"body"}]}').then(e => console.log(e))
		 */
		callsList = [
			"userGetInfo",
			"heroGetAll",
			"titanGetAll",
			"inventoryGet",
			"questGetAll",
			"bossGetAll",
		]

		dataQuests = {
			10001: {
				description: '������ ������ ������ 3 ����', // ++++++++++++++++
				doItCall: () => {
					const upgradeSkills = this.getUpgradeSkills();
					return upgradeSkills.map(({ heroId, skill }, index) => ({ name: "heroUpgradeSkill", args: { heroId, skill }, "ident": `heroUpgradeSkill_${index}` }));
				},
				isWeCanDo: () => {
					const upgradeSkills = this.getUpgradeSkills();
					let sumGold = 0;
					for (const skill of upgradeSkills) {
						sumGold += this.skillCost(skill.value);
						if (!skill.heroId) {
							return false;
						}
					}
					return this.questInfo['userGetInfo'].gold > sumGold;
				},
			},
			10002: {
				description: '������ 10 ������', // --------------
				isWeCanDo: () => false,
			},
			10003: {
				description: '������ 3 ����������� ������', // --------------
				isWeCanDo: () => false,
			},
			10004: {
				description: '������� 3 ���� �� ����� ��� ����� �����', // --------------
				isWeCanDo: () => false,
			},
			10006: {
				description: '��������� ����� ��������� 1 ���', // ++++++++++++++++
				doItCall: () => [{
					name: "refillableAlchemyUse",
					args: { multi: false },
					ident: "refillableAlchemyUse"
				}],
				isWeCanDo: () => {
					const starMoney = this.questInfo['userGetInfo'].starMoney;
					return starMoney >= 20;
				},
			},
			10007: {
				description: '������� 1 ������ � ������� ���', // ++++++++++++++++
				doItCall: () => [{ name: "gacha_open", args: { ident: "heroGacha", free: true, pack: false }, ident: "gacha_open" }],
				isWeCanDo: () => {
					const soulCrystal =  this.questInfo['inventoryGet'].coin[38];
					return soulCrystal > 0;
				},
			},
			10016: {
				description: '������� ������� ������������', // ++++++++++++++++
				doItCall: () => [{ name: "clanSendDailyGifts", args: {}, ident: "clanSendDailyGifts" }],
				isWeCanDo: () => true,
			},
			10018: {
				description: '��������� ����� �����', // ++++++++++++++++
				doItCall: () => {
					const expHero = this.getExpHero();
					return [{
						name: "consumableUseHeroXp",
						args: {
							heroId: expHero.heroId,
							libId: expHero.libId,
							amount: 1
						},
						ident: "consumableUseHeroXp"
					}];
				},
				isWeCanDo: () => {
					const expHero = this.getExpHero();
					return expHero.heroId && expHero.libId;
				},
			},
			10019: {
				description: '������ 1 ������ � �����',
				doItFunc: testTower,
				isWeCanDo: () => false,
			},
			10020: {
				description: '������ 3 ������� � ����������', // ������
				doItCall: () => {
					return this.getOutlandChest();
				},
				isWeCanDo: () => {
					const outlandChest = this.getOutlandChest();
					return outlandChest.length > 0;
				},
			},
			10021: {
				description: '������ 75 �������� � ���������� �������',
				isWeCanDo: () => false,
			},
			10022: {
				description: '������ 150 �������� � ���������� �������',
				doItFunc: testDungeon,
				isWeCanDo: () => false,
			},
			10023: {
				description: '�������� ��� ������ �� 1 �������', // ������
				doItCall: () => {
					const heroId = this.getHeroIdTitanGift();
					return [
						{ name: "heroTitanGiftLevelUp", args: { heroId }, ident: "heroTitanGiftLevelUp" },
						{ name: "heroTitanGiftDrop", args: { heroId }, ident: "heroTitanGiftDrop" }
					]
				},
				isWeCanDo: () => {
					const heroId = this.getHeroIdTitanGift();
					return heroId;
				},
			},
			10024: {
				description: '������ ������� ������ ��������� ���� ���', // ������
				doItCall: () => {
					const upArtifact = this.getUpgradeArtifact();
					return [
						{
							name: "heroArtifactLevelUp",
							args: {
								heroId: upArtifact.heroId,
								slotId: upArtifact.slotId
							},
							ident: `heroArtifactLevelUp`
						}
					];
				},
				isWeCanDo: () => {
					const upgradeArtifact = this.getUpgradeArtifact();
					return upgradeArtifact.heroId;
				},
			},
			10025: {
				description: '����� 1 ����������',
				doItFunc: checkExpedition,
				isWeCanDo: () => false,
			},
			10026: {
				description: '����� 4 ����������', // --------------
				doItFunc: checkExpedition,
				isWeCanDo: () => false,
			},
			10027: {
				description: '������ � 1 ��� ������� ������',
				doItFunc: testTitanArena,
				isWeCanDo: () => false,
			},
			10028: {
				description: '������ ������� ������ ��������� �������', // ������
				doItCall: () => {
					const upTitanArtifact = this.getUpgradeTitanArtifact();
					return [
						{
							name: "titanArtifactLevelUp",
							args: {
								titanId: upTitanArtifact.titanId,
								slotId: upTitanArtifact.slotId
							},
							ident: `titanArtifactLevelUp`
						}
					];
				},
				isWeCanDo: () => {
					const upgradeTitanArtifact = this.getUpgradeTitanArtifact();
					return upgradeTitanArtifact.titanId;
				},
			},
			10029: {
				description: '������ ����� ���������� �������', // ++++++++++++++++
				doItCall: () => [{ name: "titanArtifactChestOpen", args: { amount: 1, free: true }, ident: "titanArtifactChestOpen" }],
				isWeCanDo: () => {
					return this.questInfo['inventoryGet']?.consumable[55] > 0
				},
			},
			10030: {
				description: '������ ����� ������ ����� 1 ���', // ������
				doItCall: () => {
					const upSkin = this.getUpgradeSkin();
					return [
						{
							name: "heroSkinUpgrade",
							args: {
								heroId: upSkin.heroId,
								skinId: upSkin.skinId
							},
							ident: `heroSkinUpgrade`
						}
					];
				},
				isWeCanDo: () => {
					const upgradeSkin = this.getUpgradeSkin();
					return upgradeSkin.heroId;
				},
			},
			10031: {
				description: '������ � 6 ���� ������� ������', // --------------
				doItFunc: testTitanArena,
				isWeCanDo: () => false,
			},
			10043: {
				description: '����� ��� ������������ � �����������', // --------------
				isWeCanDo: () => false,
			},
			10044: {
				description: '������������ �������� �������� 1 ���', // ++++++++++++++++
				doItCall: () => [{ name: "pet_chestOpen", args: { amount: 1, paid: false }, ident: "pet_chestOpen" }],
				isWeCanDo: () => {
					return this.questInfo['inventoryGet']?.consumable[90] > 0
				},
			},
			10046: {
				/**
				 * TODO: Watch Adventure
				 * TODO: �������� �����������
				 */
				description: '������ 3 ������� � ������������',
				isWeCanDo: () => false,
			},
			10047: {
				description: '������ 150 ����� ���������� � �������', // ������
				doItCall: () => {
					const enchantRune = this.getEnchantRune();
					return [
						{
							name: "heroEnchantRune",
							args: {
								heroId: enchantRune.heroId,
								tier: enchantRune.tier,
								items: {
									consumable: { [enchantRune.itemId]: 1 }
								}
							},
							ident: `heroEnchantRune`
						}
					];
				},
				isWeCanDo: () => {
					const userInfo = this.questInfo['userGetInfo'];
					const enchantRune = this.getEnchantRune();
					return enchantRune.heroId && userInfo.gold > 1e3;
				},
			},
		};

		constructor(resolve, reject, questInfo) {
			this.resolve = resolve;
			this.reject = reject;
		}

		init(questInfo) {
			this.questInfo = questInfo;
			this.isAuto = false;
		}

		async autoInit(isAuto) {
			this.isAuto = isAuto || false;
			const quests = {};
			const calls = this.callsList.map(name => ({
				name, args: {}, ident: name
			}))
			const result = await Send(JSON.stringify({ calls })).then(e => e.results);
			for (const call of result) {
				quests[call.ident] = call.result.response;
			}
			this.questInfo = quests;
		}

		async start() {
			/**
			 * TODO may not be needed
			 *
			 * TODO ������� �� �����
			 */
			let countQuest = 0;
			const weCanDo = [];
			const selectedActions = getSaveVal('selectedActions', {});
			for (let quest of this.questInfo['questGetAll']) {
				if (quest.id in this.dataQuests && quest.state == 1) {
					if (!selectedActions[quest.id]) {
						selectedActions[quest.id] = {
							checked: false
						}
					}

					const isWeCanDo = this.dataQuests[quest.id].isWeCanDo;
					if (!isWeCanDo.call(this)) {
						continue;
					}

					weCanDo.push({
						name: quest.id,
						label: I18N(`QUEST_${quest.id}`),
						checked: selectedActions[quest.id].checked
					});
					countQuest++;
				}
			}

			if (!weCanDo.length) {
				this.end(I18N('NOTHING_TO_DO'));
				return;
			}

			console.log(weCanDo);
			let taskList = [];
			if (this.isAuto) {
				taskList = weCanDo;
			} else {
				const answer = await popup.confirm(`${I18N('YOU_CAN_COMPLETE') }:`, [
					{ msg: I18N('BTN_DO_IT'), result: true },
					{ msg: I18N('BTN_CANCEL'), result: false },
				], weCanDo);
				if (!answer) {
					this.end('');
					return;
				}
				taskList = popup.getCheckBoxes();
				taskList.forEach(e => {
					selectedActions[e.name].checked = e.checked;
				});
				setSaveVal('selectedActions', selectedActions);
			}

			const calls = [];
			let countChecked = 0;
			for (const task of taskList) {
				if (task.checked) {
					countChecked++;
					const quest = this.dataQuests[task.name]
					console.log(quest.description);

					if (quest.doItCall) {
						const doItCall = quest.doItCall.call(this);
						calls.push(...doItCall);
					}
				}
			}

			if (!countChecked) {
				this.end(I18N('NOT_QUEST_COMPLETED'));
				return;
			}

			const result = await Send(JSON.stringify({ calls }));
			if (result.error) {
				console.error(result.error, result.error.call)
			}
			this.end(`${I18N('COMPLETED_QUESTS')}: ${countChecked}`);
		}

		errorHandling(error) {
			//console.error(error);
			let errorInfo = error.toString() + '\n';
			try {
				const errorStack = error.stack.split('\n');
				const endStack = errorStack.map(e => e.split('@')[0]).indexOf("testDoYourBest");
				errorInfo += errorStack.slice(0, endStack).join('\n');
			} catch (e) {
				errorInfo += error.stack;
			}
			copyText(errorInfo);
		}

		skillCost(lvl) {
			return 573 * lvl ** 0.9 + lvl ** 2.379;
		}

		getUpgradeSkills() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const upgradeSkills = [
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
			];
			const skillLib = lib.getData('skill');
			/**
			 * color - 1 (�����) ��������� 1 �����
			 * color - 2 (�������) ��������� 2 �����
			 * color - 4 (�����) ��������� 3 �����
			 * color - 7 (����������) ��������� 4 �����
			 */
			const colors = [1, 2, 4, 7];
			for (const hero of heroes) {
				const level = hero.level;
				const color = hero.color;
				for (let skillId in hero.skills) {
					const tier = skillLib[skillId].tier;
					const sVal = hero.skills[skillId];
					if (color < colors[tier] || tier < 1 || tier > 4) {
						continue;
					}
					for (let upSkill of upgradeSkills) {
						if (sVal < upSkill.value && sVal < level) {
							upSkill.value = sVal;
							upSkill.heroId = hero.id;
							upSkill.skill = tier;
							break;
						}
					}
				}
			}
			return upgradeSkills;
		}

		getUpgradeArtifact() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const upArt = { heroId: 0, slotId: 0, level: 100 };

			const heroLib = lib.getData('hero');
			const artifactLib = lib.getData('artifact');

			for (const hero of heroes) {
				const heroInfo = heroLib[hero.id];
				const level = hero.level
				if (level < 20) {
					continue;
				}

				for (let slotId in hero.artifacts) {
					const art = hero.artifacts[slotId];
					/* ������� ����������� ���� */
					const star = art.star;
					if (!star) {
						continue;
					}
					/* ������� ������� ���� */
					const level = art.level;
					if (level >= 100) {
						continue;
					}
					/* ������������� ���� � ���������� */
					const artifactId = heroInfo.artifacts[slotId];
					const artInfo = artifactLib.id[artifactId];
					const costNextLevel = artifactLib.type[artInfo.type].levels[level + 1].cost;

					const cost�urrency = Object.keys(costNextLevel).pop();
					const costValues = Object.entries(costNextLevel[cost�urrency]).pop();
					const costId = costValues[0];
					const costValue = +costValues[1];

					/** TODO: �������� ����� ������ ����� ������� ������� ������� ����� �������? */
					if (level < upArt.level && inventory[cost�urrency][costId] >= costValue) {
						upArt.level = level;
						upArt.heroId = hero.id;
						upArt.slotId = slotId;
					}
				}
			}
			return upArt;
		}

		getUpgradeSkin() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const upSkin = { heroId: 0, skinId: 0, level: 60, cost: 1500 };

			const skinLib = lib.getData('skin');

			for (const hero of heroes) {
				const level = hero.level
				if (level < 20) {
					continue;
				}

				for (let skinId in hero.skins) {
					/* ������� ������� ����� */
					const level = hero.skins[skinId];
					if (level >= 60) {
						continue;
					}
					/* ������������� ����� � ���������� */
					const skinInfo = skinLib[skinId];
					const costNextLevel = skinInfo.statData.levels[level + 1].cost;

					const cost�urrency = Object.keys(costNextLevel).pop();
					const cost�urrencyId = Object.keys(costNextLevel[cost�urrency]).pop();
					const costValue = +costNextLevel[cost�urrency][cost�urrencyId];

					/** TODO: �������� ����� ������ ����� ������� ������� ������� ����� �������? */
					if (level < upSkin.level &&
						costValue < upSkin.cost &&
						inventory[cost�urrency][cost�urrencyId] >= costValue) {
						upSkin.cost = costValue;
						upSkin.level = level;
						upSkin.heroId = hero.id;
						upSkin.skinId = skinId;
					}
				}
			}
			return upSkin;
		}

		getUpgradeTitanArtifact() {
			const titans = Object.values(this.questInfo['titanGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const userInfo = this.questInfo['userGetInfo'];
			const upArt = { titanId: 0, slotId: 0, level: 120 };

			const titanLib = lib.getData('titan');
			const artTitanLib = lib.getData('titanArtifact');

			for (const titan of titans) {
				const titanInfo = titanLib[titan.id];
				// const level = titan.level
				// if (level < 20) {
				// 	continue;
				// }

				for (let slotId in titan.artifacts) {
					const art = titan.artifacts[slotId];
					/* ������� ����������� ���� */
					const star = art.star;
					if (!star) {
						continue;
					}
					/* ������� ������� ���� */
					const level = art.level;
					if (level >= 120) {
						continue;
					}
					/* ������������� ���� � ���������� */
					const artifactId = titanInfo.artifacts[slotId];
					const artInfo = artTitanLib.id[artifactId];
					const costNextLevel = artTitanLib.type[artInfo.type].levels[level + 1].cost;

					const cost�urrency = Object.keys(costNextLevel).pop();
					let costValue = 0;
					let currentValue = 0;
					if (cost�urrency == 'gold') {
						costValue = costNextLevel[cost�urrency];
						currentValue = userInfo.gold;
					} else {
						const costValues = Object.entries(costNextLevel[cost�urrency]).pop();
						const costId = costValues[0];
						costValue = +costValues[1];
						currentValue = inventory[cost�urrency][costId];
					}

					/** TODO: �������� ����� ������ ����� ������� ������� ������� ����� �������? */
					if (level < upArt.level && currentValue >= costValue) {
						upArt.level = level;
						upArt.titanId = titan.id;
						upArt.slotId = slotId;
						break;
					}
				}
			}
			return upArt;
		}

		getEnchantRune() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const enchRune = { heroId: 0, tier: 0, exp: 43750, itemId: 0 };
			for (let i = 1; i <= 4; i++) {
				if (inventory.consumable[i] > 0) {
					enchRune.itemId = i;
					break;
				}
				return enchRune;
			}

			const runeLib = lib.getData('rune');
			const runeLvls = Object.values(runeLib.level);
			/**
			 * color - 4 (�����) ��������� 1 � 2 ������
			 * color - 7 (����������) ��������� 3 ������
			 * color - 8 (���������� +1) ��������� 4 ������
			 * color - 9 (���������� +2) ��������� 5 ������
			 */
				// TODO: ������� ���� ������ ������� �������
			const colors = [4, 4, 7, 8, 9];
			for (const hero of heroes) {
				const color = hero.color;


				for (let runeTier in hero.runes) {
					/* �������� �� ����������� ���� */
					if (color < colors[runeTier]) {
						continue;
					}
					/* ������� ���� ���� */
					const exp = hero.runes[runeTier];
					if (exp >= 43750) {
						continue;
					}

					let level = 0;
					if (exp) {
						for (let lvl of runeLvls) {
							if (exp >= lvl.enchantValue) {
								level = lvl.level;
							} else {
								break;
							}
						}
					}
					/** ������� ����� ����������� ��� ������ ���� */
					const heroLevel = runeLib.level[level].heroLevel;
					if (hero.level < heroLevel) {
						continue;
					}

					/** TODO: �������� ����� ������ ����� ������� ������� ������� ����� �������? */
					if (exp < enchRune.exp) {
						enchRune.exp = exp;
						enchRune.heroId = hero.id;
						enchRune.tier = runeTier;
						break;
					}
				}
			}
			return enchRune;
		}

		getOutlandChest() {
			const bosses = this.questInfo['bossGetAll'];

			const calls = [];

			for (let boss of bosses) {
				if (boss.mayRaid) {
					calls.push({
						name: "bossRaid",
						args: {
							bossId: boss.id
						},
						ident: "bossRaid_" + boss.id
					});
					calls.push({
						name: "bossOpenChest",
						args: {
							bossId: boss.id,
							amount: 1,
							starmoney: 0
						},
						ident: "bossOpenChest_" + boss.id
					});
				} else if (boss.chestId == 1) {
					calls.push({
						name: "bossOpenChest",
						args: {
							bossId: boss.id,
							amount: 1,
							starmoney: 0
						},
						ident: "bossOpenChest_" + boss.id
					});
				}
			}

			return calls;
		}

		getExpHero() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const expHero = { heroId: 0, exp: 3625195, libId: 0 };
			/** ����� ����� (consumable 9, 10, 11, 12) */
			for (let i = 9; i <= 12; i++) {
				if (inventory.consumable[i]) {
					expHero.libId = i;
					break;
				}
			}

			for (const hero of heroes) {
				const exp = hero.xp;
				if (exp < expHero.exp) {
					expHero.heroId = hero.id;
				}
			}
			return expHero;
		}

		getHeroIdTitanGift() {
			const heroes = Object.values(this.questInfo['heroGetAll']);
			const inventory = this.questInfo['inventoryGet'];
			const user = this.questInfo['userGetInfo'];
			const titanGiftLib = lib.getData('titanGift');
			/** ����� */
			const titanGift = inventory.consumable[24];
			let heroId = 0;
			let minLevel = 30;

			if (titanGift < 250 || user.gold < 7000) {
				return 0;
			}

			for (const hero of heroes) {
				if (hero.titanGiftLevel >= 30) {
					continue;
				}

				if (!hero.titanGiftLevel) {
					return hero.id;
				}

				const cost = titanGiftLib[hero.titanGiftLevel].cost;
				if (minLevel > hero.titanGiftLevel &&
					titanGift >= cost.consumable[24] &&
					user.gold >= cost.gold
				) {
					minLevel = hero.titanGiftLevel;
					heroId = hero.id;
				}
			}

			return heroId;
		}

		end(status) {
			setProgress(status, true);
			this.resolve();
		}
	}

	this.questRun = dailyQuests;

	function testDoYourBest() {
		return new Promise((resolve, reject) => {
			const doIt = new doYourBest(resolve, reject);
			doIt.start();
		});
	}

	/**
	 * Do everything button
	 *
	 * ������ ������� ���
	 */
	class doYourBest {

		funcList = [
			{
				name: 'startFarm',
				label: 'startFarm',
                title: '����������� ��� ����! ���������� ������� "�������� �������',
				checked: true
			},
            {
				name: 'mailGetAll',
				label: I18N('COLLECT_MAIL'),
                title: '�������� �����',
				checked: true
			},
            {
				name: 'openMatreshkiAndSunduki',
				label: '������� ������� � ��������',
                title: '��������� ������� � ��������, ��������� � ����',
				checked: true
			},
			{
				name: 'checkServer',
				label: 'checkServer',
                title: '����������� ��� �������� ��������, ��������� ��������� �� ������� ������ � �������� ���������� ��������!',
				checked: false
			},
			{
				name: 'farmEmeralds',
				label: 'farmEmeralds',
                title: '���� ����� ����� �������� �10 ���������/�������/�������/�����(����� �� ��������) ',
				checked: false
			},
			{
				name: 'collectAllStuff',
				label: I18N('COLLECT_MISC'),
				title: I18N('COLLECT_MISC_TITLE'),
				checked: true
			},
            {
				name: 'battlePass',
				label: 'battlePass',
                title: '�������� ������� � ������, �� ������ ���������! � �������� �������� ���� ���� ���������� ������ ��� �����',
				checked: false
			},
            {
				name: 'testCompany_0',
				label: 'testCompany_0',
                title: '1 ������ 3 ����, 2 ������ 1 ���, � ��������',
				checked: false
			},
            {
				name: 'testCompany_666',
				label: 'testCompany_666',
                title: '���� � ��� 0 �� ��������, 2 ������ �� 40 ���',
				checked: false
			},
			{
				name: 'getDailyBonus',
				label: I18N('DAILY_BONUS'),
                title: '������� ���������� �������',
				checked: true
			},
			{
				name: 'questAllFarm',
				label: I18N('COLLECT_QUEST_REWARDS'),
                title: '������� ������� �� ������',
				checked: true
			},
            {
				name: 'farm20000two',
				label: '�������� 20+20� �����',
                title: '�������� ���� � 5 �����, ���� ����� ������������, �� ����� ���������� � ����� �����! ��� �� �������� 1�� ����',
				checked: true
			},
			{
				name: 'testCompany',
				label: 'testCompany',
                title: '1 ������ 1 ���, 2 �� 40 ����, � ��������',
				checked: false
			},
            {
				name: 'openArtifactChest',
				label: 'openArtifactChest',
                title: '��������� �10 ���������, ���� ������ �������(����� �� ��������)',
				checked: false
			},
			{
				name: 'sendWinterLetter',
				label: 'Send letter to winter claus',
                title: '������ ������ ����! ���������� ������ ���� ����, ������� � ���� ������ 3 ��������!',
				checked: false
			},
			{
				name: 'receiveWinterGift',
				label: 'Receive gift from winter claus',
                title: '������� ������� �� ���� ���� ',
				checked: false
			},
			{
				name: 'giftsCalendar',
				label: 'giftsCalendar',
                title: '���������� ��������� �������� ������� (����� �� ��������)',
				checked: false
			},
			{
				name: 'farmEmeralds',
				label: 'farmEmeralds',
                title: '���� ����� ����� �������� �10 ���������/�������/�������/�����(����� �� ��������) ',
				checked: false
			},
			{
				name: 'sendNewYearGifts',
				label: 'sendNewYearGifts',
                title: '�������� ���������� ��������, ��������� � ������ "��� ������!" ',
				checked: false
			},
			{
				name: 'endFarm',
				label: 'endFarm',
                title: '��� ���� �����������! ���������� ������� ����������� �� ����������',
				checked: true
			},
		];

		functions = {
			getOutland,
			testTower,
			checkExpedition,
			mailGetAll,
			collectAllStuff: async () => {
				await offerFarmAllReward();
				await Send('{"calls":[{"name":"subscriptionFarm","args":{},"ident":"body"},{"name":"zeppelinGiftFarm","args":{},"ident":"zeppelinGiftFarm"},{"name":"grandFarmCoins","args":{},"ident":"grandFarmCoins"},{"name":"gacha_refill","args":{"ident":"heroGacha"},"ident":"gacha_refill"}]}');
			},
			dailyQuests: async function () {
				const quests = new dailyQuests(() => { }, () => { });
				await quests.autoInit(true);
				await quests.start();
			},
			rollAscension,
            testCompany_0: async function() {
await testCompany([{id: 1, times: 3}]);
await testCompany([{id: 2, times: 1}]);
},
			getDailyBonus,
			testCompany: async function() {
            const levelsExp =[
                {level:1,exp:0},{level:2,exp:20},{level:3,exp:40},{level:4,exp:65},{level:5,exp:95},{level:6,exp:125},{level:7,exp:155},
                {level:8,exp:205},{level:9,exp:285},{level:10,exp:385},{level:11,exp:505},{level:12,exp:625},{level:13,exp:745},
                {level:14,exp:865},{level:15,exp:985},{level:16,exp:1105},{level:17,exp:1225},{level:18,exp:1345},{level:19,exp:1465},
                {level:20,exp:1585},{level:21,exp:1705},{level:22,exp:1835},{level:23,exp:1965},{level:24,exp:2095},{level:25,exp:2225},
                {level:26,exp:2385},{level:27,exp:2545},{level:28,exp:2745},{level:29,exp:2975},{level:30,exp:3225},{level:31,exp:3495},
                {level:32,exp:3785},{level:33,exp:4095},{level:34,exp:4430},{level:35,exp:4815},{level:36,exp:5255},{level:37,exp:5745},
                {level:38,exp:6270},{level:39,exp:6840}]
            const maxExp=7410;
            const result = await Send(JSON.stringify({ calls:[{name:"userGetInfo",args:{},ident:"body"}]}));
            const infos = result.results;
            const userLvl = infos[0].result.response.level;
            if (userLvl < 40){
            const userExperience = infos[0].result.response.experience;
            const expNeeded = maxExp-levelsExp.find(n => n.level == userLvl).exp-userExperience;
            const reidEnergi = 6;
            const reidTimes = Math.ceil(expNeeded/reidEnergi);
                    await testCompany([{id: 1, times: 1}]);
                    await testCompany([{id: 2, times: reidTimes}]);
                }
            },
			questAllFarm,
			DungeonFull,
			testRaidNodes,
			openMailEnergy: async function () {
				await twinkMailGetAll();
			},
            farm20000two: async function collectResources() {
    // �������� ������ � 5 �����:
    await Send({ calls: [{ name: "seasonAdventure_getMapState", args: { seasonAdventureId: 5 }, ident: "body" }] });

    // ������� ���������� ����
    await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: 656 }, ident: "body" }] });
    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 656 }, ident: "body" }] });
       await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: 625 }, ident: "body" }] });
       await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: 625 }, ident: "body" }] });
    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 656 }, ident: "body" }] });
    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 656 }, ident: "body" }] });
    await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: 1066 }, ident: "body" }] });
    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 1066 }, ident: "body" }] });

    let starMoneyStart = await Send({ "calls": [{ "name": "userGetInfo", "args": {}, "ident": "body" }] }).then(e => e.results[0].result.response.starMoney);
    let islandStepsStart = await Send({ calls: [{ name: "inventoryGet", args: {}, ident: "body" }] }).then(e => e.results[0].result.response.coin[41]);
    let msg = "����� ����� �������������: " + islandStepsStart + "<br>";

    // ������� �������� �� ������� ��������
    let emeraldTower_87 = await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 87 }, ident: "body" }] });
    if (!(emeraldTower_87.error && emeraldTower_87.error.name == "TooMany")) {
        let islandSteps = await Send({ calls: [{ name: "inventoryGet", args: {}, ident: "body" }] }).then(e => e.results[0].result.response.coin[41]);
        if (islandSteps >= 18) {
            const map5_2 = [625, 595, 564, 534, 503, 473, 474, 444, 415, 385, 386, 357, 327, 298, 267, 238, 207, 178, 148, 118, 87];
            for (let point of map5_2) {
                await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
                await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
            }
            msg += "������� ������� ������� <br>";
        } else {
            msg += "������������ ����� (������� �������): " + islandSteps + "<br>";
        }
    } else {
        msg += "������� ������� ������� ����� <br>";
    }

    // ������� �������� �� ������ ��������
    let emeraldTower_1389 = await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: 1389 }, ident: "body" }] });
    if (!(emeraldTower_1389.error && emeraldTower_1389.error.name == "TooMany")) {
        let islandSteps = await Send({ calls: [{ name: "inventoryGet", args: {}, ident: "body" }] }).then(e => e.results[0].result.response.coin[41]);
        let woodenCoin = await Send({ "calls": [{ "name": "inventoryGet", "args": {}, "ident": "body" }] }).then(e => e.results[0].result.response.coin[53]);
        if (woodenCoin) {
            if (islandSteps >= 14) {
                const map5_3 = [1065, 1094, 1124, 1153, 1183, 1213, 1244, 1273, 1272, 1271, 1270, 1300, 1329, 1360, 1389];
                for (let point of map5_3) {
                    await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
                    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
                }
                msg += "������ ������� ������� <br>";
            } else {
                msg += "������������ ����� (������ �������): " + islandSteps + "<br>";
            }
        } else {
            if (islandSteps >= 16) {
                const map5_3V2 = [1065, 1064, 1033, 1094, 1124, 1153, 1183, 1213, 1244, 1273, 1272, 1271, 1270, 1300, 1329, 1360, 1389];
                for (let point of map5_3V2) {
                    await Send({ calls: [{ name: "seasonAdventure_exploreLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
                    await Send({ calls: [{ name: "seasonAdventure_processLevel", args: { seasonAdventureId: 5, levelId: point }, ident: "body" }] });
                }
                msg += "������ ������� ������� <br>";
            } else {
                msg += "������������ ����� (������ �������): " + islandSteps + "<br>";
            }
        }
    } else {
        msg += "������ ������� ������� ����� <br>";
    }

    let coins = await Send({ calls: [{ name: "inventoryGet", args: {}, ident: "body" }] }).then(e => e.results[0].result.response.coin);
    let islandStepLeft = 0;
    if (coins[41]) {
        islandStepLeft = coins[41];
    }
    let starMoneyEnd = await Send({ "calls": [{ "name": "userGetInfo", "args": {}, "ident": "body" }] }).then(e => e.results[0].result.response.starMoney);

    if ((starMoneyEnd - starMoneyStart) > 0) {
        msg += "�������� ����� �������������: " + islandStepLeft + " �������� ���������: " + (starMoneyEnd - starMoneyStart) + "<br>";
    }

    return msg; // ���������� ��������� ��� ���������� ��� ��� ��� �����
},
            openMatreshkiAndSunduki: async function () {
    let msg = "";

    // �������������� �������� � ��������
    const matreshkaId = [149, 167, 176, 184, 185, 186, 187, 188, 189, 190, 219, 301, 302, 304, 306, 315, 322, 331, 397, 400, 402, 403];
    const sundukiId = [46, 76, 78, 144, 153, 205, 207, 208, 209, 210, 211, 215, 225, 269, 271, 272, 326, 362, 363, 364, 365, 366, 367, 369, 370, 371, 372, 373, 374, 398, 414, 415, 416, 417, 421, 422];
    const izumrudMatreshka = [340, 341, 342, 343, 344, 345];

    let boxId = 0;
    let newCount = 0;
    let allCount = 0;
    const sumResult = {}; // ������� ��� �������� �����������

    // �������� ��������� ���������� ���������
    let starMoneyStart = await Send({"calls": [{"name": "userGetInfo", "args": {}, "ident": "body"}]}).then(e => e.results[0].result.response.starMoney);

    for (let i = 1; i <= 4; i++) {
        setProgress("������ #" + i, false);
        let consumable = await Send({"calls": [{"name": "inventoryGet", "args": {}, "ident": "body"}]}).then(e => e.results[0].result.response.consumable);

        for (let id in consumable) {
            boxId = Number(id);
            newCount = consumable[boxId];

            // �������� ��������
            if (matreshkaId.includes(boxId)) {
                let count = 0; // ������� �������� ��������
                while (newCount > 0) {
                    allCount += newCount;
                    let resultOpeningBoxes = await Send({"calls": [{"name": "consumableUseLootBox", "args": {"libId": boxId, "amount": newCount}, "ident": "body"}]}).then(e => e.results[0].result.response);

                    let [countLootBox, result] = Object.entries(resultOpeningBoxes).pop();
                    count += +countLootBox;
                    newCount = 0;

                    if (result?.consumable && result.consumable[boxId]) {
                        newCount = result.consumable[boxId];
                        delete result.consumable[boxId];
                    }

                    mergeItemsObj(sumResult, result);
                }
            }

            // �������� ����������� ��������
            if (sundukiId.includes(boxId)) {
                allCount += newCount;
                await Send({"calls": [{"name": "consumableUseLootBox", "args": {"libId": boxId, "amount": newCount}, "ident": "body"}]});
            }

            // �������� ���������� ��������
            if (izumrudMatreshka.includes(boxId)) {
                let count = 0; // ������� �������� ���������� ��������
                while (newCount > 0) {
                    allCount += newCount;
                    let openingResult = await Send({"calls": [{"name": "consumableUseLootBox", "args": {"libId": boxId, "amount": newCount}, "ident": "body"}]}).then(e => e.results[0].result.response);

                    let [countLootBox, result] = Object.entries(openingResult).pop();
                    count += +countLootBox;
                    newCount = 0;

                    if (result?.consumable && result.consumable[boxId]) {
                        newCount = result.consumable[boxId];
                        delete result.consumable[boxId];
                    }

                    mergeItemsObj(sumResult, result);
                }
            }
        }
    }

    setProgress(`����� �������: ${allCount}`, 5000);
    return [allCount, sumResult];
},
            testCompany_666: async function() {
            const levelsExp =[
                {level:1,exp:0},{level:2,exp:20},{level:3,exp:40},{level:4,exp:65},{level:5,exp:95},{level:6,exp:125},{level:7,exp:155},
                {level:8,exp:205},{level:9,exp:285},{level:10,exp:385},{level:11,exp:505},{level:12,exp:625},{level:13,exp:745},
                {level:14,exp:865},{level:15,exp:985},{level:16,exp:1105},{level:17,exp:1225},{level:18,exp:1345},{level:19,exp:1465},
                {level:20,exp:1585},{level:21,exp:1705},{level:22,exp:1835},{level:23,exp:1965},{level:24,exp:2095},{level:25,exp:2225},
                {level:26,exp:2385},{level:27,exp:2545},{level:28,exp:2745},{level:29,exp:2975},{level:30,exp:3225},{level:31,exp:3495},
                {level:32,exp:3785},{level:33,exp:4095},{level:34,exp:4430},{level:35,exp:4815},{level:36,exp:5255},{level:37,exp:5745},
                {level:38,exp:6270},{level:39,exp:6840}]
            const maxExp=7410;
            const result = await Send(JSON.stringify({ calls:[{name:"userGetInfo",args:{},ident:"body"}]}));
            const infos = result.results;
            const userLvl = infos[0].result.response.level;
            if (userLvl < 40){
                    const userExperience = infos[0].result.response.experience;
                    const expNeeded = maxExp-levelsExp.find(n => n.level == userLvl).exp-userExperience;
                    const reidEnergi = 6;
                    const reidTimes = Math.ceil(expNeeded/reidEnergi);

            const MISSION_ID = 2; //
            for(let i = 1; i <= reidTimes; i++)
            {
                let response = await Send({calls: [{name: "missionRaid",args: {id: MISSION_ID,times: 1},ident: "body"}]});
                if(response.error && response.error.name === 'NotEnough' || response.error && response.error.name === 'NotFound')
                {
                    console.log("----� ������ �----");
                    console.log(response);
                    break;
                }
            }
            console.log("----� ������� �----")
        }
        },
			checkServer: async function()
			{
				const serverInfo = getServers();

				const mergeResponse = await Send({"calls":[{"name":"userMergeGetStatus","args":{},"ident":"body"}]});

				if(mergeResponse.results[0].result.response.needMerge || mergeResponse.results[0].result.response.processingMerge)
				{
					const userMergeResponse = await Send({"calls":[{"name":"userMergeGetMergeData","args":{},"ident":"body"}]});

					await Send({"calls":[{"name":"userMergeSelectUser","args":{"id":userMergeResponse.results[0].result.response[Object.keys(userMergeResponse.results[0].result.response)[0]].id},"ident":"body"}]});

					await this.endFarm();

					return;
				}

				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.serverId) !== serverInfo.serverId)
				{
					const servers = await Send({"calls" : [
							{"name": "serverGetAll","args" : {}, "ident": "body"}
						]})

					const users = servers.results[0].result.response.users;

					for( let user of users )
					{
						if(parseInt(user.serverId) === serverInfo.serverId)
						{
							await Send({"calls":[{"name":"userChange","args":{"id": user.id },"ident":"body"}]});

							await this.endFarm();

							location.reload();
							return;
						}
					}

					return;
				}

				if(parseInt(userResponse.results[0].result.response.level) < 30 )
				{
					await this.endFarm();

					return;
				}

				const currentServer = serverInfo.servers.filter(server => server.serverId === serverInfo.serverId)

				if(!userResponse.results[0].result.response.clanId && parseInt(userResponse.results[0].result.response.clanId) !== currentServer[0].clanId)
				{
					await Send({"calls":[{"name":"clanJoin","args":{"clanId": currentServer[0].clanId },"ident":"body"},{"name":"adventure_find","args":{},"ident":"adventure_find"}]});
				}
				else if(userResponse.results[0].result.response.clanId && parseInt(userResponse.results[0].result.response.clanId) !== currentServer[0].clanId)
				{
					await this.endFarm();

					return;
				}
			},
			sendNewYearGifts: async function() {

				const serverInfo = getServers();

				const mergeResponse = await Send({"calls":[{"name":"userMergeGetStatus","args":{},"ident":"body"}]});

				if(mergeResponse.results[0].result.response.needMerge || mergeResponse.results[0].result.response.processingMerge)
				{
					const userMergeResponse = await Send({"calls":[{"name":"userMergeGetMergeData","args":{},"ident":"body"}]});

					await Send({"calls":[{"name":"userMergeSelectUser","args":{"id":userMergeResponse.results[0].result.response[Object.keys(userMergeResponse.results[0].result.response)[0]].id},"ident":"body"}]});

					await this.endFarm();

					return;
				}

				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.level) < 30 )
				{
					await this.endFarm();

					return;
				}

				if(parseInt(userResponse.results[0].result.response.serverId) !== serverInfo.serverId)
				{
					const servers = await Send({"calls" : [
							{"name": "serverGetAll","args" : {}, "ident": "body"}
						]})

					const users = servers.results[0].result.response.users;

					for( let user of users )
					{
						if(parseInt(user.serverId) === serverInfo.serverId)
						{
							await Send({"calls":[{"name":"userChange","args":{"id": user.id },"ident":"body"}]});

							await this.endFarm();

							location.reload();
							return;
						}
					}

					return;
				}

				const currentServer = serverInfo.servers.filter(server => server.serverId === serverInfo.serverId)

				if(!userResponse.results[0].result.response.clanId && parseInt(userResponse.results[0].result.response.clanId) !== currentServer[0].clanId)
				{
					await Send({"calls":[{"name":"clanJoin","args":{"clanId": currentServer[0].clanId },"ident":"body"},{"name":"adventure_find","args":{},"ident":"adventure_find"}]});
				}
				else if(userResponse.results[0].result.response.clanId && parseInt(userResponse.results[0].result.response.clanId) !== currentServer[0].clanId)
				{
					await this.endFarm();
				}

				await questAllFarm();

				await newYearDecorateTree();

				await questAllFarm();

				if(currentServer.length === 0)
				{
					await this.endFarm();

					return;
				}

				await questAllFarm();

				await newYearDecorateTree();

				await questAllFarm();

				for( const giftId of currentServer[0].gifts)
				{
					let delta = 0;

					if(giftId === 1)
					{
						delta = 750;
					}

					if(giftId === 2)
					{
						delta = 1750;
					}

					if(giftId === 3)
					{
						delta = 5000;
					}

                    if(giftId === 4)
					{
						delta = 10000;
					}

                    if(giftId === 5)
					{
						delta = 20000;
					}

                    if(giftId === 6)
					{
						delta = 5000;
					}

					let gifts = 0;

					do
					{
						await this.farmEmeralds();

						await this.battlePass();

						await mailGetAll();

						await questAllFarm();

						await newYearDecorateTree();

						await questAllFarm();

						let response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

						let coin = parseInt(response.results[0].result.response.coin[16])

						gifts = Math.floor(coin / delta);

						if(gifts <= 0)
						{
							break;
						}

						let users = {}

						users[currentServer[0].userId] = gifts;

						await Send({"calls":[
								{
									"name":"newYearGiftSend",
									"args": {
										"userId": currentServer[0].userId,
										"amount":gifts,
										"giftNum": giftId,
										"users": users
									},
									"ident":"body"
								}
							]})

						await this.battlePass();

						await mailGetAll();

						await questAllFarm();

						await this.farmEmeralds();

						await newYearDecorateTree();

						await questAllFarm();

						response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

						coin = parseInt(response.results[0].result.response.coin[16])

						gifts = Math.floor(coin / delta);
					}
					while(gifts > 0)
				}

				await Send({"calls":[{name: "clanDismissMember", args: {}, ident: "body"}]});

				await this.endFarm();
			},
			adventureTutorialPass: async function() {

				if(questsInfo['userGetInfo'].clanId && localStorage.getItem(`adventureTutorialPass-${questsInfo['userGetInfo'].id}`) !== 'true')
				{
					await Send({"calls":[{"name":"adventure_selectTutorialPet","args":{"petId":6001},"ident":"body"},{"name":"pet_getChest","args":{},"ident":"pet_getChest"}]})

					await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":345},"ident":"body"}]});

					await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":349},"ident":"body"}]});

					await Send({"calls":[{"name":"consumableUsePetXp","args":{"petId":6001,"libId":85,"amount":5},"ident":"group_0_body"},{"name":"tutorialSaveProgress","args":{"taskId":351},"ident":"group_1_body"}]});

					localStorage.setItem(`adventureTutorialPass-${questsInfo['userGetInfo'].id}`,'true');
				}

			},
			openArtifactChest: async function() {

				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.level) < 20)
				{
					return
				}

				checkboxes.countControl.cbox.checked = false

				let loop = true;

				while( loop )
				{
					await questAllFarm();

					await Send({"calls":[{"name":"artifactChestOpen","args":{"amount":10,"free":true},"ident":"body"}]}).then( async(response) => {
						if(response.error && response.error.name === 'NotEnough')
						{
							await Send({"calls":[{"name":"artifactChestOpen","args":{"amount":1,"free":true},"ident":"body"}]}).then( async (response) => {

								if(response.error && response.error.name === 'NotEnough')
								{
									loop = false;
								}
							})
						}
					})
				}

				// checkboxes.countControl.cbox.checked = true
			},
			farmEmeralds: async function() {

				checkboxes.countControl.cbox.checked = false

				const response = await Send(JSON.stringify({
					calls: [
						{
							name: "questGetAll",
							args: {},
							ident: "body"
						}
					]
				}))

				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );


				if(parseInt(userResponse.results[0].result.response.level) >= 20)
				{
					let quests = response.results[0].result.response.filter((quest) =>quest.id === 649)

					if(quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0)
					{
						await Send({"calls":[{"name":"artifactChestOpen","args":{"amount":10,"free":false},"ident":"body"}]})

						await questAllFarm();
					}

					// farmAllQuests
				}

				if(parseInt(userResponse.results[0].result.response.level) >= 30)
				{
					let cycle = true;

					while( cycle )
					{
						let response = await Send({"calls":[{"name":"titanUseSummonCircle","args":{"circleId":1,"paid":false,"amount":1},"ident":"body"}]});

						if(response.error && response.error.name === 'NotEnough' || response.error && response.error.name === 'NotFound')
						{
							cycle = false;
							break;
						}

						response = await Send({"calls":[{"name":"titanUseSummonCircle","args":{"circleId":1,"paid":false,"amount":10},"ident":"body"}]});

						if(response.error && response.error.name === 'NotEnough' || response.error && response.error.name === 'NotFound')
						{
							let response = await Send({"calls":[{"name":"titanUseSummonCircle","args":{"circleId":1,"paid":false,"amount":1},"ident":"body"}]});

							if(response.error && response.error.name === 'NotEnough' || response.error && response.error.name === 'NotFound')
							{
								cycle = false;
								break;
							}
						}
					}

					let quests = response.results[0].result.response.filter((quest) => quest.id === 651)

					if(quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0)
					{
						await Send({"calls":[{"name":"titanUseSummonCircle","args":{"circleId":1,"paid":true,"amount":1},"ident":"body"}]})

						await questAllFarm();
					}
				}

				if(parseInt(userResponse.results[0].result.response.level) >= 10)
				{
					let quests = response.results[0].result.response.filter((quest) =>quest.id === 845)

					if(quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0)
					{
						await Send({"calls":[{"name":"gacha_open","args":{"ident":"heroGacha","free":false,"pack":true},"ident":"body"}]})

						await questAllFarm();
					}
				}

				if(parseInt(userResponse.results[0].result.response.level) >= 40)
				{
					let quests = response.results[0].result.response.filter((quest) =>quest.id === 596)

					if(quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0)
					{
						await Send({"calls":[{"name":"pet_chestOpen","args":{"amount":"1","paid":true},"ident":"body"}]})

						await questAllFarm();
					}
				}

				if(parseInt(userResponse.results[0].result.response.level) >= 60)
				{
					let quests = response.results[0].result.response.filter((quest) =>quest.id === 650)

					if(quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0)
					{
						await Send({"calls":[{"name":"titanArtifactChestOpen","args":{"amount":100,"free":false},"ident":"body"}]})

						await questAllFarm();
					}
				}

				if(parseInt(userResponse.results[0].result.response.level) >= 65)
				{
					let quests = response.results[0].result.response.filter( ( quest ) => quest.id === 704 )

					if( quests.length > 0 && quests[0].state === 1 && quests[0].progress === 0 )
					{
						await Send( {"calls": [{"name": "ascensionChest_open", "args": {"amount": 10, "paid": true}, "ident": "body"}]} )

						await questAllFarm();
					}
				}

				// checkboxes.countControl.cbox.checked = true
			},
			openBoxyGifts: async function() {

				checkboxes.countControl.cbox.checked = false

				while(true)
				{
					const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":78,"amount":10},"ident":"body"}]})

					if(response.error)
					{
						const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":78,"amount":5},"ident":"body"}]})

						if(response.error)
						{
							const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":78,"amount":1},"ident":"body"}]})

							if(response.error)
							{
								break;
							}
						}
					}
				}

				// checkboxes.countControl.cbox.checked = true
			},
			openDailyGifts: async function() {

				checkboxes.countControl.cbox.checked = false

				while(true)
				{
					const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":144,"amount":10},"ident":"body"}]})

					if(response.error)
					{
						const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":144,"amount":5},"ident":"body"}]})

						if(response.error)
						{
							const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":144,"amount":1},"ident":"body"}]})

							if(response.error)
							{
								break;
							}
						}
					}
				}

				while(true)
				{
					const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":146,"amount":10},"ident":"body"}]})

					if(response.error)
					{
						const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":146,"amount":5},"ident":"body"}]})

						if(response.error)
						{
							const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":146,"amount":1},"ident":"body"}]})

							if(response.error)
							{
								break;
							}
						}
					}
				}

				while(true)
				{
					const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":148,"amount":10},"ident":"body"}]})

					if(response.error)
					{
						const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":148,"amount":5},"ident":"body"}]})

						if(response.error)
						{
							const response = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":148,"amount":1},"ident":"body"}]})

							if(response.error)
							{
								break;
							}
						}
					}
				}

				// checkboxes.countControl.cbox.checked = true
			},
			openEnergyBottles: async function(){

				const response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

				let bottles = parseInt(response.results[0].result.response.consumable[17])

				// save value.

				// if(bottles > 70)
				// {
				await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":17,"amount":bottles},"ident":"body"}]})
				// }
			},
			twinkPassOneToFifteen: async function () {
				await (new executeTwinkPass()).twinkPassOneToFifteen()
			},
			twinkPassFifteenToThirty: async function () {
				await (new executeTwinkPass()).twinkPassFifteenToThirty()
			},
			testRaid: async function () {
				const response = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]})

				if(response.results[0].result.response.consumable[151])
				{
					let raidTimes = 0;

					do
					{
						const data = await Send( JSON.stringify( {
							calls: [
								{
									name: "userGetInfo",
									args: {},
									ident: "userGetInfo"
								}
							]
						} ) );

						let energy = data.results[0].result.response.refillable[0].amount;

						raidTimes = Math.floor(energy / 6);

						if(raidTimes > 0)
						{
							await Send({"calls":[{"name":"missionRaid","args":{"id":4,"times":raidTimes},"ident":"body"}]})
						}

					}while(raidTimes > 0)
				}
			},
			twinkPassThirtyPlus: async function () {
				await (new executeTwinkPass()).twinkPassThirtyPlus()
			},
			galahadPass: async function () {
				await (new executeTwinkPass()).galahadPass()
			},
			synchronization: async () => {
				cheats.refreshGame();
			},
			autoBoss: async () => {
				await (new executeEventAutoBoss()).twinkTryWithMetaTeam();
			},
			giftsCalendar: async() => {

				let day = (new Date()).getDate()

				for(var i = 1; i <= day; i++){

					setProgress(`gifts calendar, day: ${i}`);

					if(!localStorage.getItem(`gifts-calendar--${i}-${questsInfo['userGetInfo'].id}`))
					{
						const response = await Send({"calls":[{"name":"adventCalendar_farm","args":{"day":i},"ident":"body"}]});

						if(response.error && response.error.description === `${i} already farmed`)
						{
							localStorage.setItem(`gifts-calendar--${i}-${questsInfo['userGetInfo'].id}`, 'true');

							continue;
						}

						console.log(response);

						if(!response.error){
							localStorage.setItem(`gifts-calendar--${i}-${questsInfo['userGetInfo'].id}`, 'true');
						}
					}
				}
			},
			battlePass: async() => {

				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );


				if(parseInt(userResponse.results[0].result.response.level) < 40)
				{
					return;
				}

				for(let i = 1; i <= 70; i++)
				{
					setProgress(`battle pass, level: ${i}`);

					if(!localStorage.getItem(`new-battle-pass-${i}-${questsInfo['userGetInfo'].id}`))
					{
						const response = await Send({"calls":[{"name":"battlePass_farmReward","args":{"level":i,"free":true},"ident":"body"}]});

						// {name: "NotAvailable", description: "battlePass reward farmed",�}

						if(response.error && response.error.description === "battlePass reward farmed")
						{
							localStorage.setItem(`new-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');

							continue;
						}

						if(!response.error){
							localStorage.setItem(`new-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');
						}
					}
				}

				// for(let i = 1; i <= 12; i++)
				// {
				// 	setProgress(`battle pass, level: ${i}`);
				//
				// 	if(!localStorage.getItem(`light-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`))
				// 	{
				// 		const response = await Send({"calls":[{"name":"battlePass_farmReward","args":{"id":26,"level":i,"free":true},"ident":"body"}]});
				//
				// 		if(response.error && response.error.description === "battlePass reward farmed")
				// 		{
				// 			localStorage.setItem(`light-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');
				//
				// 			continue;
				// 		}
				//
				// 		if(!response.error){
				// 			localStorage.setItem(`light-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');
				// 		}
				// 	}
				// }
				//
				// for(let i = 1; i <= 12; i++)
				// {
				// 	setProgress(`battle pass, level: ${i}`);
				//
				// 	if(!localStorage.getItem(`dark-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`))
				// 	{
				// 		const response = await Send({"calls":[{"name":"battlePass_farmReward","args":{"id":27,"level":i,"free":true},"ident":"body"}]});
				//
				// 		if(response.error && response.error.description === "battlePass reward farmed")
				// 		{
				// 			localStorage.setItem(`dark-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');
				//
				// 			continue;
				// 		}
				//
				// 		if(!response.error){
				// 			localStorage.setItem(`dark-titan-battle-pass-${i}-${questsInfo['userGetInfo'].id}`, 'true');
				// 		}
				// 	}
				// }
			},
			sendWinterLetter: async() => {

				try
				{
				if(localStorage.getItem('winterTale-'+questsInfo['userGetInfo'].id) !== 'true')
				{
					await SendRequest('{"calls":[{"name":"newYear_selectGifts","args":{"ids":[7,5,1]},"ident":"body"}]}', e => console.log(e))
					await SendRequest('{"calls":[{"name":"setTimeZone","args":{"timeZone":14},"ident":"body"}]}', e => console.log(e))

					localStorage.setItem('winterTale-'+questsInfo['userGetInfo'].id, 'true');
				}
				}
				catch( e )
				{

				}

			},
			receiveWinterGift: async() => {

				try {
				if(localStorage.getItem('winterTaleGet-'+questsInfo['userGetInfo'].id) !== 'true')
				{
					const winterTaleGetResponse = await Send({"calls":[{"name":"specialOffer_farmReward","args":{"offerId":1107},"ident":"body"}]});

					if(!winterTaleGetResponse.error)
					{
						localStorage.setItem('winterTaleGet-'+questsInfo['userGetInfo'].id, 'true');
					}
				}
				}
				catch( e )
				{

				}

			},
			startFarm: async () => {

				let element = document.querySelector('.endFarm_header');

				element.classList.add('farm_started')

				element.innerHTML = '������'
			},
			endFarm: async () => {

				localStorage.setItem('new-v-'+ (new Date()).toDateString()+ '-'+questsInfo['userGetInfo'].id, 'true');

				let element = document.querySelector('.endFarm_header');

				element.classList.add('farm_end')

				element.innerHTML = '����� �����'
			},
			twinkUpgradeSkills: async () =>{

				let error = false;

				let attempts = 20;

				do
				{
					const upgradeSkills = await this.getTwinkUpgradeSkills();
					const requestUpgradeSkills = upgradeSkills.map(({ heroId, skill }, index) => ({ name: "heroUpgradeSkill", args: { heroId, skill }, "ident": `heroUpgradeSkill_${index}` }));

					for( const requestUpgradeSkill of requestUpgradeSkills )
					{
						const response = await Send(
							JSON.stringify({
								'calls': [requestUpgradeSkill]
							})
						)

						if(response.error)
						{
							error = true;
						}
					}

					attempts --;

				}while(!error && attempts)

			},
			reloadGame: async () => {
				location.reload();
			}
		}

		async getTwinkUpgradeSkills() {

			const heroesResponse = await Send( JSON.stringify( {
				calls: [
					{
						name: "heroGetAll",
						args: {},
						ident: "body"
					}
				]
			} ) );

			const heroes = Object.entries(heroesResponse.results[0].result.response).map(([key, val]) => val);

			const upgradeSkills = [
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
				{ heroId: 0, slotId: 0, value: 130 },
			];
			const skillLib = lib.getData('skill');
			/**
			 * color - 1 (�����) ��������� 1 �����
			 * color - 2 (�������) ��������� 2 �����
			 * color - 4 (�����) ��������� 3 �����
			 * color - 7 (����������) ��������� 4 �����
			 */
			const colors = [1, 2, 4, 7];
			for (const hero of heroes) {
				const level = hero.level;
				const color = hero.color;
				for (let skillId in hero.skills) {
					const tier = skillLib[skillId].tier;
					const sVal = hero.skills[skillId];
					if (color < colors[tier] || tier < 1 || tier > 4) {
						continue;
					}
					for (let upSkill of upgradeSkills) {
						if (sVal < upSkill.value && sVal < level) {
							upSkill.value = sVal;
							upSkill.heroId = hero.id;
							upSkill.skill = tier;
							break;
						}
					}
				}
			}

			const newUpgradeSkills = [];

			for (let upSkill of upgradeSkills) {

				if(upSkill.heroId)
				{
					newUpgradeSkills.push(upSkill);
				}
			}

			return newUpgradeSkills;
		}

		constructor(resolve, reject, questInfo) {
			this.resolve = resolve;
			this.reject = reject;
			this.questInfo = questInfo
		}

		async start() {
			const selectedDoIt = getSaveVal('selectedDoIt', {});

			this.funcList.forEach(task => {
				// if (!selectedDoIt[task.name]) {
				selectedDoIt[task.name] = {
					checked: task.checked
				}
				// } else {
				// 	task.checked = selectedDoIt[task.name].checked
				// }
			});

			const answer = await popup.confirm(I18N('RUN_FUNCTION'), [
				{ msg: I18N('BTN_CANCEL'), result: false },
				{ msg: I18N('BTN_GO'), result: true },
			], this.funcList);

			if (!answer) {
				this.end('');
				return;
			}

			const taskList = popup.getCheckBoxes();
			taskList.forEach(task => {
				selectedDoIt[task.name].checked = task.checked;
			});
			setSaveVal('selectedDoIt', selectedDoIt);
			for (const task of popup.getCheckBoxes()) {
				if (task.checked) {
					try {
						setProgress(`${task.label} <br>${I18N('PERFORMED')}!`);
						await this.functions[task.name]();
						setProgress(`${task.label} <br>${I18N('DONE')}!`);
					} catch (error) {
						if (await popup.confirm(`${I18N('ERRORS_OCCURRES')}:<br> ${task.label} <br>${I18N('COPY_ERROR')}?`, [
							{ msg: I18N('BTN_NO'), result: false },
							{ msg: I18N('BTN_YES'), result: true },
						])) {
							this.errorHandling(error);
						}
					}
				}
			}
			setTimeout((msg) => {
				this.end(msg);
			}, 2000, I18N('ALL_TASK_COMPLETED'));
			return;
		}

		errorHandling(error) {
			//console.error(error);
			let errorInfo = error.toString() + '\n';
			try {
				const errorStack = error.stack.split('\n');
				const endStack = errorStack.map(e => e.split('@')[0]).indexOf("testDoYourBest");
				errorInfo += errorStack.slice(0, endStack).join('\n');
			} catch (e) {
				errorInfo += error.stack;
			}
			copyText(errorInfo);
		}

		end(status) {
			setProgress(status, true);
			this.resolve();
		}
	}

	/**
	 * Passing the adventure along the specified route
	 *
	 * ����������� ����������� �� ���������� ��������
	 */
	function testAdventure(type) {
		return new Promise((resolve, reject) => {
			const bossBattle = new executeAdventure(resolve, reject);
			bossBattle.start(type);
		});
	}

	/**
	 * Passing the adventure along the specified route
	 *
	 * ����������� ����������� �� ���������� ��������
	 */
	class executeAdventure {

		type = 'default';

		actions = {
			default: {
				getInfo: "adventure_getInfo",
				startBattle: 'adventure_turnStartBattle',
				endBattle: 'adventure_endBattle',
				collectBuff: 'adventure_turnCollectBuff'
			},
			solo: {
				getInfo: "adventureSolo_getInfo",
				startBattle: 'adventureSolo_turnStartBattle',
				endBattle: 'adventureSolo_endBattle',
				collectBuff: 'adventureSolo_turnCollectBuff'
			}
		}

		terminat�Reason = I18N('UNKNOWN');
		callAdventureInfo = {
			name: "adventure_getInfo",
			args: {},
			ident: "adventure_getInfo"
		}
		callTeamGetAll = {
			name: "teamGetAll",
			args: {},
			ident: "teamGetAll"
		}
		callTeamGetFavor = {
			name: "teamGetFavor",
			args: {},
			ident: "teamGetFavor"
		}
		callStartBattle = {
			name: "adventure_turnStartBattle",
			args: {},
			ident: "body"
		}
		callEndBattle = {
			name: "adventure_endBattle",
			args: {
				result: {},
				progress: {},
			},
			ident: "body"
		}
		callCollectBuff = {
			name: "adventure_turnCollectBuff",
			args: {},
			ident: "body"
		}

		constructor(resolve, reject) {
			this.resolve = resolve;
			this.reject = reject;
		}

		async start(type) {
			this.type = type || this.type;
			this.callAdventureInfo.name = this.actions[this.type].getInfo;
			const data = await Send(JSON.stringify({
				calls: [
					this.callAdventureInfo,
					this.callTeamGetAll,
					this.callTeamGetFavor
				]
			}));
			return this.checkAdventureInfo(data.results);
		}

		async getPath() {
			const oldVal = getSaveVal('adventurePath', '');
			const keyPath = `adventurePath:${this.mapIdent}`;
			const answer = await popup.confirm(I18N('ENTER_THE_PATH'), [
				{
					msg: I18N('START_ADVENTURE'),
					placeholder: '1,2,3,4,5,6',
					isInput: true,
					default: getSaveVal(keyPath, oldVal)
				},
				{
					msg: I18N('BTN_CANCEL'),
					result: false
				},
			]);
			if (!answer) {
				this.terminat�Reason = I18N('BTN_CANCELED');
				return false;
			}

			let path = answer.split(',');
			if (path.length < 2) {
				path = answer.split('-');
			}
			if (path.length < 2) {
				this.terminat�Reason = I18N('MUST_TWO_POINTS');
				return false;
			}

			for (let p in path) {
				path[p] = +path[p].trim()
				if (Number.isNaN(path[p])) {
					this.terminat�Reason = I18N('MUST_ONLY_NUMBERS');
					return false;
				}
			}

			if (!this.checkPath(path)) {
				return false;
			}
			setSaveVal(keyPath, answer);
			return path;
		}

		checkPath(path) {
			for (let i = 0; i < path.length - 1; i++) {
				const currentPoint = path[i];
				const nextPoint = path[i + 1];

				const isValidPath = this.paths.some(p =>
					(p.from_id === currentPoint && p.to_id === nextPoint) ||
					(p.from_id === nextPoint && p.to_id === currentPoint)
				);

				if (!isValidPath) {
					this.terminat�Reason = I18N('INCORRECT_WAY', {
						from: currentPoint,
						to: nextPoint,
					});
					return false;
				}
			}

			return true;
		}

		async checkAdventureInfo(data) {
			this.advInfo = data[0].result.response;
			if (!this.advInfo) {
				this.terminat�Reason = I18N('NOT_ON_AN_ADVENTURE') ;
				return this.end();
			}
			const heroesTeam = data[1].result.response.adventure_hero;
			const favor = data[2]?.result.response.adventure_hero;
			const heroes = heroesTeam.slice(0, 5);
			const pet = heroesTeam[5];
			this.args = {
				pet,
				heroes,
				favor,
				path: [],
				broadcast: false
			}
			const advUserInfo = this.advInfo.users[userInfo.id];
			this.turnsLeft = advUserInfo.turnsLeft;
			this.currentNode = advUserInfo.currentNode;
			this.nodes = this.advInfo.nodes;
			this.paths = this.advInfo.paths;
			this.mapIdent = this.advInfo.mapIdent;

			this.path = await this.getPath();
			if (!this.path) {
				return this.end();
			}

			if (this.currentNode == 1 && this.path[0] != 1) {
				this.path.unshift(1);
			}

			return this.loop();
		}

		async loop() {
			const position = this.path.indexOf(+this.currentNode);
			if (!(~position)) {
				this.terminat�Reason = I18N('YOU_IN_NOT_ON_THE_WAY');
				return this.end();
			}
			this.path = this.path.slice(position);
			if ((this.path.length - 1) > this.turnsLeft &&
				await popup.confirm(I18N('ATTEMPTS_NOT_ENOUGH'), [
					{ msg: I18N('YES_CONTINUE'), result: false },
					{ msg: I18N('BTN_NO'), result: true },
				])) {
				this.terminat�Reason = I18N('NOT_ENOUGH_AP');
				return this.end();
			}
			const toPath = [];
			for (const nodeId of this.path) {
				if (!this.turnsLeft) {
					this.terminat�Reason = I18N('ATTEMPTS_ARE_OVER');
					return this.end();
				}
				toPath.push(nodeId);
				console.log(toPath);
				if (toPath.length > 1) {
					setProgress(toPath.join(' > ') + ` ${I18N('MOVES')}: ` + this.turnsLeft);
				}
				if (nodeId == this.currentNode) {
					continue;
				}

				const nodeInfo = this.getNodeInfo(nodeId);
				if (nodeInfo.type == 'TYPE_COMBAT') {
					if (nodeInfo.state == 'empty') {
						this.turnsLeft--;
						continue;
					}

					/**
					 * Disable regular battle cancellation
					 *
					 * ��������� ������� ������� ���
					 */
					isCancalBattle = false;
					if (await this.battle(toPath)) {
						this.turnsLeft--;
						toPath.splice(0, toPath.indexOf(nodeId));
						nodeInfo.state = 'empty';
						isCancalBattle = true;
						continue;
					}
					isCancalBattle = true;
					return this.end()
				}

				if (nodeInfo.type == 'TYPE_PLAYERBUFF') {
					const buff = this.checkBuff(nodeInfo);
					if (buff == null) {
						continue;
					}

					if (await this.collectBuff(buff, toPath)) {
						this.turnsLeft--;
						toPath.splice(0, toPath.indexOf(nodeId));
						continue;
					}
					this.terminat�Reason = I18N('BUFF_GET_ERROR');
					return this.end();
				}
			}
			this.terminat�Reason = I18N('SUCCESS');
			return this.end();
		}

		/**
		 * Carrying out a fight
		 *
		 * ���������� ���
		 */
		async battle(path, preCalc = true) {
			const data = await this.startBattle(path);
			try {
				const battle = data.results[0].result.response.battle;
				const result = await Calc(battle);
				if (result.result.win) {
					const info = await this.endBattle(result);
					if (info.results[0].result.response?.error) {
						this.terminat�Reason = I18N('BATTLE_END_ERROR');
						return false;
					}
				} else {
					await this.cancelBattle(result);

					if (preCalc && await this.preCalcBattle(battle)) {
						path = path.slice(-2);
						for (let i = 1; i <= getInput('countAutoBattle'); i++) {
							setProgress(`${I18N('AUTOBOT')}: ${i}/${getInput('countAutoBattle')}`);
							const result = await this.battle(path, false);
							if (result) {
								setProgress(I18N('VICTORY'));
								return true;
							}
						}
						this.terminat�Reason = I18N('FAILED_TO_WIN_AUTO');
						return false;
					}
					return false;
				}
			} catch (error) {
				console.error(error);
				if (await popup.confirm(I18N('ERROR_OF_THE_BATTLE_COPY'), [
					{ msg: I18N('BTN_NO'), result: false },
					{ msg: I18N('BTN_YES'), result: true },
				])) {
					this.errorHandling(error, data);
				}
				this.terminat�Reason = I18N('ERROR_DURING_THE_BATTLE');
				return false;
			}
			return true;
		}

		/**
		 * Recalculate battles
		 *
		 * ���������� �����
		 */
		async preCalcBattle(battle) {
			const countTestBattle = getInput('countTestBattle');
			for (let i = 0; i < countTestBattle; i++) {
				battle.seed = Math.floor(Date.now() / 1000) + random(0, 1e3);
				const result = await Calc(battle);
				if (result.result.win) {
					console.log(i, countTestBattle);
					return true;
				}
			}
			this.terminat�Reason = I18N('NO_CHANCE_WIN') + countTestBattle;
			return false;
		}

		/**
		 * Starts a fight
		 *
		 * �������� ���
		 */
		startBattle(path) {
			this.args.path = path;
			this.callStartBattle.name = this.actions[this.type].startBattle;
			this.callStartBattle.args = this.args
			const calls = [this.callStartBattle];
			return Send(JSON.stringify({ calls }));
		}

		cancelBattle(battle) {
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					const hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			fixBattle(battle.progress[0].attackers.heroes);
			fixBattle(battle.progress[0].defenders.heroes);
			return this.endBattle(battle);
		}

		/**
		 * Ends the fight
		 *
		 * ����������� ���
		 */
		endBattle(battle) {
			this.callEndBattle.name = this.actions[this.type].endBattle;
			this.callEndBattle.args.result = battle.result
			this.callEndBattle.args.progress = battle.progress
			const calls = [this.callEndBattle];
			return Send(JSON.stringify({ calls }));
		}

		/**
		 * Checks if you can get a buff
		 *
		 * ��������� ����� �� �������� ���
		 */
		checkBuff(nodeInfo) {
			let id = null;
			let value = 0;
			for (const buffId in nodeInfo.buffs) {
				const buff = nodeInfo.buffs[buffId];
				if (buff.owner == null && buff.value > value) {
					id = buffId;
					value = buff.value;
				}
			}
			nodeInfo.buffs[id].owner = '�';
			return id;
		}

		/**
		 * Collects a buff
		 *
		 * �������� ���
		 */
		async collectBuff(buff, path) {
			this.callCollectBuff.name = this.actions[this.type].collectBuff;
			this.callCollectBuff.args = { buff, path };
			const calls = [this.callCollectBuff];
			return Send(JSON.stringify({ calls }));
		}

		getNodeInfo(nodeId) {
			return this.nodes.find(node => node.id == nodeId);
		}

		errorHandling(error, data) {
			//console.error(error);
			let errorInfo = error.toString() + '\n';
			try {
				const errorStack = error.stack.split('\n');
				const endStack = errorStack.map(e => e.split('@')[0]).indexOf("testAdventure");
				errorInfo += errorStack.slice(0, endStack).join('\n');
			} catch (e) {
				errorInfo += error.stack;
			}
			if (data) {
				errorInfo += '\nData: ' + JSON.stringify(data);
			}
			copyText(errorInfo);
		}

		end() {
			isCancalBattle = true;
			setProgress(this.terminat�Reason, true);
			console.log(this.terminat�Reason);
			this.resolve();
		}
	}

	/**
	 * Passage of brawls
	 *
	 * ����������� ���������
	 */
	function testBrawls() {
		return new Promise((resolve, reject) => {
			const brawls = new executeBrawls(resolve, reject);
			brawls.start(brawlsPack);
		});
	}
	/**
	 * Passage of brawls
	 *
	 * ����������� ���������
	 */
	class executeBrawls {
		callBrawlQuestGetInfo = {
			name: "brawl_questGetInfo",
			args: {},
			ident: "brawl_questGetInfo"
		}
		callBrawlFindEnemies = {
			name: "brawl_findEnemies",
			args: {},
			ident: "brawl_findEnemies"
		}
		callBrawlQuestFarm = {
			name: "brawl_questFarm",
			args: {},
			ident: "brawl_questFarm"
		}
		callUserGetInfo = {
			name: "userGetInfo",
			args: {},
			ident: "userGetInfo"
		}

		stats = {
			win: 0,
			loss: 0,
			count: 0,
		}

		stage = {
			'3': 1,
			'7': 2,
			'12': 3,
		}

		attempts = 0;

		constructor(resolve, reject) {
			this.resolve = resolve;
			this.reject = reject;
		}

		async start(args) {
			this.args = args;
			isCancalBattle = false;
			this.brawlInfo = await this.getBrawlInfo();
			this.attempts = this.brawlInfo.attempts;

			if (!this.attempts) {
				this.end(I18N('DONT_HAVE_LIVES'))
				return;
			}

			while (1) {
				if (!isBrawlsAutoStart) {
					this.end(I18N('BTN_CANCELED'))
					return;
				}

				const maxStage = this.brawlInfo.questInfo.stage;
				const stage = this.stage[maxStage];
				const progress = this.brawlInfo.questInfo.progress;

				setProgress(`${I18N('STAGE')} ${stage}: ${progress}/${maxStage}<br>${I18N('FIGHTS')}: ${this.stats.count}<br>${I18N('WINS')}: ${this.stats.win}<br>${I18N('LOSSES')}: ${this.stats.loss}<br>${I18N('LIVES')}: ${this.attempts}<br>${I18N('STOP')}`, false, function () {
					isBrawlsAutoStart = false;
				});

				if (this.brawlInfo.questInfo.canFarm) {
					const result = await this.questFarm();
					console.log(result);
				}

				if (this.brawlInfo.questInfo.stage == 12 && this.brawlInfo.questInfo.progress == 12) {
					this.end(I18N('SUCCESS'))
					return;
				}

				if (!this.attempts) {
					this.end(I18N('DONT_HAVE_LIVES'))
					return;
				}

				const enemie = Object.values(this.brawlInfo.findEnemies).shift();

				const result = await this.battle(enemie.userId);
				this.brawlInfo = {
					questInfo: result[1].result.response,
					findEnemies: result[2].result.response,
				}
			}
		}

		async questFarm() {
			const calls = [this.callBrawlQuestFarm];
			const result = await Send(JSON.stringify({ calls }));
			return result.results[0].result.response;
		}

		async getBrawlInfo() {
			const data = await Send(JSON.stringify({
				calls: [
					this.callUserGetInfo,
					this.callBrawlQuestGetInfo,
					this.callBrawlFindEnemies,
				]
			}));

			let attempts = data.results[0].result.response.refillable.find(n => n.id == 48);
			return {
				attempts: attempts.amount,
				questInfo: data.results[1].result.response,
				findEnemies: data.results[2].result.response,
			}
		}

		/**
		 * Carrying out a fight
		 *
		 * ���������� ���
		 */
		async battle(userId) {
			this.stats.count++;
			const battle = await this.startBattle(userId, this.args);
			const result = await Calc(battle);
			console.log(result.result);
			if (result.result.win) {
				this.stats.win++;
			} else {
				this.stats.loss++;
				this.attempts--;
			}
			return await this.endBattle(result);
			// return await this.cancelBattle(result);
		}

		/**
		 * Starts a fight
		 *
		 * �������� ���
		 */
		async startBattle(userId, args) {
			const call = {
				name: "brawl_startBattle",
				args,
				ident: "brawl_startBattle"
			}
			call.args.userId = userId;
			const calls = [call];
			const result = await Send(JSON.stringify({ calls }));
			return result.results[0].result.response;
		}

		cancelBattle(battle) {
			const fixBattle = function (heroes) {
				for (const ids in heroes) {
					const hero = heroes[ids];
					hero.energy = random(1, 999);
					if (hero.hp > 0) {
						hero.hp = random(1, hero.hp);
					}
				}
			}
			fixBattle(battle.progress[0].attackers.heroes);
			fixBattle(battle.progress[0].defenders.heroes);
			return this.endBattle(battle);
		}

		/**
		 * Ends the fight
		 *
		 * ����������� ���
		 */
		async endBattle(battle) {
			battle.progress[0].attackers.input = ['auto', 0, 0, 'auto', 0, 0];
			const calls = [{
				name: "brawl_endBattle",
				args: {
					result: battle.result,
					progress: battle.progress
				},
				ident: "brawl_endBattle"
			},
				this.callBrawlQuestGetInfo,
				this.callBrawlFindEnemies,
			];
			const result = await Send(JSON.stringify({ calls }));
			return result.results;
		}

		end(endReason) {
			isCancalBattle = true;
			isBrawlsAutoStart = false;
			setProgress(endReason, true);
			console.log(endReason);
			this.resolve();
		}
	}

	class executeEventAutoBoss {

		async start() {
			await this.loadInfo();
			this.generateCombo();

			const countTestBattle = +getInput('countTestBattle');
			const maxCalcBattle = this.combo.length * countTestBattle;

			const resultDialog = await popup.confirm(I18N('EVENT_AUTO_BOSS', {
				length: this.combo.length,
				countTestBattle,
				maxCalcBattle
			}), [
				{ msg: I18N('BEST_SLOW'), result: true },
				{ msg: I18N('FIRST_FAST'), result: false },
				{ isClose: true, result: 'exit' },
			]);

			if (resultDialog == 'exit') {
				this.end('��������');
				return;
			}

			popup.confirm(I18N('FREEZE_INTERFACE'));

			setTimeout(() => {
				this.startFindPack(resultDialog)
			}, 1000)
		}

		async tryWithMetaTeam() {

			// await this.metaBattleLoop({heroes: [57, 7, 22, 35, 61], pet: 6001, favor: {22: 6007, 61: 6001}});
			await this.metaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
		}

		async twinkTryWithMetaTeam() {

			return true;

			// await this.metaBattleLoop({heroes: [57, 7, 22, 35, 61], pet: 6001, favor: {22: 6007, 61: 6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
			await this.twinkMetaBattleLoop({"heroes":[46,9,43,12,2],"pet":6004,"favor":{"2":6005,"9":6004,"12":6003,"43":6006,"46":6001}});
		}

		async loadInfo() {
			const resultReq = await Send({ calls: [{ name: "teamGetMaxUpgrade", args: {}, ident: "group_1_body" }, { name: "invasion_bossStart", args: { id: 134, heroes: [46,29,13,2,1], pet: 6006, favor: {"1":6004,"2":6005,"13":6006,"29":6002,"46":6001} }, ident: "body" }] }).then(e => e.results);
			this.heroes = resultReq[0].result.response;
			this.battle = resultReq[1].result.response;

			this.heroes.hero[61] = this.battle.attackers[1];
			this.battle.attackers = [];
		}

		combinations(arr, n) {
			if (n == 1) {
				return arr.map(function (x) { return [x]; });
			}
			else if (n <= 0) {
				return [];
			}
			var result = [];
			for (var i = 0; i < arr.length; i++) {
				var rest = arr.slice(i + 1);
				var c = this.combinations(rest, n - 1);
				for (var j = 0; j < c.length; j++) {
					c[j].unshift(arr[i]);
					result.push(c[j]);
				}
			}
			return result;
		}

		generateCombo() {
			// const heroesIds = [3, 7, 8, 9, 12, 16, 18, 22, 35, 40, 48, 57, 58, 59];
			const heroesIds = [3, 7, 9, 12, 18, 22, 35, 40, 48, 57, 58, 59];
			this.combo = this.combinations(heroesIds, 4);
		}

		async startFindPack(findBestOfAll) {
			const promises = [];
			let bestBattle = null;
			for (const comb of this.combo) {
				const copyBattle = structuredClone(this.battle);
				const attackers = [];
				for (const id of comb) {
					if (this.heroes.hero[id]) {
						attackers.push(this.heroes.hero[id]);
					}
				}
				attackers.push(this.heroes.hero[61]);
				attackers.push(this.heroes.pet[6001]);
				copyBattle.attackers = attackers;
				const countTestBattle = +getInput('countTestBattle');
				if (findBestOfAll) {
					promises.push(this.CalcBattle(copyBattle, countTestBattle));
				} else {
					try {
						const checkBattle = await this.CalcBattle(copyBattle, countTestBattle);
						if (checkBattle.result.win) {
							bestBattle = checkBattle;
							break;
						}
					} catch(e) {
						console.log(e, copyBattle)
						popup.confirm(I18N('ERROR_F12'));
						this.end(I18N('ERROR_F12'), e, copyBattle)
						return;
					}
				}
			}

			if (findBestOfAll) {
				bestBattle = await Promise.all(promises)
					.then(results => {
						results = results.sort((a, b) => b.coeff - a.coeff).slice(0, 10);
						let maxStars = 0;
						let maxCoeff = -100;
						let maxBattle = null;
						results.forEach(e => {
							if (e.stars > maxStars || e.coeff > maxCoeff) {
								maxCoeff = e.coeff;
								maxStars = e.stars;
								maxBattle = e;
							}
						});
						console.log(results);
						console.log('better', maxCoeff, maxStars, maxBattle, maxBattle.battleData.attackers.map(e => e.id));
						return maxBattle;
					});
			}

			if (!bestBattle || !bestBattle.result.win) {
				let msg = I18N('FAILED_FIND_WIN_PACK');
				let msgc = msg;
				if (bestBattle?.battleData) {
					const heroes = bestBattle.battleData.attackers.map(e => e.id).filter(e => e < 61);
					msg += `</br>${I18N('BEST_PACK')}</br>` + heroes.map(
						id => `<img src="https://heroesweb-a.akamaihd.net/vk/v0952/assets/hero_icons/${('000' + id).slice(-4)}.png"/>`
					).join('');
					msgc += I18N('BEST_PACK') + heroes.join(',')
				}

				await popup.confirm(msg);
				this.end(msgc);
				return;
			}

			this.heroesPack = bestBattle.battleData.attackers.map(e => e.id).filter(e => e < 6000);
			this.battleLoop();
		}

		async metaBattleLoop(team) {

			await this.loadInfo();

			let repeat = false;
			do {
				repeat = false;
				const countAutoBattle = +getInput('countAutoBattle');
				for (let i = 1; i <= countAutoBattle; i++) {
					const startBattle = await Send({
						calls: [{
							name: "invasion_bossStart",
							args: {
								// id: 119,
								id: 134,
								heroes: team.heroes,
								favor: team.favor,
								pet: team.pet
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					const calcBattle = await Calc(startBattle);

					setProgress(`${i}) ${calcBattle.result.win ? I18N('VICTORY') : I18N('DEFEAT') } `)
					console.log(i, calcBattle.result.win)
					if (!calcBattle.result.win) {
						continue;
					}

					const endBattle = await Send({
						calls: [{
							name: "invasion_bossEnd",
							args: {
								id: 134,
								result: calcBattle.result,
								progress: calcBattle.progress
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					console.log(endBattle);
					const msg = I18N('BOSS_HAS_BEEN_DEF', { boosLvl: this.battle.typeId });
					await popup.confirm(msg);
					this.end(msg);
					return;
				}

				const msg = I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { boosLvl: this.battle.typeId });
				repeat = await popup.confirm(msg, [
					{ msg: '��', result: true },
					{ msg: '���', result: false },
				]);
				this.end(I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { boosLvl: this.battle.typeId }));

			} while (repeat)
		}

		async twinkMetaBattleLoop(team) {

			await this.loadInfo();

			if(this.battle.typeId >= 220)
			{
				return;
			}

			let repeat = false;
			do {
				repeat = false;
				const countAutoBattle = +getInput('countAutoBattle');
				for (let i = 1; i <= countAutoBattle; i++) {
					const startBattle = await Send({
						calls: [{
							name: "invasion_bossStart",
							args: {
								// id: 119,
								id: 134,
								heroes: team.heroes,
								favor: team.favor,
								pet: team.pet
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					const calcBattle = await Calc(startBattle);

					setProgress(`${i}) ${calcBattle.result.win ? I18N('VICTORY') + " " + this.battle.typeId : I18N('DEFEAT') + " " + this.battle.typeId } `)
					console.log(i, calcBattle.result.win)
					if (!calcBattle.result.win) {
						continue;
					}

					const endBattle = await Send({
						calls: [{
							name: "invasion_bossEnd",
							args: {
								id: 134,
								result: calcBattle.result,
								progress: calcBattle.progress
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					console.log(endBattle);
					const msg = I18N('BOSS_HAS_BEEN_DEF', { boosLvl: this.battle.typeId });
					// await popup.confirm(msg);
					this.end(msg);
					return;
				}

				const msg = I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { boosLvl: this.battle.typeId });
				repeat = await popup.confirm(msg, [
					{ msg: '��', result: true },
					{ msg: '���', result: false },
				]);
				this.end(I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { boosLvl: this.battle.typeId }));

			} while (repeat)
		}


		async battleLoop() {
			let repeat = false;
			do {
				repeat = false;
				const countAutoBattle = +getInput('countAutoBattle');
				for (let i = 1; i <= countAutoBattle; i++) {
					const startBattle = await Send({
						calls: [{
							name: "invasion_bossStart",
							args: {
								id: 119,
								heroes: this.heroesPack,
								favor: { "61": 6001 },
								pet: 6001
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					const calcBattle = await Calc(startBattle);

					setProgress(`${i}) ${calcBattle.result.win ? I18N('VICTORY') : I18N('DEFEAT') } `)
					console.log(i, calcBattle.result.win)
					if (!calcBattle.result.win) {
						continue;
					}

					const endBattle = await Send({
						calls: [{
							name: "invasion_bossEnd",
							args: {
								id: 119,
								result: calcBattle.result,
								progress: calcBattle.progress
							}, ident: "body"
						}]
					}).then(e => e.results[0].result.response);
					console.log(endBattle);
					const msg = I18N('BOSS_HAS_BEEN_DEF', { bossLvl: this.battle.typeId });
					await popup.confirm(msg);
					this.end(msg);
					return;
				}

				const msg = I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { bossLvl: this.battle.typeId });
				repeat = await popup.confirm(msg, [
					{ msg: '��', result: true },
					{ msg: '���', result: false },
				]);
				this.end(I18N('NOT_ENOUGH_ATTEMPTS_BOSS', { bossLvl: this.battle.typeId }));

			} while (repeat)
		}

		calcCoeff(result, packType) {
			let beforeSumFactor = 0;
			const beforePack = result.battleData[packType][0];
			for (let heroId in beforePack) {
				const hero = beforePack[heroId];
				const state = hero.state;
				let factor = 1;
				if (state) {
					const hp = state.hp / state.maxHp;
					factor = hp;
				}
				beforeSumFactor += factor;
			}

			let afterSumFactor = 0;
			const afterPack = result.progress[0][packType].heroes;
			for (let heroId in afterPack) {
				const hero = afterPack[heroId];
				const stateHp = beforePack[heroId]?.state?.hp || beforePack[heroId]?.stats?.hp;
				const hp = hero.hp / stateHp;
				afterSumFactor += hp;
			}
			const resultCoeff = beforeSumFactor / afterSumFactor;
			return resultCoeff;
		}

		async CalcBattle(battle, count) {
			const actions = [];
			for (let i = 0; i < count; i++) {
				battle.seed = Math.floor(Date.now() / 1000) + this.random(0, 1e3);
				actions.push(Calc(battle).then(e => {
					e.coeff = this.calcCoeff(e, 'defenders');
					return e;
				}));
			}

			return Promise.all(actions).then(results => {
				let maxCoeff = -100;
				let maxBattle = null;
				results.forEach(e => {
					if (e.coeff > maxCoeff) {
						maxCoeff = e.coeff;
						maxBattle = e;
					}
				});
				maxBattle.stars = results.reduce((w, s) => w + s.result.stars, 0);
				maxBattle.attempts = results;
				return maxBattle;
			});
		}

		random(min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		}

		end(reason) {
			setProgress('');
			console.log('endEventAutoBoss', reason)
		}
	}

	class executeTwinkPass {

		async galahadPass()
		{
			return true;
			await questAllFarm();
			await questAllFarm();

			await twinkMailGetAll();

			let cycle = true;

			// await this.passGalahadMission(
			// 	{"name":"invasion_bossStart","args":{"id":127,"heroes":[57,55,52,16,2],"pet":6005,"favor":{"2":6001,"16":6004,"52":6006,"55":6005,"57":6003}}}
			// );

			while( cycle )
			{
				const response = await Send(
					{"calls":[{"name":"invasion_bossRaid","args":{"id":127,"count":1},"ident":"body"}]}
				);

				if(response.error && response.error.name === 'NotEnough')
				{
					break;
				}
			}

			cycle = true;

			while( cycle )
			{
				const response = await Send(
					{"calls":[{"name":"shopBuy","args":{"shopId":1046,"slot":9,"cost":{"coin":{"1048":750}},"reward":{"consumable":{"17":1}},"amount":20},"ident":"body"}]}
				);

				if(response.error && response.error.name === 'NotEnough')
				{
					const response = await Send(
						{"calls":[{"name":"shopBuy","args":{"shopId":1046,"slot":9,"cost":{"coin":{"1048":750}},"reward":{"consumable":{"17":1}},"amount":5},"ident":"body"}]}
					);

					if(response.error && response.error.name === 'NotEnough')
					{
						const response = await Send(
							{"calls":[{"name":"shopBuy","args":{"shopId":1046,"slot":9,"cost":{"coin":{"1048":750}},"reward":{"consumable":{"17":1}},"amount":1},"ident":"body"}]}
						);

						if(response.error && response.error.name === 'NotEnough')
						{
							break;
						}
					}
				}
			}
		}

		async twinkPassOneToFifteen() {

			const data = await Send( JSON.stringify( {
				calls: [
					{
						name: "userGetInfo",
						args: {},
						ident: "userGetInfo"
					}
				]
			} ) );

			if(parseInt(data.results[0].result.response.level) >= 30)
			{
				return true;
			}

			checkboxes.repeatMission.cbox.checked = false
            // �������� ������ �2
			await this.passMission({"id":2,"heroes":[2,20],"favor":{}});

			// �������� ���������
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":504},"context":{"actionTs":38565},"ident":"body"}]});
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":17},"context":{"actionTs":55763},"ident":"body"}]});

			// �������� ������ �3
			await this.passMission({"id":3,"heroes":[2,20],"favor":{}});

			// ����� ���
			await Send({"calls":[{"name":"gacha_open","args":{"ident":"heroGacha","free":true,"pack":false},"ident":"body"}]});

			// �������� ���������
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":30},"context":{"actionTs":285649},"ident":"body"}]});

			// �������� ������ �4
			await this.passMission({"id":4,"heroes":[2,7,20],"favor":{}});

			// �������� ���������
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":32},"context":{"actionTs":411725},"ident":"body"}]});

			// �������� ������ �5
			await this.passMission({"id":5,"heroes":[2,7,20],"favor":{}});

			// �������� ���������
			await Send({"calls":[{"name": "tutorialSaveProgress", "args": {"taskId": 41}, "context": {"actionTs": 501529},"ident": "body"}]});

			// ������� ���
			await Send({"calls":[{"name":"heroInsertItem","args":{"heroId":7,"slot":0},"context":{"actionTs":644783},"ident":"group_0_body"},{"name":"heroInsertItem","args":{"heroId":7,"slot":1},"ident":"group_1_body"},{"name":"heroInsertItem","args":{"heroId":7,"slot":2},"ident":"group_2_body"},{"name":"heroInsertItem","args":{"heroId":7,"slot":3},"ident":"group_3_body"},{"name":"heroInsertItem","args":{"heroId":7,"slot":4},"ident":"group_4_body"}]});
			await Send({"calls":[{"name":"heroInsertItem","args":{"heroId":7,"slot":5},"context":{"actionTs":645796},"ident":"group_0_body"},{"name":"tutorialSaveProgress","args":{"taskId":47},"ident":"group_1_body"}]});

			// �������� ���� ���
			await Send({"calls":[{"name":"heroPromote","args":{"heroId":7},"context":{"actionTs":705102},"ident":"body"}]});

			// �������� ���������
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":49},"context":{"actionTs":705295},"ident":"body"}]});

			// ����������� ����� ���
			await Send({"calls":[{"name":"heroUpgradeSkill","args":{"heroId":7,"skill":1},"context":{"actionTs":768412},"ident":"body"}]});

			// �������� ���������
			await Send({"calls":[{"name":"tutorialSaveProgress","args":{"taskId":50},"context":{"actionTs":768554},"ident":"body"},{"name":"tutorialSaveProgress","args":{"taskId":51},"context":{"actionTs":768554},"ident":"tutorialSaveProgress1"}]});

			await twinkMailGetAll();

			// 6 ��� �������� ������
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});
			await this.passMission({"id":6,"heroes":[2,7,20],"favor":{}});

			// �������� ������ �5
			await this.passMission({"id":5,"heroes":[2,7,20],"favor":{}});


			await Sleep(1000);

			await questAllFarm();

			await Send({"calls":[{"name":"consumableUseStamina","args":{"libId":17,"amount":2},"ident":"body"}]})

			// 1 ������� ��������� �������
			// 2 ������� 30 �������

			let farm = true;

			while( farm )
			{
				await questAllFarm();

				const data = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(data.results[0].result.response.level) >= 30)
				{
					break;
				}

				var energy = data.results[0].result.response.refillable[0].amount;

				if( energy <= 11 )
				{
					break;
				}

				for(var i = 1; i < 20; i++)
				{
					await this.passMission( {"id": 6, "heroes": [2, 7, 20], "favor": {}} ).then( null, () => {
						farm = false;
					} );
				}
			}
            await this.passMission({"id":2,"heroes":[2,20],"favor":{}});

			checkboxes.repeatMission.cbox.checked = true;
		}

		async twinkPassFifteenToThirty() {

			const userResponse = await Send( JSON.stringify( {
				calls: [
					{
						name: "userGetInfo",
						args: {},
						ident: "userGetInfo"
					}
				]
			} ) );

			if(parseInt(userResponse.results[0].result.response.level) < 15 || parseInt(userResponse.results[0].result.response.level) >= 30)
			{
				return;
			}

			var energy = userResponse.results[0].result.response.refillable[0].amount;

			if(energy <= 11)
			{
				return;
			}

			checkboxes.repeatMission.cbox.checked = false

			for(var i = 6; i < 59; i++){

				if( energy <= 11 )
				{
					break;
				}

				try
				{
					energy -= 6;

					await this.passMission({"id":i,"heroes":[2,7,20],"favor":{}});
				}
				catch( e )
				{

				}
			}

			await questAllFarm();
			await questAllFarm();
			await questAllFarm();

			await Send({"calls":[{"name":"heroEvolve","args":{"heroId":7},"ident":"body"}]});
			await Send({"calls":[{"name":"heroCraft","args":{"heroId":4},"ident":"body"}]});

			// ����� ������
			await Send({"calls":[{"name":"gacha_open","args":{"ident":"heroGacha","free":true,"pack":false},"ident":"body"}]});

			const expHero = this.getExpHero();

			await Send( JSON.stringify({calls: [{
					name: "consumableUseHeroXp",
					args: {
						heroId: 6,
						libId: expHero.libId,
						amount: 1
					},
					ident: "consumableUseHeroXp"
				}]}) )


			const heroesResponse = await Send( JSON.stringify( {
				calls: [
					{
						name: "heroGetAll",
						args: {},
						ident: "body"
					}
				]
			} ) );

			let heroes = Object.entries(heroesResponse.results[0].result.response).map(([key, val]) => val);

			let sortedHeroes = heroes.sort(
				(p1, p2) => (p1.power < p2.power) ? 1 : (p1.power > p2.power) ? -1 : 0);

			let team = [];

			for( const hero of sortedHeroes )
			{
				if(team.length === 5)
				{
					break;
				}

				if(team.length < 5 && !team.includes(hero.id))
				{
					team.push(hero.id);
				}
			}

			while( true )
			{
				let userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.level) >= 30)
				{
					break;
				}

				await questAllFarm();

				await this.equipHeroes();

				const data = await Send(JSON.stringify({
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				}));

				energy = data.results[0].result.response.refillable[0].amount;

				if( energy <= 21 )
				{
					break;
				}

				for(var i = 1; i < 59; i++){

					if( energy <= 21 )
					{
						break;
					}

					try
					{
						energy -= 6;

						await this.passMission({"id":i,"heroes":team,"favor":{}});
					}
					catch( e )
					{

					}
				}

				userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.level) >= 30)
				{
					break;
				}

				for(var i = 1; i < 59; i++){

					if( energy <= 21 )
					{
						break;
					}

					try
					{
						energy -= 6;

						await this.passMission({"id":i,"heroes":team,"favor":{}});
					}
					catch( e )
					{

					}
				}

				userResponse = await Send( JSON.stringify( {
					calls: [
						{
							name: "userGetInfo",
							args: {},
							ident: "userGetInfo"
						}
					]
				} ) );

				if(parseInt(userResponse.results[0].result.response.level) >= 30)
				{
					break;
				}

				for(var i = 6; i < 59; i++){

					if( energy <= 21 )
					{
						break;
					}

					try
					{
						energy -= 6;

						await this.passMission({"id":i,"heroes":team,"favor":{}});
					}
					catch( e )
					{

					}
				}
			}

			checkboxes.repeatMission.cbox.checked = true;
		}

		async twinkPassThirtyPlus()
		{
			const userResponse = await Send( JSON.stringify( {
				calls: [
					{
						name: "userGetInfo",
						args: {},
						ident: "userGetInfo"
					}
				]
			} ) );

			if(parseInt(userResponse.results[0].result.response.level) < 30)
			{
				return;
			}

			checkboxes.repeatMission.cbox.checked = false

			await questAllFarm();
			await questAllFarm();
			await questAllFarm();

			await Send({"calls":[{"name":"heroEvolve","args":{"heroId":7},"ident":"body"}]});
			await Send({"calls":[{"name":"heroCraft","args":{"heroId":4},"ident":"body"}]});

			const expHero = this.getExpHero();

			await Send( JSON.stringify({calls: [{
					name: "consumableUseHeroXp",
					args: {
						heroId: 6,
						libId: expHero.libId,
						amount: 1
					},
					ident: "consumableUseHeroXp"
				}]}) )


			const heroesResponse = await Send( JSON.stringify( {
				calls: [
					{
						name: "heroGetAll",
						args: {},
						ident: "heroGetAll"
					}
				]
			} ) );

			let heroes = Object.entries(heroesResponse.results[0].result.response).map(([key, val]) => val);

			let sortedHeroes = heroes.sort(
				(p1, p2) => (p1.power < p2.power) ? 1 : (p1.power > p2.power) ? -1 : 0);

			let team = [];

			for( const hero of sortedHeroes )
			{
				if(team.length === 5)
				{
					break;
				}

				if(team.length < 5 && !team.includes(hero.id))
				{
					team.push(hero.id);
				}
			}

			parentLoop:
				while( true )
				{
					await questAllFarm();

					await this.equipHeroes();

					let data = await Send(JSON.stringify({
						calls: [
							{
								name: "userGetInfo",
								args: {},
								ident: "userGetInfo"
							}
						]
					}));

					let energy = data.results[0].result.response.refillable[0].amount;

					if( energy <= 24 )
					{
						break;
					}

					let canLoop = true;

					for(var i = 1; i < 110; i++){

						if(!canLoop)
						{
							break;
						}

						if( energy <= 24 )
						{
							break parentLoop;
						}

						try
						{
							energy -= 6;

							//todo  need fix for future id - i
							await this.passMission({"id":2,"heroes":team,"favor":{}}).then(null, (error) => {
								if(error && error.name === 'NotAvailable')
								{
									canLoop = false;
								}
							});
						}
						catch( e )
						{

						}
					}

					data = await Send(JSON.stringify({
						calls: [
							{
								name: "userGetInfo",
								args: {},
								ident: "userGetInfo"
							}
						]
					}));

					energy = data.results[0].result.response.refillable[0].amount;

					canLoop = true;

					for(var i = 1; i < 110; i++){

						if(!canLoop)
						{
							break;
						}


						if( energy <= 24 )
						{
							break parentLoop;
						}

						try
						{
							//todo  need fix for future id - i
							await this.passMission({"id":2,"heroes":team,"favor":{}}).then(null, (error) => {
								if(error && error.name === 'NotAvailable')
								{
									canLoop = false;
								}
							});
						}
						catch( e )
						{

						}
					}

					data = await Send(JSON.stringify({
						calls: [
							{
								name: "userGetInfo",
								args: {},
								ident: "userGetInfo"
							}
						]
					}));

					energy = data.results[0].result.response.refillable[0].amount;

					canLoop = true;

					for(var i = 1; i < 110; i++){

						if(!canLoop)
						{
							break;
						}

						if( energy <= 24 )
						{
							break parentLoop;
						}

						try
						{
							//todo need fix for future id - i
							await this.passMission({"id":2,"heroes":team,"favor":{}}).then(null, (error) => {
								if(error && error.name === 'NotAvailable')
								{
									canLoop = false;
								}
							});
						}
						catch( e )
						{

						}
					}
				}

			checkboxes.repeatMission.cbox.checked = true;
		}

		getExpHero() {
			const heroes = Object.values(questsInfo['heroGetAll']);
			const inventory = questsInfo['inventoryGet'];
			const expHero = { heroId: 0, exp: 3625195, libId: 0 };
			/** ����� ����� (consumable 9, 10, 11, 12) */
			for (let i = 9; i <= 12; i++) {
				if (inventory.consumable[i]) {
					expHero.libId = i;
					break;
				}
			}

			for (const hero of heroes) {
				const exp = hero.xp;
				if (exp < expHero.exp) {
					expHero.heroId = hero.id;
				}
			}
			return expHero;
		}

		async equipHeroes()
		{
			const response = await Send({"calls":[{"name":"heroGetAll","args":{},"ident":"body"}]});

			const heroes = response.results[0].result.response;

			if(heroes[4] && heroes[4].color >= 2
				&& heroes[20] && heroes[20].color >= 2
				&& heroes[2] && heroes[2].color >= 2
				&& heroes[6] && heroes[6].color >= 2
				&& heroes[7] && heroes[7].color >= 2
			){
				return;
			}


			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":6,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":6,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":18,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":18,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":36,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":44,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":20,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":20,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":38,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":38,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":43,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":36,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":19,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":40,"amount":1},"ident":"body"}]});
			await Send({"calls":[{"name":"inventoryCraftRecipe","args":{"type":"gear","libId":45,"amount":1},"ident":"body"}]});



		}

		async passMission(args) {

			return new Promise((resolve, reject) => {

				let missionStartCall = {
					"calls": [{
						"name": "missionStart",
						"args": args,
						"ident": "body"
					}]
				}
				/**
				 * Mission Request
				 *
				 * ������ �� ���������� �����
				 */
				SendRequest(JSON.stringify(missionStartCall), async e => {
					if (e['error']) {

						if(e['error']['name'] === 'NotEnough')
						{
							setProgress(`������ � ${args.id} ��������`, true);
							resolve();
						}

						console.log(e['error']);
						reject(e['error']);
						return;
					}
					/**
					 * Mission data calculation
					 *
					 * ������ ������ �����
					 */
					BattleCalc(e.results[0].result.response, 'get_tower', async r => {

						let missionEndCall = {
							"calls": [{
								"name": "missionEnd",
								"args": {
									"id": args.id,
									"result": r.result,
									"progress": r.progress
								},
								"ident": "body"
							}]
						}
						/**
						 * Mission Completion Request
						 *
						 * ������ �� ���������� ������
						 */
						SendRequest(JSON.stringify(missionEndCall), async (e) => {
							if (e['error']) {
								console.log(e['error']);
								reject(e['error']);
								return;
							}
							r = e.results[0].result.response;
							if (r['error']) {
								console.log(r['error']);
								reject(r['error']);
								return;
							}

							setProgress(`������ � ${args.id} ��������`, true);
							resolve();
						});
					})
				});
			});
		}

		async passGalahadMission(args) {

			return new Promise((resolve, reject) => {

				let missionStartCall = {
					"calls": [{
						"name": args.name,
						"args": args.args,
						"ident": "body"
					}]
				}
				/**
				 * Mission Request
				 *
				 * ������ �� ���������� �����
				 */
				SendRequest(JSON.stringify(missionStartCall), async e => {
					if (e['error']) {

						if(e['error']['name'] === 'NotEnough')
						{
							setProgress(`������ � ${args.args.id} ��������`, true);
							resolve();
						}

						console.log(e['error']);
						reject(e['error']);
						return;
					}
					/**
					 * Mission data calculation
					 *
					 * ������ ������ �����
					 */
					BattleCalc(e.results[0].result.response, 'get_tower', async r => {

						let missionEndCall = {
							"calls": [{
								"name": "invasion_bossEnd",
								"args": {
									"id": args.args.id,
									"result": r.result,
									"progress": r.progress
								},
								"ident": "body"
							}]
						}
						/**
						 * Mission Completion Request
						 *
						 * ������ �� ���������� ������
						 */
						SendRequest(JSON.stringify(missionEndCall), async (e) => {
							if (e['error']) {
								console.log(e['error']);
								reject(e['error']);
								return;
							}
							r = e.results[0].result.response;
							if (r['error']) {
								console.log(r['error']);
								reject(r['error']);
								return;
							}

							setProgress(`������ � ${args.args.id} ��������`, true);
							resolve();
						});
					})
				});
			});
		}
	}

	/**
	 * Twink Collect all mail, except letters with charges of the portal
	 *
	 * ������� ��� �����, ����� ����� � �������� �������
	 */
	function twinkMailGetAll() {
		const getMailInfo = '{"calls":[{"name":"mailGetAll","args":{},"ident":"body"}]}';

		return Send(getMailInfo).then(dataMail => {
			const letters = dataMail.results[0].result.response.letters;
			const letterIds = twinkLettersFilter(letters);
			if (!letterIds.length) {
				setProgress(I18N('NOTHING_TO_COLLECT'), true);
				return;
			}

			const calls = [
				{ name: "mailFarm", args: { letterIds }, ident: "body" }
			];

			return Send(JSON.stringify({ calls })).then(res => {
				const lettersIds = res.results[0].result.response;
				if (lettersIds) {
					const countLetters = Object.keys(lettersIds).length;
					setProgress(`${I18N('RECEIVED')} ${countLetters} ${I18N('LETTERS')}`, true);
				}
			});
		});
	}

	/**
	 * Twink Filters received emails
	 *
	 * ��������� ���������� ������
	 */
	function twinkLettersFilter(letters) {
		const lettersIds = [];
		for (let l in letters) {
			letter = letters[l];
			const reward = letter.reward;
			/**
			 * Mail Collection Exceptions
			 *
			 * ���������� �� ���� �����
			 */
			const isFarmLetter = !(
				/** VIP Points // ��� ���� */
				(reward?.vipPoints ? reward.vipPoints : false)
			);
			if (isFarmLetter) {
				lettersIds.push(~~letter.id);
			}
		}
		return lettersIds;
	}


	// �������� ������ �������
	function DungeonFull() {
		return new Promise((resolve, reject) => {
			const dung = new executeDungeon2(resolve, reject);
			const titanit = getInput('countTitanit');
			dung.start(titanit);
		});
	}
	/** ����������� ���������� */
	function executeDungeon2(resolve, reject) {
		let dungeonActivity = 0;
		let startDungeonActivity = 0;
		let maxDungeonActivity = 150;
		let limitDungeonActivity = 30180;
		let countShowStats = 1;
		//let fastMode = isChecked('fastMode');
		let end = false;

		let countTeam = [];
		let timeDungeon = {
			all: new Date().getTime(),
			findAttack: 0,
			attackNeutral: 0,
			attackEarthOrFire: 0
		}

		let titansStates = {};
		let bestBattle = {};

		let teams = {
			neutral: [],
			water: [],
			earth: [],
			fire: [],
			hero: []
		}

		let callsExecuteDungeon = {
			calls: [{
				name: "dungeonGetInfo",
				args: {},
				ident: "dungeonGetInfo"
			}, {
				name: "teamGetAll",
				args: {},
				ident: "teamGetAll"
			}, {
				name: "teamGetFavor",
				args: {},
				ident: "teamGetFavor"
			}, {
				name: "clanGetInfo",
				args: {},
				ident: "clanGetInfo"
			}]
		}

		this.start = async function(titanit) {
			//maxDungeonActivity = titanit > limitDungeonActivity ? limitDungeonActivity : titanit;
			maxDungeonActivity = titanit || getInput('countTitanit');
			send(JSON.stringify(callsExecuteDungeon), startDungeon);
		}

		/** �������� ������ �� ���������� */
		function startDungeon(e) {
			stopDung = false; // ���� ��������
			let res = e.results;
			let dungeonGetInfo = res[0].result.response;
			if (!dungeonGetInfo) {
				endDungeon('noDungeon', res);
				return;
			}
			console.log("�������� ������ �� ����: ", new Date());
			let teamGetAll = res[1].result.response;
			let teamGetFavor = res[2].result.response;
			dungeonActivity = res[3].result.response.stat.todayDungeonActivity;
			startDungeonActivity = res[3].result.response.stat.todayDungeonActivity;
			titansStates = dungeonGetInfo.states.titans;

			teams.hero = {
				favor: teamGetFavor.dungeon_hero,
				heroes: teamGetAll.dungeon_hero.filter(id => id < 6000),
				teamNum: 0,
			}
			let heroPet = teamGetAll.dungeon_hero.filter(id => id >= 6000).pop();
			if (heroPet) {
				teams.hero.pet = heroPet;
			}
			teams.neutral = getTitanTeam('neutral');
			teams.water = {
				favor: {},
				heroes: getTitanTeam('water'),
				teamNum: 0,
			};
			teams.earth = {
				favor: {},
				heroes: getTitanTeam('earth'),
				teamNum: 0,
			};
			teams.fire = {
				favor: {},
				heroes: getTitanTeam('fire'),
				teamNum: 0,
			};

			checkFloor(dungeonGetInfo);
		}

		function getTitanTeam(type) {
			switch (type) {
				case 'neutral':
					return [4023, 4022, 4012, 4021, 4011, 4010, 4020];
				case 'water':
					return [4000, 4001, 4002, 4003]
						.filter(e => !titansStates[e]?.isDead);
				case 'earth':
					return [4020, 4022, 4021, 4023]
						.filter(e => !titansStates[e]?.isDead);
				case 'fire':
					return [4010, 4011, 4012, 4013]
						.filter(e => !titansStates[e]?.isDead);
			}
		}

		/** ������� ����� ������� */
		function clone(a) {
			return JSON.parse(JSON.stringify(a));
		}

		/** ������� ������ �� ����� */
		function findElement(floor, element) {
			for (let i in floor) {
				if (floor[i].attackerType === element) {
					return i;
				}
			}
			return undefined;
		}

		/** ��������� ���� */
		async function checkFloor(dungeonInfo) {
			if (!('floor' in dungeonInfo) || dungeonInfo.floor?.state == 2) {
				saveProgress();
				return;
			}
			// console.log(dungeonInfo, dungeonActivity);
			setProgress(`${I18N('DUNGEON2')}: ${I18N('TITANIT')} ${dungeonActivity}/${maxDungeonActivity}`);
			//setProgress('Dungeon: ������� ' + dungeonActivity + '/' + maxDungeonActivity);
			if (dungeonActivity >= maxDungeonActivity) {
				endDungeon('���� ��������,', '������� ��������: ' + dungeonActivity + '/' + maxDungeonActivity);
				return;
			}
			let activity = dungeonActivity - startDungeonActivity;
			titansStates = dungeonInfo.states.titans;
			if (stopDung){
				endDungeon('���� ��������,', '������� ��������: ' + dungeonActivity + '/' + maxDungeonActivity);
				return;
			}
			/*if (activity / 1000 > countShowStats) {
				countShowStats++;
				showStats();
			}*/
			bestBattle = {};
			let floorChoices = dungeonInfo.floor.userData;
			if (floorChoices.length > 1) {
				for (let element in teams) {
					let teamNum = findElement(floorChoices, element);
					if (!!teamNum) {
						if (element == 'earth') {
							teamNum = await chooseEarthOrFire(floorChoices);
							if (teamNum < 0) {
								endDungeon('���������� �������� ��� ������ ������!', dungeonInfo);
								return;
							}
						}
						chooseElement(floorChoices[teamNum].attackerType, teamNum);
						return;
					}
				}
			} else {
				chooseElement(floorChoices[0].attackerType, 0);
			}
		}

		/** �������� ����� ��� ������ ��������� */
		async function chooseEarthOrFire(floorChoices) {
			bestBattle.recovery = -11;
			let selectedTeamNum = -1;
			for (let attempt = 0; selectedTeamNum < 0 && attempt < 4; attempt++) {
				for (let teamNum in floorChoices) {
					let attackerType = floorChoices[teamNum].attackerType;
					selectedTeamNum = await attemptAttackEarthOrFire(teamNum, attackerType, attempt);
				}
			}
			console.log("����� ������� ���� ��� �����: ", selectedTeamNum < 0 ? "�� ������" : floorChoices[selectedTeamNum].attackerType);
			return selectedTeamNum;
		}

		/** ������� ����� ������ � ����� */
		async function attemptAttackEarthOrFire(teamNum, attackerType, attempt) {
			let start = new Date();
			let team = clone(teams[attackerType]);
			let startIndex = team.heroes.length + attempt - 4;
			if (startIndex >= 0) {
				team.heroes = team.heroes.slice(startIndex);
				let recovery = await getBestRecovery(teamNum, attackerType, team, 25);
				if (recovery > bestBattle.recovery) {
					bestBattle.recovery = recovery;
					bestBattle.selectedTeamNum = teamNum;
					bestBattle.team = team;
				}
			}
			let workTime = new Date().getTime() - start.getTime();
			timeDungeon.attackEarthOrFire += workTime;
			if (bestBattle.recovery < -10) {
				return -1;
			}
			return bestBattle.selectedTeamNum;
		}

		/** �������� ������ ��� ����� */
		async function chooseElement(attackerType, teamNum) {
			let result;
			switch (attackerType) {
				case 'hero':
				case 'water':
					result = await startBattle(teamNum, attackerType, teams[attackerType]);
					break;
				case 'earth':
				case 'fire':
					result = await attackEarthOrFire(teamNum, attackerType);
					break;
				case 'neutral':
					result = await attackNeutral(teamNum, attackerType);
			}
			if (!!result && attackerType != 'hero') {
				let recovery = (!!!bestBattle.recovery ? 10 * getRecovery(result) : bestBattle.recovery) * 100;
				let titans = result.progress[0].attackers.heroes;
				console.log("�������� ���: " + attackerType +
					", recovery = " + (recovery > 0 ? "+" : "") + Math.round(recovery) + "% \r\n", titans);
			}
			endBattle(result);
		}

		/** ������� ������ ��� ����� */
		async function attackEarthOrFire(teamNum, attackerType) {
			if (!!!bestBattle.recovery) {
				bestBattle.recovery = -11;
				let selectedTeamNum = -1;
				for (let attempt = 0; selectedTeamNum < 0 && attempt < 4; attempt++) {
					selectedTeamNum = await attemptAttackEarthOrFire(teamNum, attackerType, attempt);
				}
				if (selectedTeamNum < 0) {
					endDungeon('���������� �������� ��� ������ ������!', attackerType);
					return;
				}
			}
			return findAttack(teamNum, attackerType, bestBattle.team);
		}

		/** ������� ���������� ��������� ��� ����� */
		async function findAttack(teamNum, attackerType, team) {
			let start = new Date();
			let recovery = -1000;
			let iterations = 0;
			let result;
			let correction = 0.01;
			for (let needRecovery = bestBattle.recovery; recovery < needRecovery; needRecovery -= correction, iterations++) {
				result = await startBattle(teamNum, attackerType, team);
				recovery = getRecovery(result);
			}
			bestBattle.recovery = recovery;
			let workTime = new Date().getTime() - start.getTime();
			timeDungeon.findAttack += workTime;
			return result;
		}

		/** ������� ����������� �������� */
		async function attackNeutral(teamNum, attackerType) {
			let start = new Date();
			let factors = calcFactor();
			bestBattle.recovery = -0.2;
			await findBestBattleNeutral(teamNum, attackerType, factors, true)
			if (bestBattle.recovery < 0 || (bestBattle.recovery < 0.2 && factors[0].value < 0.5)) {
				let recovery = 100 * bestBattle.recovery;
				console.log("�� ������� ����� ������� ��� � ������� ������: " + attackerType +
					", recovery = " + (recovery > 0 ? "+" : "") + Math.round(recovery) + "% \r\n", bestBattle.attackers);
				await findBestBattleNeutral(teamNum, attackerType, factors, false)
			}
			let workTime = new Date().getTime() - start.getTime();
			timeDungeon.attackNeutral += workTime;
			if (!!bestBattle.attackers) {
				let team = getTeam(bestBattle.attackers);
				return findAttack(teamNum, attackerType, team);
			}
			endDungeon('�� ������� ����� ������� ���!', attackerType);
			return undefined;
		}

		/** ������� ������ ����������� ������� */
		async function findBestBattleNeutral(teamNum, attackerType, factors, mode) {
			let countFactors = factors.length < 4 ? factors.length : 4;
			let aradgi = !titansStates['4013']?.isDead;
			let edem = !titansStates['4023']?.isDead;
			let dark = [4032, 4033].filter(e => !titansStates[e]?.isDead);
			let light = [4042].filter(e => !titansStates[e]?.isDead);
			let actions = [];
			if (mode) {
				for (let i = 0; i < countFactors; i++) {
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(factors[i].id)));
				}
				if (countFactors > 1) {
					let firstId = factors[0].id;
					let secondId = factors[1].id;
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4003, secondId)));
				}
				if (aradgi) {
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4013)));
					if (countFactors > 0) {
						let firstId = factors[0].id;
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4000, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4003, 4013)));
					}
					if (edem) {
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4023, 4000, 4013)));
					}
				}
			} else {
				if (mode) {
					for (let i = 0; i < factors.length; i++) {
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(factors[i].id)));
					}
				} else {
					countFactors = factors.length < 2 ? factors.length : 2;
				}
				for (let i = 0; i < countFactors; i++) {
					let mainId = factors[i].id;
					if (aradgi && (mode || i > 0)) {
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4000, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, 4013)));
					}
					for (let i = 0; i < dark.length; i++) {
						let darkId = dark[i];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, darkId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, darkId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, darkId)));
					}
					for (let i = 0; i < light.length; i++) {
						let lightId = light[i];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, lightId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, lightId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, lightId)));
					}
					let isFull = mode || i > 0;
					for (let j = isFull ? i + 1 : 2; j < factors.length; j++) {
						let extraId = factors[j].id;
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4000, extraId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, extraId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, extraId)));
					}
				}
				if (aradgi) {
					if (mode) {
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4013)));
					}
					for (let i = 0; i < dark.length; i++) {
						let darkId = dark[i];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(darkId, 4001, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(darkId, 4002, 4013)));
					}
					for (let i = 0; i < light.length; i++) {
						let lightId = light[i];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(lightId, 4001, 4013)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(lightId, 4002, 4013)));
					}
				}
				for (let i = 0; i < dark.length; i++) {
					let firstId = dark[i];
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId)));
					for (let j = i + 1; j < dark.length; j++) {
						let secondId = dark[j];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
					}
				}
				for (let i = 0; i < light.length; i++) {
					let firstId = light[i];
					actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId)));
					for (let j = i + 1; j < light.length; j++) {
						let secondId = light[j];
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
						actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
					}
				}
			}
			for (let result of await Promise.all(actions)) {
				let recovery = getRecovery(result);
				if (recovery > bestBattle.recovery) {
					bestBattle.recovery = recovery;
					bestBattle.attackers = result.progress[0].attackers.heroes;
				}
			}
		}

		/** �������� ����������� ������� */
		function getNeutralTeam(id, swapId, addId) {
			let neutralTeam = clone(teams.water);
			let neutral = neutralTeam.heroes;
			if (neutral.length == 4) {
				if (!!swapId) {
					for (let i in neutral) {
						if (neutral[i] == swapId) {
							neutral[i] = addId;
						}
					}
				}
			} else if (!!addId) {
				neutral.push(addId);
			}
			neutral.push(id);
			return neutralTeam;
		}

		/** �������� ������� ������� */
		function getTeam(titans) {
			return {
				favor: {},
				heroes: Object.keys(titans).map(id => parseInt(id)),
				teamNum: 0,
			};
		}

		/** ��������� ������ ������������� ������� */
		function calcFactor() {
			let neutral = teams.neutral;
			let factors = [];
			for (let i in neutral) {
				let titanId = neutral[i];
				let titan = titansStates[titanId];
				let factor = !!titan ? titan.hp / titan.maxHp + titan.energy / 10000.0 : 1;
				if (factor > 0) {
					factors.push({id: titanId, value: factor});
				}
			}
			factors.sort(function(a, b) {
				return a.value - b.value;
			});
			return factors;
		}

		/** ���������� ��������� ��������� �� ���������� ���� */
		async function getBestRecovery(teamNum, attackerType, team, countBattle) {
			let bestRecovery = -1000;
			let actions = [];
			for (let i = 0; i < countBattle; i++) {
				actions.push(startBattle(teamNum, attackerType, team));
			}
			for (let result of await Promise.all(actions)) {
				let recovery = getRecovery(result);
				if (recovery > bestRecovery) {
					bestRecovery = recovery;
				}
			}
			return bestRecovery;
		}

		/** ���������� ������� � �������� ��������� ������� ����� � �� ����� � ��������� �������� ������� �� ����������� �������*/
		function getRecovery(result) {
			if (result.result.stars < 3) {
				return -100;
			}
			let beforeSumFactor = 0;
			let afterSumFactor = 0;
			let beforeTitans = result.battleData.attackers;
			let afterTitans = result.progress[0].attackers.heroes;
			for (let i in afterTitans) {
				let titan = afterTitans[i];
				let percentHP = titan.hp / beforeTitans[i].hp;
				let energy = titan.energy;
				let factor = checkTitan(i, energy, percentHP) ? getFactor(i, energy, percentHP) : -100;
				afterSumFactor += factor;
			}
			for (let i in beforeTitans) {
				let titan = beforeTitans[i];
				let state = titan.state;
				beforeSumFactor += !!state ? getFactor(i, state.energy, state.hp / titan.hp) : 1;
			}
			return afterSumFactor - beforeSumFactor;
		}

		/** ���������� ��������� ������*/
		function getFactor(id, energy, percentHP) {
			let elemantId = id.slice(2, 3);
			let isEarthOrFire = elemantId == '1' || elemantId == '2';
			let energyBonus = id == '4020' && energy == 1000 ? 0.1 : energy / 20000.0;
			let factor = percentHP + energyBonus;
			return isEarthOrFire ? factor : factor / 10;
		}

		/** ��������� ��������� ������*/
		function checkTitan(id, energy, percentHP) {
			switch (id) {
				case '4020':
					return percentHP > 0.25 || (energy == 1000 && percentHP > 0.05);
					break;
				case '4010':
					return percentHP + energy / 2000.0 > 0.63;
					break;
				case '4000':
					return percentHP > 0.62 || (energy < 1000 && (
						(percentHP > 0.45 && energy >= 400) ||
						(percentHP > 0.3 && energy >= 670)));
			}
			return true;
		}


		/** �������� ��� */
		function startBattle(teamNum, attackerType, args) {
			return new Promise(function (resolve, reject) {
				args.teamNum = teamNum;
				let startBattleCall = {
					calls: [{
						name: "dungeonStartBattle",
						args,
						ident: "body"
					}]
				}
				send(JSON.stringify(startBattleCall), resultBattle, {
					resolve,
					teamNum,
					attackerType
				});
			});
		}

		/** ��������� ��������� ��� � ������ */
		/*function resultBattle(resultBattles, args) {
            if (!!resultBattles && !!resultBattles.results) {
                let battleData = resultBattles.results[0].result.response;
                let battleType = "get_tower";
                if (battleData.type == "dungeon_titan") {
                    battleType = "get_titan";
                }
				battleData.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];//���� �������� ������
                BattleCalc(battleData, battleType, function (result) {
                    result.teamNum = args.teamNum;
                    result.attackerType = args.attackerType;
                    args.resolve(result);
                });
            } else {
                endDungeon('�������� ����� � �������� ����!', 'break');
            }
        }*/
		function resultBattle(resultBattles, args) {
			battleData = resultBattles.results[0].result.response;
			battleType = "get_tower";
			if (battleData.type == "dungeon_titan") {
				battleType = "get_titan";
			}
			battleData.progress = [{ attackers: { input: ["auto", 0, 0, "auto", 0, 0] } }];
			BattleCalc(battleData, battleType, function (result) {
				result.teamNum = args.teamNum;
				result.attackerType = args.attackerType;
				args.resolve(result);
			});
		}

		/** ����������� ��� */
		async function endBattle(battleInfo) {
			if (!!battleInfo) {
				if (battleInfo.result.stars < 3) {
					endDungeon('����� ��� ����� ��� ��������� � ���!', battleInfo);
					return;
				}
				const timer = getTimer(battleInfo.battleTime);
				//const timer = Math.max(battleInfo.battleTime / timerDiv + 1.5, 3);
				console.log(timer);
				await countdownTimer(timer, `${I18N('DUNGEON2')}: ${I18N('TITANIT')} ${dungeonActivity}/${maxDungeonActivity}`);
				//await countdownTimer(timerMS / 1e3, `${I18N('DUNGEON2')}: ${I18N('TITANIT')} ${dungeonActivity}/${maxDungeonActivity}`);
				let endBattleCall = {
					calls: [{
						name: "dungeonEndBattle",
						args: {
							result: battleInfo.result,
							progress: battleInfo.progress,
						},
						ident: "body"
					}]
				}
				send(JSON.stringify(endBattleCall), resultEndBattle);
				let team = getTeam(battleInfo.battleData.attackers).heroes;
				addTeam(team);
			}
		}

		/** �������� � ������������ ���������� ��� */
		function resultEndBattle(e) {
			if (!!e && !!e.results) {
				let battleResult = e.results[0].result.response;
				if ('error' in battleResult) {
					endDungeon('errorBattleResult', battleResult);
					return;
				}
				let dungeonGetInfo = battleResult.dungeon ?? battleResult;
				dungeonActivity += battleResult.reward.dungeonActivity ?? 0;
				checkFloor(dungeonGetInfo);
			} else {
				endDungeon('�������� ����� � �������� ����!', 'break');
			}
		}

		/** �������� ������� ������� � ����� ������ ������ */
		function addTeam(team) {
			for (let i in countTeam) {
				if (equalsTeam(countTeam[i].team, team)) {
					countTeam[i].count++;
					return;
				}
			}
			countTeam.push({team: team, count: 1});
		}

		/** �������� ������� �� ��������� */
		function equalsTeam(team1, team2) {
			if (team1.length == team2.length) {
				for (let i in team1) {
					if (team1[i] != team2[i]) {
						return false;
					}
				}
				return true;
			}
			return false;
		}

		function saveProgress() {
			let saveProgressCall = {
				calls: [{
					name: "dungeonSaveProgress",
					args: {},
					ident: "body"
				}]
			}
			send(JSON.stringify(saveProgressCall), resultEndBattle);
		}


		/** ������� ���������� ����������� ���������� */
		function showStats() {
			let activity = dungeonActivity - startDungeonActivity;
			let workTime = clone(timeDungeon);
			workTime.all = new Date().getTime() - workTime.all;

			for (let i in workTime) {
				workTime[i] = Math.round(workTime[i] / 1000);
			}
			countTeam.sort(function(a, b) {
				return b.count - a.count;
			});
			console.log(titansStates);
			console.log("������� ��������: ", activity);
			console.log("�������� �����: " + Math.round(3600 * activity / workTime.all) + " ��������/���");
			console.log("����� ��������: ");
			for (let i in workTime) {
				let timeNow = workTime[i];
				console.log(i + ": ", Math.round(timeNow / 3600) + " �. " + Math.round(timeNow % 3600 / 60) + " ���. " + timeNow % 60 + " ���.");
			}
			console.log("������� ������������� ������: ");
			for (let i in countTeam) {
				let teams = countTeam[i];
				console.log(teams.team + ": ", teams.count);
			}
		}

		/** ����������� ������ ���������� */
		function endDungeon(reason, info) {
			if (!end) {
				end = true;
				console.log(reason, info);
				showStats();
				if (info == 'break') {
					setProgress('Dungeon stoped: ������� ' + dungeonActivity + '/' + maxDungeonActivity +
						"\r\n�������� ����� � �������� ����!", false, hideProgress);
				} else {
					setProgress('Dungeon completed: ������� ' + dungeonActivity + '/' + maxDungeonActivity, false, hideProgress);
				}
				setTimeout(cheats.refreshGame, 1000);
				resolve();
			}
		}
	}

          //  �������� ������ ��������:
(async () => {

            let msg ="";

            //������� �������� � �������
            const matreshkaId = [/*92,*/149,167,176,184,185,186,187,188,189,190,219,301,302,304,306,315,322,331,397,400,402,403];
            const sundukiId = [46,76,78,144,153,207,208,209,210,211,215,225,269,271,272,326,362,363,364,365,366,367,369,370,371,372,373,374,398,414,415,416,417,421,422];
            const izumrudMatreshka = [340,341,342,343,344,345];
            let boxId = 0;
            let newCount = 0;
            let allCount = 0;
            let starMoneyStart =await Send({"calls":[{"name":"userGetInfo","args":{},"ident":"body"}]}).then(e => e.results[0].result.response.starMoney);
            for (let i = 1; i<=4; i++){
                setProgress("������ #" + i, false);
                let consumable = await Send({"calls":[{"name":"inventoryGet","args":{},"ident":"body"}]}).then(e => e.results[0].result.response.consumable);
                for (let id in consumable){
                    boxId = Number(id);
                    newCount = consumable[boxId];
                    //��������
                    if (matreshkaId.includes(Number(id))){
                        let cycle = true;
                        while(cycle){
                            allCount += newCount;
                            if (newCount == 0){
                                cycle = false;
                                break;
                            }
                            let resultOpeningBoxes = await Send({"calls":[{"name":"consumableUseLootBox","args":{"libId":boxId,"amount":newCount},"ident":"body"}]}).then(e => e.results[0].result.response);
                            newCount = 0;
                            for (let n of resultOpeningBoxes){
                                if (n?.consumable && n.consumable[boxId]){
                                    newCount += n.consumable[boxId];
                                    }
                            }
                        }
                    }
                    //����������� �������
                    if(sundukiId.includes(Number(id))){
                        allCount += newCount;
                        await Send({"calls": [{"name":"consumableUseLootBox","args":{"libId":boxId,"amount":newCount},"ident":"body"}]});
                    }
                    //���������� ��������
                    if(izumrudMatreshka.includes(Number(id))){
                        let cycle = true;
                        while(cycle){
                            allCount += newCount;
                            if (newCount == 0){
                                cycle = false;
                                break;
                            }
                            let openingResult = await Send({"calls": [{"name":"consumableUseLootBox","args":{"libId":boxId,"amount":newCount},"ident":"body"}]}).then(e => e.results[0].result.response);
                            console.log("������� "+boxId+ " ����������: " +newCount);
                            newCount = 0;
                            boxId+=1;
                            for (let n of openingResult){
                                if (n?.consumable && n.consumable[boxId]){
                                    newCount += n.consumable[boxId];
                                }
                            }
                        }
                    }
                }
            }
            let starMoneyEnd =await Send({"calls":[{"name":"userGetInfo","args":{},"ident":"body"}]}).then(e => e.results[0].result.response.starMoney);
            if((starMoneyEnd-starMoneyStart)>0){
                msg = "������� �������� � ��������: "+allCount+ " ��������� ���������: "+ (starMoneyEnd-starMoneyStart);
            }
            else{
                msg +="������� �������� � ��������: "+allCount;
            }
setProgress(msg, false);
})();

 //���� �������� ����� ������ �������������
function absGift() {
//if (!AUTO_NEW_YEAR_GIFT) return;
//console.log('absGift() called...');
const MyKeys = ['6f1d9c42da42922a0ed104b85ba6a0f9', 'J92QCU3qsu', 'Wx4XN2w43D', '1111111', '1111111', '1111111'];

for (const key of MyKeys)
send({ calls: [{ name: "registration", args: { giftId:key, user: { referrer: {} } },
context: { actionTs: Math.floor(performance.now()), cookie: window?.NXAppInfo?.session_id || null }, ident: "body" }] });
}

/**
     * ��������� ������ �� �������� �� ������
     * @param {Array} missions [{id: 25, times: 3}, {id: 45, times: 30}]
     * @param {Boolean} isRaids ��������� ������ ������
     * @returns
     */
    function testCompany(missions, isRaids = false) {
        return new Promise((resolve, reject) => {
            const tower = new execute�ompany(resolve, reject);
            tower.start(missions, isRaids);
        });
    }

    /** ���������� ������ �������� */
    function execute�ompany(resolve, reject) {
        /**
         * {id: 0, times: 3}
         */
        missionsIds = [];
        currentNum = 0;
        isRaid = false;
        currentTimes = 0;


        argsMission = {
            id: 0,
            heroes: [],
            favor: {}
        }

        callsExecute�ompany = {
            calls: [{
                name: "teamGetAll",
                args: {},
                ident: "teamGetAll"
            }, {
                name: "teamGetFavor",
                args: {},
                ident: "teamGetFavor"
            }]
        }

        this.start = function (missionIds, isRaids) {
            missionsIds = missionIds;
            isRaid = isRaids;
            send(JSON.stringify(callsExecute�ompany), startCompany);
        }

        function startCompany(data) {
            res = data.results;
            teamGetAll = res[0].result.response;
            teamGetFavor = res[1].result.response;

            argsMission.heroes = teamGetAll.mission.filter(id => id < 6000);
            argsMission.favor = teamGetFavor.mission;

            pet = teamGetAll.mission.filter(id => id >= 6000).pop();
            if (pet) {
                argsMission.pet = pet;
            }

            checkStat();
        }

        function checkStat() {
            if (!missionsIds[currentNum].times) {
                currentNum++;
            }

            if (currentNum == missionsIds.length) {
                end�ompany('EndCompany');
                return;
            }

            argsMission.id = missionsIds[currentNum].id;
            currentTimes = missionsIds[currentNum].times;
            setProgress('�ompany: ' + argsMission.id + ' - ' + currentTimes, false);
            if (isRaid) {
                missionRaid();
            } else {
                missionStart();
            }
        }

        function missionRaid() {
            const missionRaidCall = {
                calls: [{
                    name: "missionRaid",
                    args: {
                        id: argsMission.id,
                        times: currentTimes
                    },
                    ident: "body"
                }]
            }

            send(JSON.stringify(missionRaidCall), raidResult);
        }

        function raidResult(e) {
            try {
                if (e['error']) {
                    console.warn(e['error']);
                }
                const r = e.results[0].result.response;
                if (r['error']) {
                    console.warn(r['error']);
                }
            } catch (error) {
                console.warn(error);
            }

            missionsIds[currentNum].times = 0;
            checkStat();
        }

        function missionStart() {
            missionStartCall = {
                calls: [{
                    name: "missionStart",
                    args: argsMission,
                    ident: "body"
                }]
            }
            lastMissionBattleStart = Date.now();
            send(JSON.stringify(missionStartCall), missionResult);
        }

        function missionResult(e) {
            if (e['error']) {
                end�ompany('missionStartError', e['error']);
                return;
            }

            BattleCalc(e.results[0].result.response, 'get_tower', missionEnd);
        }

        async function missionEnd(r) {
            /** missionTimer */
            let timer = r.battleTimer;
            //const period = Math.ceil((Date.now() - lastMissionBattleStart) / 1000);
            //console.log(r, timer, period);
            //if (period < timer) {
                //timer = timer - period;
                await countdownTimer(timer, '�ompany: ' + argsMission.id + ' - ' + currentTimes);
            //}

            missionEndCall = {
                calls: [{
                    name: "missionEnd",
                    args: {
                        id: argsMission.id,
                        result: r.result,
                        progress: r.progress
                    },
                    ident: "body"
                }]
            }

            SendRequest(JSON.stringify(missionEndCall), battleResult);
        }

        async function battleResult(e) {
            if (e['error']) {
                end�ompany('missionEndError', e['error']);
                return;
            }
            r = e.results[0].result.response;
            if (r['error']) {
                end�ompany('missionEndError', e['error']);
                return;
            }

            missionsIds[currentNum].times--;
            checkStat();
        }

        function end�ompany(reason, info) {
            setProgress('�ompany completed!', true);
            console.log(reason, info);
            resolve();
        }
    }
})();
/**
 * TODO:
 * ��������� ���� ������� ��� ����� ���� ������ (����� �� ������� � �� ����) +-
 * ��������� �� ����� �������
 * ������ ������ ������ ������� � ������� ���� ���� �� ����� �� 7 �����
 * �������� ������ �� Esc
 * �������� ������ ������� �� ������ ������� ���� 10 +-
 * �������������� ����������� ���������� ������ ������
 */
