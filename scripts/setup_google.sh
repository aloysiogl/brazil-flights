#!/usr/bin/env bash

if [ $(uname -s) == Linux ];
# Linux
then
    echo '\n export GOOGLE_APPLICATION_CREDENTIALS='$(pwd)/../$(basename "service_account.json") >> ~/.bashrc
# MAC OS X
elif [ "$(uname -s)" == "Darwin" ]; then
    echo '\n export GOOGLE_APPLICATION_CREDENTIALS='$(pwd)/../$(basename "service_account.json") >> ~/.bash_profile
fi

