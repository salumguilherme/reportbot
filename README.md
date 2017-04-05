# CSGO Reportbot
This nodejs reportbot has been rewritten from the ground up to support live on-going matches.

## What you will need
- 10 Steam accounts with CS:GO (they'll get 11 reports if you also report in game)
- You can buy cheap csgo accounts via CD keys etc for about $6-7 each
- NodeJS and Git installed

## Limitations
- You can only report one account every 6 hours (Steam API limitation)

## What I will cover here
- I will not cover installing nodejs, you can find thousands of tutorials online. Personally I have an AWS account with a Free tier EC2 instance that I connect via ssh and do my reporting from there. You can install on your local machine as well.
- I will cover downloading the package from github via ssh, installing the updates and downloading files and executing the script.

## Notes
- You will note that I will not be using `sudo` here. Please do where necessary - I usually just `sudo su -` as soon as I connect to make life easier.

# 1) Downloading the package
Login via ssh and navigate to where you want to download and install your report bot. For all intents and purposes this tutorial was based on a remote server running Ubuntu 14.04 with nodejs and git installed. I've installed my reportbot on /var/reportbot
```
cd /var/reportbot
```
