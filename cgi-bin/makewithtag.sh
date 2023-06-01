#@echo off
#setlocal enabledelayedexpansion
#cd %~dp0
#for ${i} in *.xml;do
   #echo ${i} execution.
perl xmltowithtag_alto.pl $1
#)
