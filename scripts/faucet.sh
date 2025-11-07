#!/bin/sh
if [ $# -lt 1 ]
then
   echo "$0: Need address!"
   exit 1
fi

curl -v "https://liquidtestnet.com/faucet?address=$1&action=lbtc"
