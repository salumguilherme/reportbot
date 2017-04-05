# CSGO Reportbot
This nodejs reportbot has been rewritten from the ground up to support live on-going matches.

## What you will need
- 10 Steam accounts with CS:GO (they'll get 11 reports if you also report in game)
- The steam accounts must have steam guard disabled.
- You can buy cheap csgo accounts via CD keys etc for about $6-7 each
- NodeJS and Git installed

## Limitations
- You can only report one account every 6 hours (Steam API limitation)

## What I will cover here
- I will not cover installing nodejs, you can find thousands of tutorials online. Personally I have an AWS account with a Free tier EC2 instance that I connect via ssh and do my reporting from there. You can install on your local machine as well.
- I will cover downloading the package from github via ssh, installing the updates and downloading files and executing the script.

## Notes
- You will note that I will not be using `sudo` here. Please do where necessary - I usually just `sudo su -` as soon as I connect to make life easier.
- I'm a mac user - only use windows to play - so change the commands accordingly.
- **Use SteamID64** of the user you are reporting. you can get it from here https://steamid.xyz/
- You can only report once every 6 hours for each account. Valve limitations.


# 1) Installing

## Download the package
Login via ssh and navigate to where you want to download and install your report bot. For all intents and purposes this tutorial was based on a remote server running Ubuntu 14.04 with nodejs and git installed. I've installed my reportbot on /var/reportbot. I want to make this for beginners too so I will go through creating directories etc...
```
cd /var
```
The code above is simply navigating to the directory where w wil be installing our report bot. if you are on loca you might want to do something like cd `~/Users/yourusername/Desktop` to go to your desktop.

Clone the repository into the folder by doing
```
git clone https://github.com/salumguilherme/reportbot.git
```
This will automatically create a directory called reportbot in the folder you currently are. Navigate into the new directory using
```
cd reportbot
```

## Changing your report accounts
Now we need to edit our accounts.txt file and include the accounts we will use to do our reporting. There should be one account per line using the format `username:password`
We can do that by using the nano command
```
nano accounts.txt
```
Type in your accounts and usernames (one per line remember!). To save and exit press `CTRL + X` then `y` then `Enter` to save the changes. You can nano into it again to make sure it's all good. Basically CTRL + X will exit the nano editor, which will then ask you if you want to make changes, type Y for yes and press enter essentially.

## Downloading dependencies
Type in the commands below to download the dependencies
```
npm install
node protos/updater.js
```

# 2) Using the bot
You can use the report in 2 ways - normal mode and debug mode. If you keep timing out try debug mode. To use the report bot just make sure you are in the report bot directory and type command
```
npm start
```
It will ask for the SteamID64 of the account you are reporting (get the steamID64 from here https://steamid.xyz/) and the match share code if the user is not in a match. If they are in a match just press enter.
**If you are reporting for a match currently live, just press enter and the bot will automatically fetch the matchID for you**

To run debug mode use
```
npm start -- debug
```
This mode will give you much more feedback on whats happening in the code.
