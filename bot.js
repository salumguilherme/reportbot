/**
 * Private Report Bot - by gg334
 *
 * This Report Bot will automatically fetch your match ID
 * even if you are in the middle of the match, no share code required
 *
 * Ensure that your steam accounts in accounts.txt are not banned,
 * not logged in elsewhere and they must have CSGO itself.
 *
 * If you are timing out enable verbose = true; to see debug information.
 *
 * @version 1.0b
 * @author gg334
 * @created 2017-03-18
 * @modified 2017-03-19
 */
 
 
////////////
// Essential
var fs = require("fs"),
	Steam = require("steam"),
    SteamID = require("steamid"),
	CSGOCli = require("csgo"),
	ReadlineSync = require("readline-sync"),
	Protos = require("./protos/protos.js"),
	Long = require("long"),
	Process = require("process"),
	colors = require("colors");
	
if(typeof process.argv[2] != 'undefined' && process.argv[2] == 'debug')
	console.log(process.argv[2]);
	
//////////////////
// Change These
var ScriptTimeout = 45000; 				// Script timeout in milliseconds - 45000 = 45 seconds
	
// Stores our SteamClients once connected
// so we can disconnect them on timeout
var SteamClients = {};

// Defines some variables here so they
// are available to all functions
var CountReports = 0,
	ClientHello = 4006,
	ClientWelcome = 4004,
	BotAccounts = get_bot_accounts(),
	ReportsProcessed = [],
	MatchID;
	
// Grabs the steamID and potentially sharecode
// Use steamid https://steamid.xyz if necessary
var ReportingID = ReadlineSync.question("[str]".green.bold+" SteamID64 of the account being reported: "),
	MatchShareCode = ReadlineSync.question("[str]".green.bold+" Match Sharecode - Leave blank if the account being reported is in game: ");
	
// Validates the steam id being reported
var _check_reporting_id = new SteamID(ReportingID);

// Invalid reporting id provided
if(!_check_reporting_id || typeof _check_reporting_id.accountid == 'undefined' || _check_reporting_id.accountid.length == 0) {
	
	console.log('[err]'.red.bold+' Invalid SteamID64 provided for account being reported. Please double check. Process will now exit.');
	Process.exit();
	
}

v_log("Checking match share code.");
	
/////////////////////////////////////////////////////////////////////////////////////////////////

	// If no sharecode provided let's try and grab from our steam ID current live match
	if(!MatchShareCode || MatchShareCode == '') {
		
		v_log("MatchShareCode not provided. Checking reporters steamID.");
		
		v_log("Calling our get_live_match_id function");
		
		// Calls the function to grab the live match ID - report bot is called from there
		get_live_match_id();
		
	} else {
		
		v_log("MatchShareCode provided. Fetching match ID from match share code.");
		
		// Gets the match ID from share code - the report bot is called from within the function
		get_match_id();
		
	}
	
	// Sets our script timeout
	setTimeout(function() {
		
		// Message
		console.log('Timeout reached. Checking reports progress.'.underline);
		
		// Lets loop each account and check if the report for each one has been processed
		for(var account_index = 0; account_index < BotAccounts.length; account_index++) {
			
			// Checks if this account_index is within our reports processed array
			if(ReportsProcessed.indexOf(account_index) === -1) {
				
				// Let the user know this report was not processed
				console.log('[err]'.red.bold+' Report bot "'+BotAccounts[account_index].username+'" timed out. Disconnecting Steam Client.');
				
				// Ensures the steamclient is set as well to avoid errors
				if(typeof SteamClients[account_index] != 'undefined')
					SteamClients[account_index].disconnect();
				
			}
			
		}
		
		v_log("Check done. Exiting script.");
		
		// Our process is done. Exit it.
		Process.exit();
		
	}, ScriptTimeout);
	
	/**
	 * Gets the match ID from the match share code and calls the report bot
	 *
	 * @return void
	 */
	function get_match_id() {
	
		// Vars
		var steam_client = new Steam.SteamClient(),
			steam_user = new Steam.SteamUser(steam_client),
			steam_gc = new Steam.SteamGameCoordinator(steam_client, 730),
			csgo = new CSGOCli.CSGOClient(steam_user, steam_gc, false);
			
		v_log("Cleaning up match share code to remove steam URL. MatchShareCode "+MatchShareCode);
			
		// Strips our the steam bits from our sharecode
		// CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
		MatchShareCode = MatchShareCode.match(/(CSGO-[\da-zA-Z-]+)$/g).shift();
		
		v_log("ShareCode cleaned up, calling our decoder. Cleaned MatchShareCode: "+MatchShareCodeCode);
		
		// Decodes share code
		var sc_decoder = new CSGOCli.SharecodeDecoder(MatchShareCode);
		
		v_log("Decoder Object: ", sc_decoder);
		
		// No match ID found
		if(sc_decoder.decode().matchId == null || typeof sc_decoder.decode().matchId == 'undefined' || sc_decoder.decode().matchId.length == 0) {
			
			// Messsage and exit
			console.log("[err]".red.bold+" Unable to grab match ID from share code provided. Please check share code and try again. The script will now exit.");
			Process.exit();
			
		}
		
		// Sets our MatchID
		MatchID = sc_decoder.decode().matchId;
		
		v_log("MatchID: "+MatchID);
		
		// Calls our report bot
		report_bot();
		
	}
	
	/**
	 * Grabs the match ID from the users live match.
	 * 
	 * @return void
	 */
	function get_live_match_id() {
		
		// Vars
		var steam_client = new Steam.SteamClient(),
			steam_user = new Steam.SteamUser(steam_client),
			steam_gc = new Steam.SteamGameCoordinator(steam_client, 730),
			csgo = new CSGOCli.CSGOClient(steam_user, steam_gc, false);
		
		v_log("Connecting our steam client to fetch match id from live match.");
		
		// Connects our steam client
		steam_client.connect();
		
		// Client connected
		steam_client.on('connected', function() {
			
			v_log("Steam client connected. Logging bot account "+BotAccounts[0].username+" to get live match id");
			
			// Log steam user on - jut use the first bot account available
			steam_user.logOn({
				
				account_name: 	BotAccounts[0].username,
				password: 		BotAccounts[0].password
				
			});
			
		});
		
		// Logon response
		steam_client.on('logOnResponse', function(response) {
			
			v_log("Log on response for '"+BotAccounts[0].username+"' : ", response);
			
			// Failed to login
			if(response.eresult !== Steam.EResult.OK) {
				
				console.log('[err]'.red.bold+' Login for '+BotAccounts[0].username+' failed - Unable to fetch live match ID. Steam client will disconnect and this script will terminate.');
				steam_client.disconnect();
				Process.exit();
				return;
			
			}
			
			// Launches csgo
			csgo.launch();
			
			// Event listener - our csgo has been launched
			csgo.on('ready', function() {
				
				v_log("Successfully launched CSGO to fetch live game for user. Calling requestLiveGameForUser now.");
				
				// Requests our live game for the user steam id
				csgo.requestLiveGameForUser(ReportingID);
				
				// Event listener to when we fetch the matchList
				csgo.on("matchList", function(list) {
					
					v_log("matchList Received from requestLiveMatchForUser, response below:", list);
					
					// Nothing found
					if(typeof list.matches[0].matchid == 'undefined') {
						
						// Could not find match id
						console.log('[err]'.red.bold+' Failed to fetch live match ID. The script will not continue.');
						steam_client.disconnect();
						Process.exit();
						return;
						
					}
					
					// Converts our match ID to a string and stores it in the variable
					MatchID = list.matches[0].matchid.toString();
					
					v_log("MatchID: "+MatchID);
					
					report_bot();
					
				});
				
			});
			
			// Something happend and steam client could not connect
			steam_client.on('error', function(error) {
				
				console.log('[err]'.red.bold+' Steam Client failed to connect. Error to follow. The script will not continue.');
				console.log(error);
				steam_client.disconnect();
				Process.exit();
				return;
				
			});
			
		});
		
	}
	
	/**
	 * Loops our bot accounts and calls the report for each one.
	 * 
	 * @return void
	 */
	function report_bot() {
		
		// Loops our account array
		for(account_index in BotAccounts) {
			
			v_log("Starting report process for bot account '"+BotAccounts[account_index]+"'. Account Index: "+account_index);
			
			// Processes the report for this account
			process_steam_report(BotAccounts[account_index], account_index);
			
		}
		
	}
	
	/**
	 * Processes the report for a single bot account.
	 * 
	 * @param object this_account
	 * @param int account_index
	 * @return void
	 */
	function process_steam_report(this_account, account_index) {
		
		// Vars
		var steam_client = new Steam.SteamClient(),
			steam_user = new Steam.SteamUser(steam_client),
			steam_gc = new Steam.SteamGameCoordinator(steam_client, 730),
			steam_friends = new Steam.SteamFriends(steam_client),
			steam_gc_interval;
			
		// Connects to steam
		steam_client.connect();
		
		// Event listener - we're connected
		steam_client.on("connected", function() {
			
			v_log("Successfully connected steam client for bot account '"+this_account.username+"'. Logging on...");
			
			// Logs in the bot account
			steam_user.logOn({
				
				account_name: 	this_account.username,
				password:		this_account.password
				
			});
			
		});
		
		// Event listener - log on response from above
		steam_client.on("logOnResponse", function(response) {
			
			// Login failed
			if(response.eresult !== Steam.EResult.OK) {
				
				// Message and disconnect
				console.log('[err]'.red.bold+' Failed logging in with bot account "'+this_account.username+'". Disconnecting steam client.');
				steam_client.disconnect();
				return;
				
			}
			
			v_log("Log on response for bot account "+this_account.username+" successfull.");
			
			v_log("Setting chat status to Online for bot account '"+this_account.username+"'.");
		
			// Sets our chat status to online - maybe to look more legitimate - I believe this wouldn't matter much
			steam_friends.setPersonaState(Steam.EPersonaState.Online);
			
			v_log("Setting CSGO as game played for bot account '"+this_account.username+"'");
			
			// Sets CSGO as the game being played
			steam_user.gamesPlayed({
				
				games_played: [{
					
					game_id: 	730
					
				}]
				
			});
			
			// Ensures we have the game coordinator object
			if(!steam_gc) {
				
				// Messages and disconnects this account
				console.log('[err]'.red.bold+' Steam game coordinator unavailable for bot account "'+this_account.username+'". Disconnecting steam client for this account.');
				steam_client.disconnect();
				return;
				
			}
			
			v_log("Creating interval for game coordinator for bot account '"+this_account.username+"'");
			
			// Sets an interval where we will send the hello message every 2 seconds until we get a welcome response
			steam_gc_interval = setInterval(function() {
				
				v_log("Sending steam game coordinator ClientHello message for bot account '"+this_account.username+"'");
				
				// Sends client hello message
				steam_gc.send({
					
					msg: 		ClientHello,
					proto: 		{}
					
				}, new Protos.CMsgClientHello({}).toBuffer());
				
			}, 2000);
			
		});
		
		// Adds our game coordinator event listeners
		steam_gc.on("message", function(header, buffer, callback) {
			
			// Client welcome message
			if(header.msg == ClientWelcome) {
				
				v_log("Welcome message received for steam coordinator bot account '"+this_account.username+"'");
				
				// Clears our interval to stop further hello messages
				clearInterval(steam_gc_interval);
				
				v_log("Sending report message for bot account '"+this_account.username+"'");
				
				// Processes our report
				send_report(steam_gc, steam_client);
				
			} else if(header.msg == Protos.ECsgoGCMsg.k_EMsgGCCStrike15_v2_ClientReportResponse) {
				
				// Counts this as processed
				CountReports++;
				
				// Response from our report - logs it to the user
				console.log("[ok]".bold.underline+" [bot "+this_account.username.substr(0, 5)+"***] ["+CountReports+" of "+BotAccounts.length+"] [SteamID64 "+ReportingID+"] [Confirmation ID  "+Protos.CMsgGCCStrike15_v2_ClientReportResponse.decode(buffer).confirmationId.toString()+"]");
				
				// Pushes it to our processed reports array for timeouts debug
				ReportsProcessed.push(account_index);
			
				// Disconnects steam client - report processed
				steam_client.disconnect();
				
			} else {
				
				v_log("Mixed response receive from game coordinator for bot account '"+this_account.username+"'. Reponse to follow", header);
				
			}
			
		});
		
		// Error connecting steam clinet
		steam_client.on("error", function(error) {
			
			// Logs it to the user and skips
			console.log('[err]'.red.bold+' Unable to connect steam client for bot account "". Error to follow.');
			console.log(error);
			
		});
				
		// Adds it to our steam clients array so we can disconnect it in case of timeouts
		SteamClients[account_index] = steam_client;
		
	}
	
	/**
	 * Gets bot accounts from our txt file.
	 * 
	 * @return array
	 */
	function get_bot_accounts() {
		
		// Array to be populated and returned and our array of username and password combinations
		var accounts = [],
			accounts_text_array = fs.readFileSync("accounts.txt").toString().split("\n");
			
		v_log("Grabbing accounts text from file accounts.txt");
			
		// Loops each line and grabs the username and password
		for(account_index in accounts_text_array) {
			
			v_log("Processing credentials "+account_index+" : "+accounts_text_array[account_index].toString().trim());
			
			// Splits the combination
			var credentials = accounts_text_array[account_index].toString().trim().split(":"),
				username = credentials[0].trim(),
				password = (typeof credentials[1] != 'undefined') ? credentials[1].trim() : '';
				
			v_log("Credentials '"+account_index+"' processed. Username: '"+username+"' - Password: '"+password+"'");
			
			// Verifies username and password before adding to our account array
			if(username.length > 0 && password.length > 0 && username.indexOf('#') !== 0) {
				
				// Pushes an object with the credentials to our accounts array
				accounts.push({
					
					username: 	username,
					password: 	password
					
				});
				
			} else {
				
				v_log("Credentials '"+account_index+"' invalid. Username: '"+username+"' - Password: '"+password+"'");
				
			}
			
		}
		
		// Checks our accounts aren't empty
		if(accounts.length == 0) {
			
			// Messages and goes out
			console.log('[err]'.red.bold+' Could not find any valid username and password combination in your accounts.txt file. Lines beginning with # are ignored. Use format username:password. The script will not continue.');
			Process.exit();
			
		}
		
		// Returns our array
		return accounts;
		
	}
	
	/**
	 * Actually sends the report.
	 * 
	 * @param object steam_gc
	 * @param object steam_client
	 * @return void
	 */
	function send_report(steam_gc, steam_client) {
		
		// Sends the report via the game coordinator
		steam_gc.send({
			
			msg: 			Protos.ECsgoGCMsg.k_EMsgGCCStrike15_v2_ClientReportPlayer,
			proto: 			{}
			
		}, new Protos.CMsgGCCStrike15_v2_ClientReportPlayer({
			
			accountId: 		new SteamID(ReportingID).accountid,
			matchId: 		MatchID,
			rptAimbot: 		2,
			rptWallhack: 	3 // Can we not report for speed hack etc? sounds wasteful to me
			
		}).toBuffer());
		
	}
	
	/**
	 * Verbose debug message.
	 * 
	 * @param string message
	 * @param mixed obj
	 * @return void
	 */
	function v_log(message, obj) {
		
		if(typeof process.argv[2] == 'undefined' || process.argv[2] != 'debug')
			return;
		
		console.log("[log]".cyan.bold+" "+message);
		
		if(typeof obj !== null && typeof obj != 'undefined') {
			
			console.log(obj);
			
		}
		
	}
	
	// If verbose
	if(typeof process.argv[2] != 'undefined' && process.argv[2] == 'debug') {
		
		// Uncaught exceptions - verbose only
		Process.on("uncaughtException", function(error) {
			
			console.log('[err]'.red.bold+' Uncaught Exception. Error: '+error);
			
		});
		
	}