#!/bin/sh

grep with.transaction | awk '{print $NF}' | cut -d. -f1
