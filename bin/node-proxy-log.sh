#!/bin/sh


mkdir -p logs
mkdir -p logs/old
mkdir -p logs/prev

mv logs/prev/*.log logs/old
mv logs/*.log logs/prev

LOG=logs/`date +%Y-%m-%d--%H:%M:%S`.log

ulimit -n 10000
node index.js 2>&1 | tee $LOG
